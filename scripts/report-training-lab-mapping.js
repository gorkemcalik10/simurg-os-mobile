const fs = require('node:fs');
const path = require('node:path');
const registry = require('../simurg-training-lab-anatomy-assets.js');
const anatomy = require('../simurg-muscle-anatomy.js');
const library = require('../simurg-exercise-library.js');
const OPEN_PRODUCT_DECISION_IDS = Object.freeze(['bird_dog','sled_push','kettlebell_swing','battle_rope','dumbbell_thruster']);

function roleMapFromAnalysis(mapping) {
  const result = {primary:[], secondary:[]};
  if (!mapping) return result;
  for (const item of mapping.primaryMuscles || []) {
    const id = registry.getRegionIdForCanonical(item.muscleId);
    if (id && !result.primary.includes(id)) result.primary.push(id);
  }
  for (const item of mapping.secondaryMuscles || []) {
    const id = registry.getRegionIdForCanonical(item.muscleId);
    if (id && !result.primary.includes(id) && !result.secondary.includes(id)) result.secondary.push(id);
  }
  return result;
}

function sameRoles(left, right) {
  return ['primary','secondary'].every(role => [...left[role]].sort().join(',') === [...right[role]].sort().join(','));
}

function buildReport() {
  const canonicalOwners = Object.fromEntries(anatomy.muscles.map(muscle => [muscle.id, registry.getRegionIdForCanonical(muscle.id)]));
  const visualOnlyRegions = registry.regions.filter(region => region.canonicalMuscleIds.length === 0).map(region => {
    const libraryExercises = library.exercises.filter(exercise => exercise.primaryMuscle === region.label || exercise.secondaryMuscles.includes(region.label) || registry.libraryLabelToRegion[exercise.primaryMuscle] === region.regionId || exercise.secondaryMuscles.some(label => registry.libraryLabelToRegion[label] === region.regionId));
    const overrideExercises = Object.entries(registry.visualRoleOverrides).filter(([, roles]) => roles.primary.includes(region.regionId) || roles.secondary.includes(region.regionId)).map(([exerciseId]) => exerciseId);
    return {regionId:region.regionId, label:region.label, canonicalMuscleIds:[], libraryExerciseIds:libraryExercises.map(item => item.id), overrideExerciseIds:overrideExercises};
  });
  const exerciseRows = library.exercises.map(exercise => {
    const mapping = anatomy.getExerciseMapping(exercise.id);
    const analysisRoles = roleMapFromAnalysis(mapping);
    const override = registry.visualRoleOverrides[exercise.id] || null;
    const libraryVisualOnly = [exercise.primaryMuscle, ...exercise.secondaryMuscles].map(label => registry.libraryLabelToRegion[label]).filter(Boolean);
    return {
      exerciseId:exercise.id,
      name:exercise.name,
      analysisMapped:Boolean(mapping),
      analysisRoles,
      visualOverride:override,
      overrideDiffersFromAnalysis:Boolean(override && !sameRoles(analysisRoles, override)),
      libraryVisualOnlyRegions:[...new Set(libraryVisualOnly)],
      presentationSources:[
        ...(analysisRoles.primary.length || analysisRoles.secondary.length ? ['canonical-analysis-derived'] : []),
        ...(override ? ['explicit-visual-override'] : []),
        ...(libraryVisualOnly.length ? ['exercise-library-visual-label'] : [])
      ]
    };
  });
  const productDecisions = OPEN_PRODUCT_DECISION_IDS.map(exerciseId => {
    const row = exerciseRows.find(item => item.exerciseId === exerciseId);
    return {...row, decisionStatus:'open-no-mapping-change'};
  });
  return {
    generatedAt:new Date().toISOString(),
    model:{canonicalMuscles:anatomy.muscles.length, visualRegions:registry.regions.length},
    canonicalCoverage:{mapped:Object.values(canonicalOwners).filter(Boolean).length, missing:Object.entries(canonicalOwners).filter(([, region]) => !region).map(([muscleId]) => muscleId), owners:canonicalOwners},
    visualOnlyRegions,
    exercises:{libraryTotal:exerciseRows.length, analysisUnmapped:exerciseRows.filter(row => !row.analysisMapped), visualOverrides:exerciseRows.filter(row => row.visualOverride), overrideDifferences:exerciseRows.filter(row => row.overrideDiffersFromAnalysis), presentationWithoutAnalysis:exerciseRows.filter(row => !row.analysisMapped && row.presentationSources.length > 0), rows:exerciseRows},
    productDecisions,
    uiCopyRecommendations:[
      {current:'1.0 ANA · 0.5 YARDIMCI', suggested:'ANA KAS · DESTEKLEYEN KAS'},
      {current:'Anatomik efektif sete göre sıralanır.', suggested:'En çok katkı sağlayan hareketler önce gösterilir.'},
      {current:'workload dışında tutuldu', suggested:'Kas dağılımına henüz eklenmeyen hareketler'},
      {current:'Hesaplama Notu', suggested:'Bu görünüm nasıl hazırlanıyor?'}
    ]
  };
}

function baseMarkdown(report) {
  const visualOnly = report.visualOnlyRegions.map(item => `| ${item.label} | Yok (visual-only) | ${item.libraryExerciseIds.join(', ') || '—'} | ${item.overrideExerciseIds.join(', ') || '—'} |`).join('\n');
  const overrides = report.exercises.visualOverrides.map(item => `| ${item.exerciseId} | ${item.analysisMapped ? 'Var' : 'Yok'} | ${item.visualOverride.primary.join(', ')} | ${item.visualOverride.secondary.join(', ')} | ${item.overrideDiffersFromAnalysis ? 'Evet' : 'Hayır'} |`).join('\n');
  const unmapped = report.exercises.analysisUnmapped.map(item => `- ${item.name} (\`${item.exerciseId}\`)${item.visualOverride ? ' — visual override ile gösteriliyor' : ''}`).join('\n');
  const copy = report.uiCopyRecommendations.map(item => `- “${item.current}” → “${item.suggested}”`).join('\n');
  const decisions = report.productDecisions.map(item => `- ${item.name} (\`${item.exerciseId}\`) — analiz mapping: ${item.analysisMapped ? 'var' : 'yok'}; sunum kaynakları: ${item.presentationSources.join(', ') || 'yok'}; karar: açık, mapping değişmedi`).join('\n');
  return `# Training Lab v2 Mapping Reconciliation\n\nBu rapor çalışma zamanındaki registry, 32 canonical kas modeli ve Exercise Library üzerinden otomatik üretildi. UI davranışı değiştirilmedi.\n\n## Analiz ve sunum katmanları\n\n- Analiz verisi: 32 canonical kas, efektif set ve workload hesaplarının tek kaynağıdır.\n- Sunum verisi: 22 görsel bölge, canonical türetim, Exercise Library görsel etiketi ve açık visual override kaynaklarını kullanabilir.\n- Visual-only bölgeler ve override’lar analiz seti üretmez. Rapor bunları analiz eşlemesinden ayrı gösterir.\n- Analiz mapping’i olmadan sunum verisi bulunan hareket: ${report.exercises.presentationWithoutAnalysis.length}.\n\n## Model bütünlüğü\n\n- Canonical kas: ${report.model.canonicalMuscles}\n- Görsel bölge: ${report.model.visualRegions}\n- Görsel bölgeye bağlanan canonical kas: ${report.canonicalCoverage.mapped}/${report.model.canonicalMuscles}\n- Eksik canonical eşleme: ${report.canonicalCoverage.missing.length ? report.canonicalCoverage.missing.join(', ') : 'Yok'}\n\n## Özellikle incelenen visual-only bölgeler\n\n| Bölge | Canonical karşılık | Exercise Library kullanımı | Visual override kullanımı |\n|---|---|---|---|\n${visualOnly}\n\nBu beş bölge görsel sunum katmanında vardır; 32 kaslık analiz modelinde bağımsız canonical kas değildir. Bu nedenle set hesabı üretmezler. Exercise Library etiketi veya açık visual override üzerinden yalnızca görsel katkı alırlar.\n\n## Visual override kullanılan hareketler\n\n| Hareket ID | Analiz mapping | Ana görsel bölgeler | Yardımcı görsel bölgeler | Analizden farklı |\n|---|---:|---|---|---:|\n${overrides}\n\n## Exercise Library’de canonical anatomy mapping’i bulunmayan hareketler\n\n${unmapped || '- Yok'}\n\nBu liste ürün kararı gerektirir: canonical modele ekleme analiz davranışını değiştirir; visual override ekleme ise yalnızca Training Lab sunumunu etkiler. Bu fazda ikisi de otomatik yapılmadı.\n\n## Açık visual-only ürün kararları\n\n${decisions}\n\nAyrıntılı karar kaydı: \`docs/TRAINING_LAB_V2_VISUAL_ONLY_PRODUCT_DECISIONS.md\`.\n\n## Kullanıcı dostu metin önerileri\n\n${copy}\n`;
}

function markdown(report) {
  const invariants = `## Locked product invariants

- The analysis layer remains exactly 32 canonical muscle mappings; the presentation layer remains exactly 22 visual regions.
- Production uses the complete V1 fallback unless a full V2 package passes technical validation and recorded visual approval.
- V2 approval requires a licensed source, matching SHA-256, accepted base plus 22 masks, generated contours, a green validator, completed mobile/desktop V1-V2 review, and a green full regression suite.
- Bird Dog, Sled Push, Kettlebell Swing, Battle Rope, and Dumbbell Thruster remain unresolved documentation-only product decisions. No mapping changed.`;
  return baseMarkdown(report).replace('# Training Lab v2 Mapping Reconciliation\n\n', '# Training Lab v2 Mapping Reconciliation\n\n' + invariants + '\n\n');
}

function main() {
  const report = buildReport();
  const outputIndex = process.argv.indexOf('--write');
  if (outputIndex >= 0) {
    const output = path.resolve(process.argv[outputIndex + 1]);
    fs.mkdirSync(path.dirname(output), {recursive:true});
    fs.writeFileSync(output, markdown(report));
  }
  if (process.argv.includes('--json')) process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  else process.stdout.write(markdown(report));
}

if (require.main === module) main();
module.exports = {buildReport, markdown, roleMapFromAnalysis, OPEN_PRODUCT_DECISION_IDS};
