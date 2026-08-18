'use client'

import { useAppStore } from '@/stores/app-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Video, ClipboardList, FileText, Megaphone, MessageSquare, Send,
  LogOut, Loader2, FileDown, Bell, PlayCircle, CheckCircle2,
  BookOpen, Target, TrendingUp, GraduationCap, ChevronLeft, ExternalLink,
  User, Phone, Award, Maximize, Minimize, CreditCard, Lock, X, Image as ImageIcon
} from 'lucide-react'
import { useState, useEffect, useRef, useMemo } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import type { Video as VideoType, Homework, Exam, Announcement, Discussion, ExamResult, HomeworkResult } from '@/stores/app-store'

/* ========== SHUFFLE UTILITY ========== */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function StudentPortal() {
  const { currentStudent, logout, setView } = useAppStore()
  const [dashboardData, setDashboardData] = useState<{
    videos: VideoType[]
    homework: Homework[]
    exams: Exam[]
    announcements: Announcement[]
    examResults: ExamResult[]
    homeworkResults: HomeworkResult[]
    watchedIds: Set<string>
    videoAccessIds: Set<string>
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFullPortal, setShowFullPortal] = useState(false)

  const grade = currentStudent?.grade || ''
  const studentId = currentStudent?.id || ''

  useEffect(() => {
    if (!grade || !studentId) return
    let cancelled = false
    ;(async () => {
      try {
        const [videosRes, hwRes, examsRes, annRes, resultsRes, actRes] = await Promise.all([
          fetch(`/api/videos?grade=${encodeURIComponent(grade)}&pageSize=100`).then(r => r.json()),
          fetch(`/api/homework?grade=${encodeURIComponent(grade)}&pageSize=50`).then(r => r.json()),
          fetch(`/api/exams?grade=${encodeURIComponent(grade)}&pageSize=50`).then(r => r.json()),
          fetch(`/api/announcements?grade=${encodeURIComponent(grade)}&pageSize=10`).then(r => r.json()),
          fetch(`/api/exam-results?grade=${encodeURIComponent(grade)}`).then(r => r.json()),
          fetch(`/api/activities?studentId=${studentId}&action=watched_video&pageSize=200`).then(r => r.json()),
        ])
        if (cancelled) return

        // Fetch homework results
        let homeworkResults: HomeworkResult[] = []
        try {
          const hwResultsPromises = (hwRes.homework || []).map((hw: any) =>
            fetch(`/api/homework/submit?homeworkId=${hw.id}`).then(r => r.json()).catch(() => ({ results: [] }))
          )
          const hwResultsArr = await Promise.all(hwResultsPromises)
          hwResultsArr.forEach((data: any) => {
            const myResults = (data.results || []).filter((r: any) => r.studentId === studentId)
            homeworkResults.push(...myResults)
          })
        } catch {}

        // Fetch video access
        let videoAccessIds = new Set<string>()
        try {
          const accessRes = await fetch(`/api/video-access?studentId=${studentId}`)
          const accessData = await accessRes.json()
          if (accessData.accesses) {
            videoAccessIds = new Set(accessData.accesses.map((a: any) => a.videoId))
          }
        } catch {}

        const videos = videosRes.videos || []
        const watchedIds = new Set<string>((actRes.activities || []).map((a: any) => a.details?.replace('Watched: ', '')))
        setDashboardData({
          videos,
          homework: hwRes.homework || [],
          exams: examsRes.exams || [],
          announcements: annRes.announcements || [],
          examResults: resultsRes.results || [],
          homeworkResults,
          watchedIds,
          videoAccessIds,
        })
      } catch { /* silent */ }
      if (!cancelled) setLoading(false)
    })()
    return () => { cancelled = true }
  }, [grade, studentId])

  const stats = useMemo(() => {
    if (!dashboardData) return { completedLessons: 0, pendingHomework: 0, lastScore: null, progress: 0, lastVideo: null, upcomingTasks: [] as any[] }
    const { videos, homework, exams, examResults, watchedIds, announcements, homeworkResults } = dashboardData
    const completedLessons = watchedIds.size
    const submittedHwIds = new Set(homeworkResults.map(r => r.homeworkId))
    const pendingHomework = homework.filter(h => !submittedHwIds.has(h.id)).length
    const lastScore = examResults.length > 0 ? examResults[0] : null
    const progress = videos.length > 0 ? Math.round((watchedIds.size / videos.length) * 100) : 0
    const lastVideo = videos.find(v => !watchedIds.has(v.id)) || videos[0] || null
    const upcomingTasks: any[] = []
    homework.slice(0, 2).forEach(hw => upcomingTasks.push({ type: 'homework', title: hw.title, icon: ClipboardList, color: 'text-blue-500' }))
    exams.slice(0, 2).forEach(ex => upcomingTasks.push({ type: 'exam', title: ex.title, icon: FileText, color: 'text-orange-500' }))
    if (lastVideo && !watchedIds.has(lastVideo.id)) upcomingTasks.push({ type: 'lesson', title: lastVideo.title, icon: Video, color: 'text-purple-500' })
    if (announcements.length > 0) upcomingTasks.push({ type: 'important', title: announcements[0].title, icon: Bell, color: 'text-red-500' })
    return { completedLessons, pendingHomework, lastScore, progress, lastVideo, upcomingTasks: upcomingTasks.slice(0, 4) }
  }, [dashboardData])

  if (loading) return (
    <div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  )

  if (showFullPortal) {
    return <FullPortal initialData={dashboardData!} onBack={() => setShowFullPortal(false)} />
  }

  return (
    <div className="flex-1 py-6 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl">
        {/* Welcome Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold">
              مرحباً، {currentStudent?.name}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <GraduationCap className="h-4 w-4" />
              <span>{grade}</span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 ml-1" />
            خروج
          </Button>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
          <StatCard icon={CheckCircle2} label="الدروس المكتملة" value={stats.completedLessons} color="text-emerald-500 bg-emerald-500/10" />
          <StatCard icon={ClipboardList} label="الواجبات المطلوبة" value={stats.pendingHomework} color="text-blue-500 bg-blue-500/10" />
          <StatCard icon={Target} label="آخر درجة" value={stats.lastScore ? `${stats.lastScore.score}/${stats.lastScore.maxScore}` : '—'} color="text-orange-500 bg-orange-500/10" />
          <StatCard icon={TrendingUp} label="نسبة التقدم" value={`${stats.progress}%`} color="text-purple-500 bg-purple-500/10" />
        </div>

        {/* Progress Bar */}
        <Card className="mb-8">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">تقدمك في الكورس</span>
              <span className="text-sm text-primary font-bold">{stats.progress}%</span>
            </div>
            <Progress value={stats.progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Continue Learning */}
        {stats.lastVideo && (
          <Card className="mb-8 border-primary/20 bg-gradient-to-l from-primary/5 to-transparent">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-3">
                <PlayCircle className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold">أكمل تعلمك</span>
              </div>
              <p className="font-medium mb-3">{stats.lastVideo.title}</p>
              <Button size="sm" onClick={() => { setShowFullPortal(true); setTimeout(() => useAppStore.getState().setStudentTab('videos'), 100) }}>
                متابعة المشاهدة
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Tasks */}
        {stats.upcomingTasks.length > 0 && (
          <Card className="mb-8">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" />مهام قادمة</h3>
              <div className="space-y-2">
                {stats.upcomingTasks.map((task, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <task.icon className={`h-4 w-4 ${task.color}`} />
                    <span className="text-sm">{task.title}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Button className="w-full" onClick={() => setShowFullPortal(true)}>
          الدخول للبوابة الكاملة
        </Button>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}><Icon className="h-5 w-5" /></div>
        <div><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ message }: { message: string }) {
  return <div className="text-center py-12 text-muted-foreground"><p className="text-sm">{message}</p></div>
}

function FileAttachment({ filePath, fileType }: { filePath: string; fileType: string }) {
  if (!filePath) return null
  const isImage = fileType?.startsWith('image/')
  if (isImage) {
    return <div className="relative w-16 h-12 rounded border overflow-hidden shrink-0"><Image src={filePath} alt="file" fill className="object-cover" sizes="64px" unoptimized /></div>
  }
  return (
    <a href={filePath} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline shrink-0">
      <FileDown className="h-3.5 w-3.5" />فتح الملف
    </a>
  )
}

/* ========== FULL PORTAL ========== */
function FullPortal({ initialData, onBack }: { initialData: any; onBack: () => void }) {
  const { studentTab, setStudentTab, currentStudent } = useAppStore()
  const studentId = currentStudent?.id || ''

  const tabs = [
    { id: 'videos', label: 'الدروس', icon: Video },
    { id: 'homework', label: 'الواجبات', icon: ClipboardList },
    { id: 'exams', label: 'الامتحانات', icon: FileText },
    { id: 'announcements', label: 'الإعلانات', icon: Megaphone },
    { id: 'discussions', label: 'المجتمع', icon: MessageSquare },
    { id: 'payments', label: 'الدفع', icon: CreditCard },
  ]

  return (
    <div className="flex-1 flex flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}><ChevronLeft className="h-5 w-5" /></Button>
            <h2 className="font-bold text-sm sm:text-base">بوابة الطالب</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">{currentStudent?.name}</span>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="sticky top-[57px] z-20 bg-background/95 backdrop-blur border-b px-4">
        <div className="mx-auto max-w-4xl flex gap-1 overflow-x-auto py-2 no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStudentTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                studentTab === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 px-4 py-4 overflow-y-auto">
        <div className="mx-auto max-w-4xl">
          {studentTab === 'videos' && <VideosTab videos={initialData.videos} watchedIds={initialData.watchedIds} videoAccessIds={initialData.videoAccessIds} />}
          {studentTab === 'homework' && <HomeworkTab homework={initialData.homework} studentId={studentId} />}
          {studentTab === 'exams' && <ExamsTab exams={initialData.exams} results={initialData.examResults} studentId={studentId} />}
          {studentTab === 'announcements' && <AnnouncementsTab announcements={initialData.announcements} />}
          {studentTab === 'discussions' && <DiscussionsTab grade={currentStudent?.grade || ''} studentId={studentId} studentName={currentStudent?.name || ''} />}
          {studentTab === 'payments' && <PaymentsTab studentId={studentId} />}
        </div>
      </div>
    </div>
  )
}

/* ========== VIDEOS TAB (with access control) ========== */
function VideosTab({ videos, watchedIds, videoAccessIds }: { videos: VideoType[]; watchedIds: Set<string>; videoAccessIds: Set<string> }) {
  const { currentStudent } = useAppStore()
  const studentId = currentStudent?.id || ''
  const [playingVideo, setPlayingVideo] = useState<VideoType | null>(null)
  const [paymentVideo, setPaymentVideo] = useState<VideoType | null>(null)

  if (playingVideo) {
    const isYouTube = playingVideo.url && !playingVideo.filePath
    const ytId = isYouTube ? (playingVideo.url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/) || [])[1] : null

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm">{playingVideo.title}</h3>
          <Button variant="outline" size="sm" onClick={() => setPlayingVideo(null)}>رجوع</Button>
        </div>
        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
          {isYouTube && ytId ? (
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&controls=0&rel=0&modestbranding=1`}
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          ) : playingVideo.filePath ? (
            <CustomVideoPlayer
              src={playingVideo.filePath}
              poster={playingVideo.thumbnail}
              videoId={playingVideo.id}
              studentId={studentId}
              onWatch={() => { watchedIds.add(playingVideo.id) }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white/30"><Video className="h-12 w-12" /></div>
          )}
        </div>
      </div>
    )
  }

  if (paymentVideo) {
    return (
      <PaymentFlow
        video={paymentVideo}
        studentId={studentId}
        onBack={() => setPaymentVideo(null)}
        onSuccess={() => {
          setPaymentVideo(null)
          // Refresh access
          fetch(`/api/video-access?studentId=${studentId}`).then(r => r.json()).then(data => {
            if (data.accesses) {
              const ids = new Set(data.accesses.map((a: any) => a.videoId))
              videoAccessIds = ids as any // update locally
              // Force re-render by triggering state
              setPaymentVideo(null)
            }
          })
        }}
      />
    )
  }

  if (videos.length === 0) return <EmptyState message="لا توجد فيديوهات حالياً" />

  return (
    <div className="space-y-3">
      {videos.map((v) => {
        const isYouTube = v.url && !v.filePath
        const ytId = isYouTube ? (v.url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/) || [])[1] : null
        const thumb = v.thumbnail || (ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null)
        const isPaid = v.price && v.price > 0
        const hasAccess = !isPaid || videoAccessIds.has(v.id)

        return (
          <Card key={v.id} className={watchedIds.has(v.id) ? 'border-emerald-500/30' : ''}>
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <div
                  className="relative w-28 sm:w-36 aspect-video rounded-lg overflow-hidden bg-black shrink-0 cursor-pointer"
                  onClick={() => {
                    if (!hasAccess) {
                      setPaymentVideo(v)
                      return
                    }
                    setPlayingVideo(v)
                  }}
                >
                  {thumb ? (
                    <Image src={thumb} alt={v.title} fill className="object-cover" sizes="150px" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Video className="h-6 w-6 text-white/30" /></div>
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    {hasAccess ? (
                      <PlayCircle className="h-8 w-8 text-white" />
                    ) : (
                      <Lock className="h-8 w-8 text-white" />
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <h3 className="font-semibold text-sm">{v.title}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">{v.grade}</Badge>
                    {isPaid && !hasAccess && (
                      <Badge className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <Lock className="h-3 w-3 ml-1" />{v.price} جنيه
                      </Badge>
                    )}
                    {hasAccess && isPaid && (
                      <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3 ml-1" />مفتوح
                      </Badge>
                    )}
                    {watchedIds.has(v.id) && (
                      <Badge className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">تمت المشاهدة</Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{new Date(v.createdAt).toLocaleDateString('ar-EG')}</p>
                  <Button
                    size="sm"
                    className="text-xs h-7"
                    variant={hasAccess ? 'default' : 'outline'}
                    onClick={() => {
                      if (!hasAccess) {
                        setPaymentVideo(v)
                        return
                      }
                      setPlayingVideo(v)
                    }}
                  >
                    {hasAccess ? 'مشاهدة' : 'ادفع للمشاهدة'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

/* ========== PAYMENT FLOW ========== */
function PaymentFlow({ video, studentId, onBack, onSuccess }: { video: VideoType; studentId: string; onBack: () => void; onSuccess: () => void }) {
  const [method, setMethod] = useState('')
  const [receipt, setReceipt] = useState<File | null>(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const receiptRef = useRef<HTMLInputElement>(null)

  const methods = [
    { id: 'fawry', label: 'فوري (Fawry)', icon: '💳' },
    { id: 'instapay', label: 'تحويل بنكي / InstaPay', icon: '🏦' },
    { id: 'vodafone_cash', label: 'فودافون كاش', icon: '📱' },
  ]

  const handleSubmit = async () => {
    if (!method) { toast.error('اختر طريقة الدفع'); return }
    if (!receipt) { toast.error('ارفع صورة الوصل'); return }
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('studentId', studentId)
      formData.append('method', method)
      formData.append('amount', String(video.price || 0))
      formData.append('videoId', video.id)
      formData.append('videoTitle', video.title)
      formData.append('note', note)
      formData.append('receipt', receipt)

      const res = await fetch('/api/payments', { method: 'POST', body: formData })
      if (res.ok) {
        toast.success('تم إرسال إيصال الدفع بنجاح! انتظر موافقة الأدمن.')
        useAppStore.getState().setView('student-payment-pending')
      } else {
        const data = await res.json()
        toast.error(data.error || 'خطأ في إرسال الدفع')
      }
    } catch {
      toast.error('خطأ في الاتصال')
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm">الدفع: {video.title}</h3>
        <Button variant="outline" size="sm" onClick={onBack}>رجوع</Button>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">المبلغ المطلوب</p>
          <p className="text-3xl font-bold text-primary mt-1">{video.price || 0} جنيه</p>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">اختر طريقة الدفع</Label>
        {methods.map((m) => (
          <button
            key={m.id}
            onClick={() => setMethod(m.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg border text-sm transition-colors ${
              method === m.id ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border hover:bg-muted/50'
            }`}
          >
            <span className="text-xl">{m.icon}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {/* Receipt Upload */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">ارفع صورة الوصل *</Label>
        <input
          ref={receiptRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setReceipt(e.target.files?.[0] || null)}
        />
        <div
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => receiptRef.current?.click()}
        >
          {receipt ? (
            <div className="space-y-2">
              <div className="relative w-24 h-24 mx-auto rounded-lg overflow-hidden border">
                <Image src={URL.createObjectURL(receipt)} alt="receipt" fill className="object-cover" unoptimized />
              </div>
              <p className="text-xs text-muted-foreground">{receipt.name}</p>
              <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={(e) => { e.stopPropagation(); setReceipt(null) }}>
                <X className="h-3 w-3 ml-1" />إزالة
              </Button>
            </div>
          ) : (
            <>
              <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">اضغط لرفع صورة الوصل</p>
            </>
          )}
        </div>
      </div>

      {/* Note */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">ملاحظات (اختياري)</Label>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="مثال: رقم الفاتورة أو أي تفاصيل" />
      </div>

      <Button
        className="w-full"
        disabled={!method || !receipt || submitting}
        onClick={handleSubmit}
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4 ml-1" />}
        {submitting ? 'جاري الإرسال...' : 'إرسال إيصال الدفع'}
      </Button>
    </div>
  )
}

/* ========== PAYMENTS TAB ========== */
function PaymentsTab({ studentId }: { studentId: string }) {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/my-payments?studentId=${studentId}`)
      .then(r => r.json())
      .then(data => { setPayments(data.payments || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [studentId])

  const methodLabels: Record<string, string> = {
    fawry: 'فوري (Fawry)',
    instapay: 'تحويل بنكي / InstaPay',
    vodafone_cash: 'فودافون كاش',
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
  if (payments.length === 0) return <EmptyState message="لا توجد مدفوعات" />

  return (
    <div className="space-y-3">
      {payments.map((p) => (
        <Card key={p.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5">
                <p className="font-semibold text-sm">{p.videoTitle || 'دفع'}</p>
                <p className="text-xs text-muted-foreground">{methodLabels[p.method] || p.method}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{p.amount} جنيه</span>
                  <Badge className={`text-[10px] ${
                    p.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                    p.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {p.status === 'approved' ? 'مقبول' : p.status === 'rejected' ? 'مرفوض' : 'في الانتظار'}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">{new Date(p.createdAt).toLocaleDateString('ar-EG')}</p>
              </div>
              {p.receiptPath && (
                <a href={p.receiptPath} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                  عرض الوصل
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/* ========== CUSTOM VIDEO PLAYER ========== */
function CustomVideoPlayer({ src, poster, videoId, studentId, onWatch }: { src: string; poster: string; videoId: string; studentId: string; onWatch: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  var controlsTimer = useRef<any>(null)

  var togglePlay = function() {
    var v = videoRef.current
    if (!v) return
    if (v.paused) { v.play().catch(function(){}) } else { v.pause() }
  }

  useEffect(function() {
    var handler = function() {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handler)
    return function() { document.removeEventListener('fullscreenchange', handler) }
  }, [])

  var handleTimeUpdate = function() {
    var v = videoRef.current
    if (!v) return
    setCurrentTime(v.currentTime)
    if (v.buffered.length > 0 && v.duration > 0) {
      setBuffered((v.buffered.end(v.buffered.length - 1) / v.duration) * 100)
    }
    if (v.duration && studentId && Math.floor(v.currentTime) % 5 === 0 && v.currentTime > 0) {
      fetch('/api/video-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, videoId, watchedSeconds: v.currentTime, totalSeconds: v.duration }),
      }).catch(function(){})
    }
  }

  var handleEnded = function() {
    setPlaying(false)
    setShowControls(true)
    if (studentId) {
      fetch('/api/video-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, videoId, watchedSeconds: 999999, totalSeconds: 1 }),
      }).catch(function(){})
      onWatch()
    }
  }

  var handleSeek = function(e: React.MouseEvent | React.TouchEvent) {
    var bar = progressRef.current
    var v = videoRef.current
    if (!bar || !v || !v.duration) return
    var rect = bar.getBoundingClientRect()
    var clientX = 'touches' in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX
    var ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    v.currentTime = ratio * v.duration
  }

  var handleFullscreen = function(e: React.MouseEvent | React.TouchEvent) {
    if (e) { e.preventDefault(); e.stopPropagation() }
    if (document.fullscreenElement) { document.exitFullscreen().catch(function(){}) ; return }
    var v = videoRef.current
    if (!v) return
    v.play().then(function() {
      var vv = v as any
      if (vv.webkitEnterFullscreen) {
        vv.webkitEnterFullscreen()
      } else if (vv.parentElement && vv.parentElement.requestFullscreen) {
        vv.parentElement.requestFullscreen().catch(function(){})
      } else if (vv.requestFullscreen) {
        vv.requestFullscreen().catch(function(){})
      }
    }).catch(function(){})
  }

  var formatTime = function(sec: number) {
    if (!sec || !isFinite(sec)) return '0:00'
    var m = Math.floor(sec / 60)
    var s = Math.floor(sec % 60)
    return m + ':' + String(s).padStart(2, '0')
  }

  var progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      className="video-protected w-full h-full relative select-none"
      onClick={togglePlay}
      onTouchStart={function() { setShowControls(true) }}
      onContextMenu={function(e) { e.preventDefault() }}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        src={src}
        poster={poster}
        preload="metadata"
        playsInline
        disablePictureInPicture
        disableRemotePlayback
        onPlay={function() { setPlaying(true) }}
        onPause={function() { setPlaying(false) }}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={function() { if (videoRef.current) setDuration(videoRef.current.duration) }}
      />

      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-2xl">
            <svg className="h-8 w-8 text-gray-800" style={{ marginLeft: '3px' }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      )}

      <div
        className={
          'absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-300 ' +
          (showControls || !playing ? 'opacity-100' : 'opacity-0 pointer-events-none')
        }
        onClick={function(e) { e.stopPropagation() }}
      >
        <div
          ref={progressRef}
          className="w-full h-1 bg-white/30 cursor-pointer group"
          onClick={handleSeek}
          onTouchEnd={function(e) { e.preventDefault(); e.stopPropagation(); handleSeek(e) }}
        >
          <div className="absolute top-0 left-0 h-full bg-white/40 pointer-events-none" style={{ width: buffered + '%' }} />
          <div className="absolute top-0 left-0 h-full bg-primary group-hover:h-1.5 transition-all pointer-events-none" style={{ width: progressPercent + '%' }} />
        </div>
        <div className="flex items-center gap-1 px-3 py-2 bg-gradient-to-t from-black/80 to-transparent">
          <button className="w-9 h-9 flex items-center justify-center text-white hover:text-primary transition-colors shrink-0" onClick={togglePlay} onTouchEnd={function(e) { e.preventDefault(); e.stopPropagation(); togglePlay() }}>
            {playing ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>
          <span className="text-white text-xs tabular-nums" dir="ltr">{formatTime(currentTime)} / {formatTime(duration)}</span>
          <button className="w-9 h-9 flex items-center justify-center text-white hover:text-primary transition-colors shrink-0" onClick={handleFullscreen} onTouchEnd={function(e) { e.preventDefault(); e.stopPropagation(); handleFullscreen(e) }}>
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ========== HOMEWORK TAB (HIDDEN ANSWERS, SHUFFLED, SERVER-SIDE GRADING) ========== */
function HomeworkTab({ homework, studentId }: { homework: Homework[]; studentId: string }) {
  const [expandedHw, setExpandedHw] = useState<string | null>(null)
  const [hwAnswers, setHwAnswers] = useState<Record<string, Record<number, number>>>({})
  const [hwSubmitted, setHwSubmitted] = useState<Record<string, boolean>>({})
  const [hwResults, setHwResults] = useState<Record<string, { score: number; maxScore: number; details: any[] }>>({})
  const [submitting, setSubmitting] = useState<string | null>(null)

  if (homework.length === 0) return <EmptyState message="لا توجد واجبات حالياً" />
  return (
    <div className="space-y-3">
      {homework.map((hw) => {
        var mcq: any[] = []
        try { if ((hw as any).questions) mcq = JSON.parse((hw as any).questions) } catch {}
        var hasMCQ = Array.isArray(mcq) && mcq.length > 0
        var isExpanded = expandedHw === hw.id
        var isSubmitted = !!hwSubmitted[hw.id]
        var myAnswers = hwAnswers[hw.id] || {}
        var result = hwResults[hw.id]

        // Shuffle questions for display (only once when expanding)
        const [shuffledQuestions, setShuffledQuestions] = useState<any[]>([])
        const [originalIndices, setOriginalIndices] = useState<number[]>([])
        useEffect(() => {
          if (isExpanded && hasMCQ && shuffledQuestions.length === 0) {
            const indices = mcq.map((_, i) => i)
            const shuffled = shuffleArray(indices)
            setOriginalIndices(shuffled)
            setShuffledQuestions(shuffled.map(i => mcq[i]))
          }
        }, [isExpanded, hw.id])

        const handleSubmitHw = async () => {
          if (!hasMCQ || !studentId) return
          setSubmitting(hw.id)
          try {
            // Map shuffled answers back to original indices
            const originalAnswers: Record<number, number> = {}
            Object.keys(myAnswers).forEach(shuffledIdx => {
              const origIdx = originalIndices[parseInt(shuffledIdx)]
              if (origIdx !== undefined) {
                originalAnswers[origIdx] = myAnswers[parseInt(shuffledIdx)]
              }
            })

            const res = await fetch('/api/homework/submit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ studentId, homeworkId: hw.id, answers: originalAnswers }),
            })
            const data = await res.json()
            if (res.ok) {
              setHwSubmitted(prev => ({ ...prev, [hw.id]: true }))
              setHwResults(prev => ({ ...prev, [hw.id]: { score: data.result.score, maxScore: data.result.maxScore, details: data.details || [] } }))
              toast.success('تم تسليم الواجب بنجاح!')
            } else {
              if (data.alreadySubmitted) {
                toast.error('لقد قدمت هذا الواجب بالفعل')
              } else {
                toast.error(data.error || 'خطأ في التقديم')
              }
            }
          } catch { toast.error('خطأ في الاتصال') }
          setSubmitting(null)
        }

        return (
          <Card key={hw.id} className={hasMCQ ? 'cursor-pointer' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3" onClick={hasMCQ ? function() { setExpandedHw(isExpanded ? null : hw.id); if (!isExpanded) { setShuffledQuestions([]); setOriginalIndices([]) } } : undefined}>
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className={"h-9 w-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 " + (hasMCQ ? 'bg-emerald-500/10' : 'bg-blue-500/10')}>
                    <ClipboardList className={"h-4 w-4 " + (hasMCQ ? 'text-emerald-500' : 'text-blue-500')} />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h3 className="font-semibold text-sm">{hw.title}</h3>
                    {hw.content && <p className="text-xs text-muted-foreground line-clamp-2">{hw.content}</p>}
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[10px] text-muted-foreground">{new Date(hw.createdAt).toLocaleDateString('ar-EG')}</p>
                      {hasMCQ && <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-600">{mcq.length} سؤال</Badge>}
                      {isSubmitted && result && <Badge className="text-[10px] bg-emerald-500 text-white">النتيجة: {result.score}/{result.maxScore}</Badge>}
                    </div>
                  </div>
                </div>
                {hw.filePath && !hasMCQ && <FileAttachment filePath={hw.filePath} fileType={hw.fileType} />}
                {hasMCQ && <ChevronLeft className={"h-4 w-4 text-muted-foreground transition-transform shrink-0 mt-1 " + (isExpanded ? 'rotate-90' : '')} />}
              </div>

              {isExpanded && hasMCQ && (
                <div className="mt-4 pt-4 border-t space-y-4">
                  {isSubmitted && result ? (
                    /* RESULTS VIEW - show all questions with correct/wrong */
                    <>
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 mb-4">
                        <p className="text-sm font-bold text-emerald-700">نتيجتك: {result.score} من {result.maxScore} {result.score === result.maxScore ? '— ممتاز!' : ''}</p>
                      </div>
                      {(result.details || []).map((d: any, qi: number) => {
                        const q = mcq[qi]
                        if (!q) return null
                        return (
                          <div key={qi} className="space-y-2">
                            <p className="font-medium text-sm">{qi + 1}. {d.question}</p>
                            <div className="space-y-1.5">
                              {q.options.map((opt: string, oi: number) => {
                                const isCorrect = oi === d.correctAnswer
                                const isMyWrong = oi === d.studentAnswer && !d.correct
                                const isMyCorrect = oi === d.studentAnswer && d.correct
                                return (
                                  <div
                                    key={oi}
                                    className={`w-full text-right p-3 rounded-lg border text-sm ${
                                      isMyCorrect ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 font-medium' :
                                      isMyWrong ? 'border-destructive bg-destructive/10 text-destructive' :
                                      isCorrect ? 'border-emerald-500/50 bg-emerald-500/5 text-emerald-600' :
                                      'border-border'
                                    }`}
                                  >
                                    <span className="ml-2">{String.fromCharCode(65 + oi)})</span>{opt}
                                    {isCorrect && <span className="float-left text-emerald-500">✓</span>}
                                    {isMyWrong && <span className="float-left text-destructive">✗</span>}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </>
                  ) : (
                    /* SOLVING VIEW - NO immediate feedback, shuffled order */
                    <>
                      {shuffledQuestions.map((q, si) => (
                        <div key={si} className="space-y-2">
                          <p className="font-medium text-sm">{si + 1}. {q.q}</p>
                          <div className="space-y-1.5">
                            {q.options.map((opt: string, oi: number) => (
                              <button
                                key={oi}
                                disabled={!!submitting}
                                onClick={function() {
                                  setHwAnswers(function(prev) {
                                    var a = { ...prev }
                                    a[hw.id] = { ...(a[hw.id] || {}), [si]: oi }
                                    return a
                                  })
                                }}
                                className={`w-full text-right p-3 rounded-lg border text-sm transition-colors ${
                                  myAnswers[si] === oi ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border hover:bg-muted/50'
                                }`}
                              >
                                <span className="ml-2">{String.fromCharCode(65 + oi)})</span>{opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        onClick={handleSubmitHw}
                        disabled={Object.keys(myAnswers).length === 0 || !!submitting}
                      >
                        {submitting === hw.id ? <Loader2 className="h-4 w-4 animate-spin" : null}
                        {submitting === hw.id ? 'جاري التسليم...' : 'تسليم الإجابات'}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

/* ========== EXAMS TAB (HIDDEN ANSWERS, SHUFFLED, FINAL SCORE) ========== */
function ExamsTab({ exams, results, studentId }: { exams: Exam[]; results: ExamResult[]; studentId: string }) {
  const [takingExam, setTakingExam] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [examQuestions, setExamQuestions] = useState<any[]>([])
  const [showResult, setShowResult] = useState<any>(null)

  if (exams.length === 0) return <EmptyState message="لا توجد امتحانات حالياً" />

  // Result Display after submission
  if (showResult) {
    const exam = exams.find(e => e.id === showResult.examId)
    const allQuestions: any[] = []
    try { if (exam?.questions) { const p = JSON.parse(exam.questions); allQuestions.push(...p) } } catch {}

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">{exam?.title} - النتيجة</h3>
          <Button variant="outline" size="sm" onClick={() => { setShowResult(null); setAnswers({}); setExamQuestions([]) }}>رجوع</Button>
        </div>

        {/* Score Card */}
        <Card className={`border-2 ${showResult.passed ? 'border-emerald-500' : 'border-red-500'}`}>
          <CardContent className="p-6 text-center">
            <p className="text-4xl font-bold mb-2">{showResult.score}/{showResult.maxScore}</p>
            <p className={`text-lg font-semibold ${showResult.passed ? 'text-emerald-600' : 'text-red-600'}`}>
              {showResult.passed ? 'ناجح' : 'راسب'}
            </p>
          </CardContent>
        </Card>

        {/* Per-question review */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">مراجعة الأسئلة</h4>
          {(showResult.details || []).map((d: any, qi: number) => {
            const q = allQuestions[qi]
            if (!q) return null
            return (
              <Card key={qi}>
                <CardContent className="p-4 space-y-3">
                  <p className="font-medium text-sm">{qi + 1}. {d.question}</p>
                  <div className="space-y-1.5">
                    {q.options.map((opt: string, oi: number) => {
                      const isCorrect = oi === d.correctAnswer
                      const isMyWrong = oi === d.studentAnswer && !d.correct
                      const isMyCorrect = oi === d.studentAnswer && d.correct
                      return (
                        <div
                          key={oi}
                          className={`w-full text-right p-3 rounded-lg border text-sm ${
                            isMyCorrect ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 font-medium' :
                            isMyWrong ? 'border-destructive bg-destructive/10 text-destructive' :
                            isCorrect ? 'border-emerald-500/50 bg-emerald-500/5 text-emerald-600' :
                            'border-border'
                          }`}
                        >
                          <span className="ml-2">{String.fromCharCode(65 + oi)})</span>{opt}
                          {isCorrect && <span className="float-left text-emerald-500">✓</span>}
                          {isMyWrong && <span className="float-left text-destructive">✗</span>}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  // Exam Taking Mode - NO feedback during solving
  if (takingExam) {
    const exam = exams.find(e => e.id === takingExam)
    if (!exam || examQuestions.length === 0) {
      setTakingExam(null)
      return null
    }

    const allAnswered = Object.keys(answers).length >= examQuestions.length

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">{exam.title}</h3>
          <Button variant="outline" size="sm" onClick={() => { setTakingExam(null); setAnswers({}); setExamQuestions([]) }}>رجوع</Button>
        </div>
        <p className="text-xs text-muted-foreground">أجب عن جميع الأسئلة ثم اضغط "تقديم الامتحان". لن تظهر النتيجة إلا بعد التقديم.</p>

        {examQuestions.map((q, qi) => (
          <Card key={qi}>
            <CardContent className="p-4 space-y-3">
              <p className="font-medium text-sm">{qi + 1}. {q.q}</p>
              <div className="space-y-2">
                {q.options.map((opt: string, oi: number) => (
                  <button
                    key={oi}
                    onClick={() => setAnswers(prev => ({ ...prev, [qi]: oi }))}
                    className={`w-full text-right p-3 rounded-lg border text-sm transition-colors ${
                      answers[qi] === oi ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <span className="ml-2 font-bold">{String.fromCharCode(65 + oi)}.</span> {opt}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          className="w-full"
          disabled={!allAnswered || submitting}
          onClick={async () => {
            setSubmitting(true)
            try {
              // Map shuffled answers back to original indices
              const originalExam = exam
              let originalMCQ: any[] = []
              try { originalMCQ = JSON.parse((originalExam as any).questions || '[]') } catch {}

              // examQuestions is already shuffled, answers are indexed by shuffled position
              // We need to map back: find where each shuffled question came from
              const originalAnswers: Record<number, number> = {}
              examQuestions.forEach((sq, si) => {
                const origIdx = originalMCQ.findIndex((oq: any) => oq.q === sq.q && oq.correct === sq.correct)
                if (origIdx !== -1 && answers[si] !== undefined) {
                  originalAnswers[origIdx] = answers[si]
                }
              })

              const res = await fetch('/api/exams/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId, examId: takingExam, answers: originalAnswers }),
              })
              const data = await res.json()
              if (res.ok) {
                toast.success('تم تقديم الامتحان بنجاح!')
                setShowResult({
                  examId: takingExam,
                  score: data.result.score,
                  maxScore: data.result.maxScore,
                  passed: data.passed,
                  details: data.details,
                })
                setTakingExam(null)
                setAnswers({})
                setExamQuestions([])
              } else {
                if (data.alreadySubmitted) {
                  toast.error('لقد قدمت هذا الامتحان بالفعل')
                  setTakingExam(null); setAnswers({}); setExamQuestions([])
                } else {
                  toast.error(data.error || 'خطأ في التقديم')
                }
              }
            } catch { toast.error('خطأ في الاتصال') }
            setSubmitting(false)
          }}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : `تقديم الامتحان (${Object.keys(answers).length}/${examQuestions.length})`}
        </Button>
      </div>
    )
  }

  // Exam List Mode
  return (
    <div className="space-y-3">
      {exams.map((exam) => {
        const examResult = results.find(r => r.examId === exam.id)
        let hasMCQ = false
        try { if ((exam as any).questions) { const parsed = JSON.parse((exam as any).questions); hasMCQ = parsed.length > 0 } } catch {}
        return (
          <Card key={exam.id} className={examResult ? 'border-emerald-500/30' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="h-9 w-9 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="h-4 w-4 text-orange-500" />
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <h3 className="font-semibold text-sm">{exam.title}</h3>
                    {examResult ? (
                      <Badge className={`text-xs ${examResult.score >= examResult.maxScore * 0.5 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        الدرجة: {examResult.score}/{examResult.maxScore}
                      </Badge>
                    ) : hasMCQ ? (
                      <Button size="sm" onClick={() => {
                        try {
                          const parsed = JSON.parse((exam as any).questions)
                          // SHUFFLE questions for this student
                          const shuffled = shuffleArray(parsed)
                          setExamQuestions(shuffled)
                          setTakingExam(exam.id)
                          setAnswers({})
                        } catch { toast.error('خطأ في تحميل الأسئلة') }
                      }}>ابدأ الامتحان</Button>
                    ) : (
                      <Badge variant="secondary" className="text-xs">لم يتم بعد</Badge>
                    )}
                    <p className="text-[10px] text-muted-foreground">{new Date(exam.createdAt).toLocaleDateString('ar-EG')}</p>
                  </div>
                </div>
                {exam.filePath && <FileAttachment filePath={exam.filePath} fileType={exam.fileType} />}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

/* ========== ANNOUNCEMENTS TAB ========== */
function AnnouncementsTab({ announcements }: { announcements: Announcement[] }) {
  if (announcements.length === 0) return <EmptyState message="لا توجد إعلانات حالياً" />
  return (
    <div className="space-y-3">
      {announcements.map((ann) => (
        <Card key={ann.id} className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Megaphone className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0 space-y-1">
                <h3 className="font-semibold text-sm">{ann.title}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{ann.content}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(ann.createdAt).toLocaleDateString('ar-EG')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/* ========== DISCUSSIONS TAB ========== */
function DiscussionsTab({ grade, studentId, studentName }: { grade: string; studentId: string; studentName: string }) {
  const { currentStudent } = useAppStore()
  const [items, setItems] = useState<Discussion[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const fetchDiscussions = async () => {
    try {
      const res = await fetch(`/api/discussions?grade=${encodeURIComponent(grade)}&pageSize=100`)
      const data = await res.json()
      setItems(data.discussions || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchDiscussions() }, [grade])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [items])

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return
    setSending(true)
    try {
      await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, studentName, grade, content: newMessage.trim(), isAdminReply: false }),
      })
      setNewMessage('')
      fetchDiscussions()
    } catch { toast.error('خطأ في الإرسال') }
    setSending(false)
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>

  return (
    <div className="flex flex-col h-[60vh]">
      <div className="flex-1 overflow-y-auto space-y-2 mb-3 custom-scrollbar">
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground"><p className="text-sm">ابدأ المحادثة مع الأدمن</p></div>
        ) : items.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isAdminReply ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
              msg.isAdminReply
                ? 'bg-muted rounded-bl-none'
                : 'bg-primary text-primary-foreground rounded-br-none'
            }`}>
              <p className="text-[10px] font-medium mb-0.5 opacity-70">{msg.isAdminReply ? 'الأدمن' : msg.studentName}</p>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p className="text-[9px] opacity-50 mt-0.5">{new Date(msg.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="اكتب رسالة..."
          className="flex-1"
          disabled={sending}
        />
        <Button size="icon" onClick={handleSend} disabled={!newMessage.trim() || sending}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
