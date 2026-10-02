/* ============================================================
   (G-2) فيديو «إزاي تستخدم المنصة» — أدوات مشتركة
   ============================================================
   الأدمن ممكن يضيف لينك (يوتيوب/درايف/vimeo) أو يرفع ملف فيديو.
   اللينك بيتطعّم لرابط embed صالح لـ iframe — ولو الرابط أصلاً
   embed أو مش من الأنواع المعروفة بيرجع زي ما هو.
   الملف المرفوع بيتخزن بنفس بنية المنصة (Media عبر /api/upload/chunk)
   وبيرجع filePath شكل /api/files/<id> — بيتشغل في <video controls>.
   ============================================================ */

/** استخراج معرّف يوتيوب من أي صيغة روابط معروفة */
export function youtubeId(url: string): string {
  let u = String(url || '').trim()
  if (!u) return ''
  let m =
    u.match(/(?:youtube\.com\/watch\?(?:.*&)?v=)([\w-]{6,20})/) ||
    u.match(/(?:youtu\.be\/)([\w-]{6,20})/) ||
    u.match(/(?:youtube\.com\/(?:embed|shorts|v|live)\/)([\w-]{6,20})/)
  return m ? m[1] : ''
}

/** تطبيع لينك الفيديو لرابط embed — يوتيوب / درايف / vimeo */
export function toEmbedUrl(url: string): string {
  let u = String(url || '').trim()
  if (!u) return ''
  /* يوتيوب بأي صيغة → embed */
  let yt = youtubeId(u)
  if (yt) return 'https://www.youtube.com/embed/' + yt + '?rel=0'
  /* جوجل درايف → معاينة مدمجة */
  let gd = u.match(/drive\.google\.com\/file\/d\/([\w-]+)/)
  if (gd) return 'https://drive.google.com/file/d/' + gd[1] + '/preview'
  /* درايف مفتوح بصيغة open?id= */
  let gdOpen = u.match(/drive\.google\.com\/open\?id=([\w-]+)/)
  if (gdOpen) return 'https://drive.google.com/file/d/' + gdOpen[1] + '/preview'
  /* vimeo → مشغّل مدمج */
  let vm = u.match(/vimeo\.com\/(?:video\/)?(\d{5,12})/)
  if (vm) return 'https://player.vimeo.com/video/' + vm[1]
  /* لو الرابط أصلاً embed أو مش من الأنواع المعروفة — رجّعه زي ما هو */
  return u
}

/** هل الرابط ده ملف مرفوع على المنصة (بنية Media) مش لينك خارجي؟ */
export function isPlatformFile(url: string): boolean {
  let u = String(url || '')
  return u.indexOf('/api/files/') === 0
}
