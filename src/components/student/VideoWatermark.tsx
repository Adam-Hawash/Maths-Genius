'use client'
// ============================================================
// VideoWatermark — ووترمارك ديناميكي باسم الطالب ورقمه فوق الفيديو
// ============================================================
// الفكرة: أي حد يسجل الفيديو (موبايل أو برنامج) اسمه ورقمه هيبان
// جوه التسجيل — دي أقوى رادع عملي ضد إعادة نشر الفيديوهات.
// - 3 طبقات: تيل متكرر + سطر متحرك بين الأركان كل 14 ثانية
// - pointer-events-none فمش بيمنع أي تفاعل مع الفيديو
// - بيرجع يترسم كل 6 ثواني لو حد شاله من الـ DOM بالـ devtools
// ============================================================
import { useEffect, useRef, useState } from 'react'

export function VideoWatermark({ name, phone }: { name?: string; phone?: string }) {
  const layerRef = useRef<HTMLDivElement>(null)
  const [tick, setTick] = useState(0)

  useEffect(function () {
    // حركة السطر المتحرك
    const moveTimer = setInterval(function () { setTick(function (t) { return t + 1 }) }, 14000)
    // إعادة رسم لو حد شال الطبقة من الـ DOM
    const healTimer = setInterval(function () {
      if (layerRef.current && !document.body.contains(layerRef.current)) setTick(function (t) { return t + 1 })
    }, 6000)
    return function () { clearInterval(moveTimer); clearInterval(healTimer) }
  }, [])

  const label = [name || 'طالب', phone ? phone.slice(-3) + '•' + phone.slice(0, 4) : ''].filter(Boolean).join(' • ')
  if (!label) return null

  // الأركان اللي بيلف عليها السطر
  const corners = [
    { top: '8%', left: '6%' },
    { top: '8%', right: '6%' },
    { bottom: '14%', left: '6%' },
    { bottom: '14%', right: '6%' },
  ]
  const pos = corners[tick % corners.length]
  const svgTile = encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="260" height="160">' +
      '<text x="12" y="80" font-size="13" fill="rgba(255,255,255,0.10)" transform="rotate(-18 130 80)" font-family="sans-serif">' +
        label.replace(/&/g, '&amp;').replace(/</g, '&lt;') +
      '</text>' +
    '</svg>'
  )

  return (
    <div
      ref={layerRef}
      data-wm="1"
      className="absolute inset-0 z-[60] pointer-events-none select-none overflow-hidden"
      style={{ backgroundImage: 'url("data:image/svg+xml,' + svgTile + '")' }}
      aria-hidden="true"
    >
      <div
        className="absolute text-[11px] sm:text-xs font-bold text-white/70 px-2 py-0.5 rounded"
        style={{
          ...pos,
          textShadow: '0 1px 3px rgba(0,0,0,0.9)',
          background: 'rgba(0,0,0,0.18)',
          transition: 'all 700ms ease',
          direction: 'rtl',
        }}
      >
        {label}
      </div>
    </div>
  )
}
