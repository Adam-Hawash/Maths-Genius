// ============================================================
// (2026-و106) Maths Genius PWA — Service Worker بسيط وآمن
// الهدف: المنصة تتنصّب كتطبيق على شاشة الموبايل وتفتح كتطبيق
// (شاشة كاملة من غير بار المتصفح) — مش تخزين محتوى ديناميكي.
// المبدأ: كل الطلبات شبكة أولاً — الفشل فقط للتنقل (navigation)
// يرجع صفحة بسيطة "مفيش اتصال". مفيش كاش لمحتوى المنصة (البيانات
// حية وطلبات الطلاب لازم تفضل فورية ومحدثة دايمًا).
// ============================================================
var CACHE_NAME = 'mg-pwa-v1'
var OFFLINE_URL = '/offline.html'

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll([OFFLINE_URL, '/pwa-icon-192.png', '/pwa-icon-512.png'])
    }).then(function () {
      return self.skipWaiting()
    })
  )
})

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME }).map(function (k) { return caches.delete(k) })
      )
    }).then(function () {
      return self.clients.claim()
    })
  )
})

self.addEventListener('fetch', function (event) {
  var req = event.request
  // التنقلات (فتح الصفحة) — شبكة أولاً مع صفحة أوفلاين كاحتياط
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(function () {
        return caches.match(OFFLINE_URL)
      })
    )
    return
  }
  // الطلبات الأخرى — تمرير عادي (ممنوع نكاش أي API — البيانات حية)
})

self.addEventListener('message', function (event) {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})
