import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { chunkedUpload } from '@/lib/chunked-upload'

// GET /api/payments - List all payments (admin)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || ''
  const studentId = searchParams.get('studentId') || ''

  try {
    const where: any = {}
    if (status) where.status = status
    if (studentId) where.studentId = studentId

    const payments = await db.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('Payments list error:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

// POST /api/payments - Submit a new payment (student uploads receipt)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const studentId = formData.get('studentId') as string
    const method = formData.get('method') as string
    const amount = parseFloat(formData.get('amount') as string) || 0
    const videoId = formData.get('videoId') as string || ''
    const videoTitle = formData.get('videoTitle') as string || ''
    const note = formData.get('note') as string || ''
    const receipt = formData.get('receipt') as File | null

    if (!studentId || !method) {
      return NextResponse.json({ error: 'studentId and method required' }, { status: 400 })
    }

    const allowedMethods = ['fawry', 'instapay', 'vodafone_cash']
    if (!allowedMethods.includes(method)) {
      return NextResponse.json({ error: 'طريقة الدفع غير صالحة' }, { status: 400 })
    }

    // Get student info
    const student = await db.student.findUnique({ where: { id: studentId } })
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    let receiptPath = ''

    // Upload receipt image
    if (receipt && receipt.size > 0) {
      try {
        const upData = await chunkedUpload(receipt, 'payments', undefined, undefined)
        receiptPath = upData.filePath
      } catch (err: any) {
        return NextResponse.json({ error: 'فشل رفع صورة الوصل: ' + (err.message || '') }, { status: 500 })
      }
    }

    const payment = await db.payment.create({
      data: {
        studentId,
        studentName: student.name,
        method,
        receiptPath,
        status: 'pending',
        amount,
        videoId,
        videoTitle,
        note,
      },
    })

    // Log activity
    try {
      await db.studentActivity.create({
        data: {
          studentId,
          action: 'payment_submitted',
          details: 'قدم دفع ' + amount + ' جنيه عن طريق ' + method + ' - في انتظار الموافقة',
        },
      })
    } catch(e) { /* silent */ }

    return NextResponse.json({
      payment: {
        id: payment.id,
        status: payment.status,
        method: payment.method,
        amount: payment.amount,
        videoTitle: payment.videoTitle,
      },
    })
  } catch (error) {
    console.error('Payment submit error:', error)
    return NextResponse.json({ error: 'Failed to submit payment' }, { status: 500 })
  }
}
