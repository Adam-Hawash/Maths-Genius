import { readFileSync } from 'fs'
import { readdirSync } from 'fs'

const REPOS = ['Mr-Sherif-ElSayed', 'Maths-Genius', 'Mr-Mohamed-Sabry', 'Zicola-Math', 'mensat-alqaid', 'shaimaa-selim-science']
const FILES = ['src/app/api/config/route.ts', 'src/components/admin/CMSPanel.tsx', 'src/lib/ensure-schema.ts']
const t = new Bun.Transpiler({ loader: 'tsx' })
let bad = 0
for (const r of REPOS) {
  for (const f of FILES) {
    const p = `/home/z/repos/${r}/${f}`
    try {
      t.transformSync(readFileSync(p, 'utf8'))
      console.log(`OK  ${r}/${f}`)
    } catch (e) {
      bad++
      console.log(`ERR ${r}/${f} — ${String(e.message || e).split('\n')[0]}`)
    }
  }
}
console.log(bad === 0 ? '\nALL SYNTAX OK' : `\n${bad} ERRORS`)
