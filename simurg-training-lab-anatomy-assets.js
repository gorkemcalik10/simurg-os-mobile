(function(root,factory){
  'use strict';
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SimurgTrainingLabAnatomyAssets=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  var ASSET_VERSION='legacy-v1';
  var V2_ASSET_VERSION='training-lab-v2';
  var CANVAS_WIDTH=1024;
  var CANVAS_HEIGHT=1536;
  var ASPECT_RATIO='2:3';
  var VIEW_BOUNDS=Object.freeze({
    front:Object.freeze({x:0,y:0,width:512,height:1536}),
    back:Object.freeze({x:512,y:0,width:512,height:1536})
  });
  var ASSET_CONTRACT=Object.freeze({
    coordinateSpace:'combined-atlas-pixels',
    origin:'top-left',
    canvas:Object.freeze({width:CANVAS_WIDTH,height:CANVAS_HEIGHT,aspectRatio:ASPECT_RATIO}),
    views:VIEW_BOUNDS,
    formats:Object.freeze({baseImage:'png-rgba-8',mask:'png-alpha-8',contour:'json-svg-path-v1'}),
    quality:Object.freeze({alphaThreshold:0,minAlphaCoverage:0.0001,maxAlphaCoverage:0.25,minBaseOverlap:0.98,boundsTolerance:1,minAtlasViewCoverage:0.01,minAtlasRgbDynamicRange:8,minAtlasSampledColors:2,maxContourCount:128,maxContourPoints:50000})
  });
  var BASE_IMAGE_URL='./assets/simurg-anatomy-base-v1.png';
  var V2_BASE_IMAGE_URL='./assets/training-lab-v2/anatomy-base.png';
  var V2_MANIFEST_URL='./assets/training-lab-v2/anatomy-manifest.json';
  var HIT_PATHS={
    pectoralis_sternal:'M147 405 C176 392 218 390 263 401 L263 463 C245 475 220 478 196 471 C174 465 156 452 147 434 C143 424 143 414 147 405 Z M277 401 C322 390 364 392 393 405 C397 414 397 424 393 434 C384 452 366 465 344 471 C320 478 295 475 277 463 Z',
    pectoralis_clavicular:'M153 360 C182 343 221 344 263 365 L263 400 C235 394 207 396 181 404 C165 409 154 416 147 423 C143 399 145 376 153 360 Z M277 365 C319 344 358 343 387 360 C395 376 397 399 393 423 C386 416 375 409 359 404 C333 396 305 394 277 400 Z',
    abs:'M222 471 C235 464 250 466 263 477 L263 516 C249 523 234 520 222 510 Z M277 477 C290 466 305 464 318 471 L318 510 C306 520 291 523 277 516 Z M218 521 C232 514 248 517 263 527 L263 566 C249 574 232 570 219 558 Z M277 527 C292 517 308 514 322 521 L321 558 C308 570 291 574 277 566 Z M218 570 C233 563 249 566 263 577 L263 617 C248 626 232 620 219 607 Z M277 577 C291 566 307 563 322 570 L321 607 C308 620 292 626 277 617 Z M221 621 C234 614 249 618 263 630 L263 674 C249 686 233 681 224 667 Z M277 630 C291 618 306 614 319 621 L316 667 C307 681 291 686 277 674 Z M231 678 C241 674 252 678 263 687 L263 702 C250 706 239 699 231 689 Z M277 687 C288 678 299 674 309 678 L309 689 C301 699 290 706 277 702 Z',
    obliques:'M181 478 C196 469 210 478 217 500 L218 548 C211 570 208 598 213 625 L213 672 C201 694 184 684 176 660 C165 611 164 532 181 478 Z M359 478 C344 469 330 478 323 500 L322 548 C329 570 332 598 327 625 L327 672 C339 694 356 684 364 660 C375 611 376 532 359 478 Z',
    anterior_deltoid:'M137 329 C149 317 165 315 178 325 C185 338 184 354 178 369 C169 383 157 393 143 400 C136 384 133 366 134 347 C134 340 135 334 137 329 Z M362 325 C375 315 391 317 403 329 C405 334 406 340 406 347 C407 366 404 384 397 400 C383 393 371 383 362 369 C356 354 355 338 362 325 Z',
    middle_deltoid:'M102 337 C114 317 133 307 153 309 C144 333 138 357 136 382 C134 399 136 415 140 429 C121 429 105 417 96 397 C88 377 90 356 102 337 Z M387 309 C407 307 426 317 438 337 C450 356 452 377 444 397 C435 417 419 429 400 429 C404 415 406 399 404 382 C402 357 396 333 387 309 Z',
    posterior_deltoid:'M590 347 C608 321 637 307 666 313 C679 316 690 324 697 336 C699 353 695 373 684 397 C654 407 624 399 598 382 C591 371 588 358 590 347 Z M825 336 C832 324 843 316 856 313 C885 307 914 321 932 347 C934 358 931 371 924 382 C898 399 868 407 838 397 C827 373 823 353 825 336 Z',
    biceps:'M108 420 C126 408 148 414 161 433 C171 452 174 478 169 507 C164 537 153 561 139 578 C120 577 106 566 100 549 C96 519 98 486 101 454 C102 439 104 428 108 420 Z M379 433 C392 414 414 408 432 420 C436 428 438 439 439 454 C442 486 444 519 440 549 C434 566 420 577 401 578 C387 561 376 537 371 507 C366 478 369 452 379 433 Z',
    forearms:'M96 565 C108 557 121 565 128 584 C127 608 124 633 120 657 C116 679 108 695 98 701 C87 696 80 683 79 666 C81 637 85 604 90 579 C91 573 93 568 96 565 Z M117 584 C126 574 136 580 139 597 L130 682 C124 697 115 701 108 694 C115 660 118 622 117 584 Z M412 584 C419 565 432 557 444 565 C447 568 449 573 450 579 C455 604 459 637 461 666 C460 683 453 696 442 701 C432 695 424 679 420 657 C416 633 413 608 412 584 Z M401 597 C404 580 414 574 423 584 C422 622 425 660 432 694 C425 701 416 697 410 682 Z',
    triceps_long:'M612 420 C629 414 645 425 655 447 C658 465 655 489 650 516 C645 543 638 566 629 582 C613 580 604 567 603 546 C603 512 605 478 607 450 C608 437 609 427 612 420 Z M867 447 C877 425 893 414 910 420 C913 427 914 437 915 450 C917 478 919 512 919 546 C918 567 909 580 893 582 C884 566 877 543 872 516 C867 489 864 465 867 447 Z',
    triceps_lateral:'M583 433 C594 420 607 419 617 431 C623 447 624 469 621 495 L614 551 C603 564 589 557 581 539 C575 512 573 485 576 459 C577 447 579 438 583 433 Z M905 431 C915 419 928 420 939 433 C943 438 945 447 946 459 C949 485 947 512 941 539 C933 557 919 564 908 551 L901 495 C898 469 899 447 905 431 Z',
    quads:'M151 713 C164 702 179 704 190 720 C187 759 186 804 188 849 C190 896 191 933 188 960 C182 979 172 987 163 978 C151 946 146 910 143 870 C140 812 142 758 151 713 Z M199 718 C207 706 216 710 221 731 C224 773 223 817 220 861 C218 906 214 940 210 958 C205 967 200 960 198 945 C196 897 196 846 196 801 C196 762 197 733 199 718 Z M238 866 C247 856 256 865 258 884 C260 911 258 942 254 965 C251 981 245 989 239 985 C232 980 229 969 230 954 C231 930 232 904 233 884 C234 875 236 869 238 866 Z M389 713 C376 702 361 704 350 720 C353 759 354 804 352 849 C350 896 349 933 352 960 C358 979 368 987 377 978 C389 946 394 910 397 870 C400 812 398 758 389 713 Z M341 718 C333 706 324 710 319 731 C316 773 317 817 320 861 C322 906 326 940 330 958 C335 967 340 960 342 945 C344 897 344 846 344 801 C344 762 343 733 341 718 Z M302 866 C293 856 284 865 282 884 C280 911 282 942 286 965 C289 981 295 989 301 985 C308 980 311 969 310 954 C309 930 308 904 307 884 C306 875 304 869 302 866 Z',
    hip_flexors:'M188 655 C203 644 221 647 236 662 C244 674 248 690 247 708 C240 718 231 724 220 725 C207 718 197 707 191 692 C187 680 186 667 188 655 Z M304 662 C319 647 337 644 352 655 C354 667 353 680 349 692 C343 707 333 718 320 725 C309 724 300 718 293 708 C292 690 296 674 304 662 Z',
    adductors:'M224 714 C237 705 251 714 260 736 C263 772 263 813 261 854 C260 897 257 932 253 956 C247 975 238 974 231 954 C223 913 219 866 218 819 C217 777 219 741 224 714 Z M316 714 C303 705 289 714 280 736 C277 772 277 813 279 854 C280 897 283 932 287 956 C293 975 302 974 309 954 C317 913 321 866 322 819 C323 777 321 741 316 714 Z',
    upper_traps:'M704 310 C721 297 738 286 753 278 C757 300 759 325 759 351 L759 397 C739 384 719 367 700 345 C697 332 698 320 704 310 Z M769 278 C784 286 801 297 818 310 C824 320 825 332 822 345 C803 367 783 384 763 397 L763 351 C763 325 765 300 769 278 Z',
    lower_traps:'M686 368 C711 378 736 390 758 406 L758 559 C744 541 730 517 719 489 C706 458 697 421 686 368 Z M836 368 C811 378 786 390 764 406 L764 559 C778 541 792 517 803 489 C816 458 825 421 836 368 Z',
    spinal_erectors:'M727 548 C739 557 749 569 756 584 L756 687 C749 700 740 710 729 718 C717 698 710 678 708 656 C711 617 718 580 727 548 Z M795 548 C783 557 773 569 766 584 L766 687 C773 700 782 710 793 718 C805 698 812 678 814 656 C811 617 804 580 795 548 Z',
    lats:'M648 431 C669 424 692 433 711 451 C729 469 739 492 742 519 C740 553 734 584 724 612 C716 636 704 656 689 674 C674 657 660 634 648 607 C635 576 627 543 625 508 C625 476 633 450 648 431 Z M874 431 C853 424 830 433 811 451 C793 469 783 492 780 519 C782 553 788 584 798 612 C806 636 818 656 833 674 C848 657 862 634 874 607 C887 576 895 543 897 508 C897 476 889 450 874 431 Z',
    rotator_cuff:'M635 383 C658 374 682 376 704 389 C714 396 722 406 728 418 C717 437 702 451 683 462 C668 470 653 468 642 458 C633 440 630 418 632 397 C632 391 633 386 635 383 Z M887 383 C864 374 840 376 818 389 C808 396 800 406 794 418 C805 437 820 451 839 462 C854 470 869 468 880 458 C889 440 892 418 890 397 C890 391 889 386 887 383 Z',
    glutes:'M643 637 C671 617 711 616 746 638 C756 650 759 671 757 699 L754 758 C733 781 704 790 676 779 C660 773 648 762 642 748 C637 711 637 674 643 637 Z M879 637 C851 617 811 616 776 638 C766 650 763 671 765 699 L768 758 C789 781 818 790 846 779 C862 773 874 762 880 748 C885 711 885 674 879 637 Z',
    hams:'M638 721 C653 704 674 704 689 722 C697 754 699 797 697 844 C695 896 692 941 688 979 C678 1005 657 1005 643 980 C629 895 626 802 638 721 Z M700 722 C714 707 732 712 742 738 C746 781 745 831 742 881 C740 926 737 960 733 984 C724 1005 708 1003 699 981 C691 895 691 803 700 722 Z M884 721 C869 704 848 704 833 722 C825 754 823 797 825 844 C827 896 830 941 834 979 C844 1005 865 1005 879 980 C893 895 896 802 884 721 Z M822 722 C808 707 790 712 780 738 C776 781 777 831 780 881 C782 926 785 960 789 984 C798 1005 814 1003 823 981 C831 895 831 803 822 722 Z',
    calves:'M658 1014 C676 997 699 999 716 1020 C728 1046 730 1082 726 1121 C723 1157 717 1184 708 1202 C694 1220 676 1212 664 1187 C650 1132 647 1068 658 1014 Z M684 1122 C699 1113 713 1125 717 1147 C718 1185 713 1223 705 1253 C695 1271 681 1267 674 1245 C672 1204 676 1162 684 1122 Z M864 1014 C846 997 823 999 806 1020 C794 1046 792 1082 796 1121 C799 1157 805 1184 814 1202 C828 1220 846 1212 858 1187 C872 1132 875 1068 864 1014 Z M838 1122 C823 1113 809 1125 805 1147 C804 1185 809 1223 817 1253 C827 1271 841 1267 848 1245 C850 1204 846 1162 838 1122 Z'
  };

  var REGION_ROWS=[
    ['pectoralis_sternal','Pectoralis Sternal','front','Chest',['pectoralis_major_sternal','pectoralis_minor']],
    ['pectoralis_clavicular','Pectoralis Clavicular','front','Chest',['pectoralis_major_clavicular']],
    ['abs','Abs','front','Core',['rectus_abdominis','transverse_abdominis']],
    ['obliques','Obliques','front','Core',['obliques','external_oblique','internal_oblique']],
    ['anterior_deltoid','Anterior Deltoid','front','Shoulders',['anterior_deltoid']],
    ['middle_deltoid','Middle Deltoid','front','Shoulders',['lateral_deltoid']],
    ['posterior_deltoid','Posterior Deltoid','back','Shoulders',['posterior_deltoid']],
    ['biceps','Biceps','front','Arms',['biceps_brachii','brachialis']],
    ['forearms','Forearms','front','Arms',[]],
    ['triceps_long','Triceps Long','back','Arms',['triceps_long_head']],
    ['triceps_lateral','Triceps Lateral','back','Arms',['triceps_lateral_head','triceps_medial_head']],
    ['quads','Quads','front','Legs',['rectus_femoris','vastus_lateralis','vastus_medialis']],
    ['hip_flexors','Hip Flexors','front','Legs',[]],
    ['adductors','Adductors','front','Legs',[]],
    ['glutes','Glutes','back','Legs',['gluteus_maximus','gluteus_medius']],
    ['hams','Hams','back','Legs',['hamstring_biceps_femoris','hamstring_semitendinosus','hamstring_semimembranosus']],
    ['calves','Calves','back','Legs',['gastrocnemius','soleus']],
    ['upper_traps','Upper Traps','back','Back',['trapezius_upper']],
    ['lower_traps','Lower Traps','back','Back',['trapezius_middle','trapezius_lower']],
    ['spinal_erectors','Spinal Erectors','back','Back',[]],
    ['lats','Lats','back','Back',['rhomboid_major','latissimus_dorsi','teres_major']],
    ['rotator_cuff','Rotator Cuff','back','Back',[]]
  ];
  var REGIONS=Object.freeze(REGION_ROWS.map(function(row){
    return Object.freeze({
      regionId:row[0],
      id:row[0],
      label:row[1],
      view:row[2],
      highLevelGroup:row[3],
      maskUrl:'./assets/anatomy-masks/'+row[0]+'.png',
      hitPath:HIT_PATHS[row[0]],
      canonicalMuscleIds:Object.freeze(row[4].slice()),
      assetVersion:ASSET_VERSION,
      canvasWidth:CANVAS_WIDTH,
      canvasHeight:CANVAS_HEIGHT
    });
  }));
  var EXPECTED_REGION_IDS=Object.freeze(REGION_ROWS.map(function(row){return row[0]}));
  var V2_REGIONS=Object.freeze(REGION_ROWS.map(function(row){
    return Object.freeze({
      regionId:row[0],
      id:row[0],
      label:row[1],
      view:row[2],
      highLevelGroup:row[3],
      maskUrl:'./assets/training-lab-v2/masks/'+row[0]+'.png',
      contourUrl:'./assets/training-lab-v2/contours/'+row[0]+'.json',
      viewBounds:VIEW_BOUNDS[row[2]],
      canonicalMuscleIds:Object.freeze(row[4].slice()),
      assetVersion:V2_ASSET_VERSION,
      canvasWidth:CANVAS_WIDTH,
      canvasHeight:CANVAS_HEIGHT
    });
  }));
  var REGION_MAP=Object.freeze(REGIONS.reduce(function(map,region){map[region.regionId]=region;return map},Object.create(null)));
  var CANONICAL_TO_REGION=Object.freeze(REGIONS.reduce(function(map,region){
    region.canonicalMuscleIds.forEach(function(id){map[id]=region.regionId});
    return map;
  },Object.create(null)));
  var LIBRARY_LABEL_TO_REGION=Object.freeze({Forearms:'forearms','Lower Back':'spinal_erectors','Rotator Cuff':'rotator_cuff','Hip Flexors':'hip_flexors',Adductors:'adductors'});
  var VISUAL_ROLE_OVERRIDES=Object.freeze({
    prone_y_raise:Object.freeze({primary:Object.freeze(['lower_traps']),secondary:Object.freeze(['rotator_cuff','posterior_deltoid'])}),
    face_pull:Object.freeze({primary:Object.freeze(['posterior_deltoid']),secondary:Object.freeze(['rotator_cuff','lower_traps'])}),
    straight_arm_pulldown:Object.freeze({primary:Object.freeze(['lats']),secondary:Object.freeze(['triceps_long'])}),
    reverse_cable_curl:Object.freeze({primary:Object.freeze(['forearms']),secondary:Object.freeze(['biceps'])}),
    romanian_deadlift:Object.freeze({primary:Object.freeze(['hams']),secondary:Object.freeze(['glutes','spinal_erectors'])}),
    dumbbell_romanian_deadlift:Object.freeze({primary:Object.freeze(['hams']),secondary:Object.freeze(['glutes','spinal_erectors'])}),
    conventional_deadlift:Object.freeze({primary:Object.freeze(['glutes','hams']),secondary:Object.freeze(['spinal_erectors','lats','upper_traps'])}),
    sumo_deadlift:Object.freeze({primary:Object.freeze(['glutes']),secondary:Object.freeze(['hams','quads','adductors','spinal_erectors'])}),
    back_extension:Object.freeze({primary:Object.freeze(['spinal_erectors']),secondary:Object.freeze(['glutes','hams'])}),
    reverse_hyperextension:Object.freeze({primary:Object.freeze(['spinal_erectors']),secondary:Object.freeze(['glutes','hams'])}),
    dead_bug:Object.freeze({primary:Object.freeze(['abs']),secondary:Object.freeze(['hip_flexors'])}),
    hanging_knee_raise:Object.freeze({primary:Object.freeze(['abs']),secondary:Object.freeze(['hip_flexors'])}),
    captains_chair_leg_raise:Object.freeze({primary:Object.freeze(['abs']),secondary:Object.freeze(['hip_flexors'])}),
    farmers_walk:Object.freeze({primary:Object.freeze(['forearms']),secondary:Object.freeze(['upper_traps','abs','glutes'])})
  });

  function validate(regions,options){
    if(!Array.isArray(regions)){options=regions||{};regions=REGIONS}
    options=options||{};
    var canonicalIds=new Set(options.canonicalMuscleIds||[]);
    var checkCanonical=canonicalIds.size>0;
    var seen=Object.create(null);
    var canonicalOwners=Object.create(null);
    var errors=[];
    regions.forEach(function(region,index){
      var prefix='regions['+index+']';
      if(!region||!region.regionId)errors.push({code:'missing_region_id',location:prefix});
      else if(seen[region.regionId])errors.push({code:'duplicate_region_id',regionId:region.regionId});
      else seen[region.regionId]=true;
      if(!region||!region.maskUrl)errors.push({code:'missing_mask_reference',regionId:region&&region.regionId||null});
      else if(typeof options.assetExists==='function'&&!options.assetExists(region.maskUrl))errors.push({code:'missing_mask_reference',regionId:region.regionId,maskUrl:region.maskUrl});
      (region&&region.canonicalMuscleIds||[]).forEach(function(id){
        if(checkCanonical&&!canonicalIds.has(id))errors.push({code:'invalid_canonical_reference',regionId:region.regionId,canonicalMuscleId:id});
        if(canonicalOwners[id]&&canonicalOwners[id]!==region.regionId)errors.push({code:'duplicate_canonical_mapping',canonicalMuscleId:id,regionIds:[canonicalOwners[id],region.regionId]});
        else canonicalOwners[id]=region.regionId;
      });
      if(region&&(region.canvasWidth!==CANVAS_WIDTH||region.canvasHeight!==CANVAS_HEIGHT))errors.push({code:'canvas_dimension_mismatch',regionId:region.regionId,expected:[CANVAS_WIDTH,CANVAS_HEIGHT],actual:[region.canvasWidth,region.canvasHeight]});
      if(region&&!region.hitPath)errors.push({code:'missing_hit_path',regionId:region.regionId});
    });
    EXPECTED_REGION_IDS.forEach(function(regionId){
      if(!seen[regionId])errors.push({code:'missing_region_id',regionId:regionId});
    });
    Object.keys(VISUAL_ROLE_OVERRIDES).forEach(function(exerciseId){
      var override=VISUAL_ROLE_OVERRIDES[exerciseId],primary=override.primary||[],secondary=override.secondary||[];
      primary.concat(secondary).forEach(function(regionId){if(!seen[regionId])errors.push({code:'invalid_visual_override_region',exerciseId:exerciseId,regionId:regionId})});
      primary.forEach(function(regionId){if(secondary.indexOf(regionId)>=0)errors.push({code:'conflicting_visual_override_role',exerciseId:exerciseId,regionId:regionId})});
    });
    return {valid:errors.length===0,errors:errors};
  }

  function validateManifest(manifest,options){
    options=options||{};
    var errors=[];
    if(!manifest||typeof manifest!=='object')return {valid:false,errors:[{code:'missing_manifest'}]};
    if(manifest.schemaVersion!==2)errors.push({code:'manifest_schema_mismatch',expected:2,actual:manifest.schemaVersion||null});
    if(typeof manifest.assetVersion!=='string'||!/^training-lab-v2-[a-z0-9][a-z0-9._-]{2,63}$/i.test(manifest.assetVersion)||/pending|legacy/i.test(manifest.assetVersion))errors.push({code:'invalid_asset_version',actual:manifest.assetVersion||null});
    var canvas=manifest.canvas||{};
    if(canvas.width!==CANVAS_WIDTH||canvas.height!==CANVAS_HEIGHT)errors.push({code:'canvas_dimension_mismatch',expected:[CANVAS_WIDTH,CANVAS_HEIGHT],actual:[canvas.width,canvas.height]});
    if(canvas.aspectRatio!==ASPECT_RATIO)errors.push({code:'aspect_ratio_mismatch',expected:ASPECT_RATIO,actual:canvas.aspectRatio||null});
    if(manifest.coordinateSpace!==ASSET_CONTRACT.coordinateSpace||manifest.origin!==ASSET_CONTRACT.origin)errors.push({code:'coordinate_contract_mismatch'});
    Object.keys(ASSET_CONTRACT.formats).forEach(function(key){if(!manifest.formats||manifest.formats[key]!==ASSET_CONTRACT.formats[key])errors.push({code:'format_contract_mismatch',asset:key,expected:ASSET_CONTRACT.formats[key],actual:manifest.formats&&manifest.formats[key]||null})});
    Object.keys(ASSET_CONTRACT.quality).forEach(function(key){if(!manifest.quality||manifest.quality[key]!==ASSET_CONTRACT.quality[key])errors.push({code:'quality_contract_mismatch',field:key,expected:ASSET_CONTRACT.quality[key],actual:manifest.quality&&manifest.quality[key]})});
    ['front','back'].forEach(function(view){
      var expected=VIEW_BOUNDS[view],actual=manifest.views&&manifest.views[view]||{};
      if(actual.x!==expected.x||actual.y!==expected.y||actual.width!==expected.width||actual.height!==expected.height)errors.push({code:'view_bounds_mismatch',view:view,expected:expected,actual:actual});
    });
    if(manifest.status!=='ready')errors.push({code:'asset_pipeline_not_ready',status:manifest.status||null});
    if(options.requireActivation!==false){
      var activation=manifest.activation||{};
      var approvedAt=typeof activation.approvedAt==='string'&&!isNaN(Date.parse(activation.approvedAt));
      if(activation.status!=='approved'||typeof activation.approvedBy!=='string'||!activation.approvedBy.trim()||!approvedAt||typeof activation.visualRegressionFixture!=='string'||!activation.visualRegressionFixture.trim())errors.push({code:'visual_approval_required',status:activation.status||null});
    }
    var source=manifest.source||{};
    var validSourceUrl=false;
    try{var parsedSource=new URL(source.sourceUrl);validSourceUrl=parsedSource.protocol==='https:'&&!!parsedSource.hostname&&!parsedSource.username&&!parsedSource.password}catch(_){validSourceUrl=false}
    var invalidMetadataText=/[\u0000-\u001f\u007f]/;
    var validLicense=typeof source.license==='string'&&source.license.trim().length>0&&source.license.length<=500&&!invalidMetadataText.test(source.license);
    var validAuthor=typeof source.author==='string'&&source.author.trim().length>0&&source.author.length<=500&&!invalidMetadataText.test(source.author);
    if(source.validationStatus!=='verified'||!validSourceUrl||!validLicense||!validAuthor||source.sha256Verification!=='matched'||!/^[a-f0-9]{64}$/i.test(source.sha256||''))errors.push({code:'unverified_asset_source'});
    if(manifest.baseImage!=='./assets/training-lab-v2/anatomy-base.png')errors.push({code:'invalid_asset_path',asset:'baseImage',actual:manifest.baseImage||null});
    var regions=Array.isArray(manifest.regions)?manifest.regions:[];
    if(regions.length!==EXPECTED_REGION_IDS.length)errors.push({code:'region_count_mismatch',expected:EXPECTED_REGION_IDS.length,actual:regions.length});
    var seen=Object.create(null);
    regions.forEach(function(region,index){
      var id=region&&region.regionId;
      if(!id)errors.push({code:'missing_region_id',location:'regions['+index+']'});
      else if(seen[id])errors.push({code:'duplicate_region',regionId:id});
      else seen[id]=true;
      if(id&&!REGION_MAP[id])errors.push({code:'unknown_region_id',regionId:id});
      if(id&&REGION_MAP[id]&&region.view!==REGION_MAP[id].view)errors.push({code:'region_view_mismatch',regionId:id,expected:REGION_MAP[id].view,actual:region.view||null});
      if(id&&REGION_MAP[id]){
        var expectedCanonical=REGION_MAP[id].canonicalMuscleIds.slice().sort();
        var actualCanonical=Array.isArray(region.canonicalMuscleIds)?region.canonicalMuscleIds.slice().sort():null;
        if(!actualCanonical||expectedCanonical.length!==actualCanonical.length||expectedCanonical.some(function(value,canonicalIndex){return value!==actualCanonical[canonicalIndex]}))errors.push({code:'canonical_mismatch',regionId:id,expected:expectedCanonical,actual:actualCanonical});
      }
      if(!region||!region.mask)errors.push({code:'missing_asset',asset:'mask',regionId:id||null});
      if(id&&region&&region.mask!=='./assets/training-lab-v2/masks/'+id+'.png')errors.push({code:'invalid_asset_path',asset:'mask',regionId:id,actual:region.mask});
      if(region&&region.status==='ready'&&!region.contour)errors.push({code:'missing_contour_reference',regionId:id||null});
      if(id&&region&&region.status==='ready'&&region.contour!=='./assets/training-lab-v2/contours/'+id+'.json')errors.push({code:'invalid_asset_path',asset:'contour',regionId:id,actual:region.contour||null});
      if(region&&region.status==='ready'&&!/^[a-f0-9]{64}$/i.test(region.sha256||''))errors.push({code:'missing_asset_sha256',asset:'mask',regionId:id||null});
      if(region&&region.status==='ready'&&!/^[a-f0-9]{64}$/i.test(region.contourSha256||''))errors.push({code:'missing_asset_sha256',asset:'contour',regionId:id||null});
      if(region&&region.status!=='ready')errors.push({code:'asset_not_ready',asset:'mask',regionId:id||null,status:region.status||null});
      if(region&&region.status==='ready'&&(!region.bounds||!Number.isInteger(region.bounds.x)||!Number.isInteger(region.bounds.y)||!Number.isInteger(region.bounds.width)||!Number.isInteger(region.bounds.height)))errors.push({code:'missing_region_bounds',regionId:id||null});
      if(region&&region.bounds){
        var bounds=region.bounds,viewBounds=id&&REGION_MAP[id]?VIEW_BOUNDS[REGION_MAP[id].view]:null;
        if(bounds.width<=0||bounds.height<=0||bounds.x<0||bounds.y<0)errors.push({code:'invalid_region_bounds',regionId:id||null,bounds:bounds});
        else if(viewBounds&&(bounds.x<viewBounds.x||bounds.y<viewBounds.y||bounds.x+bounds.width>viewBounds.x+viewBounds.width||bounds.y+bounds.height>viewBounds.y+viewBounds.height))errors.push({code:'region_boundary_violation',regionId:id||null,bounds:bounds,view:viewBounds});
      }
      var regionCanvas=region&&region.canvas||{};
      if(regionCanvas.width!==CANVAS_WIDTH||regionCanvas.height!==CANVAS_HEIGHT)errors.push({code:'mask_canvas_alignment',regionId:id||null,expected:[CANVAS_WIDTH,CANVAS_HEIGHT],actual:[regionCanvas.width,regionCanvas.height]});
      (region&&region.canonicalMuscleIds||[]).forEach(function(canonicalId){
        var registryRegion=REGION_MAP[id];
        if(!registryRegion||registryRegion.canonicalMuscleIds.indexOf(canonicalId)<0)errors.push({code:'invalid_canonical_reference',regionId:id||null,canonicalMuscleId:canonicalId});
      });
      if(typeof options.assetExists==='function'&&region&&region.mask&&!options.assetExists(region.mask))errors.push({code:'missing_asset',asset:'mask',regionId:id,assetUrl:region.mask});
      if(typeof options.assetExists==='function'&&region&&region.contour&&!options.assetExists(region.contour))errors.push({code:'missing_asset',asset:'contour',regionId:id,assetUrl:region.contour});
      if(typeof options.assetMetadata==='function'&&region&&region.mask&&(typeof options.assetExists!=='function'||options.assetExists(region.mask))){
        var maskMetadata=options.assetMetadata(region.mask)||{};
        if(maskMetadata.decodeError)errors.push({code:'invalid_png',asset:'mask',regionId:id||null,detail:maskMetadata.decodeError});
        if(maskMetadata.width!==CANVAS_WIDTH||maskMetadata.height!==CANVAS_HEIGHT)errors.push({code:'mask_canvas_alignment',regionId:id||null,expected:[CANVAS_WIDTH,CANVAS_HEIGHT],actual:[maskMetadata.width,maskMetadata.height]});
        if(maskMetadata.hasAlpha===false)errors.push({code:'invalid_mask_alpha',regionId:id||null});
        if(maskMetadata.bitDepth!==8||(maskMetadata.colorType!==4&&maskMetadata.colorType!==6))errors.push({code:'invalid_asset_format',asset:'mask',regionId:id||null,expected:'png-alpha-8'});
      }
    });
    EXPECTED_REGION_IDS.forEach(function(id){if(!seen[id])errors.push({code:'missing_region_id',regionId:id})});
    if(typeof options.assetExists==='function'&&manifest.baseImage&&!options.assetExists(manifest.baseImage))errors.push({code:'missing_asset',asset:'baseImage',assetUrl:manifest.baseImage});
    if(typeof options.assetMetadata==='function'&&manifest.baseImage&&(typeof options.assetExists!=='function'||options.assetExists(manifest.baseImage))){
      var baseMetadata=options.assetMetadata(manifest.baseImage)||{};
      if(baseMetadata.decodeError)errors.push({code:'invalid_png',asset:'baseImage',detail:baseMetadata.decodeError});
      if(baseMetadata.width!==CANVAS_WIDTH||baseMetadata.height!==CANVAS_HEIGHT)errors.push({code:'canvas_dimension_mismatch',asset:'baseImage',expected:[CANVAS_WIDTH,CANVAS_HEIGHT],actual:[baseMetadata.width,baseMetadata.height]});
      if(baseMetadata.bitDepth!==8||baseMetadata.colorType!==6)errors.push({code:'invalid_asset_format',asset:'baseImage',expected:'png-rgba-8'});
    }
    return {valid:errors.length===0,errors:errors};
  }

  return Object.freeze({
    assetVersion:ASSET_VERSION,
    v2AssetVersion:V2_ASSET_VERSION,
    baseImageUrl:BASE_IMAGE_URL,
    v2BaseImageUrl:V2_BASE_IMAGE_URL,
    v2ManifestUrl:V2_MANIFEST_URL,
    canvasWidth:CANVAS_WIDTH,
    canvasHeight:CANVAS_HEIGHT,
    aspectRatio:ASPECT_RATIO,
    viewBounds:VIEW_BOUNDS,
    assetContract:ASSET_CONTRACT,
    expectedRegionIds:EXPECTED_REGION_IDS,
    regions:REGIONS,
    v2Regions:V2_REGIONS,
    regionMap:REGION_MAP,
    canonicalToRegion:CANONICAL_TO_REGION,
    libraryLabelToRegion:LIBRARY_LABEL_TO_REGION,
    visualRoleOverrides:VISUAL_ROLE_OVERRIDES,
    getRegion:function(id){return REGION_MAP[id]||null},
    getRegionIdForCanonical:function(id){return REGION_MAP[id]?id:CANONICAL_TO_REGION[id]||null},
    validate:validate,
    validateManifest:validateManifest
  });
});
