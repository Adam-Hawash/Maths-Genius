"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import {
  Lock,
  Play,
  Search,
  CreditCard,
  CheckCircle2,
  BookOpen,
  AlertCircle,
} from "lucide-react";

const GRADES = [
  "كل الصفوف",
  "الصف الأول الثانوي",
  "الصف الثاني الثانوي",
  "الصف الثالث الثانوي",
];

export default function VideosLibraryPage() {
  const { student, loading: authLoading } = useAuth();

  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [grade, setGrade] = useState("كل الصفوف");
  const [keyword, setKeyword] = useState("");

  const loadVideos = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const query = new URLSearchParams();
      if (grade !== "كل الصفوف") query.set("grade", grade);
      if (keyword.trim()) query.set("keyword", keyword.trim());
      // The API needs the student id to decide which paid lessons are unlocked.
      if (student?.id) query.set("studentId", student.id);
      query.set("pageSize", "60");

      const res = await fetch(`/api/videos?${query.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل تحميل الدروس");

      setVideos(Array.isArray(data.videos) ? data.videos : []);
    } catch (err: any) {
      setErrorMsg(err.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }, [grade, keyword, student?.id]);

  useEffect(() => {
    if (authLoading) return;
    loadVideos();
  }, [authLoading, loadVideos]);

  const hasFreePass = student?.isPaidAccess === true;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8" dir="rtl">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
          <BookOpen className="w-4 h-4 text-blue-600" />
          مكتبة الدروس
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 text-balance">
          كل دروس الرياضيات في مكان واحد
        </h1>
        <p className="text-slate-600 text-sm max-w-xl leading-relaxed">
          اختر صفك الدراسي وابدأ المشاهدة. الدروس المجانية متاحة للجميع، والدروس
          المدفوعة تُفتح فوراً بعد اعتماد الدفع.
        </p>
      </header>

      {hasFreePass && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          حسابك مفعّل باشتراك شامل — جميع الدروس متاحة لك.
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3.5" />
          <input
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="ابحث باسم الدرس..."
            aria-label="ابحث باسم الدرس"
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          aria-label="اختر الصف الدراسي"
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {GRADES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm font-bold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-3xl border border-slate-200 bg-white overflow-hidden animate-pulse"
            >
              <div className="aspect-video bg-slate-100" />
              <div className="p-5 flex flex-col gap-3">
                <div className="h-4 rounded bg-slate-100" />
                <div className="h-3 w-2/3 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="py-16 text-center rounded-3xl border border-dashed border-slate-300 bg-slate-50">
          <BookOpen className="w-10 h-10 mx-auto text-slate-400" />
          <p className="mt-3 font-bold text-slate-700">لا توجد دروس مطابقة</p>
          <p className="text-sm text-slate-500 mt-1">
            جرّب تغيير الصف الدراسي أو كلمة البحث.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => {
            const price = Number(video.price || 0);
            const isFree = price <= 0;
            const isLocked = !isFree && !hasFreePass && video.isPurchased !== true;

            return (
              <article
                key={video.id}
                className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="aspect-video bg-slate-950 relative flex items-center justify-center">
                  {video.thumbnail ? (
                    <img
                      src={video.thumbnail || "/placeholder.svg"}
                      alt={`صورة الدرس: ${video.title}`}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/45">
                    {isLocked ? (
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
                        <Lock className="w-6 h-6 text-amber-300" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center">
                        <Play className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 flex flex-col gap-3 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs bg-blue-50 text-blue-800 font-bold px-2.5 py-1 rounded-lg">
                      {video.grade || "غير محدد"}
                    </span>
                    {isFree ? (
                      <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded-lg">
                        مجاني
                      </span>
                    ) : isLocked ? (
                      <span className="text-xs bg-amber-50 text-amber-900 font-bold px-2.5 py-1 rounded-lg">
                        {price} ج.م
                      </span>
                    ) : (
                      <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> مفعّل
                      </span>
                    )}
                  </div>

                  <h2 className="font-extrabold text-slate-900 leading-relaxed text-pretty">
                    {video.title}
                  </h2>

                  <div className="mt-auto pt-2">
                    {isLocked ? (
                      <Link
                        href={`/payment?videoId=${video.id}&price=${price}&title=${encodeURIComponent(video.title)}`}
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors"
                      >
                        <CreditCard className="w-4 h-4" />
                        تفعيل الدرس
                      </Link>
                    ) : (
                      <Link
                        href={`/videos/${video.id}`}
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition-colors"
                      >
                        <Play className="w-4 h-4" />
                        مشاهدة الدرس
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
