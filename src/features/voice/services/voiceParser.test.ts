import "fake-indexeddb/auto";
import { describe, it, expect, beforeAll } from "vitest";
import { parseVoiceSet, parseMultiSetCommand } from "./voiceParser";
import { seedDatabase } from "../../../db/seed";

// Seed DB once — exercises needed for alias resolution
beforeAll(async () => {
  await seedDatabase();
});

// ---------------------------------------------------------------------------
// Single-set: weight × reps patterns
// ---------------------------------------------------------------------------

describe("parseVoiceSet — weight × reps", () => {
  it("80 per 8", async () => {
    const r = await parseVoiceSet("80 per 8");
    expect(r.weight).toBe(80);
    expect(r.reps).toBe(8);
  });

  it("100 x 5", async () => {
    const r = await parseVoiceSet("100 x 5");
    expect(r.weight).toBe(100);
    expect(r.reps).toBe(5);
  });

  it("60 kg per 12", async () => {
    const r = await parseVoiceSet("60 kg per 12");
    expect(r.weight).toBe(60);
    expect(r.reps).toBe(12);
  });

  it("60 chili per 10", async () => {
    const r = await parseVoiceSet("60 chili per 10");
    expect(r.weight).toBe(60);
    expect(r.reps).toBe(10);
  });

  // NOTE: decimal dots are stripped by normalizeText ("70.5" → "70 5").
  // Italian speech recognition uses "virgola" for decimals, which is handled separately.
  // These tests verify integer weights work correctly.

  it("3 kg per 15", async () => {
    const r = await parseVoiceSet("3 kg per 15");
    expect(r.weight).toBe(3);
    expect(r.reps).toBe(15);
  });
});

// ---------------------------------------------------------------------------
// Italian number words
// ---------------------------------------------------------------------------

describe("parseVoiceSet — Italian number words", () => {
  it("ottanta per otto", async () => {
    const r = await parseVoiceSet("ottanta per otto");
    expect(r.weight).toBe(80);
    expect(r.reps).toBe(8);
  });

  it("cento per dieci", async () => {
    const r = await parseVoiceSet("cento per dieci");
    expect(r.weight).toBe(100);
    expect(r.reps).toBe(10);
  });

  it("sessanta per dodici", async () => {
    const r = await parseVoiceSet("sessanta per dodici");
    expect(r.weight).toBe(60);
    expect(r.reps).toBe(12);
  });

  it("venti per quindici", async () => {
    const r = await parseVoiceSet("venti per quindici");
    expect(r.weight).toBe(20);
    expect(r.reps).toBe(15);
  });

  it("quarantacinque per sei", async () => {
    const r = await parseVoiceSet("quarantacinque per sei");
    expect(r.weight).toBe(45);
    expect(r.reps).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// Exercise recognition
// ---------------------------------------------------------------------------

describe("parseVoiceSet — exercise recognition", () => {
  it("squat 100 per 8", async () => {
    const r = await parseVoiceSet("squat 100 per 8");
    expect(r.canonicalExerciseId).toBeTruthy();
    expect(r.weight).toBe(100);
    expect(r.reps).toBe(8);
  });

  it("panca piana 80 per 8", async () => {
    const r = await parseVoiceSet("panca piana 80 per 8");
    expect(r.canonicalExerciseId).toBeTruthy();
    expect(r.weight).toBe(80);
    expect(r.reps).toBe(8);
  });

  it("bench press 80 per 8", async () => {
    const r = await parseVoiceSet("bench press 80 per 8");
    expect(r.canonicalExerciseId).toBeTruthy();
    expect(r.weight).toBe(80);
    expect(r.reps).toBe(8);
  });

  it("lat machine 50 per 10", async () => {
    const r = await parseVoiceSet("lat machine 50 per 10");
    expect(r.canonicalExerciseId).toBeTruthy();
    expect(r.weight).toBe(50);
    expect(r.reps).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// Set count
// ---------------------------------------------------------------------------

describe("parseVoiceSet — set count", () => {
  it("3 serie da 80 per 8", async () => {
    const r = await parseVoiceSet("3 serie da 80 per 8");
    expect(r.setCount).toBe(3);
    expect(r.weight).toBe(80);
    expect(r.reps).toBe(8);
  });

  it("2 set 60 per 10", async () => {
    const r = await parseVoiceSet("2 set 60 per 10");
    expect(r.setCount).toBe(2);
    expect(r.weight).toBe(60);
    expect(r.reps).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// Set number (ordinal)
// ---------------------------------------------------------------------------

describe("parseVoiceSet — set number / ordinal", () => {
  it("seconda 80 per 8", async () => {
    const r = await parseVoiceSet("seconda 80 per 8");
    expect(r.setNumber).toBe(2);
    expect(r.weight).toBe(80);
    expect(r.reps).toBe(8);
  });

  it("terza 75 per 6", async () => {
    const r = await parseVoiceSet("terza 75 per 6");
    expect(r.setNumber).toBe(3);
    expect(r.weight).toBe(75);
    expect(r.reps).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// Multi-set parsing
// ---------------------------------------------------------------------------

describe("parseMultiSetCommand — multiple sets", () => {
  it("squat 70 per 8, 50 per 7, 90 per 5", async () => {
    const r = await parseMultiSetCommand("squat 70 per 8, 50 per 7, 90 per 5");
    expect(r).not.toBeNull();
    expect(r!.entries).toHaveLength(3);
    expect(r!.entries[0]).toEqual({ weight: 70, reps: 8 });
    expect(r!.entries[1]).toEqual({ weight: 50, reps: 7 });
    expect(r!.entries[2]).toEqual({ weight: 90, reps: 5 });
    expect(r!.canonicalExerciseId).toBeTruthy();
  });

  it("70 per 8 poi 50 per 7 poi 90 per 5", async () => {
    const r = await parseMultiSetCommand("70 per 8 poi 50 per 7 poi 90 per 5");
    expect(r).not.toBeNull();
    expect(r!.entries).toHaveLength(3);
    expect(r!.entries[0]).toEqual({ weight: 70, reps: 8 });
    expect(r!.entries[1]).toEqual({ weight: 50, reps: 7 });
    expect(r!.entries[2]).toEqual({ weight: 90, reps: 5 });
  });

  it("80 per 8, 7, 5 — reps-only shorthand with shared weight", async () => {
    const r = await parseMultiSetCommand("80 per 8, 7, 5");
    expect(r).not.toBeNull();
    expect(r!.entries).toHaveLength(3);
    expect(r!.entries[0]).toEqual({ weight: 80, reps: 8 });
    expect(r!.entries[1]).toEqual({ weight: 80, reps: 7 });
    expect(r!.entries[2]).toEqual({ weight: 80, reps: 5 });
  });

  it("single set returns null", async () => {
    const r = await parseMultiSetCommand("80 per 8");
    expect(r).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("parseVoiceSet — edge cases", () => {
  it("empty string", async () => {
    const r = await parseVoiceSet("");
    expect(r.isValid).toBe(false);
  });

  it("just an exercise name, no numbers", async () => {
    const r = await parseVoiceSet("squat");
    expect(r.canonicalExerciseId).toBeTruthy();
    expect(r.weight).toBeUndefined();
    expect(r.reps).toBeUndefined();
  });

  it("just a number", async () => {
    const r = await parseVoiceSet("80");
    expect(r.isValid).toBe(false);
  });
});
