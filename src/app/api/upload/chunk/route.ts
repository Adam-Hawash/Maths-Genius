// @ts-nocheck
// ============================================================
// (2026-و108) /api/upload/chunk — الراوت اللي كان ناقص خالص!
// ============================================================
// كل الرفع في المنصة (الكتب، الامتحانات، صور الواجبات، قصّ الرسمات،
// الصور المصغرة، المعرض...) بيمر على chunkedUpload → /api/upload/chunk.
// الراوت ده كان مش موجود في المشروع → Next.js بيرجع صفحة 404 HTML
// → الكلينت يحاول يقرا JSON → «Unexpected token '<', <!DOCTYPE...»
// — وده اللي كان بيكسّر: حفظ الكتب + قصّ الرسمات + ظهور الرسمات
// بعد الاستخراج + صور الواجبات والامتحانات كلها.
//
// البروتوكول (متوافق 100% مع src/lib/chunked-upload.ts):
//   POST multipart/form-data:
//     file        = جزء من الملف (binary)
//     uploadId    = معرف موحد للملف (UUID من الكلينت)
//     chunkIndex  = رقم الجزء (0-based)
//     totalChunks = إجمالي الأجزاء
//     fileName    = اسم الملف الأصلي
//     category    = تصنيف التخزين (books/exams/exam-figures/...)
//   الرد: { done: false, received, totalChunks } أو عند الاكتمال:
//         { done: true, filePath: '/api/files/<id>', fileType, filename, size }
//
//   POST JSON (ضمانة إضافية): { finalize: true, uploadId, fileName, category }
//   → لو كل الأجزاء وصلت بتجمّع وترجّع نفس رد الاكتمال.
//
// التجميع في قاعدة البيانات (جدول UploadChunk) مش في الذاكرة —
// عشان يشتغل صح حتى لو الأجزاء وصلت لسيرفرات/دوال مختلفة.
// كل رد JSON دايمًا — ممنوع أي HTML يطلع من الراوت ده.
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 120

var MAX_CHUNK_BYTES = 5 * 1024 * 1024      // 5MB للجزء الواحد
var MAX_TOTAL_BYTES = 120 * 1024 * 1024    // 120MB للملف كامل
var MAX_CHUNKS = 150

/* self-heal: ضمان وجود جدول UploadChunk (مرة واحدة لكل instance)
   — نفس نمط ensureBookTable في /api/admin/books عشان أول طلب بعد
   النشر على Turso ما يعتمدش على إن migration عدّت قبلها */
var _tableReady: Promise<void> | null = null
function ensureChunkTable() {
  if (!_tableReady) {
    _tableReady = (async function () {
      try {
        await db.$executeRawUnsafe(
          'CREATE TABLE IF NOT EXISTS UploadChunk (id TEXT PRIMARY KEY, "uploadId" TEXT NOT NULL, "chunkIndex" INTEGER NOT NULL, "totalChunks" INTEGER NOT NULL DEFAULT 0, data TEXT NOT NULL DEFAULT \'\', "fileName" TEXT NOT NULL DEFAULT \'\', category TEXT NOT NULL DEFAULT \'general\', "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)'
        )
      } catch (e) {}
      try {
        await db.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS UploadChunk_uploadId_chunkIndex_key ON UploadChunk ("uploadId", "chunkIndex")')
      } catch (e) {}
      try {
        await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS UploadChunk_uploadId_idx ON UploadChunk ("uploadId")')
      } catch (e) {}
    })()
  }
  return _tableReady
}

/* تنظيف الجلسات اليتيمة (كل فترة) — رفع فشل واتساب قبل أكتر من 3 ساعات */
var _lastCleanup = 0
async function cleanupStale() {
  var now = Date.now()
  if (now - _lastCleanup < 10 * 60 * 1000) return
  _lastCleanup = now
  try {
    await db.$executeRawUnsafe("DELETE FROM UploadChunk WHERE createdAt < datetime('now', '-3 hours')")
  } catch (e) {}
}

function guessMime(fileName: string, fallback: string): string {
  var f = String(fileName || '').toLowerCase()
  if (f.indexOf('.pdf') !== -1) return 'application/pdf'
  if (f.indexOf('.png') !== -1) return 'image/png'
  if (f.indexOf('.webp') !== -1) return 'image/webp'
  if (f.indexOf('.gif') !== -1) return 'image/gif'
  if (f.indexOf('.jpg') !== -1 || f.indexOf('.jpeg') !== -1) return 'image/jpeg'
  if (f.indexOf('.webm') !== -1) return 'video/webm'
  if (f.indexOf('.mp4') !== -1) return 'video/mp4'
  if (f.indexOf('.mov') !== -1) return 'video/quicktime'
  if (f.indexOf('.m4a') !== -1) return 'audio/mp4'
  if (f.indexOf('.mp3') !== -1) return 'audio/mpeg'
  if (f.indexOf('.wav') !== -1) return 'audio/wav'
  if (f.indexOf('.doc') !== -1) return 'application/msword'
  if (f.indexOf('.docx') !== -1) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  return fallback || 'application/octet-stream'
}

/* قفل بسيط في الذاكرة: يمنع تجميع مزدوج لو طلبين وصلوا مع بعض */
var _assembling: Record<string, boolean> = {}

/* التجميع: لو كل الأجزاء موجودة → Media جديد + مسح الأجزاء */
async function tryAssemble(uploadId: string, fileName: string, category: string): Promise<any | null> {
  if (_assembling[uploadId]) return null
  _assembling[uploadId] = true
  try {
    var rows: any[] = await db.$queryRawUnsafe(
      'SELECT "chunkIndex", data, "totalChunks", "fileName" FROM UploadChunk WHERE "uploadId" = ? ORDER BY "chunkIndex" ASC',
      uploadId
    ) as any[]
    if (!rows || rows.length === 0) return { error: 'مفيش أجزاء محفوظة للرفع ده — ابدأ من الأول' }
    var total = parseInt(String(rows[0].totalChunks || 0), 10) || rows.length
    if (rows.length < total) return null /* لسه ناقص — مش آخر جزء */

    /* تجميع بالترتيب + التحقق من التسلسل (مفيش جزء مفقود في النص) */
    var have: Record<number, string> = {}
    for (var i = 0; i < rows.length; i++) {
      have[parseInt(String(rows[i].chunkIndex), 10)] = String(rows[i].data || '')
    }
    var b64Parts: string[] = []
    for (var ci = 0; ci < total; ci++) {
      var p = have[ci]
      if (p == null) return null /* ناقص جزء في النص — مستنيين الباقي */
      b64Parts.push(p)
    }

    var b64 = b64Parts.join('')
    var safeName = String(fileName || rows[0].fileName || 'upload')
    var mime = guessMime(safeName, '')

    /* الحجم الفعلي من البايتات المفكوكة — مش تقدير من طول الـ base64
       (حشو الـ padding في آخر جزء كان بيضيف بايتات وهمية ويعيد الرفع للأبد) */
    var buf: Buffer
    try { buf = Buffer.from(b64, 'base64') } catch (e) {
      try { await db.$executeRawUnsafe('DELETE FROM UploadChunk WHERE "uploadId" = ?', uploadId) } catch (e2) {}
      return { error: 'بيانات الملف تالفة — جرب تاني' }
    }
    var sizeTotal = buf.length
    if (sizeTotal <= 0) {
      try { await db.$executeRawUnsafe('DELETE FROM UploadChunk WHERE "uploadId" = ?', uploadId) } catch (e2) {}
      return { error: 'الملف فاضي — جرب تاني' }
    }
    if (sizeTotal > MAX_TOTAL_BYTES) {
      try { await db.$executeRawUnsafe('DELETE FROM UploadChunk WHERE "uploadId" = ?', uploadId) } catch (e) {}
      return { error: 'الملف أكبر من الحد المسموح (' + Math.round(MAX_TOTAL_BYTES / 1024 / 1024) + ' ميجا)' }
    }

    var mediaId = crypto.randomUUID().replace(/[^a-zA-Z0-9-]/g, '')
    await db.media.create({
      data: {
        id: mediaId,
        filename: safeName,
        filePath: '/api/files/' + mediaId,
        fileType: mime,
        fileSize: String(sizeTotal),
        data: b64,
        category: String(category || 'general').substring(0, 32),
      },
    })
    try { await db.$executeRawUnsafe('DELETE FROM UploadChunk WHERE "uploadId" = ?', uploadId) } catch (e) {}

    return {
      done: true,
      filePath: '/api/files/' + mediaId,
      fileType: mime,
      filename: safeName,
      size: sizeTotal,
    }
  } catch (e: any) {
    console.error('[upload/chunk] assemble error:', e && e.message)
    return { error: 'فشل تجميع الملف: ' + String((e && e.message) || e) }
  } finally {
    delete _assembling[uploadId]
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureChunkTable()
    cleanupStale()

    var contentType = request.headers.get('content-type') || ''

    /* ===== وضع الـ finalize (JSON) — ضمانة لو رد آخر جزء ماوصلش للكلينت ===== */
    if (contentType.indexOf('application/json') !== -1) {
      var jbody = await request.json().catch(function () { return null })
      if (jbody && jbody.finalize) {
        var fUp = String(jbody.uploadId || '').substring(0, 80)
        if (!fUp) return NextResponse.json({ error: 'uploadId مطلوب' }, { status: 400 })
        var fRows: any[] = await db.$queryRawUnsafe(
          'SELECT "fileName", category FROM UploadChunk WHERE "uploadId" = ? LIMIT 1', fUp
        ) as any[]
        var fRes = await tryAssemble(fUp, String(jbody.fileName || (fRows[0] && fRows[0].fileName) || ''), String(jbody.category || (fRows[0] && fRows[0].category) || 'general'))
        if (!fRes) return NextResponse.json({ done: false, received: 0, message: 'الأجزاء لسه ناقصة' })
        if (fRes.error) return NextResponse.json({ error: fRes.error }, { status: 400 })
        return NextResponse.json(fRes)
      }
      return NextResponse.json({ error: 'طلب غير مفهوم' }, { status: 400 })
    }

    /* ===== الوضع العادي: جزء واحد multipart ===== */
    var fd = await request.formData()
    var file: any = fd.get('file')
    var uploadId = String(fd.get('uploadId') || '').substring(0, 80)
    var chunkIndex = parseInt(String(fd.get('chunkIndex') || '0'), 10)
    var totalChunks = parseInt(String(fd.get('totalChunks') || '1'), 10)
    var fileName = String(fd.get('fileName') || (file && file.name) || 'upload')
    var category = String(fd.get('category') || 'general').substring(0, 32)

    if (!uploadId || !/^[\w-]{6,80}$/.test(uploadId)) {
      return NextResponse.json({ error: 'uploadId غير صالح' }, { status: 400 })
    }
    if (isNaN(chunkIndex) || chunkIndex < 0 || chunkIndex >= MAX_CHUNKS) {
      return NextResponse.json({ error: 'رقم الجزء غير صالح' }, { status: 400 })
    }
    if (isNaN(totalChunks) || totalChunks < 1 || totalChunks > MAX_CHUNKS) {
      return NextResponse.json({ error: 'عدد الأجزاء غير صالح' }, { status: 400 })
    }
    if (chunkIndex >= totalChunks) {
      return NextResponse.json({ error: 'رقم الجزء أكبر من إجمالي الأجزاء' }, { status: 400 })
    }
    if (!file || !(file.size > 0)) {
      return NextResponse.json({ error: 'الجزء فاضي — جرب تاني' }, { status: 400 })
    }
    if (file.size > MAX_CHUNK_BYTES) {
      return NextResponse.json({ error: 'الجزء أكبر من الحد المسموح — قلّل حجم الجزء' }, { status: 400 })
    }

    var ab = await file.arrayBuffer()
    var b64 = Buffer.from(new Uint8Array(ab)).toString('base64')

    /* upsert الجزء — إعادة الرفع لنفس الجزء بتستبدل بدل ما تضاعف */
    await db.$executeRawUnsafe(
      'INSERT INTO UploadChunk (id, "uploadId", "chunkIndex", "totalChunks", data, "fileName", category, "createdAt") VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT("uploadId", "chunkIndex") DO UPDATE SET data = excluded.data, "totalChunks" = excluded."totalChunks", "fileName" = excluded."fileName", category = excluded.category',
      crypto.randomUUID(), uploadId, chunkIndex, totalChunks, b64, fileName, category
    )

    var countRows: any[] = await db.$queryRawUnsafe(
      'SELECT COUNT(*) AS n FROM UploadChunk WHERE "uploadId" = ?', uploadId
    ) as any[]
    var received = parseInt(String((countRows[0] && countRows[0].n) || 0), 10)

    if (received < totalChunks) {
      return NextResponse.json({ done: false, received: received, totalChunks: totalChunks })
    }

    /* اكتمل العدد → تجميع */
    var res = await tryAssemble(uploadId, fileName, category)
    if (!res) {
      /* قفل تاني بيجمع حاليًا — نرد بنجاح مؤقت والكلينت هيكمل */
      return NextResponse.json({ done: false, received: received, totalChunks: totalChunks })
    }
    if (res.error) return NextResponse.json({ error: res.error }, { status: 400 })
    return NextResponse.json(res)
  } catch (error: any) {
    console.error('[upload/chunk] error:', error)
    return NextResponse.json({ error: 'Error: ' + (error && error.message ? error.message : 'Unknown') }, { status: 500 })
  }
}
