// ============================================================
// /api/videos — قوائم الفيديوهات
// ============================================================
// حماية اللينكات:
//  - الأدمن (adminId صالح) → بيشوف كل البيانات بما فيها url/filePath
//  - أي حد تاني → url و filePath بيترجعوا فاضيين + thumb عن طريق
//    بروكسي /api/video-thumb/[id] (معرف اليوتيوب مش بيظهر)
//  - الزوار غير المسجلين بيشوفوا الفيديوهات المجانية بس
// عمليات الكتابة (POST) للأدمن بس.
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdmin, getStudentAnyStatus, safeThumb, getYouTubeId, mediaIdFromPath, extractEmbedSrc, ensureNativeEmbedColumn } from '@/lib/video-guard'

export const dynamic = 'force-dynamic'

/* اللينك المباشر لملف فيديو (MP4/WebM/M3U8/…) بيتشغل في المشغل العادي
   (من غير أي يوتيوب + إعدادات جودة ظاهرة) — فبيتصنف file مش link خارجي */
function isDirectMedia(u: string): boolean {
  if (!u) return false
  const s = String(u).trim()
  if (!/^https?:\/\//i.test(s) && !s.startsWith('/')) return false
  return /\.(mp4|webm|m3u8|mov|ogg|ogv)(\?.*)?$/i.test(s)
}

function stripVideo(v: { id: string; thumbnail: string; url: string; filePath: string; nativeEmbed?: boolean; [k: string]: unknown }) {
  // (2026-و3) الفيديوهات المتضافة من كود HTML embed → kind=embed
  // (الطالب بيشوفها كأنها درس محمي عادي — بتفتح في المشغل الآمن بتقدمة)
  const kind = (v as unknown as { nativeEmbed?: boolean }).nativeEmbed ? 'embed' : getYouTubeId(v.url || '') ? 'youtube' : mediaIdFromPath(v.filePath || '') ? 'file' : isDirectMedia(v.url) ? 'file' : v.url ? 'link' : 'none'
  return { ...v, url: '', filePath: '', kind, thumb: safeThumb(v) }
}

export async function GET(request: NextRequest) {
  try {
    // (2026-و3) self-heal لعمود nativeEmbed — أول استعلام بعد التحديث بيتأكد
    // إن العمود موجود في داتابيز الإنتاج (مرة واحدة بس وبعدين بيكاش)
    await ensureNativeEmbedColumn()
    const { searchParams } = new URL(request.url)
    const grade = searchParams.get('grade')
    const keyword = searchParams.get('keyword')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const adminId = searchParams.get('adminId')
    const studentId = searchParams.get('studentId')

    const admin = await isAdmin(adminId)
    const student = admin ? null : await getStudentAnyStatus(studentId)

    const where: Record<string, unknown> = {}
    if (grade) where.grade = grade
    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
      ]
    }
    // زائر بدون حساب → الفيديوهات المجانية بس (ومن غير أي لينكات)
    if (!admin && !student) where.price = 0

    const [videos, total] = await Promise.all([
      db.video.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.video.count({ where }),
    ])

    const safeVideos = admin ? videos : videos.map(stripVideo)

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
    const { title, url, grade, filePath, fileType, thumbnail, price, adminId, htmlEmbed } = body

    // الكتابة للأدمن بس
    if (!(await isAdmin(adminId))) {
      return NextResponse.json({ error: 'غير مسموح' }, { status: 401 })
    }

    if (!title || !grade) {
      return NextResponse.json({ error: 'Title and grade are required' }, { status: 400 })
    }

    // ===== (2026-و3) إضافة فيديو من كود HTML (طلب المستر) =====
    // المستر بيلزق كود تضمين iframe (من يوتيوب أو أي موقع تاني) —
    // بنستخرج لينك التضمين منه ونخزنه + nativeEmbed=true
    // → المشغل بيفتحه بواجهة الموقع الأصلية (⚙ جودة يوتيوب الحقيقية)
    // أو في iframe محمي لو الموقع تاني غير يوتيوب.
    // بيتقبل الكود في حقل htmlEmbed المخصص، أو لو لازق الكود نفسه في حقل الرابط.
    await ensureNativeEmbedColumn()
    let finalUrl = String(url || '').trim()
    let nativeEmbed = false
    const embedRaw = String(htmlEmbed || '').trim()
    if (embedRaw || /<\s*(iframe|embed|object)\b/i.test(finalUrl)) {
      const src = extractEmbedSrc(embedRaw || finalUrl)
      if (!src) {
        return NextResponse.json({ error: 'كود الـ HTML مفيهوش لينك تضمين صالح — اتأكد إن الكود فيه iframe وفيه src يبدأ بـ https' }, { status: 400 })
      }
      finalUrl = src
      nativeEmbed = true
    }

    if (!finalUrl && !filePath) {
      return NextResponse.json({ error: 'URL or file is required' }, { status: 400 })
    }

    const video = await db.video.create({
      data: {
        title,
        url: finalUrl,
        grade,
        filePath: filePath || '',
        fileType: fileType || '',
        thumbnail: thumbnail || '',
        price: Number(price) || 0,
        nativeEmbed,
      },
    })

    return NextResponse.json({ message: 'Video added', video }, { status: 201 })
  } catch (error: any) {
    console.error('Video create error:', error)
    return NextResponse.json({ error: 'Server error: ' + (error.message || String(error)) }, { status: 500 })
  }
}
