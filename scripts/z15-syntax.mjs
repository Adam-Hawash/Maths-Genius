const files = []
const sherif = ['src/stores/app-store.ts','src/components/admin/AdminDashboard.tsx','src/components/admin/GradesSchedulePanel.tsx','src/components/admin/BooksManager.tsx','src/components/admin/CommunityPanel.tsx','src/components/admin/ActivityPanel.tsx','src/components/landing/AuthPages.tsx','src/components/landing/LessonsSection.tsx','src/components/landing/PublicVideosSection.tsx','src/components/landing/GradesSection.tsx','src/app/api/grades/apply-rename/route.ts']
for (const f of sherif) files.push('/home/z/repos/Mr-Sherif-ElSayed/' + f)
for (const r of ['Maths-Genius','Mr-Mohamed-Sabry','Zicola-Math','shaimaa-selim-science','mensat-alqaid']) {
  files.push('/home/z/repos/' + r + '/src/components/admin/GradesSchedulePanel.tsx')
  files.push('/home/z/repos/' + r + '/src/components/admin/BooksManager.tsx')
}
let bad = 0, checked = 0
const tr = new Bun.Transpiler({ loader: 'tsx' })
const trTs = new Bun.Transpiler({ loader: 'ts' })
for (const f of files) {
  if (!require('fs').existsSync(f)) { console.log('MISSING :: ' + f); bad++; continue }
  checked++
  try { (f.endsWith('.tsx') ? tr : trTs).transformSync(require('fs').readFileSync(f, 'utf8')) }
  catch (e) { bad++; console.log('SYNTAX ERROR :: ' + f + ' :: ' + String(e && e.message || e).slice(0, 180)) }
}
console.log('checked ' + checked + ' — ' + (bad === 0 ? 'ALL OK ✓' : bad + ' broken'))
