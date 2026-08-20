
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')
    const grade = searchParams.get('grade')
    const status = searchParams.get('status')
    const keyword = searchParams.get('keyword')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    // ========== LOGIN BY PHONE (direct lookup) ==========
    if (phone) {
      try {
        const student = await db.student.findFirst({
          where: { phone: phone },
          include: {
            _count: { select: { activities: true } },
          },
        })
        if (student) {
          const withStats = { ...student, watchedVideoCount: 0 }
          return NextResponse.json({ students: [withStats], total: 1, page: 1, pageSize: 1, totalPages: 1 })
        }
        return NextResponse.json({ students: [], total: 0, page: 1, pageSize: 1, totalPages: 0 })
      } catch (loginErr: any) {
        console.error('Student login error:', loginErr)
        // If table doesn't exist, return empty (don't crash)
        return NextResponse.json({ students: [], total: 0, page: 1, pageSize: 1, totalPages: 0, error: 'DB error' })
      }
    }

    // ========== ADMIN LIST (with filters) ==========
    const where: Record<string, unknown> = {}
    if (grade) where.grade = grade
    if (status) where.status = status
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { phone: { contains: keyword } },
      ]
    }

    const [students, total] = await Promise.all([
      db.student.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { activities: true } },
        },
      }),
      db.student.count({ where }),
    ])

    // Get watched video IDs per student (for tracking)
    const allStudentIds = students.map(s => s.id)
    const watchedVideos = allStudentIds.length > 0
      ? await db.studentActivity.groupBy({
          by: ['studentId'],
          where: { studentId: { in: allStudentIds }, action: 'watched_video' },
          _count: { id: true },
        })
      : []
    const watchMap: Record<string, number> = {}
    for (const w of watchedVideos) {
      watchMap[w.studentId] = w._count.id
    }

    const studentsWithStats = students.map(s => ({
      ...s,
      watchedVideoCount: watchMap[s.id] || 0,
    }))

    return NextResponse.json({
      students: studentsWithStats,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Students fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, grade, status, parentName, parentPhone } = body

    if (!name || !phone || !grade || !parentName || !parentPhone) {
      return NextResponse.json({ error: 'All fields are required including parent information' }, { status: 400 })
    }

    const student = await db.student.create({
      data: { name, phone, grade, status: status || 'pending', parentName, parentPhone },
    })

    // Record registration activity
    await db.studentActivity.create({
      data: { studentId: student.id, action: 'registered', details: `Registered as ${grade}` },
    })

    // Fire-and-forget admin notification via Resend
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/notify-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentName: name, studentPhone: phone, studentGrade: grade, parentName: parentName || '', parentPhone: parentPhone || '' }),
    }).catch(() => {})

    return NextResponse.json({ message: 'Student created', student }, { status: 201 })
  } catch (error) {
    console.error('Student create error:', error)
    return NextResponse.json({ error: 'Failed to create student' }, { status: 500 })
  }
}
