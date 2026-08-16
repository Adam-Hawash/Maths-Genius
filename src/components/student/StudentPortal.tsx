'use client'

import { useAppStore } from '@/stores/app-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
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
          fetch(`/api/homework?grade=${encodeURIComponent(grade)}`).then(r => r.json()),
          fetch(`/api/exams?grade=${encodeURIComponent(grade)}`).then(r => r.json()),
          fetch(`/api/announcements?grade=${encodeURIComponent(grade)}`).then(r => r.json()),
          fetch(`/api/exam-results?studentId=${encodeURIComponent(studentId)}`).then(r => r.json()),
          fetch(`/api/activities?studentId=${encodeURIComponent(studentId)}`).then(r => r.json()).catch(() => null),
        ])
        if (cancelled) return
        const videos = videosRes.videos || []
        const homework = hwRes.homework || []
        const exams = examsRes.exams || []
        const announcements = annRes.announcements || []
        const examResults = resultsRes.results || []
        const watchedIds = new Set<string>((resultsRes.watchedVideoIds || []).map((v: any) => v.videoId))
        setDashboardData({ videos, homework, exams, announcements, examResults, watchedIds })
      } catch (err) {
        console.error('Failed to load dashboard:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [grade, studentId])

  useEffect(() => {
    if (!loading && dashboardData) {
      const timer = setTimeout(() => setShowFullPortal(true), 300)
      return () => clearTimeout(timer)
    }
  }, [loading, dashboardData])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">جاري تحميل البوابة...</p>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <GraduationCap className="h-16 w-16 text-muted-foreground/30" />
        <p className="text-muted-foreground">لم يتم العثور على بيانات الطالب</p>
        <Button variant="outline" onClick={logout}>تسجيل خروج</Button>
      </div>
    )
  }

  const initialData = dashboardData

  if (!showFullPortal) {
    const totalVideos = initialData.videos.length
    const watchedCount = initialData.watchedIds.size
    const progress = totalVideos > 0 ? Math.round((watchedCount / totalVideos) * 100) : 0
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{currentStudent?.name}</h2>
              <p className="text-xs text-muted-foreground">{currentStudent?.grade} — {currentStudent?.phone}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="text-destructive">
            <LogOut className="h-4 w-4 ml-1" /> خروج
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Video, label: 'الدروس', value: totalVideos, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { icon: CheckCircle2, label: 'تمت المشاهدة', value: watchedCount, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { icon: Target, label: 'التقدم', value: progress + '%', color: 'text-purple-500', bg: 'bg-purple-500/10' },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl p-3 border border-border/50 text-center">
              <div className={`h-9 w-9 mx-auto rounded-lg ${stat.bg} flex items-center justify-center mb-1.5`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">تقدم المشاهدة</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'videos', label: 'الدروس', icon: Video },
    { id: 'homework', label: 'الواجبات', icon: ClipboardList },
    { id: 'exams', label: 'الامتحانات', icon: FileText },
    { id: 'announcements', label: 'الإعلانات', icon: Megaphone },
    { id: 'discussions', label: 'المناقشات', icon: MessageSquare },
  ] as const

  const [activeTab, setActiveTab] = useState<string>('videos')

  return (
    <div className="space-y-4">
      {/* Student Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-sm">{currentStudent?.name}</h2>
            <p className="text-[10px] text-muted-foreground">{currentStudent?.grade}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} className="h-9 w-9 text-destructive">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[40vh]">
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
            <div className="relative aspect-video bg-black">
              {ytId ? (
                <div className="video-protected w-full h-full" onClick={() => trackVideoWatch(video.id)}>
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}?modestbranding=1&rel=0&playsinline=1&controls=0&showinfo=0&iv_load_policy=3`}
                    title={video.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              ) : isVideoFile ? (
                <CustomVideoPlayer
                  videoId={video.id}
                  src={video.filePath}
                  poster={thumbSrc || undefined}
                  studentId={studentId}
                  onWatch={() => {
                    trackVideoWatch(video.id)
                    setLocalWatched(prev => new Set([...prev, video.id]))
                  }}
                />
              ) : thumbSrc ? (
                <div className="w-full h-full relative">
                  <Image src={thumbSrc} alt={video.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" unoptimized loading="eager" fetchPriority="high" />
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
              {isWatched && (
                <div className="absolute top-2 right-2 z-30">
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

/* ========== CUSTOM VIDEO PLAYER (لا يوجد 3-dot menu / لا يوجد تحميل) ========== */
function CustomVideoPlayer({ videoId, src, poster, studentId, onWatch }: {
  videoId: string
  src: string
  poster?: string
  studentId: string
  onWatch: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const hideTimerRef = useRef<any>(null)

  useEffect(() => {
    if (playing) {
      hideTimerRef.current = setTimeout(() => setShowControls(false), 3000)
    } else {
      setShowControls(true)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current) }
  }, [playing, showControls])

  var togglePlay = function(e?: React.MouseEvent | React.TouchEvent) {
    if (e) { e.preventDefault(); e.stopPropagation() }
    var v = videoRef.current
    if (!v) return
    if (v.paused) { v.play().catch(function(){}) } else { v.pause() }
  }

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
    var v = videoRef.current
    if (!v) return
    v.play().then(function() {
      var vv = v as any
      if (vv.webkitEnterFullscreen) { vv.webkitEnterFullscreen() }
      else if (vv.parentElement && vv.parentElement.requestFullscreen) { vv.parentElement.requestFullscreen().catch(function(){}) }
      else if (vv.requestFullscreen) { vv.requestFullscreen().catch(function(){}) }
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

        <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-t from-black/80 to-transparent">
          <button
            className="w-9 h-9 flex items-center justify-center text-white hover:text-primary transition-colors shrink-0"
            onClick={togglePlay}
            onTouchEnd={function(e) { e.preventDefault(); e.stopPropagation(); togglePlay() }}
          >
            {playing ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>

          <span className="text-white text-xs tabular-nums" dir="ltr">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          <button
            className="w-9 h-9 flex items-center justify-center text-white hover:text-primary transition-colors shrink-0"
            onClick={handleFullscreen}
            onTouchEnd={function(e) { e.preventDefault(); e.stopPropagation(); handleFullscreen(e) }}
            aria-label="تكبير"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
            </svg>
          </button>
        </div>
      </div>
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

  return (
    <div className="space-y-3">
      {exams.map((exam) => {
        const examResult = results.find(r => r.examId === exam.id)
        let hasMCQ = false

        const startExam = async () => {
          try {
            const res = await fetch(`/api/exams/${exam.id}`)
            const data = await res.json()
            if (data.questions && data.questions.length > 0) {
              hasMCQ = true
              setExamQuestions(data.questions)
              setTakingExam(exam.id)
            } else {
              toast.info('لا توجد أسئلة لهذا الامتحان')
            }
          } catch { toast.error('خطأ في تحميل الامتحان') }
        }

        return (
          <Card key={exam.id} className={examResult ? (examResult.passed ? 'border-emerald-500/30' : 'border-destructive/30') : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h3 className="font-semibold text-sm">{exam.title}</h3>
                    {exam.description && <p className="text-xs text-muted-foreground line-clamp-2">{exam.description}</p>}
                    <p className="text-[10px] text-muted-foreground">{new Date(exam.createdAt).toLocaleDateString('ar-EG')}</p>
                  </div>
                </div>
                {examResult ? (
                  <div className="text-center shrink-0">
                    <div className={`text-lg font-bold ${examResult.passed ? 'text-emerald-500' : 'text-destructive'}`}>
                      {examResult.score}/{examResult.maxScore}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{examResult.passed ? 'ناجح' : 'راسب'}</p>
                  </div>
                ) : (
                  <Button size="sm" onClick={startExam}>ابدأ</Button>
                )}
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
        <Card key={ann.id}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <Megaphone className="h-4 w-4 text-amber-500" />
              </div>
              <div className="min-w-0 space-y-1 flex-1">
                <h3 className="font-semibold text-sm">{ann.title}</h3>
                {ann.content && <p className="text-xs text-muted-foreground leading-relaxed">{ann.content}</p>}
                {ann.filePath && <FileAttachment filePath={ann.filePath} fileType={ann.fileType} />}
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
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetch(`/api/discussions?grade=${encodeURIComponent(grade)}`)
      .then(r => r.json())
      .then(d => setDiscussions(d.discussions || []))
      .catch(() => {})
  }, [grade])

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, studentName, grade, message: newMessage.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setDiscussions(prev => [data.discussion, ...prev])
        setNewMessage('')
      }
    } catch {}
    setSending(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="اكتب سؤالك هنا..."
          className="text-sm"
          disabled={sending}
        />
        <Button size="icon" onClick={sendMessage} disabled={sending || !newMessage.trim()} className="shrink-0">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
      <div className="space-y-3">
        {discussions.length === 0 && <EmptyState message="لا توجد مناقشات بعد" />}
        {discussions.map((d) => {
          const isAdmin = d.authorRole === 'admin'
          return (
            <div key={d.id} className={`flex gap-2.5 ${isAdmin ? 'flex-row-reverse' : ''}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold ${isAdmin ? 'bg-primary' : 'bg-muted-foreground'}`}>
                {isAdmin ? 'م' : (d.studentName || 'ط')[0]}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${isAdmin ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <p className="text-xs font-medium mb-0.5 opacity-70">{isAdmin ? 'المعلم' : (d.studentName || 'طالب')}</p>
                <p className="text-sm leading-relaxed">{d.message}</p>
                <p className="text-[10px] opacity-50 mt-1">{new Date(d.createdAt).toLocaleDateString('ar-EG')}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ========== FILE ATTACHMENT ========== */
function FileAttachment({ filePath, fileType }: { filePath: string; fileType: string }) {
  const isPDF = fileType?.startsWith('application/pdf') || filePath?.endsWith('.pdf')
  const isImage = fileType?.startsWith('image/') || filePath?.match(/\.(jpg|jpeg|png|gif|webp)$/i)

  return (
    <div className="shrink-0">
      {isPDF ? (
        <a href={filePath} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors">
          <FileText className="h-3.5 w-3.5" />
          <span className="text-[11px] font-medium">PDF</span>
        </a>
      ) : isImage ? (
        <div className="h-10 w-10 rounded-lg overflow-hidden">
          <Image src={filePath} alt="مرفق" width={40} height={40} className="object-cover w-full h-full" unoptimized />
        </div>
      ) : (
        <a href={filePath} download className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
          <FileDown className="h-3.5 w-3.5" />
          <span className="text-[11px]">تحميل</span>
        </a>
      )}
    </div>
  )
}

/* ========== EMPTY STATE ========== */
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <BookOpen className="h-7 w-7 text-muted-foreground/40" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
