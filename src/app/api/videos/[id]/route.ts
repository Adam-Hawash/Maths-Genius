
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/videos/[id] - 获取单个视频
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const video = await db.video.findUnique({ where: { id } })

    if (!video) {
      return NextResponse.json({ error: '视频不存在' }, { status: 404 })
    }

    return NextResponse.json({ video })
  } catch (error) {
    console.error('获取视频详情失败:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

// PUT /api/videos/[id] - 更新视频
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, url, grade } = body

    const existing = await db.video.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: '视频不存在' }, { status: 404 })
    }

    const video = await db.video.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(url && { url }),
        ...(grade && { grade }),
      },
    })

    return NextResponse.json({ message: '视频更新成功', video })
  } catch (error) {
    console.error('更新视频失败:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

// DELETE /api/videos/[id] - 删除视频
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.video.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: '视频不存在' }, { status: 404 })
    }

    await db.video.delete({ where: { id } })

    return NextResponse.json({ message: '视频删除成功' })
  } catch (error) {
    console.error('删除视频失败:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}
