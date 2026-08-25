
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const grade = searchParams.get('grade')
    const keyword = searchParams.get('keyword')
    const studentId = searchParams.get('studentId') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const where: Record<string, unknown> = {}
    if (grade) where.grade = grade
    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
      ]
    }

    const [videos, total] = await Promise.all([
      db.video.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.video.count({ where }),
    ])

    // Work out which paid videos this student already owns so the client can
    // render unlock state without ever receiving a playable URL it shouldn't.
    const paidIds = videos.filter((v) => (v.price || 0) > 0).map((v) => v.id)
    let ownedIds: string[] = []
    if (studentId && paidIds.length > 0) {
      const grants = await db.videoAccess.findMany({
        where: { studentId, videoId: { in: paidIds } },
        select: { videoId: true },
      })
      ownedIds = grants.map((g) => g.videoId)
    }

    const safeVideos = videos.map((v) => {
      const isPaid = (v.price || 0) > 0
      const isPurchased = !isPaid || ownedIds.indexOf(v.id) !== -1
      return {
        ...v,
        // Never leak the source of a paid video the student has not unlocked.
        url: isPurchased ? v.url : '',
        filePath: isPurchased ? v.filePath : '',
        isPaid,
        isPurchased,
        isLocked: !isPurchased,
      }
    })

    return NextResponse.json({
      videos: safeVideos,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error: any) {
    console.error('Videos fetch error:', error)
    return NextResponse.json({ error: 'Server error: ' + (error.message || String(error)) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, url, grade, filePath, fileType, thumbnail, price } = body

    if (!title || !grade) {
      return NextResponse.json({ error: 'Title and grade are required' }, { status: 400 })
    }
    if (!url && !filePath) {
      return NextResponse.json({ error: 'URL or file is required' }, { status: 400 })
    }

    const video = await db.video.create({
      data: {
        title,
        url: url || '',
        grade,
        filePath: filePath || '',
        fileType: fileType || '',
        thumbnail: thumbnail || '',
        price: typeof price === 'number' ? price : 0,
      },
    })

    return NextResponse.json({ message: 'Video added', video }, { status: 201 })
  } catch (error: any) {
    console.error('Video create error:', error)
    return NextResponse.json({ error: 'Server error: ' + (error.message || String(error)) }, { status: 500 })
  }
}
