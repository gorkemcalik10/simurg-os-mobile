SIMURG_OS_APP_MODE_V1

Netlify yükleme:
1) Bu klasörün içindeki dosyaları Netlify deploy alanına sürükle-bırak yap.
2) index.html, manifest.json, sw.js, _headers ve icons klasörü aynı kökte kalmalı.
3) Telefonda siteyi aç, iPhone: Paylaş > Ana Ekrana Ekle. Android: Menü > Ana ekrana ekle / Install app.

Eklenenler:
- Installable PWA manifest
- Service worker + offline app shell cache
- iPhone/Android app meta tag polish
- App icon PNG + SVG compatibility
- Simurg OS boot/loading screen
- iOS install hint

Korunanlar:
- Mevcut localStorage veri yapısı
- Cloud Sync / Supabase akışı
- Universal Import
- Data Health Check
- Undo Last Import
- Professional Polish baseline


APP_ICON_CORE_V1 update:
- Icon concept changed to Simurg Core: blue energy core + orange phoenix/flame mark.
- Replaced icons/icon-192.png, icons/icon-512.png and icon-192.svg.
