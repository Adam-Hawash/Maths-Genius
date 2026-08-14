// @ts-nocheck
import { NextResponse } from 'next/server'
import { writeFile, mkdir, unlink, readFile } from 'fs/promises'
import { join, extname } from 'path'
import { existsSync } from 'fs'

var UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')

async function ensureDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

export async function POST(request) {
  try {
    await ensureDir()

    var formData = await request.formData()
    var file = formData.get('file')
    var uploadId = formData.get('uploadId') || 'unknown'
    var chunkIndex = parseInt(formData.get('chunkIndex') || '0', 10)
    var totalChunks = parseInt(formData.get('totalChunks') || '1', 10)
    var fileName = formData.get('fileName') || 'file'
    var category = formData.get('category') || 'general'

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    var categoryDir = join(UPLOAD_DIR, category)

    if (!existsSync(categoryDir)) {
      await mkdir(categoryDir, { recursive: true })
    }

    var chunkFileName = uploadId + '.part' + chunkIndex
    var chunkPath = join(categoryDir, chunkFileName)

    var bytes = await file.arrayBuffer()
    await writeFile(chunkPath, Buffer.from(bytes))

    if (chunkIndex + 1 >= totalChunks) {
      var finalBuffer = Buffer.alloc(0)
      for (var i = 0; i < totalChunks; i++) {
        var partPath = join(categoryDir, uploadId + '.part' + i)
        if (existsSync(partPath)) {
          var partData = await readFile(partPath)
          finalBuffer = Buffer.concat([finalBuffer, partData])
          try { await unlink(partPath) } catch (e) { /* ignore */ }
        }
      }

      var timestamp = Date.now()
      var randomStr = Math.random().toString(36).substring(2, 8)
      var safeName = fileName.replace(/[^a-zA-Z0-9._\-]/g, '_').substring(0, 50)
      var finalFileName = timestamp + '_' + randomStr + '_' + safeName
      var finalPath = join(categoryDir, finalFileName)

      await writeFile(finalPath, finalBuffer)

      var filePath = '/uploads/' + category + '/' + finalFileName

      return NextResponse.json({
        filePath: filePath,
        fileType: file.type || 'application/octet-stream',
        filename: finalFileName,
        size: finalBuffer.length,
        done: true
      })
    }

    return NextResponse.json({
      chunkIndex: chunkIndex,
      received: true,
      done: false
    })

  } catch (error) {
    console.error('Upload chunk error:', error)
    return NextResponse.json({ error: 'Upload failed: ' + (error.message || 'Unknown error') }, { status: 500 })
  }
}
