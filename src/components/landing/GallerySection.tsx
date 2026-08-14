'use client'

import { useAppStore } from '@/stores/app-store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Camera, Trash2, Heart, Users, ImageIcon } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import type { GalleryImage } from '@/stores/app-store'

function ImageWithSkeleton({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  return (
    <div className={`relative overflow-hidden bg-muted ${className || ''}`}>
      {/* Skeleton shimmer */}
      {!loaded && !error && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-muted-foreground/10 to-muted" />
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-all duration-500 ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105 blur-sm'}`}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
        </div>
      )}
    </div>
  )
}

export default function GallerySection() {
  const { siteConfig, isAdminLoggedIn } = useAppStore()
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)

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

  // Show placeholder when no images
  if (!loading && images.length === 0) {
    return (
      <section className="py-16 sm:py-20 bg-muted/30" dir="rtl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-12 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Camera className="h-4 w-4" />
              <span>معرض الصور | Photo Gallery</span>
            </div>
            <h2 className="text-2xl font-bold sm:text-3xl text-foreground">
              {galleryTitle}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              {gallerySubtitle}
            </p>
          </div>

          {/* Professional Empty State */}
          <div className="max-w-lg mx-auto text-center py-16">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Camera className="h-10 w-10 text-primary/60" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              سيتم عرض صور طلابي الأبطال وقريباً هنا
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
        {/* Section Header */}
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Camera className="h-4 w-4" />
            <span>معرض الصور | Photo Gallery</span>
          </div>
          <h2 className="text-2xl font-bold sm:text-3xl text-foreground">
            {galleryTitle}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            {gallerySubtitle}
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden">
                <div className="w-full h-full animate-pulse bg-gradient-to-br from-muted via-muted-foreground/10 to-muted" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((img, index) => (
              <Card
                key={img.id}
                className="overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card"
              >
                <div className="relative aspect-square overflow-hidden">
                  <ImageWithSkeleton
                    src={img.filePath}
                    alt={img.title || `صورة ${index + 1}`}
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {/* Title on Hover */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <p className="text-white text-xs font-medium truncate">
                      {img.title || `صورة ${index + 1}`}
                    </p>
                  </div>
                  {/* Decorative icons on hover */}
                  <div className="absolute top-3 left-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Badge
                      variant="secondary"
                      className="bg-black/40 text-white border-0 text-[10px] backdrop-blur-sm"
                    >
                      <Heart className="h-3 w-3 ml-1" />
                      {String(index + 1).padStart(2, '0')}
                    </Badge>
                  </div>
                  {/* Delete Button - Admin Only */}
                  {isAdminLoggedIn && (
                    <button
                      onClick={() => handleDelete(img.id)}
                      className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-destructive/90 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-destructive backdrop-blur-sm"
                      aria-label={`حذف ${img.title || 'صورة'}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Bottom decorative note */}
        {!loading && images.length > 0 && (
          <div className="flex items-center justify-center gap-2 mt-8 text-muted-foreground text-sm">
            <Users className="h-4 w-4" />
            <span>
              {images.length} صورة — {images.length} photos
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
