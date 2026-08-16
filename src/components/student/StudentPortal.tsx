'use client'

import { useAppStore } from '@/stores/app-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Video, ClipboardList, FileText, Megaphone, MessageSquare, Send,
  LogOut, Loader2, FileDown, Bell, PlayCircle, CheckCircle2,
  BookOpen, Target, TrendingUp, GraduationCap, ChevronLeft, ExternalLink,
  User, Phone, Award,
} from 'lucide-react'
import { useState, useEffect, useRef, useMemo } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import type { Video as VideoType, Homework, Exam, Announcement, Discussion, ExamResult } from '@/stores/app-store'

export function StudentPortal() {
  const { currentStudent, logout } = useAppStore()
  const [dashboardData, setDashboardData] = useState<{
    videos: VideoType[]
    homework: Homework[]
    exams: Exam[]
    announcements: Announcement[]
    examResults: ExamResult[]
    watchedIds: Set<string>
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
        const videos = videosRes.videos || []
        const watchedIds = new Set((actRes.activities || []).map((a: any) => a.details?.replace('Watched: ', '')))
        setDashboardData({
          videos,
          homework: hwRes.homework || [],
          exams: examsRes.exams || [],
          announcements: annRes.announcements || [],
          examResults: resultsRes.results || [],
          watchedIds,
        })
      } catch { /* silent */ }
      if (!cancelled) setLoading(false)
    })()
    return () => { cancelled = true }
  }, [grade, studentId])

  const stats = useMemo(() => {
    if (!dashboardData) return { completedLessons: 0, pendingHomework: 0, lastScore: null, progress: 0, lastVideo: null, upcomingTasks: [] as any[] }
    const { videos, homework, exams, examResults, watchedIds, announcements } = dashboardData
    const completedLessons = watchedIds.size
    const pendingHomework = homework.length
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
              مرحباً، {currentStudent?.name} 👋
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
                <h2 className="font-bold text-lg">متابعة التعلم</h2>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {stats.lastVideo.thumbnail ? (
                  <div className="w-full sm:w-40 aspect-video rounded-lg overflow-hidden bg-muted shrink-0 relative">
                    <ImageWithLoader src={stats.lastVideo.thumbnail} alt="" fill className="object-cover" sizes="300px" unoptimized />
                  </div>
                ) : stats.lastVideo.filePath ? (
                  <div className="w-full sm:w-40 aspect-video rounded-lg overflow-hidden bg-black/80 flex items-center justify-center shrink-0">
                    <Video className="h-10 w-10 text-white/60" />
                  </div>
                ) : null}
                <div className="flex-1 min-w-0 space-y-2">
                  <p className="font-semibold truncate">{stats.lastVideo.title}</p>
                  <p className="text-sm text-muted-foreground">{stats.lastVideo.grade}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 max-w-[200px]">
                      <Progress value={stats.progress} className="h-1.5" />
                    </div>
                    <span className="text-xs text-muted-foreground">{stats.progress}% مشاهدة</span>
                  </div>
                  <Button size="sm" className="mt-1" onClick={() => setShowFullPortal(true)}>
                    متابعة <ChevronLeft className="h-4 w-4 mr-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Tasks */}
        <Card className="mb-8">
          <CardContent className="p-4 sm:p-6">
            <h2 className="font-bold text-lg mb-4">المهام القادمة</h2>
            <div className="space-y-3">
              {stats.upcomingTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">لا توجد مهام قادمة 🎉</p>
              ) : (
                stats.upcomingTasks.map((task, i) => {
                  const Icon = task.icon
                  const typeLabels: Record<string, string> = { homework: 'واجب', exam: 'Quiz', lesson: 'درس جديد', important: 'مهم' }
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${task.color} bg-current/10`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">{typeLabels[task.type] || task.type}</Badge>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Notifications */}
        {dashboardData && dashboardData.announcements.length > 0 && (
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="h-5 w-5 text-primary" />
                <h2 className="font-bold">إشعارات مهمة</h2>
                <Badge variant="destructive" className="text-[10px]">{dashboardData.announcements.length} جديد</Badge>
              </div>
              <div className="space-y-2">
                {dashboardData.announcements.slice(0, 3).map((ann, i) => (
                  <div key={ann.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <Megaphone className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{ann.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{ann.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Browse All Button */}
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={() => setShowFullPortal(true)} className="gap-2">
            <BookOpen className="h-4 w-4" />
            تصفح جميع الدروس والمحتوى
          </Button>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xl font-bold truncate">{value}</p>
          <p className="text-xs text-muted-foreground truncate">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

/* ========== FULL PORTAL (all tabs) ========== */
function FullPortal({ initialData, onBack }: { initialData: PortalData; onBack: () => void }) {
  return <FullPortalContent initialData={initialData} onBack={onBack} />
}

type PortalData = {
  videos: VideoType[]
  homework: Homework[]
  exams: Exam[]
  announcements: Announcement[]
  examResults: ExamResult[]
  watchedIds: Set<string>
}

function FullPortalContent({ initialData, onBack }: { initialData: PortalData; onBack: () => void }) {
  const { currentStudent } = useAppStore()
  const grade = currentStudent?.grade || ''
  const studentId = currentStudent?.id || ''
  const [activeTab, setActiveTab] = useState('videos')

  return (
    <div className="flex-1 py-6 px-4 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={onBack}><ChevronLeft className="h-4 w-4 mr-1" />الرئيسية</Button>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={useAppStore.getState().logout}>
            <LogOut className="h-4 w-4 ml-1" />خروج
          </Button>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-1 flex-wrap bg-muted/50 p-1 rounded-lg mb-6">
          {[
            { key: 'videos', icon: Video, label: 'الدروس' },
            { key: 'homework', icon: ClipboardList, label: 'الواجبات' },
            { key: 'exams', icon: FileText, label: 'الامتحانات' },
            { key: 'announcements', icon: Megaphone, label: 'الإعلانات' },
            { key: 'discussions', icon: MessageSquare, label: 'النقاشات' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'videos' && <VideosTab videos={initialData.videos} watchedIds={initialData.watchedIds} studentId={studentId} />}
        {activeTab === 'homework' && <HomeworkTab homework={initialData.homework} />}
        {activeTab === 'exams' && <ExamsTab exams={initialData.exams} results={initialData.examResults} studentId={studentId} />}
        {activeTab === 'announcements' && <AnnouncementsTab announcements={initialData.announcements} />}
        {activeTab === 'discussions' && <DiscussionsTab grade={grade} studentId={studentId} studentName={currentStudent?.name || ''} />}
      </div>
    </div>
  )
}

/* ========== VIDEOS TAB ========== */
function VideosTab({ videos, watchedIds, studentId }: { videos: VideoType[]; watchedIds: Set<string>; studentId: string }) {
  const [localWatched, setLocalWatched] = useState(watchedIds)

  const trackVideoWatch = (videoId: string) => {
    if (!studentId || localWatched.has(videoId)) return
    setLocalWatched(prev => new Set([...prev, videoId]))
    fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, action: 'watched_video', details: `Watched: ${videoId}` }),
    }).catch(() => {})
  }

  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/)
    return match ? match[1] : null
  }

  const getYouTubeThumbnail = (url: string) => {
    const id = getYouTubeId(url)
    return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null
  }

  if (videos.length === 0) return <EmptyState message="لا توجد دروس حالياً" />

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {videos.map((video) => {
        const ytId = getYouTubeId(video.url)
        const isVideoFile = video.filePath && (video.fileType?.startsWith('video/') || video.filePath.match(/\.(mp4|webm|mov|avi)$/i))
        const isWatched = localWatched.has(video.id)
        const thumbSrc = video.thumbnail || getYouTubeThumbnail(video.url) || null

        return (
          <Card key={video.id} className={`overflow-hidden transition-all ${isWatched ? 'border-emerald-500/30' : ''}`}>
            {/* Thumbnail / Video Area */}
            <div className="relative aspect-video bg-black">
                            {ytId ? (
                <div
                  className="video-protected w-full h-full relative"
                  onClick={function() {
                    trackVideoWatch(video.id)
                    var el = (function() {
                      var e = document.querySelector('[data-fs-video="' + video.id + '"]')
                      return e || null
                    })()
                    if (el) {
                      el.requestFullscreen && el.requestFullscreen().catch(function(){})
                    }
                  }}
                >
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}?modestbranding=1&rel=0&playsinline=1`}
                    title={video.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; fullscreen"
                    allowFullScreen
                    loading="lazy"
                  />
                  {/* Exit fullscreen button */}
                  <button
                    className="absolute top-2 left-2 w-10 h-10 rounded-full bg-black/70 text-white flex items-center justify-center z-20 hidden"
                    data-fs-close={video.id}
                    onClick={function(e) {
                      e.stopPropagation()
                      document.exitFullscreen && document.exitFullscreen().catch(function(){})
                    }}
                  >
                    ✕
                  </button>
                  {/* Block YouTube 3-dot menu on mobile */}
                  <div className="absolute top-0 right-0 w-16 h-12 sm:hidden z-10" />
                </div>
              ) : isVideoFile ? (
                <div className="video-protected w-full h-full" onClick={() => trackVideoWatch(video.id)}>
                  <video
                    controls
                    controlsList="nodownload noremoteplayback"
                    disablePictureInPicture
                    disableRemotePlayback
                    className="w-full h-full"
                    src={video.filePath}
                    onContextMenu={(e) => e.preventDefault()}
                    preload="metadata"
                    poster={thumbSrc || undefined}
                    onTimeUpdate={(e) => {
                      const v = e.currentTarget
                      if (v.duration && studentId) {
                        // Report progress every 5 seconds
                        if (Math.floor(v.currentTime) % 5 === 0 && v.currentTime > 0) {
                          fetch('/api/video-progress', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ studentId, videoId: video.id, watchedSeconds: v.currentTime, totalSeconds: v.duration }),
                          }).catch(() => {})
                        }
                      }
                    }}
                    onEnded={() => {
                      // Mark as completed when video ends
                      if (studentId) {
                        fetch('/api/video-progress', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ studentId, videoId: video.id, watchedSeconds: 999999, totalSeconds: 1 }),
                        }).catch(() => {})
                        setLocalWatched(prev => new Set([...prev, video.id]))
                      }
                    }}
                  >
                    Your browser does not support video.
                  </video>
                </div>
              ) : thumbSrc ? (
                <div className="w-full h-full relative">
                  <ImageWithLoader src={thumbSrc} alt={video.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" unoptimized />
                </div>
              ) : video.url ? (
                <a href={video.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full h-full text-white/70 hover:text-white transition-colors">
                  <ExternalLink className="h-6 w-6" />
                  <span className="text-sm">فتح الرابط</span>
                </a>
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <Video className="h-10 w-10 text-white/30" />
                </div>
              )}
              {/* Watched overlay */}
              {isWatched && (
                <div className="absolute top-2 right-2">
                  <Badge className="bg-emerald-500 text-white text-[10px] gap-1">
                    <CheckCircle2 className="h-3 w-3" /> تمت المشاهدة
                  </Badge>
                </div>
              )}
            </div>
            <CardContent className="p-3">
              <h3 className="font-semibold text-sm truncate">{video.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{new Date(video.createdAt).toLocaleDateString('ar-EG')}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

/* ========== HOMEWORK TAB ========== */
function HomeworkTab({ homework }: { homework: Homework[] }) {
  if (homework.length === 0) return <EmptyState message="لا توجد واجبات حالياً" />
  return (
    <div className="space-y-3">
      {homework.map((hw) => (
        <Card key={hw.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <ClipboardList className="h-4 w-4 text-blue-500" />
                </div>
                <div className="min-w-0 space-y-1">
                  <h3 className="font-semibold text-sm">{hw.title}</h3>
                  {hw.content && <p className="text-xs text-muted-foreground line-clamp-2">{hw.content}</p>}
                  <p className="text-[10px] text-muted-foreground">{new Date(hw.createdAt).toLocaleDateString('ar-EG')}</p>
                </div>
              </div>
              {hw.filePath && <FileAttachment filePath={hw.filePath} fileType={hw.fileType} />}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/* ========== EXAMS TAB ========== */
function ExamsTab({ exams, results, studentId }: { exams: Exam[]; results: ExamResult[]; studentId: string }) {
  const [takingExam, setTakingExam] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [examQuestions, setExamQuestions] = useState<any[]>([])

  if (exams.length === 0) return <EmptyState message="لا توجد امتحانات حالياً" />

  // Exam Taking Mode
  if (takingExam) {
    const exam = exams.find(e => e.id === takingExam)
    if (!exam || examQuestions.length === 0) {
      setTakingExam(null)
      return null
    }
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">{exam.title}</h3>
          <Button variant="outline" size="sm" onClick={() => { setTakingExam(null); setAnswers({}); setExamQuestions([]) }}>رجوع</Button>
        </div>
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
          disabled={Object.keys(answers).length < examQuestions.length || submitting}
          onClick={async () => {
            setSubmitting(true)
            try {
              const res = await fetch('/api/exams/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId, examId: takingExam, answers }),
              })
              const data = await res.json()
              if (res.ok) {
                toast.success(`الدرجة: ${data.result.score}/${data.result.maxScore} ${data.passed ? '✅ ناجح' : '❌ راسب'}`)
                setTakingExam(null); setAnswers({}); setExamQuestions([])
                // Refresh the page data
                window.location.reload()
              } else {
                toast.error(data.error || 'خطأ في التقديم')
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
                          setExamQuestions(parsed)
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
    } catch { toast.error('خطأ في تحميل النقاشات') }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/discussions?grade=${encodeURIComponent(grade)}&pageSize=100`)
        const data = await res.json()
        if (!cancelled) setItems(data.discussions || [])
      } catch { if (!cancelled) toast.error('خطأ في تحميل النقاشات') }
      if (!cancelled) setLoading(false)
    })()
    return () => { cancelled = true }
  }, [grade])

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [items])

  const handleSend = async () => {
    if (!newMessage.trim()) return
    setSending(true)
    try {
      await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, studentName: currentStudent?.name || studentName, grade, content: newMessage.trim(), isAdminReply: false }),
      })
      setNewMessage('')
      fetchDiscussions()
      toast.success('تم إرسال رسالتك')
    } catch { toast.error('خطأ في إرسال الرسالة') }
    setSending(false)
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="اكتب رسالتك أو سؤالك هنا..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={sending || !newMessage.trim()} size="icon">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState message="ابدأ النقاش! اكتب أول رسالة" />
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
          {items.map((d) => {
            const isMe = d.studentId === (currentStudent?.id || studentId)
            const isAdmin = d.isAdminReply
            return (
              <div key={d.id} className={`flex ${isAdmin ? 'justify-start' : isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  isAdmin ? 'bg-primary/15 dark:bg-primary/20 border border-primary/20 rounded-bl-md' :
                  isMe ? 'bg-primary text-primary-foreground rounded-bl-md' :
                  'bg-muted rounded-br-md'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`text-xs font-medium ${isAdmin ? 'text-primary' : isMe ? 'opacity-75' : 'text-foreground'}`}>{d.studentName}</p>
                    {isAdmin && <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/30 text-primary">المعلم</Badge>}
                  </div>
                  <p className="text-sm leading-relaxed">{d.content}</p>
                  <p className={`text-[10px] mt-1 ${isAdmin ? 'text-primary/60' : isMe ? 'opacity-60' : 'text-muted-foreground'}`}>{new Date(d.createdAt).toLocaleString('ar-EG')}</p>
                </div>
              </div>
            )
          })}
          <div ref={chatEndRef} />
        </div>
      )}
    </div>
  )
}

/* ========== SHARED COMPONENTS ========== */
function FileAttachment({ filePath, fileType }: { filePath: string; fileType: string }) {
  const isImage = fileType?.startsWith('image/')
  const isPdf = fileType === 'application/pdf'
  if (isImage) {
    return <ImageWithLoader src={filePath} alt="Attachment" width={48} height={48} className="max-h-12 rounded-lg border" unoptimized />
  }
  return (
    <a href={filePath} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs shrink-0">
      <FileDown className="h-4 w-4" />
      {isPdf ? 'PDF' : 'ملف'}
    </a>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <MessageSquare className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  )
}

/* ========== IMAGE WITH LOADER ========== */
function ImageWithLoader(props: React.ComponentProps<typeof Image>) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      <Image
        {...props}
        onLoad={() => setLoaded(true)}
        className={`${props.className || ''} ${!loaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
      />
    </div>
  )
}
