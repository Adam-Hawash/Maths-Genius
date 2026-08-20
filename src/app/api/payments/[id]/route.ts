// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT /api/payments/[id] - Approve or reject
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const { status, adminId } = await request.json()

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const payment = await db.payment.findUnique({ where: { id } })
    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })

    if (payment.status !== 'pending') {
      return NextResponse.json({ error: 'تم مراجعة هذا الدفع بالفعل' }, { status: 400 })
    }

    const updated = await db.payment.update({
      where: { id },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy: adminId || 'admin',
      },
    })

    // If approved and has videoId, grant access
    if (status === 'approved' && payment.videoId) {
      try {
        await db.videoAccess.upsert({
          where: {
            studentId_videoId: {
              videoId: payment.videoId,
              studentId: payment.studentId,
            },
          },
          create: {
            videoId: payment.videoId,
            studentId: payment.studentId,
            grantedBy: adminId || 'admin',
          },
          update: {},
        })

        await db.studentActivity.create({
          data: {
            studentId: payment.studentId,
            action: 'payment_approved',
            details: `تم قبول الدفع (${payment.amount} جنيه) - تم فتح الفيديو: ${payment.videoTitle}`,
          },
        })
      } catch (err) {
        console.error('Error granting video access:', err)
      }
    }

    if (status === 'rejected') {
      await db.studentActivity.create({
        data: {
          studentId: payment.studentId,
          action: 'payment_rejected',
          details: `تم رفض الدفع (${payment.amount} جنيه) عن طريق ${payment.method}`,
        },
      })
    }

    return NextResponse.json({ payment: updated })
  } catch (error) {
    console.error('Payment update error:', error)
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
  }
}
