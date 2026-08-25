import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

var CONTENT_TYPES: Record<string, string> = {
  'mp4': 'video/mp4', 'webm': 'video/webm', 'mov': 'video/quicktime', 'avi': 'video/x-msvideo',
  'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif', 'webp': 'image/webp',
  'pdf': 'application/pdf', 'doc': 'application/msword', 'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

function getContentType(filename: string, fallback: string): string {
  var ext = filename.split('.').pop()?.toLowerCase() || ''
  return CONTENT_TYPES[ext] || fallback
}

var tempChunks: Record<string, { parts: ArrayBuffer[]; fileName: string; fileType: string; totalChunks: number; received: number }> = {}
var columnReady = false

async function ensureDataColumn() {
  if (columnReady) return
  try {
    await db.$executeRawUnsafe('ALTER TABLE Media ADD COLUMN data TEXT DEFAULT ""')
    columnReady = true
  } catch (e: any) {
    if (e.message && (e.message.indexOf('duplicate column') !== -1 || e.message.indexOf('already exists') !== -1)) {
      columnReady = true
    } else {
      console.error('ensureDataColumn error (non-critical, trying to continue):', e)
      columnReady = true
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDataColumn()

    var formData = await request.formData()
    var file = formData.get('file') as File | null
    var uploadId = formData.get('uploadId') as string || ''
    var chunkIndex = parseInt(formData.get('chunkIndex') as string || '0')
    var totalChunks = parseInt(formData.get('totalChunks') as string || '1')
    var fileName = formData.get('fileName') as string || 'file'
    var category = formData.get('category') as string || 'general'
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    var buffer = Buffer.from(await file.arrayBuffer())
    var base64 = buffer.toString('base64')
    var contentType = getContentType(fileName, file.type || 'application/octet-stream')

    if (totalChunks <= 1) {
      var media = await db.media.create({
        data: {
          filename: fileName,
          filePath: '/api/files/',
          fileType: contentType,
          fileSize: String(file.size),
          category: category,
          data: base64,
        },
      })

      return NextResponse.json({
        filePath: '/api/files/' + media.id,
        fileType: contentType,
        filename: fileName,
        size: file.size,
        done: true,
      })
    }

    var key = uploadId
    if (!tempChunks[key]) tempChunks[key] = { parts: [], fileName: fileName, fileType: file.type, totalChunks: totalChunks, received: 0 }
    var entry = tempChunks[key]
    entry.parts[chunkIndex] = await file.arrayBuffer()
    entry.received++
    if (entry.received >= entry.totalChunks) {
      var totalSize = entry.parts.reduce(function(s, p) { return s + p.byteLength }, 0)
      var assembled = new Uint8Array(totalSize)
      var off = 0
      for (var i = 0; i < entry.parts.length; i++) { assembled.set(new Uint8Array(entry.parts[i]), off); off += entry.parts[i].byteLength }

      var base64Data = Buffer.from(assembled).toString('base64')
      var ct = getContentType(fileName, entry.fileType || 'application/octet-stream')

      var mediaRecord = await db.media.create({
        data: {
          filename: fileName,
          filePath: '/api/files/',
          fileType: ct,
          fileSize: String(totalSize),
          category: category,
          data: base64Data,
        },
      })

      delete tempChunks[key]
      return NextResponse.json({
        filePath: '/api/files/' + mediaRecord.id,
        fileType: ct,
        filename: fileName,
        size: totalSize,
        done: true,
      })
    }
    return NextResponse.json({ message: 'Chunk ' + (chunkIndex + 1) + '/' + totalChunks, done: false })
  } catch (error: any) {
    console.error('Upload chunk error:', error)
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 })
  }
}
