import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const images = await db.galleryImage.findMany({ orderBy: { sortOrder: 'asc' } })
    return NextResponse.json({ images })
  } catch (error) {
    console.error('Gallery fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch gallery' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, filePath } = body
    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 })
    }
    const count = await db.galleryImage.count()
    const image = await db.galleryImage.create({
      data: { title: title || '', filePath, sortOrder: count },
    })
    return NextResponse.json({ image }, { status: 201 })
  } catch (error) {
    console.error('Gallery create error:', error)
    return NextResponse.json({ error: 'Failed to create gallery image' }, { status: 500 })
  }
}