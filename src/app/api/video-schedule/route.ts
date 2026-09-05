// @ts-nocheck
// Video Schedule API
// POST: Create a video schedule for specific students with countdown
// GET: Get schedules for a video or for a student

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 30

async function ensureTable() {
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS VideoSchedule (
        id TEXT PRIMARY KEY,
        videoId TEXT NOT NULL,
        studentIds TEXT DEFAULT '',
        unlockAt DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
  } catch (e) {
    console.error('Ensure VideoSchedule table error:', e)
  }
}

// GET /api/video-schedule?videoId=xxx - get schedules for a video
// GET /api/video-schedule?studentId=xxx - get schedules for a student
export async function GET(request: NextRequest) {
  try {
    await ensureTable()
    var searchParams = new URL(request.url).searchParams
    var videoId = searchParams.get('videoId')
    var studentId = searchParams.get('studentId')

    if (videoId) {
      var rows = await db.$queryRawUnsafe(
        'SELECT * FROM VideoSchedule WHERE videoId = ? ORDER BY createdAt DESC',
        videoId
      )
      // Parse studentIds
      var schedules = (rows || []).map(function(r) {
        var ids = []
        try { ids = JSON.parse(r.studentIds || '[]') } catch(e) {}
        return { ...r, studentIds: ids }
      })
      return NextResponse.json({ schedules })
    }

    if (studentId) {
      // Get all schedules, filter by studentId
      var allRows = await db.$queryRawUnsafe('SELECT * FROM VideoSchedule ORDER BY createdAt DESC')
      var studentSchedules = []
      for (var s of (allRows || [])) {
        var ids = []
        try { ids = JSON.parse(s.studentIds || '[]') } catch(e) {}
        if (ids.includes(studentId)) {
          studentSchedules.push({ ...s, studentIds: ids })
        }
      }
      return NextResponse.json({ schedules: studentSchedules })
    }

    return NextResponse.json({ schedules: [] })
  } catch (error) {
    console.error('VideoSchedule GET error:', error)
    return NextResponse.json({ schedules: [] })
  }
}

// POST /api/video-schedule
// Body: { videoId, studentIds: [id1, id2, ...], unlockAt: ISO string }
export async function POST(request: NextRequest) {
  try {
    await ensureTable()
    var body = await request.json()
    var videoId = body.videoId
    var studentIds = body.studentIds || []
    var unlockAt = body.unlockAt

    if (!videoId || !unlockAt) {
      return NextResponse.json({ error: 'videoId و unlockAt مطلوبين' }, { status: 400 })
    }

    var id = 'vs_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    var studentIdsJson = JSON.stringify(studentIds)

    // Delete existing schedule for this video first
    try {
      await db.$executeRawUnsafe('DELETE FROM VideoSchedule WHERE videoId = ?', videoId)
    } catch (e) {}

    await db.$executeRawUnsafe(
      'INSERT INTO VideoSchedule (id, videoId, studentIds, unlockAt) VALUES (?, ?, ?, ?)',
      id, videoId, studentIdsJson, unlockAt
    )

    return NextResponse.json({ success: true, id: id })
  } catch (error) {
    console.error('VideoSchedule POST error:', error)
    return NextResponse.json({ error: 'فشل إنشاء الجدول' }, { status: 500 })
  }
}

// DELETE /api/video-schedule?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    await ensureTable()
    var searchParams = new URL(request.url).searchParams
    var id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id مطلوب' }, { status: 400 })
    }

    await db.$executeRawUnsafe('DELETE FROM VideoSchedule WHERE id = ?', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('VideoSchedule DELETE error:', error)
    return NextResponse.json({ error: 'فشل الحذف' }, { status: 500 })
  }
}
