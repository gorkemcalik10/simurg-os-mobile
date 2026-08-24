(function(root){
  'use strict';
  var GROUP_LABELS={Chest:'Göğüs',Back:'Sırt',Shoulders:'Omuz',Arms:'Kollar',Legs:'Bacak',Core:'Core'};
  var state={date:null,muscle:null,group:'Chest',exerciseId:null,memo:null};
  var VISUAL_REGIONS=[
    ['pectoralis_sternal','Chest','Pectoralis Sternal'],['pectoralis_clavicular','Chest','Pectoralis Clavicular'],
    ['abs','Core','Abs'],['obliques','Core','Obliques'],
    ['anterior_deltoid','Shoulders','Anterior Deltoid'],['middle_deltoid','Shoulders','Middle Deltoid'],['posterior_deltoid','Shoulders','Posterior Deltoid'],
    ['biceps','Arms','Biceps'],['forearms','Arms','Forearms'],['triceps_long','Arms','Triceps Long'],['triceps_lateral','Arms','Triceps Lateral'],
    ['quads','Legs','Quads'],['hip_flexors','Legs','Hip Flexors'],['adductors','Legs','Adductors'],['glutes','Legs','Glutes'],['hams','Legs','Hams'],['calves','Legs','Calves'],
    ['upper_traps','Back','Upper Traps'],['lower_traps','Back','Lower Traps'],['spinal_erectors','Back','Spinal Erectors'],['lats','Back','Lats'],['rotator_cuff','Back','Rotator Cuff']
  ].map(function(row){return {id:row[0],highLevelGroup:row[1],label:row[2]}});
  var VISUAL_REGION_MAP=VISUAL_REGIONS.reduce(function(map,item){map[item.id]=item;return map},Object.create(null));
  var CANONICAL_TO_VISUAL={
    pectoralis_major_sternal:'pectoralis_sternal',pectoralis_major_clavicular:'pectoralis_clavicular',pectoralis_minor:'pectoralis_sternal',
    rectus_abdominis:'abs',transverse_abdominis:'abs',obliques:'obliques',external_oblique:'obliques',internal_oblique:'obliques',
    anterior_deltoid:'anterior_deltoid',lateral_deltoid:'middle_deltoid',posterior_deltoid:'posterior_deltoid',
    biceps_brachii:'biceps',brachialis:'biceps',triceps_long_head:'triceps_long',triceps_lateral_head:'triceps_lateral',triceps_medial_head:'triceps_lateral',
    rectus_femoris:'quads',vastus_lateralis:'quads',vastus_medialis:'quads',
    hamstring_biceps_femoris:'hams',hamstring_semitendinosus:'hams',hamstring_semimembranosus:'hams',
    gluteus_maximus:'glutes',gluteus_medius:'glutes',gastrocnemius:'calves',soleus:'calves',
    trapezius_upper:'upper_traps',trapezius_middle:'lower_traps',trapezius_lower:'lower_traps',rhomboid_major:'lats',
    latissimus_dorsi:'lats',teres_major:'lats'
  };
  var REGION_PATHS={
    pectoralis_major_clavicular:'M153 359 C181 342 219 341 263 365 L263 401 C240 396 217 396 196 400 C177 403 160 410 148 419 C144 397 145 375 153 359 Z M277 365 C321 341 359 342 387 359 C395 375 396 397 392 419 C380 410 363 403 344 400 C323 396 300 396 277 401 Z',
    pectoralis_major_sternal:'M149 402 C181 389 221 389 263 399 L263 466 C244 474 222 476 200 471 C176 466 157 453 146 435 C143 423 144 411 149 402 Z M277 399 C319 389 359 389 391 402 C396 411 397 423 394 435 C383 453 364 466 340 471 C318 476 296 474 277 466 Z',
    pectoralis_minor:'M191 372 C214 358 239 363 260 382 L253 424 C229 420 208 411 190 394 Z M280 382 C301 363 326 358 349 372 L350 394 C332 411 311 420 287 424 Z',
    latissimus_dorsi:'M648 432 C674 420 704 432 726 454 C738 470 746 492 750 516 C748 555 741 594 728 625 C720 644 711 658 700 671 C682 650 666 621 651 587 C638 555 628 520 625 487 C625 463 633 444 648 432 Z M874 432 C848 420 818 432 796 454 C784 470 776 492 772 516 C774 555 781 594 794 625 C802 644 811 658 822 671 C840 650 856 621 871 587 C884 555 894 520 897 487 C897 463 889 444 874 432 Z',
    trapezius_upper:'M700 312 C724 291 747 304 761 347 C775 304 798 291 822 312 C811 354 791 382 761 401 C731 382 711 354 700 312 Z',
    trapezius_middle:'M701 387 C721 378 742 385 757 404 C760 420 760 440 757 458 C742 467 721 457 706 443 C696 432 691 414 694 399 C696 394 698 390 701 387 Z M821 387 C801 378 780 385 765 404 C762 420 762 440 765 458 C780 467 801 457 816 443 C826 432 831 414 828 399 C826 394 824 390 821 387 Z',
    trapezius_lower:'M716 431 C733 424 750 437 757 459 C760 486 760 523 758 558 C750 557 739 543 731 525 C721 500 715 465 716 431 Z M806 431 C789 424 772 437 765 459 C762 486 762 523 764 558 C772 557 783 543 791 525 C801 500 807 465 806 431 Z',
    rhomboid_major:'M704 405 C720 396 740 403 754 421 C758 438 758 459 754 480 C738 482 721 468 711 452 C703 438 700 419 704 405 Z M818 405 C802 396 782 403 768 421 C764 438 764 459 768 480 C784 482 801 468 811 452 C819 438 822 419 818 405 Z',
    teres_major:'M647 394 C669 386 692 395 705 416 C695 433 680 444 661 445 C646 431 641 411 647 394 Z M875 394 C853 386 830 395 817 416 C827 433 842 444 861 445 C876 431 881 411 875 394 Z',
    anterior_deltoid:'M135 329 C148 316 164 315 178 324 C184 338 183 353 177 367 C164 369 151 364 141 356 C135 348 133 338 135 329 Z M362 324 C376 315 392 316 405 329 C407 338 405 348 399 356 C389 364 376 369 363 367 C357 353 356 338 362 324 Z',
    lateral_deltoid:'M94 345 C106 319 130 307 154 309 C142 343 135 378 133 409 C111 410 96 392 91 369 Z M386 309 C410 307 434 319 446 345 L449 369 C444 392 429 410 407 409 C405 378 398 343 386 309 Z',
    posterior_deltoid:'M589 348 C612 312 650 302 684 320 C698 339 696 369 683 399 C650 409 620 399 596 381 Z M838 320 C872 302 910 312 933 348 L926 381 C902 399 872 409 839 399 C826 369 824 339 838 320 Z',
    biceps_brachii:'M106 428 C129 410 158 421 172 455 C168 500 156 541 138 577 C115 575 100 557 98 534 C99 491 101 456 106 428 Z M368 455 C382 421 411 410 434 428 C439 456 441 491 442 534 C440 557 425 575 402 577 C384 541 372 500 368 455 Z',
    brachialis:'M96 486 C108 476 121 481 130 499 L124 581 C109 590 94 578 91 558 Z M410 499 C419 481 432 476 444 486 L449 558 C446 578 431 590 416 581 Z',
    triceps_long_head:'M610 419 C632 414 651 430 660 457 C654 505 645 548 632 583 C615 579 604 564 604 542 Z M912 419 C890 414 871 430 862 457 C868 505 877 548 890 583 C907 579 918 564 918 542 Z',
    triceps_lateral_head:'M582 431 C600 414 618 426 626 452 L616 553 C601 566 582 554 576 532 Z M940 431 C922 414 904 426 896 452 L906 553 C921 566 940 554 946 532 Z',
    triceps_medial_head:'M603 526 C618 517 633 526 638 548 L628 607 C612 614 598 600 596 579 Z M919 526 C904 517 889 526 884 548 L894 607 C910 614 924 600 926 579 Z',
    rectus_femoris:'M201 713 C209 706 218 714 221 735 C223 774 222 817 220 859 C218 898 215 931 211 953 C208 964 202 962 199 950 C197 909 196 864 196 818 C196 772 198 733 201 713 Z M339 713 C331 706 322 714 319 735 C317 774 318 817 320 859 C322 898 325 931 329 953 C332 964 338 962 341 950 C343 909 344 864 344 818 C344 772 342 733 339 713 Z',
    vastus_lateralis:'M151 714 C163 702 179 703 191 718 C188 759 187 805 188 850 C190 895 191 932 190 960 C185 981 174 991 164 982 C153 956 147 921 144 882 C140 822 142 759 151 714 Z M389 714 C377 702 361 703 349 718 C352 759 353 805 352 850 C350 895 349 932 350 960 C355 981 366 991 376 982 C387 956 393 921 396 882 C400 822 398 759 389 714 Z',
    vastus_medialis:'M238 867 C246 856 255 863 258 879 C261 904 259 936 255 963 C252 981 247 990 241 988 C234 985 230 974 230 960 C231 936 232 910 233 888 C234 878 236 871 238 867 Z M302 867 C294 856 285 863 282 879 C279 904 281 936 285 963 C288 981 293 990 299 988 C306 985 310 974 310 960 C309 936 308 910 307 888 C306 878 304 871 302 867 Z',
    hamstring_biceps_femoris:'M637 723 C657 701 684 704 698 735 L691 982 C678 1011 653 1007 640 978 C624 887 623 794 637 723 Z M885 723 C865 701 838 704 824 735 L831 982 C844 1011 869 1007 882 978 C898 887 899 794 885 723 Z',
    hamstring_semitendinosus:'M698 722 C716 705 737 716 747 746 L738 985 C726 1011 706 1007 697 979 C687 887 687 794 698 722 Z M824 722 C806 705 785 716 775 746 L784 985 C796 1011 816 1007 825 979 C835 887 835 794 824 722 Z',
    hamstring_semimembranosus:'M724 733 C740 720 752 735 756 761 L747 966 C739 992 722 993 715 967 Z M798 733 C782 720 770 735 766 761 L775 966 C783 992 800 993 807 967 Z',
    gluteus_maximus:'M642 637 C678 612 724 617 757 650 L755 777 C716 799 671 783 643 747 Z M880 637 C844 612 798 617 765 650 L767 777 C806 799 851 783 879 747 Z',
    gluteus_medius:'M648 621 C680 602 719 606 750 631 L736 677 C701 663 672 665 644 682 Z M874 621 C842 602 803 606 772 631 L786 677 C821 663 850 665 878 682 Z',
    gastrocnemius:'M657 1015 C680 993 711 1003 728 1035 L719 1190 C702 1222 675 1216 661 1181 C646 1120 645 1061 657 1015 Z M865 1015 C842 993 811 1003 794 1035 L803 1190 C820 1222 847 1216 861 1181 C876 1120 877 1061 865 1015 Z',
    soleus:'M677 1137 C696 1124 716 1140 720 1168 L710 1270 C694 1291 674 1278 670 1251 Z M845 1137 C826 1124 806 1140 802 1168 L812 1270 C828 1291 848 1278 852 1251 Z',
    rectus_abdominis:'M216 468 C234 461 251 470 264 490 L264 688 C248 704 229 699 216 681 Z M276 490 C289 470 306 461 324 468 L324 681 C311 699 292 704 276 688 Z',
    obliques:'M177 481 C194 469 210 480 216 505 L220 601 L215 680 C201 700 182 686 175 660 C162 590 162 526 177 481 Z M363 481 C346 469 330 480 324 505 L320 601 L325 680 C339 700 358 686 365 660 C378 590 378 526 363 481 Z',
    external_oblique:'M177 481 C194 469 210 480 216 505 L216 675 C203 695 184 684 175 660 C162 590 162 526 177 481 Z M363 481 C346 469 330 480 324 505 L324 675 C337 695 356 684 365 660 C378 590 378 526 363 481 Z',
    internal_oblique:'M184 574 C202 561 217 576 220 601 L215 680 C201 700 182 686 177 661 Z M356 574 C338 561 323 576 320 601 L325 680 C339 700 358 686 363 661 Z',
    transverse_abdominis:'M193 627 C218 615 241 622 264 642 L264 697 C238 710 211 699 190 674 Z M276 642 C299 622 322 615 347 627 L350 674 C329 699 302 710 276 697 Z'
  };
  var VISUAL_REGION_PATHS={
    pectoralis_sternal:REGION_PATHS.pectoralis_major_sternal,
    pectoralis_clavicular:REGION_PATHS.pectoralis_major_clavicular,
    abs:REGION_PATHS.rectus_abdominis,
    obliques:REGION_PATHS.obliques,
    anterior_deltoid:REGION_PATHS.anterior_deltoid,
    middle_deltoid:REGION_PATHS.lateral_deltoid,
    posterior_deltoid:REGION_PATHS.posterior_deltoid,
    biceps:REGION_PATHS.biceps_brachii,
    forearms:'M82 570 C96 555 116 560 127 582 L121 690 C105 714 83 700 78 670 Z M413 582 C424 560 444 555 458 570 L462 670 C457 700 435 714 419 690 Z',
    triceps_long:REGION_PATHS.triceps_long_head,
    triceps_lateral:REGION_PATHS.triceps_lateral_head,
    quads:REGION_PATHS.vastus_lateralis+' '+REGION_PATHS.rectus_femoris+' '+REGION_PATHS.vastus_medialis,
    hip_flexors:'M188 650 C208 638 232 647 248 671 L244 748 C225 762 204 748 191 724 Z M292 671 C308 647 332 638 352 650 L349 724 C336 748 315 762 296 748 Z',
    adductors:'M220 717 C236 704 254 716 263 744 L260 952 C249 979 230 968 220 936 Z M320 717 C304 704 286 716 277 744 L280 952 C291 979 310 968 320 936 Z',
    upper_traps:REGION_PATHS.trapezius_upper,
    lower_traps:'M682 368 C710 377 738 389 761 405 C784 389 812 377 840 368 C834 431 810 500 761 565 C712 500 688 431 682 368 Z',
    spinal_erectors:'M716 548 C735 562 749 574 761 590 C773 574 787 562 806 548 L827 672 C801 690 779 713 761 742 C743 713 721 690 695 672 Z',
    lats:REGION_PATHS.latissimus_dorsi,
    rotator_cuff:'M635 391 C674 376 718 388 751 421 L748 486 C711 491 670 470 642 442 Z M887 391 C848 376 804 388 771 421 L774 486 C811 491 852 470 880 442 Z',
    glutes:REGION_PATHS.gluteus_maximus,
    hams:REGION_PATHS.hamstring_biceps_femoris+' '+REGION_PATHS.hamstring_semitendinosus+' '+REGION_PATHS.hamstring_semimembranosus,
    calves:REGION_PATHS.gastrocnemius
  };
  var VISUAL_ROLE_OVERRIDES={
    prone_y_raise:{primary:['lower_traps'],secondary:['rotator_cuff','posterior_deltoid']},
    face_pull:{primary:['posterior_deltoid'],secondary:['rotator_cuff','lower_traps']},
    straight_arm_pulldown:{primary:['lats'],secondary:['triceps_long']},
    reverse_cable_curl:{primary:['forearms'],secondary:['biceps']},
    romanian_deadlift:{primary:['hams'],secondary:['glutes','spinal_erectors']},
    dumbbell_romanian_deadlift:{primary:['hams'],secondary:['glutes','spinal_erectors']},
    conventional_deadlift:{primary:['glutes','hams'],secondary:['spinal_erectors','lats','upper_traps']},
    sumo_deadlift:{primary:['glutes'],secondary:['hams','quads','adductors','spinal_erectors']},
    back_extension:{primary:['spinal_erectors'],secondary:['glutes','hams']},
    reverse_hyperextension:{primary:['spinal_erectors'],secondary:['glutes','hams']},
    dead_bug:{primary:['abs'],secondary:['hip_flexors']},
    hanging_knee_raise:{primary:['abs'],secondary:['hip_flexors']},
    captains_chair_leg_raise:{primary:['abs'],secondary:['hip_flexors']},
    farmers_walk:{primary:['forearms'],secondary:['upper_traps','abs','glutes']}
  };
  function ready(fn){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn):fn()}
  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(char){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]})}
  function data(){try{return typeof root.simurgGetData==='function'?root.simurgGetData():(typeof DATA!=='undefined'?DATA:root.DATA||{workouts:[]})}catch(error){return root.DATA||{workouts:[]}}}
  function appDate(){try{if(typeof selectedDate==='string')return selectedDate}catch(error){}try{if(typeof root.selectedDate==='string')return root.selectedDate}catch(error){}var now=new Date();return now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0')}
  function number(value,digits){return Number(value||0).toLocaleString('tr-TR',{maximumFractionDigits:digits==null?1:digits})}
  function kg(value){return value>0?(value>=1000?number(value/1000,1)+' ton':number(value,0)+' kg'):'—'}
  function periodLabel(period){return period.start.split('-').slice(1).reverse().join('.')+' – '+period.end.split('-').slice(1).reverse().join('.')}
  function fingerprint(rows,start,end){return (rows||[]).filter(function(row){return row&&row.date>=start&&row.date<=end}).map(function(row){return [row.date,row.exerciseId,row.exercise,row.sets,row.reps,row.weight].join('|')}).join('~')}
  function model(){var source=data(),rows=Array.isArray(source.workouts)?source.workouts:[],start=root.SimurgTrainingLabAnalysis.weekStart(state.date||appDate()),previous=root.SimurgTrainingLabAnalysis.addDays(start,-7),signature=fingerprint(rows,previous,root.SimurgTrainingLabAnalysis.addDays(start,6));if(state.memo&&state.memo.source===source&&state.memo.start===start&&state.memo.signature===signature)return state.memo.value;var value=root.SimurgTrainingLabAnalysis.analyze(source,start);state.memo={source:source,start:start,signature:signature,value:value};return value}
  function trend(item){if(!item.trend)return '<span class="tlTrend">önceki hafta —</span>';var percent=item.trend.percent,cls=percent>0?'up':percent<0?'down':'';return '<span class="tlTrend '+cls+'">'+(percent>0?'+':'')+percent+'%</span>'}
  function visualId(id){return VISUAL_REGION_MAP[id]?id:CANONICAL_TO_VISUAL[id]||null}
  function applyRole(target,id,role){if(id&&(role==='primary'||!target[id]))target[id]=role==='primary'?'primary':'secondary'}
  function supplementLibraryRoles(exercise,selected){
    var library=root.SimurgExerciseLibrary,definition=exercise&&library&&library.getById(exercise.exerciseId),labels={Forearms:'forearms','Lower Back':'spinal_erectors','Rotator Cuff':'rotator_cuff','Hip Flexors':'hip_flexors',Adductors:'adductors'};
    if(!definition)return;
    applyRole(selected,labels[definition.primaryMuscle],'primary');
    (definition.secondaryMuscles||[]).forEach(function(label){applyRole(selected,labels[label],'secondary')});
  }
  function musclesFor(result,group){return result.anatomy?result.anatomy.muscles.filter(function(item){return item.highLevelGroup===group}):result.groups.filter(function(item){return item.id===group})}
  function resolveSelection(result){if(!result.anatomy)return result.groupMap[state.group]||result.groups[0];var selected=state.muscle&&result.anatomy.muscleMap[state.muscle];if(selected&&selected.highLevelGroup===state.group)return selected;var choices=musclesFor(result,state.group).slice().sort(function(a,b){return b.sets-a.sets});selected=choices[0]||result.anatomy.muscles[0];state.group=selected.highLevelGroup;return selected}
  function selectGroup(result,group){state.group=group;state.exerciseId=null;var choices=musclesFor(result,group).slice().sort(function(a,b){return b.sets-a.sets});if(choices.length)state.muscle=choices[0].id;render()}
  function groupTabs(result){var ids=['Chest','Back','Shoulders','Arms','Legs','Core'];return '<div class="tlGroupTabs" aria-label="Ana kas bölgeleri">'+ids.map(function(id){var aggregate=result.anatomy&&result.anatomy.highLevelGroupMap[id];return '<button type="button" class="'+(state.group===id?'active':'')+'" data-tl-group="'+id+'" aria-pressed="'+(state.group===id)+'"><span>'+GROUP_LABELS[id]+'</span><small>'+number(aggregate?aggregate.sets:0,1)+'</small></button>'}).join('')+'</div>'}
  function muscleCard(item){return '<button type="button" class="tlMuscle '+(state.muscle===item.id?'active':'')+'" data-tl-muscle="'+esc(item.id)+'" aria-pressed="'+(state.muscle===item.id)+'"><span><b>'+esc(item.label)+'</b><small>'+number(item.sets,1)+' set</small></span>'+trend(item)+'</button>'}
  function exerciseSelection(exercise){
    var anatomy=root.SimurgMuscleAnatomy,selected=Object.create(null),resolved=exercise&&Array.isArray(exercise.muscles)?exercise.muscles:null,mapping=!resolved&&exercise&&anatomy&&anatomy.getExerciseMapping(exercise.exerciseId);
    var visualOverride=exercise&&VISUAL_ROLE_OVERRIDES[exercise.exerciseId];
    if(visualOverride){visualOverride.secondary.forEach(function(id){selected[id]='secondary'});visualOverride.primary.forEach(function(id){selected[id]='primary'});return selected}
    if(resolved)resolved.forEach(function(item){applyRole(selected,visualId(item.muscleId),item.role)});
    else if(mapping){mapping.secondaryMuscles.forEach(function(item){applyRole(selected,visualId(item.muscleId),'secondary')});mapping.primaryMuscles.forEach(function(item){applyRole(selected,visualId(item.muscleId),'primary')})}
    supplementLibraryRoles(exercise,selected);
    return selected;
  }
  function visualAnatomy(result){
    var source=result.anatomy,map=Object.create(null),dates=Object.create(null),exercises=(source.exerciseContributions||[]).slice(),existing=exercises.reduce(function(index,item){index[item.exerciseId]=true;return index},Object.create(null)),fallback=Object.create(null);
    var muscles=VISUAL_REGIONS.map(function(metadata){var item={id:metadata.id,label:metadata.label,highLevelGroup:metadata.highLevelGroup,sets:0,reps:0,volume:0,frequency:0,dates:[],exerciseContributions:[],trend:null};map[item.id]=item;dates[item.id]=Object.create(null);return item});
    (source.muscles||[]).forEach(function(item){var id=visualId(item.id),target=id&&map[id];if(target&&item.sets>target.sets)target.trend=item.trend});
    (data().workouts||[]).forEach(function(row){var id=row&&row.exerciseId;if(!id||existing[id]||!VISUAL_ROLE_OVERRIDES[id]||row.date<result.period.start||row.date>result.period.end)return;var definition=root.SimurgExerciseLibrary&&root.SimurgExerciseLibrary.getById(id),item=fallback[id],sets=Number(row.sets)||0,reps=Number(row.reps)||0,weight=Number(row.weight)||0;if(!item){item=fallback[id]={exerciseId:id,name:definition?definition.name:row.exercise,equipment:definition&&definition.equipment,movementType:definition&&definition.movementType,dates:[],muscles:[{muscleId:null,role:'primary',weight:1,effectiveSets:0,reps:0,volume:0}]}}item.muscles[0].effectiveSets+=sets;item.muscles[0].reps+=sets*reps;item.muscles[0].volume+=sets*reps*weight;if(item.dates.indexOf(row.date)<0)item.dates.push(row.date)});
    Object.keys(fallback).forEach(function(id){fallback[id].dates.sort();fallback[id].frequency=fallback[id].dates.length;exercises.push(fallback[id])});
    exercises.forEach(function(exercise){
      var roles=exerciseSelection(exercise),primary=(exercise.muscles||[]).filter(function(item){return item.role==='primary'}),base=(primary.length?primary:exercise.muscles||[]).slice().sort(function(a,b){return b.effectiveSets-a.effectiveSets})[0];if(!base)return;
      Object.keys(roles).forEach(function(id){var target=map[id];if(!target)return;var candidates=(exercise.muscles||[]).filter(function(item){return visualId(item.muscleId)===id}).sort(function(a,b){return b.effectiveSets-a.effectiveSets}),metric=candidates[0],factor=roles[id]==='primary'?1:.5;
        var contribution={exerciseId:exercise.exerciseId,name:exercise.name,equipment:exercise.equipment,movementType:exercise.movementType,role:roles[id],weight:factor,sets:metric?metric.effectiveSets:base.effectiveSets*factor,effectiveSets:metric?metric.effectiveSets:base.effectiveSets*factor,reps:metric?metric.reps:base.reps*factor,volume:metric?metric.volume:base.volume*factor,frequency:exercise.frequency,dates:(exercise.dates||[]).slice(),roles:[roles[id]]};
        target.sets+=contribution.effectiveSets;target.reps+=contribution.reps;target.volume+=contribution.volume;target.exerciseContributions.push(contribution);contribution.dates.forEach(function(date){dates[id][date]=true});
      });
    });
    muscles.forEach(function(item){item.dates=Object.keys(dates[item.id]).sort();item.frequency=item.dates.length;item.exerciseContributions.sort(function(a,b){return b.effectiveSets-a.effectiveSets||a.name.localeCompare(b.name)})});
    return {muscles:muscles,muscleMap:map,exerciseContributions:exercises,highLevelGroupMap:source.highLevelGroupMap};
  }
  function region(item,highlights){var path=VISUAL_REGION_PATHS[item.id],role=highlights[item.id]||'';if(!path)return '';return '<path class="tlRegion '+role+'" data-tl-region="'+esc(item.id)+'" role="button" tabindex="0" aria-label="'+esc(item.label)+' kasını seç" aria-pressed="'+Boolean(role)+'" d="'+path+'"><title>'+esc(item.label)+(role==='primary'?' · ana kas':role==='secondary'?' · yardımcı kas':'')+'</title></path>'}
  function anatomy(selected,exercise){var highlights=exerciseSelection(exercise),activeIds=Object.keys(highlights),ordered=VISUAL_REGIONS.filter(function(item){return activeIds.indexOf(item.id)<0}).concat(VISUAL_REGIONS.filter(function(item){return highlights[item.id]==='secondary'}),VISUAL_REGIONS.filter(function(item){return highlights[item.id]==='primary'})),label=exercise?exercise.name:'Nötr görünüm',description=exercise?exercise.name+' hareketinin ana kasları güçlü kırmızı, yardımcı kasları yumuşak turuncu kırmızıyla vurgulanır.':'Bir hareket seçilene kadar anatomi figürü nötr gösterilir.';return '<figure class="tlAnatomy" data-selected-muscle="'+esc(selected.id)+'"'+(exercise?' data-selected-exercise="'+esc(exercise.exerciseId)+'"':'')+'><div class="tlAnatomyStage"><img src="./assets/simurg-anatomy-base-v1.png" alt="" aria-hidden="true" decoding="async"><svg viewBox="0 0 1024 1536" aria-labelledby="tlAnatomyTitle tlAnatomyDesc"><title id="tlAnatomyTitle">Ön ve arka fitness kas haritası</title><desc id="tlAnatomyDesc">'+esc(description)+'</desc><defs><radialGradient id="tlPrimaryFill" cx="50%" cy="46%" r="72%"><stop offset="0" stop-color="#f44757" stop-opacity=".98"/><stop offset=".68" stop-color="#dc293d" stop-opacity=".86"/><stop offset="1" stop-color="#b91f32" stop-opacity=".58"/></radialGradient><radialGradient id="tlSecondaryFill" cx="50%" cy="48%" r="76%"><stop offset="0" stop-color="#e97858" stop-opacity=".72"/><stop offset=".72" stop-color="#c95a43" stop-opacity=".48"/><stop offset="1" stop-color="#a84438" stop-opacity=".24"/></radialGradient></defs>'+ordered.map(function(item){return region(item,highlights)}).join('')+'</svg></div><figcaption><span>ÖN</span><b>'+esc(label)+'</b><span>ARKA</span></figcaption></figure>'}
  function distribution(items){var active=items.filter(function(item){return item.sets>0}).sort(function(a,b){return b.sets-a.sets});if(!active.length)return '<div class="tlEmpty tlDistributionEmpty">Bu hafta için anatomik aktivasyon verisi yok.</div>';var max=Math.max.apply(null,active.map(function(item){return item.sets}).concat([1]));return active.map(function(item){return '<button type="button" class="tlDistRow" data-tl-muscle="'+esc(item.id)+'"><span>'+esc(item.label)+'</span><div class="tlDistTrack"><i style="width:'+Math.round(item.sets/max*100)+'%"></i></div><b>'+number(item.sets,1)+' set</b></button>'}).join('')}
  function contributions(muscle){if(!muscle||!muscle.exerciseContributions.length)return '<div class="tlEmpty">Bu hafta bu anatomik kas için eşleşen tamamlanmış workout kaydı yok.</div>';return '<div class="tlContribution">'+muscle.exerciseContributions.map(function(item){var context=[item.equipment,item.movementType,item.roles.map(function(role){return role==='primary'?'ana':'yardımcı'}).join(' + ')].filter(Boolean).join(' · ');return '<button type="button" class="tlExercise '+(state.exerciseId===item.exerciseId?'active':'')+'" data-tl-exercise="'+esc(item.exerciseId)+'" aria-pressed="'+(state.exerciseId===item.exerciseId)+'"><div class="tlExerciseTop"><b>'+esc(item.name)+'</b><strong>'+number(item.effectiveSets,1)+' efektif set</strong></div><small>'+esc(context)+' · anatomiyi göster</small><div class="tlExerciseStats"><span>'+number(item.reps,0)+' tekrar</span><span>'+item.frequency+' gün</span><span>'+kg(item.volume)+'</span></div></button>'}).join('')+'</div>'}
  function unmapped(items){if(!items.length)return '';return '<details class="tlUnmapped"><summary>'+items.length+' eşlenmemiş hareket · workload dışında tutuldu</summary><ul>'+items.map(function(item){return '<li>'+esc(item.name)+' ('+item.rows+' kayıt)</li>'}).join('')+'</ul></details>'}
  function render(){
    var section=document.getElementById('training-lab');if(!section||!root.SimurgTrainingLabAnalysis)return;if(!state.date)state.date=appDate();var result=model(),view=Object.create(result);view.anatomy=result.anatomy?visualAnatomy(result):null;if(!result.totals||!result.totals.trainingDays){state.muscle=null;state.exerciseId=null}var selected=resolveSelection(view),anatomical=view.anatomy,visible=musclesFor(view,state.group),distributionItems=anatomical?view.anatomy.muscles:result.groups,selectedExercise=state.exerciseId&&view.anatomy&&view.anatomy.exerciseContributions.find(function(item){return item.exerciseId===state.exerciseId});if(state.exerciseId&&!selectedExercise)state.exerciseId=null;
    section.innerHTML='<div class="tlShell"><header class="tlHero"><div><div class="tlKicker">Training Lab · v3.6</div><h1>Bu hafta vücudunu nasıl yükledin?</h1></div><div class="tlWeekNav"><button type="button" data-tl-week="-7" aria-label="Önceki hafta">‹</button><div class="tlWeekLabel"><small>SEÇİLİ HAFTA</small><b>'+periodLabel(result.period)+'</b></div><button type="button" data-tl-week="7" aria-label="Sonraki hafta">›</button></div></header>'
      +'<div class="tlSummary" aria-label="Haftalık Training Lab özeti"><div class="tlStat"><small>Set katkısı</small><b>'+number(result.totals.sets,1)+'</b></div><div class="tlStat"><small>Tekrar</small><b>'+number(result.totals.reps,0)+'</b></div><div class="tlStat"><small>Antrenman günü</small><b>'+result.totals.trainingDays+'</b></div><div class="tlStat"><small>Anlamlı hacim</small><b>'+kg(result.totals.volume)+'</b></div></div>'
      +groupTabs(view)
      +'<div class="tlMainGrid"><section class="tlPanel tlAnatomyPanel"><div class="tlPanelHead"><div><h2>Anatomik Kas Görünümü</h2><p>Bir hareket seçildiğinde ana ve yardımcı kaslar figürde birlikte gösterilir.</p></div><span class="tlBadge">1.0 ANA · 0.5 YARDIMCI</span></div>'+anatomy(selected,selectedExercise)+'<div class="tlMuscleGrid">'+visible.map(muscleCard).join('')+'</div></section>'
      +'<section class="tlPanel tlDetailPanel" aria-live="polite"><div class="tlPanelHead"><div><h2>'+esc(selected.label)+' · Hareket Katkısı</h2><p>Anatomik efektif sete göre sıralanır.</p></div><span class="tlBadge">'+selected.frequency+' GÜN</span></div>'+contributions(selected)+'</section></div>'
      +'<section class="tlPanel tlDistributionPanel"><div class="tlPanelHead"><div><h2>Haftalık Anatomik Dağılım</h2><p>Aktif kaslar · ağırlıklı efektif set katkısı</p></div></div><div class="tlDistribution">'+distribution(distributionItems)+'</div></section>'
      +'<section class="tlFoot"><details class="tlCalculation"><summary>Hesaplama Notu <span>Nasıl hesaplanır?</span></summary><div class="tlNotice">Ana kas 1.0, yardımcı kas 0.5 katkı alır. Anatomik eşlemesi bulunmayan eski veya çok bölgeli hareketler mevcut üst kategori hesabında kalır; yanlış bir anatomik kasa zorlanmaz. Bodyweight, izometrik, stabilite, conditioning ve carry hareketlerinde kg hacmi gösterilmez. Bu ekran tıbbi veya fizyolojik bir ölçüm değildir.</div></details>'+unmapped(result.unmapped)+'</section></div>';
    section.querySelectorAll('[data-tl-muscle],[data-tl-region]').forEach(function(button){function select(){var id=button.getAttribute(button.hasAttribute('data-tl-muscle')?'data-tl-muscle':'data-tl-region'),metadata=VISUAL_REGION_MAP[id];state.exerciseId=null;state.muscle=id;if(metadata)state.group=metadata.highLevelGroup;render()}button.addEventListener('click',select);button.addEventListener('keydown',function(event){if(event.key==='Enter'||event.key===' '){event.preventDefault();select()}})});
    section.querySelectorAll('[data-tl-exercise]').forEach(function(button){button.addEventListener('click',function(){var id=button.getAttribute('data-tl-exercise');state.exerciseId=state.exerciseId===id?null:id;render()})});
    section.querySelectorAll('[data-tl-group]').forEach(function(button){button.addEventListener('click',function(){selectGroup(view,button.getAttribute('data-tl-group'))})});
    section.querySelectorAll('[data-tl-week]').forEach(function(button){button.addEventListener('click',function(){state.date=root.SimurgTrainingLabAnalysis.addDays(result.period.start,Number(button.getAttribute('data-tl-week')));state.muscle=null;state.exerciseId=null;state.memo=null;render()})});
  }
  function ensurePrimaryNavEntry(){var nav=document.getElementById('simurgV8Nav');if(!nav||nav.querySelector('[data-key="training-lab"]'))return;var menu=nav.querySelector('[data-key="menu"]'),button=document.createElement('button');button.type='button';button.setAttribute('data-key','training-lab');button.innerHTML='<i>◫</i>Lab';button.addEventListener('click',function(){open()});nav.insertBefore(button,menu||null)}
  function open(button){state.memo=null;if(root.innerWidth<=900&&typeof root.simurgV8Go==='function')root.simurgV8Go('training-lab','training-lab');else if(typeof root.show==='function')root.show('training-lab',button||null);render()}
  root.SimurgTrainingLabUI={render:render,open:open,refresh:function(){state.memo=null;render()}};ready(function(){ensurePrimaryNavEntry()});
})(typeof globalThis!=='undefined'?globalThis:this);
