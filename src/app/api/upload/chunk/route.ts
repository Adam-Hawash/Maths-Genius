import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

// Map file extensions to content types
var CONTENT_TYPES: Record<string, string> = {
  'mp4': 'video/mp4', 'webm': 'video/webm', 'mov': 'video/quicktime', 'avi': 'video/x-msvideo', 'ogg': 'video/ogg',
  'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif', 'webp': 'image/webp', 'svg': 'image/svg+xml',
  'pdf': 'application/pdf', 'doc': 'application/msword', 'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls': 'application/vnd.ms-excel', 'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

function getContentType(filename: string, fallback: string): string {
  var ext = filename.split('.').pop()?.toLowerCase() || ''
  return CONTENT_TYPES[ext] || fallback
}

// In-memory temp storage for chunked uploads (per-serverless-invocation, falls back to single-request)
var tempChunks: Record<string, { parts: ArrayBuffer[]; fileName: string; fileType: string; totalChunks: number; received: number }> = {}

export async function POST(request: NextRequest) {
  try {
    var formData = await request.formData()
    var file = formData.get('file') as File | null
    var uploadId = formData.get('uploadId') as string || ''
    var chunkIndex = parseInt(formData.get('chunkIndex') as string || '0')
    var totalChunks = parseInt(formData.get('totalChunks') as string || '1')
    var fileName = formData.get('fileName') as string || 'file'
    var category = formData.get('category') as string || 'general'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Single chunk (file < 2MB) - upload directly
    if (totalChunks <= 1) {
      var buffer = Buffer.from(await file.arrayBuffer())
      var ext = fileName.split('.').pop() || ''
      var contentType = getContentType(fileName, file.type || 'application/octet-stream')
      var blobPath = category + '/' + Date.now() + '-' + uploadId.slice(0, 8) + '.' + ext

      var blob = await put(blobPath, buffer, {
        contentType: contentType,
        access: 'public',
      })

      return NextResponse.json({
        filePath: blob.url,
        fileType: file.type || contentType,
        filename: fileName,
        size: file.size,
        done: true,
      })
    }

    // Multi-chunk: accumulate in memory (works within a single serverless function invocation)
    // For Vercel serverless, each chunk may hit a different instance, so we try our best
    var key = uploadId
    if (!tempChunks[key]) {
      tempChunks[key] = { parts: [], fileName: fileName, fileType: file.type, totalChunks: totalChunks, received: 0 }
    }
    var entry = tempChunks[key]
    var chunkBuffer = await file.arrayBuffer()
    entry.parts[chunkIndex] = chunkBuffer
    entry.received++

    // If all chunks received, assemble and upload
    if (entry.received >= entry.totalChunks) {
      var totalSize = entry.parts.reduce(function(sum, p) { return sum + p.byteLength }, 0)
      var assembled = new Uint8Array(totalSize)
      var offset = 0
      for (var i = 0; i < entry.parts.length; i++) {
        assembled.set(new Uint8Array(entry.parts[i]), offset)
        offset += entry.parts[i].byteLength
      }

      var ext2 = fileName.split('.').pop() || ''
      var ct = getContentType(fileName, entry.fileType || 'application/octet-stream')
      var bp = category + '/' + Date.now() + '-' + uploadId.slice(0, 8) + '.' + ext2

      var result = await put(bp, assembled, {
        contentType: ct,
        access: 'public',
      })

      delete tempChunks[key]

      return NextResponse.json({
        filePath: result.url,
        fileType: entry.fileType || ct,
        filename: fileName,
        size: totalSize,
        done: true,
      })
    }

    // More chunks expected
    return NextResponse.json({
      message: 'Chunk ' + (chunkIndex + 1) + ' of ' + totalChunks + ' received',
      chunkIndex: chunkIndex,
      done: false,
    })
  } catch (error: any) {
    console.error('Upload chunk error:', error)
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 })
  }
}
