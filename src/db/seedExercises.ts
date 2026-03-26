export type SeedExerciseDefinition = {
  canonicalName: string;
  slug: string;
  aliases: string[];
};

export const seedExercises: SeedExerciseDefinition[] = [
  {
    canonicalName: "Back squat",
    slug: "back_squat",
    aliases: [
      "back squat",
      "barbell back squat",
      "barbell squat",
      "squat",
      "squat bilanciere",
      "squat con bilanciere"
    ]
  },
  {
    canonicalName: "Barbell bench press",
    slug: "barbell_bench_press",
    aliases: [
      "barbell bench press",
      "bench press",
      "bench press bilanciere",
      "bench press piana bilanciere",
      "panca bilanciere",
      "panca piana",
      "panca piana bilanciere",
      "panca piana con bilanciere"
    ]
  },
  {
    canonicalName: "Dumbbell bench press",
    slug: "dumbbell_bench_press",
    aliases: [
      "bench press dumbbell",
      "dumbbell bench press",
      "panca manubri",
      "panca piana manubri",
      "panca piana con manubri"
    ]
  },
  {
    canonicalName: "Incline barbell bench press",
    slug: "incline_barbell_bench_press",
    aliases: [
      "bench press inclinata bilanciere",
      "incline barbell bench press",
      "incline bench press barbell",
      "panca inclinata bilanciere",
      "panca inclinata con bilanciere"
    ]
  },
  {
    canonicalName: "Incline dumbbell bench press",
    slug: "incline_dumbbell_bench_press",
    aliases: [
      "bench press inclinata manubri",
      "dumbbell incline bench press",
      "incline dumbbell bench press",
      "panca inclinata manubri",
      "panca inclinata con manubri"
    ]
  },
  {
    canonicalName: "Incline smith machine bench press",
    slug: "incline_smith_machine_bench_press",
    aliases: [
      "incline bench press multipower",
      "incline bench press smith machine",
      "incline smith machine bench press",
      "panca inclinata multipower",
      "panca inclinata smith machine",
      "panca inclinata al multipower",
      "panca inclinata alla smith machine"
    ]
  },
  {
    canonicalName: "Close-grip bench press",
    slug: "close_grip_bench_press",
    aliases: [
      "close grip bench press",
      "close-grip bench press",
      "narrow grip bench press",
      "panca presa stretta",
      "panca stretta"
    ]
  },
  {
    canonicalName: "Chest press",
    slug: "chest_press",
    aliases: ["chest press", "chest press machine", "machine chest press"]
  },
  {
    canonicalName: "Croci ai cavi",
    slug: "cable_crossover",
    aliases: [
      "cable crossover",
      "cable fly",
      "croci",
      "croci ai cavi",
      "croci cavi"
    ]
  },
  {
    canonicalName: "Push-up",
    slug: "push_up",
    aliases: [
      "push up",
      "push-up",
      "push up zavorrati",
      "push-up zavorrati",
      "pushup",
      "piegamenti",
      "piegamenti zavorrati"
    ]
  },
  {
    canonicalName: "Dip",
    slug: "dip",
    aliases: [
      "dip",
      "dip zavorrati",
      "dip alle parallele",
      "dips",
      "dips zavorrati"
    ]
  },
  {
    canonicalName: "Pull-up",
    slug: "pull_up",
    aliases: [
      "pull up",
      "pull-up",
      "pull-up zavorrati",
      "trazioni",
      "trazioni zavorrate"
    ]
  },
  {
    canonicalName: "Chin-up",
    slug: "chin_up",
    aliases: [
      "chin up",
      "chin-up",
      "chin-up zavorrati",
      "trazioni supine",
      "trazioni supine zavorrate"
    ]
  },
  {
    canonicalName: "Lat machine",
    slug: "lat_pulldown",
    aliases: [
      "close grip lat pulldown",
      "lat",
      "lat machine",
      "lat machine presa inversa",
      "lat machine presa larga",
      "lat machine presa stretta",
      "lat pulldown",
      "pulldown",
      "reverse grip lat pulldown",
      "wide grip lat pulldown"
    ]
  },
  {
    canonicalName: "Pulley",
    slug: "seated_cable_row",
    aliases: [
      "cable row",
      "low row cable",
      "pulley",
      "seated cable row",
      "seated row"
    ]
  },
  {
    canonicalName: "T-bar row",
    slug: "t_bar_row",
    aliases: ["rematore t bar", "rematore t-bar", "t bar", "t-bar", "t-bar row"]
  },
  {
    canonicalName: "Rematore con manubrio",
    slug: "one_arm_dumbbell_row",
    aliases: [
      "one arm dumbbell row",
      "one-arm dumbbell row",
      "rematore manubrio",
      "rematore singolo",
      "rematore singolo con manubrio"
    ]
  },
  {
    canonicalName: "Rematore con bilanciere",
    slug: "barbell_row",
    aliases: [
      "barbell row",
      "bent over row bilanciere",
      "rematore bilanciere",
      "rematore con bilanciere"
    ]
  },
  {
    canonicalName: "Chest supported row",
    slug: "chest_supported_row",
    aliases: [
      "chest supported row",
      "row",
      "row machine",
      "seal row"
    ]
  },
  {
    canonicalName: "Face pull",
    slug: "face_pull",
    aliases: ["face pull", "face pulls", "tirate al viso"]
  },
  {
    canonicalName: "Military press con bilanciere",
    slug: "barbell_military_press",
    aliases: [
      "barbell military press",
      "barbell shoulder press",
      "lento avanti",
      "lento avanti bilanciere",
      "lento avanti con bilanciere",
      "military press",
      "military press bilanciere",
      "military press con bilanciere"
    ]
  },
  {
    canonicalName: "Military press con manubri",
    slug: "dumbbell_shoulder_press",
    aliases: [
      "dumbbell military press",
      "dumbbell shoulder press",
      "lento avanti con manubri",
      "military press manubri",
      "military press con manubri",
      "shoulder press con manubri",
      "shoulder press manubri"
    ]
  },
  {
    canonicalName: "Military press al Multi-Power",
    slug: "smith_machine_military_press",
    aliases: [
      "lento avanti al multipower",
      "lento avanti smith machine",
      "military press al multipower",
      "military press smith machine",
      "multipower shoulder press",
      "shoulder press multipower",
      "shoulder press smith machine",
      "smith machine shoulder press"
    ]
  },
  {
    canonicalName: "Alzate laterali con manubri",
    slug: "lateral_raise",
    aliases: [
      "alzate laterali",
      "alzate laterali con manubri",
      "dumbbell lateral raise",
      "lateral raise"
    ]
  },
  {
    canonicalName: "Alzate laterali ai cavi",
    slug: "cable_lateral_raise",
    aliases: [
      "alzate laterali ai cavi",
      "alzate laterali al cavo",
      "cable lateral raise",
      "lateral raise cable"
    ]
  },
  {
    canonicalName: "Spalle posteriori",
    slug: "rear_delts",
    aliases: ["rear delts", "rear shoulders", "spalle posteriori"]
  },
  {
    canonicalName: "Shrug con bilanciere",
    slug: "barbell_shrug",
    aliases: [
      "barbell shrug",
      "scrollate bilanciere",
      "scrollate con bilanciere",
      "shrug bilanciere"
    ]
  },
  {
    canonicalName: "Shrug con manubri",
    slug: "dumbbell_shrug",
    aliases: [
      "dumbbell shrug",
      "scrollate con manubri",
      "scrollate manubri",
      "shrug manubri"
    ]
  },
  {
    canonicalName: "Leg press",
    slug: "leg_press",
    aliases: ["leg press", "pressa", "pressa gambe"]
  },
  {
    canonicalName: "Leg extension",
    slug: "leg_extension",
    aliases: ["leg extension", "leg ext", "leg extensions"]
  },
  {
    canonicalName: "Leg curl",
    slug: "leg_curl",
    aliases: ["curl femorale", "hamstring curl", "leg curl"]
  },
  {
    canonicalName: "Bulgarian split squat",
    slug: "bulgarian_split_squat",
    aliases: [
      "affondi bulgari",
      "bulgari",
      "bulgarian split squat",
      "squat bulgari"
    ]
  },
  {
    canonicalName: "Hip thrust",
    slug: "hip_thrust",
    aliases: ["hip thrust", "hip thrusts"]
  },
  {
    canonicalName: "Calf raise",
    slug: "calf_raise",
    aliases: ["calf raise", "calf raises", "polpacci"]
  },
  {
    canonicalName: "Adductor machine",
    slug: "adductor_machine",
    aliases: ["adductor machine", "leg adductor", "leg adductor machine"]
  },
  {
    canonicalName: "Abductor machine",
    slug: "abductor_machine",
    aliases: ["abductor machine", "leg abductor", "leg abductor machine"]
  },
  {
    canonicalName: "Deadlift",
    slug: "deadlift",
    aliases: ["deadlift", "stacco", "stacco da terra"]
  },
  {
    canonicalName: "Romanian deadlift",
    slug: "romanian_deadlift",
    aliases: ["rdl", "romanian deadlift", "stacco rumeno"]
  },
  {
    canonicalName: "Sumo deadlift",
    slug: "sumo_deadlift",
    aliases: ["deadlift sumo", "stacco sumo", "sumo deadlift"]
  },
  {
    canonicalName: "French press",
    slug: "lying_triceps_extension",
    aliases: [
      "french press",
      "overhead tricep extension",
      "overhead triceps extension",
      "triceps extension sopra la testa"
    ]
  },
  {
    canonicalName: "Skull crusher",
    slug: "skull_crusher",
    aliases: ["lying triceps extension", "skull crush", "skull crusher"]
  },
  {
    canonicalName: "Tricipiti ai cavi alto",
    slug: "triceps_cable_high",
    aliases: [
      "tricipiti ai cavi alto",
      "tricipiti cavi alto",
      "triceps cable high",
      "triceps high cable"
    ]
  },
  {
    canonicalName: "Tricipiti ai cavi basso",
    slug: "triceps_pushdown",
    aliases: [
      "push down",
      "pushdown",
      "pushdown ai cavi",
      "tricipiti ai cavi basso",
      "tricipiti cavi basso",
      "tricipiti pushdown",
      "triceps cable low",
      "triceps low cable",
      "triceps pushdown"
    ]
  },
  {
    canonicalName: "Barbell curl",
    slug: "barbell_curl",
    aliases: ["barbell curl", "curl bilanciere", "curl con bilanciere"]
  },
  {
    canonicalName: "Dumbbell curl",
    slug: "dumbbell_curl",
    aliases: ["curl con manubri", "curl manubri", "dumbbell curl"]
  },
  {
    canonicalName: "Hammer curl",
    slug: "hammer_curl",
    aliases: ["curl a martello", "curl martello", "hammer curl"]
  },
  {
    canonicalName: "Spider curl",
    slug: "spider_curl",
    aliases: ["curl spider", "spider curl"]
  },
  {
    canonicalName: "Bicipiti ai cavi alto",
    slug: "biceps_cable_high",
    aliases: [
      "bicipiti ai cavi alto",
      "bicipiti cavi alto",
      "biceps cable high",
      "biceps high cable"
    ]
  },
  {
    canonicalName: "Bicipiti ai cavi basso",
    slug: "biceps_cable_low",
    aliases: [
      "bicipiti ai cavi basso",
      "bicipiti cavi basso",
      "biceps cable low",
      "biceps low cable",
      "curl ai cavi"
    ]
  },
  {
    canonicalName: "Addominali",
    slug: "abs",
    aliases: ["abs", "addominali"]
  }
];
