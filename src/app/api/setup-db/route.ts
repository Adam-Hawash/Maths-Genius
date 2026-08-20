// @ts-nocheck
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  var results = []

  try {
    // 1) Add missing columns to Homework
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

    // 2) Add missing columns to Exam
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

    // 3) Add order column to Video (order is SQL reserved word - must quote it)
    try {
      await db.$executeRawUnsafe(`ALTER TABLE Video ADD COLUMN "order" INTEGER DEFAULT 0`)
      results.push('Video.order added')
    } catch(e) { results.push('Video.order: ' + (e.message || 'skip')) }

    // ===== NEW: Add price column to Video =====
    try {
      await db.$executeRawUnsafe(`ALTER TABLE Video ADD COLUMN price REAL DEFAULT 0`)
      results.push('Video.price added')
    } catch(e) { results.push('Video.price: ' + (e.message || 'skip')) }

    // ===== NEW: Add isPaidAccess column to Student =====
    try {
      await db.$executeRawUnsafe(`ALTER TABLE Student ADD COLUMN isPaidAccess BOOLEAN DEFAULT 0`)
      results.push('Student.isPaidAccess added')
    } catch(e) { results.push('Student.isPaidAccess: ' + (e.message || 'skip')) }

    // ===== NEW: Add likes column to Discussion =====
    try {
      await db.$executeRawUnsafe(`ALTER TABLE Discussion ADD COLUMN likes INTEGER DEFAULT 0`)
      results.push('Discussion.likes added')
    } catch(e) { results.push('Discussion.likes: ' + (e.message || 'skip')) }

    // 4) Create Question table if not exists
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

    // 5) Create HomeworkResult table if not exists
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

    // 6) Create Payment table if not exists
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS Payment (
          id TEXT PRIMARY KEY,
          studentId TEXT NOT NULL,
          amount REAL DEFAULT 0,
          method TEXT DEFAULT '',
          status TEXT DEFAULT 'pending',
          month TEXT DEFAULT '',
          receiptPath TEXT DEFAULT '',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (studentId) REFERENCES Student(id) ON DELETE CASCADE
        )
      `)
      results.push('Payment table ready')
    } catch(e) { results.push('Payment table: ' + (e.message || 'skip')) }

    // 7) Create VideoAccess table if not exists
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS VideoAccess (
          id TEXT PRIMARY KEY,
          studentId TEXT NOT NULL,
          videoId TEXT NOT NULL,
          grantedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (studentId) REFERENCES Student(id) ON DELETE CASCADE,
          FOREIGN KEY (videoId) REFERENCES Video(id) ON DELETE CASCADE,
          UNIQUE(studentId, videoId)
        )
      `)
      results.push('VideoAccess table ready')
    } catch(e) { results.push('VideoAccess table: ' + (e.message || 'skip')) }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message, results }, { status: 500 })
  }
}
