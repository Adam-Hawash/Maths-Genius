import { createHash, createHmac } from 'crypto'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

const SECRET = 'ph-secret-9f3k2-eltahan'
export const ADMIN_COOKIE = 'ph_admin'

export function hashPassword(pw: string) {
  return createHash('sha256').update(pw).digest('hex')
}

export function makeToken(email: string) {
  return createHmac('sha256', SECRET).update(email).digest('hex')
}

/** Returns admin email if the request carries a valid session cookie, else null */
export async function requireAdmin(): Promise<string | null> {
  try {
    const c = await cookies()
    const raw = c.get(ADMIN_COOKIE)?.value
    if (!raw) return null
    const idx = raw.lastIndexOf('.')
    if (idx < 1) return null
    const email = raw.slice(0, idx)
    const token = raw.slice(idx + 1)
    if (makeToken(email) !== token) return null
    const admin = await db.adminUser.findUnique({ where: { email } })
    return admin ? email : null
  } catch {
    return null
  }
}
