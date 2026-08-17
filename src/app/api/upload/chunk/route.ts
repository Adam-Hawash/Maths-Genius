import { NextRequest, NextResponse } from 'next/server'

var CONTENT_TYPES: Record<string, string> = {
  'mp4': 'video/mp4', 'webm': 'video/webm', 'mov': 'video/quicktime', 'avi': 'video/x-msvideo',
  'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif', 'webp': 'image/webp',
  'pdf': 'application/pdf', 'doc': 'application/msword', 'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls': 'application/vnd.ms-excel', 'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

function getContentType(filename: string, fallback: string): string {
  var ext = filename.split('.').pop()?.toLowerCase() || ''
  return CONTENT_TYPES[ext] || fallback
}

async function uploadToBlob(path: string, data: Buffer | Uint8Array, contentType: string): Promise<string> {
  var token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN is not set')
  var res = await fetch('https://upload.blob.vercel-storage.com/' + encodeURIComponent(path), {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer ' + token,
      'x-content-type': contentType,
      'x-blob-filename': path.split('/').pop() || 'file',
    },
    body: data,
  })
  if (!res.ok) throw new Error('Blob upload failed: ' + res.status)
  var json = await res.json()
  return json.url
}

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
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (totalChunks <= 1) {
      var buffer = Buffer.from(await file.arrayBuffer())
      var ext = fileName.split('.').pop() || ''
      var contentType = getContentType(fileName, file.type || 'application/octet-stream')
      var blobPath = category + '/' + Date.now() + '-' + uploadId.slice(0, 8) + '.' + ext
      var url = await uploadToBlob(blobPath, buffer, contentType)
      return NextResponse.json({ filePath: url, fileType: file.type || contentType, filename: fileName, size: file.size, done: true })
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
      var ext2 = fileName.split('.').pop() || ''
      var ct = getContentType(fileName, entry.fileType || 'application/octet-stream')
      var bp = category + '/' + Date.now() + '-' + uploadId.slice(0, 8) + '.' + ext2
      var resultUrl = await uploadToBlob(bp, assembled, ct)
      delete tempChunks[key]
      return NextResponse.json({ filePath: resultUrl, fileType: entry.fileType || ct, filename: fileName, size: totalSize, done: true })
    }
    return NextResponse.json({ message: 'Chunk ' + (chunkIndex + 1) + '/' + totalChunks, done: false })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 })
  }
}
