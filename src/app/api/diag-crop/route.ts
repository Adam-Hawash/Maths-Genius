// @ts-nocheck
// ============================================================
// (و50-تشخيص) DIAG-CROP — تشخيص القص السيرفري على Vercel Lambda
// GET /api/diag-crop — بيرجّع نتيجة كل خطوة بالتفصيل
// مؤقت للتشخيص فقط — هيتشال بعد التأكيد
// ============================================================
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 60

function makeTestPdfB64() {
  var lines = []
  lines.push('q 0 0 0 rg 100 492 200 200 re f Q')
  var content = lines.join('\n')
  var objs = []
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objs[2] = '<< /Type /Pages /Kids [3 0 R] /Count 1 >>'
  objs[3] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << >> >>'
  objs[4] = '<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream'
  var out = '%PDF-1.4\n'
  var offsets = [0]
  for (var i = 1; i <= 4; i++) { offsets[i] = out.length; out += i + ' 0 obj\n' + objs[i] + '\nendobj\n' }
  var xref = out.length
  out += 'xref\n0 5\n0000000000 65535 f \n'
  for (var j = 1; j <= 4; j++) out += String(offsets[j]).padStart(10, '0') + ' 00000 n \n'
  out += 'trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF'
  return Buffer.from(out, 'latin1').toString('base64')
}

async function step(name, fn) {
  var t0 = Date.now()
  try {
    var r = await fn()
    return { step: name, ok: true, ms: Date.now() - t0, info: r === undefined ? '' : String(r).substring(0, 300) }
  } catch (e) {
    return { step: name, ok: false, ms: Date.now() - t0, error: String((e && e.message) || e).substring(0, 500) }
  }
}

export async function GET() {
  var results = []
  var pdfB64 = makeTestPdfB64()

  results.push(await step('env', function () {
    return JSON.stringify({
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      cwd: process.cwd(),
    })
  }))

  // 1) ملفات @napi-rs/canvas موجودة على القرص؟
  results.push(await step('files-canvas', async function () {
    var fs = await import('fs')
    var path = await import('path')
    var cwd = process.cwd()
    var candidates = [
      'node_modules/@napi-rs/canvas/package.json',
      'node_modules/@napi-rs/canvas-linux-x64-gnu/package.json',
      'node_modules/@napi-rs/canvas-linux-x64-musl/package.json',
      'node_modules/pdfjs-dist/legacy/build/pdf.mjs',
      'node_modules/pdfjs-dist/package.json',
    ]
    var found = []
    var roots = [cwd, path.join(cwd, '..'), path.join(cwd, '../..')]
    for (var ci = 0; ci < candidates.length; ci++) {
      var hit = ''
      for (var ri = 0; ri < roots.length; ri++) {
        var p = path.join(roots[ri], candidates[ci])
        if (fs.existsSync(p)) { hit = p.replace(cwd, '.'); break }
      }
      found.push(candidates[ci].split('node_modules/')[1] + '=' + (hit ? 'YES' : 'no'))
    }
    return found.join(' | ')
  }))

  // 2) استيراد @napi-rs/canvas
  var napi = null
  results.push(await step('import-napi-canvas', async function () {
    napi = await import('@napi-rs/canvas')
    return 'keys=' + Object.keys(napi).slice(0, 8).join(',')
  }))

  // 3) رسم canvas بسيط
  results.push(await step('napi-draw', async function () {
    var createCanvas = napi.createCanvas
    var c = createCanvas(100, 100)
    var ctx = c.getContext('2d')
    ctx.fillStyle = '#000000'
    ctx.fillRect(10, 10, 50, 50)
    var buf = c.toBuffer('image/jpeg', 0.8)
    return 'jpeg bytes=' + buf.length
  }))

  // 4) استيراد pdfjs legacy
  var pdfjs = null
  results.push(await step('import-pdfjs', async function () {
    if (napi) {
      if (!(globalThis).DOMMatrix) (globalThis).DOMMatrix = napi.DOMMatrix
      if (!(globalThis).Path2D) (globalThis).Path2D = napi.Path2D
      if (!(globalThis).ImageData) (globalThis).ImageData = napi.ImageData
    }
    pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
    return 'getDocument=' + (typeof pdfjs.getDocument)
  }))

  // 5) فتح PDF ورسم الصفحة
  var renderedCanvas = null
  results.push(await step('pdf-render', async function () {
    var createCanvas = napi.createCanvas
    var doc = await pdfjs.getDocument({ data: new Uint8Array(Buffer.from(pdfB64, 'base64')), isEvalSupported: false, useSystemFonts: true }).promise
    var page = await doc.getPage(1)
    var base = page.getViewport({ scale: 1 })
    var scale = Math.min(3, 1600 / Math.max(base.width, base.height))
    var vp = page.getViewport({ scale: scale })
    var canvas = createCanvas(Math.ceil(vp.width), Math.ceil(vp.height))
    var ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    await page.render({ canvasContext: ctx, viewport: vp }).promise
    renderedCanvas = canvas
    doc.destroy()
    return 'canvas=' + canvas.width + 'x' + canvas.height
  }))

  // 6) قص جزء من الصفحة
  var cropBuf = null
  results.push(await step('pdf-crop', async function () {
    var createCanvas = napi.createCanvas
    var sw = Math.round(0.33 * renderedCanvas.width)
    var sh = Math.round(0.25 * renderedCanvas.height)
    var out = createCanvas(sw, sh)
    var octx = out.getContext('2d')
    octx.fillStyle = '#ffffff'
    octx.fillRect(0, 0, sw, sh)
    octx.drawImage(renderedCanvas, 0.16 * renderedCanvas.width, 0.37 * renderedCanvas.height, sw, sh, 0, 0, sw, sh)
    cropBuf = out.toBuffer('image/jpeg', 0.85)
    return 'crop jpeg bytes=' + cropBuf.length
  }))

  // 7) كتابة Media في قاعدة البيانات
  results.push(await step('db-media-create', async function () {
    var media = await db.media.create({
      data: {
        filename: 'diag-' + Date.now() + '.jpg',
        filePath: 'diag/' + Date.now() + '.jpg',
        fileType: 'image/jpeg',
        fileSize: String(cropBuf ? cropBuf.length : 0),
        data: (cropBuf || Buffer.from('diag')).toString('base64'),
        category: 'diag',
      },
    })
    return 'media id=' + media.id
  }))

  // 8) cropFiguresServerSide كاملة
  results.push(await step('full-crop-figures', async function () {
    var mod = await import('@/lib/server-figures')
    var questions = [{
      type: 'mcq', question: 'test', options: ['', '', '', ''], correct: 0,
      sourcePage: 1,
      optionFigures: [
        { page: 1, bbox: { x: 0.14, y: 0.36, w: 0.22, h: 0.18 } },
        { page: 1, bbox: { x: 0.4, y: 0.36, w: 0.22, h: 0.18 } },
        null, null,
      ],
    }]
    var r = await mod.cropFiguresServerSide({ base64: pdfB64, name: 'diag.pdf', mime: 'application/pdf' }, questions)
    return JSON.stringify(r) + ' url0=' + ((questions[0].optionFigures[0] && questions[0].optionFigures[0].url) || 'MISSING')
  }))

  var allOk = results.every(function (r) { return r.ok })
  return NextResponse.json({ allOk: allOk, results: results })
}
