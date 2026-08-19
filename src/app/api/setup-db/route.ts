// @ts-nocheck
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    var results = []

    // Add missing columns to Homework
    var hwCols = [
      ['description', 'TEXT DEFAULT ""'],
      ['subject', 'TEXT DEFAULT ""'],
      ['dueDate', 'TEXT'],
      ['isPublished', 'BOOLEAN DEFAULT 0'],
    ]
    for (var c of hwCols) {
      try {
        await db.$executeRawUnsafe('ALTER TABLE Homework ADD COLUMN ' + c[0] + ' ' + c[1])
        results.push('Added Homework.' + c[0])
      } catch (e: any) {
        if (e.message && e.message.includes('duplicate column')) {
          results.push('Homework.' + c[0] + ' already exists')
        } else {
          results.push('Homework.' + c[0] + ': ' + (e.message || 'error'))
        }
      }
    }

    // Add missing columns to Exam
    var examCols = [
      ['description', 'TEXT DEFAULT ""'],
      ['subject', 'TEXT DEFAULT ""'],
      ['duration', 'INTEGER'],
      ['isPublished', 'BOOLEAN DEFAULT 0'],
    ]
    for (var c of examCols) {
      try {
        await db.$executeRawUnsafe('ALTER TABLE Exam ADD COLUMN ' + c[0] + ' ' + c[1])
        results.push('Added Exam.' + c[0])
      } catch (e: any) {
        if (e.message && e.message.includes('duplicate column')) {
          results.push('Exam.' + c[0] + ' already exists')
        } else {
          results.push('Exam.' + c[0] + ': ' + (e.message || 'error'))
        }
      }
    }

    // Add missing columns to Video
    var vidCols = [
      ['description', 'TEXT DEFAULT ""'],
      ['thumbnailUrl', 'TEXT DEFAULT ""'],
      ['subject', 'TEXT DEFAULT ""'],
     ['"order"', 'INTEGER DEFAULT 0'],
      ['isPublished', 'BOOLEAN DEFAULT 0'],
      ['price', 'REAL'],
    ]
    for (var c of vidCols) {
      try {
        await db.$executeRawUnsafe('ALTER TABLE Video ADD COLUMN ' + c[0] + ' ' + c[1])
        results.push('Added Video.' + c[0])
      } catch (e: any) {
        if (e.message && e.message.includes('duplicate column')) {
          results.push('Video.' + c[0] + ' already exists')
        } else {
          results.push('Video.' + c[0] + ': ' + (e.message || 'error'))
        }
      }
    }

    // Add missing columns to Student
    var stuCols = [
      ['grade', 'TEXT DEFAULT ""'],
    ]
    for (var c of stuCols) {
      try {
        await db.$executeRawUnsafe('ALTER TABLE Student ADD COLUMN ' + c[0] + ' ' + c[1])
        results.push('Added Student.' + c[0])
      } catch (e: any) {
        if (e.message && e.message.includes('duplicate column')) {
          results.push('Student.' + c[0] + ' already exists')
        } else {
          results.push('Student.' + c[0] + ': ' + (e.message || 'error'))
        }
      }
    }

    // Add missing columns to ExamResult
    var erCols = [
      ['questionDetails', 'TEXT DEFAULT ""'],
      ['totalQuestions', 'INTEGER DEFAULT 0'],
    ]
    for (var c of erCols) {
      try {
        await db.$executeRawUnsafe('ALTER TABLE ExamResult ADD COLUMN ' + c[0] + ' ' + c[1])
        results.push('Added ExamResult.' + c[0])
      } catch (e: any) {
        if (e.message && e.message.includes('duplicate column')) {
          results.push('ExamResult.' + c[0] + ' already exists')
        } else {
          results.push('ExamResult.' + c[0] + ': ' + (e.message || 'error'))
        }
      }
    }

    // Create new tables if they don't exist
    try {
      await db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS Question (id TEXT PRIMARY KEY, text TEXT NOT NULL DEFAULT "", optionA TEXT NOT NULL DEFAULT "", optionB TEXT NOT NULL DEFAULT "", optionC TEXT NOT NULL DEFAULT "", optionD TEXT NOT NULL DEFAULT "", correctAnswer TEXT NOT NULL DEFAULT "", explanation TEXT NOT NULL DEFAULT "", homeworkId TEXT, examId TEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (homeworkId) REFERENCES Homework(id) ON DELETE CASCADE, FOREIGN KEY (examId) REFERENCES Exam(id) ON DELETE CASCADE)')
      results.push('Question table ready')
    } catch (e: any) {
      results.push('Question table: ' + (e.message || 'error'))
    }

    try {
      await db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS HomeworkResult (id TEXT PRIMARY KEY, studentId TEXT NOT NULL, homeworkId TEXT NOT NULL, score REAL DEFAULT 0, totalQuestions INTEGER DEFAULT 0, questionDetails TEXT NOT NULL DEFAULT "", createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (studentId) REFERENCES Student(id) ON DELETE CASCADE, FOREIGN KEY (homeworkId) REFERENCES Homework(id) ON DELETE CASCADE)')
      results.push('HomeworkResult table ready')
    } catch (e: any) {
      results.push('HomeworkResult table: ' + (e.message || 'error'))
    }

    try {
      await db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS Payment (id TEXT PRIMARY KEY, studentId TEXT NOT NULL, method TEXT NOT NULL DEFAULT "", amount REAL DEFAULT 0, receiptPath TEXT DEFAULT "", receiptType TEXT DEFAULT "", status TEXT NOT NULL DEFAULT "pending", videoId TEXT DEFAULT "", videoTitle TEXT DEFAULT "", note TEXT DEFAULT "", studentName TEXT DEFAULT "", studentPhone TEXT DEFAULT "", studentGrade TEXT DEFAULT "", adminNote TEXT DEFAULT "", createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (studentId) REFERENCES Student(id) ON DELETE CASCADE, FOREIGN KEY (videoId) REFERENCES Video(id) ON DELETE SET NULL)')
      results.push('Payment table ready')
    } catch (e: any) {
      results.push('Payment table: ' + (e.message || 'error'))
    }

    try {
      await db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS VideoAccess (id TEXT PRIMARY KEY, studentId TEXT NOT NULL, videoId TEXT NOT NULL, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (studentId) REFERENCES Student(id) ON DELETE CASCADE, FOREIGN KEY (videoId) REFERENCES Video(id) ON DELETE CASCADE)')
      results.push('VideoAccess table ready')
    } catch (e: any) {
      results.push('VideoAccess table: ' + (e.message || 'error'))
    }

    return NextResponse.json({ success: true, results: results })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
