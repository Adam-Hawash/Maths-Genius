import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Student submits a payment receipt
export async function POST(request: NextRequest) {
  try {
    var contentType = request.headers.get('content-type') || ''
    var videoId = ''
    var videoTitle = ''
    var amount = 0
    var paymentMethod = ''
    var receipt: File | null = null
    var notes = ''
    var studentId = ''
    var studentName = ''
    var studentPhone = ''
    var studentGrade = ''
    // The receipt may arrive as an already-encoded base64 data URL (JSON body)
    // instead of a File (multipart body).
    var receiptDataUrl = ''
    var receiptFilename = ''

    if (contentType.indexOf('application/json') !== -1) {
      var body = await request.json()
      videoId = String(body.videoId || '')
      videoTitle = String(body.videoTitle || '')
      amount = parseFloat(String(body.amount || '0')) || 0
      paymentMethod = String(body.paymentMethod || body.method || '')
      notes = String(body.notes || body.note || '')
      studentId = String(body.studentId || '')
      studentName = String(body.studentName || '')
      studentPhone = String(body.studentPhone || '')
      studentGrade = String(body.studentGrade || '')
      receiptDataUrl = String(body.receipt || body.receiptData || body.receiptPath || '')
      receiptFilename = String(body.receiptName || 'receipt')
    } else {
      var formData = await request.formData()
      videoId = (formData.get('videoId') as string) || ''
      videoTitle = (formData.get('videoTitle') as string) || ''
      amount = parseFloat((formData.get('amount') as string) || '0') || 0
      paymentMethod = (formData.get('paymentMethod') as string) || (formData.get('method') as string) || ''
      receipt = formData.get('receipt') as File | null
      notes = (formData.get('notes') as string) || (formData.get('note') as string) || ''
      studentId = (formData.get('studentId') as string) || ''
      studentName = (formData.get('studentName') as string) || ''
      studentPhone = (formData.get('studentPhone') as string) || ''
      studentGrade = (formData.get('studentGrade') as string) || ''
    }

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 })
    }
    if (!videoId || !paymentMethod || (!receipt && !receiptDataUrl)) {
      return NextResponse.json({ error: 'videoId, paymentMethod, and receipt are required' }, { status: 400 })
    }

    // The Payment row has a required relation to Student, so a bad studentId
    // would otherwise surface as an opaque Prisma foreign-key error.
    var student = await db.student.findUnique({ where: { id: studentId } })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    if (!studentName) { studentName = student.name || '' }
    if (!studentPhone) { studentPhone = student.phone || '' }
    if (!studentGrade) { studentGrade = student.grade || '' }

    // Save receipt into the Media table and keep only its id on the Payment row.
    var receiptPath = ''
    var receiptType = ''
    var base64 = ''
    var filename = ''
    var fileSize = '0'

    if (receipt) {
      var arrayBuffer = await receipt.arrayBuffer()
      base64 = Buffer.from(arrayBuffer).toString('base64')
      filename = receipt.name || 'receipt'
      receiptType = receipt.type || 'application/octet-stream'
      fileSize = String(receipt.size || arrayBuffer.byteLength)
    } else if (receiptDataUrl) {
      // Accept both a bare base64 string and a full "data:<mime>;base64,<data>" URL.
      var match = /^data:([^;]+);base64,(.*)$/.exec(receiptDataUrl)
      if (match) {
        receiptType = match[1]
        base64 = match[2]
      } else {
        receiptType = 'image/jpeg'
        base64 = receiptDataUrl.replace(/^data:[^,]*,/, '')
      }
      filename = receiptFilename
      fileSize = String(Math.floor((base64.length * 3) / 4))
    }

    if (base64) {
      var media = await db.media.create({
        data: {
          filename: filename,
          filePath: 'receipts/' + Date.now() + '_' + filename,
          fileType: receiptType,
          fileSize: fileSize,
          data: base64,
          category: 'receipts',
        },
      })
      receiptPath = media.id
    }

    var payment = await db.payment.create({
      data: {
        studentId: studentId,
        studentName: studentName,
        studentPhone: studentPhone,
        studentGrade: studentGrade,
        videoId: videoId,
        videoTitle: videoTitle,
        amount: amount,
        method: paymentMethod,
        receiptPath: receiptPath,
        receiptType: receiptType,
        note: notes,
        status: 'pending',
      },
    })

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
        total: countMap['pending'] + (countMap['approved'] || 0) + (countMap['rejected'] || 0),
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
