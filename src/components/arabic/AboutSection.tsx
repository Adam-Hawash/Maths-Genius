"use client";

import { Quote } from "lucide-react";
import { Emblem, OrnamentDivider, SmallRosette } from "./Ornaments";

export function AboutSection() {
  return (
    <section id="about" className="relative py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <span className="font-kufi text-sm tracking-widest text-gold-400">✦ عن المستر ✦</span>
          <h2 className="mt-3 font-ruqaa text-3xl font-bold leading-relaxed text-gold-gradient sm:text-4xl">
            الأستاذ محمد صبري
          </h2>
          <OrnamentDivider width={280} className="mt-2 max-w-full" />
        </div>

        <div className="mt-12 grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          {/* بطاقة اقتباس */}
          <div className="frame-ornate relative rounded-xl bg-card/80 p-8 text-center glow-gold-soft">
            <Quote className="absolute -top-4 start-6 size-8 rounded-full border border-gold-500/40 bg-night-700 p-1.5 text-gold-400" />
            <p className="font-amiri text-2xl leading-[2.2] text-cream/90">
              «اللغة العربية بحرٌ من الجمال.. من أخلص له في التعلّم، أنعشه
              الإتقان، وأدخله بهجة الفصاحة»
            </p>
            <div className="mt-5 flex items-center justify-center gap-3 text-gold-500/80">
              <span className="h-px w-12 bg-gold-500/40" />
              <SmallRosette />
              <span className="h-px w-12 bg-gold-500/40" />
            </div>
          </div>

          {/* نبذة */}
          <div className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-start">
            <Emblem size={64} className="glow-gold" />
            <p className="leading-9 text-cream/80 sm:text-lg">
              معلم لغة عربية يؤمن أن العربية ليست مادة تُحفظ، بل فنّ يُتقن
              وذوقٌ يُصقل. يجمع في شرحه بين رصانة القواعد وبساطة العرض، فيقرب
              النحو والإعراب لنفوس الطلاب بأسلوب عصري محبوب.
            </p>
            <p className="leading-9 text-cream/65">
              من خلال هذه المنصّة يقدّم الدروس والواجبات والامتحانات الإلكترونية
              ومتابعة مستمرة لكل طالب — ليخرج الطالب متقنًا لغة الداد، فخورًا
              بها.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 lg:justify-start">
              {["نحو مبسّط", "إعراب واضح", "أدب راقٍ", "متابعة مستمرة"].map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-gold-500/25 bg-white/[0.04] px-4 py-1.5 font-kufi text-sm text-gold-200/90"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
