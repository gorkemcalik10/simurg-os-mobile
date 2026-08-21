(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.SimurgExerciseLibrary=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const rows=[
    ['barbell_bench_press','Barbell Bench Press','Chest','Chest',['Triceps','Front Delts'],'Barbell','Compound','Intermediate',['bench press','barbell press','bench pres','barbell bench','bench press barbell']],
    ['incline_barbell_bench_press','Incline Barbell Bench Press','Chest','Upper Chest',['Triceps','Front Delts'],'Barbell','Compound','Intermediate',['incline bench','incline press','eğimli bench press','üst göğüs barbell']],
    ['decline_barbell_bench_press','Decline Barbell Bench Press','Chest','Lower Chest',['Triceps','Front Delts'],'Barbell','Compound','Intermediate',['decline bench','decline press','alt göğüs barbell']],
    ['flat_dumbbell_press','Flat Dumbbell Press','Chest','Chest',['Triceps','Front Delts'],'Dumbbells','Compound','Beginner',['flat db press','dumbbell bench press','dambıl bench','düz dambıl press']],
    ['incline_dumbbell_press','Incline Dumbbell Press','Chest','Upper Chest',['Triceps','Front Delts'],'Dumbbells','Compound','Beginner',['incline db press','incline dumbbell bench','eğimli dambıl press','üst göğüs dambıl']],
    ['decline_dumbbell_press','Decline Dumbbell Press','Chest','Lower Chest',['Triceps','Front Delts'],'Dumbbells','Compound','Intermediate',['decline db press','alt göğüs dambıl']],
    ['machine_chest_press','Machine Chest Press','Chest','Chest',['Triceps','Front Delts'],'Machine','Compound','Beginner',['chest press machine','göğüs press makinesi','makine chest press']],
    ['incline_machine_press','Incline Machine Press','Chest','Upper Chest',['Triceps','Front Delts'],'Machine','Compound','Beginner',['incline chest press machine','üst göğüs makinesi','eğimli makine press']],
    ['hammer_strength_chest_press','Hammer Strength Chest Press','Chest','Chest',['Triceps','Front Delts'],'Plate-loaded Machine','Compound','Intermediate',['hammer chest press','plate loaded chest press','hammer göğüs press']],
    ['cable_fly','Cable Fly','Chest','Chest',['Front Delts'],'Cable','Isolation','Beginner',['cable crossover','kablo fly','kablo açış','crossover']],
    ['low_to_high_cable_fly','Low to High Cable Fly','Chest','Upper Chest',['Front Delts'],'Cable','Isolation','Intermediate',['low high fly','alttan üste cable fly','üst göğüs crossover']],
    ['high_to_low_cable_fly','High to Low Cable Fly','Chest','Lower Chest',[],'Cable','Isolation','Intermediate',['high low fly','üstten alta cable fly','alt göğüs crossover']],
    ['pec_deck_fly','Pec Deck Fly','Chest','Chest',[],'Machine','Isolation','Beginner',['pec deck','butterfly machine','kelebek makinesi','göğüs açış makinesi']],
    ['push_up','Push-Up','Chest','Chest',['Triceps','Front Delts'],'Bodyweight','Compound','Beginner',['pushup','şınav','sinav']],

    ['lat_pulldown','Lat Pulldown','Back','Lats',['Biceps','Rear Delts'],'Cable','Compound','Beginner',['lat pull down','lat çekiş','öne çekiş','pulldown']],
    ['close_grip_lat_pulldown','Close-Grip Lat Pulldown','Back','Lats',['Biceps','Mid Back'],'Cable','Compound','Beginner',['close grip pulldown','dar tutuş lat pulldown','dar çekiş']],
    ['single_arm_lat_pulldown','Single-Arm Lat Pulldown','Back','Lats',['Biceps'],'Cable','Compound','Intermediate',['single arm pulldown','tek kol lat pulldown','tek kol çekiş']],
    ['assisted_pull_up','Assisted Pull-Up','Back','Lats',['Biceps','Mid Back'],'Machine','Compound','Beginner',['assisted chin up','yardımlı barfiks','barfiks makinesi']],
    ['pull_up','Pull-Up','Back','Lats',['Biceps','Mid Back'],'Bodyweight','Compound','Intermediate',['pullup','barfiks','wide grip pull up']],
    ['chin_up','Chin-Up','Back','Lats',['Biceps'],'Bodyweight','Compound','Intermediate',['chinup','ters tutuş barfiks']],
    ['seated_cable_row','Seated Cable Row','Back','Mid Back',['Lats','Biceps','Rear Delts'],'Cable','Compound','Beginner',['cable row','oturarak cable row','kablo row','seated row']],
    ['close_grip_cable_row','Close-Grip Cable Row','Back','Mid Back',['Lats','Biceps'],'Cable','Compound','Beginner',['v bar row','dar tutuş cable row','dar row']],
    ['wide_grip_cable_row','Wide-Grip Cable Row','Back','Upper Back',['Rear Delts','Biceps'],'Cable','Compound','Intermediate',['wide cable row','geniş tutuş cable row','geniş row']],
    ['single_arm_cable_row','Single-Arm Cable Row','Back','Lats',['Biceps','Mid Back'],'Cable','Compound','Intermediate',['one arm cable row','tek kol cable row','tek kol kablo çekiş']],
    ['chest_supported_dumbbell_row','Chest-Supported Dumbbell Row','Back','Mid Back',['Lats','Biceps','Rear Delts'],'Dumbbells','Compound','Beginner',['bench supported db row','chest supported row','sehpada dambıl row']],
    ['one_arm_dumbbell_row','One-Arm Dumbbell Row','Back','Lats',['Biceps','Mid Back'],'Dumbbell','Compound','Beginner',['single arm db row','tek kol dambıl row','dumbbell row']],
    ['barbell_bent_over_row','Barbell Bent-Over Row','Back','Mid Back',['Lats','Biceps','Lower Back'],'Barbell','Compound','Intermediate',['barbell row','bent over row','barbell eğilerek row']],
    ['t_bar_row','T-Bar Row','Back','Mid Back',['Lats','Biceps','Rear Delts'],'Plate-loaded Machine','Compound','Intermediate',['tbar row','t bar çekiş','landmine row']],
    ['machine_row','Machine Row','Back','Mid Back',['Lats','Biceps'],'Machine','Compound','Beginner',['seated row machine','row makinesi','makine row']],
    ['hammer_strength_high_row','Hammer Strength High Row','Back','Upper Back',['Lats','Biceps','Rear Delts'],'Plate-loaded Machine','Compound','Intermediate',['high row machine','hammer high row','yüksek row makinesi']],
    ['straight_arm_pulldown','Straight-Arm Pulldown','Back','Lats',['Triceps'],'Cable','Isolation','Beginner',['cable pullover','düz kol pulldown','straight arm pull down']],
    ['dumbbell_pullover','Dumbbell Pullover','Back','Lats',['Chest'],'Dumbbell','Isolation','Intermediate',['db pullover','dambıl pullover','dambıl kazak']],
    ['back_extension','Back Extension','Back','Lower Back',['Glutes','Hamstrings'],'Bench','Isolation','Beginner',['hyperextension','bel extension','roman chair']],
    ['reverse_hyperextension','Reverse Hyperextension','Back','Lower Back',['Glutes','Hamstrings'],'Machine','Isolation','Intermediate',['reverse hyper','ters hiperekstansiyon']],

    ['seated_dumbbell_shoulder_press','Seated Dumbbell Shoulder Press','Shoulders','Front Delts',['Side Delts','Triceps'],'Dumbbells','Compound','Beginner',['seated db press','dumbbell shoulder press','oturarak dambıl omuz press']],
    ['standing_dumbbell_shoulder_press','Standing Dumbbell Shoulder Press','Shoulders','Front Delts',['Side Delts','Triceps','Core'],'Dumbbells','Compound','Intermediate',['standing db press','ayakta dambıl omuz press']],
    ['machine_shoulder_press','Machine Shoulder Press','Shoulders','Front Delts',['Side Delts','Triceps'],'Machine','Compound','Beginner',['shoulder press machine','omuz press makinesi']],
    ['barbell_overhead_press','Barbell Overhead Press','Shoulders','Front Delts',['Side Delts','Triceps','Core'],'Barbell','Compound','Intermediate',['overhead press','military press','barbell shoulder press','askeri press']],
    ['arnold_press','Arnold Press','Shoulders','Front Delts',['Side Delts','Triceps'],'Dumbbells','Compound','Intermediate',['arnold dumbbell press','arnold omuz press']],
    ['dumbbell_lateral_raise','Dumbbell Lateral Raise','Shoulders','Side Delts',['Traps'],'Dumbbells','Isolation','Beginner',['lateral raise','side raise','yana açış','dambıl yana açış']],
    ['cable_lateral_raise','Cable Lateral Raise','Shoulders','Side Delts',[],'Cable','Isolation','Beginner',['single arm cable lateral','kablo yana açış','cable side raise']],
    ['machine_lateral_raise','Machine Lateral Raise','Shoulders','Side Delts',[],'Machine','Isolation','Beginner',['lateral raise machine','yana açış makinesi']],
    ['dumbbell_front_raise','Dumbbell Front Raise','Shoulders','Front Delts',[],'Dumbbells','Isolation','Beginner',['front raise','öne açış','dambıl öne kaldırış']],
    ['reverse_pec_deck','Reverse Pec Deck','Shoulders','Rear Delts',['Upper Back'],'Machine','Isolation','Beginner',['reverse fly machine','ters kelebek','arka omuz makinesi']],
    ['rear_delt_cable_fly','Rear-Delt Cable Fly','Shoulders','Rear Delts',['Upper Back'],'Cable','Isolation','Intermediate',['rear delt fly','arka omuz cable fly','kablo ters açış']],
    ['bent_over_dumbbell_reverse_fly','Bent-Over Dumbbell Reverse Fly','Shoulders','Rear Delts',['Upper Back'],'Dumbbells','Isolation','Intermediate',['bent over reverse fly','dambıl arka omuz açış']],
    ['face_pull','Face Pull','Shoulders','Rear Delts',['Rotator Cuff','Upper Back'],'Cable','Isolation','Beginner',['cable face pull','yüze çekiş','ip face pull']],
    ['prone_y_raise','Prone Y Raise','Shoulders','Lower Traps',['Rear Delts','Rotator Cuff'],'Bench','Isolation','Intermediate',['y raise','prone y','y kaldırış','omuz stabilizasyon']],
    ['dumbbell_shrug','Dumbbell Shrug','Shoulders','Traps',[],'Dumbbells','Isolation','Beginner',['shrug','dambıl shrug','omuz silkme']],

    ['barbell_curl','Barbell Curl','Biceps','Biceps',['Forearms'],'Barbell','Isolation','Beginner',['standing barbell curl','barbell biceps curl','barbell kol curl']],
    ['ez_bar_curl','EZ-Bar Curl','Biceps','Biceps',['Forearms'],'EZ Bar','Isolation','Beginner',['ez curl','ez bar biceps','z bar curl']],
    ['dumbbell_curl','Dumbbell Curl','Biceps','Biceps',['Forearms'],'Dumbbells','Isolation','Beginner',['db curl','dambıl curl','dambıl biceps']],
    ['alternating_dumbbell_curl','Alternating Dumbbell Curl','Biceps','Biceps',['Forearms'],'Dumbbells','Isolation','Beginner',['alternating curl','sıralı dambıl curl']],
    ['incline_dumbbell_curl','Incline Dumbbell Curl','Biceps','Biceps',['Forearms'],'Dumbbells','Isolation','Intermediate',['incline db curl','eğimli dambıl curl']],
    ['hammer_curl','Hammer Curl','Biceps','Brachialis',['Biceps','Forearms'],'Dumbbells','Isolation','Beginner',['dumbbell hammer curl','çekiç curl','hammer biceps']],
    ['preacher_curl','Preacher Curl','Biceps','Biceps',['Forearms'],'Machine / EZ Bar','Isolation','Beginner',['scott curl','preacher machine','scott sehpası curl']],
    ['cable_curl','Cable Curl','Biceps','Biceps',['Forearms'],'Cable','Isolation','Beginner',['standing cable curl','kablo curl','cable biceps']],
    ['reverse_cable_curl','Reverse Cable Curl','Biceps','Forearms',['Brachialis','Biceps'],'Cable','Isolation','Intermediate',['reverse curl','ters tutuş cable curl','ön kol cable curl']],

    ['rope_pushdown','Rope Pushdown','Triceps','Triceps',[],'Cable','Isolation','Beginner',['triceps rope pushdown','ip pushdown','rope triceps']],
    ['straight_bar_pushdown','Straight-Bar Pushdown','Triceps','Triceps',[],'Cable','Isolation','Beginner',['bar pushdown','düz bar triceps','cable pushdown']],
    ['reverse_grip_pushdown','Reverse-Grip Pushdown','Triceps','Triceps',['Forearms'],'Cable','Isolation','Intermediate',['underhand pushdown','ters tutuş pushdown']],
    ['overhead_rope_extension','Overhead Rope Extension','Triceps','Triceps',[],'Cable','Isolation','Beginner',['overhead cable triceps','baş üstü ip triceps']],
    ['single_arm_cable_triceps_extension','Single-Arm Cable Triceps Extension','Triceps','Triceps',[],'Cable','Isolation','Beginner',['one arm pushdown','tek kol cable triceps']],
    ['dumbbell_overhead_triceps_extension','Dumbbell Overhead Triceps Extension','Triceps','Triceps',[],'Dumbbell','Isolation','Beginner',['db overhead extension','dambıl baş üstü triceps']],
    ['skull_crusher','EZ-Bar Skull Crusher','Triceps','Triceps',[],'EZ Bar','Isolation','Intermediate',['lying triceps extension','skullcrusher','alna triceps']],
    ['close_grip_bench_press','Close-Grip Bench Press','Triceps','Triceps',['Chest','Front Delts'],'Barbell','Compound','Intermediate',['narrow bench press','dar tutuş bench press']],
    ['assisted_dip','Assisted Dip','Triceps','Triceps',['Chest','Front Delts'],'Machine','Compound','Beginner',['dip machine','yardımlı dips','assisted dips']],

    ['back_squat','Barbell Back Squat','Legs','Quadriceps',['Glutes','Hamstrings','Core'],'Barbell','Compound','Intermediate',['back squat','barbell squat','çömelme','barbell squat']],
    ['front_squat','Front Squat','Legs','Quadriceps',['Glutes','Core'],'Barbell','Compound','Advanced',['barbell front squat','ön squat']],
    ['goblet_squat','Goblet Squat','Legs','Quadriceps',['Glutes','Core'],'Dumbbell','Compound','Beginner',['dumbbell goblet squat','kadeh squat','dambıl squat']],
    ['hack_squat','Hack Squat','Legs','Quadriceps',['Glutes','Hamstrings'],'Machine','Compound','Intermediate',['hack squat machine','hack squat makinesi']],
    ['leg_press','Leg Press','Legs','Quadriceps',['Glutes','Hamstrings'],'Machine','Compound','Beginner',['45 degree leg press','bacak press','leg press makinesi']],
    ['horizontal_leg_press','Horizontal Leg Press','Legs','Quadriceps',['Glutes','Hamstrings'],'Machine','Compound','Beginner',['seated leg press','yatay leg press']],
    ['leg_extension','Leg Extension','Legs','Quadriceps',[],'Machine','Isolation','Beginner',['knee extension','bacak açma','ön bacak makinesi']],
    ['dumbbell_lunge','Dumbbell Lunge','Legs','Quadriceps',['Glutes','Hamstrings'],'Dumbbells','Compound','Intermediate',['db lunge','dambıl lunge','öne adım']],
    ['walking_lunge','Walking Lunge','Legs','Quadriceps',['Glutes','Hamstrings'],'Dumbbells','Compound','Intermediate',['walking dumbbell lunge','yürüyüş lunge']],
    ['reverse_lunge','Reverse Lunge','Legs','Quadriceps',['Glutes','Hamstrings'],'Dumbbells','Compound','Intermediate',['backward lunge','geriye lunge']],
    ['bulgarian_split_squat','Bulgarian Split Squat','Legs','Quadriceps',['Glutes','Hamstrings'],'Dumbbells','Compound','Intermediate',['bulgarian squat','rear foot elevated split squat','bulgar split squat']],
    ['step_up','Dumbbell Step-Up','Legs','Quadriceps',['Glutes','Hamstrings'],'Dumbbells / Box','Compound','Intermediate',['step up','kutuya çıkış','dambıl step up']],
    ['smith_machine_squat','Smith Machine Squat','Legs','Quadriceps',['Glutes','Hamstrings'],'Smith Machine','Compound','Beginner',['smith squat','smith makine squat']],

    ['romanian_deadlift','Romanian Deadlift','Glutes & Hamstrings','Hamstrings',['Glutes','Lower Back'],'Barbell','Compound','Intermediate',['rdl','barbell romanian deadlift','romen deadlift']],
    ['dumbbell_romanian_deadlift','Dumbbell Romanian Deadlift','Glutes & Hamstrings','Hamstrings',['Glutes','Lower Back'],'Dumbbells','Compound','Beginner',['dumbbell rdl','db rdl','dambıl romen deadlift']],
    ['conventional_deadlift','Conventional Deadlift','Glutes & Hamstrings','Glutes',['Hamstrings','Lower Back','Traps'],'Barbell','Compound','Advanced',['deadlift','klasik deadlift','yerden çekiş']],
    ['sumo_deadlift','Sumo Deadlift','Glutes & Hamstrings','Glutes',['Hamstrings','Adductors','Lower Back'],'Barbell','Compound','Advanced',['sumo deadlift barbell','sumo yerden çekiş']],
    ['hip_thrust','Barbell Hip Thrust','Glutes & Hamstrings','Glutes',['Hamstrings'],'Barbell','Compound','Intermediate',['hip thrust','kalça itiş','barbell kalça']],
    ['machine_hip_thrust','Machine Hip Thrust','Glutes & Hamstrings','Glutes',['Hamstrings'],'Machine','Compound','Beginner',['hip thrust machine','kalça itiş makinesi']],
    ['glute_bridge','Glute Bridge','Glutes & Hamstrings','Glutes',['Hamstrings'],'Bodyweight / Barbell','Compound','Beginner',['floor hip bridge','kalça köprüsü']],
    ['seated_leg_curl','Seated Leg Curl','Glutes & Hamstrings','Hamstrings',[],'Machine','Isolation','Beginner',['seated hamstring curl','oturarak arka bacak']],
    ['lying_leg_curl','Lying Leg Curl','Glutes & Hamstrings','Hamstrings',[],'Machine','Isolation','Beginner',['prone leg curl','yatarak arka bacak']],
    ['single_leg_curl','Single-Leg Curl','Glutes & Hamstrings','Hamstrings',[],'Machine','Isolation','Intermediate',['one leg curl','tek bacak curl']],
    ['cable_pull_through','Cable Pull-Through','Glutes & Hamstrings','Glutes',['Hamstrings'],'Cable','Compound','Intermediate',['pull through','kablo kalça çekiş']],
    ['cable_glute_kickback','Cable Glute Kickback','Glutes & Hamstrings','Glutes',['Hamstrings'],'Cable','Isolation','Beginner',['glute kickback','kablo kalça tekme']],

    ['standing_calf_raise','Standing Calf Raise','Calves','Calves',[],'Machine','Isolation','Beginner',['calf raise machine','ayakta calf','baldır kaldırış']],
    ['seated_calf_raise','Seated Calf Raise','Calves','Calves',[],'Machine','Isolation','Beginner',['oturarak calf','seated calf machine']],
    ['leg_press_calf_raise','Leg Press Calf Raise','Calves','Calves',[],'Machine','Isolation','Beginner',['calf press','leg press baldır']],
    ['smith_machine_calf_raise','Smith Machine Calf Raise','Calves','Calves',[],'Smith Machine','Isolation','Beginner',['smith calf raise','smith baldır']],
    ['single_leg_calf_raise','Single-Leg Calf Raise','Calves','Calves',[],'Bodyweight / Dumbbell','Isolation','Intermediate',['one leg calf raise','tek bacak baldır']],

    ['cable_crunch','Cable Crunch','Core','Abs',[],'Cable','Isolation','Beginner',['kneeling cable crunch','kablo mekik']],
    ['machine_crunch','Ab Crunch Machine','Core','Abs',[],'Machine','Isolation','Beginner',['abdominal machine','karın makinesi','mekik makinesi']],
    ['plank','Plank','Core','Abs',['Obliques','Lower Back'],'Bodyweight','Isometric','Beginner',['front plank','dirsek plank']],
    ['side_plank','Side Plank','Core','Obliques',['Abs'],'Bodyweight','Isometric','Beginner',['yan plank','lateral plank']],
    ['dead_bug','Dead Bug','Core','Abs',['Hip Flexors'],'Bodyweight','Stability','Beginner',['deadbug','ölü böcek']],
    ['bird_dog','Bird Dog','Core','Lower Back',['Abs','Glutes'],'Bodyweight','Stability','Beginner',['bird-dog','kuş köpek']],
    ['hanging_knee_raise','Hanging Knee Raise','Core','Abs',['Hip Flexors'],'Pull-Up Bar','Isolation','Intermediate',['hanging leg raise bent knee','asılı diz çekiş']],
    ['captains_chair_leg_raise','Captain Chair Leg Raise','Core','Abs',['Hip Flexors'],'Machine','Isolation','Intermediate',['vertical knee raise','diz çekme istasyonu']],
    ['pallof_press','Pallof Press','Core','Obliques',['Abs'],'Cable','Stability','Beginner',['anti rotation press','pallof cable','kablo anti rotasyon']],
    ['russian_twist','Russian Twist','Core','Obliques',['Abs'],'Bodyweight / Plate','Rotation','Intermediate',['rus dönüşü','russian twist plate']],

    ['farmers_walk','Farmer\'s Walk','Full Body','Forearms',['Traps','Core','Glutes'],'Dumbbells','Carry','Intermediate',['farmer carry','çiftçi yürüyüşü','dumbbell carry']],
    ['sled_push','Sled Push','Full Body','Quadriceps',['Glutes','Calves','Core'],'Sled','Conditioning','Intermediate',['prowler push','kızak itiş']],
    ['kettlebell_swing','Kettlebell Swing','Full Body','Glutes',['Hamstrings','Core','Shoulders'],'Kettlebell','Ballistic','Intermediate',['kb swing','kettlebell salınım']],
    ['battle_rope','Battle Rope','Full Body','Shoulders',['Arms','Core'],'Battle Ropes','Conditioning','Beginner',['battle ropes','halat çalışması']],
    ['dumbbell_thruster','Dumbbell Thruster','Full Body','Quadriceps',['Glutes','Shoulders','Triceps','Core'],'Dumbbells','Compound','Intermediate',['db thruster','dambıl thruster','squat press']]
  ];

  const normalize=value=>String(value||'').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/[^a-z0-9]+/g,' ').trim();
  const exercises=rows.map(row=>Object.freeze({
    id:row[0],name:row[1],category:row[2],primaryMuscle:row[3],secondaryMuscles:Object.freeze(row[4].slice()),
    equipment:row[5],movementType:row[6],difficulty:row[7],aliases:Object.freeze(row[8].slice())
  }));
  const categories=Object.freeze([...new Set(exercises.map(item=>item.category))]);
  const searchIndex=new Map(exercises.map(item=>[item.id,normalize([item.name,item.category,item.primaryMuscle,item.equipment,...item.aliases].join(' '))]));

  function query(options){
    const opts=options||{};
    const term=normalize(opts.search);
    const tokens=term?term.split(' '):[];
    const category=String(opts.category||'All');
    return exercises.filter(item=>(category==='All'||item.category===category)&&tokens.every(token=>searchIndex.get(item.id).includes(token)));
  }
  function getById(id){return exercises.find(item=>item.id===id)||null;}

  return Object.freeze({version:1,exercises:Object.freeze(exercises),categories,query,getById,normalize});
});
