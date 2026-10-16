// Z-14: (1) رجوع ترتيب الفيديوهات الزمني (الأقدم أولًا) في كل المنصات
//       (2) ترجمة الحاجات الجديدة (ز11/ز12/ز13) للإنجليزي في كل المنصات
// تشغيل: bun /home/z/my-project/scripts/z14-run.mjs
import fs from 'fs'
import path from 'path'

const BASE = '/home/z/repos'
const ALL = ['Maths-Genius', 'Mr-Mohamed-Sabry', 'Mr-Sherif-ElSayed', 'Zicola-Math', 'shaimaa-selim-science', 'mensat-alqaid']
const FIVE = ALL.filter(function (r) { return r !== 'mensat-alqaid' }) // من غير منصة القائد (مفيش فيها إخفاء درس/ترتيب API)

const R = (old, nw, n = null) => ({ old, nw, n })
const tasks = []
function T(repo, file, repls) { tasks.push({ repo, file, repls }) }
const stats = { ok: 0, miss: [], applied: 0 }

// ---------- 1) ترتيب الفيديوهات: API POST (5 منصات) ----------
const VIDEOS_COMMENT_OLD = `    /* (2026-ز11 — طلب المستر الحرفي): «اللي ينزل الجديد يبقى في الاول واللي
       في الاخر يكون الاقدم» — الفيديو/الدرس الجديد بياخد أصغر رقم ترتيب
       (minSort-1) فبيطلع أول القايمة حتى لو الصف مرتب يدويًا.
       أما جزء جديد بيتركب على درس موجود (groupKey) فبياخد ترتيب درسه
       عشان الدرس مايتنقلش من مكانه والأجزاء تفضل متسلسلة جواه. */`
const VIDEOS_COMMENT_NEW = `    /* (2026-ز14 — طلب المستر): رجّعنا الترتيب الزمني زي ما كان —
       «أنا نزلت الدرس الأول وبعده الدرس الثاني، فالدرس الثاني يجي بعد الأول».
       الفيديو/الدرس الجديد بيتمسك في الآخر (maxSort+1) لو الصف مرتب يدويًا،
       ولو الصف مالوش ترتيب يدوي بيفضل 0 والترتيب بيبقى زمني (الأقدم أولًا).
       أما جزء جديد بيتركب على درس موجود (groupKey) فبياخد ترتيب درسه
       عشان الدرس مايتنقلش من مكانه والأجزاء تفضل متسلسلة جواه. */`
const VIDEOS_SORT_OLD = `      if (!inherited) {
        const agg = await db.video.aggregate({ _min: { sortIndex: true }, where: { grade: gradeWhere(String(grade)) } })
        const minSort = Number((agg._min && (agg._min as { sortIndex: number | null }).sortIndex) || 0)
        newSortIndex = minSort - 1
      }`
const VIDEOS_SORT_NEW = `      if (!inherited) {
        const agg = await db.video.aggregate({ _max: { sortIndex: true }, where: { grade: gradeWhere(String(grade)) } })
        const maxSort = Number((agg._max && (agg._max as { sortIndex: number | null }).sortIndex) || 0)
        if (maxSort > 0) newSortIndex = maxSort + 1
      }`
for (const r of FIVE) {
  T(r, 'src/app/api/videos/route.ts', [R(VIDEOS_COMMENT_OLD, VIDEOS_COMMENT_NEW, 1), R(VIDEOS_SORT_OLD, VIDEOS_SORT_NEW, 1)])
}

// ---------- 2) ترتيب الفيديوهات: واجهة الطالب (6 منصات) ----------
const PORTAL_COMMENT_OLD = `  /* (2026-ز11 — طلب المستر الحرفي): «اللي ينزل الجديد يبقى في الاول واللي
     في الاخر يكون الاقدم» — الفيديو الجديد فوق والقديم تحت.
     الترتيب اليدوي للمستر (▲▼) لسه بيتقدم على التاريخ، والفيديو الجديد
     بياخد أصغر رقم ترتيب من السيرفر فبيطلع فوق حتى في الصفوف المرتبة. */`
const PORTAL_COMMENT_NEW = `  /* (2026-ز14 — طلب المستر): رجّعنا الترتيب الزمني — «الدرس التاني يجي بعد
     الدرس الأول». الترتيب اليدوي للمستر (▲▼) بيتقدم على التاريخ، والفيديو
     الجديد بيتمسك في الآخر (maxSort+1 من السيرفر)، والترتيب السالب من حقبة
     ز11 بيتعامل كأنه صفر عشان القوايم القديمة ترجع لترتيبها الزمني الطبيعي. */`
const PORTAL_SORT_OLD = `      var sa = Number((a as any).sortIndex) || 0
      var sb = Number((b as any).sortIndex) || 0
      if (sa !== sb) return sa - sb
      var ta = new Date((a as any).createdAt || 0).getTime()
      var tb = new Date((b as any).createdAt || 0).getTime()
      return tb - ta`
const PORTAL_SORT_NEW = `      var sa = Number((a as any).sortIndex) || 0
      if (sa < 0) sa = 0
      var sb = Number((b as any).sortIndex) || 0
      if (sb < 0) sb = 0
      if (sa !== sb) return sa - sb
      var ta = new Date((a as any).createdAt || 0).getTime()
      var tb = new Date((b as any).createdAt || 0).getTime()
      return ta - tb`
for (const r of ALL) {
  T(r, 'src/components/student/StudentPortal.tsx', [R(PORTAL_COMMENT_OLD, PORTAL_COMMENT_NEW, 1), R(PORTAL_SORT_OLD, PORTAL_SORT_NEW, 1)])
}

// ---------- 3) رسالة الرفض للطالب (API) — 6 منصات ----------
const REJECT_MSG = '❌ الحساب بتاعك مرفوض من المنصة. لو عندك استفسار تواصل مع المستر'
const REJECT_MSG_EN = '❌ Your account has been rejected from the platform. If you have any questions, contact the teacher'
for (const r of ALL) T(r, 'src/app/api/students/route.ts', [R(REJECT_MSG, REJECT_MSG_EN, 2)])
for (const r of ['Maths-Genius', 'Mr-Mohamed-Sabry', 'Mr-Sherif-ElSayed', 'Zicola-Math']) {
  T(r, 'src/components/landing/AuthPages.tsx', [R("toast.error('" + REJECT_MSG + "', { duration: 8000 })", "toast.error('" + REJECT_MSG_EN + "', { duration: 8000 })", 1)])
}

// ---------- 4) الأدمن: الرفض + تاب مرفوض + إخفاء درس ----------
const ADMIN_REJECT = [
  R("toast.success('تم رفض الطالب وحذفه من المنصة — لو حاول يدخل تاني هيتقالده حسابك مرفوض')", 'toast.success(\'Student rejected and removed — if he tries to log in again he will get "Your account has been rejected"\')', 1),
  R("toast.error('خطأ في رفض الطالب')", "toast.error('Error rejecting student')", 1),
  R('title="رفض وحذف الطالب من المنصة — لو حاول يدخل تاني هيتقالده حسابك مرفوض"', 'title="Reject & remove student from the platform"', 1),
  R("f === 'rejected' ? 'مرفوض'", "f === 'rejected' ? 'Rejected'", 1),
  R("rejected: 'مرفوض', refused: 'مرفوض'", "rejected: 'Rejected', refused: 'Refused'", 1),
  R('title="إلغاء الرفض وقبول الطالب"', 'title="Un-reject and approve student"', 1),
]
const ADMIN_HIDE = [
  R(`        toast.success(lessonHideSelected.length > 0 ? 'تم إخفاء الدرس كامل عن الطلاب المحددين — مش هيشوفوه خالص' : 'تم فك إخفاء الدرس — بقى ظاهر للكل')
      } else { toast.error('فشل الحفظ') }
    } catch { toast.error('خطأ في الاتصال') }`,
    `        toast.success(lessonHideSelected.length > 0 ? 'Lesson hidden from the selected students — they will not see it at all' : 'Lesson unhidden — it is visible to everyone again')
      } else { toast.error('Failed to save') }
    } catch { toast.error('Connection error') }`, 1),
  R('<EyeOff className="h-3.5 w-3.5 mr-1" />إخفاء الدرس كامل عن طلاب', '<EyeOff className="h-3.5 w-3.5 mr-1" />Hide full lesson', 1),
  R('title="إخفاء الدرس كله (كل فيديوهاته) عن طلاب محددين"', 'title="Hide the whole lesson (all its videos) from selected students"', 1),
  R('>إخفاء الدرس: {lessonHideGroup.title}</h3>', '>Hide lesson: {lessonHideGroup.title}</h3>', 1),
  R('>الدرس كله ({lessonHideGroup.parts} فيديو) هيختفي من الطلاب المحددين — مش هيشوفوه خالص لحد ما تفك الإخفاء</p>', '>The whole lesson ({lessonHideGroup.parts} videos) will be hidden from the selected students — they will not see it until you unhide it</p>', 1),
  R('>طلاب صف {lessonHideGroup.grade} — المحددين مخفيين عنهم ({lessonHideSelected.length})</Label>', '>Grade {lessonHideGroup.grade} students — selected ({lessonHideSelected.length})</Label>', 1),
  R('>مفيش طلاب في الصف ده</p>', '>No students in this grade</p>', 1),
  R('>اللي مختارينهم بيتخفي عنهم الدرس بأكله — سيبهم فاضيين ودوس حفظ لو عايز تفك الإخفاء</p>', '>The selected students will have the whole lesson hidden — leave them empty and press Save to unhide it</p>', 1),
  R("{lessonHideSaving ? <Loader2 className=\"h-4 w-4 animate-spin\" /> : 'حفظ'}", '{lessonHideSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : \'Save\'}', 1),
  R('<Button variant="outline" onClick={() => setLessonHideOpen(false)}>إلغاء</Button>', '<Button variant="outline" onClick={() => setLessonHideOpen(false)}>Cancel</Button>', 1),
]
for (const r of FIVE) T(r, 'src/components/admin/AdminDashboard.tsx', ADMIN_REJECT.concat(ADMIN_HIDE))
// منصة القائد: نفس الرفض لكن من غير إخفاء الدرس + statusLabels مختلف
T('mensat-alqaid', 'src/components/admin/AdminDashboard.tsx', [
  ADMIN_REJECT[0], ADMIN_REJECT[1], ADMIN_REJECT[2], ADMIN_REJECT[3],
  R("approved: 'مقبول', rejected: 'مرفوض' }", "approved: 'مقبول', rejected: 'Rejected' }", 1),
])

// ---------- 5) المدفوعات: توستات الرفض + شارة مرفوض ----------
const PAY_REJECT = [
  R("toast.success('تم رفض الطالب وحذفه من المنصة — لو حاول يدخل تاني هيتقالده حسابك مرفوض')", 'toast.success(\'Student rejected and removed — if he tries to log in again he will get "Your account has been rejected"\')', 1),
  R("toast.error('خطأ في رفض الطالب')", "toast.error('Error rejecting student')", 1),
  R("f === 'rejected' ? 'مرفوض' : 'الكل'}</Button>", "f === 'rejected' ? 'Rejected' : 'الكل'}</Button>", 1),
]
for (const r of ALL) T(r, 'src/components/PaymentsPanel.tsx', PAY_REJECT)

// ---------- 6) الكتب: معاينة/مسح (وائل + صبري بنفس النسخة، زيكولا بأزرار مكتوبة) ----------
const BOOKS_COMMON = [
  R('الأسئلة ({qCount})', 'Questions ({qCount})', 1),
  R('title="معاينة الكتاب"', 'title="Preview book"', 1),
  R('aria-label="معاينة"', 'aria-label="Preview"', 1),
  R('👁 معاينة: {previewBook.title}', '👁 Preview: {previewBook.title}', 1),
  R('>فتح في تاب جديد</a>', '>Open in new tab</a>', 1),
  R('aria-label="إغلاق"', 'aria-label="Close"', 2),
  R("title={'معاينة ' + (previewBook.title || 'الكتاب')}", "title={'Preview ' + (previewBook.title || 'book')}", 1),
  R('>📄 أسئلة «{bookQsBook.title}»</p>', '>📄 Questions «{bookQsBook.title}»</p>', 1),
  R('آخر أسئلة اتحكمت من الكتاب ده — {qsList.length} سؤال', 'Latest questions graded from this book — {qsList.length} questions', 1),
  R('لسه مستخرجتش أسئلة من الكتاب ده — استخرج منه من شاشة استخراج الذكاء الاصطناعي والأسئلة هتتفصل هنا', 'No questions extracted from this book yet — extract them from the AI extraction screen and they will show up here', 1),
  R('النموذجي: {String(q.modelAnswer).substring(0, 200)}', 'Model answer: {String(q.modelAnswer).substring(0, 200)}', 1),
  R('title="حذف"', 'title="Delete"', 1),
]
for (const r of ['Maths-Genius', 'Mr-Mohamed-Sabry']) T(r, 'src/components/admin/BooksManager.tsx', BOOKS_COMMON)
T('Zicola-Math', 'src/components/admin/BooksManager.tsx', BOOKS_COMMON.filter(function (x) { return x.old !== 'title="حذف"' }).concat([
  R('👁 معاينة', '👁 Preview', 1),
  R('title="مسح الكتاب"', 'title="Delete book"', 1),
  R('<Trash2 className="h-3.5 w-3.5" />مسح', '<Trash2 className="h-3.5 w-3.5" />Delete', 1),
]))

// ---------- 7) لوحة تحدي المستر (الملف متطابق في الست منصات) ----------
const TCP = [
  R("const LETTERS = ['أ', 'ب', 'ج', 'د']", "const LETTERS = ['A', 'B', 'C', 'D']", 1),
  R("return new Date(s).toLocaleString('ar-EG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })", "return new Date(s).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })", 1),
  R("toast.error('لازم ملف فيديو (MP4/MOV…)')", "toast.error('A video file is required (MP4/MOV…)')", 1),
  R("toast.error('الفيديو كبير أوي (الحد 150MB) — ارفعه على يوتيوب والصق اللينك')", "toast.error('Video is too large (150MB limit) — upload it to YouTube and paste the link')", 1),
  R("toast.success('الفيديو اترفع ✅ — متسيبش لينك يوتيوب في نفس الوقت')", "toast.success('Video uploaded ✅ — do not keep a YouTube link at the same time')", 1),
  R("'فشل رفع الفيديو — جرب تاني'", "'Video upload failed — try again'", 1),
  R("'اختار حاجة واحدة — لينك يوتيوب أو ملف مرفوع (امسح واحد منهم)'", "'Pick one — a YouTube link or an uploaded file (remove one of them)'", 1),
  R("'اتضاف ' + String(data.added || 0) + ' سؤال من «' + String(data.fileName || f.name) + '» — البنك بقى ' + String(data.bankCount || 0) + ' سؤال 🎯'", "String(data.added || 0) + ' questions added from «' + String(data.fileName || f.name) + '» — the bank now has ' + String(data.bankCount || 0) + ' questions 🎯'", 1),
  R("'فشل رفع الملف — جرب تاني'", "'File upload failed — try again'", 1),
  R("toast.error('مشكلة في الاتصال — جرب تاني')", "toast.error('Connection problem — try again')", 3),
  R("toast.error(String((data && data.error) || 'حصلت مشكلة'))", "toast.error(String((data && data.error) || 'Something went wrong'))", 2),
  R("toast.error('مشكلة في الاتصال')", "toast.error('Connection problem')", 4),
  R("'المدة لازم تكون من 5 لـ 90 ثانية'", "'Duration must be between 5 and 90 seconds'", 1),
  R("'بقت مدة الفلاش كاردز ' + String(n) + ' ثانية ⚡'", "'Flashcards duration is now ' + String(n) + ' seconds ⚡'", 1),
  R("toast.error(String((d && d.error) || 'حصلت مشكلة'))", "toast.error(String((d && d.error) || 'Something went wrong'))", 2),
  R("toast.error('اكتب الأمام (السؤال) والظهر (الإجابة)')", "toast.error('Write the front (question) and the back (answer)')", 1),
  R("'الكارت اتضاف ✅'", "'Card added ✅'", 1),
  R("toast.error('اكتب الكروت — كل سطر: السؤال | الإجابة')", "toast.error('Write the cards — one per line: question | answer')", 1),
  R("'اتضاف ' + String(d.added || 0) + ' كارت ✅'", "String(d.added || 0) + ' cards added ✅'", 1),
  R("toast.error(String(data.error || 'مشكلة في تحميل التحدي'))", "toast.error(String(data.error || 'Failed to load the challenge'))", 1),
  R("toast.error(String(data.error || 'حصلت مشكلة — جرب تاني'))", "toast.error(String(data.error || 'Something went wrong — try again'))", 1),
  R("toast.error('اكتب عنوان وسؤال التحدي')", "toast.error('Write the challenge title and question')", 1),
  R("toast.error('لازم اختيارين على الأقل مش فاضيين')", "toast.error('At least two non-empty options are required')", 1),
  R("toast.error('اختار الإجابة الصح من الاختيارات المكتوبة')", "toast.error('Pick the correct answer from the written options')", 1),
  R("'نزل التحدي! التحدي القديم اتقفل تلقائي 🎯'", "'Challenge is live! The previous challenge was closed automatically 🎯'", 1),
  R("'اتقفل التحدي ✋'", "'Challenge closed ✋'", 1),
  R("video.videoUrl ? 'الفيديو اتربط بالتحدي 🎬 — هيثبت فوق السؤال عند الطلاب' : 'الفيديو اتشال من التحدي'", "video.videoUrl ? 'Video attached to the challenge 🎬 — it will show above the question for students' : 'Video removed from the challenge'", 1),
  R("'الفيديو اتشال من التحدي'", "'Video removed from the challenge'", 1),
  R("'نزلت في التحدي! 👨‍🏫'", "'You joined the challenge! 👨‍🏫'", 1),
  R("toast.error('السيرفر مش بيبعت معرف الدخول — مش هنعرف نمسحه من هنا')", "toast.error('The server did not send the entry ID — cannot remove it from here')", 1),
  R("'اتشال الدخول'", "'Entry removed'", 1),
  R("'إعادة فتح «' + h.title + '» هتقفل التحدي النشط الحالي — تكمل؟'", "'Reopening «' + h.title + '» will close the current active challenge — continue?'", 1),
  R("'اتفتح التحدي تاني 🔁'", "'Challenge reopened 🔁'", 1),
  R("'متأكد من مسح «' + h.title + '»؟ هتمسح كل دخولات الطلبة معاه'", "'Delete «' + h.title + '»? All student entries will be deleted with it'", 1),
  R("'اتمسح التحدي'", "'Challenge deleted'", 1),
  R('بنحمّل تحدي المستر…', 'Loading the teacher challenge…', 1),
  R('🎯 بنك أسئلة التحدي — من ملفاتك (بالإنجليزي)', '🎯 Challenge question bank — from your files (in English)', 1),
  R(`            ارفع ملف (PDF أو صورة) فيه أسئلة — المنصة هتستخرج الأسئلة <b>بالإنجليزي</b> تلقائيًا،
            والطالب أول ما يخش «تحدي المستر» هياخد <b>10 أسئلة عشوائية من كل الملفات</b> كل جولة.`, `            Upload a file (PDF or image) with questions — the platform extracts the questions <b>in English</b> automatically,
            and when a student opens the teacher challenge he gets <b>10 random questions from all files</b> every round.`, 1),
  R("'بيستخرج الأسئلة… (من 10 لـ 60 ث)'", "'Extracting questions… (10 to 60 s)'", 1),
  R("'ارفع ملف أسئلة (PDF / صورة)'", "'Upload a questions file (PDF / image)'", 1),
  R("{bankOpen ? 'اخفي الأسئلة' : 'شوف الأسئلة'}", "{bankOpen ? 'Hide questions' : 'Show questions'}", 1),
  R("'متأكد إنك عايز تمسح كل أسئلة البنك؟'", "'Delete all bank questions?'", 1),
  R("'البنك اتمسح خلاص'", "'Bank cleared'", 1),
  R('امسح الكل', 'Delete all', 2),
  R('<Loader2 className="h-4 w-4 animate-spin" /> بنحمّل…</p>', '<Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>', 1),
  R("title={q.active ? 'إخفاء من الطالب' : 'تفعيل تاني'}", "title={q.active ? 'Hide from students' : 'Activate again'}", 1),
  R("q.active ? 'اتخفى السؤال' : 'اتفع السؤال'", "q.active ? 'Question hidden' : 'Question activated'", 1),
  R('title="مسح السؤال"', 'title="Delete question"', 1),
  R("'اتمسح السؤال'", "'Question deleted'", 1),
  R('⚡ فلاش كاردز — مدة البطاقة', '⚡ Flashcards — card duration', 1),
  R('حدد كام ثانية للطالب يشوف كل بطاقة في تحدي الفلاش كاردز (من 5 لـ 90 — الافتراضي 15 ثانية).', 'Set how many seconds a student sees each card in the flashcards challenge (5 to 90 — default 15 seconds).', 1),
  R('احفظ المدة', 'Save duration', 1),
  R('⚡ كروت الفلاش بتاعتك — تحدي على محتواك (بالإنجليزي)', '⚡ Your flash cards — a challenge on your own content (in English)', 1),
  R(`            حط كروت (سؤال ← إجابة) من اللي بتحطه في المنصة — أول ما يكون فيه <b>4 كروت نشطة</b>،
            تحدي «⚡ فلاش كاردز» عند الطلاب هيبقى <b>على كروتك بالإنجليزي</b> بنفس المدة اللي فوق
            ولوحة الشرف. لو مفيش كروت، الطالب بياخد تدريب سريع مولّد تلقائي.`, `            Add cards (question ← answer) from your platform content — once there are <b>4 active cards</b>,
            the students' ⚡ Flashcards challenge runs <b>on your cards in English</b> with the same duration
            and leaderboard above. With no cards, students get a quick auto-generated practice.`, 1),
  R('الأمام — السؤال (Front)</label>', 'Front — the question (Front)</label>', 1),
  R('الظهر — الإجابة (Back)</label>', 'Back — the answer (Back)</label>', 1),
  R('ضيف كارت', 'Add card', 1),
  R('لزق كروت كتير', 'Paste many cards', 1),
  R("{deckOpen ? 'اخفي الكروت' : 'شوف الكروت'} ({deckCards.length})", "{deckOpen ? 'Hide cards' : 'Show cards'} ({deckCards.length})", 1),
  R("'متأكد إنك عايز تمسح كل الكروت؟'", "'Delete all cards?'", 1),
  R("'كل الكروت اتمسحت'", "'All cards deleted'", 1),
  R('كل سطر كارت واحد — السؤال ثم علامة | ثم الإجابة:</p>', 'One card per line — question then | then the answer:</p>', 1),
  R('ضيف كل السطور', 'Add all lines', 1),
  R("title={c.active ? 'إخفاء الكارت' : 'تفعيل تاني'}", "title={c.active ? 'Hide card' : 'Activate again'}", 1),
  R("c.active ? 'الكارت اتخفى' : 'الكارت اتفعل'", "c.active ? 'Card hidden' : 'Card activated'", 1),
  R('title="مسح الكارت"', 'title="Delete card"', 1),
  R("'الكارت اتمسح'", "'Card deleted'", 1),
  R('➕ نزّل تحدي جديد', '➕ Post a new challenge', 1),
  R('عنوان التحدي</label>', 'Challenge title</label>', 1),
  R('placeholder="مثال: تحدي الأسبوع — معادلة ذكية"', 'placeholder="Example: Weekly challenge — smart equation"', 1),
  R('block text-sm font-medium">السؤال</label>', 'block text-sm font-medium">Question</label>', 1),
  R('placeholder="اكتب السؤال الصعب هنا…"', 'placeholder="Write the hard question here…"', 1),
  R('الاختيارات — علّم على الصح ✅</label>', 'Options — mark the correct one ✅</label>', 1),
  R("placeholder={i < 2 ? 'اختيار ' + LETTERS[i] + ' (مطلوب)' : 'اختيار ' + LETTERS[i] + ' (اختياري)'}", "placeholder={i < 2 ? 'Option ' + LETTERS[i] + ' (required)' : 'Option ' + LETTERS[i] + ' (optional)'}", 1),
  R('\n                    الصح\n                  </label>', '\n                    Correct\n                  </label>', 1),
  R('النقاط</label>', 'Points</label>', 1),
  R('المدة بالدقايق</label>', 'Duration in minutes</label>', 1),
  R('0 = مفتوح لحد ما تقفله بنفسك', '0 = open until you close it', 1),
  R('فيديو التحدي (اختياري)', 'Challenge video (optional)', 1),
  R('صوّر فيديو وابعته للطلاب: الصق لينك يوتيوب <b>أو</b> ارفع ملف فيديو — هيظهر فوق السؤال في تحدي المستر.', 'Record a video and send it to students: paste a YouTube link <b>or</b> upload a video file — it shows above the question in the teacher challenge.', 1),
  R("{fVideoUploading ? 'بينرفع…' : 'ارفع ملف فيديو'}", "{fVideoUploading ? 'Uploading…' : 'Upload video file'}", 2),
  R('شيل الفيديو من التحدي', 'Remove video from challenge', 1),
  R('شيل الفيديو', 'Remove video', 1),
  R('نزّل التحدي', 'Post the challenge', 1),
  R('ملاحظة: تنزيل تحدي جديد بيقفل التحدي الشغال تلقائي — والطالب اللي جاوب قبل كده مش هيتأثر', 'Note: posting a new challenge automatically closes the active one — students who already answered are not affected', 1),
  R('{active.points} نقطة</Badge>', '{active.points} points</Badge>', 1),
  R("{active.closesAt ? '⏳ لحد ' + fmtDateTime(active.closesAt) : '♾️ مفتوح'}", "{active.closesAt ? '⏳ until ' + fmtDateTime(active.closesAt) : '♾️ open'}", 1),
  R('<Youtube className="h-4 w-4 text-red-600" />\n                  فيديو التحدي\n', '<Youtube className="h-4 w-4 text-red-600" />\n                  Challenge video\n', 1),
  R('متصل بالتحدي ✅', 'Attached to the challenge ✅', 1),
  R('مفيش فيديو', 'No video', 1),
  R('title="فيديو التحدي"', 'title="Challenge video"', 1),
  R('placeholder="لينك يوتيوب جديد (اختياري)…"', 'placeholder="New YouTube link (optional)…"', 1),
  R("{active.videoUrl ? 'حدّث الفيديو' : 'اربط الفيديو بالتحدي'}", "{active.videoUrl ? 'Update video' : 'Attach video to the challenge'}", 1),
  R('قفل التحدي', 'Close the challenge', 1),
  R('ادخل التحدي بنفسك 👨‍🏫', 'Join the challenge yourself 👨‍🏫', 1),
  R('لوحة الترتيب', 'Leaderboard', 1),
  R('(الصح الأول = الأسرع)', '(correct first = fastest)', 1),
  R('لسه حدش جاوب — شوف مين هيوصل الأول 👀', 'Nobody has answered yet — see who gets there first 👀', 1),
  R('👨‍🏫 المستر', '👨‍🏫 Teacher', 1),
  R('aria-label="شيل الدخول"', 'aria-label="Remove entry"', 1),
  R('title="شيل الدخول ده"', 'title="Remove this entry"', 1),
  R('مفيش تحدي شغال دلوقتي — نزّل واحد من فوق وهيتعرض هنا 🎯', 'No active challenge right now — post one above and it will show up here 🎯', 1),
  R('📜 تحديات قديمة', '📜 Past challenges', 1),
  R('مفيش تحديات قديمة', 'No past challenges', 1),
  R('{h.points} نقطة', '{h.points} points', 1),
  R('إعادة فتح', 'Reopen', 1),
  R('aria-label="مسح"', 'aria-label="Delete"', 1),
  R('title="مسح"', 'title="Delete"', 1),
]
for (const r of ALL) T(r, 'src/components/admin/TeacherChallengePanel.tsx', TCP.map(function (x) { return { old: x.old, nw: x.nw, n: x.n } }))

// ---------- التنفيذ ----------
for (const t of tasks) {
  const fp = path.join(BASE, t.repo, t.file)
  let content
  try { content = fs.readFileSync(fp, 'utf8') } catch (e) {
    stats.miss.push(t.repo + ' ' + t.file + ' :: FILE NOT FOUND')
    continue
  }
  let changed = false
  for (const rp of t.repls) {
    const parts = content.split(rp.old)
    const count = parts.length - 1
    if (count === 0) { stats.miss.push(t.repo + ' ' + t.file + ' :: NOT FOUND :: ' + rp.old.slice(0, 70).replace(/\n/g, '⏎')) ; continue }
    if (rp.n !== null && count !== rp.n) { stats.miss.push(t.repo + ' ' + t.file + ' :: COUNT ' + count + ' != ' + rp.n + ' :: ' + rp.old.slice(0, 70).replace(/\n/g, '⏎')) ; continue }
    content = parts.join(rp.nw)
    stats.applied += count
    changed = true
  }
  if (changed) { fs.writeFileSync(fp, content); stats.ok++ }
}
console.log('=== Z-14 runner ===')
console.log('files changed:', stats.ok, '| replacements applied:', stats.applied)
if (stats.miss.length) {
  console.log('--- MISSES (' + stats.miss.length + ') ---')
  for (const m of stats.miss) console.log('  ' + m)
} else {
  console.log('no misses — all replacements exact')
}
