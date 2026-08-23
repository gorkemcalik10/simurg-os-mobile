(function(root,factory){
  'use strict';
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SimurgMuscleAnatomy=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  var HIGH_LEVEL_GROUPS=Object.freeze(['Chest','Back','Shoulders','Arms','Legs','Core']);
  var MUSCLE_ROWS=[
    ['pectoralis_major_clavicular','Chest','Pectoralis Major Clavicular'],['pectoralis_major_sternal','Chest','Pectoralis Major Sternal'],['pectoralis_minor','Chest','Pectoralis Minor'],
    ['latissimus_dorsi','Back','Latissimus Dorsi'],['trapezius_upper','Back','Trapezius Upper'],['trapezius_middle','Back','Trapezius Middle'],['trapezius_lower','Back','Trapezius Lower'],['rhomboid_major','Back','Rhomboid Major'],['teres_major','Back','Teres Major'],
    ['anterior_deltoid','Shoulders','Anterior Deltoid'],['lateral_deltoid','Shoulders','Lateral Deltoid'],['posterior_deltoid','Shoulders','Posterior Deltoid'],
    ['biceps_brachii','Arms','Biceps Brachii'],['brachialis','Arms','Brachialis'],['triceps_long_head','Arms','Triceps Long Head'],['triceps_lateral_head','Arms','Triceps Lateral Head'],['triceps_medial_head','Arms','Triceps Medial Head'],
    ['rectus_femoris','Legs','Rectus Femoris'],['vastus_lateralis','Legs','Vastus Lateralis'],['vastus_medialis','Legs','Vastus Medialis'],['hamstring_biceps_femoris','Legs','Biceps Femoris'],['hamstring_semitendinosus','Legs','Semitendinosus'],['hamstring_semimembranosus','Legs','Semimembranosus'],['gluteus_maximus','Legs','Gluteus Maximus'],['gluteus_medius','Legs','Gluteus Medius'],['gastrocnemius','Legs','Gastrocnemius'],['soleus','Legs','Soleus'],
    ['rectus_abdominis','Core','Rectus Abdominis'],['obliques','Core','Obliques'],['external_oblique','Core','External Oblique'],['internal_oblique','Core','Internal Oblique'],['transverse_abdominis','Core','Transverse Abdominis']
  ];
  var MUSCLES=Object.freeze(MUSCLE_ROWS.map(function(row){return Object.freeze({id:row[0],highLevelGroup:row[1],label:row[2]})}));
  var MUSCLE_MAP=Object.freeze(MUSCLES.reduce(function(map,muscle){map[muscle.id]=muscle;return map},Object.create(null)));
  var FRONT_VISUAL_MUSCLES=['pectoralis_major_clavicular','pectoralis_major_sternal','pectoralis_minor','anterior_deltoid','lateral_deltoid','biceps_brachii','brachialis','rectus_femoris','vastus_lateralis','vastus_medialis','rectus_abdominis','obliques','external_oblique','internal_oblique','transverse_abdominis'];
  var VISUAL_REGION_MAP=Object.freeze(MUSCLES.reduce(function(map,muscle){
    map[muscle.id]=Object.freeze({muscleId:muscle.id,regionId:muscle.id,view:FRONT_VISUAL_MUSCLES.indexOf(muscle.id)>=0?'front':'back'});return map;
  },Object.create(null)));
  var PRIMARY_WEIGHT=1,SECONDARY_WEIGHT=0.5;
  var exerciseMappings=Object.create(null);

  function contribution(muscleId,weight){
    if(!MUSCLE_MAP[muscleId])throw new Error('Unknown anatomical muscle: '+muscleId);
    return Object.freeze({muscleId:muscleId,weight:weight});
  }
  function normalizeContribution(item,defaultWeight){
    var muscleId=typeof item==='string'?item:item&&item.muscleId;
    var candidate=typeof item==='object'&&item&&item.weight!=null?Number(item.weight):defaultWeight;
    if(!MUSCLE_MAP[muscleId]||!Number.isFinite(candidate)||candidate<0||candidate>1)return null;
    return contribution(muscleId,candidate);
  }
  function normalizeMapping(value){
    if(!value||!Array.isArray(value.primaryMuscles))return null;
    var primary=value.primaryMuscles.map(function(item){return normalizeContribution(item,PRIMARY_WEIGHT)}).filter(Boolean);
    var secondary=(Array.isArray(value.secondaryMuscles)?value.secondaryMuscles:[]).map(function(item){return normalizeContribution(item,SECONDARY_WEIGHT)}).filter(Boolean);
    if(!primary.length)return null;
    return Object.freeze({primaryMuscles:Object.freeze(primary),secondaryMuscles:Object.freeze(secondary)});
  }
  function define(ids,primary,secondary){
    var mapping=Object.freeze({
      primaryMuscles:Object.freeze(primary.map(function(id){return contribution(id,PRIMARY_WEIGHT)})),
      secondaryMuscles:Object.freeze((secondary||[]).map(function(id){return contribution(id,SECONDARY_WEIGHT)}))
    });
    ids.forEach(function(id){exerciseMappings[id]=mapping});
  }

  define(['barbell_bench_press','flat_dumbbell_press','machine_chest_press','hammer_strength_chest_press','push_up'],
    ['pectoralis_major_sternal'],['anterior_deltoid','triceps_long_head','triceps_lateral_head','triceps_medial_head']);
  define(['incline_barbell_bench_press','incline_dumbbell_press','incline_machine_press'],
    ['pectoralis_major_clavicular'],['anterior_deltoid','triceps_long_head','triceps_lateral_head','triceps_medial_head']);
  define(['decline_barbell_bench_press','decline_dumbbell_press'],
    ['pectoralis_major_sternal'],['triceps_long_head','triceps_lateral_head','triceps_medial_head']);
  define(['cable_fly','pec_deck_fly'],['pectoralis_major_sternal'],[]);
  define(['low_to_high_cable_fly'],['pectoralis_major_clavicular'],['anterior_deltoid']);
  define(['high_to_low_cable_fly'],['pectoralis_major_sternal'],[]);

  define(['lat_pulldown','close_grip_lat_pulldown','single_arm_lat_pulldown','assisted_pull_up','pull_up','chin_up','straight_arm_pulldown'],
    ['latissimus_dorsi'],['teres_major','biceps_brachii','brachialis','posterior_deltoid']);
  define(['seated_cable_row','close_grip_cable_row','single_arm_cable_row','chest_supported_dumbbell_row','one_arm_dumbbell_row','barbell_bent_over_row','t_bar_row','machine_row'],
    ['latissimus_dorsi','rhomboid_major'],['trapezius_middle','posterior_deltoid','biceps_brachii','brachialis']);
  define(['wide_grip_cable_row','hammer_strength_high_row'],
    ['rhomboid_major','trapezius_middle'],['latissimus_dorsi','posterior_deltoid','biceps_brachii','brachialis']);
  define(['dumbbell_pullover'],['latissimus_dorsi','teres_major'],['pectoralis_major_sternal']);

  define(['seated_dumbbell_shoulder_press','standing_dumbbell_shoulder_press','machine_shoulder_press','barbell_overhead_press','arnold_press'],
    ['anterior_deltoid'],['lateral_deltoid','triceps_long_head','triceps_lateral_head','triceps_medial_head']);
  define(['dumbbell_lateral_raise','cable_lateral_raise','machine_lateral_raise'],['lateral_deltoid'],['trapezius_upper']);
  define(['dumbbell_front_raise'],['anterior_deltoid'],[]);
  define(['reverse_pec_deck','rear_delt_cable_fly','bent_over_dumbbell_reverse_fly'],['posterior_deltoid'],['rhomboid_major','trapezius_middle']);
  define(['face_pull'],['posterior_deltoid'],['trapezius_middle','trapezius_lower','rhomboid_major']);
  define(['prone_y_raise'],['trapezius_lower'],['posterior_deltoid']);
  define(['dumbbell_shrug'],['trapezius_upper'],[]);

  define(['barbell_curl','ez_bar_curl','dumbbell_curl','alternating_dumbbell_curl','incline_dumbbell_curl','preacher_curl','cable_curl'],['biceps_brachii'],['brachialis']);
  define(['hammer_curl','reverse_cable_curl'],['brachialis'],['biceps_brachii']);
  define(['rope_pushdown','straight_bar_pushdown','reverse_grip_pushdown','single_arm_cable_triceps_extension'],
    ['triceps_lateral_head','triceps_medial_head'],['triceps_long_head']);
  define(['overhead_rope_extension','dumbbell_overhead_triceps_extension','skull_crusher'],
    ['triceps_long_head'],['triceps_lateral_head','triceps_medial_head']);
  define(['close_grip_bench_press','assisted_dip'],
    ['triceps_long_head','triceps_lateral_head','triceps_medial_head'],['pectoralis_major_sternal','anterior_deltoid']);

  define(['back_squat','front_squat','goblet_squat','hack_squat','leg_press','horizontal_leg_press','dumbbell_lunge','walking_lunge','reverse_lunge','bulgarian_split_squat','step_up','smith_machine_squat'],
    ['rectus_femoris','vastus_lateralis','vastus_medialis'],['gluteus_maximus','gluteus_medius','hamstring_biceps_femoris','hamstring_semitendinosus','hamstring_semimembranosus']);
  define(['leg_extension'],['rectus_femoris','vastus_lateralis','vastus_medialis'],[]);
  define(['romanian_deadlift','dumbbell_romanian_deadlift'],
    ['hamstring_biceps_femoris','hamstring_semitendinosus','hamstring_semimembranosus'],['gluteus_maximus']);
  define(['hip_thrust','machine_hip_thrust','glute_bridge','cable_pull_through','cable_glute_kickback'],
    ['gluteus_maximus'],['gluteus_medius','hamstring_biceps_femoris','hamstring_semitendinosus','hamstring_semimembranosus']);
  define(['seated_leg_curl','lying_leg_curl','single_leg_curl'],
    ['hamstring_biceps_femoris','hamstring_semitendinosus','hamstring_semimembranosus'],[]);
  define(['standing_calf_raise','leg_press_calf_raise','smith_machine_calf_raise','single_leg_calf_raise'],['gastrocnemius'],['soleus']);
  define(['seated_calf_raise'],['soleus'],['gastrocnemius']);

  define(['cable_crunch','machine_crunch'],['rectus_abdominis'],[]);
  define(['plank','dead_bug'],['rectus_abdominis'],['obliques','transverse_abdominis']);
  define(['side_plank','pallof_press','russian_twist'],['obliques'],['transverse_abdominis','rectus_abdominis']);
  define(['hanging_knee_raise','captains_chair_leg_raise'],['rectus_abdominis'],['transverse_abdominis']);

  exerciseMappings=Object.freeze(exerciseMappings);

  function mappingFrom(value){
    if(!value)return null;
    if(Array.isArray(value.primaryMuscles))return normalizeMapping(value);
    if(typeof value==='string')return exerciseMappings[value]||null;
    return exerciseMappings[value.id]||exerciseMappings[value.metadataSourceId]||null;
  }
  function visualRegionFrom(muscleId){return VISUAL_REGION_MAP[muscleId]||null}
  function calculateEffectiveWorkload(exerciseOrMapping,sets){
    var mapping=mappingFrom(exerciseOrMapping),setCount=Number(sets);
    if(!mapping||!Number.isFinite(setCount)||setCount<0)return {mapped:false,sets:Number.isFinite(setCount)&&setCount>=0?setCount:0,muscles:[],muscleMap:Object.create(null),highLevelGroups:Object.create(null)};
    var muscles=[],muscleMap=Object.create(null),highLevelGroups=Object.create(null);
    ['primaryMuscles','secondaryMuscles'].forEach(function(field){
      var role=field==='primaryMuscles'?'primary':'secondary';
      (mapping[field]||[]).forEach(function(item){
        var metadata=MUSCLE_MAP[item.muscleId];if(!metadata)return;
        var effectiveSets=setCount*item.weight,entry={muscleId:item.muscleId,highLevelGroup:metadata.highLevelGroup,role:role,weight:item.weight,effectiveSets:effectiveSets};
        muscles.push(entry);muscleMap[item.muscleId]=entry;
        highLevelGroups[metadata.highLevelGroup]=Math.max(highLevelGroups[metadata.highLevelGroup]||0,effectiveSets);
      });
    });
    return {mapped:true,sets:setCount,muscles:muscles,muscleMap:muscleMap,highLevelGroups:highLevelGroups};
  }

  return Object.freeze({
    version:3,primaryWeight:PRIMARY_WEIGHT,secondaryWeight:SECONDARY_WEIGHT,
    highLevelGroups:HIGH_LEVEL_GROUPS,muscles:MUSCLES,muscleMap:MUSCLE_MAP,
    visualRegionMap:VISUAL_REGION_MAP,exerciseMappings:exerciseMappings,normalizeMapping:normalizeMapping,getExerciseMapping:mappingFrom,getVisualRegion:visualRegionFrom,calculateEffectiveWorkload:calculateEffectiveWorkload
  });
});
