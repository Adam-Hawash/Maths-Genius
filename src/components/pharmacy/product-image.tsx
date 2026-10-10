'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  src?: string
  alt: string
  emoji: string
  /** كلاسات للحاوية الخارجية (تحدد المقاس) */
  className?: string
  /** كلاسات للصورة الداخلية */
  imgClassName?: string
  /** تكبير ناعم عند مرور الماوس (zoom ناعم) */
  zoomOnHover?: boolean
  /** الحجم التقريبي للإيموجي في حالة الـ fallback */
  emojiClassName?: string
  /** تحميل مؤجل للصور خارج الشاشة */
  eager?: boolean
  sizesHint?: string
}

/**
 * عرض صورة منتج بشكل احترافي:
 * - skeleton أثناء التحميل
 * - fallback أنيق (تدرج + إيموجي) لو مفيش صورة أو فشل التحميل
 * - lazy loading افتراضيًا + fade-in ناعم
 */
export function ProductImage({
  src,
  alt,
  emoji,
  className,
  imgClassName,
  zoomOnHover = false,
  emojiClassName = 'text-5xl',
  eager = false,
}: Props) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(
    src ? 'loading' : 'error'
  )
  const showImage = src && status !== 'error'

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-gradient-to-b from-secondary/80 to-background',
        className
      )}
    >
      {/* Skeleton أثناء التحميل */}
      {showImage && status === 'loading' && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-b from-muted to-secondary/50" aria-hidden="true" />
      )}

      {/* Fallback إيموجي */}
      {!showImage && (
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <span className={cn('select-none opacity-90', emojiClassName)}>{emoji || '💊'}</span>
        </div>
      )}

      {/* الصورة الحقيقية */}
      {src && (
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          className={cn(
            'h-full w-full object-cover transition-[opacity,transform] duration-500 ease-out',
            status === 'loaded' ? 'opacity-100' : 'opacity-0',
            zoomOnHover && 'group-hover:scale-110',
            imgClassName
          )}
        />
      )}
    </div>
  )
}
