"use client";

import { SmallRosette } from "./Ornaments";

/** حِكم وأمثال عربية خالدة تمرّ في شريط متحرك */
const PROVERBS = [
  "خير الكلام ما قلّ ودلّ",
  "العلم في الصغر كالنقش على الحجر",
  "من جدّ وجد، ومن زرع حصد",
  "الصبر مفتاح الفرج",
  "العقل السليم في الجسم السليم",
  "الأدب أشرف الخلايق",
  "ربّ الكلمة طبيبة، وربّ الكلمة سقم",
  "اطلب العلم من المهد إلى اللحد",
  "اللسان العربي بحرٌ لا ساحل له",
];

export function ProverbsMarquee() {
  const row = [...PROVERBS, ...PROVERBS];
  return (
    <div
      className="marquee-hover-pause relative overflow-hidden border-y border-gold-500/25 bg-night-700/80 py-3.5"
      dir="rtl"
      aria-label="حكم وأمثال عربية"
    >
      {/* تلاشي الحواف */}
      <div className="pointer-events-none absolute inset-y-0 start-0 z-10 w-20 bg-gradient-to-l from-transparent to-night-800" />
      <div className="pointer-events-none absolute inset-y-0 end-0 z-10 w-20 bg-gradient-to-r from-transparent to-night-800" />

      <div className="flex w-max animate-marquee items-center gap-8">
        {row.map((p, i) => (
          <div key={i} className="flex items-center gap-8">
            <p className="whitespace-nowrap font-amiri text-lg text-gold-200/90 sm:text-xl">
              «{p}»
            </p>
            <SmallRosette className="shrink-0 text-gold-500/70" />
          </div>
        ))}
      </div>
    </div>
  );
}
