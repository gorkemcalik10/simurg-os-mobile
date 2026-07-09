SIMURG OS — MOBILE STABLE BASELINE V1

Bu paket, test edilip onaylanan SIMURG_OS_WHOOP_MOBILE_V13_LOGGER_FIX sürümünden ayrı ana/stabil mobil sürüm olarak hazırlanmıştır.

Kapsam:
- Sadece mobil arayüz ana sürümü olarak kullanılacak stabil baseline.
- Masaüstü sürümü için kaynak kabul edilmez.
- Bundan sonraki mobil geliştirmelerde başlangıç noktası bu paket olmalıdır.

Onaylanan düzeltmeler:
- Alt menü: Ana, Recovery, Logger, Gym, Menü.
- Menü içi sadeleştirme: Ana, Recovery, Daily ve Analytics tekrarları kaldırıldı.
- Gym ekranı sadeleştirildi: Activity Session, Import JSON, Auto Next, Coach Insight, Last Session, Next Target mobilde kaldırıldı/gizlendi.
- Recovery ve Home kartlarındaki bar-yazı boşlukları iyileştirildi.
- Gym RPE/Form/Pain kutuları küçültüldü.
- Logger Activity Session kartları kompakt hale getirildi.
- Logger navigasyon dizilimi düzenlendi.
- Haftalık gün kartlarında sadece antrenman süresi gösterilir; kalori rozetten kaldırıldı.
- Service Worker cache adı stable baseline v1 olarak ayrıldı.

Çalıştırma:
1. ZIP dosyasını çıkar.
2. Terminal'de çıkarılan klasöre gir.
3. python3 -m http.server 8000
4. iPhone Safari: http://<Mac-IP>:8000/index.html

Not:
Bu dosyayı masaüstünde ana referans olarak sakla. Yeni mobil revizyonlar bunun üzerinden yapılmalıdır.
