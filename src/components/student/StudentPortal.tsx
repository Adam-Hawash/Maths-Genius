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
  User, Phone, Award, Maximize, Minimize, Lock, X, ListTodo,
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
    homeworkResults: any[]
    watchedIds: Set<string>
    approvedVideoIds: Set<string>
    videoProgress: Record<string, number>
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFullPortal, setShowFullPortal] = useState(false)
  const [activeTab, setActiveTab] = useState('videos')

  const grade = currentStudent?.grade || ''
  const studentId = currentStudent?.id || ''

  useEffect(() => {
    if (!grade || !studentId) return
    let cancelled = false
    ;(async () => {
      try {
        const [videosRes, hwRes, examsRes, annRes, resultsRes, actRes, payRes, accessRes, progressRes] = await Promise.all([
          fetch(`/api/videos?grade=${encodeURIComponent(grade)}&pageSize=100`).then(r => r.json()),
          fetch(`/api/homework?grade=${encodeURIComponent(grade)}&pageSize=50`).then(r => r.json()),
          fetch(`/api/exams?grade=${encodeURIComponent(grade)}&pageSize=50`).then(r => r.json()),
          fetch(`/api/announcements?grade=${encodeURIComponent(grade)}&pageSize=10`).then(r => r.json()),
          fetch(`/api/exam-results?studentId=${studentId}`).then(r => r.json()),
          fetch(`/api/activities?studentId=${studentId}&action=watched_video&pageSize=200`).then(r => r.json()),
          fetch(`/api/payments?studentId=${studentId}&status=approved&pageSize=200`).then(r => r.json()),
          fetch(`/api/video-access?studentId=${studentId}`).then(r => r.json()).catch(() => ({ accesses: [] })),
          fetch(`/api/video-progress?studentId=${studentId}`).then(r => r.json()).catch(() => ({ progress: [] })),
        ])
        if (cancelled) return
        const videos = videosRes.videos || []
        const watchedIds = new Set<string>((actRes.activities || []).map((a: any) => a.details?.replace('Watched: ', '')))
        const approvedPayments = payRes.payments || []
        const paidVideoIds = approvedPayments.map((p: any) => p.videoId).filter(Boolean)
        const grantedVideoIds = (accessRes.accesses || []).map((a: any) => a.videoId).filter(Boolean)
        const approvedVideoIds = new Set<string>([...paidVideoIds, ...grantedVideoIds])
        // Build progress map: videoId -> percentage (0-100)
        const progressMap: Record<string, number> = {}
        ;(progressRes.progress || []).forEach((p: any) => {
          if (p.videoId && p.totalSeconds > 0) {
            var pct = Math.min(100, Math.round((p.watchedSeconds / p.totalSeconds) * 100))
            progressMap[p.videoId] = pct
            if (pct >= 90) watchedIds.add(p.videoId)
          }
        })
        setDashboardData({
          videos,
          homework: hwRes.homework || [],
          exams: examsRes.exams || [],
          announcements: annRes.announcements || [],
          examResults: resultsRes.results || [],
          homeworkResults: [],
          watchedIds,
          approvedVideoIds,
          videoProgress: progressMap,
        })
      } catch { /* silent */ }
      if (!cancelled) setLoading(false)
    })()
    return () => { cancelled = true }
  }, [grade, studentId])

  const refreshData = async () => {
    if (!grade || !studentId) return
    try {
      const [hwRes, examsRes, resultsRes, hwResultsRes] = await Promise.all([
        fetch(`/api/homework?grade=${encodeURIComponent(grade)}&pageSize=50`).then(r => r.json()),
        fetch(`/api/exams?grade=${encodeURIComponent(grade)}&pageSize=50`).then(r => r.json()),
        fetch(`/api/exam-results?studentId=${studentId}`).then(r => r.json()),
        fetch(`/api/homework/results?studentId=${studentId}`).then(r => r.json()).catch(() => ({ results: [] })),
      ])
      setDashboardData(prev => prev ? {
        ...prev,
        homework: hwRes.homework || [],
        exams: examsRes.exams || [],
        examResults: resultsRes.results || [],
          homeworkResults: hwResultsRes.results || [],
      } : prev)
    } catch { /* silent */ }
  }

  // Dashboard overview before entering full portal
  if (!showFullPortal) {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )
    }

    const initialData = dashboardData
    if (!initialData) return null

    // Calculate summary stats
    var totalVideos = initialData.videos.length
    var watchedCount = 0
    var avgProgress = 0
    var progressCount = 0
    initialData.videos.forEach(function(v) {
      var prog = initialData.videoProgress[v.id]
      if (prog !== undefined) {
        avgProgress += prog
        progressCount++
      }
      if (initialData.watchedIds.has(v.id)) watchedCount++
    })
    if (progressCount > 0) avgProgress = Math.round(avgProgress / progressCount)

    var pendingHomework = initialData.homework.length
    var pendingExams = initialData.exams.filter(function(e) {
      return !initialData.examResults.find(function(r) { return r.examId === e.id })
    }).length

    return (
      <div className="flex-1 py-6 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Welcome Card */}
          <Card className="bg-gradient-to-br from-sky-50 via-white to-teal-50/30 dark:from-sky-950/20 dark:via-transparent dark:to-teal-950/10 border-sky-200/50 dark:border-sky-800/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-sky-100 to-teal-100 dark:from-sky-900/40 dark:to-teal-900/40 flex items-center justify-center shadow-sm">
                    <User className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">أهلاً بيك {currentStudent?.name}</h1>
                    <p className="text-sm text-muted-foreground">إنت قادر وتوصل لكل اللي بتتمناه، بس استمر!</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={logout} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <LogOut className="h-4 w-4 ml-1" />
                  <span className="hidden sm:inline">خروج</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Video, label: 'الدروس', value: totalVideos, sub: watchedCount + ' مشاهدة', color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/30' },
              { icon: ClipboardList, label: 'الواجبات', value: pendingHomework, sub: pendingHomework > 0 ? 'لازم تحلهم' : 'لا توجد', color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/30' },
              { icon: FileText, label: 'الامتحانات', value: pendingExams, sub: pendingExams > 0 ? 'لسه مفدمتمش' : 'خلصت', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' },
              { icon: TrendingUp, label: 'نسبة المشاهدة', value: avgProgress + '%', sub: progressCount + ' فيديو', color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/30' },
            ].map((s, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg ${s.color} flex items-center justify-center shrink-0`}>
                      <s.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-2xl font-bold leading-tight">{s.value}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{s.label}</p>
                      <p className="text-[10px] text-muted-foreground/70 truncate">{s.sub}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pending Tasks Section */}
          {(pendingHomework > 0 || pendingExams > 0) && (
            <Card className="border-sky-200/60 bg-sky-50/60 dark:bg-sky-950/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ListTodo className="h-5 w-5 text-sky-500" />
                  <h2 className="font-bold text-sm">حاجات عاملها لسه</h2>
                  <Badge variant="outline" className="text-[10px] border-amber-500/40 text-sky-500 mr-auto">{pendingHomework + pendingExams} مهمة</Badge>
                </div>
                <div className="space-y-2">
                  {initialData.homework.slice(0, 3).map(function(hw) {
                    var hasMCQ = false
                    try { if ((hw as any).questions) { var parsed = JSON.parse((hw as any).questions); hasMCQ = parsed.length > 0 } } catch {}
                    return (
                      <div key={hw.id} className="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-white/5">
                        <div className="h-8 w-8 rounded-lg bg-sky-50 dark:bg-sky-950/30 flex items-center justify-center shrink-0">
                          <ClipboardList className="h-4 w-4 text-sky-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{hw.title}</p>
                          <p className="text-[10px] text-muted-foreground">واجب {hasMCQ ? '· ' + JSON.parse((hw as any).questions || '[]').length + ' أسئلة' : ''}</p>
                        </div>
                        <Badge variant="outline" className="text-[9px] border-blue-500/30 text-sky-500">واجب</Badge>
                      </div>
                    )
                  })}
                  {initialData.exams.filter(function(e) {
                    return !initialData.examResults.find(function(r) { return r.examId === e.id })
                  }).slice(0, 2).map(function(exam) {
                    return (
                      <div key={exam.id} className="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-white/5">
                        <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{exam.title}</p>
                          <p className="text-[10px] text-muted-foreground">امتحان</p>
                        </div>
                        <Badge variant="outline" className="text-[9px] border-orange-500/30 text-amber-500">امتحان</Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Videos Preview with Progress */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <Video className="h-4 w-4 text-violet-500" />
                الدروس ({watchedCount}/{totalVideos} مشاهدة)
              </h2>
              <Button variant="link" size="sm" className="text-xs p-0 h-auto" onClick={() => setShowFullPortal(true)}>
                شوف الكل
              </Button>
            </div>
            <VideosTab videos={initialData.videos} watchedIds={initialData.watchedIds} approvedVideoIds={initialData.approvedVideoIds} studentId={studentId} grade={grade} videoProgress={initialData.videoProgress} studentStatus={currentStudent?.status} isPaidAccess={currentStudent?.isPaidAccess} />
          </div>

          {/* Enter Full Portal */}
          <div className="flex justify-center pt-2">
            <Button variant="outline" onClick={() => setShowFullPortal(true)} className="gap-2">
              <GraduationCap className="h-4 w-4" />
              ادخل المنصة
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Full portal
  if (!dashboardData) return null

  const tabs = [
    { id: 'videos', label: 'الدروس', icon: Video },
    { id: 'homework', label: 'الواجبات', icon: ClipboardList },
    { id: 'exams', label: 'الامتحانات', icon: FileText },
    { id: 'announcements', label: 'الإعلانات', icon: Megaphone },
    { id: 'discussions', label: 'المجتمع', icon: MessageSquare },
  ]

  return (
    <div className="flex-1 flex flex-col">
      {/* Top Bar */}
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setShowFullPortal(false)}>
            <ChevronLeft className="h-4 w-4 ml-1" />
          </Button>
          <h1 className="font-bold text-sm sm:text-base truncate">{currentStudent?.name}</h1>
          <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">{grade}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={logout} className="text-destructive hover:text-destructive hover:bg-destructive/10">
          <LogOut className="h-4 w-4 ml-1" />
          <span className="hidden sm:inline">خروج</span>
        </Button>
      </div>

      {/* Tab Bar */}
      <div className="border-b px-4 flex gap-1 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id ? 'border-sky-500 text-sky-600 dark:text-sky-400' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'videos' && <VideosTab videos={dashboardData.videos} watchedIds={dashboardData.watchedIds} approvedVideoIds={dashboardData.approvedVideoIds} studentId={studentId} grade={grade} videoProgress={dashboardData.videoProgress} studentStatus={currentStudent?.status} isPaidAccess={currentStudent?.isPaidAccess} />}
        {activeTab === 'homework' && <HomeworkTab homework={dashboardData.homework} studentId={studentId} homeworkResults={dashboardData.homeworkResults} onRefreshData={refreshData} />}
        {activeTab === 'exams' && <ExamsTab exams={dashboardData.exams} results={dashboardData.examResults} studentId={studentId} onRefreshData={refreshData} />}
        {activeTab === 'announcements' && <AnnouncementsTab announcements={dashboardData.announcements} />}
        {activeTab === 'discussions' && <DiscussionsTab grade={grade} studentId={studentId} studentName={currentStudent?.name || ''} />}
      </div>
    </div>
  )
}

function VideosTab({ videos, watchedIds, approvedVideoIds, studentId, grade, videoProgress, studentStatus, isPaidAccess }: { videos: VideoType[]; watchedIds: Set<string>; approvedVideoIds: Set<string>; studentId: string; grade: string; videoProgress: Record<string, number>; studentStatus?: string; isPaidAccess?: boolean }) {
  const { setView, setPendingPaymentVideo } = useAppStore()
  const [localWatched, setLocalWatched] = useState(watchedIds)

  // Only an explicitly approved, non-paid student gets free access. A paid account always pays for priced videos.
  const isFreeStudent = studentStatus === 'approved' && isPaidAccess !== true
  const isPaidStudent = studentStatus === 'paid' || isPaidAccess === true

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

  if (videos.length === 0) return <EmptyState message="مفيش دروس دلوقتي" />

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {videos.map((video) => {
        const ytId = getYouTubeId(video.url)
        const isVideoFile = video.filePath && (video.fileType?.startsWith('video/') || video.filePath.match(/\.(mp4|webm|mov|avi)$/i))
        const isWatched = localWatched.has(video.id)
        const thumbSrc = video.thumbnail || getYouTubeThumbnail(video.url) || null
        const hasPrice = (video.price || 0) > 0
        const hasApprovedPayment = approvedVideoIds.has(video.id)
        // A paid account is not a purchase grant. Every priced video stays locked
        // until this specific video has an approved payment/access record.
        const needsPay = hasPrice && !hasApprovedPayment
        const progress = videoProgress[video.id] || 0

        return (
          <Card key={video.id} className={`overflow-hidden transition-all ${isWatched ? 'border-teal-400/30' : ''}`}>
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
                      ادفع دلوقتي
                    </Button>
                  </div>
                </div>
              ) : ytId ? (
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
                  <span className="text-sm">افتح الرابط</span>
                </a>
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <Video className="h-10 w-10 text-white/30" />
                </div>
              )}
              {/* Progress Bar Overlay */}
              {progress > 0 && !needsPay && (
                <div className="absolute bottom-0 left-0 right-0 z-30">
                  <div className="w-full h-1.5 bg-black/30">
                    <div
                      className={`h-full transition-all ${progress >= 90 ? 'bg-teal-500' : progress >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
                      style={{ width: progress + '%' }}
                    />
                  </div>
                </div>
              )}
              {isWatched && (
                <div className="absolute top-2 right-2 z-30">
                  <Badge className="bg-emerald-500 text-white text-[10px] gap-1">
                    <CheckCircle2 className="h-3 w-3" /> شاهدته
                  </Badge>
                </div>
              )}
            </div>
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-sm truncate flex-1">{video.title}</h3>
                {progress > 0 && !needsPay && (
                  <span className={`text-[11px] font-bold shrink-0 ${
                    progress >= 90 ? 'text-teal-600' : progress >= 50 ? 'text-sky-500' : 'text-red-500'
                  }`}>
                    {progress}%
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{new Date(video.createdAt).toLocaleDateString('ar-EG')}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

/* ========== CUSTOM VIDEO PLAYER ========== */
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
  const [buffering, setBuffering] = useState(false)
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
    if (v.paused) {
      // Wait for buffer if needed
      if (v.readyState < 3) {
        setBuffering(true)
        v.load()
        var onCanPlay = function() {
          v.removeEventListener('canplay', onCanPlay)
          setBuffering(false)
          v.play().catch(function(){})
        }
        v.addEventListener('canplay', onCanPlay)
        return
      }
      v.play().catch(function(){})
    } else {
      v.pause()
    }
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
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        src={src}
        poster={poster}
        preload="auto"
        playsInline
        disablePictureInPicture
        disableRemotePlayback
        onPlay={function() { setPlaying(true); setBuffering(false) }}
        onPause={function() { setPlaying(false); setBuffering(false) }}
        onWaiting={function() { setBuffering(true) }}
        onCanPlay={function() { setBuffering(false) }}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={function() { if (videoRef.current) setDuration(videoRef.current.duration) }}
      />

      {buffering && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        </div>
      )}

      {!playing && !buffering && (
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
function HomeworkTab({ homework, studentId, homeworkResults, onRefreshData }: { homework: Homework[]; studentId: string; homeworkResults: any[]; onRefreshData: () => void }) {
  const [expandedHw, setExpandedHw] = useState<string | null>(null)
  const [hwAnswers, setHwAnswers] = useState<Record<string, Record<number, number>>>({})
  const [hwSubmitted, setHwSubmitted] = useState<Record<string, boolean>>({})
  const [hwScores, setHwScores] = useState<Record<string, {score: number, max: number, message: string}>>({})
  const [hwSubmitting, setHwSubmitting] = useState<string | null>(null)

  // Mark already-submitted homeworks from DB
  useEffect(() => {
    if (!homeworkResults) return
    var submitted: Record<string, boolean> = {}
    var scores: Record<string, {score: number, max: number, message: string}> = {}
    homeworkResults.forEach(function(r: any) {
      submitted[r.homeworkId] = true
      var passed = r.score >= Math.ceil(r.maxScore * 0.5)
      scores[r.homeworkId] = { score: r.score, max: r.maxScore, message: passed ? 'شاطر' : 'عايز مراجعة على الدروس' }
    })
    setHwSubmitted(submitted)
    setHwScores(scores)
  }, [homeworkResults])

  const submitHomework = async function(hwId: string) {
    var myAnswers = hwAnswers[hwId] || {}
    if (Object.keys(myAnswers).length === 0) return
    setHwSubmitting(hwId)
    try {
      var hw = homework.find(function(h) { return h.id === hwId })
      if (!hw) { toast.error('الواجب مش موجود'); setHwSubmitting(null); return }
      var parsed = JSON.parse((hw as any).questions || '[]')
      // Shuffle for grading consistency
      var shuffled = parsed.map(function(q: any) {
        var correctAnswer = q.options[q.correct]
        var optsWithIndex = q.options.map(function(opt: string, i: number) { return { opt: opt, idx: i } })
        for (var i = optsWithIndex.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var tmp = optsWithIndex[i]; optsWithIndex[i] = optsWithIndex[j]; optsWithIndex[j] = tmp }
        var newOptions = optsWithIndex.map(function(o: any) { return o.opt })
        var newCorrect = 0
        for (var k = 0; k < newOptions.length; k++) { if (newOptions[k] === correctAnswer) { newCorrect = k; break } }
        return { question: q.question || q.q, options: newOptions, correct: newCorrect, points: q.points || 1 }
      })
      var res = await fetch('/api/homework/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, homeworkId: hwId, answers: myAnswers, shuffledQuestions: shuffled }),
      })
      var data = await res.json()
      if (res.ok) {
        setHwSubmitted(function(prev) { var n = { ...prev }; n[hwId] = true; return n })
        setHwScores(function(prev) { var n = { ...prev }; n[hwId] = { score: data.result.score, max: data.result.maxScore, message: data.result.resultMessage }; return n })
        onRefreshData()
      } else {
        toast.error(data.error || 'حصل مشكلة')
      }
    } catch { toast.error('مفيش نت') }
    setHwSubmitting(null)
  }

  if (homework.length === 0) return <EmptyState message="مفيش واجبات دلوقتي" />
  return (
    <div className="space-y-3">
      {homework.map((hw) => {
        var mcq = (hw as any).questions ? JSON.parse((hw as any).questions) : []
        var hasMCQ = Array.isArray(mcq) && mcq.length > 0
        var isExpanded = expandedHw === hw.id
        var isSubmitted = !!hwSubmitted[hw.id]
        var myAnswers = hwAnswers[hw.id] || {}
        var scoreInfo = hwScores[hw.id]

        return (
          <Card key={hw.id} className={hasMCQ ? 'cursor-pointer' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3" onClick={hasMCQ ? function() { setExpandedHw(isExpanded ? null : hw.id) } : undefined}>
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className={"h-9 w-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 " + (hasMCQ ? 'bg-teal-50 dark:bg-teal-950/30' : 'bg-sky-50 dark:bg-sky-950/30')}>
                    <ClipboardList className={"h-4 w-4 " + (hasMCQ ? 'text-teal-500' : 'text-sky-500')} />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h3 className="font-semibold text-sm">{hw.title}</h3>
                    {hw.content && <p className="text-xs text-muted-foreground line-clamp-2">{hw.content}</p>}
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[10px] text-muted-foreground">{new Date(hw.createdAt).toLocaleDateString('ar-EG')}</p>
                      {hasMCQ && <Badge variant="outline" className="text-[10px] border-teal-400/40 text-teal-600">{mcq.length} سؤال</Badge>}
                      {isSubmitted && scoreInfo && <Badge className={"text-[10px] " + (scoreInfo.score >= Math.ceil(scoreInfo.max * 0.5) ? 'bg-teal-500 text-white' : 'bg-amber-500 text-white')}>النتيجة: {scoreInfo.score}/{scoreInfo.max} - {scoreInfo.message}</Badge>}
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
                        <p className="font-medium text-sm">{qi + 1}. {q.question}</p>
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
                    <Button size="sm" onClick={function(e) { e.stopPropagation(); submitHomework(hw.id) }} disabled={Object.keys(myAnswers).length === 0 || hwSubmitting === hw.id}>
                      {hwSubmitting === hw.id ? <Loader2 className="h-4 w-4 ml-1 animate-spin" /> : null}
                      سلم الإجابات ({Object.keys(myAnswers).length}/{mcq.length})
                    </Button>
                  ) : (
                    <div className={"p-4 rounded-lg border " + (scoreInfo && scoreInfo.score >= Math.ceil(scoreInfo.max * 0.5) ? 'bg-teal-50 dark:bg-teal-950/30 border-teal-400/30' : 'bg-amber-50 border-amber-400/30')}>
                      <p className={"text-sm font-bold " + (scoreInfo && scoreInfo.score >= Math.ceil(scoreInfo.max * 0.5) ? 'text-teal-700' : 'text-amber-700')}>
                        {scoreInfo ? scoreInfo.message : 'اتسلم'} - مش هتقدر تسلمه تاني
                      </p>
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
function ExamsTab({ exams, results, studentId, onRefreshData }: { exams: Exam[]; results: ExamResult[]; studentId: string; onRefreshData: () => void }) {
  const [takingExam, setTakingExam] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [examQuestions, setExamQuestions] = useState<any[]>([])
  const [submittedExamId, setSubmittedExamId] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<any>(null)

  if (exams.length === 0) return <EmptyState message="مفيش امتحانات دلوقتي" />

  if (submittedExamId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="h-20 w-20 rounded-full bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-teal-500" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-teal-600 dark:text-emerald-400">تم قدم الامتحان</h3>
          {lastResult && (
            <>
              <p className="text-2xl font-bold">{lastResult.score}/{lastResult.maxScore}</p>
              <Badge className={lastResult.passed ? 'bg-teal-500 text-white' : 'bg-amber-500 text-white'}>{lastResult.resultMessage || (lastResult.passed ? 'شاطر' : 'عايز مراجعة على الدروس')}</Badge>
            </>
          )}
          <p className="text-sm text-muted-foreground">مش هتقدر تعمل الامتحان ده تاني</p>
        </div>
        <Button variant="outline" onClick={() => { setSubmittedExamId(null); setLastResult(null); onRefreshData() }}>ارجع للامتحانات</Button>
      </div>
    )
  }

  if (takingExam) {
    const exam = exams.find(e => e.id === takingExam)
    if (!exam || examQuestions.length === 0) { setTakingExam(null); return null }
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">{exam.title}</h3>
          <Button variant="outline" size="sm" onClick={() => { setTakingExam(null); setAnswers({}); setExamQuestions([]) }}>ارجع</Button>
        </div>
        {examQuestions.map((q, qi) => (
          <Card key={qi}>
            <CardContent className="p-4 space-y-3">
              <p className="font-medium text-sm">{qi + 1}. {q.question || q.q}</p>
              <div className="space-y-2">
                {q.options.map((opt: string, oi: number) => (
                  <button key={oi} onClick={() => setAnswers(prev => ({ ...prev, [qi]: oi }))} className={`w-full text-right p-3 rounded-lg border text-sm transition-colors ${answers[qi] === oi ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border hover:bg-muted/50'}`}>
                    <span className="ml-2 font-bold">{String.fromCharCode(65 + oi)}.</span> {opt}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        <Button className="w-full" disabled={Object.keys(answers).length < examQuestions.length || submitting} onClick={async () => {
          setSubmitting(true)
          try {
            const res = await fetch('/api/exams/submit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ studentId, examId: takingExam, answers, shuffledQuestions: examQuestions }),
            })
            const data = await res.json()
            if (res.ok) {
              setLastResult(data.result)
              setSubmittedExamId(takingExam)
              setTakingExam(null); setAnswers({}); setExamQuestions([])
              onRefreshData()
            } else {
              toast.error(data.error || 'حصل مشكلة')
            }
          } catch { toast.error('مفيش نت') }
          setSubmitting(false)
        }}>{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : `قدم الامتحان (${Object.keys(answers).length}/${examQuestions.length})`}</Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {exams.map((exam) => {
        const examResult = results.find(r => r.examId === exam.id)
        let hasMCQ = false
        try { if ((exam as any).questions) { const parsed = JSON.parse((exam as any).questions); hasMCQ = parsed.length > 0 } } catch {}
        return (
          <Card key={exam.id} className={examResult ? 'border-teal-400/30' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="h-9 w-9 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <h3 className="font-semibold text-sm">{exam.title}</h3>
                    {examResult ? (
                      <div className="space-y-1">
                        <Badge className={"text-xs " + ((examResult as any).passed !== false ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400')}>
                          الدرجة: {examResult.score}/{examResult.maxScore}
                        </Badge>
                        <p className={"text-[10px] font-medium " + ((examResult as any).passed !== false ? 'text-teal-600 dark:text-emerald-400' : 'text-sky-500 dark:text-amber-400')}>
                          تم قدم الامتحان - {(examResult as any).resultMessage || ((examResult as any).passed !== false ? 'شاطر' : 'عايز مراجعة على الدروس')}
                        </p>
                      </div>
                    ) : hasMCQ ? (
                      <Button size="sm" onClick={() => {
                        try {
                          const parsed = JSON.parse((exam as any).questions)
                          var shuffled = parsed.map(function(q: any) {
                            var correctAnswer = q.options[q.correct]
                            var optsWithIndex = q.options.map(function(opt: string, i: number) { return { opt: opt, idx: i } })
                            for (var i = optsWithIndex.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var tmp = optsWithIndex[i]; optsWithIndex[i] = optsWithIndex[j]; optsWithIndex[j] = tmp }
                            var newOptions = optsWithIndex.map(function(o: any) { return o.opt })
                            var newCorrect = 0
                            for (var k = 0; k < newOptions.length; k++) { if (newOptions[k] === correctAnswer) { newCorrect = k; break } }
                            return { question: q.question || q.q, options: newOptions, correct: newCorrect, points: q.points || 1 }
                          })
                          for (var i = shuffled.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var tmp = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = tmp }
                          setExamQuestions(shuffled)
                          setTakingExam(exam.id)
                          setAnswers({})
                        } catch { toast.error('مش قادر يحمل الأسئلة') }
                      }}>يلا نبدأ</Button>
                    ) : (
                      <Badge variant="secondary" className="text-xs">لسه مفدمتوش</Badge>
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
  if (announcements.length === 0) return <EmptyState message="مفيش إعلانات دلوقتي" />
  return (
    <div className="space-y-3">
      {announcements.map((ann) => (
        <Card key={ann.id} className="border-sky-200/60 dark:border-sky-800/30">
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
    } catch { toast.error('مش قادر يحمل النقاشات') }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/discussions?grade=${encodeURIComponent(grade)}&pageSize=100`)
        const data = await res.json()
        if (!cancelled) setItems(data.discussions || [])
      } catch { if (!cancelled) toast.error('مش قادر يحمل النقاشات') }
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
      toast.success('بعت رسالتك')
    } catch { toast.error('مش قادر يبعت الرسالة') }
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
        <EmptyState message="يلا نبدأ! اكتب أول رسالة" />
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
          {items.map((d) => {
            const isMe = d.studentId === (currentStudent?.id || studentId)
            const isAdmin = d.isAdminReply
            return (
              <div key={d.id} className={`flex ${isAdmin ? 'justify-start' : isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  isAdmin ? 'bg-sky-50 dark:bg-sky-900/20 border border-sky-200/50 dark:border-sky-800/30 rounded-bl-md' :
                  isMe ? 'bg-primary text-primary-foreground rounded-bl-md' :
                  'bg-muted rounded-br-md'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`text-xs font-medium ${isAdmin ? 'text-primary' : isMe ? 'opacity-75' : 'text-foreground'}`}>{d.studentName}</p>
                    {isAdmin && <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/30 text-primary">المستر</Badge>}
                  </div>
                  <p className="text-sm leading-relaxed">{d.content}</p>
                  <p className={`text-[10px] mt-1 ${isAdmin ? 'text-sky-400' : isMe ? 'opacity-60' : 'text-muted-foreground'}`}>{new Date(d.createdAt).toLocaleString('ar-EG')}</p>
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
