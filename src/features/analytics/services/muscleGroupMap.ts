/** Static mapping from exercise slug → muscle group label (Italian). */
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
  // Petto
  bench_press_flat_barbell: "Petto",
  incline_bench_press_barbell: "Petto",
  decline_bench_press_barbell: "Petto",
  dumbbell_bench_press: "Petto",
  incline_dumbbell_press: "Petto",
  chest_press_machine: "Petto",
  pec_deck: "Petto",
  dumbbell_fly: "Petto",
  cable_fly: "Petto",
  push_up: "Petto",
  smith_machine_bench_press: "Petto",

  // Spalle
  shoulder_press: "Spalle",
  seated_dumbbell_shoulder_press: "Spalle",
  arnold_press: "Spalle",
  lateral_raise: "Spalle",
  front_raise: "Spalle",
  rear_delt_fly: "Spalle",
  face_pull: "Spalle",
  upright_row: "Spalle",
  machine_shoulder_press: "Spalle",
  machine_lateral_raise: "Spalle",

  // Schiena
  lat_pulldown: "Schiena",
  wide_grip_lat_pulldown: "Schiena",
  close_grip_lat_pulldown: "Schiena",
  pull_up: "Schiena",
  chin_up: "Schiena",
  seated_cable_row: "Schiena",
  barbell_row: "Schiena",
  one_arm_dumbbell_row: "Schiena",
  t_bar_row: "Schiena",
  machine_row: "Schiena",
  straight_arm_pulldown: "Schiena",
  pullover: "Schiena",
  assisted_pull_up: "Schiena",

  // Bicipiti
  barbell_curl: "Bicipiti",
  ez_bar_curl: "Bicipiti",
  dumbbell_curl: "Bicipiti",
  hammer_curl: "Bicipiti",
  incline_dumbbell_curl: "Bicipiti",
  preacher_curl: "Bicipiti",
  cable_curl: "Bicipiti",

  // Tricipiti
  triceps_pushdown: "Tricipiti",
  rope_pushdown: "Tricipiti",
  skull_crusher: "Tricipiti",
  overhead_triceps_extension: "Tricipiti",
  dips: "Tricipiti",
  assisted_dip_machine: "Tricipiti",

  // Gambe
  barbell_back_squat: "Gambe",
  front_squat: "Gambe",
  goblet_squat: "Gambe",
  leg_press: "Gambe",
  hack_squat: "Gambe",
  bulgarian_split_squat: "Gambe",
  walking_lunge: "Gambe",
  static_lunge: "Gambe",
  romanian_deadlift: "Gambe",
  stiff_leg_deadlift: "Gambe",
  deadlift: "Gambe",
  sumo_deadlift: "Gambe",
  hip_thrust: "Gambe",
  glute_bridge: "Gambe",
  leg_extension: "Gambe",
  leg_curl: "Gambe",
  seated_leg_curl: "Gambe",
  lying_leg_curl: "Gambe",
  standing_calf_raise: "Gambe",
  seated_calf_raise: "Gambe",
  smith_machine_squat: "Gambe",

  // Addome
  crunch: "Addome",
  cable_crunch: "Addome",
  leg_raise: "Addome",
  hanging_leg_raise: "Addome",
  plank: "Addome",
  ab_wheel: "Addome",
};

export const getMuscleGroup = (slug: string): MuscleGroup =>
  map[slug] ?? "Altro";
