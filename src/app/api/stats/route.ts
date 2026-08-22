import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT - Approve or reject a payment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    var { id } = await params
    var body = await request.json()
    var { status, adminNotes } = body

    if (!status || (status !== 'approved' && status !== 'rejected')) {
      return NextResponse.json({ error: 'status must be approved or rejected' }, { status: 400 })
    }

    var payment = await db.payment.findUnique({ where: { id } })
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    var updated = await db.payment.update({
      where: { id },
      data: {
        status,
        notes: adminNotes !== undefined ? adminNotes : (payment.notes || ''),
      },
    })

    // If approved, student should have access to the video
    // The video access check in StudentPortal will look for approved payments

    return NextResponse.json({ message: 'Payment updated', payment: updated })
  } catch (error: any) {
    console.error('Payment update error:', error)
    return NextResponse.json({ error: 'Server error: ' + (error.message || String(error)) }, { status: 500 })
  }
}

// DELETE - Delete a payment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    var { id } = await params
    await db.payment.delete({ where: { id } })
    return NextResponse.json({ message: 'Payment deleted' })
  } catch (error: any) {
    console.error('Payment delete error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
