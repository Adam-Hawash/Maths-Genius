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
  Menu,
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
export default function AdminDashboard() {
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
  const [homeworkForm, setHomeworkForm] = useState<HomeworkForm>({
    title: '',
    description: '',
    subject: '',
    grade: '',
    dueDate: '',
    isPublished: false,
  });
  const [editingHomework, setEditingHomework] = useState<string | null>(null);
  const [selectedHomework, setSelectedHomework] = useState<any>(null);
  const [homeworkQuestions, setHomeworkQuestions] = useState<QuestionForm[]>([]);

  // ===== Exams State =====
  const [exams, setExams] = useState<any[]>([]);
  const [examForm, setExamForm] = useState<ExamForm>({
    title: '',
    description: '',
    subject: '',
    grade: '',
    duration: '',
    isPublished: false,
  });
  const [editingExam, setEditingExam] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [examQuestions, setExamQuestions] = useState<QuestionForm[]>([]);

  // ===== Students & Payments =====
  const [students, setStudents] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentFilter, setPaymentFilter] = useState('all');

  // ===== Config =====
  const [configs, setConfigs] = useState<any>({});

  // ===== UI State =====
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ===== AI Extraction State =====
  const [aiExtracting, setAiExtracting] = useState(false);
  const [aiQuestionsPreview, setAiQuestionsPreview] = useState<
    { text: string; options: string[]; correct: string; explanation: string }[]
  >([]);
  const [aiError, setAiError] = useState('');
  const [aiSuccessMsg, setAiSuccessMsg] = useState('');

  // ===== Toast Helper =====
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ==========================================
  // ===== API FETCH FUNCTIONS ===============
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
      const res = await fetch('/api/students');
      const data = await res.json();
      setStudents(data.students || []);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    }
  };

  const fetchPayments = async () => {
    try {
      let url = '/api/payments';
      if (paymentFilter !== 'all') url += `?status=${paymentFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      setPayments(Array.isArray(data) ? data : data.payments || []);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    }
  };

  const fetchConfigs = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      setConfigs(data);
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

  const handleUpdateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;
    try {
      const res = await fetch(`/api/videos/${editingVideo}`, {
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
      showToast('تم حذف الفيديو بنجاح');
      fetchVideos();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // ==========================================
  // ===== HOMEWORK HANDLERS =================
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

  const handleUpdateHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHomework) return;
    try {
      const res = await fetch(`/api/homework/${editingHomework}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(homeworkForm),
      });
      if (!res.ok) throw new Error('Failed to update homework');
      showToast('تم تحديث الواجب بنجاح');
      setEditingHomework(null);
      setHomeworkForm({ title: '', description: '', subject: '', grade: '', dueDate: '', isPublished: false });
      fetchHomeworks();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteHomework = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الواجب؟')) return;
    try {
      const res = await fetch(`/api/homework/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete homework');
      showToast('تم حذف الواجب بنجاح');
      fetchHomeworks();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // ==========================================
  // ===== EXAM HANDLERS =====================
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

  const handleUpdateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam) return;
    try {
      const res = await fetch(`/api/exams/${editingExam}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(examForm),
      });
      if (!res.ok) throw new Error('Failed to update exam');
      showToast('تم تحديث الامتحان بنجاح');
      setEditingExam(null);
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
      if (!res.ok) throw new Error('Failed to delete exam');
      showToast('تم حذف الامتحان بنجاح');
      fetchExams();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // ==========================================
  // ===== AI EXTRACTION =====================
  // ==========================================

  const handleAiExtract = async (
    e: React.FormEvent,
    homeworkId?: string,
    examId?: string
  ) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const file = formData.get('file') as File;
    if (!file) {
      setAiError('يرجى اختيار ملف');
      return;
    }

    setAiExtracting(true);
    setAiError('');
    setAiSuccessMsg('');

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const res = await fetch('/api/ai/extract-questions', {
        method: 'POST',
        body: formDataUpload,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الاستخراج');

      setAiQuestionsPreview(data.questions || []);
      setAiSuccessMsg(`تم استخراج ${data.questions?.length || 0} سؤال بنجاح`);
    } catch (err: any) {
      setAiError(err.message || 'حدث خطأ أثناء الاستخراج');
    } finally {
      setAiExtracting(false);
    }
  };

  // ==========================================
  // ===== QUESTION HELPERS ==================
  // ==========================================

  const addQuestion = (target: 'homework' | 'exam') => {
    const newQ: QuestionForm = { text: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: '', explanation: '' };
    if (target === 'homework') setHomeworkQuestions([...homeworkQuestions, newQ]);
    else setExamQuestions([...examQuestions, newQ]);
  };

  const removeQuestion = (index: number, target: 'homework' | 'exam') => {
    if (target === 'homework') setHomeworkQuestions(homeworkQuestions.filter((_, i) => i !== index));
    else setExamQuestions(examQuestions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof QuestionForm, value: string, target: 'homework' | 'exam') => {
    const list = target === 'homework' ? [...homeworkQuestions] : [...examQuestions];
    list[index] = { ...list[index], [field]: value };
    if (target === 'homework') setHomeworkQuestions(list);
    else setExamQuestions(list);
  };

  // ==========================================
  // ===== GRADE OPTIONS =====================
  // ==========================================

  const gradeOptions = [
    'الصف الأول الابتدائي',
    'الصف الثاني الابتدائي',
    'الصف الثالث الابتدائي',
    'الصف الرابع الابتدائي',
    'الصف الخامس الابتدائي',
    'الصف السادس الابتدائي',
  ];

  const gradeSelect = (value: string, onChange: (v: string) => void) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} required className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm">
      <option value="">اختر الصف</option>
      {gradeOptions.map((g) => (
        <option key={g} value={g}>{g}</option>
      ))}
    </select>
  );

  // ==========================================
  // ===== RENDER ============================
  // ==========================================

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir="rtl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg text-white font-medium ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">لوحة التحكم</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Maths Genius</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setView?.('landing')} className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center gap-1">
              <ExternalLink className="h-4 w-4" />
              الموقع
            </button>
            <button onClick={logout} className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center gap-1">
              <LogOut className="h-4 w-4" />
              خروج
            </button>
          </div>
        </div>
      </header>
            {/* Sidebar + Content */}
      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 right-0 top-16 w-64 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 transform transition-transform z-30 lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
          <nav className="p-4 space-y-1">
            {[
              { id: 'videos', icon: Video, label: 'الفيديوهات' },
              { id: 'homework', icon: ClipboardList, label: 'الواجبات' },
              { id: 'exams', icon: FileText, label: 'الامتحانات' },
              { id: 'students', icon: Users, label: 'الطلاب' },
              { id: 'payments', icon: Wallet, label: 'المدفوعات' },
              { id: 'ai', icon: Sparkles, label: 'استخراج بالذكاء' },
              { id: 'settings', icon: Settings, label: 'الإعدادات' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed bottom-4 left-4 z-50 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6">

          {/* ===== VIDEOS TAB ===== */}
          {activeTab === 'videos' && (
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Video className="h-6 w-6 text-blue-600" />
                  إدارة الفيديوهات
                </h2>
                <button onClick={() => { setEditingVideo(null); setVideoForm({ title: '', url: '', description: '', subject: '', grade: '', isPublished: false, price: '' }); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1">
                  <Plus className="h-4 w-4" /> إضافة فيديو
                </button>
              </div>

              {videoForm.title || editingVideo ? (
                <form onSubmit={editingVideo ? handleUpdateVideo : handleCreateVideo} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6 space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{editingVideo ? 'تعديل فيديو' : 'إضافة فيديو جديد'}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input type="text" placeholder="عنوان الفيديو" value={videoForm.title} onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })} required className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                    <input type="text" placeholder="رابط الفيديو (YouTube)" value={videoForm.url} onChange={(e) => setVideoForm({ ...videoForm, url: e.target.value })} required dir="ltr" className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                    {gradeSelect(videoForm.grade, (v) => setVideoForm({ ...videoForm, grade: v }))}
                    <select value={videoForm.subject} onChange={(e) => setVideoForm({ ...videoForm, subject: e.target.value })} required className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm">
                      <option value="">اختر المادة</option>
                      <option value="رياضيات">رياضيات</option>
                    </select>
                    <input type="text" placeholder="السعر (اتركه فارغ = مجاني)" value={videoForm.price} onChange={(e) => setVideoForm({ ...videoForm, price: e.target.value })} dir="ltr" className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                  </div>
                  <textarea placeholder="وصف الفيديو..." value={videoForm.description} onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input type="checkbox" checked={videoForm.isPublished} onChange={(e) => setVideoForm({ ...videoForm, isPublished: e.target.checked })} className="rounded" />
                    منشور
                  </label>
                  <div className="flex gap-2">
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">{editingVideo ? 'تحديث' : 'إضافة'}</button>
                    <button type="button" onClick={() => { setEditingVideo(null); setVideoForm({ title: '', url: '', description: '', subject: '', grade: '', isPublished: false, price: '' }); }} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">إلغاء</button>
                  </div>
                </form>
              ) : null}

              <div className="mb-4 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="بحث في الفيديوهات..." value={videoSearch} onChange={(e) => setVideoSearch(e.target.value)} className="pr-10 pl-4 py-2 w-full border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              {videos.filter((v) => !videoSearch || v.title.toLowerCase().includes(videoSearch.toLowerCase()) || v.subject?.toLowerCase().includes(videoSearch.toLowerCase())).length === 0 ? (
                <p className="text-center text-gray-500 py-8">لا توجد فيديوهات</p>
              ) : (
                <div className="space-y-3">
                  {videos.filter((v) => !videoSearch || v.title.toLowerCase().includes(videoSearch.toLowerCase()) || v.subject?.toLowerCase().includes(videoSearch.toLowerCase())).map((video) => (
                    <div key={video.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">{video.title}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{video.grade} - {video.subject} - {video.isPublished ? 'منشور' : 'مسودة'}{video.price ? ' - ' + video.price + ' جنيه' : ' - مجاني'}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => { setEditingVideo(video.id); setVideoForm({ title: video.title, url: video.url, description: video.description || '', subject: video.subject, grade: video.grade, isPublished: video.isPublished, price: video.price?.toString() || '' }); }} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDeleteVideo(video.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== HOMEWORK TAB ===== */}
          {activeTab === 'homework' && (
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <ClipboardList className="h-6 w-6 text-green-600" />
                  إدارة الواجبات
                </h2>
                <button onClick={() => { setEditingHomework(null); setHomeworkForm({ title: '', description: '', subject: '', grade: '', dueDate: '', isPublished: false }); setSelectedHomework(null); }} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-1">
                  <Plus className="h-4 w-4" /> إضافة واجب
                </button>
              </div>

              {selectedHomework ? (
                <div className="space-y-4">
                  <button onClick={() => { setSelectedHomework(null); setHomeworkQuestions([]); }} className="text-sm text-blue-600 hover:underline">العودة للقائمة</button>
                  <h3 className="font-bold text-gray-900 dark:text-white">أسئلة: {selectedHomework.title}</h3>
                  <AiExtractionPanel onExtract={(e) => handleAiExtract(e, selectedHomework.id)} isExtracting={aiExtracting} questions={aiQuestionsPreview} error={aiError} successMsg={aiSuccessMsg} />
                  <div className="space-y-3">
                    {homeworkQuestions.map((q, idx) => (
                      <div key={idx} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">سؤال {idx + 1}</span>
                          <button onClick={() => removeQuestion(idx, 'homework')} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                        </div>
                        <input type="text" placeholder="نص السؤال" value={q.text} onChange={(e) => updateQuestion(idx, 'text', e.target.value, 'homework')} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" placeholder="أ)" value={q.optionA} onChange={(e) => updateQuestion(idx, 'optionA', e.target.value, 'homework')} className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                          <input type="text" placeholder="ب)" value={q.optionB} onChange={(e) => updateQuestion(idx, 'optionB', e.target.value, 'homework')} className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                          <input type="text" placeholder="ج)" value={q.optionC} onChange={(e) => updateQuestion(idx, 'optionC', e.target.value, 'homework')} className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                          <input type="text" placeholder="د)" value={q.optionD} onChange={(e) => updateQuestion(idx, 'optionD', e.target.value, 'homework')} className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <select value={q.correctAnswer} onChange={(e) => updateQuestion(idx, 'correctAnswer', e.target.value, 'homework')} className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm">
                            <option value="">الإجابة الصحيحة</option>
                            <option value="A">أ</option>
                            <option value="B">ب</option>
                            <option value="C">ج</option>
                            <option value="D">د</option>
                          </select>
                          <input type="text" placeholder="شرح" value={q.explanation} onChange={(e) => updateQuestion(idx, 'explanation', e.target.value, 'homework')} className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                        </div>
                      </div>
                    ))}
                    <button onClick={() => addQuestion('homework')} className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 text-sm hover:border-green-400 hover:text-green-500">+ إضافة سؤال</button>
                  </div>
                </div>
              ) : (
                <div>
                  {homeworkForm.title || editingHomework ? (
                    <form onSubmit={editingHomework ? handleUpdateHomework : handleCreateHomework} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6 space-y-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{editingHomework ? 'تعديل واجب' : 'إضافة واجب جديد'}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input type="text" placeholder="عنوان الواجب" value={homeworkForm.title} onChange={(e) => setHomeworkForm({ ...homeworkForm, title: e.target.value })} required className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                        {gradeSelect(homeworkForm.grade, (v) => setHomeworkForm({ ...homeworkForm, grade: v }))}
                        <select value={homeworkForm.subject} onChange={(e) => setHomeworkForm({ ...homeworkForm, subject: e.target.value })} required className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm">
                          <option value="">اختر المادة</option>
                          <option value="رياضيات">رياضيات</option>
                        </select>
                        <input type="date" value={homeworkForm.dueDate} onChange={(e) => setHomeworkForm({ ...homeworkForm, dueDate: e.target.value })} className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                      </div>
                      <textarea placeholder="وصف الواجب..." value={homeworkForm.description} onChange={(e) => setHomeworkForm({ ...homeworkForm, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <input type="checkbox" checked={homeworkForm.isPublished} onChange={(e) => setHomeworkForm({ ...homeworkForm, isPublished: e.target.checked })} className="rounded" />
                        منشور
                      </label>
                      <div className="flex gap-2">
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">{editingHomework ? 'تحديث' : 'إضافة'}</button>
                        <button type="button" onClick={() => { setEditingHomework(null); setHomeworkForm({ title: '', description: '', subject: '', grade: '', dueDate: '', isPublished: false }); }} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">إلغاء</button>
                      </div>
                    </form>
                  ) : null}

                  <div className="space-y-3">
                    {homeworks.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">لا توجد واجبات</p>
                    ) : homeworks.map((hw: any) => (
                      <div key={hw.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-white truncate">{hw.title}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{hw.grade} - {hw.subject} - {hw.isPublished ? 'منشور' : 'مسودة'}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => { setSelectedHomework(hw); fetchHomeworkQuestions(hw.id); }} className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg"><BookOpen className="h-4 w-4" /></button>
                          <button onClick={() => { setEditingHomework(hw.id); setHomeworkForm({ title: hw.title, description: hw.description || '', subject: hw.subject, grade: hw.grade, dueDate: hw.dueDate || '', isPublished: hw.isPublished }); }} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => handleDeleteHomework(hw.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== EXAMS TAB ===== */}
          {activeTab === 'exams' && (
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="h-6 w-6 text-orange-600" />
                  إدارة الامتحانات
                </h2>
                <button onClick={() => { setEditingExam(null); setExamForm({ title: '', description: '', subject: '', grade: '', duration: '', isPublished: false }); setSelectedExam(null); }} className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 flex items-center gap-1">
                  <Plus className="h-4 w-4" /> إضافة امتحان
                </button>
              </div>

              {selectedExam ? (
                <div className="space-y-4">
                  <button onClick={() => { setSelectedExam(null); setExamQuestions([]); }} className="text-sm text-blue-600 hover:underline">العودة للقائمة</button>
                  <h3 className="font-bold text-gray-900 dark:text-white">أسئلة: {selectedExam.title}</h3>
                  <AiExtractionPanel onExtract={(e) => handleAiExtract(e, undefined, selectedExam.id)} isExtracting={aiExtracting} questions={aiQuestionsPreview} error={aiError} successMsg={aiSuccessMsg} />
                  <div className="space-y-3">
                    {examQuestions.map((q, idx) => (
                      <div key={idx} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">سؤال {idx + 1}</span>
                          <button onClick={() => removeQuestion(idx, 'exam')} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                        </div>
                        <input type="text" placeholder="نص السؤال" value={q.text} onChange={(e) => updateQuestion(idx, 'text', e.target.value, 'exam')} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" placeholder="أ)" value={q.optionA} onChange={(e) => updateQuestion(idx, 'optionA', e.target.value, 'exam')} className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                          <input type="text" placeholder="ب)" value={q.optionB} onChange={(e) => updateQuestion(idx, 'optionB', e.target.value, 'exam')} className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                          <input type="text" placeholder="ج)" value={q.optionC} onChange={(e) => updateQuestion(idx, 'optionC', e.target.value, 'exam')} className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                          <input type="text" placeholder="د)" value={q.optionD} onChange={(e) => updateQuestion(idx, 'optionD', e.target.value, 'exam')} className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <select value={q.correctAnswer} onChange={(e) => updateQuestion(idx, 'correctAnswer', e.target.value, 'exam')} className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm">
                            <option value="">الإجابة الصحيحة</option>
                            <option value="A">أ</option>
                            <option value="B">ب</option>
                            <option value="C">ج</option>
                            <option value="D">د</option>
                          </select>
                          <input type="text" placeholder="شرح" value={q.explanation} onChange={(e) => updateQuestion(idx, 'explanation', e.target.value, 'exam')} className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                        </div>
                      </div>
                    ))}
                    <button onClick={() => addQuestion('exam')} className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 text-sm hover:border-orange-400 hover:text-orange-500">+ إضافة سؤال</button>
                  </div>
                </div>
              ) : (
                <div>
                  {examForm.title || editingExam ? (
                    <form onSubmit={editingExam ? handleUpdateExam : handleCreateExam} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6 space-y-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{editingExam ? 'تعديل امتحان' : 'إضافة امتحان جديد'}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input type="text" placeholder="عنوان الامتحان" value={examForm.title} onChange={(e) => setExamForm({ ...examForm, title: e.target.value })} required className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                        {gradeSelect(examForm.grade, (v) => setExamForm({ ...examForm, grade: v }))}
                        <select value={examForm.subject} onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })} required className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm">
                          <option value="">اختر المادة</option>
                          <option value="رياضيات">رياضيات</option>
                        </select>
                        <input type="text" placeholder="مدة الامتحان (دقائق)" value={examForm.duration} onChange={(e) => setExamForm({ ...examForm, duration: e.target.value })} className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                      </div>
                      <textarea placeholder="وصف الامتحان..." value={examForm.description} onChange={(e) => setExamForm({ ...examForm, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <input type="checkbox" checked={examForm.isPublished} onChange={(e) => setExamForm({ ...examForm, isPublished: e.target.checked })} className="rounded" />
                        منشور
                      </label>
                      <div className="flex gap-2">
                        <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700">{editingExam ? 'تحديث' : 'إضافة'}</button>
                        <button type="button" onClick={() => { setEditingExam(null); setExamForm({ title: '', description: '', subject: '', grade: '', duration: '', isPublished: false }); }} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">إلغاء</button>
                      </div>
                    </form>
                  ) : null}

                  <div className="space-y-3">
                    {exams.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">لا توجد امتحانات</p>
                    ) : exams.map((exam: any) => (
                      <div key={exam.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-white truncate">{exam.title}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{exam.grade} - {exam.subject} - {exam.duration} دقيقة - {exam.isPublished ? 'منشور' : 'مسودة'}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => { setSelectedExam(exam); fetchExamQuestions(exam.id); }} className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg"><BookOpen className="h-4 w-4" /></button>
                          <button onClick={() => { setEditingExam(exam.id); setExamForm({ title: exam.title, description: exam.description || '', subject: exam.subject, grade: exam.grade, duration: exam.duration || '', isPublished: exam.isPublished }); }} className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => handleDeleteExam(exam.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== STUDENTS TAB ===== */}
          {activeTab === 'students' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                <Users className="h-6 w-6 text-indigo-600" />
                إدارة الطلاب ({students.length})
              </h2>
              {students.length === 0 ? (
                <p className="text-center text-gray-500 py-8">لا يوجد طلاب مسجلين</p>
              ) : (
                <div className="space-y-3">
                  {students.map((s: any) => (
                    <div key={s.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{s.name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.grade} - {s.status === 'approved' ? 'مقبول' : s.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : s.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                        {s.status === 'approved' ? 'مقبول' : s.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== PAYMENTS TAB ===== */}
          {activeTab === 'payments' && (
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Wallet className="h-6 w-6 text-emerald-600" />
                  المدفوعات ({payments.length})
                </h2>
                <div className="flex gap-2">
                  {['all', 'completed', 'pending', 'failed'].map((f) => (
                    <button key={f} onClick={() => setPaymentFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${paymentFilter === f ? 'bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                      {f === 'all' ? 'الكل' : f === 'completed' ? 'مكتمل' : f === 'pending' ? 'معلق' : 'فشل'}
                    </button>
                  ))}
                </div>
              </div>
              {payments.length === 0 ? (
                <p className="text-center text-gray-500 py-8">لا توجد مدفوعات</p>
              ) : (
                <div className="space-y-3">
                  {payments.map((p: any) => (
                    <div key={p.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{p.studentName || p.studentId}</h4>
                        <p className="text-xs text-gray-500">{p.method || 'Unknown'}{p.amount ? ' - ' + p.amount + ' جنيه' : ''}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.status === 'completed' ? 'bg-green-100 text-green-700' : p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {p.status === 'completed' ? 'مكتمل' : p.status === 'pending' ? 'معلق' : 'فشل'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== AI TAB ===== */}
          {activeTab === 'ai' && (
            <div className="max-w-2xl mx-auto">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                <Sparkles className="h-6 w-6 text-purple-600" />
                استخراج الأسئلة بالذكاء الاصطناعي
              </h2>
              <AiExtractionPanel onExtract={handleAiExtract} isExtracting={aiExtracting} questions={aiQuestionsPreview} error={aiError} successMsg={aiSuccessMsg} />
            </div>
          )}

          {/* ===== SETTINGS TAB ===== */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                <Settings className="h-6 w-6 text-gray-600" />
                الإعدادات
              </h2>
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">مفتاح Resend API</h3>
                  <input type="password" value={configs.resend_api_key || ''} onChange={(e) => setConfigs({ ...configs, resend_api_key: e.target.value })} placeholder="re_xxxxxxxxxxxx" dir="ltr" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-mono" />
                  <p className="text-xs text-gray-400 mt-1">يستخدم لإرسال إشعارات البريد الإلكتروني</p>
                </div>
                <button onClick={async () => { try { await fetch('/api/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(configs) }); showToast('تم حفظ الإعدادات'); } catch { showToast('خطأ في الحفظ', 'error'); } }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">حفظ الإعدادات</button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

// ==========================================
// ===== AI EXTRACTION PANEL ================
// ==========================================

function AiExtractionPanel({ onExtract, isExtracting, questions, error, successMsg }: {
  onExtract: (e: React.FormEvent) => void;
  isExtracting: boolean;
  questions: { text: string; options: string[]; correct: string; explanation: string }[];
  error: string;
  successMsg: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
      <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-purple-600" />
        استخراج الأسئلة بالذكاء الاصطناعي
      </h4>
      <form onSubmit={onExtract} className="space-y-3">
        <div className="flex items-center gap-3">
          <input type="file" name="file" accept=".pdf,.png,.jpg,.jpeg" required className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
          <button type="submit" disabled={isExtracting} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1">
            {isExtracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            استخراج
          </button>
        </div>
      </form>
      {error && <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{error}</p>}
      {successMsg && <p className="text-green-600 text-sm bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">{successMsg}</p>}
      {questions.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-500">الأسئلة المستخرجة:</p>
          {questions.map((q, idx) => (
            <div key={idx} className="text-sm bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
              <p className="font-medium text-gray-900 dark:text-white">{idx + 1}. {q.text}</p>
              {q.options && <p className="text-xs text-gray-500 mt-1">{q.options.join(' | ')}</p>}
              {q.correct && <p className="text-xs text-green-600">الإجابة: {q.correct}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
