'use client'

/**
 * ضغط الصور في المتصفح قبل الرفع:
 * - إعادة رسم على canvas بأقصى بعد 900px (الطول أو العرض)
 * - تصدير JPEG بجودة 0.82
 * - الناتج data URL يُخزن مباشرة في قاعدة البيانات
 */

export const COMPRESS_MAX_DIMENSION = 900
export const COMPRESS_QUALITY = 0.82

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function isAcceptedImageType(file: File): boolean {
  return ACCEPTED_TYPES.includes(file.type)
}

export async function compressImageToDataUrl(file: File): Promise<string> {
  if (!isAcceptedImageType(file)) {
    throw new Error('صيغة الصورة غير مدعومة — استخدم JPG أو PNG أو WEBP')
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('تعذر قراءة الملف'))
    reader.readAsDataURL(file)
  })

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('تعذر فتح الصورة'))
    image.src = dataUrl
  })

  const scale = Math.min(
    1,
    COMPRESS_MAX_DIMENSION / Math.max(img.naturalWidth || 1, img.naturalHeight || 1)
  )
  const width = Math.max(1, Math.round((img.naturalWidth || 1) * scale))
  const height = Math.max(1, Math.round((img.naturalHeight || 1) * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('تعذر تجهيز معالجة الصورة')

  // خلفية بيضاء بدل الشفافية لأن JPEG لا يدعم الشفافية
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)

  const compressed = canvas.toDataURL('image/jpeg', COMPRESS_QUALITY)
  if (!compressed.startsWith('data:image/jpeg;base64,')) {
    throw new Error('تعذر ضغط الصورة')
  }
  return compressed
}
