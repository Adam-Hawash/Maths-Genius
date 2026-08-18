import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    var { id } = await params
    var media = await db.media.findUnique({ where: { id } })
    if (!media || !media.data) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    var buffer = Buffer.from(media.data, 'base64')
    var headers = new Headers()
    headers.set('Content-Type', media.fileType || 'application/octet-stream')
    headers.set('Content-Length', String(buffer.length))
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    if (media.filename) {
      headers.set('Content-Disposition', 'inline; filename="' + media.filename.replace(/"/g, '') + '"')
    }

    return new NextResponse(buffer, { headers })
  } catch (error: any) {
    console.error('File serve error:', error)
    return NextResponse.json({ error: 'Failed to load file' }, { status: 500 })
  }
}
