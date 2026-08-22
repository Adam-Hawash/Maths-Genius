import { NextRequest, NextResponse } from 'next/server'
import { db, safeWrite } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    var status = request.nextUrl.searchParams.get('status') || ''
    var whereClause: any = {}
    if (status) {
      whereClause.status = status
    }
    var payments = await db.payment.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return NextResponse.json({ payments: payments })
  } catch (error: any) {
    console.error('Payments fetch error:', error)
    return NextResponse.json({ error: 'Server error: ' + (error.message || String(error)) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    var formData = await request.formData()
    var videoId = formData.get('videoId') as string || ''
    var videoTitle = formData.get('videoTitle') as string || ''
    var amount = parseFloat(formData.get('amount') as string || '0')
    var paymentMethod = formData.get('paymentMethod') as string || ''
    var receipt = formData.get('receipt') as File | null
    var studentId = formData.get('studentId') as string || ''
    var studentName = formData.get('studentName') as string || ''
    var notes = formData.get('notes') as string || ''

    if (!videoId || !paymentMethod || !receipt) {
      return NextResponse.json({ error: 'videoId, paymentMethod, and receipt are required' }, { status: 400 })
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
      var buffer = new Uint8Array(chunks.reduce((a, c) => a + c.length, 0))
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
      receiptPath = media.filePath
    }

    var payment = await safeWrite(function() {
      return db.payment.create({
        data: {
          studentId,
          studentName,
          videoId,
          videoTitle,
          amount,
          paymentMethod,
          receiptPath,
          notes,
          status: 'pending',
        },
      })
    })

    return NextResponse.json({ message: 'تم إرسال إيصال الدفع بنجاح! سيتم مراجعته قريباً', payment }, { status: 201 })
  } catch (error: any) {
    console.error('Payment submit error:', error)
    return NextResponse.json({ error: 'Server error: ' + (error.message || String(error)) }, { status: 500 })
  }
}
