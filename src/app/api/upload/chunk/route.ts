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

async function uploadToBlob(filename: string, data: Buffer | Uint8Array, contentType: string): Promise<string> {
  var token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN is not set')
  var res = await fetch('https://upload.blob.vercel-storage.com', {
    method: 'POST',
    headers: {
      'authorization': 'Bearer ' + token,
      'x-content-type': contentType,
      'x-blob-filename': filename,
    },
    body: data,
  })
  if (!res.ok) {
    var errText = await res.text().catch(function() { return '' })
    throw new Error('Blob upload failed: ' + res.status + ' ' + errText)
  }
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
      var blobFilename = Date.now() + '-' + uploadId.slice(0, 8) + '.' + ext
      var url = await uploadToBlob(blobFilename, buffer, contentType)
      return NextResponse.json({ filePath: url, fileType: file.type || contentType, filename: fileName, size: file.size, done: true })
    }

    var key = uploadId
    if (!tempChunks[key]) tempChunks[key] = { parts: [], fileName: fileName, fileType: file.type, totalChunks: totalChunks, received: 0 }
    var entry = tempChunks[key]
    entry.parts[chunkIndex] = await file.arra
