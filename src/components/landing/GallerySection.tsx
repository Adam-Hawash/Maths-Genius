'use client'

import { useAppStore } from '@/stores/app-store'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Camera, Trash2, Heart, Users, ImagePlus, PlayCircle, Film, X } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import type { GalleryImage } from '@/stores/app-store'

function ImageWithSkeleton({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  return (
    <div className="w-full h-full">
      {!loaded && !error && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-muted-foreground/10 to-muted" />
      )}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover transition-all duration-500 absolute inset-0"
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <ImagePlus className="h-8 w-8 text-muted-foreground/30" />
        </div>
      )}
    </div>
  )
}

function getVideoEmbedUrl(url: string) {
  var yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/)
  if (yt) return 'https://www.youtube.com/embed/' + yt[1]
  var fb = url.match(/facebook\.com\/.*\/videos\/(\d+)/)
  if (fb) return 'https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(url)
  return url
}

function getVideoThumb(url: string) {
  var yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/)
  if (yt) return 'https://img.youtube.com/vi/' + yt[1] + '/mqdefault.jpg'
  return ''
}

export default function GallerySection() {
  const { siteConfig, isAdminLoggedIn } = useAppStore()
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [videoModal, setVideoModal] = useState<string | null>(null)

  const galleryTitle =
    siteConfig.gallery_title ||
    'معرض الصور لطلابي وأبنائي الأعزاء | Photos of My Beloved Students'
  const gallerySubtitle =
    siteConfig.gallery_subtitle ||
    'لحظات مميزة من رحلتنا التعليمية — Moments from our educational journey'

  const fetchImages = useCallback(() => {
    fetch('/api/gallery')
      .then((r) => r.json())
      .then((d) => {
        setImages(d.images || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setImages((prev) => prev.filter((img) => img.id !== id))
      }
    } catch {
      // silently fail
    }
  }

  var onlyImages = images.filter(function(img) { return img.type !== 'video' })
  var onlyVideos = images.filter(function(img) { return img.type === 'video' })
  var imageCount = onlyImages.length
  var videoCount = onlyVideos.length

  // Show placeholder when no items
  if (!loading && images.length === 0) {
    return (
      <section className="py-16 sm:py-20 bg-muted/30" dir="rtl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-12 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Camera className="h-4 w-4" />
              <span>المعرض | Gallery</span>
            </div>
            <h2 className="text-2xl font-bold sm:text-3xl text-foreground">
              {galleryTitle}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              {gallerySubtitle}
            </p>
          </div>
          <div className="max-w-lg mx-auto text-center py-16">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Camera className="h-10 w-10 text-primary/60" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              سيتم عرض صور وفيديوهات طلابي الأبطال هنا
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              لحظات مميزة من رحلتنا التعليمية مع أبنائنا الطلاب الأبطال
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 sm:py-20 bg-muted/30" dir="rtl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Camera className="h-4 w-4" />
            <span>المعرض | Gallery</span>
          </div>
          <h2 className="text-2xl font-bold sm:text-3xl text-foreground">
            {galleryTitle}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            {gallerySubtitle}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[9/16] rounded-xl overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-border/50 bg-card cursor-pointer"
                <div className="w-full h-full animate-pulse bg-gradient-to-br from-muted via-muted-foreground/10 to-muted" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* ========== قسم الصور ========== */}
            {imageCount > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <ImagePlus className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">صور الطلاب | Student Photos</h3>
                    <p className="text-xs text-muted-foreground">{imageCount} صورة</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {onlyImages.map((img, index) => (
                    <div
                      key={img.id}
                      className="aspect-square rounded-xl overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-border/50 bg-card"
                    >
                      <div className="relative w-full h-full overflow-hidden">
                        <ImageWithSkeleton
                          src={img.filePath}
                          alt={img.title || 'صورة ' + (index + 1)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                          <p className="text-white text-xs font-medium truncate">
                            {img.title || 'صورة ' + (index + 1)}
                          </p>
                        </div>
                        <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                          <Badge variant="secondary" className="bg-black/40 text-white border-0 text-[10px] backdrop-blur-sm">
                            <Heart className="h-3 w-3 ml-1" />
                            {String(index + 1).padStart(2, '0')}
                          </Badge>
                        </div>
                        {isAdminLoggedIn && (
                          <button
                            onClick={() => handleDelete(img.id)}
                            className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-destructive/90 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-destructive backdrop-blur-sm z-20"
                            aria-label={'حذف ' + (img.title || 'عنصر')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========== قسم الفيديوهات ========== */}
            {videoCount > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Film className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">فيديوهات الطلاب | Student Videos</h3>
                    <p className="text-xs text-muted-foreground">{videoCount} فيديو</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {onlyVideos.map((img, index) => {
                    var thumb = getVideoThumb(img.videoUrl) || img.filePath || ''
                    return (
                      <div
                        key={img.id}
                        className="aspect-video rounded-xl overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-border/50 bg-card cursor-pointer"
                        onClick={function() { setVideoModal(img.videoUrl) }}
                      >
                        <div className="relative w-full h-full overflow-hidden">
                          {thumb ? (
                            <img src={thumb} alt={img.title || 'فيديو ' + (index + 1)} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <Film className="h-10 w-10 text-muted-foreground/30" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                            <p className="text-white text-xs font-medium truncate">
                              {img.title || 'فيديو ' + (index + 1)}
                            </p>
                          </div>
                          <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                            <Badge variant="secondary" className="bg-primary/80 text-white border-0 text-[10px] backdrop-blur-sm">
                              <Film className="h-3 w-3 ml-1" />
                              فيديو
                            </Badge>
                          </div>
                          {/* Play Button */}
                          <div className="absolute inset-0 flex items-center justify-center z-10">
                            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                              <PlayCircle className="h-7 w-7 text-primary ml-0.5" />
                            </div>
                          </div>
                          {isAdminLoggedIn && (
                            <button
                              onClick={function(e) { e.stopPropagation(); handleDelete(img.id) }}
                              className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-destructive/90 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-destructive backdrop-blur-sm z-20"
                              aria-label={'حذف ' + (img.title || 'عنصر')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Stats */}
        {!loading && images.length > 0 && (
          <div className="flex items-center justify-center gap-4 mt-8 text-muted-foreground text-sm">
            <span className="flex items-center gap-1.5"><ImagePlus className="h-4 w-4" />{imageCount} صورة</span>
            {videoCount > 0 && <span className="flex items-center gap-1.5"><Film className="h-4 w-4" />{videoCount} فيديو</span>}
            <span>— {images.length} عنصر</span>
          </div>
        )}
      </div>

      {/* Video Modal */}
      {videoModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={function() { setVideoModal(null) }}>
          <div className="relative w-full max-w-4xl aspect-video" onClick={function(e) { e.stopPropagation() }}>
            <button className="absolute -top-10 left-0 text-white hover:text-white/80 flex items-center gap-1 text-sm" onClick={function() { setVideoModal(null) }}>
              <X className="h-4 w-4" />إغلاق
            </button>
            <iframe
              src={getVideoEmbedUrl(videoModal)}
              className="w-full h-full rounded-xl"
              allowFullScreen
              allow="autoplay; encrypted-media"
            />
          </div>
        </div>
      )}
    </section>
  )
}
