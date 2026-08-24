# Training Lab v2 Mapping Reconciliation

## Locked product invariants

- The analysis layer remains exactly 32 canonical muscle mappings; the presentation layer remains exactly 22 visual regions.
- Production uses the complete V1 fallback unless a full V2 package passes technical validation and recorded visual approval.
- V2 approval requires a licensed source, matching SHA-256, accepted base plus 22 masks, generated contours, a green validator, completed mobile/desktop V1-V2 review, and a green full regression suite.
- Bird Dog, Sled Push, Kettlebell Swing, Battle Rope, and Dumbbell Thruster remain unresolved documentation-only product decisions. No mapping changed.

Bu rapor çalışma zamanındaki registry, 32 canonical kas modeli ve Exercise Library üzerinden otomatik üretildi. UI davranışı değiştirilmedi.

## Analiz ve sunum katmanları

- Analiz verisi: 32 canonical kas, efektif set ve workload hesaplarının tek kaynağıdır.
- Sunum verisi: 22 görsel bölge, canonical türetim, Exercise Library görsel etiketi ve açık visual override kaynaklarını kullanabilir.
- Visual-only bölgeler ve override’lar analiz seti üretmez. Rapor bunları analiz eşlemesinden ayrı gösterir.
- Analiz mapping’i olmadan sunum verisi bulunan hareket: 6.

## Model bütünlüğü

- Canonical kas: 32
- Görsel bölge: 22
- Görsel bölgeye bağlanan canonical kas: 32/32
- Eksik canonical eşleme: Yok

## Özellikle incelenen visual-only bölgeler

| Bölge | Canonical karşılık | Exercise Library kullanımı | Visual override kullanımı |
|---|---|---|---|
| Forearms | Yok (visual-only) | barbell_curl, ez_bar_curl, dumbbell_curl, alternating_dumbbell_curl, incline_dumbbell_curl, hammer_curl, preacher_curl, cable_curl, reverse_cable_curl, reverse_grip_pushdown, farmers_walk | reverse_cable_curl, farmers_walk |
| Hip Flexors | Yok (visual-only) | dead_bug, hanging_knee_raise, captains_chair_leg_raise | dead_bug, hanging_knee_raise, captains_chair_leg_raise |
| Adductors | Yok (visual-only) | sumo_deadlift | sumo_deadlift |
| Spinal Erectors | Yok (visual-only) | barbell_bent_over_row, back_extension, reverse_hyperextension, romanian_deadlift, dumbbell_romanian_deadlift, conventional_deadlift, sumo_deadlift, plank, bird_dog | romanian_deadlift, dumbbell_romanian_deadlift, conventional_deadlift, sumo_deadlift, back_extension, reverse_hyperextension |
| Rotator Cuff | Yok (visual-only) | face_pull, prone_y_raise | prone_y_raise, face_pull |

Bu beş bölge görsel sunum katmanında vardır; 32 kaslık analiz modelinde bağımsız canonical kas değildir. Bu nedenle set hesabı üretmezler. Exercise Library etiketi veya açık visual override üzerinden yalnızca görsel katkı alırlar.

## Visual override kullanılan hareketler

| Hareket ID | Analiz mapping | Ana görsel bölgeler | Yardımcı görsel bölgeler | Analizden farklı |
|---|---:|---|---|---:|
| straight_arm_pulldown | Var | lats | triceps_long | Evet |
| back_extension | Yok | spinal_erectors | glutes, hams | Evet |
| reverse_hyperextension | Yok | spinal_erectors | glutes, hams | Evet |
| face_pull | Var | posterior_deltoid | rotator_cuff, lower_traps | Evet |
| prone_y_raise | Var | lower_traps | rotator_cuff, posterior_deltoid | Evet |
| reverse_cable_curl | Var | forearms | biceps | Evet |
| romanian_deadlift | Var | hams | glutes, spinal_erectors | Evet |
| dumbbell_romanian_deadlift | Var | hams | glutes, spinal_erectors | Evet |
| conventional_deadlift | Yok | glutes, hams | spinal_erectors, lats, upper_traps | Evet |
| sumo_deadlift | Yok | glutes | hams, quads, adductors, spinal_erectors | Evet |
| dead_bug | Var | abs | hip_flexors | Evet |
| hanging_knee_raise | Var | abs | hip_flexors | Evet |
| captains_chair_leg_raise | Var | abs | hip_flexors | Evet |
| farmers_walk | Yok | forearms | upper_traps, abs, glutes | Evet |

## Exercise Library’de canonical anatomy mapping’i bulunmayan hareketler

- Back Extension (`back_extension`) — visual override ile gösteriliyor
- Reverse Hyperextension (`reverse_hyperextension`) — visual override ile gösteriliyor
- Conventional Deadlift (`conventional_deadlift`) — visual override ile gösteriliyor
- Sumo Deadlift (`sumo_deadlift`) — visual override ile gösteriliyor
- Bird Dog (`bird_dog`)
- Farmer's Walk (`farmers_walk`) — visual override ile gösteriliyor
- Sled Push (`sled_push`)
- Kettlebell Swing (`kettlebell_swing`)
- Battle Rope (`battle_rope`)
- Dumbbell Thruster (`dumbbell_thruster`)

Bu liste ürün kararı gerektirir: canonical modele ekleme analiz davranışını değiştirir; visual override ekleme ise yalnızca Training Lab sunumunu etkiler. Bu fazda ikisi de otomatik yapılmadı.

## Açık visual-only ürün kararları

- Bird Dog (`bird_dog`) — analiz mapping: yok; sunum kaynakları: exercise-library-visual-label; karar: açık, mapping değişmedi
- Sled Push (`sled_push`) — analiz mapping: yok; sunum kaynakları: yok; karar: açık, mapping değişmedi
- Kettlebell Swing (`kettlebell_swing`) — analiz mapping: yok; sunum kaynakları: yok; karar: açık, mapping değişmedi
- Battle Rope (`battle_rope`) — analiz mapping: yok; sunum kaynakları: yok; karar: açık, mapping değişmedi
- Dumbbell Thruster (`dumbbell_thruster`) — analiz mapping: yok; sunum kaynakları: yok; karar: açık, mapping değişmedi

Ayrıntılı karar kaydı: `docs/TRAINING_LAB_V2_VISUAL_ONLY_PRODUCT_DECISIONS.md`.

## Kullanıcı dostu metin önerileri

- “1.0 ANA · 0.5 YARDIMCI” → “ANA KAS · DESTEKLEYEN KAS”
- “Anatomik efektif sete göre sıralanır.” → “En çok katkı sağlayan hareketler önce gösterilir.”
- “workload dışında tutuldu” → “Kas dağılımına henüz eklenmeyen hareketler”
- “Hesaplama Notu” → “Bu görünüm nasıl hazırlanıyor?”
