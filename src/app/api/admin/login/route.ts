import { NextRequest, NextResponse } from 'next/server'
import { db, safeWrite } from '@/lib/db'

export const maxDuration = 10

const DEFAULT_EMAIL = 'adam7awash@gmail.com'
const DEFAULT_PASSWORD = '7awash@)!!'
const ADMIN_NAME = 'Adam Hawash'

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 })
  }

  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json({ error: 'البريد وكلمة المرور مطلوبين' }, { status: 400 })
  }

  const cleanEmail = email.trim().toLowerCase()
  const cleanPassword = password

  try {
    console.log('[Admin Login] Checking for existing admin...')
    let admin = await db.admin.findFirst()
    console.log('[Admin Login] Existing admin:', admin ? 'found' : 'none')

    if (!admin) {
      console.log('[Admin Login] First-time login, validating defaults...')
      if (cleanEmail !== DEFAULT_EMAIL || cleanPassword !== DEFAULT_PASSWORD) {
        console.log('[Admin Login] Credentials mismatch')
        return NextResponse.json({ error: 'البريد أو كلمة المرور غلط' }, { status: 401 })
      }
      admin = await safeWrite(() =>
        db.admin.create({
          data: { email: DEFAULT_EMAIL, password: DEFAULT_PASSWORD, name: ADMIN_NAME },
        })
      )
      console.log('[Admin Login] Admin created:', admin.id)
    } else {
      console.log('[Admin Login] Comparing against DB...')
      console.log('[Admin Login] Input email:', cleanEmail, '| DB email:', admin.email)
      if (cleanEmail !== admin.email || cleanPassword !== admin.password) {
        console.log('[Admin Login] Credentials mismatch')
        return NextResponse.json({ error: 'البريد أو كلمة المرور غلط' }, { status: 401 })
      }
    }

    const { password: _, ...adminWithoutPassword } = admin

    console.log('[Admin Login] Success! Admin:', adminWithoutPassword.name)

    return NextResponse.json({
      message: 'تم تسجيل الدخول',
      admin: adminWithoutPassword,
    })
  } catch (error) {
    console.error('[Admin Login] Error:', error)
    return NextResponse.json({ error: 'خطأ في السيرفر' }, { status: 500 })
  }
}
