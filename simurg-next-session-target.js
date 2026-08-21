(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.SimurgNextSessionTarget=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const number=value=>{
    const parsed=Number(String(value==null?'':value).replace(',','.'));
    return Number.isFinite(parsed)?parsed:0;
  };
  const clean=value=>String(value||'').trim().toLocaleLowerCase('tr-TR');
  const formatNumber=value=>number(value).toLocaleString('tr-TR',{maximumFractionDigits:2});

  function setsFromRows(rows){
    const sets=[];
    (Array.isArray(rows)?rows:[]).forEach(row=>{
      const count=Math.max(1,Math.round(number(row&&row.sets)||1));
      for(let index=0;index<count;index+=1){
        sets.push({weight:Math.max(0,number(row&&row.weight)),reps:Math.max(0,Math.round(number(row&&row.reps)))});
      }
    });
    return sets;
  }

  function formatSets(sets){
    const list=Array.isArray(sets)?sets:[];
    if(!list.length) return '';
    const sameWeight=list.every(set=>set.weight===list[0].weight);
    if(sameWeight) return `${formatNumber(list[0].weight)} kg × ${list.map(set=>set.reps).join(' / ')}`;
    return list.map(set=>`${formatNumber(set.weight)} kg × ${set.reps}`).join(' · ');
  }

  function feedback(rows){
    const list=Array.isArray(rows)?rows:[];
    const rpes=list.map(row=>number(row&&row.rpe)).filter(value=>value>0);
    const forms=list.map(row=>clean(row&&row.form)).filter(Boolean);
    const pains=list.map(row=>clean(row&&row.pain)).filter(Boolean);
    return {
      rpe:rpes.length?Math.max(...rpes):0,
      formGood:forms.length>0&&forms.every(value=>value==='good'||value==='iyi'),
      formUnsafe:forms.some(value=>value==='bad'||value==='okay'||value==='poor'||value==='kötü'||value==='orta'),
      painClear:pains.length>0&&pains.every(value=>value==='none'||value==='no'||value==='yok'||value==='0'),
      painUnsafe:pains.some(value=>!['none','no','yok','0'].includes(value))
    };
  }

  function recommend(sessions,options){
    const opts=options||{};
    const history=Array.isArray(sessions)?sessions:[];
    if(!history.length) return {level:'',label:'İlk kayıt',target:'',reason:'Geçmiş performans yok.',text:'Önceki kayıt yok. İlk hedef: temiz form, kontrollü RPE ve ağrısız başlangıç.'};
    const latest=history[0]||{};
    const sets=setsFromRows(latest.rows);
    if(!sets.length) return {level:'',label:'Veri bekleniyor',target:'',reason:'Son kayıtta geçerli set yok.',text:'Son kayıtta geçerli set bulunamadı. Kontrollü bir referans seti kaydet.'};
    const previous=formatSets(sets);
    const signals=feedback(latest.rows);
    const base={sourceDate:String(latest.date||''),previous,target:previous,sets,signals};
    if(signals.painUnsafe||signals.formUnsafe||signals.rpe>=9){
      return Object.assign(base,{level:'danger',label:'Kalite önceliği',reason:'Ağrı, form veya yüksek RPE sinyali nedeniyle progresyon kapatıldı.',text:`Son: ${previous}. Sonraki hedef: yükü artırma; temiz formu koru ve gerekirse hacmi azalt.`});
    }
    if(opts.allowProgression===false){
      return Object.assign(base,{level:'warning',label:'Hedefi koru',reason:opts.reason||'Hareket türü veya ek aktivite progresyonu sınırlandırıyor.',text:`Son: ${previous}. Sonraki hedef: aynı yük ve tekrarları kontrollü tamamla.`});
    }
    if(signals.formGood&&signals.painClear&&signals.rpe>=6&&signals.rpe<=7){
      const targetSets=sets.map((set,index)=>index===0?{weight:set.weight,reps:set.reps+1}:set);
      const target=formatSets(targetSets);
      return Object.assign(base,{level:'',label:'Kontrollü progresyon',target,sets:targetSets,reason:'Form iyi, ağrı yok ve RPE uygun.',text:`Son: ${previous}. Sonraki hedef: ${target}.`});
    }
    return Object.assign(base,{level:'warning',label:'Hedefi koru',reason:'Güvenli progresyon için Form Good, Pain None ve RPE 6-7 birlikte gerekli.',text:`Son: ${previous}. Sonraki hedef: ${previous}; önce kalite sinyallerini netleştir.`});
  }

  return Object.freeze({version:1,setsFromRows,formatSets,feedback,recommend});
});
