// @ts-nocheck
// POST /api/homework/submit - Submit homework answers (NO auto-grading, teacher grades from admin)

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// Ensure table exists
async function ensureTable() {
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS HomeworkResult (
        id TEXT PRIMARY KEY,
        homeworkId TEXT NOT NULL,
        studentId TEXT NOT NULL,
        score REAL NOT NULL DEFAULT 0,
        maxScore REAL NOT NULL DEFAULT 100,
        answers TEXT DEFAULT '',
        submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    // Try adding answers column if missing
    try {
      await db.$executeRawUnsafe('ALTER TABLE HomeworkResult ADD COLUMN answers TEXT DEFAULT ""')
    } catch(e) { /* column already exists */ }
    // Try adding submittedAt column if missing
    try {
      await db.$executeRawUnsafe('ALTER TABLE HomeworkResult ADD COLUMN submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP')
    } catch(e) { /* column already exists */ }
  } catch (e) {
    console.error('Ensure HomeworkResult table error:', e)
  }
}

export async function POST(request) {
  try {
    var body = await request.json()
    var studentId = body.studentId
    var homeworkId = body.homeworkId
    var answers = body.answers

    if (!studentId || !homeworkId) {
      return NextResponse.json({ error: 'بيانات مفقودة' }, { status: 400 })
    }

    // Ensure table exists
    await ensureTable()

    // Check double submission
    try {
      var existing = await db.$queryRawUnsafe(
        'SELECT id FROM HomeworkResult WHERE studentId = ? AND homeworkId = ? LIMIT 1',
        studentId, homeworkId
      )
      if (existing && existing.length > 0) {
        return NextResponse.json({
          success: true,
          alreadySubmitted: true,
        }, { status: 200 })
      }
    } catch (e) {
      console.error('Check existing hw error:', e)
    }

    // Save submission — NO auto-grading, teacher will set score from admin
    var resultId = 'hwr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    var answersJson = ''
    if (answers !== undefined && answers !== null) {
      try { answersJson = JSON.stringify(answers) } catch(e) { answersJson = '' }
    }

    try {
      await db.$executeRawUnsafe(
        'INSERT INTO HomeworkResult (id, studentId, homeworkId, score, maxScore, answers) VALUES (?, ?, ?, 0, 100, ?)',
        resultId, studentId, homeworkId, answersJson
      )
    } catch (insertErr) {
      console.error('Insert homework result error:', insertErr)
      // Retry without answers column
      try {
        await db.$executeRawUnsafe(
          'INSERT INTO HomeworkResult (id, studentId, homeworkId, score, maxScore) VALUES (?, ?, ?, 0, 100)',
          resultId, studentId, homeworkId
        )
      } catch (retryErr) {
        console.error('Retry insert homework result error:', retryErr)
        return NextResponse.json({
          error: 'حصلت مشكلة في حفظ النتيجة'
        }, { status: 500 })
      }
    }

    // Return success — NO score, teacher grades later
    return NextResponse.json({
      success: true,
      submitted: true,
      result: {
        id: resultId,
      },
    })
  } catch (error) {
    console.error('Homework submit error:', error)
    return NextResponse.json({
      error: 'حصلت مشكلة في تسليم الواجب'
    }, { status: 500 })
  }
}
