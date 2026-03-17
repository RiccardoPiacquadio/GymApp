import { db } from "../../../db";
import { normalizeText } from "../../../lib/normalize";
import { toIsoNow } from "../../../lib/dates";
import { createId } from "../../../lib/ids";
import type { UserProfile } from "../../../types";

const LAST_PROFILE_KEY = "lastActiveProfileId";

export type CreateProfileResult =
  | {
      status: "created";
      profile: UserProfile;
    }
  | {
      status: "duplicate";
      profile: UserProfile;
    };

export const normalizeProfileName = (displayName: string) => normalizeText(displayName);

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

  return {
    status: "created",
    profile
  };
};

export const getProfileById = (id: string) => db.userProfiles.get(id);

export const getProfiles = () => db.userProfiles.orderBy("displayName").toArray();

export const getLastActiveProfileId = async () => (await db.appSettings.get(LAST_PROFILE_KEY))?.value;

export const setLastActiveProfile = (profileId: string) =>
  db.appSettings.put({ key: LAST_PROFILE_KEY, value: profileId });
