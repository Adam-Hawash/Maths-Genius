// Z-17-c: sw.js retry-before-offline + smarter offline.html — all 6 platforms
import fs from 'fs'

const REPOS = [
  { dir: 'Maths-Genius', fb: 'https://maths-genius-pwa-fallback.invalid', real: 'https://maths-genius-pz.vercel.app' },
  { dir: 'Mr-Sherif-ElSayed', fb: '', real: '' },
  { dir: 'Mr-Mohamed-Sabry', fb: '', real: 'https://mr-mohamed-sabry.vercel.app' },
  { dir: 'Zicola-Math', fb: '', real: 'https://zicola-math.vercel.app' },
  { dir: 'shaimaa-selim-science', fb: '', real: 'https://shaimaa-selim-science.vercel.app' },
  { dir: 'mensat-alqaid', fb: '', real: 'https://project-emt-medical.vercel.app' },
]

const OLD_NAV = `    event.respondWith(
      fetch(req).catch(function () {
        return caches.match(OFFLINE_URL).then(function (hit) {
          return hit || fetch(req)
        })
      })
    )`

const NEW_NAV = `    /* (ز17) فشل أول fetch؟ غالبًا خدعة شبكة لحظية — إعادة محاولة بعد ٧٠٠ms
       قبل ما نطوع صفحة الأوفلاين (المستر: الصفحة كانت بتظهر مع إن النت شغال) */
    event.respondWith(
      fetch(req).catch(function () {
        return new Promise(function (resolveRetry) {
          setTimeout(function () {
            fetch(req).then(resolveRetry).catch(function () {
              caches.match(OFFLINE_URL).then(function (hit) { resolveRetry(hit || Response.error()) })
            })
          }, 700)
        })
      })
    )`

const BTN = `<button onclick="location.reload()">إعادة المحاولة</button>`

function extras(fallbackUrl) {
  const fbHtml = fallbackUrl
    ? `\n  <p style="margin:14px 0 0;font-size:13px"><a href="${fallbackUrl}" style="color:#666">أو جرّب اللينك الاحتياطي ←</a></p>`
    : ''
  return `${fbHtml}
  <script>
  /* (ز17) الأوفلاين الذكي: النت رجع؟ نرجعك للمنصة لوحدك — من غير ما تدوس حاجة */
  (function () {
    function probe() {
      try {
        fetch(location.origin, { cache: 'no-store' }).then(function (r) {
          if (r && r.status < 500) location.reload()
        }).catch(function () {})
      } catch (e) {}
    }
    window.addEventListener('online', function () { setTimeout(probe, 400) })
    setInterval(probe, 8000)
  })()
  </script>`
}

let total = 0
for (const r of REPOS) {
  const swPath = `/home/z/repos/${r.dir}/public/sw.js`
  const offPath = `/home/z/repos/${r.dir}/public/offline.html`
  const fb = r.real || r.fb

  // ---- sw.js ----
  let sw = fs.readFileSync(swPath, 'utf8')
  if (sw.includes(NEW_NAV)) { console.log(`${r.dir}/sw.js: already patched`) } else {
    if (!sw.includes(OLD_NAV)) { console.log(`${r.dir}/sw.js: MISS nav block ❌`); process.exit(1) }
    sw = sw.split(OLD_NAV).join(NEW_NAV)
    // bump cache version
    const m = sw.match(/PWA_CACHE = '([a-z-]+)-v(\d+)'/)
    if (!m) { console.log(`${r.dir}/sw.js: MISS cache name ❌`); process.exit(1) }
    const nv = `PWA_CACHE = '${m[1]}-v${Number(m[2]) + 1}'`
    sw = sw.replace(/PWA_CACHE = '[a-z-]+-v\d+'/, nv)
    fs.writeFileSync(swPath, sw)
    total++
    console.log(`${r.dir}/sw.js: nav retry + ${nv} ✓`)
  }

  // ---- offline.html ----
  let off = fs.readFileSync(offPath, 'utf8')
  if (off.includes('(ز17)')) { console.log(`${r.dir}/offline.html: already patched`); continue }
  if (!off.includes(BTN)) { console.log(`${r.dir}/offline.html: MISS button ❌`); process.exit(1) }
  off = off.replace(BTN, BTN + extras(fb))
  fs.writeFileSync(offPath, off)
  total++
  console.log(`${r.dir}/offline.html: smart probe${fb ? ' + fallback link' : ''} ✓`)
}
console.log('TOTAL replacements:', total)
