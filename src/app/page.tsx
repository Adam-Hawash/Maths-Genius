"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lock, CreditCard, Play, Video, CheckCircle2 } from "lucide-react";
 
export default function StudentHomePage() {
  const [student, setStudent] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("mg_student") || localStorage.getItem("student") || localStorage.getItem("user");
      if (stored) setStudent(JSON.parse(stored));
    } catch (e) {}

    async function loadVideos() {
      try {
        const res = await fetch("/api/videos");
        if (res.ok) {
          const data = await res.json();
          setVideos(Array.isArray(data) ? data : data.videos || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadVideos();
  }, []);

  const hasFreePass = student?.isPaidAccess === true || student?.role === "admin";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8" dir="rtl">
      {/* رأس الصفحة */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            مرحباً، {student?.name || "طالبنا المتميز"} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">منصة الرياضيات التعليمية</p>
        </div>

        <div>
          {hasFreePass ? (
            <span className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-2xl font-black text-xs inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> اشتراك شامل مفعّل ✓
            </span>
          ) : (
            <span className="bg-amber-100 text-amber-900 px-4 py-2 rounded-2xl font-black text-xs inline-flex items-center gap-1.5">
              الحساب: نظام الدفع لكل درس
            </span>
          )}
        </div>
      </div>

      {/* قائمة الفيديوهات المقفولة والمفتوحة */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-600" /> المحاضرات والدروس
          </h2>
          <Link href="/videos" className="text-sm font-bold text-blue-600 hover:underline">
            عرض الكل
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold">جاري تحميل الدروس...</div>
        ) : videos.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border">لا توجد دروس حالياً</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((vid) => {
              const isFree = !vid.price || Number(vid.price) === 0;
              const isUnlocked = hasFreePass || isFree || vid.isPurchased;

              return (
                <div key={vid.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm flex flex-col justify-between">
                  {/* شاشة الفيديو */}
                  <div className="aspect-video bg-slate-950 relative flex items-center justify-center text-white">
                    {isUnlocked ? (
                      <Link href={`/videos/${vid.id}`} className="flex flex-col items-center gap-2 hover:scale-105 transition-all">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                          <Play className="w-6 h-6 fill-white" />
                        </div>
                        <span className="text-xs font-bold">مشاهدة الدرس</span>
                      </Link>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-red-400">
                        <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/30">
                          <Lock className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-black text-amber-400">درس مدفوع ({vid.price} ج.م)</span>
                      </div>
                    )}
                  </div>

                  {/* التفاصيل والأزرار */}
                  <div className="p-5 space-y-3">
                    <h3 className="font-black text-slate-900 line-clamp-1">{vid.title}</h3>
                    <div>
                      {isUnlocked ? (
                        <Link
                          href={`/videos/${vid.id}`}
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Play className="w-3.5 h-3.5" /> فتح ومشاهدة
                        </Link>
                      ) : (
                        <Link
                          href={`/payment?videoId=${vid.id}&price=${vid.price}&title=${encodeURIComponent(vid.title)}`}
                          className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> شراء وتفعيل الدرس ({vid.price} ج.م)
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
