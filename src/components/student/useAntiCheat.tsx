'use client'

// ============================================================
// FILE: src/components/student/useAntiCheat.ts
// PURPOSE: (2026-و66) نظام منع الغش والتشتت الذكي — طلب المستر:
//   «يحسس لما الطالب يقلب على الجوال أو يسيب الامتحان ويودّع تحذير»
// المنطق:
//   • مراقبة مغادرة الصفحة: document.visibilitychange (تبويب/تصغير)
//     + window blur (ضغط بره النافذة/سويتش تطبيقات) — بعدّاد واحد
//     مشترك مع حارس 800ms عشان التبويب والـ blur ما يحسبوش مرتين
//   • المغادرة 1 و 2 → تحذير لطيف («رايح فين يا بطل؟ كمل امتحانك 😅»)
//   • المغادرة 3 وأكتر → خصم نقاط (بيتطبق عند التسليم في السيرفر)
//   • المغادرة 4 → تسليم الامتحان تلقائيًا (onGiveUp مرة واحدة)
// المكونات:
//   • useAntiCheat(opts) — hook بيرجع strikes + حالة المودال
//   • AntiCheatModal — مودال التحذير (بيمنع أي تفاعل لحد الضغط)
//   • AntiCheatBadge — شارة المخالفات الظاهرة فوق شاشة الحل
// ============================================================

import { useEffect, useRef, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

var MAX_AUTO_SUBMIT_STRIKES = 4 // المغادرة الرابعة → تسليم تلقائي
var PENALTY_FREE_STRIKES = 2 // أول تحذيرين بدون خصم

export interface AntiCheatOptions {
  active: boolean
  /* أول اسم مخصص للرسالة (اسم الطالب) */
  studentName?: string
  /* بيتنادى مرة واحدة لما الطالب يتجاوز الحد → سلّم الامتحان */
  onGiveUp?: () => void
  /* بيتنادى مع كل مخالفة جديدة (للتوست/اللوج) */
  onStrike?: (strikes: number) => void
}

export function useAntiCheat(opts: AntiCheatOptions) {
  var active = !!opts.active
  var [strikes, setStrikes] = useState(0)
  var [warningOpen, setWarningOpen] = useState(false)
  var strikesRef = useRef(0)
  var lastStrikeAtRef = useRef(0)
  var giveUpFiredRef = useRef(false)
  var optsRef = useRef(opts)
  optsRef.current = opts

  /* تصفير لما النظام يقفل (خلص الامتحان/خرج) */
  useEffect(function () {
    if (!active) {
      setWarningOpen(false)
    }
  }, [active])

  /* المسجل الموحد للمغادرة */
  var registerDeparture = useCallback(function () {
    var o = optsRef.current
    if (!o.active) return
    var now = Date.now()
    /* حارس التكرار: blur + visibilitychange بيحصلوا مع بعض — واحد بس */
    if (now - lastStrikeAtRef.current < 800) return
    lastStrikeAtRef.current = now

    strikesRef.current = strikesRef.current + 1
    var s = strikesRef.current
    setStrikes(s)
    setWarningOpen(true)

    try {
      if (s === 1) toast('رايح فين يا بطل؟ 😅 رجوع كمل امتحانك — إحنا معاك!', { duration: 5000 })
      else if (s === 2) toast.warning('تاني مرة! ⚠️ خد بالك — أي مغادرة بعد كده فيها خصم نقاط.', { duration: 5000 })
      else if (s === 3) toast.error('⚠️ خصم نقاط! كل مغادرة بعد كده = −5 درجات. ماتبقاش غبي وانت جاي امتحان 😤', { duration: 6000 })
    } catch (e) {}

    if (o.onStrike) {
      try { o.onStrike(s) } catch (e) {}
    }

    /* تجاوز الحد → تسليم تلقائي مرة واحدة */
    if (s >= MAX_AUTO_SUBMIT_STRIKES && !giveUpFiredRef.current) {
      giveUpFiredRef.current = true
      if (o.onGiveUp) {
        try { o.onGiveUp() } catch (e) {}
      }
    }
  }, [])

  /* المراقبة — visibilitychange + blur */
  useEffect(function () {
    if (!active) return
    var onVis = function () {
      if (document.visibilityState === 'hidden') registerDeparture()
    }
    var onBlur = function () {
      /* blur مع الصفحة لسه ظاهرة = سويتش تطبيق/ضغط بره النافذة */
      if (document.visibilityState === 'visible') registerDeparture()
      /* لو hidden → onVis هيسجلها */
    }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('blur', onBlur)
    return function () {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('blur', onBlur)
    }
  }, [active, registerDeparture])

  var dismissWarning = useCallback(function () { setWarningOpen(false) }, [])

  return {
    strikes: strikes,
    maxStrikes: MAX_AUTO_SUBMIT_STRIKES,
    penaltyFreeStrikes: PENALTY_FREE_STRIKES,
    penaltyPoints: Math.max(0, strikes - PENALTY_FREE_STRIKES) * 5,
    warningOpen: warningOpen,
    dismissWarning: dismissWarning,
    reset: function () { strikesRef.current = 0; giveUpFiredRef.current = false; setStrikes(0); setWarningOpen(false) },
  }
}

/* مودال التحذير — بيقفل الشاشة لحد ما الطالب يضغط رجعت */
export function AntiCheatModal({ open, strikes, studentName, onDismiss }: { open: boolean; strikes: number; studentName?: string; onDismiss: () => void }) {
  var first = strikes <= 1
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          dir="rtl"
        >
          <motion.div
            initial={{ scale: 0.85, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            className={`w-full max-w-sm rounded-2xl border-2 p-6 text-center shadow-2xl ${first ? 'bg-card border-amber-400' : 'bg-card border-rose-400'}`}
          >
            <div className="text-5xl mb-3">{first ? '👀' : '⚠️'}</div>
            <h3 className={`text-xl font-black mb-2 ${first ? 'text-amber-600' : 'text-rose-600'}`}>
              {first ? 'رايح فين يا بطل؟' : 'بالتالي بجد!'}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {first
                ? 'سيبت الامتحان لحظة! ' + (studentName ? ('يا ' + studentName) : 'يا صاحبي') + ' — كمل امتحانك، محدش بيسيب امتحانه في النص 😅'
                : 'دي المغادرة رقم ' + strikes + '. لو عدّيت ' + 4 + ' مغادرات الامتحان هيتسلم لوحده، وكل مغادرة بعد التانية بتفصلك 5 درجات!'}
            </p>
            <div className="flex items-center justify-center gap-1.5 mb-4">
              {[1, 2, 3, 4].map(function (n) {
                return (
                  <span key={n} className={`h-2.5 w-2.5 rounded-full ${n <= strikes ? 'bg-rose-500' : 'bg-muted'}`} />
                )
              })}
            </div>
            <Button onClick={onDismiss} className="w-full h-12 text-base font-bold">
              رجعت أكمل الامتحان 💪
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* شارة المخالفات — بتتحط في هيدر شاشة الحل */
export function AntiCheatBadge({ strikes, maxStrikes }: { strikes: number; maxStrikes: number }) {
  if (strikes <= 0) return null
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/40 px-2.5 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-400" title="مخالفات مغادرة الامتحان">
      👁 {strikes}/{maxStrikes}
    </span>
  )
}
