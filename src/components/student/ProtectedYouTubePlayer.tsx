'use client'

// ============================================================
// FILE: src/components/student/ProtectedYouTubePlayer.tsx
// PURPOSE: Protected custom YouTube player — same style as the
//          photo gallery (معرض الصور) modal player.
//
//          - NO YouTube branding (no logo, no share, no "Watch on YouTube")
//          - NO native controls, NO keyboard shortcuts, NO right-click menu
//          - Custom play/pause + seek bar + time + fullscreen (like gallery)
//          - Click-catch overlay: NO clicks reach the YouTube iframe,
//            so nobody can open/share the original URL from the player
//          - Corner masks hide any YouTube watermark
//          - Reports watch progress to /api/video-progress (same as file player)
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { Maximize, Minimize, X } from 'lucide-react'

/* ---------- YouTube IFrame API loader (cached) ---------- */
var ytApiPromise: Promise<any> | null = null
function loadYouTubeAPI(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  var w = window as any
  if (w.YT && w.YT.Player) return Promise.resolve(w.YT)
  if (ytApiPromise) return ytApiPromise
  ytApiPromise = new Promise(function (resolve) {
    var prev = w.onYouTubeIframeAPIReady
    w.onYouTubeIframeAPIReady = function () {
      if (prev) try { prev() } catch (e) {}
      resolve(w.YT)
    }
    var tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
  })
  return ytApiPromise
}

function formatTime(sec: number) {
  if (!sec || !isFinite(sec)) return '0:00'
  var m = Math.floor(sec / 60)
  var s = Math.floor(sec % 60)
  return m + ':' + String(s).padStart(2, '0')
}

/* ============================================================
 * ProtectedYouTubePlayer — the player box (aspect-video parent)
 * ============================================================ */
export function ProtectedYouTubePlayer({
  ytId,
  poster,
  videoId,
  studentId,
  onWatch,
  autoplay,
}: {
  ytId: string
  poster?: string
  videoId?: string
  studentId?: string
  onWatch?: () => void
  autoplay?: boolean
}) {
  const playerHostRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const lastReportRef = useRef<number>(-1)

  const [ready, setReady] = useState(false)
  const [started, setStarted] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const hideTimerRef = useRef<any>(null)
  const pendingPlayRef = useRef(!!autoplay)
  const onWatchRef = useRef(onWatch)

  useEffect(function () { onWatchRef.current = onWatch }, [onWatch])

  /* fullscreen listener */
  useEffect(function () {
    var onFsChange = function () { setIsFullscreen(!!document.fullscreenElement) }
    document.addEventListener('fullscreenchange', onFsChange)
    document.addEventListener('webkitfullscreenchange', onFsChange)
    return function () {
      document.removeEventListener('fullscreenchange', onFsChange)
      document.removeEventListener('webkitfullscreenchange', onFsChange)
    }
  }, [])

  /* auto-hide controls */
  useEffect(function () {
    if (playing) {
      hideTimerRef.current = setTimeout(function () { setShowControls(false) }, 3000)
    } else {
      setShowControls(true)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
    return function () { if (hideTimerRef.current) clearTimeout(hideTimerRef.current) }
  }, [playing, showControls])

  /* create player */
  useEffect(function () {
    var cancelled = false
    loadYouTubeAPI()
      .then(function (YT) {
        if (cancelled || !playerHostRef.current) return
        playerRef.current = new YT.Player(playerHostRef.current, {
          videoId: ytId,
          width: '100%',
          height: '100%',
          playerVars: {
            controls: 0,
            disablekb: 1,
            modestbranding: 1,
            rel: 0,
            iv_load_policy: 3,
            fs: 0,
            playsinline: 1,
            autoplay: autoplay ? 1 : 0,
          },
          events: {
            onReady: function (e: any) {
              if (cancelled) return
              setReady(true)
              try { setDuration(e.target.getDuration() || 0) } catch (err) {}
              if (pendingPlayRef.current) {
                pendingPlayRef.current = false
                try {
                  e.target.playVideo()
                  if (onWatchRef.current) onWatchRef.current()
                } catch (err) {}
              }
            },
            onStateChange: function (e: any) {
              if (cancelled) return
              // -1 unstarted | 0 ended | 1 playing | 2 paused | 3 buffering | 5 cued
              if (e.data === 1) { setStarted(true); setPlaying(true); setShowControls(true) }
              else if (e.data === 2) setPlaying(false)
              else if (e.data === 0) { setPlaying(false); setShowControls(true); reportWatched(999999) }
            },
          },
        })
      })
      .catch(function () {})
    return function () {
      cancelled = true
      try { if (playerRef.current && playerRef.current.destroy) playerRef.current.destroy() } catch (e) {}
      playerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ytId])

  /* time + buffered polling + progress report every 5s */
  useEffect(function () {
    var timer = setInterval(function () {
      var p = playerRef.current
      if (!p || !p.getCurrentTime) return
      try {
        var t = p.getCurrentTime() || 0
        var d = p.getDuration() || 0
        setCurrentTime(t)
        if (d) setDuration(d)
        if (p.getVideoLoadedFraction) setBuffered((p.getVideoLoadedFraction() || 0) * 100)
        if (studentId && videoId && t > 0) {
          var bucket = Math.floor(t / 5)
          if (bucket !== lastReportRef.current) {
            lastReportRef.current = bucket
            reportWatched(t, d)
          }
        }
      } catch (e) {}
    }, 500)
    return function () { clearInterval(timer) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, videoId])

  function reportWatched(seconds: number, total?: number) {
    if (!studentId || !videoId) return
    fetch('/api/video-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: studentId, videoId: videoId, watchedSeconds: seconds, totalSeconds: total || duration || 1 }),
    }).catch(function () {})
  }

  function togglePlay() {
    var p = playerRef.current
    if (!p || !p.playVideo) return
    if (!ready) { pendingPlayRef.current = true }
    try {
      if (playing) { p.pauseVideo() } else {
        p.playVideo()
        if (!started && onWatchRef.current) onWatchRef.current()
      }
    } catch (e) {}
  }

  function handleSeek(e: React.MouseEvent | React.TouchEvent) {
    var bar = progressRef.current
    var p = playerRef.current
    if (!bar || !p || !p.seekTo || !duration) return
    var rect = bar.getBoundingClientRect()
    var clientX = 'touches' in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX
    var ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    try { p.seekTo(ratio * duration, true) } catch (err) {}
    setCurrentTime(ratio * duration)
  }

  function handleFullscreen(e: React.MouseEvent | React.TouchEvent) {
    if (e) { e.preventDefault(); e.stopPropagation() }
    if (document.fullscreenElement) { document.exitFullscreen().catch(function () {}); return }
    if ((document as any).webkitFullscreenElement) { (document as any).webkitExitFullscreen(); return }
    var c = containerRef.current
    if (c && c.requestFullscreen) c.requestFullscreen().catch(function () {})
    else if (c && (c as any).webkitRequestFullscreen) (c as any).webkitRequestFullscreen()
  }

  var progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none bg-black overflow-hidden"
      onContextMenu={function (e) { e.preventDefault() }}
    >
      {/* YouTube player (created by IFrame API, replaces this div) */}
      <div ref={playerHostRef} className="absolute inset-0 w-full h-full" />

      {/* Corner masks — hide any YouTube watermark/branding remnants */}
      {started && (
        <>
          <div className="absolute bottom-0 right-0 w-32 h-10 z-10 pointer-events-none bg-gradient-to-t from-black/90 to-transparent" />
          <div className="absolute bottom-0 left-0 w-32 h-10 z-10 pointer-events-none bg-gradient-to-t from-black/90 to-transparent" />
          <div className="absolute top-0 right-0 w-24 h-8 z-10 pointer-events-none bg-gradient-to-b from-black/80 to-transparent" />
        </>
      )}

      {/* Click-catch overlay — blocks ALL interaction with the YouTube iframe */}
      <div
        className="absolute inset-0 z-20"
        onClick={function (e) { e.preventDefault(); e.stopPropagation(); togglePlay() }}
        onTouchEnd={function (e) { e.preventDefault(); e.stopPropagation(); togglePlay() }}
      />

      {/* Poster before first play — custom look, like gallery cards */}
      {!started && (
        <div className="absolute inset-0 z-30 pointer-events-none">
          {poster && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={poster} alt="فيديو الدرس" className="w-full h-full object-cover" draggable={false} />
          )}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className={'w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-2xl transition-transform ' + (ready ? 'group-hover:scale-110' : '')}>
              {!ready ? (
                <svg className="h-7 w-7 animate-spin text-gray-800" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : (
                <svg className="h-8 w-8 text-gray-800" style={{ marginLeft: '3px' }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Big center play button when paused (custom, not YouTube) */}
      {started && !playing && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-2xl">
            <svg className="h-8 w-8 text-gray-800" style={{ marginLeft: '3px' }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Custom controls bar — same style as the gallery modal player */}
      <div
        className={
          'absolute bottom-0 left-0 right-0 z-40 transition-opacity duration-300 ' +
          (showControls || !playing ? 'opacity-100' : 'opacity-0 pointer-events-none')
        }
        onClick={function (e) { e.stopPropagation() }}
        onTouchEnd={function (e) { e.stopPropagation() }}
      >
        <div
          ref={progressRef}
          className="w-full h-1.5 bg-white/30 cursor-pointer relative"
          onClick={handleSeek}
          onTouchEnd={function (e) { e.preventDefault(); e.stopPropagation(); handleSeek(e) }}
        >
          <div className="absolute top-0 left-0 h-full bg-white/40 pointer-events-none" style={{ width: buffered + '%' }} />
          <div className="absolute top-0 left-0 h-full bg-primary pointer-events-none" style={{ width: progressPercent + '%' }} />
        </div>
        <div className="flex items-center gap-1 px-4 py-3 bg-gradient-to-t from-black/80 to-transparent">
          <button
            type="button"
            aria-label={playing ? 'إيقاف مؤقت' : 'تشغيل'}
            className="w-10 h-10 flex items-center justify-center text-white hover:text-primary transition-colors shrink-0"
            onClick={function (e) { e.preventDefault(); e.stopPropagation(); togglePlay() }}
            onTouchEnd={function (e) { e.preventDefault(); e.stopPropagation(); togglePlay() }}
          >
            {playing ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>
          <span className="text-white text-sm tabular-nums" dir="ltr">{formatTime(currentTime)} / {formatTime(duration)}</span>
          <button
            type="button"
            aria-label={isFullscreen ? 'خروج من ملء الشاشة' : 'ملء الشاشة'}
            className="w-10 h-10 flex items-center justify-center text-white hover:text-primary transition-colors shrink-0 ml-auto"
            onClick={function (e) { e.preventDefault(); e.stopPropagation(); handleFullscreen(e) }}
            onTouchEnd={function (e) { e.preventDefault(); e.stopPropagation(); handleFullscreen(e) }}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
 * ProtectedYouTubeModal — fullscreen overlay (gallery modal style)
 * ============================================================ */
export function ProtectedYouTubeModal({
  ytId,
  title,
  poster,
  videoId,
  studentId,
  onWatch,
  onClose,
}: {
  ytId: string
  title?: string
  poster?: string
  videoId?: string
  studentId?: string
  onWatch?: () => void
  onClose: () => void
}) {
  useEffect(function () {
    var onKey = function (e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    var prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return function () {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
      onContextMenu={function (e) { e.preventDefault() }}
    >
      {/* close button — fixed top-right, same as gallery modal */}
      <button
        type="button"
        aria-label="إغلاق"
        className="fixed top-4 right-4 z-[200] min-h-[48px] min-w-[48px] rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
        onClick={function (e) { e.stopPropagation(); onClose() }}
        onTouchEnd={function (e) { e.preventDefault(); e.stopPropagation(); onClose() }}
      >
        <X className="h-6 w-6" />
      </button>

      <div className="relative w-full max-w-5xl aspect-video" onClick={function (e) { e.stopPropagation() }}>
        <ProtectedYouTubePlayer
          ytId={ytId}
          poster={poster}
          videoId={videoId}
          studentId={studentId}
          onWatch={onWatch}
          autoplay
        />
        {title && (
          <div className="absolute -bottom-8 left-0 right-0 text-center pointer-events-none">
            <p className="text-white/80 text-xs truncate px-4">{title}</p>
          </div>
        )}
      </div>
    </div>
  )
}
