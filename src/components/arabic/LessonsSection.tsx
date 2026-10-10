"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpenText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OrnamentDivider } from "./Ornaments";

type Lesson = {
  id: string;
  title: string;
  grade: string;
  description: string;
  url: string | null;
  createdAt: string;
};

export function LessonsSection() {
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [activeGrade, setActiveGrade] = useState<string>("الكل");

  useEffect(() => {
    let alive = true;
    fetch("/api/lessons")
      .then((r) => r.json())
      .then((d) => {
        if (alive) setLessons(Array.isArray(d.lessons) ? d.lessons : []);
      })
      .catch(() => alive && setLessons([]));
    return () => {
      alive = false;
    };
  }, []);

  const grades = useMemo(() => {
    if (!lessons) return [];
    const g: string[] = [];
    for (const l of lessons) if (!g.includes(l.grade)) g.push(l.grade);
    return g;
  }, [lessons]);

  const filtered = useMemo(() => {
    if (!lessons) return [];
    if (activeGrade === "الكل") return lessons;
    return lessons.filter((l) => l.grade === activeGrade);
  }, [lessons, activeGrade]);

  return (
    <section id="lessons" className="relative py-20 sm:py-24">
      {/* خلفية متدرجة خفيفة لتمييز القسم */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-night-700/40 to-transparent"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <span className="font-kufi text-sm tracking-widest text-gold-400">✦ المحتوى التعليمي ✦</span>
          <h2 className="mt-3 font-ruqaa text-3xl font-bold leading-relaxed text-gold-gradient sm:text-4xl">
            دروس اللغة العربية
          </h2>
          <OrnamentDivider width={280} className="mt-2 max-w-full" />
        </div>

        {/* فلتر الصفوف */}
        {lessons !== null && lessons.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {["الكل", ...grades].map((g) => (
              <button
                key={g}
                onClick={() => setActiveGrade(g)}
                className={`rounded-full border px-4 py-2 font-kufi text-sm transition-all ${
                  activeGrade === g
                    ? "border-gold-500 bg-gold-500 font-semibold text-night-900 shadow-[0_4px_18px_rgba(212,168,67,0.4)]"
                    : "border-gold-500/30 bg-white/[0.03] text-cream/75 hover:border-gold-500/60 hover:text-gold-300"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        <div className="mt-10">
          {/* التحميل */}
          {lessons === null && (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-44 rounded-xl bg-night-600/60" />
              ))}
            </div>
          )}

          {/* لا توجد دروس */}
          {lessons !== null && lessons.length === 0 && (
            <div className="frame-ornate mx-auto max-w-xl rounded-xl bg-card/70 p-10 text-center">
              <BookOpenText className="mx-auto size-10 text-gold-500/70" />
              <p className="mt-4 font-amiri text-xl text-cream/85">
                سيتم إضافة الدروس قريبًا بإذن الله
              </p>
              <p className="mt-2 text-sm text-cream/50">
                جاري تجهيز محتوى الدروس لجميع الصفوف — تابعونا
              </p>
            </div>
          )}

          {/* الدروس */}
          {lessons !== null && filtered.length > 0 && (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((l) => (
                <article
                  key={l.id}
                  className="group frame-ornate flex flex-col rounded-xl bg-card/80 p-5 transition-all duration-300 hover:-translate-y-1 hover:bg-card"
                >
                  <span className="w-fit rounded-full border border-gold-500/40 bg-gold-500/10 px-3 py-1 font-kufi text-[11px] text-gold-300">
                    {l.grade}
                  </span>
                  <h3 className="mt-3 font-kufi text-lg font-semibold leading-relaxed text-cream group-hover:text-gold-300">
                    {l.title}
                  </h3>
                  {l.description && (
                    <p className="mt-2 flex-1 text-sm leading-7 text-cream/65">
                      {l.description}
                    </p>
                  )}
                  {l.url && (
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="mt-4 w-fit border-gold-500/40 font-kufi text-gold-300 hover:bg-gold-500 hover:text-night-900"
                    >
                      <a href={l.url} target="_blank" rel="noopener noreferrer">
                        فتح الدرس
                        <ExternalLink className="size-3.5" />
                      </a>
                    </Button>
                  )}
                </article>
              ))}
            </div>
          )}

          {/* الفلتر لا يطابق شيء */}
          {lessons !== null && lessons.length > 0 && filtered.length === 0 && (
            <p className="text-center text-cream/60">لا توجد دروس في هذا الصف حاليًا</p>
          )}
        </div>
      </div>
    </section>
  );
}
