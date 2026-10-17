// فحص syntax للملفات المعدلة — من غير node_modules
import fs from 'fs'
import { Transpiler } from 'bun'

var files = []
for (var r of ['Maths-Genius', 'Mr-Sherif-ElSayed', 'Mr-Mohamed-Sabry', 'Zicola-Math', 'shaimaa-selim-science', 'mensat-alqaid']) {
  files.push('/home/z/repos/' + r + '/src/app/api/videos/lesson-price/route.ts')
  if (r !== 'mensat-alqaid') files.push('/home/z/repos/' + r + '/src/components/admin/AdminDashboard.tsx')
}
files.push('/home/z/repos/mensat-alqaid/src/lib/ensure-schema.ts')
files.push('/home/z/repos/mensat-alqaid/src/lib/video-guard.ts')

var bad = 0
for (var f of files) {
  try {
    new Transpiler({ loader: f.endsWith('.tsx') ? 'tsx' : 'ts' }).transformSync(fs.readFileSync(f, 'utf8'))
    console.log('PASS', f.replace('/home/z/repos/', ''))
  } catch (e) {
    bad++
    console.error('FAIL', f.replace('/home/z/repos/', ''), '→', String(e).slice(0, 200))
  }
}
console.log(bad ? '🛑 ' + bad + ' FAILURES' : '🎉 ' + files.length + '/' + files.length + ' PASS')
process.exit(bad ? 1 : 0)
