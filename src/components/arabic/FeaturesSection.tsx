"use client";

import { BookOpenText, ClipboardCheck, NotebookPen, TrendingUp } from "lucide-react";
import { OrnamentDivider } from "./Ornaments";

const FEATURES = [
  {
    icon: BookOpenText,
    title: "دروس مشروحة",
    desc: "شرح مبسّط ومحبوب لقواعد النحو والبلاغة والأدب، يوصّل الفكرة من أول مرة.",
  },
  {
    icon: NotebookPen,
    title: "واجبات دورية",
    desc: "تدريبات منتظمة على كل درس تثبّت المعلومة وتحفّز الطالب على الممارسة.",
  },
  {
    icon: ClipboardCheck,
    title: "امتحانات تفاعلية",
    desc: "امتحانات إلكترونية بتصحيح فوري تُعوّد الطالب نماذج الأسئلة الحقيقية.",
  },
  {
    icon: TrendingUp,
    title: "متابعة مستمرة",
    desc: "متابعة دقيقة لمستوى كل طالب وتقارير تقدّم تُطمئن الطالب وولي الأمر.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* عنوان القسم */}
        <div className="flex flex-col items-center text-center">
          <span className="font-kufi text-sm tracking-widest text-gold-400">✦ مميزات المنصة ✦</span>
          <h2 className="mt-3 font-ruqaa text-3xl font-bold leading-relaxed text-gold-gradient sm:text-4xl">
            لماذا منصة مستر محمد صبري؟
          </h2>
          <OrnamentDivider width={280} className="mt-2 max-w-full" />
        </div>

        {/* البطاقات */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group frame-ornate rounded-xl bg-card/80 p-6 text-center transition-all duration-300 hover:-translate-y-1.5 hover:bg-card"
            >
              <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-gold-500/40 bg-gold-500/10 transition-colors group-hover:bg-gold-500/20">
                <f.icon className="size-7 text-gold-400" />
              </div>
              <h3 className="mt-4 font-kufi text-lg font-semibold text-cream">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-cream/65">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
