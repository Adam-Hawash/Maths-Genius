import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/videos/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const video = await db.video.findUnique({ where: { id } })
    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    return NextResponse.json({ video })
  } catch (error) {
    console.error('Video get error:', error)
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 })
  }
}

// PUT /api/videos/[id] - Update video (including price)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const video = await db.video.findUnique({ where: { id } })
    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 })

    const updateData: any = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.url !== undefined) updateData.url = body.url
    if (body.filePath !== undefined) updateData.filePath = body.filePath
    if (body.fileType !== undefined) updateData.fileType = body.fileType
    if (body.thumbnail !== undefined) updateData.thumbnail = body.thumbnail
    if (body.grade !== undefined) updateData.grade = body.grade
    if (body.price !== undefined) updateData.price = parseFloat(body.price) || 0

    const updated = await db.video.update({ where: { id }, data: updateData })
    return NextResponse.json({ video: updated })
  } catch (error) {
    console.error('Video update error:', error)
    return NextResponse.json({ error: 'Failed to update video' }, { status: 500 })
  }
}

// DELETE /api/videos/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await db.video.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Video delete error:', error)
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 })
  }
}
