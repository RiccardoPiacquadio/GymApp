export type SeedExerciseDefinition = {
  canonicalName: string;
  slug: string;
  aliases: string[];
};

export const seedExercises: SeedExerciseDefinition[] = [
  {
    canonicalName: "Squat",
    slug: "squat",
    aliases: ["accosciata", "air squat", "bodyweight box squat", "bodyweight squat", "piegamento sulle gambe", "squat", "squat a corpo libero", "squat libero"]
  },
  {
    canonicalName: "Back squat",
    slug: "back_squat",
    aliases: ["back squat", "barbell back squat", "rear squat", "squat con bilanciere sulle spalle", "squat posteriore"]
  },
  {
    canonicalName: "Front squat",
    slug: "front_squat",
    aliases: ["barbell front squat", "front squat", "olympic front squat", "squat con bilanciere avanti", "squat frontale"]
  },
  {
    canonicalName: "Goblet squat",
    slug: "goblet_squat",
    aliases: ["dumbbell goblet squat", "goblet squat", "kettlebell goblet squat", "squat a calice", "squat con manubrio al petto"]
  },
  {
    canonicalName: "Box squat",
    slug: "box_squat",
    aliases: ["box squat", "parallel box squat", "seated box squat", "squat al box", "squat su box"]
  },
  {
    canonicalName: "Hack squat",
    slug: "hack_squat",
    aliases: ["hack squat", "hack squat machine", "machine hack squat", "squat hack"]
  },
  {
    canonicalName: "Smith machine squat",
    slug: "smith_machine_squat",
    aliases: ["smith machine back squat", "smith machine squat", "smith squat", "squat al multipower", "squat alla smith machine"]
  },
  {
    canonicalName: "Pistol squat",
    slug: "pistol_squat",
    aliases: ["one-leg squat", "pistol squat", "single-leg squat", "squat a una gamba", "squat monopodalico"]
  },
  {
    canonicalName: "Wall sit",
    slug: "wall_sit",
    aliases: ["chair hold", "imaginary chair", "sedia al muro", "squat isometrico al muro", "static squat", "wall sit", "wall squat"]
  },
  {
    canonicalName: "Bulgarian split squat",
    slug: "bulgarian_split_squat",
    aliases: ["affondo bulgaro", "bulgarian split squat", "rear-foot-elevated split squat", "rfess", "split squat bulgaro", "squat bulgaro"]
  },
  {
    canonicalName: "Split squat",
    slug: "split_squat",
    aliases: ["affondo statico", "affondo sul posto", "split squat", "static lunge", "stationary lunge"]
  },
  {
    canonicalName: "Lunge",
    slug: "lunge",
    aliases: ["affondo", "affondo in avanti", "basic lunge", "forward lunge", "lunge"]
  },
  {
    canonicalName: "Reverse lunge",
    slug: "reverse_lunge",
    aliases: ["affondo indietro", "affondo posteriore", "backward lunge", "rear lunge", "reverse lunge"]
  },
  {
    canonicalName: "Walking lunge",
    slug: "walking_lunge",
    aliases: ["affondi camminati", "affondi in avanzamento", "walking lunge", "walking split squat"]
  },
  {
    canonicalName: "Lateral lunge",
    slug: "lateral_lunge",
    aliases: ["affondo di lato", "affondo laterale", "lateral lunge", "side lunge", "side step lunge"]
  },
  {
    canonicalName: "Curtsy lunge",
    slug: "curtsy_lunge",
    aliases: ["affondo curtsy", "affondo incrociato", "curtsey lunge", "curtsy lunge", "curtsy squat"]
  },
  {
    canonicalName: "Step-up",
    slug: "step_up",
    aliases: ["bench step-up", "box step-up", "salita sul gradino", "salite al box", "salite su panca", "step-up"]
  },
  {
    canonicalName: "Leg press",
    slug: "leg_press",
    aliases: ["45-degree leg press", "leg press", "pressa", "pressa per le gambe", "sled leg press"]
  },
  {
    canonicalName: "Leg extension",
    slug: "leg_extension",
    aliases: ["estensioni del ginocchio", "estensioni delle gambe", "knee extension machine", "leg extension", "quadriceps extension"]
  },
  {
    canonicalName: "Leg curl",
    slug: "leg_curl",
    aliases: ["curl femorale", "flessioni del ginocchio", "flessioni delle gambe", "hamstring curl", "knee flexion machine", "leg curl"]
  },
  {
    canonicalName: "Lying leg curl",
    slug: "lying_leg_curl",
    aliases: ["curl femorale sdraiato", "leg curl prono", "leg curl sdraiato", "lying leg curl", "prone leg curl"]
  },
  {
    canonicalName: "Seated leg curl",
    slug: "seated_leg_curl",
    aliases: ["curl femorale seduto", "leg curl seduto", "seated hamstring curl", "seated leg curl"]
  },
  {
    canonicalName: "Standing leg curl",
    slug: "standing_leg_curl",
    aliases: ["curl femorale in piedi", "leg curl in piedi", "leg curl monopodalico", "single-leg standing leg curl", "standing leg curl"]
  },
  {
    canonicalName: "Nordic hamstring curl",
    slug: "nordic_hamstring_curl",
    aliases: ["curl nordico", "hamstring curl nordico", "leg curl nordico", "natural leg curl", "nordic curl", "nordic hamstring curl"]
  },
  {
    canonicalName: "Glute-ham raise",
    slug: "glute_ham_raise",
    aliases: ["estensioni glutei-femorali", "ghr", "glute ham developer raise", "glute-ham raise"]
  },
  {
    canonicalName: "Hip thrust",
    slug: "hip_thrust",
    aliases: ["barbell hip thrust", "bench hip thrust", "hip thrust", "spinta d'anca", "thrust d'anca"]
  },
  {
    canonicalName: "Glute bridge",
    slug: "glute_bridge",
    aliases: ["bridge hip raise", "floor hip thrust", "glute bridge", "pelvic lift", "ponte glutei", "ponte per i glutei", "sollevamento del bacino"]
  },
  {
    canonicalName: "Cable kickback",
    slug: "cable_kickback",
    aliases: ["cable glute kickback", "cable kickback", "donkey kickback", "glute kickback", "kickback glutei al cavo", "slanci posteriori al cavo"]
  },
  {
    canonicalName: "Calf raise",
    slug: "calf_raise",
    aliases: ["alzate per i polpacci", "calf raise", "calf raise exercise", "calf raises", "heel raise", "sollevamento polpacci"]
  },
  {
    canonicalName: "Standing calf raise",
    slug: "standing_calf_raise",
    aliases: ["alzate polpacci in piedi", "calf raise in piedi", "sollevamento polpacci in piedi", "standing calf raise", "standing heel raise"]
  },
  {
    canonicalName: "Seated calf raise",
    slug: "seated_calf_raise",
    aliases: ["alzate polpacci seduto", "calf raise seduto", "seated calf raise", "seated heel raise", "sollevamento polpacci seduto"]
  },
  {
    canonicalName: "Donkey calf raise",
    slug: "donkey_calf_raise",
    aliases: ["alzate polpacci donkey", "calf raise a busto flesso", "donkey calf raise", "donkey raise"]
  },
  {
    canonicalName: "Adductor machine",
    slug: "adductor_machine",
    aliases: ["adductor machine", "adduzioni alla macchina", "hip adduction machine", "macchina adduttori"]
  },
  {
    canonicalName: "Abductor machine",
    slug: "abductor_machine",
    aliases: ["abductor machine", "abduzioni alla macchina", "hip abduction machine", "macchina abduttori"]
  },
  {
    canonicalName: "Hindu squat",
    slug: "hindu_squat",
    aliases: ["bethak", "hindu squat", "indian squat", "squat hindu", "squat indiano"]
  },
  {
    canonicalName: "Deadlift",
    slug: "deadlift",
    aliases: ["barbell deadlift", "deadlift", "floor pull", "stacco", "stacco da terra"]
  },
  {
    canonicalName: "Conventional deadlift",
    slug: "conventional_deadlift",
    aliases: ["conventional deadlift", "conventional pull", "deadlift convenzionale", "regular deadlift", "stacco convenzionale"]
  },
  {
    canonicalName: "Romanian deadlift",
    slug: "romanian_deadlift",
    aliases: ["rdl", "romanian deadlift", "romanian pull", "stacco rumeno"]
  },
  {
    canonicalName: "Stiff-legged deadlift",
    slug: "stiff_legged_deadlift",
    aliases: ["deadlift gambe tese", "sldl", "stacco a gambe tese", "stacco gambe tese", "stiff-legged deadlift", "straight-leg deadlift"]
  },
  {
    canonicalName: "Sumo deadlift",
    slug: "sumo_deadlift",
    aliases: ["deadlift sumo", "stacco a presa interna", "stacco sumo", "sumo deadlift", "wide-stance deadlift"]
  },
  {
    canonicalName: "Trap bar deadlift",
    slug: "trap_bar_deadlift",
    aliases: ["hex bar deadlift", "stacco con esagonale", "stacco con trap bar", "trap bar deadlift", "trapbar deadlift"]
  },
  {
    canonicalName: "Rack pull",
    slug: "rack_pull",
    aliases: ["block pull", "partial deadlift", "rack pull", "stacco dai rialzi", "stacco parziale dai pin"]
  },
  {
    canonicalName: "Good morning",
    slug: "good_morning",
    aliases: ["good morning", "good-morning", "good-morning exercise", "piegamenti in avanti con bilanciere"]
  },
  {
    canonicalName: "Back extension",
    slug: "back_extension",
    aliases: ["back extension", "estensioni del tronco", "hyperextension", "iperestensioni lombari", "roman chair extension", "trunk extension"]
  },
  {
    canonicalName: "Reverse hyperextension",
    slug: "reverse_hyperextension",
    aliases: ["iperestensioni inverse", "reverse back extension", "reverse hyper", "reverse hyperextension"]
  },
  {
    canonicalName: "Kettlebell swing",
    slug: "kettlebell_swing",
    aliases: ["kb swing", "kettlebell swing", "russian swing", "swing con kettlebell", "swing russo"]
  },
  {
    canonicalName: "Cable pull-through",
    slug: "cable_pull_through",
    aliases: ["cable hinge", "cable hip hinge", "cable pull-through", "estensione d'anca al cavo", "pull-through al cavo"]
  },
  {
    canonicalName: "Bench press",
    slug: "bench_press",
    aliases: ["bench press", "chest press", "distensioni in panca", "distensioni su panca piana", "flat bench press", "panca piana"]
  },
  {
    canonicalName: "Barbell bench press",
    slug: "barbell_bench_press",
    aliases: ["barbell bench press", "bench press con bilanciere", "distensioni con bilanciere su panca", "flat barbell bench press", "panca piana con bilanciere"]
  },
  {
    canonicalName: "Dumbbell bench press",
    slug: "dumbbell_bench_press",
    aliases: ["distensioni con manubri su panca piana", "dumbbell bench press", "flat dumbbell press", "panca piana con manubri"]
  },
  {
    canonicalName: "Chest press",
    slug: "chest_press",
    aliases: ["chest press", "chest press machine", "machine chest press", "seated chest press", "spinte al petto alla macchina"]
  },
  {
    canonicalName: "Incline bench press",
    slug: "incline_bench_press",
    aliases: ["distensioni su panca inclinata", "incline bench press", "incline chest press", "incline press", "panca inclinata"]
  },
  {
    canonicalName: "Decline bench press",
    slug: "decline_bench_press",
    aliases: ["decline bench press", "decline chest press", "decline press", "distensioni su panca declinata", "panca declinata"]
  },
  {
    canonicalName: "Close-grip bench press",
    slug: "close_grip_bench_press",
    aliases: ["close-grip bench press", "distensioni su panca a presa stretta", "narrow-grip bench press", "panca presa stretta"]
  },
  {
    canonicalName: "Machine chest press",
    slug: "machine_chest_press",
    aliases: ["chest press alla macchina", "converging chest press", "macchina chest press", "machine chest press", "plate-loaded chest press", "pressa per il petto"]
  },
  {
    canonicalName: "Push-up",
    slug: "push_up",
    aliases: ["flessioni a terra", "piegamenti", "piegamenti sulle braccia", "press-up", "push-up", "pushup"]
  },
  {
    canonicalName: "Knee push-up",
    slug: "knee_push_up",
    aliases: ["knee push-up", "kneeling push-up", "modified push-up", "piegamenti sulle ginocchia", "push-up facilitato", "push-up sulle ginocchia"]
  },
  {
    canonicalName: "Diamond push-up",
    slug: "diamond_push_up",
    aliases: ["close-grip push-up", "diamond press-up", "diamond push-up", "piegamenti diamante", "push-up diamante", "push-up presa stretta"]
  },
  {
    canonicalName: "Dip",
    slug: "dip",
    aliases: ["bodyweight dip", "dip", "dip alle parallele", "parallel bar dip", "piegamenti alle parallele"]
  },
  {
    canonicalName: "Chest dip",
    slug: "chest_dip",
    aliases: ["chest dip", "dip con enfasi sul petto", "dip per il petto", "forward-leaning dip", "pec dip"]
  },
  {
    canonicalName: "Bench dip",
    slug: "bench_dip",
    aliases: ["bench dip", "bench push-up", "dip alla panca", "piegamenti alla panca", "triceps bench dip"]
  },
  {
    canonicalName: "Chest fly",
    slug: "chest_fly",
    aliases: ["chest fly", "chest flye", "croci", "croci per il petto", "fly", "flye", "pec fly"]
  },
  {
    canonicalName: "Dumbbell fly",
    slug: "dumbbell_fly",
    aliases: ["chest fly con manubri", "croci con manubri", "dumbbell chest fly", "dumbbell fly", "dumbbell flye", "fly con manubri"]
  },
  {
    canonicalName: "Incline dumbbell fly",
    slug: "incline_dumbbell_fly",
    aliases: ["croci inclinate", "croci su panca inclinata", "incline chest fly", "incline dumbbell fly", "incline fly"]
  },
  {
    canonicalName: "Decline dumbbell fly",
    slug: "decline_dumbbell_fly",
    aliases: ["croci declinate", "croci su panca declinata", "decline chest fly", "decline dumbbell fly", "decline fly"]
  },
  {
    canonicalName: "Cable crossover",
    slug: "cable_crossover",
    aliases: ["cable cross-over", "cable crossover", "cable fly", "cavi incrociati", "croci ai cavi", "crossover", "crossover ai cavi"]
  },
  {
    canonicalName: "Pec deck",
    slug: "pec_deck",
    aliases: ["butterfly", "butterfly machine", "croci alla macchina", "macchina pec deck", "machine fly", "pec deck", "pec-deck fly"]
  },
  {
    canonicalName: "Machine fly",
    slug: "machine_fly",
    aliases: ["butterfly", "butterfly machine fly", "croci alla macchina", "machine fly", "pec fly machine"]
  },
  {
    canonicalName: "Pullover",
    slug: "pullover",
    aliases: ["dumbbell pullover", "pullover", "pullover con bilanciere", "pullover con manubrio", "straight-arm pullover"]
  },
  {
    canonicalName: "Pull-up",
    slug: "pull_up",
    aliases: ["overhand pull-up", "pronated pull-up", "pull-up", "pullup", "trazioni alla sbarra in pronazione", "trazioni prona", "trazioni prone"]
  },
  {
    canonicalName: "Chin-up",
    slug: "chin_up",
    aliases: ["chin-up", "supinated pull-up", "trazioni alla sbarra in supinazione", "trazioni supina", "trazioni supine", "underhand pull-up"]
  },
  {
    canonicalName: "Neutral-grip pull-up",
    slug: "neutral_grip_pull_up",
    aliases: ["hammer-grip pull-up", "neutral-grip pull-up", "parallel-grip pull-up", "trazioni a presa neutra", "trazioni parallele"]
  },
  {
    canonicalName: "Assisted pull-up",
    slug: "assisted_pull_up",
    aliases: ["assisted chin-up", "assisted pull-up", "machine assisted pull-up", "pull-up assistite", "trazioni alla gravitron", "trazioni assistite"]
  },
  {
    canonicalName: "Lat pulldown",
    slug: "lat_pulldown",
    aliases: ["lat machine", "lat machine avanti", "lat pull-down", "lat pulldown", "pulldown", "pulley alto", "trazioni alla lat machine", "wide-grip pulldown", "lat"]
  },
  {
    canonicalName: "Close-grip lat pulldown",
    slug: "close_grip_lat_pulldown",
    aliases: ["close-grip lat pull-down", "close-grip lat pulldown", "close-grip pulldown", "lat machine presa stretta", "lat pulldown presa stretta", "trazioni alla lat presa stretta"]
  },
  {
    canonicalName: "Reverse-grip lat pulldown",
    slug: "reverse_grip_lat_pulldown",
    aliases: ["lat machine presa inversa", "lat machine supina", "pulldown in supinazione", "reverse-grip lat pulldown", "supinated pulldown", "underhand lat pulldown"]
  },
  {
    canonicalName: "Straight-arm pulldown",
    slug: "straight_arm_pulldown",
    aliases: ["cable pullover", "lat machine a braccia tese", "pulldown a braccia tese", "pullover al cavo", "straight-arm pull-down", "straight-arm pulldown"]
  },
  {
    canonicalName: "Muscle-up",
    slug: "muscle_up",
    aliases: ["bar muscle-up", "muscle up", "muscle-up", "muscle-up alla sbarra", "ring muscle-up", "trazione con dip"]
  },
  {
    canonicalName: "Rope climb",
    slug: "rope_climb",
    aliases: ["arrampicata alla corda", "rope climb", "rope climbing", "scalata alla corda"]
  },
  {
    canonicalName: "Bent-over row",
    slug: "bent_over_row",
    aliases: ["bent row", "bent-over barbell row", "bent-over row", "rematore busto flesso", "rematore con busto flesso"]
  },
  {
    canonicalName: "Barbell row",
    slug: "barbell_row",
    aliases: ["barbell bent-over row", "barbell row", "bent-over barbell row", "bent-over row con bilanciere", "rematore con bilanciere"]
  },
  {
    canonicalName: "One-arm dumbbell row",
    slug: "one_arm_dumbbell_row",
    aliases: ["one-arm dumbbell row", "one-arm row", "rematore con manubrio a un braccio", "rematore monolaterale", "single-arm dumbbell row"]
  },
  {
    canonicalName: "Chest-supported row",
    slug: "chest_supported_row",
    aliases: ["chest-supported row", "incline bench row", "rematore chest-supported", "rematore su panca inclinata", "seal row"]
  },
  {
    canonicalName: "Seated cable row",
    slug: "seated_cable_row",
    aliases: ["cable row", "low cable row", "low row al cavo", "pulley basso", "rematore al cavo da seduto", "seated cable row", "seated row"]
  },
  {
    canonicalName: "Low row machine",
    slug: "low_row_machine",
    aliases: ["low row", "low row machine", "plate-loaded row", "rematore basso alla macchina", "seated low row"]
  },
  {
    canonicalName: "T-bar row",
    slug: "t_bar_row",
    aliases: ["landmine row", "rematore con t-bar", "rematore t-bar", "t-bar bent-over row", "t-bar row"]
  },
  {
    canonicalName: "Inverted row",
    slug: "inverted_row",
    aliases: ["australian pull-up", "body row", "horizontal row", "inverted row", "rematore inverso", "trazioni orizzontali"]
  },
  {
    canonicalName: "Face pull",
    slug: "face_pull",
    aliases: ["face pull", "rope face pull", "tirate al viso", "tirate alla faccia"]
  },
  {
    canonicalName: "Rear delt fly",
    slug: "rear_delt_fly",
    aliases: ["alzate posteriori", "bent-over lateral raise", "croci inverse", "rear delt fly", "rear deltoid fly", "reverse fly"]
  },
  {
    canonicalName: "Reverse pec deck",
    slug: "reverse_pec_deck",
    aliases: ["croci inverse alla macchina", "pec deck inversa", "rear delt machine fly", "reverse machine fly", "reverse pec deck"]
  },
  {
    canonicalName: "Shoulder shrug",
    slug: "shoulder_shrug",
    aliases: ["barbell shrug", "dumbbell shrug", "scrollate", "scrollate per trapezi", "shoulder shrug", "shrug"]
  },
  {
    canonicalName: "Upright row",
    slug: "upright_row",
    aliases: ["high pull row", "tirata verticale al mento", "tirate al mento", "upright cable row", "upright row"]
  },
  {
    canonicalName: "Overhead press",
    slug: "overhead_press",
    aliases: ["lento avanti", "military press", "overhead press", "pressa sopra la testa", "shoulder press", "strict press"]
  },
  {
    canonicalName: "Seated shoulder press",
    slug: "seated_shoulder_press",
    aliases: ["lento avanti da seduto", "press da seduto", "seated dumbbell press", "seated overhead press", "seated shoulder press", "shoulder press da seduto"]
  },
  {
    canonicalName: "Dumbbell shoulder press",
    slug: "dumbbell_shoulder_press",
    aliases: ["dumbbell overhead press", "dumbbell press", "dumbbell shoulder press", "lento con manubri", "military press con manubri", "shoulder press con manubri"]
  },
  {
    canonicalName: "Machine shoulder press",
    slug: "machine_shoulder_press",
    aliases: ["machine overhead press", "machine shoulder press", "pressa spalle", "shoulder press alla macchina", "shoulder press machine"]
  },
  {
    canonicalName: "Arnold press",
    slug: "arnold_press",
    aliases: ["arnold press", "arnold shoulder press", "lento arnold", "shoulder press arnold"]
  },
  {
    canonicalName: "Push press",
    slug: "push_press",
    aliases: ["distensione sopra la testa con slancio", "leg-drive press", "lento spinto", "push press"]
  },
  {
    canonicalName: "Landmine press",
    slug: "landmine_press",
    aliases: ["angled press", "barbell landmine press", "landmine press", "press con landmine", "spinta in diagonale al landmine"]
  },
  {
    canonicalName: "Handstand push-up",
    slug: "handstand_push_up",
    aliases: ["flessioni in verticale", "handstand push-up", "hspu", "piegamenti in verticale", "wall handstand push-up"]
  },
  {
    canonicalName: "Lateral raise",
    slug: "lateral_raise",
    aliases: ["alzate a lato", "alzate laterali", "lateral dumbbell raise", "lateral raise", "side lateral raise"]
  },
  {
    canonicalName: "Front raise",
    slug: "front_raise",
    aliases: ["alzate avanti", "alzate frontali", "anterior raise", "front dumbbell raise", "front raise"]
  },
  {
    canonicalName: "Rear delt raise",
    slug: "rear_delt_raise",
    aliases: ["alzate a 90°", "alzate laterali da busto flesso", "alzate posteriori", "bent-over lateral raise", "rear delt raise", "rear deltoid raise"]
  },
  {
    canonicalName: "Bent press",
    slug: "bent_press",
    aliases: ["bent press", "bent press old school", "distensione laterale antica", "old-time bent press"]
  },
  {
    canonicalName: "Biceps curl",
    slug: "biceps_curl",
    aliases: ["arm curl", "bicep curl", "biceps curl", "curl bicipiti", "curl per bicipiti"]
  },
  {
    canonicalName: "Barbell curl",
    slug: "barbell_curl",
    aliases: ["barbell curl", "curl bilanciere in piedi", "curl con bilanciere", "standing barbell curl", "straight-bar curl"]
  },
  {
    canonicalName: "Dumbbell curl",
    slug: "dumbbell_curl",
    aliases: ["curl con manubri", "curl manubri in piedi", "dumbbell curl", "standing dumbbell curl"]
  },
  {
    canonicalName: "Alternating dumbbell curl",
    slug: "alternating_dumbbell_curl",
    aliases: ["alternating curl", "alternating dumbbell curl", "alternating rotating dumbbell curl", "curl alternato", "curl alternato con manubri"]
  },
  {
    canonicalName: "Hammer curl",
    slug: "hammer_curl",
    aliases: ["curl a martello", "curl martello", "hammer curl", "hammer dumbbell curl", "neutral-grip curl"]
  },
  {
    canonicalName: "Concentration curl",
    slug: "concentration_curl",
    aliases: ["concentration curl", "curl concentrato", "curl di concentrazione", "seated concentration curl"]
  },
  {
    canonicalName: "Preacher curl",
    slug: "preacher_curl",
    aliases: ["curl alla panca scott", "curl scott", "curl su panca scott", "preacher bench curl", "preacher curl", "scott curl"]
  },
  {
    canonicalName: "Incline dumbbell curl",
    slug: "incline_dumbbell_curl",
    aliases: ["curl inclinato", "curl su panca inclinata", "incline bench curl", "incline curl", "incline dumbbell curl"]
  },
  {
    canonicalName: "Spider curl",
    slug: "spider_curl",
    aliases: ["curl a busto prono su panca", "curl spider", "prone incline curl", "spider curl"]
  },
  {
    canonicalName: "Reverse curl",
    slug: "reverse_curl",
    aliases: ["curl in pronazione", "curl inverso", "overhand curl", "pronated curl", "reverse curl"]
  },
  {
    canonicalName: "Zottman curl",
    slug: "zottman_curl",
    aliases: ["curl zottman", "zottman curl", "zottman dumbbell curl"]
  },
  {
    canonicalName: "Wrist curl",
    slug: "wrist_curl",
    aliases: ["curl dei polsi", "flessione dei polsi", "forearm curl", "seated wrist curl", "wrist curl"]
  },
  {
    canonicalName: "Reverse wrist curl",
    slug: "reverse_wrist_curl",
    aliases: ["curl inverso dei polsi", "estensione dei polsi", "reverse wrist curl", "wrist extension curl"]
  },
  {
    canonicalName: "Overhead triceps extension",
    slug: "overhead_triceps_extension",
    aliases: ["estensioni sopra la testa per tricipiti", "overhead extension", "overhead tricep extension", "overhead triceps extension", "triceps extension sopra la testa"]
  },
  {
    canonicalName: "Lying triceps extension",
    slug: "lying_triceps_extension",
    aliases: ["estensioni per tricipiti da sdraiati", "estensioni per tricipiti su panca", "french curl", "french extension", "french press", "lying triceps extension", "skull crusher"]
  },
  {
    canonicalName: "Skull crusher",
    slug: "skull_crusher",
    aliases: ["estensioni a fronte", "forehead extension", "french press", "lying triceps extension", "nose breaker", "skull crusher", "spacca cranio"]
  },
  {
    canonicalName: "Seated overhead triceps extension",
    slug: "seated_overhead_triceps_extension",
    aliases: ["estensioni sopra la testa da seduto", "french press da seduto", "seated dumbbell triceps extension", "seated overhead triceps extension", "tricipiti sopra testa da seduto"]
  },
  {
    canonicalName: "Triceps pushdown",
    slug: "triceps_pushdown",
    aliases: ["cable pressdown", "press down", "push down", "push-down", "pushdown al cavo", "pushdown per tricipiti", "standing triceps extension", "triceps push-down", "triceps pushdown", "tricipiti al cavo"]
  },
  {
    canonicalName: "Rope pushdown",
    slug: "rope_pushdown",
    aliases: ["push down con corda", "pushdown con corda", "rope pressdown", "rope pushdown", "rope triceps pushdown"]
  },
  {
    canonicalName: "Triceps kickback",
    slug: "triceps_kickback",
    aliases: ["cable kickback for triceps", "dumbbell kickback", "estensioni dietro per tricipiti", "kickback per tricipiti", "triceps kickback"]
  },
  {
    canonicalName: "Close-grip push-up",
    slug: "close_grip_push_up",
    aliases: ["close-grip push-up", "close-hand push-up", "narrow push-up", "piegamenti a mani strette", "push-up presa stretta"]
  },
  {
    canonicalName: "Crunch",
    slug: "crunch",
    aliases: ["abdominal crunch", "abdominal curl", "crunch", "crunch addominale", "crunch addominali"]
  },
  {
    canonicalName: "Bicycle crunch",
    slug: "bicycle_crunch",
    aliases: ["bicycle crunch", "bicycle kick crunch", "crunch alternato", "crunch bicicletta"]
  },
  {
    canonicalName: "Reverse crunch",
    slug: "reverse_crunch",
    aliases: ["crunch al contrario", "crunch inverso", "reverse abdominal crunch", "reverse crunch"]
  },
  {
    canonicalName: "Cable crunch",
    slug: "cable_crunch",
    aliases: ["cable crunch", "crunch ai cavi", "crunch al cavo", "kneeling cable crunch"]
  },
  {
    canonicalName: "Sit-up",
    slug: "sit_up",
    aliases: ["abdominal sit-up", "addominali completi", "sit up", "sit-up"]
  },
  {
    canonicalName: "V-up",
    slug: "v_up",
    aliases: ["chiusure a v", "crunch a v", "jackknife", "jackknife sit-up", "v sit-up", "v-up"]
  },
  {
    canonicalName: "Jackknife",
    slug: "jackknife",
    aliases: ["chiusure", "jack-knife", "jackknife", "jackknife addominale", "jackknife sit-up"]
  },
  {
    canonicalName: "Leg raise",
    slug: "leg_raise",
    aliases: ["alzate gambe", "leg raise", "lying leg raise", "sollevamento gambe", "straight-leg raise"]
  },
  {
    canonicalName: "Hanging leg raise",
    slug: "hanging_leg_raise",
    aliases: ["alzate gambe appeso", "hanging leg raise", "hanging straight-leg raise", "sollevamento gambe alla sbarra"]
  },
  {
    canonicalName: "Hanging knee raise",
    slug: "hanging_knee_raise",
    aliases: ["captain's chair knee raise", "hanging knee raise", "knee raise appeso", "sollevamento ginocchia alla sbarra"]
  },
  {
    canonicalName: "Plank",
    slug: "plank",
    aliases: ["asse frontale", "elbow plank", "front plank", "plank", "plank frontale", "prone plank"]
  },
  {
    canonicalName: "Side plank",
    slug: "side_plank",
    aliases: ["asse laterale", "plank laterale", "side bridge plank", "side plank"]
  },
  {
    canonicalName: "Hollow body hold",
    slug: "hollow_body_hold",
    aliases: ["banana hold", "barchetta", "hollow body hold", "hollow hold", "hollow rock hold", "tenuta hollow"]
  },
  {
    canonicalName: "Russian twist",
    slug: "russian_twist",
    aliases: ["russian twist", "russian twist sit-up", "torsioni russe", "twist russo"]
  },
  {
    canonicalName: "Mountain climber",
    slug: "mountain_climber",
    aliases: ["climber", "climbing plank", "mountain climber", "running plank", "scalatore"]
  },
  {
    canonicalName: "Superman",
    slug: "superman",
    aliases: ["estensione superman", "iperestensione a terra", "prone superman hold", "superman"]
  },
  {
    canonicalName: "Side bend",
    slug: "side_bend",
    aliases: ["dumbbell side bend", "flessioni laterali", "oblique side bend", "piegamenti laterali del busto", "side bend"]
  },
  {
    canonicalName: "Ab wheel rollout",
    slug: "ab_wheel_rollout",
    aliases: ["ab rollout", "ab wheel rollout", "rollout addominale", "rollout con ruota", "wheel rollout"]
  },
  {
    canonicalName: "Pallof press",
    slug: "pallof_press",
    aliases: ["anti-rotation press", "cable pallof press", "pallof press", "press antirotazionale"]
  },
  {
    canonicalName: "Burpee",
    slug: "burpee",
    aliases: ["burpee", "burpees", "squat thrust with jump and push-up"]
  },
  {
    canonicalName: "Squat thrust",
    slug: "squat_thrust",
    aliases: ["burpee senza salto", "burpee without jump", "half burpee", "mezzo burpee", "squat thrust"]
  },
  {
    canonicalName: "Bear crawl",
    slug: "bear_crawl",
    aliases: ["avanzamento quadrupedico", "bear crawl", "camminata dell'orso", "quadrupedal crawl"]
  },
  {
    canonicalName: "Jumping jack",
    slug: "jumping_jack",
    aliases: ["jumping jack", "jumping jacks", "saltelli a gambe braccia aperte", "star jump"]
  },
  {
    canonicalName: "Jump rope",
    slug: "jump_rope",
    aliases: ["corda", "jump rope", "rope skipping", "salto con la corda", "skipping rope"]
  },
  {
    canonicalName: "Split jump",
    slug: "split_jump",
    aliases: ["affondo saltato", "jump lunge", "jumping lunge", "split jump"]
  },
  {
    canonicalName: "Box jump",
    slug: "box_jump",
    aliases: ["box jump", "plyo box jump", "salto al box", "salto sulla plyo box"]
  },
  {
    canonicalName: "Stair climbing",
    slug: "stair_climbing",
    aliases: ["salita scale", "stair climbing", "stair stepper climbing", "stairs climbing", "step climbing"]
  },
  {
    canonicalName: "Front lever",
    slug: "front_lever",
    aliases: ["front hang lever", "front lever", "leva frontale"]
  },
  {
    canonicalName: "Back lever",
    slug: "back_lever",
    aliases: ["back lever", "leva posteriore", "rear lever"]
  },
  {
    canonicalName: "Human flag",
    slug: "human_flag",
    aliases: ["bandiera umana", "flag hold", "human flag"]
  },
  {
    canonicalName: "L-sit",
    slug: "l_sit",
    aliases: ["l sit", "l sit hold", "l-sit", "tenuta a l"]
  },
  {
    canonicalName: "V-sit",
    slug: "v_sit",
    aliases: ["tenuta a v", "v sit", "v sit hold", "v-sit"]
  },
  {
    canonicalName: "Planche",
    slug: "planche",
    aliases: ["planche", "planche hold", "tenuta planche"]
  },
  {
    canonicalName: "Handstand",
    slug: "handstand",
    aliases: ["free handstand", "handstand", "verticale", "verticale sulle mani", "wall handstand"]
  },
  {
    canonicalName: "Crow pose",
    slug: "crow_pose",
    aliases: ["bakasana", "bakasana balance", "crow pose", "posa del corvo"]
  },
  {
    canonicalName: "Horse stance",
    slug: "horse_stance",
    aliases: ["horse stance", "horse stand", "horse-riding stance", "posizione del cavaliere", "stance del cavallo"]
  },
  {
    canonicalName: "Bridge",
    slug: "bridge",
    aliases: ["bridge", "gymnastic bridge", "ponte", "ponte ginnico", "wrestler's bridge"]
  },
  {
    canonicalName: "Hindu push-up",
    slug: "hindu_push_up",
    aliases: ["dand", "dive bomber push-up", "hindu push-up", "piegamenti hindu", "push-up a tuffo"]
  },
  {
    canonicalName: "One-arm push-up",
    slug: "one_arm_push_up",
    aliases: ["one arm press-up", "one-arm push-up", "piegamenti a un braccio", "push-up a un braccio"]
  },
  {
    canonicalName: "One-arm pull-up",
    slug: "one_arm_pull_up",
    aliases: ["one arm chin-up", "one-arm pull-up", "trazione a un braccio", "trazione monobraccio"]
  },
  {
    canonicalName: "Hand walking",
    slug: "hand_walking",
    aliases: ["camminata sulle mani", "hand walk", "hand walking"]
  },
  {
    canonicalName: "Dirty dog",
    slug: "dirty_dog",
    aliases: ["dirty dog", "fire hydrant", "fire hydrant exercise", "slancio laterale quadrupedico"]
  },
  {
    canonicalName: "Donkey kick",
    slug: "donkey_kick",
    aliases: ["calcio d'asino", "donkey kick", "quadruped hip extension", "slancio posteriore quadrupedico"]
  },
  {
    canonicalName: "Kip-up",
    slug: "kip_up",
    aliases: ["kick-up to stand", "kip-up", "rialzata esplosiva da terra"]
  },
  {
    canonicalName: "Snatch",
    slug: "snatch",
    aliases: ["full snatch", "snatch", "squat snatch", "strappo"]
  },
  {
    canonicalName: "Power snatch",
    slug: "power_snatch",
    aliases: ["high catch snatch", "power snatch", "strappo di potenza"]
  },
  {
    canonicalName: "Muscle snatch",
    slug: "muscle_snatch",
    aliases: ["muscle snatch", "strappo muscolare", "strict-arm snatch"]
  },
  {
    canonicalName: "Clean",
    slug: "clean",
    aliases: ["clean", "full clean", "girata", "squat clean"]
  },
  {
    canonicalName: "Power clean",
    slug: "power_clean",
    aliases: ["girata di potenza", "high catch clean", "power clean"]
  },
  {
    canonicalName: "Hang clean",
    slug: "hang_clean",
    aliases: ["girata dall'hang", "girata in sospensione", "hang clean", "hang power clean"]
  },
  {
    canonicalName: "Clean and jerk",
    slug: "clean_and_jerk",
    aliases: ["clean and jerk", "girata e slancio", "olympic clean and jerk", "slancio olimpico"]
  },
  {
    canonicalName: "Jerk",
    slug: "jerk",
    aliases: ["jerk", "jerk sopra la testa", "overhead jerk", "slancio"]
  },
  {
    canonicalName: "Split jerk",
    slug: "split_jerk",
    aliases: ["jerk in split", "slancio in divaricata", "split jerk", "split-style jerk"]
  },
  {
    canonicalName: "Push jerk",
    slug: "push_jerk",
    aliases: ["jerk con spinta", "push jerk", "rebound jerk"]
  },
  {
    canonicalName: "Squat jerk",
    slug: "squat_jerk",
    aliases: ["full-depth jerk", "jerk in accosciata", "squat jerk"]
  },
  {
    canonicalName: "Clean and press",
    slug: "clean_and_press",
    aliases: ["clean & press", "clean and press", "girata e distensione", "olympic clean and press"]
  },
];
