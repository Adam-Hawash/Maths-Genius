// @ts-nocheck
import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

var globalForPrisma = globalThis
var _prisma = globalForPrisma._prismaInstance

async function withRetry(fn, retries, delayMs) {
  if (retries === void 0) { retries = 3 }
  if (delayMs === void 0) { delayMs = 200 }
  for (var attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      var msg = error && (error.message || '')
      var code = error && (error.code || '')
      var isLocked = msg.indexOf('database is locked') !== -1 || code === 'SQLITE_BUSY'
      var isTransient = code === 'CONNRESET' || code === 'ECONNRESET' || code === 'ETIMEDOUT'
      if ((isLocked || isTransient) && attempt < retries) {
        await new Promise(function (r) { setTimeout(r, delayMs * (attempt + 1)) })
        continue
      }
      throw error
    }
  }
  throw new Error('withRetry: unexpected fallthrough')
}

function createPrismaClient() {
  var dbUrl = process.env.DATABASE_URL || 'file:./db/custom.db'

  if (dbUrl.indexOf('libsql://') === 0 || dbUrl.indexOf('https://') === 0) {
    var libsql = createClient({ url: dbUrl })
    var adapter = new PrismaLibSQL(libsql)
    return new PrismaClient({ adapter: adapter, log: [] })
  }

  return new PrismaClient({
    log: process.env.NODE_ENV !== 'production' ? ['query'] : [],
  })
}

export var db = _prisma || createPrismaClient()
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma._prismaInstance = db
}

export async function safeWrite(fn) {
  return withRetry(fn, 3, 300)
}
