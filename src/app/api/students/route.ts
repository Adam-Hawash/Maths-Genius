
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const grade = searchParams.get('grade')
    const status = searchParams.get('status')
    const keyword = searchParams.get('keyword')
    const phone = searchParams.get('phone')
    const password = searchParams.get('password')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const where: Record<string, unknown> = {}
    if (grade) where.grade = grade
    if (status) where.status = status
    if (phone) where.phone = phone
    if (password) where.password = password
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

    const allStudentIds = students.map(s => s.id)
    const watchedVideos = allStudentIds.length > 0
      ? await db.studentActivity.groupBy({
          by: ['studentId'],
          where: { studentId: { in: allStudentIds }, action: 'watched_video' },
          _count: { id: true },
        })
      : []
    const watchMap: Record<string, number> = {}
    for (const w of watchedVideos) { watchMap[w.studentId] = w._count.id }

    const studentsWithStats = students.map(s => ({
      ...s,
      watchedVideoCount: watchMap[s.id] || 0,
    }))

    return NextResponse.json({
      students: studentsWithStats,
      total, page, pageSize,
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
    const { name, phone, grade, status, parentName, parentPhone, password } = body

    if (!name || !phone || !grade || !parentName || !parentPhone) {
      return NextResponse.json({ error: 'All fields are required including parent information' }, { status: 400 })
    }

    const student = await db.student.create({
      data: { name, phone, grade, status: status || 'pending', parentName, parentPhone, password: password || '' },
    })

    await db.studentActivity.create({
      data: { studentId: student.id, action: 'registered', details: 'Registered as ' + grade },
    })

    fetch((process.env.NEXT_PUBLIC_BASE_URL || '') + '/api/notify-admin', {
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
