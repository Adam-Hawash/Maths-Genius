// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Admin grants access
export async function POST(request: NextRequest) {
  try {
    const { videoId, studentId, grantedBy } = await request.json()

    if (!videoId || !studentId) {
      return NextResponse.json({ error: 'videoId and studentId required' }, { status: 400 })
    }

    const access = await db.videoAccess.upsert({
      where: { studentId_videoId: { studentId, videoId } },
      create: { studentId, videoId, grantedBy: grantedBy || 'admin' },
      update: {},
    })

    return NextResponse.json({ access, success: true })
  } catch (error) {
    console.error('Grant access error:', error)
    return NextResponse.json({ error: 'Failed to grant access' }, { status: 500 })
  }
}

// DELETE - Admin removes access
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
