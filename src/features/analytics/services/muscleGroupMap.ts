/** Static mapping from exercise slug -> muscle group label (Italian). */
export type MuscleGroup = "Petto" | "Spalle" | "Schiena" | "Tricipiti" | "Bicipiti" | "Gambe" | "Addome" | "Altro";

export const MUSCLE_GROUPS: MuscleGroup[] = [
  "Petto",
  "Spalle",
  "Schiena",
  "Bicipiti",
  "Tricipiti",
  "Gambe",
  "Addome"
];

const map: Record<string, MuscleGroup> = {
  barbell_bench_press: "Petto",
  dumbbell_bench_press: "Petto",
  incline_barbell_bench_press: "Petto",
  incline_dumbbell_bench_press: "Petto",
  incline_smith_machine_bench_press: "Petto",
  close_grip_bench_press: "Petto",
  chest_press: "Petto",
  cable_crossover: "Petto",
  push_up: "Petto",
  dip: "Petto",

  barbell_military_press: "Spalle",
  dumbbell_shoulder_press: "Spalle",
  smith_machine_military_press: "Spalle",
  lateral_raise: "Spalle",
  cable_lateral_raise: "Spalle",
  rear_delts: "Spalle",
  face_pull: "Spalle",

  pull_up: "Schiena",
  chin_up: "Schiena",
  lat_pulldown: "Schiena",
  seated_cable_row: "Schiena",
  t_bar_row: "Schiena",
  one_arm_dumbbell_row: "Schiena",
  barbell_row: "Schiena",
  chest_supported_row: "Schiena",
  barbell_shrug: "Schiena",
  dumbbell_shrug: "Schiena",

  barbell_curl: "Bicipiti",
  dumbbell_curl: "Bicipiti",
  hammer_curl: "Bicipiti",
  spider_curl: "Bicipiti",
  biceps_cable_high: "Bicipiti",
  biceps_cable_low: "Bicipiti",

  lying_triceps_extension: "Tricipiti",
  skull_crusher: "Tricipiti",
  triceps_cable_high: "Tricipiti",
  triceps_pushdown: "Tricipiti",

  back_squat: "Gambe",
  bulgarian_split_squat: "Gambe",
  leg_press: "Gambe",
  leg_extension: "Gambe",
  leg_curl: "Gambe",
  hip_thrust: "Gambe",
  calf_raise: "Gambe",
  adductor_machine: "Gambe",
  abductor_machine: "Gambe",
  deadlift: "Gambe",
  romanian_deadlift: "Gambe",
  sumo_deadlift: "Gambe",

  abs: "Addome"
};

export const getMuscleGroup = (slug: string): MuscleGroup => map[slug] ?? "Altro";
