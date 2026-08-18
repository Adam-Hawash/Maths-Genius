import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/video-access?studentId=xxx&videoId=yyy - Check if student has access
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get('studentId') || ''
  const videoId = searchParams.get('videoId') || ''

  if (!studentId || !videoId) {
    return NextResponse.json({ error: 'studentId and videoId required' }, { status: 400 })
  }

  try {
    // Check if video is free (price = 0)
    const video = await db.video.findUnique({ where: { id: videoId } })
    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 })

    if (!video.price || video.price === 0) {
      return NextResponse.json({ hasAccess: true, reason: 'free' })
    }

    // Check explicit access
    const access = await db.videoAccess.findUnique({
      where: { videoId_studentId: { videoId, studentId } },
    })

    return NextResponse.json({
      hasAccess: !!access,
      reason: access ? 'granted' : 'payment_required',
    })
  } catch (error) {
    console.error('Video access check error:', error)
    return NextResponse.json({ error: 'Failed to check access' }, { status: 500 })
  }
}

// GET /api/video-access?studentId=xxx (no videoId) - Get all paid videos student can access
export async function GET_handler(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get('studentId') || ''
  const videoId = searchParams.get('videoId') || ''

  if (videoId) {
    return GET(request)
  }

  if (!studentId) {
    return NextResponse.json({ error: 'studentId required' }, { status: 400 })
  }

  try {
    const accesses = await db.videoAccess.findMany({
      where: { studentId },
      include: { video: { select: { id: true, title: true, thumbnail: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ accesses })
  } catch (error) {
    console.error('Video access list error:', error)
    return NextResponse.json({ error: 'Failed to fetch accesses' }, { status: 500 })
  }
}

// Override GET to handle both cases
export { GET_handler as GET }
