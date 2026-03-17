export type SeedExerciseDefinition = {
  canonicalName: string;
  slug: string;
  aliases: string[];
};

export const seedExercises: SeedExerciseDefinition[] = [
  {
    canonicalName: 'Bench Press',
    slug: 'bench_press_flat_barbell',
    aliases: [
      'panca piana',
      'panca bilanciere',
      'bench press',
      'barbell bench press',
      'flat bench press',
      'flat barbell bench',
      'panca piana bilanciere',
    ]
  },
  {
    canonicalName: 'Incline Bench Press',
    slug: 'incline_bench_press_barbell',
    aliases: [
      'panca inclinata',
      'panca inclinata bilanciere',
      'incline bench press',
      'incline barbell bench',
      'incline press',
      'panca alta bilanciere',
    ]
  },
  {
    canonicalName: 'Decline Bench Press',
    slug: 'decline_bench_press_barbell',
    aliases: [
      'panca declinata',
      'panca declinata bilanciere',
      'decline bench press',
      'decline barbell bench',
      'decline press',
    ]
  },
  {
    canonicalName: 'Dumbbell Bench Press',
    slug: 'dumbbell_bench_press',
    aliases: [
      'panca manubri',
      'panca piana manubri',
      'dumbbell bench press',
      'flat dumbbell press',
      'dumbbell press piana',
    ]
  },
  {
    canonicalName: 'Incline Dumbbell Press',
    slug: 'incline_dumbbell_press',
    aliases: [
      'panca inclinata manubri',
      'inclinata manubri',
      'incline dumbbell press',
      'incline dumbbell bench',
      'dumbbell incline press',
    ]
  },
  {
    canonicalName: 'Chest Press Machine',
    slug: 'chest_press_machine',
    aliases: [
      'chest press',
      'chest press machine',
      'macchina chest press',
      'pressa petto',
      'panca macchina',
      'macchina petto',
    ]
  },
  {
    canonicalName: 'Pec Deck',
    slug: 'pec_deck',
    aliases: [
      'pec deck',
      'peck deck',
      'butterfly machine',
      'butterfly',
      'macchina croci',
      'macchina pec deck',
    ]
  },
  {
    canonicalName: 'Dumbbell Fly',
    slug: 'dumbbell_fly',
    aliases: [
      'croci manubri',
      'croci panca',
      'dumbbell fly',
      'dumbbell flies',
      'chest fly',
      'fly manubri',
    ]
  },
  {
    canonicalName: 'Cable Fly',
    slug: 'cable_fly',
    aliases: [
      'croci ai cavi',
      'cavi petto',
      'cable fly',
      'cable crossover',
      'chest cable fly',
      'crossover cavi',
    ]
  },
  {
    canonicalName: 'Push Up',
    slug: 'push_up',
    aliases: [
      'piegamenti',
      'push up',
      'pushup',
      'flessioni',
      'piegamenti a terra',
    ]
  },
  {
    canonicalName: 'Shoulder Press',
    slug: 'shoulder_press',
    aliases: [
      'shoulder press',
      'military press',
      'lento avanti',
      'overhead press',
      'press militare',
      'press spalle',
      'spinta sopra testa',
    ]
  },
  {
    canonicalName: 'Seated Dumbbell Shoulder Press',
    slug: 'seated_dumbbell_shoulder_press',
    aliases: [
      'shoulder press manubri',
      'lento avanti manubri',
      'seated dumbbell shoulder press',
      'dumbbell shoulder press',
      'seated overhead dumbbell press',
      'spinte manubri spalle',
    ]
  },
  {
    canonicalName: 'Arnold Press',
    slug: 'arnold_press',
    aliases: [
      'arnold press',
      'arnold',
      'spinte arnold',
    ]
  },
  {
    canonicalName: 'Lateral Raise',
    slug: 'lateral_raise',
    aliases: [
      'alzate laterali',
      'lateral raise',
      'lateral raises',
      'side lateral raise',
      'side raises',
    ]
  },
  {
    canonicalName: 'Front Raise',
    slug: 'front_raise',
    aliases: [
      'alzate frontali',
      'front raise',
      'front raises',
      'shoulder front raise',
    ]
  },
  {
    canonicalName: 'Rear Delt Fly',
    slug: 'rear_delt_fly',
    aliases: [
      'alzate posteriori',
      'croci inverse',
      'rear delt fly',
      'reverse fly',
      'reverse pec deck',
      'deltoidi posteriori',
    ]
  },
  {
    canonicalName: 'Face Pull',
    slug: 'face_pull',
    aliases: [
      'face pull',
      'face pulls',
      'tirate al viso',
      'cavo al viso',
    ]
  },
  {
    canonicalName: 'Upright Row',
    slug: 'upright_row',
    aliases: [
      'tirate al mento',
      'upright row',
      'tirata al mento',
      'upright barbell row',
    ]
  },
  {
    canonicalName: 'Lat Pulldown',
    slug: 'lat_pulldown',
    aliases: [
      'lat machine',
      'lat pulldown',
      'pulley alto',
      'trazioni alla lat machine',
      'lat',
      'front lat pulldown',
    ]
  },
  {
    canonicalName: 'Wide Grip Lat Pulldown',
    slug: 'wide_grip_lat_pulldown',
    aliases: [
      'lat machine presa larga',
      'lat larga',
      'wide grip lat pulldown',
      'wide lat pulldown',
      'lat pulldown wide grip',
    ]
  },
  {
    canonicalName: 'Close Grip Lat Pulldown',
    slug: 'close_grip_lat_pulldown',
    aliases: [
      'lat machine presa stretta',
      'lat stretta',
      'close grip lat pulldown',
      'close lat pulldown',
      'narrow grip lat pulldown',
    ]
  },
  {
    canonicalName: 'Pull Up',
    slug: 'pull_up',
    aliases: [
      'trazioni',
      'pull up',
      'pullup',
      'trazioni sbarra',
      'trazioni prone',
      'pull ups',
    ]
  },
  {
    canonicalName: 'Chin Up',
    slug: 'chin_up',
    aliases: [
      'chin up',
      'chinup',
      'trazioni supine',
      'chin ups',
      'trazioni presa supina',
    ]
  },
  {
    canonicalName: 'Seated Cable Row',
    slug: 'seated_cable_row',
    aliases: [
      'pulley',
      'pulley basso',
      'rematore pulley',
      'seated cable row',
      'cable row',
      'low row cable',
    ]
  },
  {
    canonicalName: 'Barbell Row',
    slug: 'barbell_row',
    aliases: [
      'rematore bilanciere',
      'barbell row',
      'bent over row',
      'bent over barbell row',
      'rematore busto flesso',
    ]
  },
  {
    canonicalName: 'Dumbbell Row',
    slug: 'one_arm_dumbbell_row',
    aliases: [
      'rematore manubrio',
      'rematore unilaterale manubrio',
      'one arm dumbbell row',
      'single arm row',
      'dumbbell row',
      'one arm row',
    ]
  },
  {
    canonicalName: 'T-Bar Row',
    slug: 't_bar_row',
    aliases: [
      't bar row',
      't-bar row',
      'rematore t bar',
      'landmine row',
      'rematore tbar',
    ]
  },
  {
    canonicalName: 'Machine Row',
    slug: 'machine_row',
    aliases: [
      'rematore macchina',
      'machine row',
      'low row machine',
      'rowing machine schiena',
    ]
  },
  {
    canonicalName: 'Straight Arm Pulldown',
    slug: 'straight_arm_pulldown',
    aliases: [
      'pull down braccia tese',
      'straight arm pulldown',
      'straight arm pushdown',
      'lat prayer',
      'pullover ai cavi',
    ]
  },
  {
    canonicalName: 'Pullover',
    slug: 'pullover',
    aliases: [
      'pullover',
      'pullover manubrio',
      'dumbbell pullover',
      'pullover panca',
    ]
  },
  {
    canonicalName: 'Back Squat',
    slug: 'barbell_back_squat',
    aliases: [
      'squat',
      'back squat',
      'squat bilanciere',
      'squat libero',
      'squat con bilanciere',
    ]
  },
  {
    canonicalName: 'Front Squat',
    slug: 'front_squat',
    aliases: [
      'front squat',
      'squat frontale',
      'squat avanti',
      'squat bilanciere frontale',
    ]
  },
  {
    canonicalName: 'Goblet Squat',
    slug: 'goblet_squat',
    aliases: [
      'goblet squat',
      'squat goblet',
      'squat con manubrio',
      'squat kettlebell',
    ]
  },
  {
    canonicalName: 'Leg Press',
    slug: 'leg_press',
    aliases: [
      'leg press',
      'pressa',
      'pressa gambe',
      'pressa 45',
      'leg press 45 gradi',
    ]
  },
  {
    canonicalName: 'Hack Squat',
    slug: 'hack_squat',
    aliases: [
      'hack squat',
      'hack',
      'macchina hack squat',
      'hack press',
    ]
  },
  {
    canonicalName: 'Bulgarian Split Squat',
    slug: 'bulgarian_split_squat',
    aliases: [
      'bulgarian split squat',
      'bulgarian squat',
      'affondi bulgari',
      'squat bulgaro',
      'bulgari',
    ]
  },
  {
    canonicalName: 'Walking Lunge',
    slug: 'walking_lunge',
    aliases: [
      'affondi camminati',
      'walking lunge',
      'walking lunges',
      'affondi in camminata',
    ]
  },
  {
    canonicalName: 'Static Lunge',
    slug: 'static_lunge',
    aliases: [
      'affondi statici',
      'static lunge',
      'split squat',
      'affondi fermi',
    ]
  },
  {
    canonicalName: 'Romanian Deadlift',
    slug: 'romanian_deadlift',
    aliases: [
      'stacchi rumeni',
      'rumeno',
      'romanian deadlift',
      'rdl',
      'stiff leg deadlift rumeno',
    ]
  },
  {
    canonicalName: 'Stiff Leg Deadlift',
    slug: 'stiff_leg_deadlift',
    aliases: [
      'stacchi gambe tese',
      'stiff leg deadlift',
      'stiff leg',
      'stacco gambe tese',
    ]
  },
  {
    canonicalName: 'Deadlift',
    slug: 'deadlift',
    aliases: [
      'deadlift',
      'stacco',
      'stacco da terra',
      'conventional deadlift',
      'stacco classico',
    ]
  },
  {
    canonicalName: 'Sumo Deadlift',
    slug: 'sumo_deadlift',
    aliases: [
      'stacco sumo',
      'sumo deadlift',
      'deadlift sumo',
      'sumo',
    ]
  },
  {
    canonicalName: 'Hip Thrust',
    slug: 'hip_thrust',
    aliases: [
      'hip thrust',
      'thrust',
      'ponte glutei bilanciere',
      'spinte glutei',
      'hip thrust bilanciere',
    ]
  },
  {
    canonicalName: 'Glute Bridge',
    slug: 'glute_bridge',
    aliases: [
      'glute bridge',
      'ponte glutei',
      'bridge glutei',
      'ponte a terra glutei',
    ]
  },
  {
    canonicalName: 'Leg Extension',
    slug: 'leg_extension',
    aliases: [
      'leg extension',
      'estensioni gambe',
      'macchina quadricipiti',
      'extension gambe',
    ]
  },
  {
    canonicalName: 'Leg Curl',
    slug: 'leg_curl',
    aliases: [
      'leg curl',
      'curl femorali',
      'macchina femorali',
      'curl gambe',
    ]
  },
  {
    canonicalName: 'Seated Leg Curl',
    slug: 'seated_leg_curl',
    aliases: [
      'leg curl seduto',
      'seated leg curl',
      'seated hamstring curl',
    ]
  },
  {
    canonicalName: 'Lying Leg Curl',
    slug: 'lying_leg_curl',
    aliases: [
      'leg curl sdraiato',
      'lying leg curl',
      'prone leg curl',
      'leg curl prono',
    ]
  },
  {
    canonicalName: 'Standing Calf Raise',
    slug: 'standing_calf_raise',
    aliases: [
      'calf in piedi',
      'standing calf raise',
      'calf raise',
      'polpacci in piedi',
      'calf machine in piedi',
    ]
  },
  {
    canonicalName: 'Seated Calf Raise',
    slug: 'seated_calf_raise',
    aliases: [
      'calf seduto',
      'seated calf raise',
      'polpacci seduto',
      'calf machine seduto',
    ]
  },
  {
    canonicalName: 'Barbell Curl',
    slug: 'barbell_curl',
    aliases: [
      'curl bilanciere',
      'barbell curl',
      'biceps curl bilanciere',
      'curl dritto',
    ]
  },
  {
    canonicalName: 'EZ Bar Curl',
    slug: 'ez_bar_curl',
    aliases: [
      'curl ez',
      'curl ez bar',
      'ez bar curl',
      'curl bilanciere ez',
    ]
  },
  {
    canonicalName: 'Dumbbell Curl',
    slug: 'dumbbell_curl',
    aliases: [
      'curl manubri',
      'dumbbell curl',
      'biceps curl',
      'curl alternato',
      'curl con manubri',
    ]
  },
  {
    canonicalName: 'Hammer Curl',
    slug: 'hammer_curl',
    aliases: [
      'hammer curl',
      'hammer curls',
      'curl martello',
      'martello manubri',
    ]
  },
  {
    canonicalName: 'Incline Dumbbell Curl',
    slug: 'incline_dumbbell_curl',
    aliases: [
      'curl inclinato',
      'incline dumbbell curl',
      'incline curl',
      'curl manubri inclinato',
    ]
  },
  {
    canonicalName: 'Preacher Curl',
    slug: 'preacher_curl',
    aliases: [
      'preacher curl',
      'scott curl',
      'curl scott',
      'panca scott',
      'curl su panca scott',
    ]
  },
  {
    canonicalName: 'Cable Curl',
    slug: 'cable_curl',
    aliases: [
      'curl ai cavi',
      'cable curl',
      'biceps cable curl',
      'curl cavo basso',
    ]
  },
  {
    canonicalName: 'Triceps Pushdown',
    slug: 'triceps_pushdown',
    aliases: [
      'pushdown tricipiti',
      'triceps pushdown',
      'cavo tricipiti',
      'push down',
      'spinte tricipiti al cavo',
    ]
  },
  {
    canonicalName: 'Rope Pushdown',
    slug: 'rope_pushdown',
    aliases: [
      'pushdown corda',
      'rope pushdown',
      'triceps rope pushdown',
      'corda tricipiti',
    ]
  },
  {
    canonicalName: 'Skull Crusher',
    slug: 'skull_crusher',
    aliases: [
      'skull crusher',
      'french press',
      'estensioni tricipiti sdraiato',
      'french press bilanciere',
      'estensioni sopra fronte',
    ]
  },
  {
    canonicalName: 'Overhead Triceps Extension',
    slug: 'overhead_triceps_extension',
    aliases: [
      'estensioni tricipiti sopra testa',
      'overhead triceps extension',
      'triceps overhead extension',
      'french press manubrio sopra testa',
    ]
  },
  {
    canonicalName: 'Dips',
    slug: 'dips',
    aliases: [
      'dips',
      'dip',
      'parallele',
      'dip alle parallele',
      'triceps dips',
    ]
  },
  {
    canonicalName: 'Crunch',
    slug: 'crunch',
    aliases: [
      'crunch',
      'crunch addominali',
      'addominali crunch',
    ]
  },
  {
    canonicalName: 'Cable Crunch',
    slug: 'cable_crunch',
    aliases: [
      'cable crunch',
      'crunch al cavo',
      'addominali al cavo',
    ]
  },
  {
    canonicalName: 'Leg Raise',
    slug: 'leg_raise',
    aliases: [
      'leg raise',
      'raises gambe',
      'sollevamento gambe',
      'alzate gambe',
    ]
  },
  {
    canonicalName: 'Hanging Leg Raise',
    slug: 'hanging_leg_raise',
    aliases: [
      'hanging leg raise',
      'leg raise alla sbarra',
      'alzate gambe appeso',
      'sollevamento gambe alla sbarra',
    ]
  },
  {
    canonicalName: 'Plank',
    slug: 'plank',
    aliases: [
      'plank',
      'plank addome',
      'tenuta plank',
    ]
  },
  {
    canonicalName: 'Ab Wheel',
    slug: 'ab_wheel',
    aliases: [
      'ab wheel',
      'ruota addominale',
      'wheel rollout',
      'rollout addominali',
    ]
  },
  {
    canonicalName: 'Dip Machine',
    slug: 'assisted_dip_machine',
    aliases: [
      'dip assistiti',
      'assisted dips',
      'machine dips',
      'dip machine',
      'parallele assistite',
    ]
  },
  {
    canonicalName: 'Assisted Pull Up',
    slug: 'assisted_pull_up',
    aliases: [
      'trazioni assistite',
      'assisted pull up',
      'pull up assistiti',
      'assisted pullup',
    ]
  },
  {
    canonicalName: 'Smith Machine Squat',
    slug: 'smith_machine_squat',
    aliases: [
      'squat multipower',
      'smith squat',
      'smith machine squat',
      'squat smith machine',
      'squat al multipower',
    ]
  },
  {
    canonicalName: 'Smith Bench Press',
    slug: 'smith_machine_bench_press',
    aliases: [
      'panca multipower',
      'smith bench press',
      'bench press multipower',
      'panca al multipower',
    ]
  },
  {
    canonicalName: 'Machine Shoulder Press',
    slug: 'machine_shoulder_press',
    aliases: [
      'shoulder press machine',
      'macchina shoulder press',
      'press spalle macchina',
      'military press machine',
    ]
  },
  {
    canonicalName: 'Machine Lateral Raise',
    slug: 'machine_lateral_raise',
    aliases: [
      'alzate laterali macchina',
      'lateral raise machine',
      'machine lateral raise',
      'macchina deltoidi laterali',
    ]
  },
];
