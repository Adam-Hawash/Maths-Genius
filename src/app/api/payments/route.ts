import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Student submits a payment receipt
export async function POST(request: NextRequest) {
  try {
    var formData = await request.formData()
    var videoId = formData.get('videoId') as string || ''
    var videoTitle = formData.get('videoTitle') as string || ''
    var amount = parseFloat(formData.get('amount') as string || '0')
    var paymentMethod = formData.get('paymentMethod') as string || ''
    var receipt = formData.get('receipt') as File | null
    var notes = formData.get('notes') as string || ''
    var studentId = formData.get('studentId') as string || ''
    var studentName = formData.get('studentName') as string || ''
    var studentPhone = formData.get('studentPhone') as string || ''
    var studentGrade = formData.get('studentGrade') as string || ''

    if (!videoId || !paymentMethod || !receipt) {
      return NextResponse.json({ error: 'videoId, paymentMethod, and receipt are required' }, { status: 400 })
    }
    if (!studentId) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول قبل الدفع' }, { status: 400 })
    }

    // Never trust the amount coming from the browser - read the real price.
    var video = await db.video.findUnique({ where: { id: videoId } })
    if (!video) return NextResponse.json({ error: 'الفيديو غير موجود' }, { status: 404 })
    var realAmount = Number(video.price) || 0
    if (realAmount <= 0) {
      return NextResponse.json({ error: 'هذا الفيديو مجاني ولا يحتاج دفع' }, { status: 400 })
    }

    var student = await db.student.findUnique({ where: { id: studentId } })
    if (!student) return NextResponse.json({ error: 'الطالب غير موجود' }, { status: 404 })

    // Block duplicate pending/approved receipts for the same video.
    var existing = await db.payment.findFirst({
      where: { studentId: studentId, videoId: videoId, status: { in: ['pending', 'approved'] } },
    })
    if (existing) {
      return NextResponse.json(
        { error: existing.status === 'approved' ? 'الفيديو مفتوح لك بالفعل' : 'تم إرسال إيصال لهذا الفيديو وجاري مراجعته' },
        { status: 409 },
      )
    }

    // Save receipt file
    var receiptPath = ''
    if (receipt) {
      var chunks: Uint8Array[] = []
      var reader = receipt.stream().getReader()
      while (true) {
        var chunk = await reader.read()
        if (chunk.done) break
        chunks.push(chunk.value)
      }
      var buffer = new Uint8Array(chunks.reduce(function(a, c) { return a + c.length }, 0))
      var offset = 0
      for (var c of chunks) {
        buffer.set(c, offset)
        offset += c.length
      }
      var base64 = Buffer.from(buffer).toString('base64')

      // Store in Media table
      var media = await db.media.create({
        data: {
          filename: receipt.name,
          filePath: 'receipts/' + Date.now() + '_' + receipt.name,
          fileType: receipt.type,
          fileSize: String(receipt.size),
          data: base64,
          category: 'receipts',
        },
      })
      receiptPath = media.id
    }

    var payment = await db.payment.create({
      data: {
        studentId: studentId,
        studentName: studentName || student.name,
        studentPhone: studentPhone || student.phone,
        studentGrade: studentGrade || student.grade,
        videoId: videoId,
        videoTitle: videoTitle || video.title,
        amount: realAmount,
        method: paymentMethod,
        receiptPath: receiptPath,
        receiptType: receipt.type || '',
        note: notes,
        status: 'pending',
      },
    })

    try {
      await db.studentActivity.create({
        data: {
          studentId: studentId,
          action: 'payment_submitted',
          details: 'أرسل إيصال دفع (' + realAmount + ' جنيه) للفيديو: ' + (videoTitle || video.title),
        },
      })
    } catch (_) { /* activity logging is best effort */ }

    return NextResponse.json({ message: 'Payment submitted', payment }, { status: 201 })
  } catch (error: any) {
    console.error('Payment submit error:', error)
    return NextResponse.json({ error: 'Server error: ' + (error.message || String(error)) }, { status: 500 })
  }
}

// GET - List payments (admin or student)
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
