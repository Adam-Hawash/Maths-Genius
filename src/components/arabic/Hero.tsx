"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  BookOpenText,
  ClipboardCheck,
  ChevronDown,
  NotebookPen,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Emblem, OrnamentDivider, CornerOrnament, SmallRosette } from "./Ornaments";

const FEATURES = [
  { icon: BookOpenText, label: "دروس مشروحة" },
  { icon: NotebookPen, label: "واجبات دورية" },
  { icon: ClipboardCheck, label: "امتحانات تفاعلية" },
  { icon: TrendingUp, label: "متابعة تقدّم" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 26 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function Hero() {
  return (
    <section
      id="home"
      className="relative flex min-h-screen items-center overflow-hidden"
    >
      {/* ===== الخلفية المزخرفة ===== */}
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src="/images/hero-pattern.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* تدرجات إخفاء لدمج الصورة مع لون المنصة */}
        <div className="absolute inset-0 bg-gradient-to-b from-night-800/85 via-night-800/70 to-night-800" />
        <div className="absolute inset-0 bg-gradient-to-l from-night-800/70 via-transparent to-night-800/70" />
        <div className="absolute inset-0 pattern-glow-top" />
      </div>

      {/* زوايا الإطار المزخرف */}
      <CornerOrnament className="absolute start-3 top-20 hidden opacity-40 md:block" />
      <CornerOrnament className="absolute end-3 top-20 hidden opacity-40 md:block" flipX />
      <CornerOrnament className="absolute bottom-4 start-3 hidden opacity-25 md:block" flipY />
      <CornerOrnament className="absolute bottom-4 end-3 hidden opacity-25 md:block" flipX flipY />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 px-4 pb-24 pt-32 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8 lg:pt-28">
        {/* ===== العمود النصي ===== */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center text-center lg:items-start lg:text-start"
        >
          {/* البسملة */}
          <motion.div variants={item} className="flex items-center gap-4">
            <span className="h-px w-14 bg-gradient-to-l from-gold-500/70 to-transparent sm:w-20" />
            <p className="font-amiri text-lg text-gold-300/95 sm:text-xl">
              بسم الله الرحمن الرحيم
            </p>
            <span className="h-px w-14 bg-gradient-to-r from-gold-500/70 to-transparent sm:w-20" />
          </motion.div>

          {/* القلادة */}
          <motion.div variants={item} className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 scale-125 rounded-full bg-gold-500/15 blur-2xl animate-pulse-glow" aria-hidden="true" />
              <Emblem size={92} className="glow-gold relative" />
            </div>
          </motion.div>

          {/* الاسم المزخرف */}
          <motion.h1
            variants={item}
            className="mt-6 font-ruqaa text-5xl font-bold leading-[1.7] text-gold-gradient drop-shadow-[0_4px_24px_rgba(212,168,67,0.25)] sm:text-6xl lg:text-7xl lg:leading-[1.6]"
          >
            مستر محمد صبري
          </motion.h1>

          {/* الفاصل المزخرف */}
          <motion.div variants={item} className="my-2">
            <OrnamentDivider width={340} className="max-w-full" />
          </motion.div>

          {/* المادة */}
          <motion.h2
            variants={item}
            className="font-kufi text-2xl font-semibold tracking-wide text-cream sm:text-3xl"
          >
            مادة اللغة العربية
          </motion.h2>

          {/* الوصف */}
          <motion.p
            variants={item}
            className="mt-5 max-w-xl leading-8 text-cream/75 sm:text-lg"
          >
            منصّة متكاملة لتعلّم العربية بأسلوب راقٍ ومحبوب: نحو مبسّط، إعراب
            واضح، وأدب يلامس الحياة — رحلة إتقان تبدأ من هنا.
          </motion.p>

          {/* أزرار */}
          <motion.div variants={item} className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Button
              asChild
              size="lg"
              className="h-12 bg-gold-500 px-7 font-kufi text-base font-semibold text-night-900 shadow-[0_8px_30px_rgba(212,168,67,0.35)] transition-all hover:bg-gold-400 hover:shadow-[0_8px_40px_rgba(212,168,67,0.5)]"
            >
              <a href="#lessons">
                استكشف الدروس
                <ChevronDown className="size-5" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 border-gold-500/45 bg-transparent px-7 font-kufi text-base text-gold-300 hover:bg-gold-500/10 hover:text-gold-200"
            >
              <a href="#news">آخر الأخبار</a>
            </Button>
          </motion.div>

          {/* شرائح المميزات */}
          <motion.ul variants={item} className="mt-9 flex flex-wrap items-center justify-center gap-2.5 lg:justify-start">
            {FEATURES.map((f) => (
              <li
                key={f.label}
                className="flex items-center gap-2 rounded-full border border-gold-500/25 bg-white/[0.04] px-4 py-2 text-sm text-cream/85 backdrop-blur-sm transition-colors hover:border-gold-500/50 hover:text-gold-200"
              >
                <f.icon className="size-4 text-gold-400" />
                {f.label}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        {/* ===== صورة المستر (إطار التذهيب) ===== */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-[340px] sm:max-w-[380px] lg:max-w-[420px]"
        >
          <div className="animate-float-slow">
            <div className="rounded-2xl bg-gradient-to-b from-gold-400 via-gold-600 to-gold-400 p-[3px] shadow-[0_25px_80px_rgba(0,0,0,0.5)]">
              <div className="rounded-[13px] bg-night-700 p-2">
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
                  <Image
                    src="/images/teacher-placeholder.jpg"
                    alt="صورة المستر المؤقتة — إطار تذهيب مزخرف"
                    fill
                    sizes="(max-width: 640px) 90vw, 420px"
                    className="object-cover"
                  />
                  {/* كلمات عربية فوق الإطار — تُستبدل بصورة المستر لاحقًا */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-night-800/35 p-6 text-center">
                    <span className="font-amiri text-4xl font-bold leading-relaxed text-gold-gradient sm:text-5xl">
                      اللغة العربية
                    </span>
                    <SmallRosette className="text-gold-400" />
                    <span className="font-kufi text-sm text-cream/90 sm:text-base">
                      أ / محمد صبري
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-4 text-center font-kufi text-xs text-cream/50">
              مكان صورة المستر — تُستبدل بالصورة الرسمية قريبًا
            </p>
          </div>
        </motion.div>
      </div>

      {/* مؤشر النزول */}
      <a
        href="#features"
        className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 text-gold-400/80 transition-colors hover:text-gold-300"
        aria-label="انتقل للأسفل"
      >
        <ChevronDown className="size-8 animate-bounce-soft" />
      </a>
    </section>
  );
}
