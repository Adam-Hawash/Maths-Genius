import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/videos/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const video = await db.video.findUnique({ where: { id } })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    return NextResponse.json({ video })
  } catch (error) {
    console.error('Video fetch error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PUT /api/videos/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, url, grade, price } = body

    const existing = await db.video.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    const video = await db.video.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(url !== undefined && { url }),
        ...(grade !== undefined && { grade }),
        ...(price !== undefined && { price: parseFloat(price) || 0 }),
      },
    })

    return NextResponse.json({ message: 'Video updated', video })
  } catch (error) {
    console.error('Video update error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE /api/videos/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.video.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    await db.video.delete({ where: { id } })

    return NextResponse.json({ message: 'Video deleted' })
  } catch (error) {
    console.error('Video delete error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
