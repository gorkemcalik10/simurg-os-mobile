(function(root,factory){
  'use strict';
  var validation=typeof module==='object'&&module.exports?require('./simurg-data-validation.js'):(root&&root.SimurgDataValidation);
  var api=factory(validation);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SimurgWorkoutRecovery=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(validation){
  'use strict';

  var SNAPSHOT_KEY='simurg-pre-workout-merge-backup';

  function clone(value){return JSON.parse(JSON.stringify(value))}
  function requireValidation(){
    if(!validation||typeof validation.validateWorkoutRecord!=='function'||typeof validation.prepareFull!=='function'){
      throw new Error('Simurg DATA doğrulama katmanı kullanılamıyor.');
    }
  }
  function normalizeText(value){return String(value==null?'':value).trim().toLocaleLowerCase('tr-TR')}
  function numeric(value){
    var number=Number(value);
    return Number.isFinite(number)?String(number):'';
  }
  function fallbackIdentity(row){
    return [
      row&&row.date,
      row&&row.sessionId,
      row&&row.exerciseId||normalizeText(row&&row.exercise),
      row&&row.startTime,
      row&&row.setIndex,
      row&&row.sets==null?1:row.sets,
      numeric(row&&row.reps),
      numeric(row&&row.weight)
    ].map(function(value){return String(value==null?'':value)}).join('\u001f');
  }
  function createIdentityIndex(rows){
    var index=Object.create(null);
    (rows||[]).forEach(function(row){
      var identity=fallbackIdentity(row);
      index[identity]=(index[identity]||0)+1;
    });
    return index;
  }
  function consumeExisting(index,row){
    var identity=fallbackIdentity(row);
    if(!index[identity])return false;
    index[identity]-=1;
    return true;
  }
  function validatedBackupRows(backup){
    requireValidation();
    validation.scan(backup,{source:'workout-recovery-backup'});
    if(!validation.isPlainObject(backup))throw new Error('Workout backup kökü bir JSON nesnesi olmalı.');
    if(!Array.isArray(backup.workouts))throw new Error('Workout backup içinde workouts dizisi bulunamadı.');
    if(!backup.workouts.length)throw new Error('Workout backup içindeki workouts dizisi boş.');
    var rows=[],invalidRecords=[];
    backup.workouts.forEach(function(row,index){
      try{rows.push(validation.validateWorkoutRecord(row,'$.workouts['+index+']',{coerce:true}))}
      catch(error){invalidRecords.push({index:index,code:error&&error.code||'invalid_workout',message:String(error&&error.message||error)})}
    });
    return {rows:rows,invalidRecords:invalidRecords};
  }
  function validateWorkoutBackup(backup){
    var result=validatedBackupRows(backup);
    var dates=result.rows.map(function(row){return row.date}).filter(Boolean).sort();
    return {
      valid:result.invalidRecords.length===0,
      workoutCount:result.rows.length,
      sourceWorkoutCount:backup.workouts.length,
      invalidRecords:result.invalidRecords,
      dateRange:{from:dates[0]||null,to:dates[dates.length-1]||null}
    };
  }
  function prepareCurrent(currentData){
    requireValidation();
    return validation.prepareFull(currentData,{source:'workout-recovery-current',canonicalizeExercises:false}).data;
  }
  function buildSimulation(currentData,backup){
    var current=prepareCurrent(currentData);
    var validated=validatedBackupRows(backup);
    if(validated.invalidRecords.length){
      var error=new Error('Workout backup '+validated.invalidRecords.length+' geçersiz kayıt içeriyor; merge durduruldu.');
      error.invalidRecords=validated.invalidRecords;
      throw error;
    }
    var index=createIdentityIndex(current.workouts),missing=[],duplicates=0;
    validated.rows.forEach(function(row){
      if(consumeExisting(index,row))duplicates+=1;
      else missing.push(row);
    });
    var affectedDates=Array.from(new Set(missing.map(function(row){return row.date}).filter(Boolean))).sort();
    var affectedExercises=Array.from(new Set(missing.map(function(row){return row.exerciseId||row.exercise}).filter(Boolean))).sort();
    var dates=validated.rows.map(function(row){return row.date}).filter(Boolean).sort();
    return {
      current:current,
      missingRows:missing,
      report:{
        currentWorkoutCount:current.workouts.length,
        backupWorkoutCount:validated.rows.length,
        missingCount:missing.length,
        duplicateCount:duplicates,
        affectedDates:affectedDates,
        affectedExercises:affectedExercises,
        expectedWorkoutCount:current.workouts.length+missing.length,
        dateRange:{from:dates[0]||null,to:dates[dates.length-1]||null},
        containsAugust20:validated.rows.some(function(row){return row.date==='2026-08-20'})
      }
    };
  }
  function simulateWorkoutMerge(currentData,backup){return buildSimulation(currentData,backup).report}
  function withoutWorkouts(data){
    var copy=clone(data);
    delete copy.workouts;
    return JSON.stringify(copy);
  }
  function mergeMissingWorkouts(currentData,backup){
    var simulation=buildSimulation(currentData,backup);
    var merged=clone(simulation.current);
    merged.workouts=merged.workouts.concat(clone(simulation.missingRows));
    var prepared=prepareCurrent(merged);
    if(withoutWorkouts(simulation.current)!==withoutWorkouts(prepared))throw new Error('Recovery güvenlik kontrolü başarısız: workouts dışındaki DATA değişti.');
    if(prepared.workouts.length!==simulation.report.expectedWorkoutCount)throw new Error('Recovery kayıt sayısı doğrulaması başarısız.');
    return {data:prepared,report:simulation.report};
  }

  function installRuntime(adapter){
    if(typeof window==='undefined'||!adapter||typeof adapter.getData!=='function'||typeof adapter.commit!=='function')return null;
    var pending=null;
    function el(id){return document.getElementById(id)}
    function snapshotAvailable(){try{return !!localStorage.getItem(SNAPSHOT_KEY)}catch(error){return false}}
    function setControl(buttonId,enabled,reason){
      var button=el(buttonId);if(!button)return;
      button.disabled=!enabled;
      button.setAttribute('aria-disabled',String(!enabled));
      button.title=enabled?'':reason;
    }
    function updateControls(){
      var canMerge=!!(pending&&pending.report&&pending.report.missingCount>0),hasSnapshot=snapshotAvailable();
      setControl('workoutRecoveryMergeBtn',canMerge,pending?'Analizde eklenecek eksik workout yok.':'Önce bir backup analiz et.');
      setControl('workoutRecoveryExportBtn',hasSnapshot,'Önce workout recovery uygula.');
      setControl('workoutRecoveryRollbackBtn',hasSnapshot,'Geri alınabilir recovery snapshot’ı yok.');
    }
    function setStatus(text,state){var node=el('workoutRecoveryStatus');if(node){node.textContent=text;node.dataset.state=state||'idle'}updateControls()}
    function format(report){
      return 'Mevcut: '+report.currentWorkoutCount+' · Backup: '+report.backupWorkoutCount+' · Eklenecek: '+report.missingCount+' · Tekrar: '+report.duplicateCount+' · Sonuç: '+report.expectedWorkoutCount+'\nTarih: '+(report.dateRange.from||'-')+' → '+(report.dateRange.to||'-')+' · 20 Ağustos: '+(report.containsAugust20?'var':'yok');
    }
    function readFile(event){
      var input=event&&event.target,file=input&&input.files&&input.files[0];
      if(!file){updateControls();return}
      if(file.size>validation.LIMITS.maxBytes){setStatus('Backup dosyası izin verilen boyutu aşıyor.','error');input.value='';return}
      var reader=new FileReader();
      reader.onload=function(){
        try{
          var backup=validation.parseJson(String(reader.result||''),{source:'workout-recovery-file'});
          var report=simulateWorkoutMerge(adapter.getData(),backup);
          pending={backup:backup,currentWorkouts:JSON.stringify(adapter.getData().workouts||[]),report:report};
          setStatus(format(report),'ready');
        }catch(error){pending=null;setStatus('Analiz başarısız: '+String(error&&error.message||error),'error')}
        finally{input.value=''}
      };
      reader.onerror=function(){pending=null;setStatus('Backup dosyası okunamadı.','error');input.value=''};
      reader.readAsText(file);
    }
    async function merge(){
      if(!pending){setStatus('Önce workout backup dosyasını analiz et.','error');return null}
      if(JSON.stringify(adapter.getData().workouts||[])!==pending.currentWorkouts){pending=null;setStatus('Workout verisi analizden sonra değişti. Backup dosyasını yeniden analiz et.','error');return null}
      if(!pending.report.missingCount){setStatus('Eklenecek eksik workout kaydı yok.','ready');return null}
      if(!window.confirm('Workout recovery uygulanacak.\n\n'+format(pending.report)+'\n\nYalnızca DATA.workouts değiştirilecek. Devam edilsin mi?'))return null;
      var previous=clone(adapter.getData()),previousRaw=localStorage.getItem(SNAPSHOT_KEY);
      try{
        var merged=mergeMissingWorkouts(previous,pending.backup);
        var snapshot={meta:{at:new Date().toISOString(),source:'workout-recovery',nonWorkoutFingerprint:withoutWorkouts(previous)},data:previous};
        window.SimurgPersistence.requireSuccess(window.SimurgPersistence.writeJson(localStorage,SNAPSHOT_KEY,snapshot));
        await adapter.commit(merged.data,{source:'workout-recovery'});
        pending=null;
        setStatus('Recovery tamamlandı. Önce: '+merged.report.currentWorkoutCount+' · Eklendi: '+merged.report.missingCount+' · Sonra: '+merged.report.expectedWorkoutCount,'success');
        return merged;
      }catch(error){
        if(previousRaw===null)window.SimurgPersistence.remove(localStorage,SNAPSHOT_KEY);else window.SimurgPersistence.writeRaw(localStorage,SNAPSHOT_KEY,previousRaw);
        setStatus('Recovery uygulanamadı: '+String(error&&error.message||error),'error');
        return null;
      }
    }
    async function rollback(){
      var raw=localStorage.getItem(SNAPSHOT_KEY);
      if(!raw){setStatus('Geri alınabilir workout recovery snapshot’ı yok.','error');return null}
      try{
        var snapshot=validation.parseJson(raw,{source:'workout-recovery-rollback'});
        if(!snapshot.meta||snapshot.meta.nonWorkoutFingerprint!==withoutWorkouts(adapter.getData()))throw new Error('Recovery sonrasında workouts dışındaki DATA değişti; yeni verileri ezmemek için otomatik geri alma durduruldu.');
        var restored=prepareCurrent(snapshot.data);
        if(!window.confirm('Workout recovery öncesindeki snapshot geri yüklenecek. Devam edilsin mi?'))return null;
        await adapter.commit(restored,{source:'workout-recovery-rollback'});
        window.SimurgPersistence.requireSuccess(window.SimurgPersistence.remove(localStorage,SNAPSHOT_KEY));
        pending=null;setStatus('Workout recovery geri alındı.','success');return restored;
      }catch(error){setStatus('Geri alma başarısız: '+String(error&&error.message||error),'error');return null}
    }
    function exportRecovered(){
      if(!snapshotAvailable()){setStatus('Önce workout recovery uygula.','idle');return null}
      var data=prepareCurrent(adapter.getData());
      adapter.download('simurg-recovered-data.json',JSON.stringify(data,null,2));
      setStatus('Mevcut doğrulanmış DATA dışa aktarıldı.','success');
    }
    window.analyzeWorkoutRecovery=readFile;
    window.mergeWorkoutRecovery=merge;
    window.rollbackWorkoutRecovery=rollback;
    window.exportRecoveredData=exportRecovered;
    updateControls();
    return {analyze:readFile,merge:merge,rollback:rollback,exportData:exportRecovered};
  }

  return {
    SNAPSHOT_KEY:SNAPSHOT_KEY,
    validateWorkoutBackup:validateWorkoutBackup,
    simulateWorkoutMerge:simulateWorkoutMerge,
    mergeMissingWorkouts:mergeMissingWorkouts,
    installRuntime:installRuntime,
    workoutIdentity:fallbackIdentity
  };
});
