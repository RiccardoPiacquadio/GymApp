import { db } from "../../../db";
import { toIsoNow } from "../../../lib/dates";
import { createId } from "../../../lib/ids";
import type { UserProfile } from "../../../types";

const LAST_PROFILE_KEY = "lastActiveProfileId";

export const createProfile = async (displayName: string) => {
  const now = toIsoNow();
  const profile: UserProfile = {
    id: createId(),
    displayName: displayName.trim(),
    createdAt: now,
    updatedAt: now
  };

  await db.userProfiles.add(profile);
  await db.appSettings.put({ key: LAST_PROFILE_KEY, value: profile.id });
  return profile;
};

export const getProfileById = (id: string) => db.userProfiles.get(id);

export const getProfiles = () => db.userProfiles.orderBy("displayName").toArray();

export const getLastActiveProfileId = async () => (await db.appSettings.get(LAST_PROFILE_KEY))?.value;

export const setLastActiveProfile = (profileId: string) =>
  db.appSettings.put({ key: LAST_PROFILE_KEY, value: profileId });
