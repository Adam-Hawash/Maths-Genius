import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis
const g = globalForPrisma as any

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || 'file:./db/custom.db'

  if (dbUrl.startsWith('libsql://') || dbUrl.startsWith('https://')) {
    const libsql = createClient({ url: dbUrl })
    const adapter = new PrismaLibSQL(libsql)
    return new PrismaClient({ adapter, log: [] })
  }

  return new PrismaClient({
    log: process.env.NODE_ENV !== 'production' ? ['query'] : [],
  })
}

const db = g.prisma || createPrismaClient()
if (process.env.NODE_ENV !== 'production') g.prisma = db

export { db }

async function withRetry(fn, retries, delayMs) {
  retries = retries || 3
  delayMs = delayMs || 200
  for (var attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      var msg = error && error.message ? error.message : ''
      var code = error && error.code ? error.code : ''
      var isLocked = msg.indexOf('database is locked') !== -1 || code === 'SQLITE_BUSY'
      var isTransient = code === 'CONNRESET' || code === 'ECONNRESET' || code === 'ETIMEDOUT'
      if ((isLocked || isTransient) && attempt < retries) {
        await new Promise(function(r) { setTimeout(r, delayMs * (attempt + 1)) })
        continue
      }
      throw error
    }
  }
}

export async function safeWrite(fn) {
  return withRetry(fn, 3, 300)
}
