// ============================================================
// /api/admin/parents — (2026-و90) إدارة أولياء الأمور من لوحة الأدمن
//   طلب المستر الحرفي: «اعمللي تاب جديد في صفحة الأدمن جنب قسم الطلاب
//   اسمه أولياء الأمور — أول ما أضغط عليه يجيب لي أولياء الأمور اللي في
//   المنصة فأقدر أمسح فيهم».
//
// GET    /api/admin/parents?adminId=...   → قائمة أولياء الأمور + أبناءهم
//                                           + عدد الأجهزة المفعّلة للإشعارات
// DELETE /api/admin/parents?adminId=...   → حذف ولي أمر نهائيًا (Body: { id })
//                                           بيمسح معاه: روابط أبنائه
//                                           (ParentStudent) + إشعاراته
//                                           الداخلية (ParentNotification)
//                                           + أجهزته المشتركة في الإشعارات
//                                           (ParentPushSubscription).
//   ⚠️ الحذف ما بيلمس الطالب ولا درجاته خالص.
//
// نفس نمط auth الأدمن في المشروع (adminId + isAdmin زي db-cleanup)
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { db, safeWrite } from '@/lib/db'
import { isAdmin } from '@/lib/video-guard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    var searchParams = new URL(request.url).searchParams
    var adminId = String(searchParams.get('adminId') || '')
    if (!(await isAdmin(adminId))) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    var parents: any[] = []
    try {
      parents = await db.parent.findMany({ orderBy: { createdAt: 'desc' } })
    } catch (e) {
      parents = []
    }

    /* أسماء الطلاب كلها مرة واحدة (الأساسي + المدموجين) */
    var studentIds: string[] = []
    for (var i = 0; i < parents.length; i++) {
      if (parents[i].studentId && studentIds.indexOf(parents[i].studentId) === -1) studentIds.push(parents[i].studentId)
    }
    var links: any[] = []
    try { links = await db.parentStudent.findMany() } catch (eL) { links = [] }
    for (var li = 0; li < links.length; li++) {
      if (links[li].studentId && studentIds.indexOf(links[li].studentId) === -1) studentIds.push(links[li].studentId)
    }
    var studentsMap: Record<string, any> = {}
    if (studentIds.length) {
      try {
        var students = await db.student.findMany({ where: { id: { in: studentIds } } })
        for (var si = 0; si < students.length; si++) studentsMap[students[si].id] = students[si]
      } catch (eS) {}
    }

    /* عدادات الإشعارات والأجهزة — parentId فيهم = رقم موبايل ولي الأمر مطبّع */
    var linksByParent: Record<string, any[]> = {}
    for (var lj = 0; lj < links.length; lj++) {
      var pid = links[lj].parentId
      if (!linksByParent[pid]) linksByParent[pid] = []
      linksByParent[pid].push(links[lj])
    }

    var subs: any[] = []
    var notes: any[] = []
    try { subs = await db.parentPushSubscription.findMany() } catch (eP) { subs = [] }
    try { notes = await db.parentNotification.findMany() } catch (eN) { notes = [] }
    var subsCount: Record<string, number> = {}
    for (var sj = 0; sj < subs.length; sj++) subsCount[subs[sj].parentId] = (subsCount[subs[sj].parentId] || 0) + 1
    var notesCount: Record<string, number> = {}
    for (var nj = 0; nj < notes.length; nj++) notesCount[notes[nj].parentId] = (notesCount[notes[nj].parentId] || 0) + 1

    var out = parents.map(function (p: any) {
      var kids: any[] = []
      var primary = studentsMap[p.studentId] || null
      if (primary) kids.push({ id: primary.id, name: primary.name, phone: primary.phone, grade: primary.grade })
      var extra = linksByParent[p.id] || []
      for (var ej = 0; ej < extra.length; ej++) {
        var st2 = studentsMap[extra[ej].studentId]
        if (st2 && (!primary || st2.id !== primary.id)) kids.push({ id: st2.id, name: st2.name, phone: st2.phone, grade: st2.grade })
      }
      return {
        id: p.id,
        name: p.name,
        phone: p.phone,
        createdAt: p.createdAt,
        students: kids,
        pushDevices: subsCount[p.phone] || 0,
        notifications: notesCount[p.phone] || 0,
      }
    })

    return NextResponse.json({ ok: true, parents: out, total: out.length })
  } catch (err: any) {
    console.error('[admin/parents] GET error:', err)
    return NextResponse.json({ error: 'حدث خطأ مؤقت في السيرفر' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    var searchParams = new URL(request.url).searchParams
    var adminId = String(searchParams.get('adminId') || '')
    var body: any = null
    try { body = await request.json() } catch (e) { body = null }
    if (!(await isAdmin(adminId))) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    var id = String((body && body.id) || searchParams.get('id') || '')
    if (!id) return NextResponse.json({ error: 'معرف ولي الأمر ناقص' }, { status: 400 })

    var parent: any = null
    try { parent = await db.parent.findUnique({ where: { id: id } }) } catch (eF) {}
    if (!parent) return NextResponse.json({ error: 'حساب ولي الأمر مش موجود (ممكن يكون اتمسح قبل كده)' }, { status: 404 })
    var phone = String(parent.phone || '')

    var deletedNotifications = 0
    var deletedSubs = 0
    var deletedLinks = 0

    try {
      var r1 = await safeWrite(function () { return db.parentNotification.deleteMany({ where: { parentId: phone } }) })
      deletedNotifications = r1 ? r1.count : 0
    } catch (e1) {}
    try {
      var r2 = await safeWrite(function () { return db.parentPushSubscription.deleteMany({ where: { parentId: phone } }) })
      deletedSubs = r2 ? r2.count : 0
    } catch (e2) {}
    try {
      var r3 = await safeWrite(function () { return db.parentStudent.deleteMany({ where: { parentId: id } }) })
      deletedLinks = r3 ? r3.count : 0
    } catch (e3) {}
    await safeWrite(function () { return db.parent.delete({ where: { id: id } }) })

    return NextResponse.json({
      ok: true,
      deleted: { notifications: deletedNotifications, pushDevices: deletedSubs, studentLinks: deletedLinks },
    })
  } catch (err: any) {
    console.error('[admin/parents] DELETE error:', err)
    return NextResponse.json({ error: 'حدث خطأ مؤقت في السيرفر — جرب تاني' }, { status: 500 })
  }
}
