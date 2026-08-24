// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/video-access/grant - Admin unlocks a paid video for one student
export async function POST(request: NextRequest) {
  try {
    const { videoId, studentId, grantedBy } = await request.json()

    if (!videoId || !studentId) {
      return NextResponse.json({ error: 'videoId and studentId required' }, { status: 400 })
    }

    const access = await db.videoAccess.upsert({
      where: { videoId_studentId: { videoId, studentId } },
      create: { videoId, studentId, grantedBy: grantedBy || 'admin' },
      update: { grantedBy: grantedBy || 'admin' },
    })

    try {
      const video = await db.video.findUnique({ where: { id: videoId } })
      await db.studentActivity.create({
        data: {
          studentId,
          action: 'video_unlocked',
          details: 'تم فتح الفيديو: ' + (video?.title || videoId),
        },
      })
    } catch (_) { /* activity logging is best effort */ }

    return NextResponse.json({ success: true, access })
  } catch (error) {
    console.error('Grant access error:', error)
    return NextResponse.json({ error: 'Failed to grant access' }, { status: 500 })
  }
}

// DELETE /api/video-access/grant - Admin locks the video again
export async function DELETE(request: NextRequest) {
  try {
    const { videoId, studentId } = await request.json()

    if (!videoId || !studentId) {
      return NextResponse.json({ error: 'videoId and studentId required' }, { status: 400 })
    }

    await db.videoAccess.deleteMany({ where: { videoId, studentId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove access error:', error)
    return NextResponse.json({ error: 'Failed to remove access' }, { status: 500 })
  }
}
