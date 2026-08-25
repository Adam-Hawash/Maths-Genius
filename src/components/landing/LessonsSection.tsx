'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useAppStore, GRADES } from '@/stores/app-store'
import { Badge } from '@/components/ui/badge'
import { BookOpen, PlayCircle, ChevronRight, ChevronLeft } from 'lucide-react'
import Image from 'next/image'

export default function LessonsSection() {
  var store = useAppStore()
  var setView = store.setView
  var [videos, setVideos] = useState<any[]>([])
  var [loading, setLoading] = useState(true)
  var [selectedGrade, setSelectedGrade] = useState('')
  var [currentIndex, setCurrentIndex] = useState(0)
  var [isTransitioning, setIsTransitioning] = useState(false)
  var touchStartX = useRef(0)
  var containerRef = useRef<HTMLDivElement>(null)

  var getYouTubeId = function(url: string) {
    var match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/)
    return match ? match[1] : null
  }

  useEffect(function() {
    setLoading(true)
    var params = new URLSearchParams({ pageSize: '12' })
    if (selectedGrade) params.set('grade', selectedGrade)
    fetch('/api/videos?' + params.toString())
      .then(function(r) { return r.json() })
      .then(function(data) {
        setVideos(data.videos || [])
        setCurrentIndex(0)
      })
      .catch(function() {})
      .finally(function() { setLoading(false) })
  }, [selectedGrade])

  var goTo = useCallback(function(direction: 'prev' | 'next') {
    if (isTransitioning || videos.length === 0) return
    setIsTransitioning(true)
    if (direction === 'next') {
      setCurrentIndex(function(prev) { return (prev + 1) % videos.length })
    } else {
      setCurrentIndex(function(prev) { return (prev - 1 + videos.length) % videos.length })
    }
    setTimeout(function() { setIsTransitioning(false) }, 400)
  }, [isTransitioning, videos.length])

  /* Touch / swipe support */
  var handleTouchStart = function(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  var handleTouchEnd = function(e: React.TouchEvent) {
    var diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      goTo(diff > 0 ? 'next' : 'prev')
    }
  }

  /* Keyboard support */
  useEffect(function() {
    var handler = function(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') goTo('next')
      if (e.key === 'ArrowRight') goTo('prev')
    }
    window.addEventListener('keydown', handler)
    return function() { window.removeEventListener('keydown', handler) }
  }, [goTo])

  /* Auto-play */
  useEffect(function() {
    if (videos.length <= 1) return
    var timer = setInterval(function() { goTo('next') }, 5000)
    return function() { clearInterval(timer) }
  }, [videos.length, goTo])

  /* Build visible items: prev - center - next with their offsets */
  var getVisibleItems = function() {
    if (videos.length === 0) return []
    var items: { video: any; offset: number; isCenter: boolean }[] = []
    var total = videos.length
    /* Show up to 5 items: -2, -1, 0, +1, +2 */
    for (var i = -2; i <= 2; i++) {
      var idx = ((currentIndex + i) % total + total) % total
      items.push({ video: videos[idx], offset: i, isCenter: i === 0 })
    }
    return items
  }

  var visibleItems = getVisibleItems()

  var getCardStyle = function(offset: number) {
    var abs = Math.abs(offset)
    if (abs === 0) {
      return {
        transform: 'translateX(0) scale(1)',
        opacity: 1,
        zIndex: 10,
        filter: 'none',
      }
    }
    if (abs === 1) {
      return {
        transform: 'translateX(' + (offset * 42) + '%) scale(0.82)',
        opacity: 0.7,
        zIndex: 5,
        filter: 'brightness(0.6)',
      }
    }
    /* abs === 2 */
    return {
      transform: 'translateX(' + (offset * 72) + '%) scale(0.65)',
      opacity: 0.35,
      zIndex: 1,
      filter: 'brightness(0.4)',
    }
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#0F0D0A] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge className="mb-3 bg-[#C49A38]/10 text-[#E5BE5A] border-[#C49A38]/30 hover:bg-[#C49A38]/20">
            <BookOpen className="h-3.5 w-3.5 ml-1" />
            المحاضرات الحديثة
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">الدروس المتاحة</h2>
          <p className="text-white/50 max-w-xl mx-auto">اختار درسك وابدأ تتعلم.. سجل دخولك عشان تشوف المحتوى كله</p>
        </div>

        {/* Grade Filter */}
        <div className="flex justify-center mb-8">
          <select
            value={selectedGrade}
            onChange={function(e) { setSelectedGrade(e.target.value) }}
            className="h-10 rounded-lg border border-[#C49A38]/30 bg-[#1A1714] text-[#E5BE5A] px-4 text-sm appearance-none cursor-pointer"
          >
            <option value="">كل الصفوف</option>
            {GRADES.map(function(g) { return <option key={g} value={g}>{g}</option> })}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-[#C49A38] border-t-transparent rounded-full" />
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-12 w-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/30">مفيش دروس متاحة دلوقتي</p>
          </div>
        ) : (
          <div className="relative">
            {/* Carousel Container */}
            <div
              ref={containerRef}
              className="relative flex items-center justify-center"
              style={{ height: '420px' }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {visibleItems.map(function(item) {
                var v = item.video
                var ytId = getYouTubeId(v.url)
                var thumb = v.thumbnail || (ytId ? 'https://img.youtube.com/vi/' + ytId + '/hqdefault.jpg' : null)
                var isCenter = item.isCenter

                return (
                  <div
                    key={v.id + '-' + item.offset}
                    className={
                      'absolute cursor-pointer rounded-2xl overflow-hidden transition-all duration-400 ease-out ' +
                      (isCenter
                        ? 'w-[320px] sm:w-[380px] md:w-[420px] shadow-2xl shadow-[#C49A38]/10'
                        : 'w-[280px] sm:w-[320px]')
                    }
                    style={
                      Object.assign({}, getCardStyle(item.offset), {
                        transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
                      })
                    }
                    onClick={function() { setView('auth-login') }}
                  >
                    {/* Card */}
                    <div
                      className={
                        'relative rounded-2xl overflow-hidden border ' +
                        (isCenter
                          ? 'border-[#C49A38]/40 bg-[#1A1714]'
                          : 'border-white/10 bg-[#1A1714]/80')
                      }
                    >
                      {/* Thumbnail */}
                      <div className="relative aspect-[4/3] bg-black/50 overflow-hidden">
                        {thumb ? (
                          <Image
                            src={thumb}
                            alt={v.title}
                            fill
                            className="object-cover"
                            sizes={isCenter ? '420px' : '320px'}
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <PlayCircle className="h-12 w-12 text-white/20" />
                          </div>
                        )}

                        {/* Play Icon overlay for center card */}
                        {isCenter && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                              <PlayCircle className="h-10 w-10 text-white/80" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Info - only title + grade */}
                      <div className={isCenter ? 'p-3 space-y-1.5' : 'p-2.5 space-y-1'}>
                        <p
                          className={
                            'font-bold truncate transition-colors ' +
                            (isCenter ? 'text-sm text-white' : 'text-xs text-white/70')
                          }
                        >
                          {v.title}
                        </p>
                        <Badge
                          variant="outline"
                          className={
                            'border-[#C49A38]/30 text-[#C49A38] ' +
                            (isCenter ? 'text-[10px]' : 'text-[9px]')
                          }
                        >
                          {v.grade}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={function() { goTo('next') }}
              className="absolute right-2 sm:right-[-20px] top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-[#C49A38]/30 hover:border-[#C49A38]/50 transition-all duration-200 group"
              aria-label="الفيديو اللي بعدو"
            >
              <ChevronLeft className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
            </button>
            <button
              onClick={function() { goTo('prev') }}
              className="absolute left-2 sm:left-[-20px] top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-[#C49A38]/30 hover:border-[#C49A38]/50 transition-all duration-200 group"
              aria-label="الفيديو اللي قبله"
            >
              <ChevronRight className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
            </button>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-8">
              {videos.map(function(_v, i) {
                return (
                  <button
                    key={i}
                    onClick={function() {
                      if (!isTransitioning) {
                        setIsTransitioning(true)
                        setCurrentIndex(i)
                        setTimeout(function() { setIsTransitioning(false) }, 400)
                      }
                    }}
                    className={
                      'rounded-full transition-all duration-300 ' +
                      (i === currentIndex
                        ? 'w-8 h-2.5 bg-[#C49A38]'
                        : 'w-2.5 h-2.5 bg-white/20 hover:bg-white/40')
                    }
                    aria-label={'الذهاب للفيديو رقم ' + (i + 1)}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
