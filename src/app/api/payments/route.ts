import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    var url = new URL(request.url)
    var status = url.searchParams.get('status') || ''
    var studentId = url.searchParams.get('studentId') || ''
    var pageSize = parseInt(url.searchParams.get('pageSize') || '100')
    var where: any = {}
    if (status && status !== 'all') {
      where.status = status
    }
    if (studentId) {
      where.studentId = studentId
    }
    var payments = await db.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: pageSize,
    })
    var counts = await db.payment.groupBy({
      by: ['status'],
      _count: { status: true },
    })
    var countMap: Record<string, number> = {}
    for (var c of counts) {
      countMap[c.status] = c._count.status
    }
    return NextResponse.json({
      payments,
      counts: {
        total: (countMap['pending'] || 0) + (countMap['approved'] || 0) + (countMap['rejected'] || 0),
        pending: countMap['pending'] || 0,
        approved: countMap['approved'] || 0,
        rejected: countMap['rejected'] || 0,
      },
    })
  } catch (error: any) {
    console.error('Payments list error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    var formData = await request.formData()
    var studentId = formData.get('studentId') as string || ''
    var method = formData.get('method') as string || formData.get('paymentMethod') as string || ''
    var amount = parseFloat(formData.get('amount') as string || '0')
    var videoId = formData.get('videoId') as string || ''
    var videoTitle = formData.get('videoTitle') as string || ''
    var note = formData.get('note') as string || formData.get('notes') as string || ''
    var receipt = formData.get('receipt') as File | null
    if (!studentId || !method) {
      return NextResponse.json({ error: 'studentId and method are required' }, { status: 400 })
    }
    var allowedMethods = ['fawry', 'instapay', 'vodafone_cash']
    if (!allowedMethods.includes(method)) {
      return NextResponse.json({ error: 'طريقة الدفع غير صالحة' }, { status: 400 })
    }
    var student = await db.student.findUnique({ where: { id: studentId } })
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    var receiptPath = ''
    var receiptType = ''
    if (receipt && receipt.size > 0) {
      try {
        var chunks: Uint8Array[] = []
        var reader = receipt.stream().getReader()
        while (true) {
          var chunk = await reader.read()
          if (chunk.done) break
          chunks.push(chunk.value)
        }
        var buffer = new Uint8Array(chunks.reduce(function(a, c) { return a + c.length }, 0))
        var offset = 0
        for (var ch of chunks) {
          buffer.set(ch, offset)
          offset += ch.length
        }
        var base64 = Buffer.from(buffer).toString('base64')
        var media = await db.media.create({
          data: {
            filename: receipt.name,
            filePath: 'receipts/' + Date.now() + '_' + receipt.name,
            fileType: receipt.type,
            fileSize: String(receipt.size),
            category: 'receipts',
            data: base64,
          },
        })
        receiptPath = media.id
        receiptType = receipt.type
      } catch (err: any) {
        return NextResponse.json({ error: 'فشل رفع صورة الوصل: ' + (err.message || '') }, { status: 500 })
      }
    }
    var payment = await db.payment.create({
      data: {
        studentId,
        studentName: student.name,
        studentPhone: student.phone,
        studentGrade: student.grade,
        method,
        amount,
        videoId,
        videoTitle,
        receiptPath,
        receiptType,
        status: 'pending',
        note,
      },
    })
    try {
      await db.studentActivity.create({
        data: {
          studentId,
          action: 'payment_submitted',
          details: 'قدم دفع ' + amount + ' جنيه عن طريق ' + method + ' - في انتظار الموافقة',
        },
      })
    } catch (e) {}
    return NextResponse.json({
      payment: {
        id: payment.id,
        status: payment.status,
        method: payment.method,
        amount: payment.amount,
        videoTitle: payment.videoTitle,
      },
    })
  } catch (error: any) {
    console.error('Payment submit error:', error)
    return NextResponse.json({ error: 'Server error: ' + (error.message || '') }, { status: 500 })
  }
}
