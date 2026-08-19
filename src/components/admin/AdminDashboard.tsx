'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/app-store'; 
import {
  Video,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  BookOpen,
  FileText,
  ClipboardList,
  Users,
  Settings,
  LogOut,
  Wallet,
  Shield,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  BarChart3,
  Sparkles,
  Loader2,
  Lock,
  Check,
  X,
  Search,
  RefreshCw,
  ExternalLink,
  Play,
  DollarSign,
  CreditCard,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
} from 'lucide-react';

// ===== Types =====
interface VideoForm {
  title: string;
  url: string;
  description: string;
  subject: string;
  grade: string;
  isPublished: boolean;
  price: string;
}

interface HomeworkForm {
  title: string;
  description: string;
  subject: string;
  grade: string;
  dueDate: string;
  isPublished: boolean;
}

interface ExamForm {
  title: string;
  description: string;
  subject: string;
  grade: string;
  duration: string;
  isPublished: boolean;
}

interface QuestionForm {
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string;
}

// ===== Main Component =====
export function AdminDashboard()
const { user, setView, logout } = useAppStore();

  // ===== Navigation State =====
  const [activeTab, setActiveTab] = useState('videos');

  // ===== Videos State =====
  const [videos, setVideos] = useState<any[]>([]);
  const [videoForm, setVideoForm] = useState<VideoForm>({
    title: '',
    url: '',
    description: '',
    subject: '',
    grade: '',
    isPublished: false,
    price: '',
  });
  const [editingVideo, setEditingVideo] = useState<string | null>(null);
  const [videoSearch, setVideoSearch] = useState('');

  // ===== Homework State =====
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [selectedHomework, setSelectedHomework] = useState<any>(null);
  const [homeworkQuestions, setHomeworkQuestions] = useState<any[]>([]);
  const [homeworkForm, setHomeworkForm] = useState<HomeworkForm>({
    title: '',
    description: '',
    subject: '',
    grade: '',
    dueDate: '',
    isPublished: false,
  });
  const [editingHomework, setEditingHomework] = useState<string | null>(null);
  const [questionForm, setQuestionForm] = useState<QuestionForm>({
    text: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    explanation: '',
  });

  // ===== Exams State =====
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [examQuestions, setExamQuestions] = useState<any[]>([]);
  const [examForm, setExamForm] = useState<ExamForm>({
    title: '',
    description: '',
    subject: '',
    grade: '',
    duration: '',
    isPublished: false,
  });
  const [editingExam, setEditingExam] = useState<string | null>(null);
  const [examQuestionForm, setExamQuestionForm] = useState<QuestionForm>({
    text: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    explanation: '',
  });

  // ===== Students State =====
  const [students, setStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');

  // ===== Payments State =====
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [receiptModal, setReceiptModal] = useState<string | null>(null);

  // ===== Analytics State =====
  const [analyticsTarget, setAnalyticsTarget] = useState('');
  const [analyticsType, setAnalyticsType] = useState<'homework' | 'exam'>('homework');
  const [mostMissed, setMostMissed] = useState<any[]>([]);

  // ===== Site Config State =====
  const [configs, setConfigs] = useState<any[]>([]);
  const [newConfigKey, setNewConfigKey] = useState('');
  const [newConfigValue, setNewConfigValue] = useState('');

  // ===== AI Extraction State =====
  const [aiExtracting, setAiExtracting] = useState(false);
  const [aiQuestionsPreview, setAiQuestionsPreview] = useState<
    Array<{
      text: string;
      optionA: string;
      optionB: string;
      optionC: string;
      optionD: string;
      correctAnswer: string;
      explanation: string;
    }>
  >([]);
  const [aiError, setAiError] = useState('');
  const [aiSuccessMsg, setAiSuccessMsg] = useState('');

  // ===== Notification State =====
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
   setVideos(data.videos || []);
    } catch (err) {
      console.error('Failed to fetch videos:', err);
    }
  };

  const fetchHomeworks = async () => {
    try {
      const res = await fetch('/api/homework');
      const data = await res.json();
      setHomeworks(data.homework || data.homeworks || []);
    } catch (err) {
      console.error('Failed to fetch homeworks:', err);
    }
  };

  const fetchHomeworkQuestions = async (homeworkId: string) => {
    try {
      const res = await fetch(`/api/homework/${homeworkId}`);
      const data = await res.json();
      setHomeworkQuestions(data.questions || []);
    } catch (err) {
      console.error('Failed to fetch homework questions:', err);
    }
  };

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/exams');
      const data = await res.json();
    setExams(data.exams || []);
    } catch (err) {
      console.error('Failed to fetch exams:', err);
    }
  };

  const fetchExamQuestions = async (examId: string) => {
    try {
      const res = await fetch(`/api/exams/${examId}`);
      const data = await res.json();
      setExamQuestions(data.questions || []);
    } catch (err) {
      console.error('Failed to fetch exam questions:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/users?role=student');
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : data.users || []);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await fetch(`/api/payments${paymentFilter !== 'all' ? `?status=${paymentFilter}` : ''}`);
      const data = await res.json();
      setPayments(Array.isArray(data) ? data : data.payments || []);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    }
  };

  const fetchConfigs = async () => {
    try {
      const res = await fetch('/api/site-config');
      const data = await res.json();
      setConfigs(Array.isArray(data) ? data : data.configs || []);
    } catch (err) {
      console.error('Failed to fetch configs:', err);
    }
  };

  // ===== Initial Load =====
  useEffect(() => {
    fetchVideos();
    fetchHomeworks();
    fetchExams();
    fetchStudents();
    fetchPayments();
    fetchConfigs();
  }, []);

  // Re-fetch payments when filter changes
  useEffect(() => {
    fetchPayments();
  }, [paymentFilter]);

  // ==========================================
  // ===== VIDEO HANDLERS =====================
  // ==========================================

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...videoForm,
          price: videoForm.price ? parseFloat(videoForm.price) : 0,
        }),
      });
      if (!res.ok) throw new Error('Failed to create video');
      showToast('تم إنشاء الفيديو بنجاح');
      setVideoForm({ title: '', url: '', description: '', subject: '', grade: '', isPublished: false, price: '' });
      fetchVideos();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateVideo = async (id: string, e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/videos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...videoForm,
          price: videoForm.price ? parseFloat(videoForm.price) : 0,
        }),
      });
      if (!res.ok) throw new Error('Failed to update video');
      showToast('تم تحديث الفيديو بنجاح');
      setEditingVideo(null);
      setVideoForm({ title: '', url: '', description: '', subject: '', grade: '', isPublished: false, price: '' });
      fetchVideos();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفيديو؟')) return;
    try {
      const res = await fetch(`/api/videos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete video');
      showToast('تم حذف الفيديو');
      fetchVideos();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const startEditVideo = (video: any) => {
    setEditingVideo(video.id);
    setVideoForm({
      title: video.title,
      url: video.url,
      description: video.description || '',
      subject: video.subject || '',
      grade: video.grade || '',
      isPublished: video.isPublished,
      price: video.price ? String(video.price) : '',
    });
  };

  // ==========================================
  // ===== HOMEWORK HANDLERS ==================
  // ==========================================

  const handleCreateHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(homeworkForm),
      });
      if (!res.ok) throw new Error('Failed to create homework');
      showToast('تم إنشاء الواجب بنجاح');
      setHomeworkForm({ title: '', description: '', subject: '', grade: '', dueDate: '', isPublished: false });
      fetchHomeworks();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteHomework = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الواجب؟ سيتم حذف جميع الأسئلة والنتائج المرتبطة.')) return;
    try {
      const res = await fetch(`/api/homework/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      showToast('تم حذف الواجب');
      if (selectedHomework?.id === id) {
        setSelectedHomework(null);
        setHomeworkQuestions([]);
      }
      fetchHomeworks();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHomework) return;
    try {
      const res = await fetch('/api/homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-question',
          homeworkId: selectedHomework.id,
          question: questionForm,
        }),
      });
      if (!res.ok) throw new Error('Failed to add question');
      showToast('تم إضافة السؤال');
      setQuestionForm({ text: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A', explanation: '' });
      fetchHomeworkQuestions(selectedHomework.id);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!selectedHomework) return;
    try {
      await fetch(`/api/homework/${selectedHomework.id}/question/${questionId}`, { method: 'DELETE' });
      showToast('تم حذف السؤال');
      fetchHomeworkQuestions(selectedHomework.id);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // ==========================================
  // ===== EXAM HANDLERS ======================
  // ==========================================

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(examForm),
      });
      if (!res.ok) throw new Error('Failed to create exam');
      showToast('تم إنشاء الامتحان بنجاح');
      setExamForm({ title: '', description: '', subject: '', grade: '', duration: '', isPublished: false });
      fetchExams();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الامتحان؟')) return;
    try {
      const res = await fetch(`/api/exams/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      showToast('تم حذف الامتحان');
      if (selectedExam?.id === id) {
        setSelectedExam(null);
        setExamQuestions([]);
      }
      fetchExams();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAddExamQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam) return;
    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-question',
          examId: selectedExam.id,
          question: examQuestionForm,
        }),
      });
      if (!res.ok) throw new Error('Failed to add question');
      showToast('تم إضافة السؤال');
      setExamQuestionForm({ text: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A', explanation: '' });
      fetchExamQuestions(selectedExam.id);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteExamQuestion = async (questionId: string) => {
    if (!selectedExam) return;
    try {
      await fetch(`/api/exams/${selectedExam.id}/question/${questionId}`, { method: 'DELETE' });
      showToast('تم حذف السؤال');
      fetchExamQuestions(selectedExam.id);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // ==========================================
  // ===== PAYMENT HANDLERS ===================
  // ==========================================

  const handleApprovePayment = async (paymentId: string) => {
    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      if (!res.ok) throw new Error('Failed to approve');
      showToast('تم قبول الدفعة وفك قفل الفيديو');
      fetchPayments();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    const note = prompt('سبب الرفض (اختياري):');
    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', adminNote: note || '' }),
      });
      if (!res.ok) throw new Error('Failed to reject');
      showToast('تم رفض الدفعة');
      fetchPayments();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // ==========================================
  // ===== ANALYTICS HANDLER ==================
  // ==========================================

  const handleLoadAnalytics = async () => {
    if (!analyticsTarget) return;
    try {
      const url =
        analyticsType === 'homework'
          ? `/api/homework/submit?homeworkId=${analyticsTarget}`
          : `/api/exam-results?examId=${analyticsTarget}`;
      const res = await fetch(url);
      const data = await res.json();
      setMostMissed(data.mostMissed || []);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setMostMissed([]);
    }
  };

  // ==========================================
  // ===== SITE CONFIG HANDLER ================
  // ==========================================

  const handleSaveConfig = async (key: string, value: string) => {
    try {
      await fetch('/api/site-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      showToast('تم حفظ الإعداد');
      fetchConfigs();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAddConfig = async () => {
    if (!newConfigKey.trim()) return;
    try {
      await fetch('/api/site-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: newConfigKey, value: newConfigValue }),
      });
      showToast('تم إضافة الإعداد');
      setNewConfigKey('');
      setNewConfigValue('');
      fetchConfigs();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteConfig = async (id: string) => {
    try {
      await fetch(`/api/site-config/${id}`, { method: 'DELETE' });
      showToast('تم حذف الإعداد');
      fetchConfigs();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // ==========================================
  // ===== AI EXTRACTION HANDLER ==============
  // ==========================================

  const handleAiExtract = async (
    e: React.ChangeEvent<HTMLInputElement>,
    homeworkId?: string,
    examId?: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!homeworkId && !examId) {
      setAiError('يجب تحديد الواجب أو الامتحان أولاً');
      return;
    }

    setAiExtracting(true);
    setAiError('');
    setAiQuestionsPreview([]);
    setAiSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (homeworkId) formData.append('homeworkId', homeworkId);
      if (examId) formData.append('examId', examId);

      const res = await fetch('/api/ai/extract-questions', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل في استخراج الأسئلة');

      setAiQuestionsPreview(data.questions || []);
      setAiSuccessMsg(`تم استخراج ${data.count} سؤال بنجاح وحفظهم في الداتابيز`);

      if (homeworkId) fetchHomeworkQuestions(homeworkId);
      if (examId) fetchExamQuestions(examId);
    } catch (err: any) {
      setAiError(err.message || 'حدث خطأ أثناء التحليل');
    } finally {
      setAiExtracting(false);
      e.target.value = '';
    }
  };

  // ==========================================
  // ===== RENDER =============================
  // ==========================================

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir="rtl">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg text-white font-medium text-sm transition-all ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* ===== Top Header Bar ===== */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">لوحة التحكم</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Maths Genius — أدمن</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
              title="تسجيل الخروج"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* ===== Tab Navigation ===== */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 mb-6 overflow-hidden">
          <div className="flex overflow-x-auto">
            {[
              { id: 'videos', label: 'الفيديوهات', icon: Video },
              { id: 'homework', label: 'الواجبات', icon: BookOpen },
              { id: 'exams', label: 'الامتحانات', icon: ClipboardList },
              { id: 'students', label: 'الطلاب', icon: Users },
              { id: 'payments', label: 'المدفوعات', icon: Wallet },
              { id: 'analytics', label: 'تحليل الأسئلة', icon: BarChart3 },
              { id: 'settings', label: 'الإعدادات', icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-950/20'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50'
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
          <div className="space-y-6">
            {/* Create / Edit Video Form */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                {editingVideo ? <Pencil className="h-5 w-5 text-blue-600" /> : <Plus className="h-5 w-5 text-blue-600" />}
                {editingVideo ? 'تعديل الفيديو' : 'إضافة فيديو جديد'}
              </h2>
              <form
                onSubmit={(e) =>
                  editingVideo ? handleUpdateVideo(editingVideo, e) : handleCreateVideo(e)
                }
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">عنوان الفيديو</label>
                  <input
                    type="text"
                    value={videoForm.title}
                    onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رابط الفيديو</label>
                  <input
                    type="url"
                    value={videoForm.url}
                    onChange={(e) => setVideoForm({ ...videoForm, url: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="https://youtube.com/watch?v=..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المادة</label>
                  <input
                    type="text"
                    value={videoForm.subject}
                    onChange={(e) => setVideoForm({ ...videoForm, subject: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الصف</label>
                  <input
                    type="text"
                    value={videoForm.grade}
                    onChange={(e) => setVideoForm({ ...videoForm, grade: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">السعر (جنيه)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={videoForm.price}
                    onChange={(e) => setVideoForm({ ...videoForm, price: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="0 = مجاني"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الحالة</label>
                  <label className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={videoForm.isPublished}
                      onChange={(e) => setVideoForm({ ...videoForm, isPublished: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">منشور</span>
                  </label>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوصف</label>
                  <textarea
                    value={videoForm.description}
                    onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    rows={2}
                  />
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium text-sm"
                  >
                    {editingVideo ? 'حفظ التعديلات' : 'إضافة الفيديو'}
                  </button>
                  {editingVideo && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingVideo(null);
                        setVideoForm({ title: '', url: '', description: '', subject: '', grade: '', isPublished: false, price: '' });
                      }}
                      className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium text-sm"
                    >
                      إلغاء
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Videos List */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">جميع الفيديوهات ({videos.length})</h2>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={videoSearch}
                    onChange={(e) => setVideoSearch(e.target.value)}
                    placeholder="بحث..."
                    className="pr-10 pl-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              {videos.filter(
                (v) =>
                  !videoSearch ||
                  v.title.toLowerCase().includes(videoSearch.toLowerCase()) ||
                  v.subject?.toLowerCase().includes(videoSearch.toLowerCase())
              ).length === 0 ? (
                <p className="text-center text-gray-500 py-8">لا توجد فيديوهات</p>
              ) : (
                <div className="space-y-3">
                  {videos
                    .filter(
                      (v) =>
                        !videoSearch ||
                        v.title.toLowerCase().includes(videoSearch.toLowerCase()) ||
                        v.subject?.toLowerCase().includes(videoSearch.toLowerCase())
                    )
                    .map((video) => (
                      <div
                        key={video.id}
                        className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                      >
                        <div className="w-20 h-14 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Play className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">{video.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {video.subject && (
                              <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                                {video.subject}
                              </span>
                            )}
                            {video.grade && (
                              <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                                {video.grade}
                              </span>
                            )}
                            {/* Price Badge */}
                            {video.price && video.price > 0 ? (
                              <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-medium">
                                {video.price} ج.م
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full font-medium">
                                مجاني
                              </span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${video.isPublished ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'}`}>
                              {video.isPublished ? 'منشور' : 'مسودة'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <a
                            href={video.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition"
                            title="فتح الفيديو"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => startEditVideo(video)}
                            className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950/30 rounded-lg transition"
                            title="تعديل"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteVideo(video.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== TAB: Homework ===== */}
        {activeTab === 'homework' && (
          <div className="space-y-6">
            {/* Create Homework */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-600" />
                إنشاء واجب جديد
              </h2>
              <form onSubmit={handleCreateHomework} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">عنوان الواجب</label>
                  <input
                    type="text"
                    value={homeworkForm.title}
                    onChange={(e) => setHomeworkForm({ ...homeworkForm, title: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المادة</label>
                  <input
                    type="text"
                    value={homeworkForm.subject}
                    onChange={(e) => setHomeworkForm({ ...homeworkForm, subject: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الصف</label>
                  <input
                    type="text"
                    value={homeworkForm.grade}
                    onChange={(e) => setHomeworkForm({ ...homeworkForm, grade: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاريخ التسليم</label>
                  <input
                    type="datetime-local"
                    value={homeworkForm.dueDate}
                    onChange={(e) => setHomeworkForm({ ...homeworkForm, dueDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوصف</label>
                  <textarea
                    value={homeworkForm.description}
                    onChange={(e) => setHomeworkForm({ ...homeworkForm, description: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={homeworkForm.isPublished}
                    onChange={(e) => setHomeworkForm({ ...homeworkForm, isPublished: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                    id="hw-published"
                  />
                  <label htmlFor="hw-published" className="text-sm text-gray-700 dark:text-gray-300">منشور</label>
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium text-sm">
                    إنشاء الواجب
                  </button>
                </div>
              </form>
            </div>

            {/* Homeworks List */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">الواجبات ({homeworks.length})</h2>
              {homeworks.length === 0 ? (
                <p className="text-center text-gray-500 py-8">لا توجد واجبات</p>
              ) : (
                <div className="space-y-2">
                  {homeworks.map((hw) => (
                    <div
                      key={hw.id}
                      className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition ${
                        selectedHomework?.id === hw.id
                          ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800'
                          : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => {
                        setSelectedHomework(hw);
                        fetchHomeworkQuestions(hw.id);
                      }}
                    >
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">{hw.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {hw.subject && <span className="text-xs text-gray-500">{hw.subject}</span>}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${hw.isPublished ? 'bg-green-100 dark:bg-green-900/30 text-green-700' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700'}`}>
                            {hw.isPublished ? 'منشور' : 'مسودة'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteHomework(hw.id); }}
                        className="p-2 text-gray-500 hover:text-red-600 rounded-lg transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Homework — Questions */}
            {selectedHomework && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  أسئلة واجب: {selectedHomework.title} ({homeworkQuestions.length} سؤال)
                </h2>

                {/* Add Question Form */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-4">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">إضافة سؤال يدويًا</h3>
                  <form onSubmit={handleAddQuestion} className="space-y-3">
                    <textarea
                      value={questionForm.text}
                      onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="نص السؤال"
                      rows={2}
                      required
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={questionForm.optionA}
                        onChange={(e) => setQuestionForm({ ...questionForm, optionA: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none text-sm"
                        placeholder="الخيار A"
                        required
                      />
                      <input
                        type="text"
                        value={questionForm.optionB}
                        onChange={(e) => setQuestionForm({ ...questionForm, optionB: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none text-sm"
                        placeholder="الخيار B"
                        required
                      />
                      <input
                        type="text"
                        value={questionForm.optionC}
                        onChange={(e) => setQuestionForm({ ...questionForm, optionC: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none text-sm"
                        placeholder="الخيار C"
                        required
                      />
                      <input
                        type="text"
                        value={questionForm.optionD}
                        onChange={(e) => setQuestionForm({ ...questionForm, optionD: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none text-sm"
                        placeholder="الخيار D"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={questionForm.correctAnswer}
                        onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none text-sm"
                      >
                        <option value="A">الإجابة الصحيحة: A</option>
                        <option value="B">الإجابة الصحيحة: B</option>
                        <option value="C">الإجابة الصحيحة: C</option>
                        <option value="D">الإجابة الصحيحة: D</option>
                      </select>
                      <input
                        type="text"
                        value={questionForm.explanation}
                        onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none text-sm"
                        placeholder="شرح الحل (اختياري)"
                      />
                    </div>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                      إضافة السؤال
                    </button>
                  </form>

                  {/* AI Extraction */}
                  <AiExtractionPanel
                    onExtract={(e) => handleAiExtract(e, selectedHomework.id)}
                    isExtracting={aiExtracting}
                    questions={aiQuestionsPreview}
                    error={aiError}
                    successMsg={aiSuccessMsg}
                  />
                </div>

                {/* Questions List */}
                {homeworkQuestions.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">لا توجد أسئلة بعد</p>
                ) : (
                  <div className="space-y-2">
                    {homeworkQuestions.map((q, i) => (
                      <div key={q.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{q.text}</p>
                          <div className="flex flex-wrap gap-1 mt-1 text-xs text-gray-500">
                            <span>A: {q.optionA}</span> · <span>B: {q.optionB}</span> · <span>C: {q.optionC}</span> · <span>D: {q.optionD}</span>
                          </div>
                          <span className="text-xs text-green-600 font-medium">الإجابة: {q.correctAnswer}</span>
                          {q.explanation && (
                            <p className="text-xs text-gray-400 mt-1 truncate">💡 {q.explanation}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== TAB: Exams ===== */}
        {activeTab === 'exams' && (
          <div className="space-y-6">
            {/* Create Exam */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-600" />
                إنشاء امتحان جديد
              </h2>
              <form onSubmit={handleCreateExam} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">عنوان الامتحان</label>
                  <input
                    type="text"
                    value={examForm.title}
                    onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المادة</label>
                  <input
                    type="text"
                    value={examForm.subject}
                    onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الصف</label>
                  <input
                    type="text"
                    value={examForm.grade}
                    onChange={(e) => setExamForm({ ...examForm, grade: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المدة (دقائق)</label>
                  <input
                    type="number"
                    value={examForm.duration}
                    onChange={(e) => setExamForm({ ...examForm, duration: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوصف</label>
                  <textarea
                    value={examForm.description}
                    onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={examForm.isPublished}
                    onChange={(e) => setExamForm({ ...examForm, isPublished: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                    id="exam-published"
                  />
                  <label htmlFor="exam-published" className="text-sm text-gray-700 dark:text-gray-300">منشور</label>
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium text-sm">
                    إنشاء الامتحان
                  </button>
                </div>
              </form>
            </div>

            {/* Exams List */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">الامتحانات ({exams.length})</h2>
              {exams.length === 0 ? (
                <p className="text-center text-gray-500 py-8">لا توجد امتحانات</p>
              ) : (
                <div className="space-y-2">
                  {exams.map((exam) => (
                    <div
                      key={exam.id}
                      className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition ${
                        selectedExam?.id === exam.id
                          ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800'
                          : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => {
                        setSelectedExam(exam);
                        fetchExamQuestions(exam.id);
                      }}
                    >
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <ClipboardList className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">{exam.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {exam.subject && <span className="text-xs text-gray-500">{exam.subject}</span>}
                          {exam.duration && <span className="text-xs text-gray-400">{exam.duration} دقيقة</span>}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${exam.isPublished ? 'bg-green-100 dark:bg-green-900/30 text-green-700' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700'}`}>
                            {exam.isPublished ? 'منشور' : 'مسودة'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteExam(exam.id); }}
                        className="p-2 text-gray-500 hover:text-red-600 rounded-lg transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Exam — Questions */}
            {selectedExam && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  أسئلة امتحان: {selectedExam.title} ({examQuestions.length} سؤال)
                </h2>

                {/* Add Exam Question Form */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-4">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">إضافة سؤال يدويًا</h3>
                  <form onSubmit={handleAddExamQuestion} className="space-y-3">
                    <textarea
                      value={examQuestionForm.text}
                      onChange={(e) => setExamQuestionForm({ ...examQuestionForm, text: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="نص السؤال"
                      rows={2}
                      required
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={examQuestionForm.optionA}
                        onChange={(e) => setExamQuestionForm({ ...examQuestionForm, optionA: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none text-sm"
                        placeholder="الخيار A"
                        required
                      />
                      <input
                        type="text"
                        value={examQuestionForm.optionB}
                        onChange={(e) => setExamQuestionForm({ ...examQuestionForm, optionB: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none text-sm"
                        placeholder="الخيار B"
                        required
                      />
                      <input
                        type="text"
                        value={examQuestionForm.optionC}
                        onChange={(e) => setExamQuestionForm({ ...examQuestionForm, optionC: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none text-sm"
                        placeholder="الخيار C"
                        required
                      />
                      <input
                        type="text"
                        value={examQuestionForm.optionD}
                        onChange={(e) => setExamQuestionForm({ ...examQuestionForm, optionD: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none text-sm"
                        placeholder="الخيار D"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={examQuestionForm.correctAnswer}
                        onChange={(e) => setExamQuestionForm({ ...examQuestionForm, correctAnswer: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none text-sm"
                      >
                        <option value="A">الإجابة الصحيحة: A</option>
                        <option value="B">الإجابة الصحيحة: B</option>
                        <option value="C">الإجابة الصحيحة: C</option>
                        <option value="D">الإجابة الصحيحة: D</option>
                      </select>
                      <input
                        type="text"
                        value={examQuestionForm.explanation}
                        onChange={(e) => setExamQuestionForm({ ...examQuestionForm, explanation: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none text-sm"
                        placeholder="شرح الحل (اختياري)"
                      />
                    </div>
                    <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium">
                      إضافة السؤال
                    </button>
                  </form>

                  {/* AI Extraction for Exams */}
                  <AiExtractionPanel
                    onExtract={(e) => handleAiExtract(e, undefined, selectedExam.id)}
                    isExtracting={aiExtracting}
                    questions={aiQuestionsPreview}
                    error={aiError}
                    successMsg={aiSuccessMsg}
                  />
                </div>

                {/* Exam Questions List */}
                {examQuestions.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">لا توجد أسئلة بعد</p>
                ) : (
                  <div className="space-y-2">
                    {examQuestions.map((q, i) => (
                      <div key={q.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full text-xs font-bold">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{q.text}</p>
                          <div className="flex flex-wrap gap-1 mt-1 text-xs text-gray-500">
                            <span>A: {q.optionA}</span> · <span>B: {q.optionB}</span> · <span>C: {q.optionC}</span> · <span>D: {q.optionD}</span>
                          </div>
                          <span className="text-xs text-green-600 font-medium">الإجابة: {q.correctAnswer}</span>
                          {q.explanation && (
                            <p className="text-xs text-gray-400 mt-1 truncate">💡 {q.explanation}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteExamQuestion(q.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== TAB: Students ===== */}
        {activeTab === 'students' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">الطلاب ({students.length})</h2>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="بحث بالاسم أو الإيميل..."
                  className="pr-10 pl-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {students.filter(
              (s) =>
                !studentSearch ||
                s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
                s.email?.toLowerCase().includes(studentSearch.toLowerCase())
            ).length === 0 ? (
              <p className="text-center text-gray-500 py-8">لا يوجد طلاب</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-right py-3 px-4 text-gray-500 font-medium">الاسم</th>
                      <th className="text-right py-3 px-4 text-gray-500 font-medium">الإيميل</th>
                      <th className="text-right py-3 px-4 text-gray-500 font-medium">الصف</th>
                      <th className="text-right py-3 px-4 text-gray-500 font-medium">تاريخ التسجيل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students
                      .filter(
                        (s) =>
                          !studentSearch ||
                          s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
                          s.email?.toLowerCase().includes(studentSearch.toLowerCase())
                      )
                      .map((student) => (
                        <tr key={student.id} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{student.name}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{student.email}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{student.grade || '—'}</td>
                          <td className="py-3 px-4 text-gray-500 text-xs">{student.createdAt ? new Date(student.createdAt).toLocaleDateString('ar-EG') : '—'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== TAB: Payments ===== */}
        {activeTab === 'payments' && (
          <PaymentsPanel
            payments={payments}
            paymentFilter={paymentFilter}
            setPaymentFilter={setPaymentFilter}
            onApprove={handleApprovePayment}
            onReject={handleRejectPayment}
            onViewReceipt={setReceiptModal}
          />
        )}

        {/* ===== TAB: Analytics ===== */}
        {activeTab === 'analytics' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              تحليل الأسئلة — الأكثر خطأ
            </h2>

            {/* Selector */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <select
                value={analyticsType}
                onChange={(e) => setAnalyticsType(e.target.value as 'homework' | 'exam')}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="homework">واجب</option>
                <option value="exam">امتحان</option>
              </select>
              <select
                value={analyticsTarget}
                onChange={(e) => setAnalyticsTarget(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— اختر {analyticsType === 'homework' ? 'واجب' : 'امتحان'} —</option>
                {(analyticsType === 'homework' ? homeworks : exams).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
              <button
                onClick={handleLoadAnalytics}
                disabled={!analyticsTarget}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                عرض التحليل
              </button>
            </div>

            {/* Results */}
            {mostMissed.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                {analyticsTarget ? 'لا توجد بيانات كافية بعد. تحتاج نتائج طلاب أولاً.' : 'اختر واجب أو امتحان لعرض التحليل'}
              </p>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 mb-2">الأسئلة مرتبة من الأكثر خطأ إلى الأقل:</p>
                {mostMissed.map((item: any, i: number) => {
                  const totalAttempts = item.totalAttempts || 1;
                  const correctPct = Math.round(((totalAttempts - item.wrongCount) / totalAttempts) * 100);
                  const wrongPct = Math.round((item.wrongCount / totalAttempts) * 100);
                  return (
                    <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <div className="flex items-start gap-3">
                        <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold text-white ${i === 0 ? 'bg-red-500' : i === 1 ? 'bg-orange-500' : i === 2 ? 'bg-yellow-500' : 'bg-gray-400'}`}>
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{item.questionText}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            الإجابة الصحيحة: <span className="text-green-600 font-medium">{item.correctAnswer}</span>
                          </p>
                          <div className="mt-2 flex items-center gap-3">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                              <div
                                className="h-full bg-red-500 rounded-full transition-all"
                                style={{ width: `${wrongPct}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-red-600 dark:text-red-400 whitespace-nowrap">
                              {wrongPct}% خطأ ({item.wrongCount}/{totalAttempts})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===== TAB: Settings ===== */}
        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              إعدادات الموقع
            </h2>

            {/* Add New Config */}
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={newConfigKey}
                onChange={(e) => setNewConfigKey(e.target.value)}
                placeholder="اسم الإعداد (مثال: site_name)"
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <input
                type="text"
                value={newConfigValue}
                onChange={(e) => setNewConfigValue(e.target.value)}
                placeholder="القيمة"
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                onClick={handleAddConfig}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm font-medium"
              >
                إضافة
              </button>
            </div>

            {/* Configs List */}
            {configs.length === 0 ? (
              <p className="text-center text-gray-500 py-8">لا توجد إعدادات</p>
            ) : (
              <div className="space-y-2">
                {configs.map((config) => (
                  <div key={config.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">{config.key}</span>
                    <input
                      type="text"
                      defaultValue={config.value}
                      onBlur={(e) => handleSaveConfig(config.key, e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none text-sm"
                    />
                    <button
                      onClick={() => handleDeleteConfig(config.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== Receipt Modal ===== */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setReceiptModal(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 dark:text-white">صورة الإيصال</h3>
              <button onClick={() => setReceiptModal(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <img
              src={receiptModal}
              alt="إيصال الدفع"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '';
                (e.target as HTMLImageElement).alt = 'فشل في تحميل الصورة';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// ===== SUB-COMPONENTS =====================
// ==========================================

// ===== Payments Panel =====
function PaymentsPanel({
  payments,
  paymentFilter,
  setPaymentFilter,
  onApprove,
  onReject,
  onViewReceipt,
}: {
  payments: any[];
  paymentFilter: string;
  setPaymentFilter: (v: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onViewReceipt: (url: string) => void;
}) {
  const methodLabels: Record<string, string> = {
    fawry: 'فوري',
    instapay: 'إنستاباي',
    vodafone_cash: 'فودافون كاش',
  };

  const methodIcons: Record<string, React.ReactNode> = {
    fawry: <CreditCard className="h-4 w-4" />,
    instapay: <Smartphone className="h-4 w-4" />,
    vodafone_cash: <DollarSign className="h-4 w-4" />,
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'قيد المراجعة', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' },
    approved: { label: 'مقبول', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
    rejected: { label: 'مرفوض', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Wallet className="h-5 w-5 text-blue-600" />
          المدفوعات ({payments.length})
        </h2>
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setPaymentFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                paymentFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {status === 'all' ? 'الكل' : statusConfig[status]?.label || status}
            </button>
          ))}
        </div>
      </div>

      {payments.length === 0 ? (
        <p className="text-center text-gray-500 py-8">لا توجد مدفوعات</p>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => (
            <div key={payment.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Wallet className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {payment.student?.name || 'طالب'}
                    </span>
                    <span className="text-xs text-gray-500">←</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {payment.video?.title || 'فيديو'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      {methodIcons[payment.method] || <CreditCard className="h-4 w-4" />}
                      {methodLabels[payment.method] || payment.method}
                    </span>
                    <span className="text-xs font-bold text-green-600">{payment.amount} ج.م</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig[payment.status]?.color || ''}`}>
                      {statusConfig[payment.status]?.label || payment.status}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(payment.createdAt).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                  {payment.adminNote && (
                    <p className="text-xs text-gray-500 mt-1 bg-yellow-50 dark:bg-yellow-950/20 px-2 py-1 rounded">
                      ملاحظة: {payment.adminNote}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {payment.receiptPath && (
                    <button
                      onClick={() => onViewReceipt(payment.receiptPath)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      الإيصال
                    </button>
                  )}
                  {payment.status === 'pending' && (
                    <>
                      <button
                        onClick={() => onApprove(payment.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        قبول
                      </button>
                      <button
                        onClick={() => onReject(payment.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                      >
                        <ShieldX className="h-3.5 w-3.5" />
                        رفض
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== AI Extraction Panel =====
function AiExtractionPanel({
  onExtract,
  isExtracting,
  questions,
  error,
  successMsg,
}: {
  onExtract: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isExtracting: boolean;
  questions: Array<{
    text: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: string;
    explanation: string;
  }>;
  error: string;
  successMsg: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-4 border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-xl p-5 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
          <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-purple-700 dark:text-purple-300 text-base">
            استخراج بالذكاء الاصطناعي
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Gemini AI — رفع ملف PDF محلول واستخراج الأسئلة تلقائيًا
          </p>
        </div>
      </div>

      {/* Upload Button */}
      <label
        className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg cursor-pointer transition-all font-medium text-sm ${
          isExtracting
            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
            : 'bg-purple-600 text-white hover:bg-purple-700 active:scale-[0.98]'
        }`}
      >
        {isExtracting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            جاري تحليل الملف بالذكاء الاصطناعي...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            رفع ملف PDF محلول
          </>
        )}
        <input
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={onExtract}
          disabled={isExtracting}
        />
      </label>

      {/* Loading Animation */}
      {isExtracting && (
        <div className="mt-3 flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            الذكاء الاصطناعي يقرأ الملف ويستخرج الأسئلة والحلول والشروحات...
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </p>
        </div>
      )}

      {/* Success Message */}
      {successMsg && (
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-400 font-medium flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            {successMsg}
          </p>
        </div>
      )}

      {/* Questions Preview */}
      {questions.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 hover:text-purple-600 transition"
          >
            <span>الأسئلة المستخرجة ({questions.length}):</span>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {expanded && (
            <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
              {questions.map((q, i) => (
                <div
                  key={i}
                  className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm"
                >
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full text-xs font-bold">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
                        {q.text}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1 text-xs">
                        <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                          أ: {q.optionA?.substring(0, 25)}
                        </span>
                        <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                          ب: {q.optionB?.substring(0, 25)}
                        </span>
                        <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                          ج: {q.optionC?.substring(0, 25)}
                        </span>
                        <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                          د: {q.optionD?.substring(0, 25)}
                        </span>
                      </div>
                      {q.explanation && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                          {q.explanation.substring(0, 80)}...
                        </p>
                      )}
                      <span className="mt-1 inline-block px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-medium">
                        الإجابة: {q.correctAnswer}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
