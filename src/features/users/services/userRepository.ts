import { db } from "../../../db";
import { normalizeText } from "../../../lib/normalize";
import { toIsoNow } from "../../../lib/dates";
import { createId } from "../../../lib/ids";
import type { UserProfile } from "../../../types";

const LAST_PROFILE_KEY = "lastActiveProfileId";
const MANAGER_PROFILE_KEY = "managerProfileId";

export type CreateProfileResult =
  | {
      status: "created";
      profile: UserProfile;
    }
  | {
      status: "duplicate";
      profile: UserProfile;
    };

export type UpdateProfileResult =
  | {
      status: "updated";
      profile: UserProfile;
    }
  | {
      status: "duplicate";
      profile: UserProfile;
    }
  | {
      status: "not_found";
    };

export type DeleteProfileResult =
  | {
      status: "deleted";
    }
  | {
      status: "blocked_active_profile";
    }
  | {
      status: "not_found";
    };

export const normalizeProfileName = (displayName: string) => normalizeText(displayName);

export const getManagerProfileId = async () =>
  (await db.appSettings.get(MANAGER_PROFILE_KEY))?.value;

export const setManagerProfile = (profileId: string) =>
  db.appSettings.put({ key: MANAGER_PROFILE_KEY, value: profileId });

export const isProfileManager = async (
  profile?: Pick<UserProfile, "id"> | null
): Promise<boolean> => {
  if (!profile) return false;
  const managerId = await getManagerProfileId();
  return managerId === profile.id;
};

export const findProfileByNormalizedName = async (displayName: string) =>
  db.userProfiles.where("normalizedDisplayName").equals(normalizeProfileName(displayName)).first();

export const createProfile = async (displayName: string): Promise<CreateProfileResult> => {
  const trimmedDisplayName = displayName.trim();
  const normalizedDisplayName = normalizeProfileName(trimmedDisplayName);
  const existingProfile = await findProfileByNormalizedName(trimmedDisplayName);

  if (existingProfile) {
    return {
      status: "duplicate",
      profile: existingProfile
    };
  }

  const now = toIsoNow();
  const profile: UserProfile = {
    id: createId(),
    displayName: trimmedDisplayName,
    normalizedDisplayName,
    createdAt: now,
    updatedAt: now
  };

  await db.userProfiles.add(profile);
  await db.appSettings.put({ key: LAST_PROFILE_KEY, value: profile.id });

  // First profile created becomes the manager
  const existingManager = await getManagerProfileId();
  if (!existingManager) {
    await setManagerProfile(profile.id);
  }

  return {
    status: "created",
    profile
  };
};

export const updateProfileDisplayName = async (
  profileId: string,
  displayName: string
): Promise<UpdateProfileResult> => {
  const profile = await db.userProfiles.get(profileId);
  if (!profile) {
    return { status: "not_found" };
  }

  const trimmedDisplayName = displayName.trim();
  const normalizedDisplayName = normalizeProfileName(trimmedDisplayName);
  const existingProfile = await db.userProfiles.where("normalizedDisplayName").equals(normalizedDisplayName).first();

  if (existingProfile && existingProfile.id !== profileId) {
    return {
      status: "duplicate",
      profile: existingProfile
    };
  }

  const updatedProfile: UserProfile = {
    ...profile,
    displayName: trimmedDisplayName,
    normalizedDisplayName,
    updatedAt: toIsoNow()
  };

  await db.userProfiles.put(updatedProfile);

  return {
    status: "updated",
    profile: updatedProfile
  };
};

export const deleteProfile = async (profileId: string): Promise<DeleteProfileResult> => {
  const profile = await db.userProfiles.get(profileId);
  if (!profile) {
    return { status: "not_found" };
  }

  const lastActiveProfileId = await getLastActiveProfileId();
  if (lastActiveProfileId === profileId) {
    return { status: "blocked_active_profile" };
  }

  await db.transaction(
    "rw",
    db.userProfiles,
    db.workoutSessions,
    db.sessionExercises,
    db.setEntries,
    async () => {
      const linkedSessions = await db.workoutSessions.where("userId").equals(profileId).toArray();
      const linkedSessionIds = linkedSessions.map((session) => session.id);
      const linkedSessionExercises = await db.sessionExercises
        .where("sessionId")
        .anyOf(linkedSessionIds)
        .toArray();
      const linkedExerciseIds = linkedSessionExercises.map((item) => item.id);
      const linkedSetEntries = await db.setEntries
        .where("sessionExerciseId")
        .anyOf(linkedExerciseIds)
        .toArray();

      if (linkedSetEntries.length > 0) {
        await db.setEntries.bulkDelete(linkedSetEntries.map((setEntry) => setEntry.id));
      }

      if (linkedSessionExercises.length > 0) {
        await db.sessionExercises.bulkDelete(linkedSessionExercises.map((item) => item.id));
      }

      if (linkedSessions.length > 0) {
        await db.workoutSessions.bulkDelete(linkedSessions.map((session) => session.id));
      }

      await db.userProfiles.delete(profileId);
    }
  );

  return { status: "deleted" };
};

export const getProfileById = (id: string) => db.userProfiles.get(id);

export const getProfiles = () => db.userProfiles.orderBy("displayName").toArray();

export const getLastActiveProfileId = async () => (await db.appSettings.get(LAST_PROFILE_KEY))?.value;

export const setLastActiveProfile = (profileId: string) =>
  db.appSettings.put({ key: LAST_PROFILE_KEY, value: profileId });
