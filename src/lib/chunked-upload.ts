// Shared chunked upload utility - bypasses Next.js body size limits
// Sends files in chunks to /api/upload/chunk
//
// 2026-و20 — ضمانة «الورقة بتتحمل كاملة 100%» (طلب المستر: اول ما ادخل
// على الورق بنحملها كلها):
//  1. الصورة بترفع فورًا أول ما الطالب يختارها (مش عند التسليم)
//  2. بعد اكتمال الأجزاء بنقارن الحجم المخزن على السيرفر بحجم الملف الأصلي
//     بايت-ببايت — لو مش مطابق بنعيد الرفع **كله من الأول** (uploadId جديد)
//     مرة واحدة تلقائيًا
//  3. لو التععادة فشلت برضه بنرمي خطأ واضح بدل ما نسيب ورقة مقطوعة تتخزن
//     ويصححها الـ AI على إنها ناقصة
//
// (2026-و108) إعادة بناء بطلب المستر — «عقبال ما يحمل ساعات بيرفض»:
//  1. حجم الجزء بقى 3MB بدل 2MB (أجزاء أقل = أسرع)
//  2. رفع متوازي ×3 أجزاء في نفس الوقت (بدل واحد ورا التاني) — الكتاب
//     الكبير بيرفع في ثلث الوقت تقريبًا
//  3. استدعاء finalize بعد اكتمال كل الأجزاء — ضمانة إن التجميع حصل حتى
//     لو رد آخر جزء اتوه في الشبكة (كان ممكن يفشل الرفع كله بعد ما خلص!)
//  4. كل جزء له retry تلقائي — فشل شبكة لحظي مبيفشّلش الرفع
//  5. الراوت /api/upload/chunk نفسه اتعمل أصلًا (كان ناقص من المشروع
//     خالص وده اللي كان بيرجّع <!DOCTYPE ويكسّر كل عمليات الرفع)

const CHUNK_SIZE = 3 * 1024 * 1024 // 3MB per chunk
const PARALLEL_UPLOADS = 3         // 3 أجزاء في نفس الوقت
const UPLOAD_TIMEOUT = 300_000     // 5 minutes max per chunk
const MAX_FILE_MB = 120            // نفس سقف السيرفر بالظبط

function uploadWithTimeout(url: string, options: RequestInit): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('انتهت مهلة الرفع - حاول ملف أصغر')), UPLOAD_TIMEOUT)
    ),
  ])
}

/* محاولة إضافية أوتوماتيكية لكل جزء: فشل شبكة لحظي
 * مبيفشّلش الرفع كله (المستر كان شايف «فشل الرفع» كتير ببلاش) */
async function uploadChunkWithRetry(url: string, options: RequestInit, attempts = 2): Promise<Response> {
  var lastErr: any = null
  for (var i = 0; i < attempts; i++) {
    try {
      var res = await uploadWithTimeout(url, options)
      /* 5xx = مشكلة سيرفر لحظية → جرب تاني قبل ما تستسلم */
      if (res.status >= 500 && i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 900))
        continue
      }
      return res
    } catch (err) {
      lastErr = err
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 900))
    }
  }
  throw lastErr || new Error('فشل الرفع')
}

export interface ChunkedUploadResult {
  filePath: string
  fileType: string
  filename: string
  size: number
  done?: boolean
}

function verifySize(data: ChunkedUploadResult, expected: number) {
  if (data && typeof data.size === 'number' && data.size !== expected) {
    throw new Error('SIZE_MISMATCH:' + data.size + '/' + expected)
  }
}

function buildChunkForm(
  file: File,
  uploadId: string,
  index: number,
  total: number,
  category: string
): FormData {
  var start = index * CHUNK_SIZE
  var end = Math.min(start + CHUNK_SIZE, file.size)
  var chunk = file.slice(start, end)
  var fd = new FormData()
  fd.append('file', chunk, file.name)
  fd.append('uploadId', uploadId)
  fd.append('chunkIndex', String(index))
  fd.append('totalChunks', String(total))
  fd.append('fileName', file.name)
  fd.append('category', category)
  return fd
}

/* استخراج نتيجة JSON من رد السيرفر — بأي شكل رجع الرد بنحوله JSON
   واضح (الرسالة القديمة «Unexpected token <» كانت لأن السيرفر رجّع HTML) */
async function readJsonSafe(res: Response): Promise<any> {
  try {
    return await res.json()
  } catch (e) {
    throw new Error('السيرفر رد برد غير متوقع (كود ' + res.status + ') — جرب تاني')
  }
}

async function uploadOnce(
  file: File,
  category: string,
  onProgress?: (pct: number) => void,
  statusMsg?: (msg: string) => void
): Promise<ChunkedUploadResult> {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
  const uploadId = crypto.randomUUID()

  /* ملف صغير = جزء واحد — نفس مسار الجزء العادي (هيتجمّع فورًا) */
  var doneResult: ChunkedUploadResult | null = null
  var completed = 0

  var markDone = function (data: any) {
    if (data && data.done && data.filePath && !doneResult) {
      doneResult = {
        filePath: data.filePath,
        fileType: data.fileType || file.type || 'application/octet-stream',
        filename: data.filename || file.name,
        size: typeof data.size === 'number' ? data.size : file.size,
        done: true,
      }
    }
  }

  if (totalChunks <= 1) {
    if (statusMsg) statusMsg('جاري الرفع...')
    var res0 = await uploadChunkWithRetry('/api/upload/chunk', { method: 'POST', body: buildChunkForm(file, uploadId, 0, 1, category) })
    var data0 = await readJsonSafe(res0)
    if (!res0.ok) throw new Error(data0.error || 'فشل الرفع')
    markDone(data0)
    /* ضمانة: لو الرد الأول مفيهوش done → finalize */
    if (!doneResult) await finalizeUpload(uploadId, file, category, markDone)
    if (!doneResult) throw new Error('فشل الرفع - الملف ما اتخزنش')
    verifySize(doneResult, file.size)
    if (onProgress) onProgress(100)
    if (statusMsg) statusMsg('تم الرفع بنجاح!')
    return doneResult
  }

  /* ===== رفع متوازي: 3 أجزاء في نفس الوقت ===== */
  var nextIndex = 0
  var worker = async function () {
    for (;;) {
      var i = nextIndex
      nextIndex++
      if (i >= totalChunks || doneResult) return
      var fd = buildChunkForm(file, uploadId, i, totalChunks, category)
      var res = await uploadChunkWithRetry('/api/upload/chunk', { method: 'POST', body: fd })
      var data = await readJsonSafe(res)
      if (!res.ok) throw new Error(data.error || ('خطأ في رفع الجزء ' + (i + 1)))
      markDone(data)
      completed++
      if (onProgress) onProgress(Math.min(95, Math.round((completed / totalChunks) * 95)))
      if (statusMsg) statusMsg('جاري رفع أجزاء الملف... ' + completed + ' من ' + totalChunks)
    }
  }

  var workers: Promise<void>[] = []
  for (var w = 0; w < Math.min(PARALLEL_UPLOADS, totalChunks); w++) workers.push(worker())
  await Promise.all(workers)

  /* لو أي رد جاب done اتبطّ النتيجة — لو لأ: نداء finalize صريح
     (التجميع على السيرفر بيحصل مع آخر جزء بيوصل، بس الرد ممكن يتوه) */
  if (!doneResult) await finalizeUpload(uploadId, file, category, markDone)
  if (!doneResult) throw new Error('فشل الرفع - لم يتم استلام كل الأجزاء')

  verifySize(doneResult, file.size)
  if (onProgress) onProgress(100)
  if (statusMsg) statusMsg('تم الرفع بنجاح!')
  return doneResult
}

/* finalize: بنطلب من السيرفر يجمع الأجزاء لو كلها وصلت */
async function finalizeUpload(
  uploadId: string,
  file: File,
  category: string,
  markDone: (data: any) => void
) {
  try {
    var resF = await uploadWithTimeout('/api/upload/chunk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ finalize: true, uploadId: uploadId, fileName: file.name, category: category }),
    })
    var dataF = await readJsonSafe(resF)
    if (resF.ok) markDone(dataF)
  } catch (e) { /* بنسيب doneResult زي ما هو — الخطأ هيطلع من التحقق */ }
}

export async function chunkedUpload(
  file: File,
  category: string,
  onProgress?: (pct: number) => void,
  statusMsg?: (msg: string) => void
): Promise<ChunkedUploadResult> {
  var sizeMb = file.size / 1024 / 1024
  if (sizeMb > MAX_FILE_MB) {
    throw new Error('الملف أكبر من ' + MAX_FILE_MB + ' ميجا — استخدم وضع «لينك خارجي» للكتب الأكبر')
  }
  try {
    return await uploadOnce(file, category, onProgress, statusMsg)
  } catch (err: any) {
    const msg = String(err && err.message ? err.message : '')
    if (msg.indexOf('SIZE_MISMATCH') === 0) {
      // الملف المخزن ناقص → محاولة أخيرة بـ uploadId جديد بالكامل
      if (statusMsg) statusMsg('بنرجّع الرفع من الأول عشان الملف يوصل كاملة...')
      const retry = await uploadOnce(file, category, onProgress, statusMsg)
      verifySize(retry, file.size)
      return retry
    }
    throw err
  }
}
