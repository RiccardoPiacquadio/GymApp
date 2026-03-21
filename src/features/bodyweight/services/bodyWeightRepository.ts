import { db } from "../../../db";
import { createId } from "../../../lib/ids";
import { toIsoNow } from "../../../lib/dates";
import type { BodyWeightEntry } from "../../../types";

export const addBodyWeightEntry = async (userId: string, weight: number, date?: string) => {
  const entry: BodyWeightEntry = {
    id: createId(),
    userId,
    weight,
    date: date ?? new Date().toISOString().slice(0, 10),
    createdAt: toIsoNow()
  };
  await db.bodyWeightEntries.add(entry);
  return entry;
};

export const getBodyWeightEntries = (userId: string) =>
  db.bodyWeightEntries.where("userId").equals(userId).sortBy("date");

export const deleteBodyWeightEntry = (id: string) =>
  db.bodyWeightEntries.delete(id);

export const getLatestBodyWeight = async (userId: string) => {
  const entries = await db.bodyWeightEntries
    .where("userId")
    .equals(userId)
    .sortBy("date");
  return entries[entries.length - 1];
};
