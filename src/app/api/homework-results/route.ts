// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    var studentId = new URL(request.url).searchParams.get('studentId')
    if (!studentId) return NextResponse.json({ results: [] })

    var results = await db.homeworkResult.findMany({
      where: { studentId },
    })

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Homework results error:', error)
    return NextResponse.json({ results: [] })
  }
}
