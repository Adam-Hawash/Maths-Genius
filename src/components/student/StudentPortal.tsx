'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/stores/app-store';
import {
  Video,
  BookOpen,
  ClipboardList,
  Wallet,
  LogOut,
  Play,
  Lock,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Smartphone,
  DollarSign,
  Upload,
  Loader2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  ShieldX,
  RefreshCw,
  Eye,
} from 'lucide-react';

// ===== Utility: خلط المصفوفة =====
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ===== Types =====
interface ShuffledQuestion {
  id: string;
  originalIndex: number;
  text: string;
  shuffledOptions: Array<{
    label: string;
    text: string;
    originalLetter: string;
  }>;
  optionMap: Record<string, string>;
  correctAnswer: string;
  explanation?: string;
}

// ===== Main Component =====
export default function StudentPortal() {
  const { user, setView, logout } = useAppStore();

  // ===== Navigation =====
  const [activeTab, setActiveTab] = useState('videos');

  // ===== Videos State =====
  const [videos, setVideos] = useState<any[]>([]);
  const [videoAccessMap, setVideoAccessMap] = useState<Record<string, boolean>>({});
  const [playingVideo, setPlayingVideo] = useState<any>(null);

  // ===== Homework State =====
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [currentHomework, setCurrentHomework] = useState<any>(null);
  const [shuffledHwQuestions, setShuffledHwQuestions] = useState<ShuffledQuestion[]>([]);
  const [hwAnswers, setHwAnswers] = useState<Record<number, string>>({});
  const [hwSubmitted, setHwSubmitted] = useState(false);
  const [hwResult, setHwResult] = useState<any>(null);
  const [hwLoading, setHwLoading] = useState(false);

  // ===== Exams State =====
  const [exams, setExams] = useState<any[]>([]);
  const [currentExam, setCurrentExam] = useState<any>(null);
  const [shuffledExamQuestions, setShuffledExamQuestions] = useState<ShuffledQuestion[]>([]);
  const [examAnswers, setExamAnswers] = useState<Record<number, string>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examResult, setExamResult] = useState<any>(null);
  const [examLoading, setExamLoading] = useState(false);
  const [examTimeLeft, setExamTimeLeft] = useState<number>(0);
  const examTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ===== Payments State =====
  const [payments, setPayments] = useState<any[]>([]);

  // ===== Payment Flow State =====
  const [payingFor, setPayingFor] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [paymentUploading, setPaymentUploading] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // ===== Notification =====
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ==========================================
  // ===== DATA FETCHING ======================
  // ==========================================

  const fetchVideos = async () => {
    try {
      const res = await fetch('/api/videos');
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setVideos(list);

      // Check access for each video
      const accessMap: Record<string, boolean> = {};
      for (const v of list) {
        if (!v.price || v.price === 0) {
          accessMap[v.id] = true;
        } else {
          try {
            const accessRes = await fetch(`/api/video-access?videoId=${v.id}`);
            const accessData = await accessRes.json();
            accessMap[v.id] = accessData.hasAccess === true;
          } catch {
            accessMap[v.id] = false;
          }
        }
      }
      setVideoAccessMap(accessMap);
    } catch (err) {
      console.error('Failed to fetch videos:', err);
    }
  };

  const fetchHomeworks = async () => {
    try {
      const res = await fetch('/api/homework');
      const data = await res.json();
      setHomeworks(Array.isArray(data) ? data.filter((h: any) => h.isPublished) : []);
    } catch (err) {
      console.error('Failed to fetch homeworks:', err);
    }
  };

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/exams');
      const data = await res.json();
      setExams(Array.isArray(data) ? data.filter((e: any) => e.isPublished) : []);
    } catch (err) {
      console.error('Failed to fetch exams:', err);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/my-payments');
      const data = await res.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    }
  };

  useEffect(() => {
    fetchVideos();
    fetchHomeworks();
    fetchExams();
    fetchPayments();
  }, []);

  // ===== Exam Timer =====
  useEffect(() => {
    if (currentExam && !examSubmitted && examTimeLeft > 0) {
      examTimerRef.current = setInterval(() => {
        setExamTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(examTimerRef.current!);
            handleExamSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (examTimerRef.current) clearInterval(examTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentExam, examSubmitted, examTimeLeft]);

  // ==========================================
  // ===== HOMEWORK HANDLERS ==================
  // ==========================================

  const startHomework = async (hw: any) => {
    try {
      const res = await fetch(`/api/homework/${hw.id}`);
      const data = await res.json();
      const questions = data.questions || [];

      // Shuffle questions + options
      const shuffled = shuffleArray(questions).map((q: any, idx: number) => {
        const options = [
          { text: q.optionA, letter: 'A' },
          { text: q.optionB, letter: 'B' },
          { text: q.optionC, letter: 'C' },
          { text: q.optionD, letter: 'D' },
        ];
        const shuffledOpts = shuffleArray(options).map((opt, i) => ({
          label: String.fromCharCode(65 + i),
          text: opt.text,
          originalLetter: opt.letter,
        }));
        return {
          id: q.id,
          originalIndex: idx,
          text: q.text,
          shuffledOptions: shuffledOpts,
          optionMap: Object.fromEntries(shuffledOpts.map((o) => [o.label, o.letter])),
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || null,
        };
      });

      setCurrentHomework(hw);
      setShuffledHwQuestions(shuffled);
      setHwAnswers({});
      setHwSubmitted(false);
      setHwResult(null);
    } catch (err) {
      showToast('فشل في تحميل الأسئلة', 'error');
    }
  };

  const handleHwAnswer = (questionIndex: number, displayLabel: string) => {
    if (hwSubmitted) return;
    setHwAnswers((prev) => ({ ...prev, [questionIndex]: displayLabel }));
  };

  const handleHwSubmit = async () => {
    if (!currentHomework || !user) return;

    const unansweredCount = shuffledHwQuestions.length - Object.keys(hwAnswers).length;
    if (unansweredCount > 0) {
      if (!confirm(`لديك ${unansweredCount} سؤال بدون إجابة. هل تريد التسليم؟`)) return;
    }

    setHwLoading(true);
    try {
      // Map shuffled answers back to original question IDs
      const submitAnswers: Record<string, string> = {};
      Object.entries(hwAnswers).forEach(([idx, displayLabel]) => {
        const q = shuffledHwQuestions[parseInt(idx)];
        if (q) {
          submitAnswers[q.id] = q.optionMap[displayLabel] || displayLabel;
        }
      });

      const res = await fetch('/api/homework/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.id,
          homeworkId: currentHomework.id,
          answers: submitAnswers,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل في التسليم');

      setHwResult(data.result);
      setHwSubmitted(true);
      showToast('تم تسليم الواجب بنجاح!');
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ', 'error');
    } finally {
      setHwLoading(false);
    }
  };

  // ==========================================
  // ===== EXAM HANDLERS ======================
  // ==========================================

  const startExam = async (exam: any) => {
    try {
      const res = await fetch(`/api/exams/${exam.id}`);
      const data = await res.json();
      const questions = data.questions || [];

      const shuffled = shuffleArray(questions).map((q: any, idx: number) => {
        const options = [
          { text: q.optionA, letter: 'A' },
          { text: q.optionB, letter: 'B' },
          { text: q.optionC, letter: 'C' },
          { text: q.optionD, letter: 'D' },
        ];
        const shuffledOpts = shuffleArray(options).map((opt, i) => ({
          label: String.fromCharCode(65 + i),
          text: opt.text,
          originalLetter: opt.letter,
        }));
        return {
          id: q.id,
          originalIndex: idx,
          text: q.text,
          shuffledOptions: shuffledOpts,
          optionMap: Object.fromEntries(shuffledOpts.map((o) => [o.label, o.letter])),
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || null,
        };
      });

      setCurrentExam(exam);
      setShuffledExamQuestions(shuffled);
      setExamAnswers({});
      setExamSubmitted(false);
      setExamResult(null);

      // Timer
      const duration = exam.duration ? exam.duration * 60 : 0;
      setExamTimeLeft(duration);
    } catch (err) {
      showToast('فشل في تحميل الامتحان', 'error');
    }
  };

  const handleExamAnswer = (questionIndex: number, displayLabel: string) => {
    if (examSubmitted) return;
    setExamAnswers((prev) => ({ ...prev, [questionIndex]: displayLabel }));
  };

  const handleExamSubmit = async () => {
    if (!currentExam || !user || examSubmitted) return;

    if (examTimeLeft > 0) {
      const unansweredCount = shuffledExamQuestions.length - Object.keys(examAnswers).length;
      if (unansweredCount > 0) {
        if (!confirm(`لديك ${unansweredCount} سؤال بدون إجابة. هل تريد التسليم؟`)) return;
      }
    }

    setExamLoading(true);
    try {
      const submitAnswers: Record<string, string> = {};
      Object.entries(examAnswers).forEach(([idx, displayLabel]) => {
        const q = shuffledExamQuestions[parseInt(idx)];
        if (q) {
          submitAnswers[q.id] = q.optionMap[displayLabel] || displayLabel;
        }
      });

      const res = await fetch('/api/exams/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.id,
          examId: currentExam.id,
          answers: submitAnswers,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل في التسليم');

      setExamResult(data.result);
      setExamSubmitted(true);
      setExamTimeLeft(0);
      if (examTimerRef.current) clearInterval(examTimerRef.current);
      showToast('تم تسليم الامتحان بنجاح!');
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ', 'error');
    } finally {
      setExamLoading(false);
    }
  };

  // ==========================================
  // ===== PAYMENT HANDLERS ===================
  // ==========================================

  const handlePaymentSubmit = async () => {
    if (!payingFor || !user || !paymentMethod || !receiptFile) {
      setPaymentError('يرجى اختيار طريقة الدفع ورفع صورة الإيصال');
      return;
    }

    setPaymentUploading(true);
    setPaymentError('');

    try {
      const formData = new FormData();
      formData.append('studentId', user.id);
      formData.append('videoId', payingFor.id);
      formData.append('method', paymentMethod);
      formData.append('amount', String(payingFor.price || 0));
      formData.append('receipt', receiptFile);

      const res = await fetch('/api/payments', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل في إرسال الدفعة');

      showToast('تم إرسال الدفعة بنجاح! انتظر موافقة الأدمن.');
      setPayingFor(null);
      setPaymentMethod('');
      setReceiptFile(null);
      fetchVideos();
      fetchPayments();

      // Redirect to pending screen
      setView('student-payment-pending');
    } catch (err: any) {
      setPaymentError(err.message || 'حدث خطأ أثناء الدفع');
    } finally {
      setPaymentUploading(false);
    }
  };

  // ==========================================
  // ===== HELPERS ============================
  // ==========================================

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  // ==========================================
  // ===== RENDER =============================
  // ==========================================

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir="rtl">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg text-white font-medium text-sm transition-all ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Maths Genius</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">مرحباً، {user?.name}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
            title="تسجيل الخروج"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 mb-6 overflow-hidden">
          <div className="flex">
            {[
              { id: 'videos', label: 'الفيديوهات', icon: Video },
              { id: 'homework', label: 'الواجبات', icon: BookOpen },
              { id: 'exams', label: 'الامتحانات', icon: ClipboardList },
              { id: 'payments', label: 'المدفوعات', icon: Wallet },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-950/20'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ===== TAB: Videos ===== */}
        {activeTab === 'videos' && (
          <div className="space-y-4">
            {/* Video Player Modal */}
            {playingVideo && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden mb-4">
                <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
                  <h3 className="font-bold text-gray-900 dark:text-white">{playingVideo.title}</h3>
                  <button
                    onClick={() => setPlayingVideo(null)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="aspect-video bg-black">
                  {getYouTubeId(playingVideo.url) ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${getYouTubeId(playingVideo.url)}?autoplay=1`}
                      className="w-full h-full"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={playingVideo.url}
                      controls
                      autoPlay
                      className="w-full h-full"
                    />
                  )}
                </div>
                {playingVideo.description && (
                  <div className="p-4 text-sm text-gray-600 dark:text-gray-400">
                    {playingVideo.description}
                  </div>
                )}
              </div>
            )}

            {/* Payment Flow Modal */}
            {payingFor && (
              <PaymentFlow
                video={payingFor}
                method={paymentMethod}
                setMethod={setPaymentMethod}
                receiptFile={receiptFile}
                setReceiptFile={setReceiptFile}
                uploading={paymentUploading}
                error={paymentError}
                onSubmit={handlePaymentSubmit}
                onCancel={() => { setPayingFor(null); setPaymentError(''); }}
              />
            )}

            {/* Videos Grid */}
            {videos.length === 0 ? (
              <div className="text-center py-16">
                <Video className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">لا توجد فيديوهات حاليًا</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {videos.map((video) => {
                  const hasAccess = videoAccessMap[video.id];
                  const isPaid = video.price && video.price > 0;
                  const isLocked = isPaid && !hasAccess;
                  const ytId = getYouTubeId(video.url);

                  return (
                    <div
                      key={video.id}
                      className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md transition"
                    >
                      {/* Thumbnail */}
                      <div className="relative aspect-video bg-gray-200 dark:bg-gray-800">
                        {ytId ? (
                          <img
                            src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="h-12 w-12 text-gray-400" />
                          </div>
                        )}

                        {/* Lock Overlay */}
                        {isLocked && (
                          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                            <Lock className="h-10 w-10 text-white/80" />
                            <span className="text-white font-bold text-lg">{video.price} ج.م</span>
                            <button
                              onClick={() => setPayingFor(video)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                            >
                              اشتري الآن
                            </button>
                          </div>
                        )}

                        {/* Play Button */}
                        {!isLocked && (
                          <button
                            onClick={() => setPlayingVideo(video)}
                            className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition"
                          >
                            <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                              <Play className="h-6 w-6 text-gray-900 mr-[-2px]" />
                            </div>
                          </button>
                        )}

                        {/* Price Badge */}
                        {isPaid && hasAccess && (
                          <span className="absolute top-2 left-2 px-2 py-1 bg-green-600 text-white rounded-lg text-xs font-medium flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            مشتري
                          </span>
                        )}
                        {!isPaid && (
                          <span className="absolute top-2 left-2 px-2 py-1 bg-purple-600 text-white rounded-lg text-xs font-medium">
                            مجاني
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2">{video.title}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          {video.subject && (
                            <span className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                              {video.subject}
                            </span>
                          )}
                          {video.grade && (
                            <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                              {video.grade}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===== TAB: Homework ===== */}
        {activeTab === 'homework' && (
          <div>
            {/* Homework List (when no homework is active) */}
            {!currentHomework && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  الواجبات المتاحة
                </h2>
                {homeworks.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">لا توجد واجبات حاليًا</p>
                ) : (
                  <div className="space-y-3">
                    {homeworks.map((hw) => (
                      <div
                        key={hw.id}
                        className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                        onClick={() => startHomework(hw)}
                      >
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                          <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">{hw.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {hw.subject && <span className="text-xs text-gray-500">{hw.subject}</span>}
                            {hw.dueDate && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(hw.dueDate).toLocaleDateString('ar-EG')}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronLeft className="h-5 w-5 text-gray-400" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Active Homework */}
            {currentHomework && !hwSubmitted && (
              <div className="space-y-4">
                {/* Header */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setCurrentHomework(null); setShuffledHwQuestions([]); }}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div>
                      <h2 className="font-bold text-gray-900 dark:text-white">{currentHomework.title}</h2>
                      <p className="text-xs text-gray-500">{shuffledHwQuestions.length} سؤال</p>
                    </div>
                  </div>
                  <button
                    onClick={handleHwSubmit}
                    disabled={hwLoading}
                    className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-medium text-sm disabled:opacity-50"
                  >
                    {hwLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تسليم الواجب'}
                  </button>
                </div>

                {/* Questions */}
                {shuffledHwQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-5"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-sm font-bold">
                        {idx + 1}
                      </span>
                      <p className="text-gray-900 dark:text-white font-medium leading-relaxed pt-1">{q.text}</p>
                    </div>
                    <div className="space-y-2 mr-11">
                      {q.shuffledOptions.map((opt) => {
                        const isSelected = hwAnswers[idx] === opt.label;
                        return (
                          <button
                            key={opt.label}
                            onClick={() => handleHwAnswer(idx, opt.label)}
                            className={`w-full text-right px-4 py-3 rounded-xl border-2 transition-all text-sm ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-medium'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <span className="inline-flex items-center gap-2">
                              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                              }`}>
                                {opt.label}
                              </span>
                              {opt.text}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Homework Results */}
            {currentHomework && hwSubmitted && hwResult && (
              <div className="space-y-4">
                {/* Score Card */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 text-center">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">نتيجة الواجب</h2>
                  <p className="text-sm text-gray-500 mb-4">{currentHomework.title}</p>
                  <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-2xl font-bold text-white ${
                    hwResult.score / hwResult.totalQuestions >= 0.5 ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {hwResult.score}/{hwResult.totalQuestions}
                  </div>
                  <p className={`mt-3 text-lg font-bold ${
                    hwResult.score / hwResult.totalQuestions >= 0.5 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {Math.round((hwResult.score / hwResult.totalQuestions) * 100)}%
                  </p>
                  <button
                    onClick={() => { setCurrentHomework(null); setShuffledHwQuestions([]); setHwSubmitted(false); setHwResult(null); }}
                    className="mt-4 px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm font-medium"
                  >
                    العودة للواجبات
                  </button>
                </div>

                {/* Per-Question Review */}
                {hwResult.questionDetails && hwResult.questionDetails.map((detail: any, i: number) => (
                  <div
                    key={i}
                    className={`bg-white dark:bg-gray-900 rounded-2xl shadow-sm border-2 p-5 ${
                      detail.isCorrect
                        ? 'border-green-200 dark:border-green-800'
                        : 'border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold text-white ${
                        detail.isCorrect ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {detail.isCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white mb-3">{detail.questionText}</p>

                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {['optionA', 'optionB', 'optionC', 'optionD'].map((key) => {
                            const letter = key.replace('option', '');
                            const isCorrectOption = detail.correctAnswer === letter;
                            const isStudentChoice = detail.studentAnswer === letter;
                            return (
                              <div
                                key={key}
                                className={`px-3 py-2 rounded-lg text-sm border ${
                                  isCorrectOption
                                    ? 'bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300 font-medium'
                                    : isStudentChoice && !isCorrectOption
                                    ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300'
                                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                }`}
                              >
                                <span className="font-bold">{letter}.</span> {detail[key]}
                                {isCorrectOption && <Check className="inline h-3.5 w-3.5 mr-1 text-green-600" />}
                                {isStudentChoice && !isCorrectOption && <X className="inline h-3.5 w-3.5 mr-1 text-red-600" />}
                              </div>
                            );
                          })}
                        </div>

                        {!detail.isCorrect && detail.studentAnswer && (
                          <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                            إجابتك: {detail.studentAnswer} — الإجابة الصحيحة: {detail.correctAnswer}
                          </p>
                        )}
                        {detail.isCorrect && (
                          <p className="text-sm text-green-600 dark:text-green-400 mb-2">
                            إجابة صحيحة!
                          </p>
                        )}

                        {/* AI Explanation */}
                        {detail.explanation && (
                          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <div className="flex items-start gap-2">
                              <span className="text-base flex-shrink-0">💡</span>
                              <div>
                                <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">
                                  شرح الحل:
                                </p>
                                <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed whitespace-pre-line">
                                  {detail.explanation}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== TAB: Exams ===== */}
        {activeTab === 'exams' && (
          <div>
            {/* Exam List */}
            {!currentExam && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-purple-600" />
                  الامتحانات المتاحة
                </h2>
                {exams.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">لا توجد امتحانات حاليًا</p>
                ) : (
                  <div className="space-y-3">
                    {exams.map((exam) => (
                      <div
                        key={exam.id}
                        className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                        onClick={() => startExam(exam)}
                      >
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                          <ClipboardList className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">{exam.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {exam.subject && <span className="text-xs text-gray-500">{exam.subject}</span>}
                            {exam.duration && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {exam.duration} دقيقة
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronLeft className="h-5 w-5 text-gray-400" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Active Exam */}
            {currentExam && !examSubmitted && (
              <div className="space-y-4">
                {/* Header with Timer */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (!confirm('هل تريد الخروج؟ لن تستطيع العودة.')) return;
                        setCurrentExam(null);
                        setShuffledExamQuestions([]);
                        setExamTimeLeft(0);
                        if (examTimerRef.current) clearInterval(examTimerRef.current);
                      }}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div>
                      <h2 className="font-bold text-gray-900 dark:text-white">{currentExam.title}</h2>
                      <p className="text-xs text-gray-500">{shuffledExamQuestions.length} سؤال</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {examTimeLeft > 0 && (
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono font-bold ${
                        examTimeLeft <= 60 ? 'bg-red-100 dark:bg-red-950/30 text-red-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}>
                        <Clock className="h-4 w-4" />
                        {formatTime(examTimeLeft)}
                      </div>
                    )}
                    <button
                      onClick={handleExamSubmit}
                      disabled={examLoading}
                      className="px-6 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium text-sm disabled:opacity-50"
                    >
                      {examLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تسليم الامتحان'}
                    </button>
                  </div>
                </div>

                {/* Questions */}
                {shuffledExamQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-5"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full text-sm font-bold">
                        {idx + 1}
                      </span>
                      <p className="text-gray-900 dark:text-white font-medium leading-relaxed pt-1">{q.text}</p>
                    </div>
                    <div className="space-y-2 mr-11">
                      {q.shuffledOptions.map((opt) => {
                        const isSelected = examAnswers[idx] === opt.label;
                        return (
                          <button
                            key={opt.label}
                            onClick={() => handleExamAnswer(idx, opt.label)}
                            className={`w-full text-right px-4 py-3 rounded-xl border-2 transition-all text-sm ${
                              isSelected
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 font-medium'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <span className="inline-flex items-center gap-2">
                              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                isSelected ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                              }`}>
                                {opt.label}
                              </span>
                              {opt.text}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Exam Results */}
            {currentExam && examSubmitted && examResult && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 text-center">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">نتيجة الامتحان</h2>
                  <p className="text-sm text-gray-500 mb-4">{currentExam.title}</p>
                  <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-2xl font-bold text-white ${
                    examResult.score / examResult.totalQuestions >= 0.5 ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {examResult.score}/{examResult.totalQuestions}
                  </div>
                  <p className={`mt-3 text-lg font-bold ${
                    examResult.score / examResult.totalQuestions >= 0.5 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {Math.round((examResult.score / examResult.totalQuestions) * 100)}%
                  </p>
                  <button
                    onClick={() => { setCurrentExam(null); setShuffledExamQuestions([]); setExamSubmitted(false); setExamResult(null); setExamTimeLeft(0); }}
                    className="mt-4 px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm font-medium"
                  >
                    العودة للامتحانات
                  </button>
                </div>

                {examResult.questionDetails && examResult.questionDetails.map((detail: any, i: number) => (
                  <div
                    key={i}
                    className={`bg-white dark:bg-gray-900 rounded-2xl shadow-sm border-2 p-5 ${
                      detail.isCorrect ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold text-white ${
                        detail.isCorrect ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {detail.isCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white mb-3">{detail.questionText}</p>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {['optionA', 'optionB', 'optionC', 'optionD'].map((key) => {
                            const letter = key.replace('option', '');
                            const isCorrectOption = detail.correctAnswer === letter;
                            const isStudentChoice = detail.studentAnswer === letter;
                            return (
                              <div
                                key={key}
                                className={`px-3 py-2 rounded-lg text-sm border ${
                                  isCorrectOption
                                    ? 'bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300 font-medium'
                                    : isStudentChoice && !isCorrectOption
                                    ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300'
                                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                }`}
                              >
                                <span className="font-bold">{letter}.</span> {detail[key]}
                                {isCorrectOption && <Check className="inline h-3.5 w-3.5 mr-1 text-green-600" />}
                                {isStudentChoice && !isCorrectOption && <X className="inline h-3.5 w-3.5 mr-1 text-red-600" />}
                              </div>
                            );
                          })}
                        </div>
                        {!detail.isCorrect && detail.studentAnswer && (
                          <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                            إجابتك: {detail.studentAnswer} — الإجابة الصحيحة: {detail.correctAnswer}
                          </p>
                        )}
                        {detail.isCorrect && (
                          <p className="text-sm text-green-600 dark:text-green-400 mb-2">إجابة صحيحة!</p>
                        )}
                        {detail.explanation && (
                          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <div className="flex items-start gap-2">
                              <span className="text-base flex-shrink-0">💡</span>
                              <div>
                                <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">شرح الحل:</p>
                                <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed whitespace-pre-line">
                                  {detail.explanation}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== TAB: Payments ===== */}
        {activeTab === 'payments' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-600" />
              سجل المدفوعات
            </h2>
            {payments.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">لا توجد مدفوعات بعد</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => {
                  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
                    pending: { label: 'قيد المراجعة', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300', icon: <Clock className="h-4 w-4" /> },
                    approved: { label: 'مقبول', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', icon: <ShieldCheck className="h-4 w-4" /> },
                    rejected: { label: 'مرفوض', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', icon: <ShieldX className="h-4 w-4" /> },
                  };
                  const methodLabels: Record<string, string> = {
                    fawry: 'فوري',
                    instapay: 'إنستاباي',
                    vodafone_cash: 'فودافون كاش',
                  };
                  const st = statusConfig[payment.status] || statusConfig.pending;

                  return (
                    <div key={payment.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          payment.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30' :
                          payment.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30' :
                          'bg-yellow-100 dark:bg-yellow-900/30'
                        }`}>
                          {st.icon}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {payment.video?.title || 'فيديو'}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-gray-500">{methodLabels[payment.method] || payment.method}</span>
                            <span className="text-xs font-bold text-green-600">{payment.amount} ج.م</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                          </div>
                          {payment.adminNote && payment.status === 'rejected' && (
                            <p className="mt-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/20 px-2 py-1 rounded">
                              سبب الرفض: {payment.adminNote}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(payment.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// ===== PAYMENT FLOW COMPONENT =============
// ==========================================

function PaymentFlow({
  video,
  method,
  setMethod,
  receiptFile,
  setReceiptFile,
  uploading,
  error,
  onSubmit,
  onCancel,
}: {
  video: any;
  method: string;
  setMethod: (v: string) => void;
  receiptFile: File | null;
  setReceiptFile: (f: File | null) => void;
  uploading: boolean;
  error: string;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const methods = [
    { id: 'fawry', label: 'فوري', icon: <CreditCard className="h-6 w-6" />, color: 'from-blue-500 to-blue-600' },
    { id: 'instapay', label: 'إنستاباي', icon: <Smartphone className="h-6 w-6" />, color: 'from-purple-500 to-purple-600' },
    { id: 'vodafone_cash', label: 'فودافون كاش', icon: <DollarSign className="h-6 w-6" />, color: 'from-red-500 to-red-600' },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Wallet className="h-5 w-5 text-green-600" />
          شراء الفيديو
        </h3>
        <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{video.title}</p>
      <p className="text-2xl font-bold text-green-600 mb-5">{video.price} ج.م</p>

      {/* Payment Methods */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {methods.map((m) => (
          <button
            key={m.id}
            onClick={() => setMethod(m.id)}
            className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
              method === m.id
                ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${m.color}`}>
              {m.icon}
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{m.label}</span>
            {method === m.id && (
              <div className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Receipt Upload */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          صورة إيصال الدفع
        </label>
        <label className={`flex items-center justify-center gap-2 w-full px-4 py-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
          receiptFile ? 'border-green-400 bg-green-50 dark:bg-green-950/20' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
        }`}>
          {receiptFile ? (
            <>
              <Check className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-400">{receiptFile.name}</span>
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-500">اضغط لرفع صورة الإيصال</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
          />
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </p>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={onSubmit}
        disabled={uploading || !method || !receiptFile}
        className="w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            جاري الإرسال...
          </>
        ) : (
          <>
            <Wallet className="h-4 w-4" />
            إرسال الدفعة
          </>
        )}
      </button>
    </div>
  );
}
