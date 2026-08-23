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
  User, Phone, Award, Maximize, Minimize, Lock, X,
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
        const watchedIds = new Set<string>((actRes.activities || []).map((a: any) => a.details?.replace('Watched: ', '')))
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
                    <Image src={stats.lastVideo.thumbnail} alt="" fill className="object-cover" sizes="300px" unoptimized />
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

        {activeTab === 'videos' && <VideosTab videos={initialData.videos} watchedIds={initialData.watchedIds} studentId={studentId} grade={grade} />}
        {activeTab === 'homework' && <HomeworkTab homework={initialData.homework} />}
        {activeTab === 'exams' && <ExamsTab exams={initialData.exams} results={initialData.examResults} studentId={studentId} />}
        {activeTab === 'announcements' && <AnnouncementsTab announcements={initialData.announcements} />}
        {activeTab === 'discussions' && <DiscussionsTab grade={grade} studentId={studentId} studentName={currentStudent?.name || ''} />}
      </div>
    </div>
  )
}

/* ========== VIDEOS TAB ========== */
function VideosTab({ videos, watchedIds, studentId, grade }: { videos: VideoType[]; watchedIds: Set<string>; studentId: string; grade: string }) {
  const { currentStudent, setView, setPendingPaymentVideo } = useAppStore()
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
        const isApprovedFree = currentStudent?.status === 'approved'
        const needsPay = !isApprovedFree && (video.price || 0) > 0

        return (
          <Card key={video.id} className={`overflow-hidden transition-all ${isWatched ? 'border-emerald-500/30' : ''}`}>
            <div className="relative aspect-video bg-black">
              {needsPay ? (
                <div className="w-full h-full relative">
                  {thumbSrc ? (
                    <Image src={thumbSrc} alt={video.title} fill className="object-cover blur-sm" sizes="(max-width: 640px) 100vw, 50vw" unoptimized loading="eager" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-black/80 to-black" />
                  )}
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3 z-20">
                    <div className="h-14 w-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                      <Lock className="h-7 w-7 text-white" />
                    </div>
                    <Badge className="text-lg px-4 py-1.5 bg-amber-500 text-white">
                      {video.price} ج.م
                    </Badge>
                    <Button
                      className="mt-1"
                      onClick={() => {
                        setPendingPaymentVideo({
                          id: video.id,
                          title: video.title,
                          price: video.price || 0,
                          grade: grade,
                        })
                        setView('student-payment')
                      }}
                    >
                      ادفع الآن
                    </Button>
                  </div>
                </div>
              ) : ytId ? (
                /* YouTube: controls=0 يخفي الـ 3-dot menu بالكامل */
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
                /* MP4: كنترولات مخصصة — مفيش controls يعني مفيش 3-dot menu */
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
  const [isFullscreen, setIsFullscreen] = useState(false)
  const hideTimerRef = useRef<any>(null)

  useEffect(() => {
    var onFsChange = function() {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFsChange)
    document.addEventListener('webkitfullscreenchange', onFsChange)
    return function() {
      document.removeEventListener('fullscreenchange', onFsChange)
      document.removeEventListener('webkitfullscreenchange', onFsChange)
    }
  }, [])

  // إخفاء الكنترولات بعد 3 ثواني من التشغيل
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
    // لو Already في fullscreen → خرج
    if (document.fullscreenElement) { document.exitFullscreen().catch(function(){}) ; return }
    if ((document as any).webkitFullscreenElement) { (document as any).webkitExitFullscreen() ; return }
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
      {/* فيديو بدون controls — مفيش 3-dot menu أصلاً */}
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

      {/* أيقونة Play في النصف */}
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-2xl">
            <svg className="h-8 w-8 text-gray-800" style={{ marginLeft: '3px' }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      )}

      {/* شريط الكنترولات السفلي */}
      <div
        className={
          'absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-300 ' +
          (showControls || !playing ? 'opacity-100' : 'opacity-0 pointer-events-none')
        }
        onClick={function(e) { e.stopPropagation() }}
      >
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="w-full h-1 bg-white/30 cursor-pointer group"
          onClick={handleSeek}
          onTouchEnd={function(e) { e.preventDefault(); e.stopPropagation(); handleSeek(e) }}
        >
          <div className="absolute top-0 left-0 h-full bg-white/40 pointer-events-none" style={{ width: buffered + '%' }} />
          <div className="absolute top-0 left-0 h-full bg-primary group-hover:h-1.5 transition-all pointer-events-none" style={{ width: progressPercent + '%' }} />
        </div>

        {/* أزرار الكنترول */}
        <div className="flex items-center gap-1 px-3 py-2 bg-gradient-to-t from-black/80 to-transparent">
          {/* Play / Pause */}
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

          {/* زرار التكبير جنب الوقت */}
          <button
            className="w-9 h-9 flex items-center justify-center text-white hover:text-primary transition-colors shrink-0"
            onClick={handleFullscreen}
            onTouchEnd={function(e) { e.preventDefault(); e.stopPropagation(); handleFullscreen(e) }}
            aria-label="تكبير"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ========== HOMEWORK TAB ========== */


/* ========== HOMEWORK TAB ========== */
function HomeworkTab({ homework }: { homework: Homework[] }) {
  const [expandedHw, setExpandedHw] = useState<string | null>(null)
  const [hwAnswers, setHwAnswers] = useState<Record<string, Record<number, number>>>({})
  const [hwSubmitted, setHwSubmitted] = useState<Record<string, boolean>>({})

  if (homework.length === 0) return <EmptyState message="لا توجد واجبات حالياً" />
  return (
    <div className="space-y-3">
      {homework.map((hw) => {
        var mcq = (hw as any).questions ? JSON.parse((hw as any).questions) : []
        var hasMCQ = Array.isArray(mcq) && mcq.length > 0
        var isExpanded = expandedHw === hw.id
        var isSubmitted = !!hwSubmitted[hw.id]
        var myAnswers = hwAnswers[hw.id] || {}

        // Calculate wrong questions only for submitted homework
        var score = 0
        var wrongQuestions: { question: string; studentAnswer: string; correctAnswer: string }[] = []
        if (isSubmitted && hasMCQ) {
          mcq.forEach(function(q: any, i: number) {
            if (myAnswers[i] === q.correct) {
              score++
            } else {
              var opts = Array.isArray(q.options) ? q.options : []
              wrongQuestions.push({
                question: q.question || '',
                studentAnswer: typeof myAnswers[i] === 'number' && opts[myAnswers[i]] ? String.fromCharCode(65 + myAnswers[i]) + ') ' + opts[myAnswers[i]] : 'لم يتم الإجابة',
                correctAnswer: opts[q.correct] ? String.fromCharCode(65 + q.correct) + ') ' + opts[q.correct] : '',
              })
            }
          })
        }

        return (
          <Card key={hw.id} className={hasMCQ ? 'cursor-pointer' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3" onClick={hasMCQ ? function() { setExpandedHw(isExpanded ? null : hw.id) } : undefined}>
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
                      {isSubmitted && hasMCQ && <Badge className="text-[10px] bg-emerald-500 text-white">النتيجة: {score}/{mcq.length}</Badge>}
                    </div>
                  </div>
                </div>
                {hw.filePath && !hasMCQ && <FileAttachment filePath={hw.filePath} fileType={hw.fileType} />}
                {hasMCQ && <ChevronLeft className={"h-4 w-4 text-muted-foreground transition-transform shrink-0 mt-1 " + (isExpanded ? 'rotate-90' : '')} />}
              </div>

              {isExpanded && hasMCQ && (
                <div className="mt-4 pt-4 border-t space-y-4">
                  {mcq.map(function(q: any, qi: number) {
                    return (
                      <div key={qi} className="space-y-2 rounded-lg p-2">
                        <div className="flex items-start gap-2">
                          <p className="font-medium text-sm flex-1">{qi + 1}. {q.question}</p>
                        </div>
                        <div className="space-y-1.5">
                          {q.options.map(function(opt: string, oi: number) {
                            var isSelected = myAnswers[qi] === oi
                            return (
                              <button
                                key={oi}
                                disabled={isSubmitted}
                                onClick={function() { setHwAnswers(function(prev) { var a = { ...prev }; a[hw.id] = { ...(a[hw.id] || {}), [qi]: oi }; return a }) }}
                                className={"w-full text-right p-3 rounded-lg border text-sm transition-colors " + (
                                  isSelected ? 'border-primary bg-primary/10 text-primary font-medium' :
                                  'border-border hover:bg-muted/50'
                                )}
                              >
                                <span className="ml-2">{String.fromCharCode(65 + oi)})</span>{opt}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                  {!isSubmitted ? (
                    <Button size="sm" onClick={function() { setHwSubmitted(function(prev) { var n = { ...prev }; n[hw.id] = true; return n }) }} disabled={Object.keys(myAnswers).length === 0}>تسليم الإجابات ({Object.keys(myAnswers).length}/{mcq.length})</Button>
                  ) : (
                    <div className={"p-4 rounded-lg border " + (score === mcq.length ? 'bg-emerald-500/10 border-emerald-500/30' : score >= mcq.length * 0.5 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-destructive/10 border-destructive/30')}>
                      <div className="flex items-center justify-between mb-2">
                        <p className={"text-base font-bold " + (score === mcq.length ? 'text-emerald-700' : score >= mcq.length * 0.5 ? 'text-amber-700' : 'text-destructive')}>نتيجتك: {score} من {mcq.length}</p>
                        <Badge className={score === mcq.length ? 'bg-emerald-500 text-white' : score >= mcq.length * 0.5 ? 'bg-amber-500 text-white' : 'bg-destructive text-white'}>{Math.round(score / mcq.length * 100)}%</Badge>
                      </div>
                      {wrongQuestions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-semibold text-destructive">الأسئلة الخاطئة ({wrongQuestions.length}):</p>
                          {wrongQuestions.map(function(wq, wi) {
                            return (
                              <div key={wi} className="p-2 rounded-lg bg-destructive/5 border border-destructive/20 text-xs space-y-1">
                                <p className="font-medium">{wi + 1}. {wq.question}</p>
                                <p className="text-destructive">إجابتك: {wq.studentAnswer}</p>
                                <p className="text-emerald-600">الإجابة الصحيحة: {wq.correctAnswer}</p>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
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


/* ========== EXAMS TAB ========== */
function ExamsTab({ exams, results, studentId }: { exams: Exam[]; results: ExamResult[]; studentId: string }) {
  const [takingExam, setTakingExam] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [examQuestions, setExamQuestions] = useState<any[]>([])
  const [examResult, setExamResult] = useState<any>(null)
  const [submittedExamIds, setSubmittedExamIds] = useState<Set<string>>(new Set())

  // Pre-populate submitted exam IDs from results
  useEffect(function() {
    var ids = new Set<string>()
    results.forEach(function(r) { ids.add(r.examId) })
    setSubmittedExamIds(ids)
  }, [results])

  if (exams.length === 0) return <EmptyState message="لا توجد امتحانات حالياً" />

  // Exam Taking Mode
  if (takingExam) {
    var exam = exams.find(function(e) { return e.id === takingExam })
    if (!exam || examQuestions.length === 0) {
      setTakingExam(null)
      return null
    }

    // Show result card after submission
    if (examResult) {
      var passed = examResult.passed
      var scorePct = examResult.maxScore > 0 ? Math.round(examResult.score / examResult.maxScore * 100) : 0
      return (
        <div className="space-y-4">
          <div className={"p-6 rounded-xl border-2 text-center space-y-4 " + (passed ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-destructive/50 bg-destructive/5')}>
            <div className={"h-16 w-16 rounded-full mx-auto flex items-center justify-center " + (passed ? 'bg-emerald-500/20' : 'bg-destructive/20')}>
              {passed ? <CheckCircle2 className="h-8 w-8 text-emerald-600" /> : <X className="h-8 w-8 text-destructive" />}
            </div>
            <div>
              <h3 className="text-xl font-bold">{exam.title}</h3>
              <p className={"text-3xl font-black mt-2 " + (passed ? 'text-emerald-700' : 'text-destructive')}>{examResult.score}/{examResult.maxScore}</p>
              <Badge className={"mt-2 text-sm px-4 py-1 " + (passed ? 'bg-emerald-500 text-white' : 'bg-destructive text-white')}>{scorePct}% - {passed ? 'ناجح' : 'راسب'}</Badge>
            </div>
            {examResult.wrongQuestions && examResult.wrongQuestions.length > 0 && (
              <div className="text-right space-y-2 mt-4">
                <p className="text-sm font-semibold text-destructive">الأسئلة الخاطئة ({examResult.wrongQuestions.length}):</p>
                {examResult.wrongQuestions.map(function(wq: any, wi: number) {
                  return (
                    <div key={wi} className="p-3 rounded-lg bg-card border text-xs space-y-1">
                      <p className="font-medium">{wi + 1}. {wq.question}</p>
                      <p className="text-destructive">إجابتك: {wq.studentAnswer}</p>
                      <p className="text-emerald-600">الإجابة الصحيحة: {wq.correctAnswer}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <Button variant="outline" className="w-full" onClick={function() { setExamResult(null); setTakingExam(null); setAnswers({}); setExamQuestions([]) }}>
            <ChevronLeft className="h-4 w-4 ml-1" />العودة للامتحانات
          </Button>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">{exam.title}</h3>
          <Button variant="outline" size="sm" onClick={function() { setTakingExam(null); setAnswers({}); setExamQuestions([]) }}>رجوع</Button>
        </div>
        {examQuestions.map(function(q, qi) {
          return (
            <Card key={qi}>
              <CardContent className="p-4 space-y-3">
                <p className="font-medium text-sm">{qi + 1}. {q.question || q.q}</p>
                <div className="space-y-2">
                  {q.options.map(function(opt: string, oi: number) {
                    return (
                      <button
                        key={oi}
                        onClick={function() { setAnswers(function(prev) { var a = { ...prev }; a[qi] = oi; return a }) }}
                        className={"w-full text-right p-3 rounded-lg border text-sm transition-colors " + (
                          answers[qi] === oi ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border hover:bg-muted/50'
                        )}
                      >
                        <span className="ml-2 font-bold">{String.fromCharCode(65 + oi)}.</span> {opt}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
        <Button
          className="w-full"
          disabled={Object.keys(answers).length < examQuestions.length || submitting}
          onClick={async function() {
            setSubmitting(true)
            try {
              const res = await fetch('/api/exams/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId: studentId, examId: takingExam, answers: answers }),
              })
              const data = await res.json()
              if (res.ok) {
                setExamResult(data.result)
                setSubmittedExamIds(function(prev) { var n = new Set(prev); n.add(takingExam); return n })
                toast.success('تم تسليم الامتحان بنجاح')
              } else {
                toast.error(data.error || 'خطأ في التقديم')
              }
            } catch { toast.error('خطأ في الاتصال') }
            setSubmitting(false)
          }}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تقديم الامتحان (' + Object.keys(answers).length + '/' + examQuestions.length + ')'}
        </Button>
      </div>
    )
  }

  // Exam List Mode
  return (
    <div className="space-y-3">
      {exams.map(function(exam) {
        var examResultItem = results.find(function(r) { return r.examId === exam.id })
        var isLocked = submittedExamIds.has(exam.id)
        var hasMCQ = false
        try { if ((exam as any).questions) { var parsed = JSON.parse((exam as any).questions); hasMCQ = parsed.length > 0 } } catch {}
        return (
          <Card key={exam.id} className={isLocked ? 'border-emerald-500/30' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="h-9 w-9 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    {isLocked ? <Lock className="h-4 w-4 text-emerald-500" /> : <FileText className="h-4 w-4 text-orange-500" />}
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <h3 className="font-semibold text-sm">{exam.title}</h3>
                    {examResultItem ? (
                      <Badge className={"text-xs " + (examResultItem.score >= examResultItem.maxScore * 0.5 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400')}>
                        الدرجة: {examResultItem.score}/{examResultItem.maxScore}
                      </Badge>
                    ) : isLocked ? (
                      <Badge className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">تم التسليم</Badge>
                    ) : hasMCQ ? (
                      <Button size="sm" onClick={function() {
                        try {
                          var parsed = JSON.parse((exam as any).questions)
                          setExamQuestions(parsed)
                          setTakingExam(exam.id)
                          setAnswers({})
                          setExamResult(null)
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
    return <Image src={filePath} alt="Attachment" width={48} height={48} className="max-h-12 rounded-lg border" unoptimized />
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
