// @ts-nocheck
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  var results = []

  try {
    // 1) Homework columns
    try {
      await db.$executeRawUnsafe(`ALTER TABLE Homework ADD COLUMN content TEXT DEFAULT ''`)
      results.push('Homework.content added')
    } catch(e) { results.push('Homework.content: ' + (e.message || 'skip')) }

    try {
      await db.$executeRawUnsafe(`ALTER TABLE Homework ADD COLUMN thumbnail TEXT DEFAULT ''`)
      results.push('Homework.thumbnail added')
    } catch(e) { results.push('Homework.thumbnail: ' + (e.message || 'skip')) }

    try {
      await db.$executeRawUnsafe(`ALTER TABLE Homework ADD COLUMN answerKeyPath TEXT DEFAULT ''`)
      results.push('Homework.answerKeyPath added')
    } catch(e) { results.push('Homework.answerKeyPath: ' + (e.message || 'skip')) }

    try {
      await db.$executeRawUnsafe(`ALTER TABLE Homework ADD COLUMN answerKeyType TEXT DEFAULT ''`)
      results.push('Homework.answerKeyType added')
    } catch(e) { results.push('Homework.answerKeyType: ' + (e.message || 'skip')) }

    try {
      await db.$executeRawUnsafe(`ALTER TABLE Homework ADD COLUMN questions TEXT DEFAULT ''`)
      results.push('Homework.questions added')
    } catch(e) { results.push('Homework.questions: ' + (e.message || 'skip')) }

    // 2) Exam columns
    try {
      await db.$executeRawUnsafe(`ALTER TABLE Exam ADD COLUMN content TEXT DEFAULT ''`)
      results.push('Exam.content added')
    } catch(e) { results.push('Exam.content: ' + (e.message || 'skip')) }

    try {
      await db.$executeRawUnsafe(`ALTER TABLE Exam ADD COLUMN thumbnail TEXT DEFAULT ''`)
      results.push('Exam.thumbnail added')
    } catch(e) { results.push('Exam.thumbnail: ' + (e.message || 'skip')) }

    try {
      await db.$executeRawUnsafe(`ALTER TABLE Exam ADD COLUMN answerKeyPath TEXT DEFAULT ''`)
      results.push('Exam.answerKeyPath added')
    } catch(e) { results.push('Exam.answerKeyPath: ' + (e.message || 'skip')) }

    try {
      await db.$executeRawUnsafe(`ALTER TABLE Exam ADD COLUMN answerKeyType TEXT DEFAULT ''`)
      results.push('Exam.answerKeyType added')
    } catch(e) { results.push('Exam.answerKeyType: ' + (e.message || 'skip')) }

    try {
      await db.$executeRawUnsafe(`ALTER TABLE Exam ADD COLUMN questions TEXT DEFAULT ''`)
      results.push('Exam.questions added')
    } catch(e) { results.push('Exam.questions: ' + (e.message || 'skip')) }

    try {
      await db.$executeRawUnsafe(`ALTER TABLE Exam ADD COLUMN passScore REAL DEFAULT 50`)
      results.push('Exam.passScore added')
    } catch(e) { results.push('Exam.passScore: ' + (e.message || 'skip')) }

    // 3) Video columns
    try {
      await db.$executeRawUnsafe(`ALTER TABLE Video ADD COLUMN "order" INTEGER DEFAULT 0`)
      results.push('Video.order added')
    } catch(e) { results.push('Video.order: ' + (e.message || 'skip')) }

    try {
      await db.$executeRawUnsafe(`ALTER TABLE Video ADD COLUMN price REAL DEFAULT 0`)
      results.push('Video.price added')
    } catch(e) { results.push('Video.price: ' + (e.message || 'skip')) }

    // 4) Student columns
    try {
      await db.$executeRawUnsafe(`ALTER TABLE Student ADD COLUMN isFreeAccess BOOLEAN DEFAULT 1`)
      results.push('Student.isFreeAccess added')
    } catch(e) { results.push('Student.isFreeAccess: ' + (e.message || 'skip')) }

    // 5) Discussion columns
    try {
      await db.$executeRawUnsafe(`ALTER TABLE Discussion ADD COLUMN likes INTEGER DEFAULT 0`)
      results.push('Discussion.likes added')
    } catch(e) { results.push('Discussion.likes: ' + (e.message || 'skip')) }

    // 6) Payment table
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS Payment (
          id TEXT PRIMARY KEY,
          studentId TEXT NOT NULL,
          studentName TEXT DEFAULT '',
          studentPhone TEXT DEFAULT '',
          studentGrade TEXT DEFAULT '',
          videoId TEXT DEFAULT '',
          videoTitle TEXT DEFAULT '',
          amount REAL DEFAULT 0,
          method TEXT DEFAULT '',
          receiptPath TEXT DEFAULT '',
          receiptType TEXT DEFAULT '',
          note TEXT DEFAULT '',
          status TEXT DEFAULT 'pending',
          reviewedAt DATETIME,
          reviewedBy TEXT DEFAULT '',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (studentId) REFERENCES Student(id) ON DELETE CASCADE
        )
      `)
      results.push('Payment table ready')
    } catch(e) { results.push('Payment table: ' + (e.message || 'skip')) }

    // Add missing Payment columns (if table exists but missing columns)
    try { await db.$executeRawUnsafe(`ALTER TABLE Payment ADD COLUMN studentName TEXT DEFAULT ''`) } catch(e) {}
    try { await db.$executeRawUnsafe(`ALTER TABLE Payment ADD COLUMN studentPhone TEXT DEFAULT ''`) } catch(e) {}
    try { await db.$executeRawUnsafe(`ALTER TABLE Payment ADD COLUMN studentGrade TEXT DEFAULT ''`) } catch(e) {}
    try { await db.$executeRawUnsafe(`ALTER TABLE Payment ADD COLUMN videoId TEXT DEFAULT ''`) } catch(e) {}
    try { await db.$executeRawUnsafe(`ALTER TABLE Payment ADD COLUMN videoTitle TEXT DEFAULT ''`) } catch(e) {}
    try { await db.$executeRawUnsafe(`ALTER TABLE Payment ADD COLUMN receiptType TEXT DEFAULT ''`) } catch(e) {}
    try { await db.$executeRawUnsafe(`ALTER TABLE Payment ADD COLUMN note TEXT DEFAULT ''`) } catch(e) {}
    try { await db.$executeRawUnsafe(`ALTER TABLE Payment ADD COLUMN reviewedAt DATETIME`) } catch(e) {}
    try { await db.$executeRawUnsafe(`ALTER TABLE Payment ADD COLUMN reviewedBy TEXT DEFAULT ''`) } catch(e) {}

    // 7) VideoAccess table
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS VideoAccess (
          id TEXT PRIMARY KEY,
          studentId TEXT NOT NULL,
          videoId TEXT NOT NULL,
          grantedBy TEXT DEFAULT '',
          grantedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (studentId) REFERENCES Student(id) ON DELETE CASCADE,
          FOREIGN KEY (videoId) REFERENCES Video(id) ON DELETE CASCADE,
          UNIQUE(studentId, videoId)
        )
      `)
      results.push('VideoAccess table ready')
    } catch(e) { results.push('VideoAccess table: ' + (e.message || 'skip')) }

    // Add grantedBy to VideoAccess if missing
    try { await db.$executeRawUnsafe(`ALTER TABLE VideoAccess ADD COLUMN grantedBy TEXT DEFAULT ''`) } catch(e) {}

    // 8) Question table
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
      results.push('Question table ready')
    } catch(e) { results.push('Question table: ' + (e.message || 'skip')) }

    // 9) HomeworkResult table
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
      results.push('HomeworkResult table ready')
    } catch(e) { results.push('HomeworkResult table: ' + (e.message || 'skip')) }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message, results }, { status: 500 })
  }
}
