// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT /api/payments/[id] - Approve or reject a payment (admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const { status } = await request.json()

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Use approved or rejected' }, { status: 400 })
    }

    const payment = await db.payment.findUnique({ where: { id } })
    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })

    if (payment.status !== 'pending') {
      return NextResponse.json({ error: 'تم مراجعة هذا الدفع بالفعل' }, { status: 400 })
    }

    const updated = await db.payment.update({
      where: { id },
      data: { status },
    })

    // If approved and there's a videoId, grant access via raw SQL
    if (status === 'approved' && payment.videoId) {
      try {
        await db.$executeRawUnsafe(
          `INSERT OR IGNORE INTO VideoAccess (id, studentId, videoId, grantedAt) VALUES (?, ?, ?, datetime('now'))`,
          id + '_access', payment.studentId, payment.videoId
        )

        try {
          await db.studentActivity.create({
            data: {
              studentId: payment.studentId,
              action: 'payment_approved',
              details: 'تم قبول الدفع (' + payment.amount + ' جنيه) - تم فتح الفيديو: ' + payment.videoTitle,
            },
          })
        } catch(e) { /* silent */ }
      } catch (err) {
        console.error('Error granting video access:', err)
      }
    }

    // If rejected, log activity
    if (status === 'rejected') {
      try {
        await db.studentActivity.create({
          data: {
            studentId: payment.studentId,
            action: 'payment_rejected',
            details: 'تم رفض الدفع (' + payment.amount + ' جنيه) عن طريق ' + payment.method,
          },
        })
      } catch(e) { /* silent */ }
    }

    return NextResponse.json({ payment: updated })
  } catch (error) {
    console.error('Payment update error:', error)
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
  }
}
