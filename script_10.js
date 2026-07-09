
/* Simurg OS Final Pre-Netlify Polish v1
   Adds: Local Data Status, Activity Quick Note, Cloud success summaries, Stable Mode label. */
(function(){
  const BUILD_NAME='Simurg OS Final Pre-Netlify Polish v1';

  function ensureMeta(){
    if(!window.DATA) return;
    DATA._meta=DATA._meta||{};
    if(!DATA._meta.build) DATA._meta.build=BUILD_NAME;
  }
  function markLocalUpdate(){
    ensureMeta();
    if(DATA&&DATA._meta){
      DATA._meta.lastLocalUpdate=new Date().toISOString();
      DATA._meta.build=BUILD_NAME;
    }
  }
  function fmtDateTime(iso){
    if(!iso) return 'Henüz kayıt yok';
    try{
      const d=new Date(iso);
      if(isNaN(d.getTime())) return String(iso);
      return d.toLocaleString('tr-TR',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
    }catch(e){return String(iso)}
  }
  function activityTypeOf(r){
    try{return normalizeActivityType(r)||'Other'}catch(e){return r.activityType||r.activity||r.workoutType||'Other'}
  }
  function dataCounts(){
    const workouts=(DATA&&DATA.workouts)||[];
    const watch=(DATA&&DATA.appleWatch)||[];
    const workoutDays=new Set(workouts.map(w=>w.date).filter(Boolean)).size;
    const activityKeys=new Set(watch.map(w=>(w.date||'-')+'::'+activityTypeOf(w))).size;
    const notes=DATA&&DATA.activityNotes?Object.keys(DATA.activityNotes).length:0;
    return {workoutDays, activities:activityKeys, appleWatch:watch.length, notes};
  }
  window.renderDataLocalStatus=function(){
    const el=document.getElementById('localDataStatus');
    if(!el||!window.DATA) return;
    ensureMeta();
    const c=dataCounts();
    const last=(DATA._meta&&DATA._meta.lastLocalUpdate)||'';
    el.innerHTML=`
      <div class="localStatusBox"><small>Last Local Update</small><b>${fmtDateTime(last)}</b></div>
      <div class="localStatusBox"><small>Total Workout Days</small><b>${c.workoutDays}</b></div>
      <div class="localStatusBox"><small>Total Activities</small><b>${c.activities}</b></div>
      <div class="localStatusBox"><small>Apple Watch Entries</small><b>${c.appleWatch}</b></div>
      <div class="localStatusBox"><small>Quick Notes</small><b>${c.notes}</b></div>
      <div class="localStatusBox"><small>Current Build</small><b>${BUILD_NAME}</b></div>`;
  };

  const oldSave=window.save;
  window.save=function(){
    markLocalUpdate();
    try{localStorage.setItem('atlas_summary_reports',JSON.stringify(DATA));}catch(e){}
    if(typeof render==='function') render();
    renderDataLocalStatus();
  };
  const oldRender=window.render;
  window.render=function(){
    if(typeof oldRender==='function') oldRender();
    renderDataLocalStatus();
  };

  function noteKey(date,type){return String(date)+'::'+String(type||'Other');}
  function getActivityNote(date,type){
    return (DATA&&DATA.activityNotes&&DATA.activityNotes[noteKey(date,type)])||'';
  }
  window.setActivityQuickNote=function(date,type){
    const key=noteKey(date,type);
    DATA.activityNotes=DATA.activityNotes||{};
    const label=(typeof activityDisplayName==='function')?activityDisplayName(type||'Other'):(type||'Activity');
    const old=DATA.activityNotes[key]||'';
    const val=prompt(`${label} için kısa not yaz. Boş bırakırsan mevcut not silinir.`, old);
    if(val===null) return false;
    const clean=String(val).trim();
    if(clean) DATA.activityNotes[key]=clean; else delete DATA.activityNotes[key];
    save();
    return false;
  };

  // Replace activity card renderer so Quick Note appears on Workout Logger activity cards.
  window.renderSingleActivityCard=function(date,a){
    if(!a) return '';
    const stats=[
      ['Süre', a.duration||'-'],
      ['Aktif', (a.active||0)+' kcal'],
      ['Toplam', (a.total||0)+' kcal'],
      ['Avg HR', a.avgHR? a.avgHR+' bpm':'-'],
      ['Max HR', a.maxHR? a.maxHR+' bpm':'-'],
      ['RPE', a.rpe||'-']
    ];
    if(a.distance) stats.push(['Mesafe', a.dist||a.distance+' m']);
    if(a.rows&&a.rows.length>1) stats.push(['Kayıt',a.rows.length+' segment']);
    const type=a.primary||'Other';
    const note=getActivityNote(date,type);
    const safeType=JSON.stringify(type);
    const safeDate=JSON.stringify(date);
    const noteHtml=note?`<div class="activityQuickNoteBox"><b>Quick Note:</b> ${escapeAttr(note)}</div>`:'';
    return `<div class="activitySessionCard" data-activity-type="${escapeAttr(type)}">
      <div class="activitySessionTop">
        <div class="activitySessionTitle">
          <div class="activityIcon">${a.emoji}</div>
          <div><small>ACTIVITY SESSION</small><b>${escapeAttr(a.name)}</b><span>${trDate(date)} · Workout Logger aktivitesi</span></div>
        </div>
        <div class="activityTopActions">
          <div class="activityPill">${(a.rows&&a.rows.length>1)?'Combined':'Apple Watch'} Load</div>
          <button class="activityNoteBtn" onclick='setActivityQuickNote(${safeDate},${safeType});return false;'>Not</button>
          <button class="activityDeleteBtn" onclick='deleteActivityCard(${safeDate},${safeType});return false;'>Sil</button>
        </div>
      </div>
      <div class="activityStatsGrid">${stats.map(([k,v])=>`<div class="activityStatBox"><small>${k}</small><b>${escapeAttr(v)}</b></div>`).join('')}</div>
      ${noteHtml}
    </div>`;
  };

  function cloudSummaryHtml(prefix, cloudUpdated){
    const c=dataCounts();
    const update=cloudUpdated?` | Cloud: ${fmtDateTime(cloudUpdated)}`:'';
    return `${prefix} | Workout Days: ${c.workoutDays} | Activities: ${c.activities} | Watch Entries: ${c.appleWatch}${update}`;
  }

  if(typeof SIMURG_SUPABASE_URL!=='undefined' && typeof simurgCloudHeaders==='function'){
    window.pushToCloud=async function(){
      try{
        if(!confirm('Bu cihazdaki mevcut Simurg OS verisi buluta gönderilecek ve cloud ana kayıt güncellenecek. Devam edelim mi?')){
          setCloudStatus('Push cancelled.','');
          return;
        }
        markLocalUpdate();
        localStorage.setItem('atlas_summary_reports',JSON.stringify(DATA));
        setCloudStatus('Pushing local data to cloud...','');
        const now=new Date().toISOString();
        const payload={data:DATA,pushedAt:now,version:'simurg-os-final-pre-netlify-polish-v1'};
        const res=await fetch(SIMURG_SUPABASE_URL + '/rest/v1/simurg_data?on_conflict=id',{
          method:'POST',
          headers:simurgCloudHeaders({'Prefer':'resolution=merge-duplicates,return=representation'}),
          body:JSON.stringify({id:SIMURG_SYNC_ID,payload:payload,updated_at:now})
        });
        if(!res.ok){const txt=await res.text();throw new Error(res.status+' '+txt)}
        setCloudStatus(cloudSummaryHtml('Cloud sync complete: local data pushed successfully.',now),'ok');
        renderDataLocalStatus();
      }catch(err){setCloudStatus('Push failed: '+err.message,'err')}
    };

    window.pullFromCloud=async function(){
      try{
        setCloudStatus('Pulling data from cloud...','');
        const res=await fetch(SIMURG_SUPABASE_URL + '/rest/v1/simurg_data?id=eq.' + encodeURIComponent(SIMURG_SYNC_ID) + '&select=payload,updated_at',{
          method:'GET',headers:simurgCloudHeaders()
        });
        if(!res.ok){const txt=await res.text();throw new Error(res.status+' '+txt)}
        const rows=await res.json();
        if(!rows.length || !rows[0].payload || !rows[0].payload.data){
          setCloudStatus('Cloud has no Simurg OS data yet. Push from one device first.','err');
          return;
        }
        if(!confirm('Pull From Cloud bu cihazdaki mevcut local veriyi buluttaki kayıtla güncelleyecek. Devam edelim mi?')){
          setCloudStatus('Pull cancelled.','');
          return;
        }
        DATA=rows[0].payload.data;
        if(!DATA.appleWatch) DATA.appleWatch=[];
        if(!DATA.dailyNotes) DATA.dailyNotes=[];
        if(!DATA.weeklyNotes) DATA.weeklyNotes=[];
        if(!DATA.customGymPrograms) DATA.customGymPrograms={};
        if(!DATA.programNames) DATA.programNames={};
        if(!DATA.activityNotes) DATA.activityNotes={};
        markLocalUpdate();
        localStorage.setItem('atlas_summary_reports',JSON.stringify(DATA));
        render();
        setCloudStatus(cloudSummaryHtml('Cloud data pulled successfully.',rows[0].updated_at||''),'ok');
      }catch(err){setCloudStatus('Pull failed: '+err.message,'err')}
    };
  }

  ensureMeta();
  setTimeout(()=>{try{renderDataLocalStatus();}catch(e){}},60);
  window.__simurgFinalPreNetlifyPolishV1=true;
})();
