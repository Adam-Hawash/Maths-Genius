/* اختبار ز19 — منطق جودات archive.org من الكود المتشحن نفسه */
process.env.DATABASE_URL = 'file:/tmp/z19-test.db'

import { archiveOrgItemId, archiveOrgFileBase, archiveOrgBuild, PLAYER_PAGE } from './Zicola-Math/src/app/api/player/[ticket]/route'

var pass = 0, fail = 0
function ok(cond: boolean, name: string, extra?: any) {
  if (cond) { pass++; console.log('  PASS ' + name) }
  else { fail++; console.log('  FAIL ' + name, extra !== undefined ? JSON.stringify(extra) : '') }
}

/* ============ 1) استخراج ID العنصر من كل صيغ اللينكات ============ */
console.log('\n[1] archiveOrgItemId')
ok(archiveOrgItemId('https://archive.org/download/my-item/X_512kb.mp4') === 'my-item', 'download URL')
ok(archiveOrgItemId('https://archive.org/details/my-item') === 'my-item', 'details URL')
ok(archiveOrgItemId('https://archive.org/embed/my-item') === 'my-item', 'embed URL')
ok(archiveOrgItemId('https://ia800500.us.archive.org/28/items/my-item/X_512kb.mp4') === 'my-item', 'node direct URL')
ok(archiveOrgItemId('https://ia601504.us.archive.org/items/my-item/X.mp4') === 'my-item', 'node URL بدون رقم')
ok(archiveOrgItemId('https://www.youtube.com/watch?v=abc') === '', 'يوتيوب = فاضي')
ok(archiveOrgItemId('https://res.cloudinary.com/demo/video/upload/v1/x.mp4') === '', 'cloudinary = فاضي')
ok(archiveOrgItemId('https://archive.org/download/my%2Ditem/X.mp4') === 'my-item', 'ID متشفر URL')

/* ============ 2) الاسم الأساسي (عائلة الدرس) ============ */
console.log('\n[2] archiveOrgFileBase')
ok(archiveOrgFileBase('https://archive.org/download/x/Lesson5_512kb.mp4') === 'lesson5', 'مشتق 512kb')
ok(archiveOrgFileBase('https://archive.org/download/x/Lesson5.mp4') === 'lesson5', 'أصل mp4')
ok(archiveOrgFileBase('https://archive.org/download/x/Lesson5_h.264.mp4') === 'lesson5', 'مشتق h.264')
ok(archiveOrgFileBase('Lesson5.MOV') === 'lesson5', 'امتداد كبير')

/* ============ 3) بناء القايمة سيرفر — الأشكال الحقيقية للميتاداتا ============ */
console.log('\n[3] archiveOrgBuild — السيرفر')

/* الحالة A: الأصل HD ارتفاعه موجود (الشكل الكلاسيكي) */
var metaA = {
  files: [
    { name: 'lesson.mp4', height: '1080', size: '524288000', source: 'original', format: 'h.264' },
    { name: 'lesson_512kb.mp4', height: '360', size: '32000000', source: 'derivative', format: 'h.264' },
    { name: 'lesson.thumbs.jpg', height: '360', source: 'derivative', format: 'Thumbnail' },
    { name: '__ia_thumb.jpg', source: 'derivative', format: 'Thumbnail PNG' },
  ],
}
var rA = archiveOrgBuild('lesson', metaA, 'https://archive.org/download/lesson/lesson_512kb.mp4')
ok(!!rA, 'قايمة اتبنت')
ok(rA!.levels.length === 2, 'نسختين بس (الثمبنيلز متشالت)', rA?.levels)
ok(rA!.levels[0].h === 1080 && /lesson\.mp4$/.test(rA!.levels[0].url), 'الأصل 1080 أولًا', rA?.levels)
ok(rA!.levels[1].h === 360 && /lesson_512kb\.mp4$/.test(rA!.levels[1].url), 'المشتق 360 بعده')
ok(rA!.defaultUrl === rA!.levels[0].url, 'الافتراضي = الأصل HD (كان هنا بيفضل 360p!)', rA?.defaultUrl)

/* الحالة B: الأصل HD من غير ارتفاع في الميتاداتا — العلة التانية المحتملة */
var metaB = {
  files: [
    { name: 'lesson.mp4', size: '524288000', source: 'original', format: 'h.264' }, /* بدون height! */
    { name: 'lesson_512kb.mp4', height: '360', size: '32000000', source: 'derivative', format: 'h.264' },
  ],
}
var rB = archiveOrgBuild('lesson', metaB, 'https://archive.org/download/lesson/lesson_512kb.mp4')
ok(!!rB, 'قايمة اتبنت (أصل من غير ارتفاع)')
ok(rB!.levels[0].h === 0 && /lesson\.mp4$/.test(rB!.levels[0].url), 'الأصل الناقص الارتفاع بيتصدر (القديم كان بيحطه آخر حاجة = 360p افتراضي!)', rB?.levels)
ok(rB!.defaultUrl === rB!.levels[0].url, 'الافتراضي = الأصل')

/* الحالة C: عنصر فيه أكتر من فيديو (مجموعة) — الافتراضي = نفس الدرس */
var metaC = {
  files: [
    { name: 'algebra.mp4', height: '1080', size: '400000000', source: 'original' },
    { name: 'algebra_512kb.mp4', height: '360', size: '30000000', source: 'derivative' },
    { name: 'geometry.mp4', height: '720', size: '200000000', source: 'original' },
    { name: 'geometry_512kb.mp4', height: '360', size: '20000000', source: 'derivative' },
  ],
}
var rC = archiveOrgBuild('course', metaC, 'https://archive.org/download/course/geometry_512kb.mp4')
ok(!!rC && rC.levels.length === 4, 'كل النسخ في القايمة', rC?.levels?.length)
ok(rC!.defaultUrl === rC!.levels[2], 'الافتراضي = أعلى نسخة من درس geometry (مش درس algebra!)', rC?.defaultUrl)
var rC2 = archiveOrgBuild('course', metaC, 'https://ia800500.us.archive.org/28/items/course/algebra_512kb.mp4')
ok(rC2!.defaultUrl === rC2!.levels[0], 'لينك نود مباشر برضه بيرجع لدرس algebra الأصلي')

/* الحالة D: أصل AVI (المتصفحات مش بتشغله) — بيتمسح والـ h.264 بياخد مكانه */
var metaD = {
  files: [
    { name: 'lesson.avi', height: '1080', size: '700000000', source: 'original', format: 'Hi-Res MPEG4' },
    { name: 'lesson.mp4', height: '1080', size: '300000000', source: 'derivative', format: 'h.264' },
    { name: 'lesson_512kb.mp4', height: '360', size: '32000000', source: 'derivative', format: 'h.264' },
  ],
}
var rD = archiveOrgBuild('lesson', metaD, 'https://archive.org/download/lesson/lesson_512kb.mp4')
ok(!!rD && rD.levels.length === 2, 'الـ AVI اتمسح من القايمة', rD?.levels)
ok(/lesson\.mp4$/.test(rD!.defaultUrl), 'الافتراضي = مشتق h.264 المتصفح بيشتغله')

/* الحالة E: نسخة واحدة بس = السلوك القديم */
var rE = archiveOrgBuild('solo', { files: [{ name: 'only.mp4', height: '360', source: 'derivative' }] }, 'https://archive.org/download/solo/only.mp4')
ok(rE === null, 'نسخة واحدة = مفيش قايمة')

/* الحالة F: مفيش فيديو خالص */
var rF = archiveOrgBuild('book', { files: [{ name: 'x.pdf', source: 'original' }] }, 'https://archive.org/download/book/x.pdf')
ok(rF === null, 'مفيش فيديو = null')

/* الحالة G: لينك المخزن مش من القايمة أصلاً */
var rG = archiveOrgBuild('lesson', metaA, 'https://archive.org/download/lesson/weird-file.mp4')
ok(!!rG && rG.defaultUrl === rG.levels[0].url, 'لينك غريب = الافتراضي أعلى نسخة')

/* ============ 4) كود المتصفح المتشحن نفسه (من PLAYER_PAGE) ============ */
console.log('\n[4] كود المتصفح من PLAYER_PAGE المتشحن')
var sIdx = PLAYER_PAGE.indexOf('/*Z19F-START*/')
var eIdx = PLAYER_PAGE.indexOf('/*Z19F-END*/')
ok(sIdx >= 0 && eIdx > sIdx, 'بلوك الشبكة الأمان موجود في الصفحة')
var block = PLAYER_PAGE.slice(sIdx, eIdx)
/* الريجيكسات لازم تكون سليمة بعد معالجة الـ template literal */
ok(/archive\\\.org/.test(block), 'الباك سلاشات اتظبطت (\\d مش d)', block.match(/archive[^,]{0,40}/)?.[0])
ok(block.indexOf('function archClientFallback') >= 0, 'archClientFallback موجود')
ok(block.indexOf("fetch('https://archive.org/metadata/'") >= 0, 'الجلب من المتصفح مباشر')
/* نداء البديل بعد mountFile */
ok(PLAYER_PAGE.indexOf("if(CFG.kind === 'file') archClientFallback();") > 0, 'نداء البديل في الإقلاع')
ok(PLAYER_PAGE.indexOf('archTried || archLevels.length') > 0, 'بيحترم قايمة السيرفر لو موجودة')

/* تشغيل الفنكشنز النقية المستخرجة حرفيًا */
var CFG: any = { kind: 'file', fileUrl: 'https://archive.org/download/lesson/lesson_512kb.mp4' }
var archLevels: any[] = [], archCur = 0, fileApi: any = null, fileQualityLabel = '360p', archTried2 = false
var calls: any = { renderQMenu: 0, updateQLabel: 0 }
function renderQMenu() { calls.renderQMenu++ }
function updateQLabel() { calls.updateQLabel++ }
var fnCode = block
  .replace('var archTried = false;', 'var archTried2 = false;')
  .replace(/archTried \|\|/g, 'archTried2 ||')
  .replace(/archTried = true;/g, 'archTried2 = true;')
;(0, eval)(fnCode + '; globalThis.__arch = { archIdOf, archFileName, archBaseName, archBuildLevels };')
var CA: any = (globalThis as any).__arch

ok(CA.archIdOf('https://archive.org/download/lesson/x_512kb.mp4') === 'lesson', 'متصفح: archIdOf')
ok(CA.archFileName('https://ia800500.us.archive.org/28/items/lesson/lesson_512kb.mp4') === 'lesson_512kb.mp4', 'متصفح: archFileName من نود')
ok(CA.archBaseName('https://archive.org/download/lesson/Lesson5_512kb.mp4') === 'lesson5', 'متصفح: archBaseName')
var cl = CA.archBuildLevels('lesson', metaB)
ok(!!cl && cl.length === 2 && cl[0].h === 0 && /lesson\.mp4$/.test(cl[0].url), 'متصفح: نفس ترتيب الأصل الناقص', cl)
ok(CA.archBuildLevels('solo', { files: [{ name: 'only.mp4', height: '360', source: 'derivative' }] }) === null, 'متصفح: نسخة واحدة = null')

/* ============ 5) محاكاة المسار الكامل: سيرفر فشل → متصفح بنى وبدّل ============ */
console.log('\n[5] مسار فشل السيرفر كامل (بديل المتصفح)')
/* خريطة الأسماء المستخرجة كاللي فيها كل الجمل جوه بلوك eval مستقل عشان النطاقات */
var fakeVideo: any = {
  readyState: 0, currentTime: 0, paused: true, error: null, duration: 528,
  src: 'https://archive.org/download/lesson/lesson_512kb.mp4',
  loadCount: 0,
  load() { this.loadCount++ },
  addEventListener(_e: string, _f: any) {}, removeEventListener(_e: string, _f: any) {},
  play() { return { catch() {} } },
}
var CFG2: any = { kind: 'file', fileUrl: 'https://archive.org/download/lesson/lesson_512kb.mp4' }
var scopeCode = `
var archLevels = [], archCur = 0, archTried = false, fileApi = fakeVideo, fileQualityLabel = '360p';
var renderQMenuCalls = 0, updateQLabelCalls = 0;
function renderQMenu(){ renderQMenuCalls++; }
function updateQLabel(){ updateQLabelCalls++; }
` + fnCode + `
__testFetch = function(u){
  fetchUrl = u;
  return Promise.resolve({ ok: true, json: function(){ return Promise.resolve(serverMeta) } });
};
__result = (function(){
  archClientFallback();
  return null;
})();
`
var serverMeta = metaB /* السيرفر فشل — المتصفح بيجيب الميتاداتا بنفسه */
var fetchUrl = ''
var g: any = globalThis as any
g.fakeVideo = fakeVideo; g.serverMeta = serverMeta; g.CFG = CFG2
g.__testFetch = null; g.__result = null
;(0, eval)(scopeCode)
/* بعد النداء: fetch اتحطت في fetchUrl — نستدعيها يدويًا عشان النتيجة */
;(0, eval)('var p = __testFetchRes = (function(){ var res = null; __testFetch("' + 'https://archive.org/metadata/lesson' + '"); return null; })();')
/* الأبسط: نعمل استدعاء مباشر لجسم الـ then عبر إعادة تشغيل archClientFallback بـ fetch حقيقية وهمية */
g.fetch = function (u: string) {
  fetchUrl = u
  return Promise.resolve({ ok: true, json: function () { return Promise.resolve(serverMeta) } })
}
g.archLevels = null
;(0, eval)(scopeCode.replace('var archLevels = []', 'var archLevels = []'))

setTimeout(() => {
  ok(fetchUrl === 'https://archive.org/metadata/lesson', 'المتصفح طلب ميتاداتا العنصر', fetchUrl)
  ok(fakeVideo.src.indexOf('lesson_512kb') === -1 && /lesson\.mp4$/.test(fakeVideo.src), 'المصدر اتبدل للأصل HD فورًا (الطالب في ثانية 0)', fakeVideo.src)
  ok(fakeVideo.loadCount === 1, 'load اتنادى مرة للتبديل', fakeVideo.loadCount)
  var after: any = null
  ;(0, eval)('after = { lv: archLevels.length, cur: archCur, fq: fileQualityLabel, r: renderQMenuCalls, u: updateQLabelCalls }')
  after = (g as any).after
  ok(after.lv === 2, 'القايمة اتملت من المتصفح', after)
  ok(after.cur === 0, 'المختار = الأصل')
  ok(after.fq === '', 'ليبل الجودة الثابت اتشال')
  ok(after.r >= 1 && after.u >= 1, 'القايمة والليبل اترسموا تاني', after)

  /* الحالة المتقدمة: الطالب في دقيقة 7 (currentTime > 5) → ممنوع يتبدل، بس القايمة تنزل */
  var fakeVideo2: any = {
    readyState: 3, currentTime: 420, paused: false, error: null, duration: 528,
    src: 'https://archive.org/download/lesson/lesson_512kb.mp4', loadCount: 0,
    load() { this.loadCount++ },
    addEventListener(_e: string, _f: any) {}, removeEventListener(_e: string, _f: any) {},
    play() { return { catch() {} } },
  }
  g.fakeVideo = fakeVideo2
  g.__scoped2 = null
  var scopeCode2 = `
  var archLevels = [], archCur = 0, archTried = false, fileApi = fakeVideo, fileQualityLabel = '360p';
  function renderQMenu(){}
  function updateQLabel(){}
  ` + fnCode
  ;(0, eval)(scopeCode2 + '; archClientFallback(); __after2 = { lv: archLevels.length, cur: archCur, src: fileApi.src, loads: fileApi.loadCount };')
  var a2 = (g as any).__after2
  ok(a2.lv === 2, 'متقدم: القايمة نزلت برضه', a2)
  ok(/lesson_512kb/.test(a2.src) && a2.loads === 0, 'متقدم: التشغيل ما اتلغبطش (نفس النسخة ونفس الثانية)', a2)

  console.log('\n==== النتيجة: ' + pass + ' PASS / ' + fail + ' FAIL ====')
  process.exit(fail ? 1 : 0)
}, 50)
