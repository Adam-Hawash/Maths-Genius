// فحص syntax لكل الملفات المعدلة في ز14 عبر Bun.Transpiler (من غير ما يحل imports)
const files = []
const repos = ['Maths-Genius', 'Mr-Mohamed-Sabry', 'Mr-Sherif-ElSayed', 'Zicola-Math', 'shaimaa-selim-science', 'mensat-alqaid']
const perRepo = [
  'src/app/api/videos/route.ts',
  'src/components/student/StudentPortal.tsx',
  'src/app/api/students/route.ts',
  'src/components/landing/AuthPages.tsx',
  'src/components/admin/AdminDashboard.tsx',
  'src/components/PaymentsPanel.tsx',
  'src/components/admin/BooksManager.tsx',
  'src/components/admin/TeacherChallengePanel.tsx',
]
for (const r of repos) for (const f of perRepo) files.push('/home/z/repos/' + r + '/' + f)
let bad = 0, checked = 0
const tr = new Bun.Transpiler({ loader: 'tsx' })
const trTs = new Bun.Transpiler({ loader: 'ts' })
for (const f of files) {
  if (!require('fs').existsSync(f)) continue
  checked++
  const code = require('fs').readFileSync(f, 'utf8')
  try {
    ;(f.endsWith('.tsx') ? tr : trTs).transformSync(code)
  } catch (e) {
    bad++
    console.log('SYNTAX ERROR :: ' + f + ' :: ' + String(e && e.message || e).slice(0, 200))
  }
}
console.log('checked ' + checked + ' files — ' + (bad === 0 ? 'ALL SYNTAX OK ✓' : bad + ' broken'))
