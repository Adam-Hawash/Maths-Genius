// Z-17 syntax check — all modified files across 6 repos
import fs from 'fs'
const B = '/home/z/repos'
const transpiler = new Bun.Transpiler({ loader: 'ts' })
const transpilerTsx = new Bun.Transpiler({ loader: 'tsx' })

const files = []
for (const r of ['Maths-Genius', 'Mr-Sherif-ElSayed', 'Mr-Mohamed-Sabry', 'Zicola-Math', 'shaimaa-selim-science', 'mensat-alqaid']) {
  files.push([`${B}/${r}/src/lib/gemini.ts`, 'ts'])
  files.push([`${B}/${r}/src/app/api/ai/assistant/route.ts`, 'ts'])
  files.push([`${B}/${r}/public/sw.js`, 'js'])
}
files.push([`${B}/mensat-alqaid/src/app/layout.tsx`, 'tsx'])

let bad = 0
for (const [f, kind] of files) {
  const src = fs.readFileSync(f, 'utf8')
  try {
    if (kind === 'js') new Function(src.replace(/import\s[^\n]*\n/g, '').replace(/export\s/g, ''))
    else (kind === 'tsx' ? transpilerTsx : transpiler).transformSync(src)
    console.log('OK  ' + f.replace(B + '/', ''))
  } catch (e) {
    bad++
    console.log('ERR ' + f.replace(B + '/', '') + ' → ' + String(e && e.message || e).slice(0, 160))
  }
}
// manifest JSON
try { JSON.parse(fs.readFileSync(`${B}/mensat-alqaid/public/manifest.json`, 'utf8')); console.log('OK  mensat-alqaid/public/manifest.json') } catch (e) { bad++; console.log('ERR manifest: ' + e.message) }
console.log(bad === 0 ? '\nALL PASS ✅' : `\n${bad} FAILURES ❌`)
process.exit(bad === 0 ? 0 : 1)
