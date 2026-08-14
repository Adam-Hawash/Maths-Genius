
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [totalStudents, pendingStudents, approvedStudents, totalVideos, totalHomework, totalExams, totalAnnouncements, totalDiscussions] =
      await Promise.all([
        db.student.count(),
        db.student.count({ where: { status: 'pending' } }),
        db.student.count({ where: { status: 'approved' } }),
        db.video.count(),
        db.homework.count(),
        db.exam.count(),
        db.announcement.count(),
        db.discussion.count(),
      ])

    const studentGrades = await db.student.findMany({
      select: { grade: true },
      distinct: ['grade'],
    })

    const grades = studentGrades.map((s) => s.grade)

    return NextResponse.json({
      totalStudents,
      pendingStudents,
      approvedStudents,
      totalVideos,
      totalHomework,
      totalExams,
      totalAnnouncements,
      totalDiscussions,
      grades,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
