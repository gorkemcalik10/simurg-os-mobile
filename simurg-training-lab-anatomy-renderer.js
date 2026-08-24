(function(root,factory){
  'use strict';
  var assets=root.SimurgTrainingLabAnatomyAssets;
  if(!assets&&typeof require==='function')assets=require('./simurg-training-lab-anatomy-assets.js');
  var api=factory(assets);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SimurgTrainingLabAnatomyRenderer=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(assets){
  'use strict';
  if(!assets)throw new Error('SimurgTrainingLabAnatomyAssets must load before renderer adapter');

  function diagnostics(activeVersion,reason,errors,manifest){
    errors=Array.isArray(errors)?errors:[];
    var missingAssets=errors.filter(function(error){return error.code==='missing_asset'||error.code==='missing_mask_reference'||error.code==='missing_contour_reference'}).map(function(error){return {asset:error.asset||null,regionId:error.regionId||null,url:error.assetUrl||null}});
    (manifest&&manifest.regions||[]).forEach(function(region){if(region.status!=='ready')missingAssets.push({asset:'mask',regionId:region.regionId||null,url:region.mask||null})});
    var seenMissing=Object.create(null);
    missingAssets=missingAssets.filter(function(item){var key=[item.asset,item.regionId,item.url].join('|');if(seenMissing[key])return false;seenMissing[key]=true;return true}).map(function(item){return Object.freeze(item)});
    var failedGates=errors.map(function(error){return error.code}).filter(function(code,index,list){return list.indexOf(code)===index});
    if(reason&&failedGates.indexOf(reason)<0)failedGates.unshift(reason);
    return Object.freeze({
      rendererMode:activeVersion==='v2'?'V2 candidate':'V1 fallback',
      requestedMode:'V2 candidate',
      blocked:activeVersion!=='v2',
      blockReason:reason||null,
      assetVersion:manifest&&manifest.assetVersion||null,
      manifestStatus:manifest&&manifest.status||null,
      activationStatus:manifest&&manifest.activation&&manifest.activation.status||null,
      missingAssets:Object.freeze(missingAssets),
      failedGates:Object.freeze(failedGates),
      validationErrors:Object.freeze(errors.slice())
    });
  }

  function versionedAssetUrl(url,assetVersion){
    if(!url||!assetVersion)return url;
    var separator=url.indexOf('?')>=0?'&':'?';
    return url+separator+'assetVersion='+encodeURIComponent(assetVersion);
  }

  function legacyPlan(reason,details){
    details=details||{};
    return Object.freeze({
      requestedVersion:'v2',
      activeVersion:'legacy-v1',
      mode:'legacy-mask-svg-hit',
      fallbackReason:reason||null,
      baseImageUrl:assets.baseImageUrl,
      canvasWidth:assets.canvasWidth,
      canvasHeight:assets.canvasHeight,
      regions:assets.regions,
      diagnostics:diagnostics('legacy-v1',reason,details.errors,details.manifest)
    });
  }

  function contourPath(contour,region){
    if(!contour||contour.regionId!==region.regionId||contour.coordinateSpace!==assets.assetContract.coordinateSpace)return null;
    if(!contour.canvas||contour.canvas.width!==assets.canvasWidth||contour.canvas.height!==assets.canvasHeight)return null;
    return typeof contour.svgPath==='string'&&/^M[\d\s.,LHVCSQTAZ-]+$/i.test(contour.svgPath.trim())?contour.svgPath.trim():null;
  }

  function v2Plan(manifest,contours){
    contours=contours||Object.create(null);
    var manifestMap=(manifest.regions||[]).reduce(function(map,item){map[item.regionId]=item;return map},Object.create(null));
    var regions=assets.v2Regions.map(function(region){
      var entry=manifestMap[region.regionId]||{};
      var derivedPath=contourPath(contours[region.regionId],region);
      var manifestPath=typeof entry.hitPath==='string'&&entry.hitPath.trim()?entry.hitPath.trim():null;
      return Object.freeze({
        regionId:region.regionId,
        id:region.id,
        label:region.label,
        view:region.view,
        highLevelGroup:region.highLevelGroup,
        maskUrl:versionedAssetUrl(entry.mask,manifest.assetVersion),
        hitPath:derivedPath||manifestPath||assets.getRegion(region.regionId).hitPath,
        hitAreaMode:derivedPath?'mask-contour-file':manifestPath?'manifest-contour':'legacy-path-fallback',
        contourUrl:versionedAssetUrl(entry.contour||region.contourUrl,manifest.assetVersion),
        viewBounds:region.viewBounds,
        bounds:entry.bounds||null,
        canonicalMuscleIds:region.canonicalMuscleIds,
        assetVersion:manifest.assetVersion,
        canvasWidth:manifest.canvas.width,
        canvasHeight:manifest.canvas.height
      });
    });
    return Object.freeze({
      requestedVersion:'v2',
      activeVersion:'v2',
      mode:'v2-mask-contour',
      fallbackReason:null,
      baseImageUrl:versionedAssetUrl(manifest.baseImage,manifest.assetVersion),
      canvasWidth:manifest.canvas.width,
      canvasHeight:manifest.canvas.height,
      regions:Object.freeze(regions),
      diagnostics:diagnostics('v2',null,[],manifest)
    });
  }

  function createPlan(options){
    options=options||{};
    if(options.preferredVersion==='legacy')return legacyPlan('legacy_explicitly_requested');
    var validation=assets.validateManifest(options.manifest,{assetExists:options.assetExists});
    if(!validation.valid)return legacyPlan(validation.errors.map(function(error){return error.code}).join(','),{errors:validation.errors,manifest:options.manifest});
    return v2Plan(options.manifest,options.contours);
  }

  function createComparisonPlan(options){
    options=options||{};
    var validation=assets.validateManifest(options.manifest,{assetExists:options.assetExists,assetMetadata:options.assetMetadata,requireActivation:false});
    var activation=options.manifest&&options.manifest.activation||{};
    var activationApproved=activation.status==='approved';
    var legacy=legacyPlan('debug_comparison_baseline');
    var candidate=validation.valid?v2Plan(options.manifest):null;
    return Object.freeze({
      mode:'v1-v2-comparison',
      v2Ready:validation.valid,
      activationApproved:activationApproved,
      legacy:legacy,
      candidate:candidate,
      blockingErrors:Object.freeze(validation.errors.slice()),
      fixtureKey:options.fixtureKey||null
    });
  }

  function defaultLoadAsset(url){
    if(typeof Image==='undefined')return Promise.resolve(url);
    return new Promise(function(resolve,reject){
      var image=new Image();
      image.onload=function(){
        if(image.naturalWidth>0&&image.naturalHeight>0)resolve(url);
        else reject(new Error('asset_empty'));
      };
      image.onerror=function(){reject(new Error('asset_load_failed'))};
      image.src=url;
    });
  }

  function preflightPlan(plan,options){
    if(!plan||plan.activeVersion!=='v2')return Promise.resolve(plan);
    var loadAsset=options.loadAsset;
    if(!loadAsset&&typeof Image!=='undefined')loadAsset=defaultLoadAsset;
    if(typeof loadAsset!=='function')return Promise.resolve(plan);
    var urls=[plan.baseImageUrl].concat(plan.regions.map(function(region){return region.maskUrl}));
    if(urls.some(function(url){return !url}))return Promise.resolve(legacyPlan('asset_preflight_missing_url'));
    return Promise.all(urls.map(function(url){return Promise.resolve(loadAsset(url))})).then(function(){
      return plan;
    }).catch(function(){
      return legacyPlan('asset_preflight_failed');
    });
  }

  function defaultLoadContour(url){
    if(typeof fetch!=='function')return Promise.reject(new Error('contour_loader_unavailable'));
    return fetch(url,{cache:'no-store'}).then(function(response){if(!response.ok)throw new Error('contour_http_'+response.status);return response.json()});
  }

  function hydrateContours(plan,options){
    if(!plan||plan.activeVersion!=='v2')return Promise.resolve(plan);
    var loadContour=options.loadContour||defaultLoadContour;
    if(typeof loadContour!=='function')return Promise.resolve(plan);
    var tasks=plan.regions.map(function(region){
      if(!region.contourUrl)return Promise.resolve([region.regionId,null,'missing_contour_url']);
      return Promise.resolve(loadContour(region.contourUrl)).then(function(contour){return [region.regionId,contour,null]}).catch(function(error){return [region.regionId,null,error&&error.message||'contour_load_failed']});
    });
    return Promise.all(tasks).then(function(entries){
      var invalid=entries.filter(function(entry){return !entry[1]||!contourPath(entry[1],plan.regions.find(function(region){return region.regionId===entry[0]}))});
      if(invalid.length)return legacyPlan('contour_preflight_failed',{manifest:options.manifest,errors:invalid.map(function(entry){return {code:'contour_preflight_failed',regionId:entry[0],detail:entry[2]||'invalid_contour_contract'}})});
      var contours=entries.reduce(function(map,entry){map[entry[0]]=entry[1];return map},Object.create(null));
      var manifest=options.manifest;
      if(!manifest)return plan;
      return v2Plan(manifest,contours);
    });
  }

  function finalizePlan(plan,options){
    return preflightPlan(plan,options).then(function(preflighted){return hydrateContours(preflighted,options)});
  }

  function loadPlan(options){
    options=options||{};
    if(options.manifest){
      if(typeof options.onManifest==='function')options.onManifest(options.manifest);
      return finalizePlan(createPlan(options),options);
    }
    var load=options.loadManifest;
    if(!load&&typeof fetch==='function')load=function(url){return fetch(url,{cache:'no-store'}).then(function(response){if(!response.ok)throw new Error('manifest_http_'+response.status);return response.json()})};
    if(typeof load!=='function')return Promise.resolve(legacyPlan('manifest_loader_unavailable'));
    return Promise.resolve(load(options.manifestUrl||assets.v2ManifestUrl)).then(function(manifest){
      if(typeof options.onManifest==='function')options.onManifest(manifest);
      var plan=createPlan({preferredVersion:options.preferredVersion||'v2',manifest:manifest,assetExists:options.assetExists,assetMetadata:options.assetMetadata});
      options.manifest=manifest;
      return finalizePlan(plan,options);
    }).catch(function(error){return legacyPlan('manifest_load_failed',{errors:[{code:'manifest_load_failed',detail:error&&error.message||null}]})});
  }

  return Object.freeze({createPlan:createPlan,loadPlan:loadPlan,preflightPlan:preflightPlan,hydrateContours:hydrateContours,createComparisonPlan:createComparisonPlan,legacyPlan:legacyPlan,diagnostics:diagnostics,versionedAssetUrl:versionedAssetUrl});
});
