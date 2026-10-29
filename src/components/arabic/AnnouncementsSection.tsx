"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Megaphone, Newspaper } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { OrnamentDivider } from "./Ornaments";

type Announcement = {
  id: string;
  title: string;
  body: string;
  important: boolean;
  createdAt: string;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export function AnnouncementsSection() {
  const [items, setItems] = useState<Announcement[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/announcements")
      .then((r) => r.json())
      .then((d) => {
        if (alive) setItems(Array.isArray(d.announcements) ? d.announcements : []);
      })
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section id="news" className="relative py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <span className="font-kufi text-sm tracking-widest text-gold-400">✦ الأخبار والإعلانات ✦</span>
          <h2 className="mt-3 font-ruqaa text-3xl font-bold leading-relaxed text-gold-gradient sm:text-4xl">
            جديد المنصة
          </h2>
          <OrnamentDivider width={280} className="mt-2 max-w-full" />
        </div>

        <div className="mt-12">
          {/* حالة التحميل */}
          {items === null && (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 rounded-xl bg-night-600/60" />
              ))}
            </div>
          )}

          {/* لا توجد إعلانات */}
          {items !== null && items.length === 0 && (
            <div className="frame-ornate mx-auto max-w-xl rounded-xl bg-card/70 p-10 text-center">
              <Newspaper className="mx-auto size-10 text-gold-500/70" />
              <p className="mt-4 font-amiri text-xl text-cream/85">
                لا توجد إعلانات حاليًا — تابعونا قريبًا
              </p>
              <p className="mt-2 text-sm text-cream/50">
                كل جديد عن الدروس والامتحانات سيظهر هنا أولًا بأول
              </p>
            </div>
          )}

          {/* الإعلانات */}
          {items !== null && items.length > 0 && (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {items.slice(0, 6).map((a) => (
                <article
                  key={a.id}
                  className="group frame-ornate flex flex-col rounded-xl bg-card/80 p-5 transition-all duration-300 hover:-translate-y-1 hover:bg-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-kufi text-lg font-semibold leading-relaxed text-cream group-hover:text-gold-300">
                      {a.title}
                    </h3>
                    {a.important && (
                      <span className="shrink-0 rounded-full bg-gold-500 px-2.5 py-0.5 font-kufi text-[11px] font-bold text-night-900">
                        مهم
                      </span>
                    )}
                  </div>
                  <p className="mt-3 flex-1 text-sm leading-7 text-cream/70">{a.body}</p>
                  <div className="mt-4 flex items-center gap-2 border-t border-gold-500/15 pt-3 text-xs text-cream/45">
                    <CalendarDays className="size-3.5 text-gold-500/70" />
                    {formatDate(a.createdAt)}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
