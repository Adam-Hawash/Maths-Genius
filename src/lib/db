import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

// @ts-ignore — global singleton cache for Prisma in dev
const globalForPrisma: { prisma?: PrismaClient } = globalThis as any

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 200): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      const isLocked = error?.message?.includes('database is locked') || error?.code === 'SQLITE_BUSY'
      const isTransient = error?.code === 'CONNRESET' || error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT'
      if ((isLocked || isTransient) && attempt < retries) {
        await new Promise(r => setTimeout(r, delayMs * (attempt + 1)))
        continue
      }
      throw error
    }
  }
  throw new Error('withRetry: unexpected fallthrough')
}

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

export const db = globalForPrisma.prisma ?? createPrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

export async function safeWrite<T>(fn: () => Promise<T>): Promise<T> {
  return withRetry(fn, 3, 300)
}
