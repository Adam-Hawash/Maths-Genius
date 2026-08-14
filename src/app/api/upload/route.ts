import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, access } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

// Increase timeout for large file uploads
export const maxDuration = 300 // 5 minutes

const ALLOWED_CATEGORIES = ['videos', 'homework', 'exams', 'gallery', 'photos', 'general', 'thumbnails']
const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB

function getExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop()!.toLowerCase() : ''
}

function getFileType(mimeType: string): string {
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'doc'
  return 'file'
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const category = (formData.get('category') as string) || 'general'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: `Invalid category. Allowed: ${ALLOWED_CATEGORIES.join(', ')}` }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `File too large. Max: ${MAX_FILE_SIZE / 1024 / 1024}MB` }, { status: 400 })
    }

    if (file.size === 0) {
      return NextResponse.json({ error: 'Empty file' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const ext = getExtension(file.name)
    const uuid = randomUUID()
    const filename = `${uuid}.${ext}`

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', category)
    try {
      await access(uploadDir)
    } catch {
      await mkdir(uploadDir, { recursive: true })
    }

    const filePath = path.join(uploadDir, filename)
    await writeFile(filePath, buffer)

    const publicPath = `/uploads/${category}/${filename}`
    const fileType = getFileType(file.type)

    return NextResponse.json({
      filePath: publicPath,
      fileType,
      filename,
      size: file.size,
      mimeType: file.type,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
