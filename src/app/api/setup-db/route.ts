// @ts-nocheck
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  var results = []

  try {
    // ===== EXISTING MIGRATIONS =====
    try { await db.$executeRawUnsafe(`ALTER TABLE Homework ADD COLUMN content TEXT DEFAULT ''`); results.push('Homework.content') } catch(e) { results.push('Homework.content: skip') }
    try { await db.$executeRawUnsafe(`ALTER TABLE Homework ADD COLUMN thumbnail TEXT DEFAULT ''`); results.push('Homework.thumbnail') } catch(e) { results.push('Homework.thumbnail: skip') }
    try { await db.$executeRawUnsafe(`ALTER TABLE Homework ADD COLUMN answerKeyPath TEXT DEFAULT ''`); results.push('Homework.answerKeyPath') } catch(e) { results.push('Homework.answerKeyPath: skip') }
    try { await db.$executeRawUnsafe(`ALTER TABLE Homework ADD COLUMN answerKeyType TEXT DEFAULT ''`); results.push('Homework.answerKeyType') } catch(e) { results.push('Homework.answerKeyType: skip') }
    try { await db.$executeRawUnsafe(`ALTER TABLE Homework ADD COLUMN questions TEXT DEFAULT ''`); results.push('Homework.questions') } catch(e) { results.push('Homework.questions: skip') }
    try { await db.$executeRawUnsafe(`ALTER TABLE Exam ADD COLUMN content TEXT DEFAULT ''`); results.push('Exam.content') } catch(e) { results.push('Exam.content: skip') }
    try { await db.$executeRawUnsafe(`ALTER TABLE Exam ADD COLUMN thumbnail TEXT DEFAULT ''`); results.push('Exam.thumbnail') } catch(e) { results.push('Exam.thumbnail: skip') }
    try { await db.$executeRawUnsafe(`ALTER TABLE Exam ADD COLUMN answerKeyPath TEXT DEFAULT ''`); results.push('Exam.answerKeyPath') } catch(e) { results.push('Exam.answerKeyPath: skip') }
    try { await db.$executeRawUnsafe(`ALTER TABLE Exam ADD COLUMN answerKeyType TEXT DEFAULT ''`); results.push('Exam.answerKeyType') } catch(e) { results.push('Exam.answerKeyType: skip') }
    try { await db.$executeRawUnsafe(`ALTER TABLE Exam ADD COLUMN questions TEXT DEFAULT ''`); results.push('Exam.questions') } catch(e) { results.push('Exam.questions: skip') }
    try { await db.$executeRawUnsafe(`ALTER TABLE Exam ADD COLUMN passScore REAL DEFAULT 50`); results.push('Exam.passScore') } catch(e) { results.push('Exam.passScore: skip') }
    try { await db.$executeRawUnsafe(`ALTER TABLE Video ADD COLUMN price REAL DEFAULT 0`); results.push('Video.price') } catch(e) { results.push('Video.price: skip') }
    try { await db.$executeRawUnsafe(`ALTER TABLE Student ADD COLUMN password TEXT DEFAULT ''`); results.push('Student.password') } catch(e) { results.push('Student.password: skip') }
    try { await db.$executeRawUnsafe(`ALTER TABLE Discussion ADD COLUMN likes INTEGER DEFAULT 0`); results.push('Discussion.likes') } catch(e) { results.push('Discussion.likes: skip') }

    // ===== CREATE Payment TABLE =====
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS Payment (
          id TEXT PRIMARY KEY,
          studentId TEXT NOT NULL,
          studentName TEXT NOT NULL DEFAULT '',
          studentPhone TEXT NOT NULL DEFAULT '',
          studentGrade TEXT NOT NULL DEFAULT '',
          method TEXT NOT NULL DEFAULT '',
          amount REAL NOT NULL DEFAULT 0,
          videoId TEXT NOT NULL DEFAULT '',
          videoTitle TEXT NOT NULL DEFAULT '',
          receiptPath TEXT NOT NULL DEFAULT '',
          receiptType TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'pending',
          note TEXT NOT NULL DEFAULT '',
          reviewedAt DATETIME,
          reviewedBy TEXT NOT NULL DEFAULT '',
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (studentId) REFERENCES Student(id) ON DELETE CASCADE
        )
      `)
      results.push('Payment table created')
    } catch(e) { results.push('Payment table: ' + (e.message || 'error')) }

    // Add any missing Payment columns (in case table existed with old schema)
    var paymentCols = [
      ['studentName', 'TEXT NOT NULL DEFAULT \'\''],
      ['studentPhone', 'TEXT NOT NULL DEFAULT \'\''],
      ['studentGrade', 'TEXT NOT NULL DEFAULT \'\''],
      ['videoId', 'TEXT NOT NULL DEFAULT \'\''],
      ['videoTitle', 'TEXT NOT NULL DEFAULT \'\''],
      ['receiptType', 'TEXT NOT NULL DEFAULT \'\''],
      ['note', 'TEXT NOT NULL DEFAULT \'\''],
      ['reviewedAt', 'DATETIME'],
      ['reviewedBy', 'TEXT NOT NULL DEFAULT \'\''],
    ]
    for (var pc of paymentCols) {
      try { await db.$executeRawUnsafe('ALTER TABLE Payment ADD COLUMN ' + pc[0] + ' ' + pc[1]); results.push('Payment.' + pc[0] + ' added') } catch(e) { /* column exists, skip */ }
    }

    // Drop the old 'month' column if it exists (no longer needed)
    // SQLite doesn't support DROP COLUMN easily, so we leave it

    // ===== CREATE VideoAccess TABLE =====
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS VideoAccess (
          id TEXT PRIMARY KEY,
          videoId TEXT NOT NULL,
          studentId TEXT NOT NULL,
          grantedBy TEXT NOT NULL DEFAULT 'admin',
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(videoId, studentId)
        )
      `)
      results.push('VideoAccess table created')
    } catch(e) { results.push('VideoAccess table: ' + (e.message || 'error')) }

    // Add missing VideoAccess columns
    try { await db.$executeRawUnsafe('ALTER TABLE VideoAccess ADD COLUMN grantedBy TEXT NOT NULL DEFAULT \'admin\''); results.push('VideoAccess.grantedBy') } catch(e) { /* skip */ }
    try { await db.$executeRawUnsafe('ALTER TABLE VideoAccess ADD COLUMN updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP'); results.push('VideoAccess.updatedAt') } catch(e) { /* skip */ }

    // ===== CREATE Media data COLUMN =====
    try { await db.$executeRawUnsafe('ALTER TABLE Media ADD COLUMN data TEXT DEFAULT \'\''); results.push('Media.data') } catch(e) { /* skip */ }

    // ===== CREATE Question TABLE =====
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS Question (
          id TEXT PRIMARY KEY,
          examId TEXT NOT NULL,
          question TEXT DEFAULT '',
          options TEXT DEFAULT '',
          correctIndex INTEGER DEFAULT 0,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (examId) REFERENCES Exam(id) ON DELETE CASCADE
        )
      `)
      results.push('Question table created')
    } catch(e) { results.push('Question table: ' + (e.message || 'error')) }

    // ===== CREATE HomeworkResult TABLE =====
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS HomeworkResult (
          id TEXT PRIMARY KEY,
          homeworkId TEXT NOT NULL,
          studentId TEXT NOT NULL,
          score REAL DEFAULT 0,
          maxScore REAL DEFAULT 100,
          submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (homeworkId) REFERENCES Homework(id) ON DELETE CASCADE,
          FOREIGN KEY (studentId) REFERENCES Student(id) ON DELETE CASCADE
        )
      `)
      results.push('HomeworkResult table created')
    } catch(e) { results.push('HomeworkResult table: ' + (e.message || 'error')) }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message, results }, { status: 500 })
  }
}
