/* ============================================================
   GeniusLoader — شاشة التحميل الرسمية لمنصة Math Genius (2026-و94)
   ============================================================
   طلب المستر: شكل التحميل في كل المنصة يبقى «لايق بمادة المنصة —
   ناس جينيس» بدل الدواير والسلاسلات العادية.

   الهوية:
   • نواة ذهبية بعلامة Σ + مدارين برموز رياضية (π √ ∞ ÷ × +) بتلفوا
   • اسم المنصة بلمعة ذهبية متحركة + تاج «ناس جينيس»
   • 3 أنماط:
       full    = شاشة كاملة fixed (بوت المنصة / صفحات مستقلة)
       inline  = بلوك جوه سيكشن أو بوابة (بورتفول الطلاب…)
       compact = سطر صغير جوه الكروت والحوارات
   ============================================================ */

import React from 'react'

type GeniusLoaderProps = {
  variant?: 'full' | 'inline' | 'compact'
  /** نص اختاري تحت اللودر — مثال: «جاري تحميل الدرس...» */
  label?: string
  className?: string
}

/* المدار الواحد: حلقة متقطعة + رموز بتفضل واقفة صح والحلقة بتلف */
function Orbit({ size }: { size: number }) {
  return (
    <div
      className="mg-orbit relative"
      style={{ ['--mg-size' as string]: size + 'px' } as React.CSSProperties}
      aria-hidden="true"
    >
      <span className="mg-glow" />
      <div className="mg-ring mg-r1">
        <span className="mg-sym s1"><i>π</i></span>
        <span className="mg-sym s2"><i>√</i></span>
        <span className="mg-sym s3"><i>∞</i></span>
      </div>
      <div className="mg-ring mg-r2">
        <span className="mg-sym t1"><i>÷</i></span>
        <span className="mg-sym t2"><i>×</i></span>
        <span className="mg-sym t3"><i>+</i></span>
      </div>
      <span className="mg-core">Σ</span>
    </div>
  )
}

function Wordmark() {
  return (
    <div className="text-center">
      <h1 className="mg-wordmark text-3xl sm:text-4xl font-black tracking-wide" dir="ltr">
        Math Genius
      </h1>
      <p className="mt-1 text-sm font-semibold text-[#8B6914] dark:text-[#E5BE5A]">
        ناس جينيس — بنصنع العباقرة
      </p>
    </div>
  )
}

function Dots() {
  return (
    <div className="mg-dots flex items-center justify-center gap-1.5" aria-hidden="true">
      <span /><span /><span />
    </div>
  )
}

export function GeniusLoader({ variant = 'inline', label, className }: GeniusLoaderProps) {
  const style = <GeniusLoaderStyle />

  /* ===== شاشة كاملة — بوت المنصة والصفحات المستقلة ===== */
  if (variant === 'full') {
    return (
      <>
        {style}
        <div className={'fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center gap-8 overflow-hidden ' + (className || '')} role="status" aria-live="polite">
        {/* رموز رياضية عايمة في الخلفية */}
        <div className="mg-floaters" aria-hidden="true">
          <span className="f1">π</span><span className="f2">∑</span><span className="f3">√</span>
          <span className="f4">∞</span><span className="f5">÷</span><span className="f6">Δ</span>
        </div>
        <Orbit size={190} />
        <Wordmark />
        <div className="flex flex-col items-center gap-3">
          <Dots />
          <p className="text-muted-foreground text-sm">{label || 'جاري التحميل...'}</p>
        </div>
      </div>
      </>
    )
  }

  /* ===== سطر صغير — جوه الكروت والحالات الجانبية ===== */
  if (variant === 'compact') {
    return (
      <>
        {style}
        <div className={'flex items-center justify-center gap-3 py-6 ' + (className || '')} role="status" aria-live="polite">
          <Orbit size={48} />
          {label ? <p className="text-sm font-medium text-muted-foreground">{label}</p> : null}
        </div>
      </>
    )
  }

  /* ===== inline — بلوك جوه السيكشن ===== */
  return (
    <>
      {style}
      <div className={'flex flex-col items-center justify-center gap-5 py-14 ' + (className || '')} role="status" aria-live="polite">
        <Orbit size={130} />
        {label ? <p className="text-muted-foreground text-sm font-medium">{label}</p> : null}
        <Dots />
      </div>
    </>
  )
}

/* ===== الستايل — ذاتي بالكامل (مفيش تعديل على globals.css) ===== */
function GeniusLoaderStyle() {
  return (
    <style>{`
      .mg-orbit { width: var(--mg-size); height: var(--mg-size); }
      .mg-glow {
        position: absolute; inset: -18%; border-radius: 9999px;
        background: radial-gradient(circle, rgba(196,154,56,.22) 0%, rgba(196,154,56,0) 65%);
        animation: mg-glow-pulse 2.4s ease-in-out infinite;
      }
      .mg-ring {
        position: absolute; border-radius: 9999px;
        border: 1.5px dashed rgba(196,154,56,.4);
        animation: mg-spin 9s linear infinite;
      }
      .mg-r1 { inset: 0; }
      .mg-r2 { inset: 17%; border-color: rgba(196,154,56,.28); animation: mg-spin-rev 6.5s linear infinite; }
      /* الرموز بتقف على الحلقة، والدوران العكسي بيخليها واقفة صح دايمًا */
      .mg-sym {
        position: absolute; width: 1.9em; height: 1.9em;
        display: flex; align-items: center; justify-content: center;
        font-size: calc(var(--mg-size) * 0.11); color: #C49A38;
        animation: inherit; animation-direction: reverse;
      }
      .mg-sym i { font-style: normal; font-weight: 700; line-height: 1; }
      .mg-r1 .mg-sym { color: #C49A38; }
      .mg-r2 .mg-sym { color: #8B6914; font-size: calc(var(--mg-size) * 0.095); }
      .dark .mg-r2 .mg-sym { color: #E5BE5A; }
      .dark .mg-r1 .mg-sym { color: #E5BE5A; }
      .mg-sym.s1 { top: -.95em; left: calc(50% - .95em); }
      .mg-sym.s2 { top: calc(50% - .95em); right: -.95em; }
      .mg-sym.s3 { bottom: -.95em; left: calc(50% - .95em); }
      .mg-sym.t1 { top: calc(50% - .95em); left: -.95em; }
      .mg-sym.t2 { bottom: -.8em; right: -.8em; }
      .mg-sym.t3 { top: -.8em; right: -.8em; }
      .mg-core {
        position: absolute; top: 50%; left: 50%;
        width: 42%; height: 42%;
        transform: translate(-50%, -50%);
        display: flex; align-items: center; justify-content: center;
        font-size: calc(var(--mg-size) * 0.19); font-weight: 900; color: #fff;
        border-radius: 28%;
        background: linear-gradient(135deg, #F2D57E 0%, #C49A38 48%, #8B6914 100%);
        box-shadow: 0 6px 22px rgba(196,154,56,.45), inset 0 1px 2px rgba(255,255,255,.55);
        text-shadow: 0 1px 3px rgba(0,0,0,.25);
        animation: mg-core-beat 2.4s ease-in-out infinite;
      }
      .mg-wordmark {
        background: linear-gradient(100deg, #8B6914 18%, #C49A38 38%, #FFF3C4 50%, #C49A38 62%, #8B6914 82%);
        background-size: 220% 100%;
        -webkit-background-clip: text; background-clip: text; color: transparent;
        animation: mg-shine 2.8s linear infinite;
      }
      .mg-dots span {
        width: .5rem; height: .5rem; border-radius: 9999px; background: #C49A38;
        animation: mg-bob 1.1s ease-in-out infinite;
      }
      .mg-dots span:nth-child(2) { animation-delay: .16s; }
      .mg-dots span:nth-child(3) { animation-delay: .32s; }
      .mg-floaters { position: absolute; inset: 0; pointer-events: none; }
      .mg-floaters span {
        position: absolute; font-weight: 800; color: rgba(196,154,56,.13);
        animation: mg-float 7s ease-in-out infinite;
      }
      .mg-floaters .f1 { top: 12%; left: 10%; font-size: 3.4rem; }
      .mg-floaters .f2 { top: 18%; right: 12%; font-size: 4rem; animation-delay: .8s; }
      .mg-floaters .f3 { bottom: 22%; left: 14%; font-size: 3rem; animation-delay: 1.6s; }
      .mg-floaters .f4 { bottom: 14%; right: 10%; font-size: 3.8rem; animation-delay: 2.4s; }
      .mg-floaters .f5 { top: 44%; left: 4%;  font-size: 2.6rem; animation-delay: 3.2s; }
      .mg-floaters .f6 { top: 40%; right: 5%; font-size: 2.8rem; animation-delay: 4s; }
      @keyframes mg-spin { to { transform: rotate(360deg); } }
      @keyframes mg-spin-rev { to { transform: rotate(-360deg); } }
      @keyframes mg-glow-pulse { 0%, 100% { opacity: .55; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }
      @keyframes mg-core-beat { 0%, 100% { transform: translate(-50%,-50%) scale(1); } 50% { transform: translate(-50%,-50%) scale(1.06); } }
      @keyframes mg-shine { from { background-position: 130% 0; } to { background-position: -130% 0; } }
      @keyframes mg-bob { 0%, 100% { transform: translateY(0); opacity: .4; } 50% { transform: translateY(-6px); opacity: 1; } }
      @keyframes mg-float { 0%, 100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-16px) rotate(5deg); } }
      @media (prefers-reduced-motion: reduce) {
        .mg-ring, .mg-sym, .mg-glow, .mg-core, .mg-wordmark, .mg-dots span, .mg-floaters span { animation: none !important; }
      }
    `}</style>
  )
}
