import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readFile, unlink } from 'fs/promises'
import { existsSync } from 'fs'

// Base uploads directory — resolved once at module level to avoid dynamic tracing
const UPLOADS_BASE = process.cwd() + '/public/uploads'

// Temp chunks directory
const CHUNKS_DIR = process.cwd() + '/.tmp/chunks'

async function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }
}

// Safely resolve a path within uploads — prevents path traversal
function safePath(category: string, filename: string): string {
  var base = UPLOADS_BASE + '/' + category
  return base + '/' + filename.replace(/[^a-zA-Z0-9._\-]/g, '_')
}

export async function POST(req: NextRequest) {
  try {
    var fd = await req.formData()
    var file = fd.get('file') as File | null
    var uploadId = (fd.get('uploadId') as string) || ''
    var chunkIndex = parseInt(fd.get('chunkIndex') as string) || 0
    var totalChunks = parseInt(fd.get('totalChunks') as string) || 1
    var fileName = (fd.get('fileName') as string) || 'file'
    var category = (fd.get('category') as string) || 'general'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate category to prevent path traversal
    var allowedCategories = ['videos', 'homework', 'exams', 'gallery', 'general', 'thumbnails', 'answer-keys']
    if (!allowedCategories.includes(category)) {
      category = 'general'
    }

    // Single chunk — save directly
    if (totalChunks <= 1) {
      var bytes = await file.arrayBuffer()
      var safeName = fileName.replace(/[^a-zA-Z0-9._\-]/g, '_')
      var timestamp = Date.now()
      var finalFileName = timestamp + '_' + safeName
      var finalPath = safePath(category, finalFileName)

      await ensureDir(UPLOADS_BASE + '/' + category)
      await writeFile(finalPath, Buffer.from(bytes))

      return NextResponse.json({
        filePath: '/uploads/' + category + '/' + finalFileName,
        fileType: file.type || 'application/octet-stream',
        filename: finalFileName,
        size: bytes.byteLength,
        done: true,
      })
    }

    // Multi-chunk upload
    await ensureDir(CHUNKS_DIR)
    var chunkFileName = uploadId + '.part' + chunkIndex
    var chunkPath = CHUNKS_DIR + '/' + chunkFileName

    var bytes = await file.arrayBuffer()
    await writeFile(chunkPath, Buffer.from(bytes))

    // If this is the last chunk, combine all parts
    if (chunkIndex === totalChunks - 1) {
      var safeName = fileName.replace(/[^a-zA-Z0-9._\-]/g, '_')
      var timestamp = Date.now()
      var finalFileName = timestamp + '_' + safeName
      var finalPath = safePath(category, finalFileName)

      await ensureDir(UPLOADS_BASE + '/' + category)

      // Combine all chunks in order
      var chunks: Buffer[] = []
      for (var i = 0; i < totalChunks; i++) {
        var partPath = CHUNKS_DIR + '/' + uploadId + '.part' + i
        var chunkData = await readFile(partPath)
        chunks.push(chunkData)
      }

      var finalBuffer = Buffer.concat(chunks)
      await writeFile(finalPath, finalBuffer)

      // Clean up chunk files
      for (var i = 0; i < totalChunks; i++) {
        var partPath = CHUNKS_DIR + '/' + uploadId + '.part' + i
        try { await unlink(partPath) } catch {}
      }

      return NextResponse.json({
        filePath: '/uploads/' + category + '/' + finalFileName,
        fileType: file.type || 'application/octet-stream',
        filename: finalFileName,
        size: finalBuffer.length,
        done: true,
      })
    }

    // Not the last chunk yet
    return NextResponse.json({
      chunkIndex: chunkIndex,
      done: false,
    })

  } catch (err: any) {
    console.error('Upload chunk error:', err)
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 })
  }
}
