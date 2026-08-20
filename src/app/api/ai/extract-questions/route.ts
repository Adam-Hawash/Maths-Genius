import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const fileUrl = formData.get('fileUrl') as string | null

    if (!file && !fileUrl) {
      return NextResponse.json({ error: 'No file or URL provided' }, { status: 400 })
    }

    var apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 })
    }

    var isPdf = false
    var imageBase64 = ''
    var mimeType = ''

    if (file) {
      var bytes = await file.arrayBuffer()
      var buffer = Buffer.from(bytes)
      imageBase64 = buffer.toString('base64')
      mimeType = file.type || ''
      isPdf = mimeType === 'application/pdf' || file.name.endsWith('.pdf')
    } else if (fileUrl) {
      var res = await fetch(fileUrl)
      if (!res.ok) {
        return NextResponse.json({ error: '
