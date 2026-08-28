// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    var studentId = new URL(request.url).searchParams.get('studentId')
    if (!studentId) return NextResponse.json({ results: [] })

    // Use raw SQL to avoid Prisma RETURN column mismatch
    var rows = await db.$queryRawUnsafe(
      'SELECT id, homeworkId, studentId, score, maxScore FROM HomeworkResult WHERE studentId = ?',
      studentId
    )

    return NextResponse.json({ results: rows || [] })
  } catch (error) {
    console.error('Homework results error:', error)
    return NextResponse.json({ results: [] })
  }
}
