"use client";

import { useState, useEffect, use } from "react";
import { useAuth } from "@/lib/useAuth";
import Link from "next/link";
import {
  Video,
  Lock,
  Play,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  CreditCard,
  ExternalLink,
  BookOpen,
} from "lucide-react";

export default function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { student } = useAuth();
  const [video, setVideo] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVideo() {
      try {
        setLoading(true);
        const sId = student?.id || "";
        const res = await fetch(`/api/videos/${id}?studentId=${sId}`);
        if (res.ok) {
          const data = await res.json();
          setVideo(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadVideo();
  }, [id, student?.id, student?.isPaidAccess]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-bold text-sm">جاري تحميل الدرس...</p>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <Video className="w-16 h-16 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">هذا الفيديو غير موجود أو تم حذفه</h2>
        <Link href="/videos" className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs">
          العودة للمكتبة
        </Link>
      </div>
    );
  }

  const isFreePass = student?.isPaidAccess;
  const isFreeVideo = video.price === 0;
  const isLocked = !isFreePass && !isFreeVideo && video.isLocked;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Link
        href="/videos"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        العودة لقائمة الفيديوهات
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
            {video.grade}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {video.title}
          </h1>
        </div>

        <div>
          {isFreePass ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              متاح مجاناً لاشتراكك (✓)
            </span>
          ) : isFreeVideo ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
              درس مجاني للجميع
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300">
              <DollarSign className="w-4 h-4 text-amber-600" />
              سعر الدرس: {video.price} ج.م
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-lg">
        {isLocked ? (
          <div className="relative aspect-video bg-slate-950 flex flex-col items-center justify-center p-8 text-center text-white space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-red-500/20 border border-red-500/40 flex items-center justify-center shadow-2xl">
              <Lock className="w-10 h-10 text-red-400" />
            </div>

            <div className="space-y-1 max-w-md">
              <h2 className="text-2xl font-black text-white">
                هذا المحتوى مقفل ومدفوع
              </h2>
              <p className="text-sm text-slate-300">
                لم يتم تفعيل هذا الفيديو لحسابك بعد. سعر فتح الفيديو:{" "}
                <span className="font-extrabold text-amber-300">{video.price} ج.م</span>
              </p>
            </div>

            <div className="pt-2">
              <Link
                href={`/payment?videoId=${video.id}&title=${encodeURIComponent(video.title)}&price=${video.price}`}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl hover:scale-105 transition-all"
              >
                <CreditCard className="w-5 h-5" />
                الانتقال لصفحة الدفع لفتح الفيديو فوراً
              </Link>
            </div>
          </div>
        ) : (
          <div className="aspect-video bg-black flex items-center justify-center">
            {video.url.includes("youtube.com") || video.url.includes("youtu.be") ? (
              <iframe
                src={
                  video.url.includes("embed")
                    ? video.url
                    : `https://www.youtube.com/embed/${
                        video.url.includes("v=")
                          ? video.url.split("v=")[1]?.split("&")[0]
                          : video.url.split("/").pop()
                      }`
                }
                title={video.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="text-center text-white p-8 space-y-4">
                <Play className="w-16 h-16 text-blue-500 mx-auto" />
                <p className="text-lg font-bold">مشغل الفيديو</p>
                <a
                  href={video.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  مشاهدة الرابط الخارجي
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
