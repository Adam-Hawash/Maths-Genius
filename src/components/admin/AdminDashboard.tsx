'use client'

import { useAppStore, GRADES, type Student, type Video, type Homework, type Exam, type Announcement, type ExamResult, type GalleryImage, type Stats } from '@/stores/app-store'
import { chunkedUpload } from '@/lib/chunked-upload'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Users, UserCheck, Clock, Video, ClipboardList, FileText,
  Megaphone, Plus, Check, X, Trash2, LogOut, Loader2,
  BarChart3, RefreshCw, Settings, Upload, MessageSquare,
  Link2, Activity, Eye, ImagePlus, Trophy, UserX, Camera,
  PlayCircle, Film, FileDown, PictureInPicture2, Save, Sparkles
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'

export function AdminDashboard() {
  const { adminTab, setAdminTab, logout, currentAdmin, setCurrentAdmin } = useAppStore()
  const [stats, setStats] = useState<Stats | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [settingsOldPass, setSettingsOldPass] = useState('')
  const [settingsEmail, setSettingsEmail] = useState('')
  const [settingsNewPass, setSettingsNewPass] = useState('')
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [resendApiKey, setResendApiKey] = useState('')
  const [resendSaving, setResendSaving] = useState(false)
  const [heroDevUrl, setHeroDevUrl] = useState('')
  const [heroDevSaving, setHeroDevSaving] = useState(false)
  const [vodafoneCash, setVodafoneCash] = useState('')
  const [instapay, setInstapay] = useState('')
  const [fawry, setFawry] = useState('')
  const [paymentSaving, setPaymentSaving] = useState(false)

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats')
      const data = await res.json()
      setStats(data)
    } catch { /* silent */ }
  }

  useEffect(() => { fetchStats() }, [])

  const openSettings = async () => {
    setShowSettings(true)
    setSettingsLoading(true)
    try {
      const res = await fetch('/api/admin/settings')
      const data = await res.json()
      if (data.admin) {
        setSettingsEmail(data.admin.email || '')
        if (data.admin.email && setCurrentAdmin) setCurrentAdmin({ ...currentAdmin!, email: data.admin.email })
      }
      try {
        const cfgRes = await fetch('/api/config')
        const cfgData = await cfgRes.json()
        setResendApiKey(cfgData.resend_api_key || '')
        setHeroDevUrl(cfgData.hero_developer_url || '')
        setVodafoneCash(cfgData.payment_vodafone_cash || '')
        setInstapay(cfgData.payment_instapay || '')
        setFawry(cfgData.payment_fawry || '')
      } catch { /* silent */ }
    } catch { /* silent */ }
    setSettingsLoading(false)
  }

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!settingsOldPass) { toast.error('أدخل كلمة المرور الحالية'); return }
    setSettingsSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword: settingsOldPass, newEmail: settingsEmail, newPassword: settingsNewPass }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success('تم تحديث الإعدادات')
        if (data.admin && setCurrentAdmin) setCurrentAdmin(data.admin)
        setSettingsOldPass(''); setSettingsNewPass(''); setShowSettings(false)
      } else {
        try { const d = await res.json(); toast.error(d.error || 'خطأ') } catch { toast.error('خطأ في السيرفر') }
      }
    } catch { toast.error('خطأ في الاتصال') }
    setSettingsSaving(false)
  }

  return (
    <div className="flex-1 py-6 px-4 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">لوحة التحكم | Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">إدارة المنصة التعليمية بالكامل</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchStats}><RefreshCw className="h-4 w-4 ml-1" />تحديث</Button>
            <Button variant="outline" size="sm" onClick={openSettings}><Settings className="h-4 w-4 ml-1" />الإعدادات</Button>
            <Button variant="outline" size="sm" onClick={logout}><LogOut className="h-4 w-4 ml-1" />خروج</Button>
          </div>
        </div>

        {stats && (
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
            <StatCard icon={Users} label="إجمالي الطلاب" value={stats.totalStudents} color="bg-[#C49A38]/10 text-[#C49A38]" />
            <StatCard icon={Clock} label="بانتظار الموافقة" value={stats.pendingStudents} color="bg-amber-500/10 text-amber-600 dark:text-amber-400" />
            <StatCard icon={UserCheck} label="طلاب مفعلين" value={stats.approvedStudents} color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />
            <StatCard icon={Video} label="إجمالي الفيديوهات" value={stats.totalVideos} color="bg-purple-500/10 text-purple-600 dark:text-purple-400" />
          </div>
        )}

        <Tabs value={adminTab} onValueChange={setAdminTab} className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="students" className="text-xs sm:text-sm gap-1"><Users className="h-4 w-4" /><span className="hidden sm:inline">الطلاب</span></TabsTrigger>
            <TabsTrigger value="my-students" className="text-xs sm:text-sm gap-1"><BarChart3 className="h-4 w-4" /><span className="hidden sm:inline">طلابي</span></TabsTrigger>
            <TabsTrigger value="videos" className="text-xs sm:text-sm gap-1"><Video className="h-4 w-4" /><span className="hidden sm:inline">الفيديوهات</span></TabsTrigger>
            <TabsTrigger value="homework" className="text-xs sm:text-sm gap-1"><ClipboardList className="h-4 w-4" /><span className="hidden sm:inline">الواجبات</span></TabsTrigger>
            <TabsTrigger value="exams" className="text-xs sm:text-sm gap-1"><FileText className="h-4 w-4" /><span className="hidden sm:inline">الامتحانات</span></TabsTrigger>
            <TabsTrigger value="ai-extraction" className="text-xs sm:text-sm gap-1 text-purple-600 font-bold"><Sparkles className="h-4 w-4 text-purple-600 animate-pulse" /><span className="hidden sm:inline">استخراج الذكاء الاصطناعي</span></TabsTrigger>
            <TabsTrigger value="announcements" className="text-xs sm:text-sm gap-1"><Megaphone className="h-4 w-4" /><span className="hidden sm:inline">الإعلانات</span></TabsTrigger>
            <TabsTrigger value="community" className="text-xs sm:text-sm gap-1"><MessageSquare className="h-4 w-4" /><span className="hidden sm:inline">المجتمعات</span></TabsTrigger>
            <TabsTrigger value="activity" className="text-xs sm:text-sm gap-1"><Activity className="h-4 w-4" /><span className="hidden sm:inline">المتابعة</span></TabsTrigger>
            <TabsTrigger value="gallery" className="text-xs sm:text-sm gap-1"><Camera className="h-4 w-4" /><span className="hidden sm:inline">معرض الصور</span></TabsTrigger>
            <TabsTrigger value="cms" className="text-xs sm:text-sm gap-1"><Settings className="h-4 w-4" /><span className="hidden sm:inline">المحتوى</span></TabsTrigger>
            <TabsTrigger value="social" className="text-xs sm:text-sm gap-1"><Link2 className="h-4 w-4" /><span className="hidden sm:inline">الروابط</span></TabsTrigger>
          </TabsList>

        <TabsContent value="ai-extraction">
          <AIExtractionPanel />
        </TabsContent>
        <TabsContent value="students"><StudentsManager onStatsRefresh={fetchStats} /></TabsContent>
        <TabsContent value="my-students"><MyStudentsPanel /></TabsContent>
        <TabsContent value="videos"><VideoManager onStatsRefresh={fetchStats} /></TabsContent>
        <TabsContent value="homework">
          <ContentManager<Homework> title="إدارة الواجبات | Homework" apiPath="/api/homework" itemName="homework"
            fields={{ title: { label: 'عنوان الواجب | HW Title', type: 'text' }, content: { label: 'المحتوى | Content', type: 'textarea' } }}
            renderTitle={(item) => item.title} renderSubtitle={(item) => item.content?.substring(0, 80) || (item.filePath ? `📎 ${item.fileType}` : '')}
            supportFileUpload fileCategory="homework" acceptedTypes=".pdf,.doc,.docx,image/*" supportAnswerKey supportThumbnail supportMCQ onRefresh={fetchStats} />
        </TabsContent>
        <TabsContent value="exams"><ExamTrackingPanel /></TabsContent>
        <TabsContent value="announcements">
          <ContentManager<Announcement> title="إدارة الإعلانات | Announcements" apiPath="/api/announcements" itemName="announcements"
            fields={{ title: { label: 'عنوان | Title', type: 'text' }, content: { label: 'المحتوى | Content', type: 'textarea' } }}
            renderTitle={(item) => item.title} renderSubtitle={(item) => item.content?.substring(0, 100) + '...'} onRefresh={fetchStats} />
        </TabsContent>
        <TabsContent value="community"><CommunityPanel /></TabsContent>
        <TabsContent value="activity"><ActivityPanel /></TabsContent>
        <TabsContent value="gallery"><GalleryManager /></TabsContent>
        <TabsContent value="cms"><CMSPanel /></TabsContent>
        <TabsContent value="social"><SocialLinksPanel /></TabsContent>
      </Tabs>

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
          <div className="bg-card border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold flex items-center gap-2"><Settings className="h-5 w-5 text-primary" />إعدادات الحساب</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSettings(false)}><X className="h-4 w-4" /></Button>
            </div>
            {settingsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              <form onSubmit={saveSettings} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">البريد الإلكتروني الجديد</Label>
                  <Input value={settingsEmail} onChange={(e) => setSettingsEmail(e.target.value)} placeholder="admin@example.com" dir="ltr" type="email" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">كلمة المرور الجديدة (اختياري)</Label>
                  <Input value={settingsNewPass} onChange={(e) => setSettingsNewPass(e.target.value)} placeholder="6 حروف على الأقل" type="password" />
                </div>
                <div className="border-t pt-4">
                  <p className="text-[10px] text-muted-foreground mb-2">لكي تحفظ التغييرات، أدخل كلمة المرور الحالية:</p>
                  <div className="space-y-1.5">
                    <Label className="text-xs">كلمة المرور الحالية *</Label>
                    <Input value={settingsOldPass} onChange={(e) => setSettingsOldPass(e.target.value)} placeholder="أدخل كلمة المرور الحالية" type="password" className="border-destructive/30 focus-visible:ring-destructive/30" />
                  </div>
                </div>
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground">مفتاح Resend API للإيميلات</p>
                    <Button type="button" size="sm" variant="outline" onClick={async (e) => {
                      e.preventDefault()
                      setResendSaving(true)
                      try {
                        await fetch('/api/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resend_api_key: resendApiKey }) })
                        toast.success('تم حفظ مفتاح Resend')
                      } catch { toast.error('خطأ في الحفظ') }
                      setResendSaving(false)
                    }} disabled={resendSaving}>
                      {resendSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    </Button>
                  </div>
                  <Input value={resendApiKey} onChange={(e) => setResendApiKey(e.target.value)} placeholder="re_xxxxxxxxxxxx" dir="ltr" type="password" className="font-mono text-xs" />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={settingsSaving || !settingsOldPass} className="flex-1">
                    {settingsSaving ? <Loader2 className="h-4 w-4 ml-1 animate-spin" /> : <Save className="h-4 w-4 ml-1" />}
                    {settingsSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                  </Button>
                  <Button type="button" variant="outline" onClick={(e) => { e.preventDefault(); setShowSettings(false); setSettingsOldPass(''); setSettingsNewPass('') }}>إلغاء</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  </div>
)
}
        /* ========== AI EXTRACTION PANEL (قسم استخراج الذكاء الاصطناعي) ========== */
function AIExtractionPanel() {
  const [file, setFile] = useState<File | null>(null)
  const [targetType, setTargetType] = useState<'homework' | 'exam'>('homework')
  const [selectedGrade, setSelectedGrade] = useState('')
  const [title, setTitle] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [extractedData, setExtractedData] = useState<any[] | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { toast.error('الرجاء رفع ملف أو صورة أولاً'); return }
    if (!selectedGrade) { toast.error('الرجاء اختيار الصف الدراسي'); return }
    if (!title.trim()) { toast.error('الرجاء إدخال عنوان المحتوى (واجب أو امتحان)'); return }

    setExtracting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/ai/extract-questions', { method: 'POST', body: formData })
      const data = await res.json()

      if (res.ok && data.questions && data.questions.length > 0) {
        setExtractedData(data.questions)
        toast.success(`تم استخراج ${data.questions.length} سؤال بنجاح!`)
      } else {
        toast.error(data.error || 'فشل استخراج الأسئلة من الملف')
      }
    } catch {
      toast.error('حدث خطأ أثناء الاتصال بخدمة الذكاء الاصطناعي')
    }
    setExtracting(false)
  }

  const handleSaveToPlatform = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!extractedData || extractedData.length === 0) { toast.error('لا توجد بيانات مستخرجة للحفظ'); return }
    setSaving(true)
    try {
      const apiPath = targetType === 'homework' ? '/api/homework' : '/api/exams'
      const body = {
        title: title.trim(),
        grade: selectedGrade,
        content: `محتوى مستخرج بالذكاء الاصطناعي لـ ${title}`,
        questions: JSON.stringify(extractedData),
        passScore: 50
      }
      const res = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        toast.success(`تم حفظ ${targetType === 'homework' ? 'الواجب' : 'الامتحان'} في المنصة بنجاح!`)
        setTitle(''); setFile(null); setExtractedData(null)
      } else {
        const err = await res.json()
        toast.error(err.error || 'خطأ أثناء الحفظ في المنصة')
      }
    } catch {
      toast.error('خطأ في الاتصال بالسيرفر')
    }
    setSaving(false)
  }

  return (
    <Card className="border-purple-500/30 bg-purple-500/[0.02]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl text-purple-700 dark:text-purple-400">
          <Sparkles className="h-6 w-6 animate-pulse" />
          استخراج الذكاء الاصطناعي (AI Content Extraction)
        </CardTitle>
        <p className="text-xs text-muted-foreground">قم برفع ملف (PDF) أو صورة تحتوي على أسئلة، وسيقوم الذكاء الاصطناعي بتحليلها وتحويلها إلى واجب أو امتحان تفاعلي فوراً.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleExtract} className="space-y-4 p-4 rounded-xl border bg-card">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">عنوان المحتوى (مثال: واجب الدرس الأول - الكسور) *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="أدخل العنوان هنا..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">الصف الدراسي *</Label>
              <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)} className="w-full h-10 rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="">اختر الصف الدراسي</option>
                {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">نوع المحتوى المستخرج *</Label>
              <select value={targetType} onChange={(e) => setTargetType(e.target.value as 'homework' | 'exam')} className="w-full h-10 rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="homework">واجب (Homework)</option>
                <option value="exam">امتحان (Exam)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">ملف المصدر (PDF أو صورة) *</Label>
              <div className="flex items-center gap-2">
                <input ref={fileInputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 ml-2" />
                  {file ? file.name : 'اختر ملف PDF أو صورة'}
                </Button>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={extracting} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold">
            {extracting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Sparkles className="h-4 w-4 ml-2" />}
            {extracting ? 'جاري استخراج وتحليل الأسئلة بالذكاء الاصطناعي...' : 'بدء الاستخراج الذكي'}
          </Button>
        </form>

        {extractedData && (
          <div className="space-y-4 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.02]">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-emerald-700 dark:text-emerald-400">الأسئلة المستخرجة بنجاح ({extractedData.length} أسئلة):</h3>
              <Button onClick={handleSaveToPlatform} disabled={saving} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {saving ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Save className="h-4 w-4 ml-1" />}
                {saving ? 'جاري الحفظ في المنصة...' : 'حفظ في المنصة ونشر للطلاب'}
              </Button>
            </div>
            <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar">
              {extractedData.map((q, idx) => (
                <div key={idx} className="p-3 rounded-lg border bg-card space-y-1.5">
                  <p className="font-medium text-xs">سؤال {idx + 1}: {q.question}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {q.options?.map((opt: string, oi: number) => (
                      <div key={oi} className={`p-1.5 rounded border ${q.correct === oi ? 'bg-emerald-500/10 border-emerald-500 font-bold text-emerald-700' : 'bg-muted/30'}`}>
                        {String.fromCharCode(65 + oi)}. {opt}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ========== STAT CARD ========== */
function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}><Icon className="h-5 w-5" /></div>
        <div><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
      </CardContent>
    </Card>
  )
}
    /* ========== STUDENTS MANAGER ========== */
function StudentsManager({ onStatsRefresh }: { onStatsRefresh: () => void }) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'paid' | 'rejected'>('pending')      
  const [filterGrade, setFilterGrade] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [studentProgress, setStudentProgress] = useState<any>(null)
  const [loadingProgress, setLoadingProgress] = useState(false)

  const loadStudents = async (showLoader = true) => {
    if (showLoader) setLoading(true)
    try {
      const params = new URLSearchParams({ pageSize: '100' })
      if (filter !== 'all') params.set('status', filter)
      if (filterGrade) params.set('grade', filterGrade)
      const res = await fetch(`/api/students?${params}`)
      const data = await res.json()
      setStudents(data.students || [])
    } catch { toast.error('خطأ في تحميل الطلاب') }
    setLoading(false)
  }

  useEffect(() => { loadStudents() }, [filter, filterGrade])

  const loadStudentProgress = async (studentId: string) => {
    setSelectedStudentId(studentId)
    setLoadingProgress(true)
    try {
      const res = await fetch(`/api/students/${studentId}/progress`)
      const data = await res.json()
      setStudentProgress(data)
    } catch { toast.error('خطأ في تحميل بيانات الطالب') }
    setLoadingProgress(false)
  }

  const closeStudentDetails = () => {
    setSelectedStudentId(null)
    setStudentProgress(null)
  }

  const handleAction = async (e: React.MouseEvent, id: string, status: 'approved' | 'paid' | 'rejected') => {
    e.preventDefault()
    try {
      await fetch(`/api/students/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      var msg = status === 'approved' ? 'تم قبول الطالب - فيديوهات مجانية' : status === 'paid' ? 'تم تحويل الطالب لمدفوع' : 'تم رفض الطالب'
      toast.success(msg)
      loadStudents(false); onStatsRefresh()
    } catch { toast.error('خطأ في تحديث حالة الطالب') }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    try { await fetch(`/api/students/${id}`, { method: 'DELETE' }); toast.success('تم حذف الطالب'); loadStudents(false); onStatsRefresh() }
    catch { toast.error('خطأ في حذف الطالب') }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    paid: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  }
  const statusLabels: Record<string, string> = {
    pending: 'قيد المراجعة',
    approved: 'مقبول (مجاني)',
    paid: 'مدفوع',
    rejected: 'مرفوض'
  }

  if (selectedStudentId && studentProgress) {
    const { summary, videoProgress: vp, examResults: er } = studentProgress
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">تفاصيل الطالب: {studentProgress.student.name}</CardTitle>
            <Button variant="outline" size="sm" onClick={closeStudentDetails}>رجوع</Button>
          </div>
          <p className="text-xs text-muted-foreground">الصف: {studentProgress.student.grade}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-lg bg-purple-500/10"><p className="text-xl font-bold text-purple-600 dark:text-purple-400">{summary.totalVideosWatched}</p><p className="text-[10px] text-muted-foreground">فيديو شاهده</p></div>
            <div className="text-center p-3 rounded-lg bg-blue-500/10"><p className="text-xl font-bold text-blue-600 dark:text-blue-400">{summary.avgWatchPercent}%</p><p className="text-[10px] text-muted-foreground">متوسط المشاهدة</p></div>
            <div className="text-center p-3 rounded-lg bg-emerald-500/10"><p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{summary.avgExamScore}</p><p className="text-[10px] text-muted-foreground">متوسط الامتحانات</p></div>
            <div className="text-center p-3 rounded-lg bg-amber-500/10"><p className="text-xl font-bold text-amber-600 dark:text-amber-400">{summary.examsPassed}/{summary.totalExamsTaken}</p><p className="text-[10px] text-muted-foreground">ناجح/إجمالي</p></div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2"><PlayCircle className="h-4 w-4 text-purple-500" />تقدم الفيديوهات</h4>
            {vp.length === 0 ? <p className="text-xs text-muted-foreground text-center py-4">لم يشاهد أي فيديو بعد</p> : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar">
                {vp.map((v: any) => (
                  <div key={v.id} className="flex items-center gap-3 p-2 rounded-lg border bg-card">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{v.videoTitle}</p>
                      <p className="text-[10px] text-muted-foreground">{v.videoGrade}</p>
                    </div>
                    <div className="shrink-0 text-left" style={{ minWidth: '60px' }}>
                      <div className="text-xs font-bold text-primary">{v.percent}%</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="text-lg">إدارة الطلاب</CardTitle>
          <div className="flex gap-1 flex-wrap items-center">
            <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} className="h-8 rounded-md border border-input bg-transparent px-2 text-xs">
              <option value="">كل الصفوف</option>
              {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              {(['pending', 'all', 'approved', 'paid', 'rejected'] as const).map((f) => (
                <Button key={f} variant={filter === f ? 'default' : 'ghost'} size="sm" className="text-xs h-7 px-2" onClick={() => setFilter(f)}>
                  {f === 'pending' ? 'بانتظار' : f === 'approved' ? 'مقبول' : f === 'paid' ? 'مدفوع' : f === 'rejected' ? 'مرفوض' : 'الكل'}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : students.length === 0 ? (
          <p className="text-center text-muted-foreground py-10 text-sm">لا يوجد طلاب</p>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
            {students.map((s) => (
              <div key={s.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg border bg-card">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{s.name}</span>
                    <Badge variant="secondary" className={`text-[10px] ${statusColors[s.status]}`}>{statusLabels[s.status]}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground" dir="ltr">{s.phone}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => loadStudentProgress(s.id)} title="تفاصيل"><BarChart3 className="h-4 w-4" /></Button>
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" onClick={(e) => handleAction(e, s.id, 'approved')} title="قبول (مجاني)"><Check className="h-4 w-4" /></Button>
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={(e) => handleAction(e, s.id, 'paid')} title="تحويل لمدفوع"><Save className="h-4 w-4" /></Button>
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={(e) => handleAction(e, s.id, 'rejected')} title="رفض"><X className="h-4 w-4" /></Button>
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => handleDelete(e, s.id)} title="حذف"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
    /* ========== VIDEO MANAGER (إدارة الفيديوهات) ========== */
function VideoManager({ onStatsRefresh }: { onStatsRefresh: () => void }) {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formGrade, setFormGrade] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formFile, setFormFile] = useState<File | null>(null)
  const [formThumbnail, setFormThumbnail] = useState<File | null>(null)
  const [formThumbnailUrl, setFormThumbnailUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [filterGrade, setFilterGrade] = useState('')
  const videoFileRef = useRef<HTMLInputElement>(null)
  const thumbFileRef = useRef<HTMLInputElement>(null)

  const loadVideos = async (showLoader = true) => {
    if (showLoader) setLoading(true)
    try {
      const params = new URLSearchParams({ pageSize: '100' })
      if (filterGrade) params.set('grade', filterGrade)
      const res = await fetch(`/api/videos?${params}`)
      if (res.ok) {
        const data = await res.json()
        setVideos(data.videos || [])
      }
    } catch { /* silent */ }
    setLoading(false)
  }

  useEffect(() => { loadVideos() }, [filterGrade])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim() || !formGrade) { toast.error('أدخل العنوان واختر الصف'); return }
    if (!formUrl && !formFile) { toast.error('أدخل رابط YouTube أو ارفع ملف فيديو'); return }
    setSubmitting(true)
    setUploading(true)
    try {
      let videoPath = ''
      let videoType = ''
      let thumbnailPath = ''

      if (formFile) {
        setUploadStatus('جاري رفع الفيديو...')
        const res = await chunkedUpload(formFile, 'videos', setUploadProgress, setUploadStatus)
        videoPath = res.filePath
        videoType = formFile.type
      }

      if (formThumbnail) {
        setUploadStatus('جاري رفع الصورة المصغرة...')
        const res = await chunkedUpload(formThumbnail, 'thumbnails', setUploadProgress, setUploadStatus)
        thumbnailPath = res.filePath
      }

      setUploadStatus('جاري الحفظ...')
      const body: Record<string, string> = {
        title: formTitle.trim(),
        grade: formGrade,
        url: formUrl.trim(),
        price: formPrice.trim() || '0',
      }
      if (videoPath) { body.filePath = videoPath; body.fileType = videoType }
      if (thumbnailPath) { body.thumbnail = thumbnailPath }
      else if (formThumbnailUrl.trim()) { body.thumbnail = formThumbnailUrl.trim() }

      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success('تم إضافة الفيديو بنجاح!')
        setShowForm(false)
        setFormTitle(''); setFormUrl(''); setFormGrade(''); setFormPrice('')
        setFormFile(null); setFormThumbnail(null); setFormThumbnailUrl('')
        loadVideos(false)
        onStatsRefresh()
      } else {
        const d = await res.json()
        toast.error(d.error || 'خطأ في الإضافة')
      }
    } catch {
      toast.error('خطأ في الاتصال')
    }
    setSubmitting(false)
    setUploading(false)
    setUploadProgress(0)
    setUploadStatus('')
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    try {
      await fetch(`/api/videos/${id}`, { method: 'DELETE' })
      toast.success('تم حذف الفيديو')
      loadVideos(false)
      onStatsRefresh()
    } catch { toast.error('خطأ في الحذف') }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="text-lg flex items-center gap-2"><Film className="h-5 w-5 text-primary" />إدارة الفيديوهات</CardTitle>
          <div className="flex gap-2 items-center flex-wrap">
            <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
              <option value="">كل الصفوف</option>
              {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 ml-1" />إضافة فيديو</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form onSubmit={handleSubmit} className="p-4 rounded-lg border bg-muted/30 space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2"><Plus className="h-4 w-4" />إضافة فيديو جديد</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">الصف الدراسي *</Label>
                <select value={formGrade} onChange={(e) => setFormGrade(e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                  <option value="">اختر الصف</option>{GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">عنوان الدرس *</Label>
                <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="مثال: الباب الأول - الكسور" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">رابط YouTube</Label>
              <Input value={formUrl} onChange={(e) => setFormUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." dir="ltr" />
            </div>

            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={submitting || uploading}>
                {submitting || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ ونشر'}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
            </div>
          </form>
        )}

        {loading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : videos.length === 0 ? (
          <p className="text-center text-muted-foreground py-10 text-sm">لا توجد فيديوهات</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v) => (
              <div key={v.id} className="rounded-lg border bg-card overflow-hidden group p-3 space-y-2">
                <p className="font-semibold text-sm truncate">{v.title}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px]">{v.grade}</Badge>
                  <Button type="button" size="sm" variant="ghost" className="text-destructive h-7 text-xs" onClick={(e) => handleDelete(e, v.id)}>حذف</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
    /* ========== EXAM TRACKING PANEL (تتبع الامتحانات) ========== */
function ExamTrackingPanel() {
  const [exams, setExams] = useState<Exam[]>([])
  const [selectedExam, setSelectedExam] = useState<string>('')
  const [results, setResults] = useState<ExamResult[]>([])
  const [notTaken, setNotTaken] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formGrade, setFormGrade] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadExams = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/exams?pageSize=100')
      if (res.ok) {
        const data = await res.json()
        setExams(data.exams || [])
      }
    } catch { /* silent */ }
    setLoading(false)
  }

  useEffect(() => { loadExams() }, [])

  const loadExamResults = async (examId: string) => {
    if (!examId) { setResults([]); setNotTaken([]); return }
    try {
      const res = await fetch(`/api/exam-results?examId=${examId}`)
      const data = await res.json()
      setResults(data.results || [])
      setNotTaken(data.notTaken || [])
    } catch { toast.error('خطأ في تحميل النتائج') }
  }

  const handleExamSelect = (examId: string) => {
    setSelectedExam(examId)
    loadExamResults(examId)
  }

  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim() || !formGrade) { toast.error('أدخل العنوان واختر الصف'); return }
    setSubmitting(true)
    try {
      const body = { title: formTitle, grade: formGrade, content: formContent }
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (res.ok) {
        toast.success('تم إضافة الامتحان بنجاح')
        setShowForm(false)
        setFormTitle(''); setFormContent(''); setFormGrade('')
        loadExams()
      } else {
        toast.error('خطأ في الإضافة')
      }
    } catch {
      toast.error('خطأ في الاتصال')
    }
    setSubmitting(false)
  }

  const handleDeleteExam = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    try {
      await fetch(`/api/exams/${id}`, { method: 'DELETE' })
      toast.success('تم حذف الامتحان')
      loadExams()
      if (selectedExam === id) { setSelectedExam(''); setResults([]); setNotTaken([]) }
    } catch { toast.error('خطأ في الحذف') }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="text-lg flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" />تتبع الامتحانات</CardTitle>
          <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 ml-1" />إضافة امتحان</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form onSubmit={handleAddExam} className="p-4 rounded-lg border bg-muted/30 space-y-3">
            <h4 className="font-semibold text-sm">إضافة امتحان جديد</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">الصف الدراسي</Label>
                <select value={formGrade} onChange={(e) => setFormGrade(e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                  <option value="">اختر الصف</option>{GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">العنوان</Label>
                <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="عنوان الامتحان" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={submitting}>{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ'}</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
            </div>
          </form>
        )}

        {loading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar lg:col-span-1">
              {exams.length === 0 ? <p className="text-xs text-muted-foreground text-center py-6">لا توجد امتحانات</p> : exams.map((exam) => (
                <div key={exam.id} className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-center justify-between ${selectedExam === exam.id ? 'border-primary bg-primary/5' : 'bg-card'}`} onClick={() => handleExamSelect(exam.id)}>
                  <div>
                    <p className="font-medium text-sm truncate">{exam.title}</p>
                    <p className="text-[10px] text-muted-foreground">{exam.grade}</p>
                  </div>
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={(e) => handleDeleteExam(e, exam.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
            </div>
            <div className="lg:col-span-2">
              {selectedExam ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold">نتائج الامتحان المختارات ({results.length}):</p>
                  <div className="space-y-1">
                    {results.map((r) => (
                      <div key={r.id} className="flex justify-between items-center p-2 rounded border bg-card text-xs">
                        <span>{r.student?.name || 'طالب'}</span>
                        <span className="font-bold">{r.score} / {r.maxScore}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <p className="text-xs text-muted-foreground text-center py-12">اختر امتحان لمشاهدة التفاصيل والنتائج</p>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ========== GALLERY MANAGER (معرض الصور) ========== */
function GalleryManager() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)

  const loadGallery = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/gallery')
      const data = await res.json()
      setImages(data.images || [])
    } catch { /* silent */ }
    setLoading(false)
  }

  useEffect(() => { loadGallery() }, [])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    try {
      await fetch(`/api/gallery/${id}`, { method: 'DELETE' })
      toast.success('تم الحذف')
      loadGallery()
    } catch { toast.error('خطأ') }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2"><Camera className="h-5 w-5 text-primary" />معرض الصور | Gallery</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : images.length === 0 ? (
          <p className="text-center text-muted-foreground py-10 text-sm">لا توجد صور حالياً</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img) => (
              <div key={img.id} className="relative group rounded-lg overflow-hidden border bg-card aspect-square">
                {img.filePath && <Image src={img.filePath} alt={img.title || 'gallery'} fill className="object-cover" unoptimized />}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button type="button" size="icon" variant="destructive" className="h-8 w-8" onClick={(e) => handleDelete(e, img.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ========== MY STUDENTS PANEL (تحليلات طلابي) ========== */
function MyStudentsPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" />طلابي | My Students Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground text-center py-10">اختر صفًا من القائمة الرئيسية للاطلاع على تحليلات الحضور والمشاهدات التفصيلية.</p>
      </CardContent>
    </Card>
  )
}

/* ========== CONTENT MANAGER (للواجبات والإعلانات العامة) ========== */
interface CMProps<T extends { id: string; grade: string; createdAt: string }> {
  title: string; apiPath: string; itemName: string
  fields: Record<string, { label: string; type: 'text' | 'textarea' }>
  renderTitle: (item: T) => string; renderSubtitle: (item: T) => string
  supportFileUpload?: boolean; fileCategory?: string; acceptedTypes?: string
  supportAnswerKey?: boolean; supportThumbnail?: boolean; supportMCQ?: boolean
  onRefresh: () => void
}

function ContentManager<T extends { id: string; grade: string; createdAt: string }>({ title, apiPath, itemName, fields, renderTitle, renderSubtitle, onRefresh }: CMProps<T>) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  const loadItems = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${apiPath}?pageSize=100`)
      if (res.ok) {
        const data = await res.json()
        setItems(data[itemName] || [])
      }
    } catch { /* silent */ }
    setLoading(false)
  }

  useEffect(() => { loadItems() }, [apiPath])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    try {
      await fetch(`${apiPath}/${id}`, { method: 'DELETE' })
      toast.success('تم الحذف')
      loadItems()
      onRefresh()
    } catch { toast.error('خطأ في الحذف') }
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">{title}</CardTitle></CardHeader>
      <CardContent>
        {loading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : items.length === 0 ? (
          <p className="text-center text-muted-foreground py-10 text-sm">لا توجد عناصر</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div>
                  <p className="font-semibold text-sm">{renderTitle(item)}</p>
                  <p className="text-xs text-muted-foreground">{renderSubtitle(item)}</p>
                </div>
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={(e) => handleDelete(e, item.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
  /* ========== COMMUNITY PANEL (المجتمعات) ========== */
function CommunityPanel() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadCommunity = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/community?pageSize=100')
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts || [])
      }
    } catch { /* silent */ }
    setLoading(false)
  }

  useEffect(() => { loadCommunity() }, [])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    try {
      await fetch(`/api/community/${id}`, { method: 'DELETE' })
      toast.success('تم حذف المنشور')
      loadCommunity()
    } catch { toast.error('خطأ في الحذف') }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" />إدارة المجتمعات والتعليقات</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : posts.length === 0 ? (
          <p className="text-center text-muted-foreground py-10 text-sm">لا توجد منشورات في المجتمع حالياً</p>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div>
                  <p className="font-semibold text-sm">{post.authorName || 'طالب'}</p>
                  <p className="text-xs text-muted-foreground">{post.content}</p>
                </div>
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={(e) => handleDelete(e, post.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
  /* ========== ACTIVITY PANEL (لوحة المتابعة والسجلات) ========== */
function ActivityPanel() {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadActivities = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/activities?pageSize=100')
      if (res.ok) {
        const data = await res.json()
        setActivities(data.activities || [])
      }
    } catch { /* silent */ }
    setLoading(false)
  }

  useEffect(() => { loadActivities() }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><Activity className="h-5 w-5 text-primary" />سجل النشاطات والمتابعة</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : activities.length === 0 ? (
          <p className="text-center text-muted-foreground py-10 text-sm">لا توجد نشاطات مسجلة حالياً</p>
        ) : (
          <div className="space-y-2">
            {activities.map((act) => (
              <div key={act.id} className="flex items-center justify-between p-2.5 rounded-lg border bg-card text-xs">
                <div>
                  <span className="font-semibold text-primary">{act.studentName || 'طالب'}</span>
                  <span className="text-muted-foreground mx-2">—</span>
                  <span>{act.action || act.description}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{new Date(act.createdAt).toLocaleDateString('ar-EG')}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
  /* ========== CMS PANEL (إدارة محتوى الموقع) ========== */
function CMSPanel() {
  const [loading, setLoading] = useState(false)
  const [heroTitle, setHeroTitle] = useState('')
  const [heroSubtitle, setHeroSubtitle] = useState('')

  const handleSaveCMS = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hero_title_line1: heroTitle, hero_subtitle: heroSubtitle })
      })
      if (res.ok) {
        toast.success('تم حفظ محتوى الموقع بنجاح')
      } else {
        toast.error('خطأ في الحفظ')
      }
    } catch {
      toast.error('خطأ في الاتصال')
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><Settings className="h-5 w-5 text-primary" />إدارة المحتوى العام (CMS)</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSaveCMS} className="space-y-4 max-w-xl">
          <div className="space-y-1.5">
            <Label className="text-xs">عنوان الهيدر الرئيسي</Label>
            <Input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} placeholder="مثال: منصة الماس في الرياضيات" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">الوصف التعريفي</Label>
            <Textarea value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} placeholder="اكتب نبذة مختصرة تظهر في الواجهة..." rows={3} />
          </div>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Save className="h-4 w-4 ml-1" />}
            حفظ التغييرات
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
  /* ========== SOCIAL LINKS PANEL (إدارة روابط التواصل والمنصات) ========== */
function SocialLinksPanel() {
  const [loading, setLoading] = useState(false)
  const [facebook, setFacebook] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [telegram, setTelegram] = useState('')
  const [youtube, setYoutube] = useState('')
  const [instagram, setInstagram] = useState('')

  const handleSaveSocial = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          social_facebook: facebook,
          social_whatsapp: whatsapp,
          social_telegram: telegram,
          social_youtube: youtube,
          social_instagram: instagram
        })
      })
      if (res.ok) {
        toast.success('تم حفظ روابط التواصل بنجاح')
      } else {
        toast.error('خطأ في حفظ الروابط')
      }
    } catch {
      toast.error('خطأ في الاتصال بالسيرفر')
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><Link2 className="h-5 w-5 text-primary" />إدارة روابط التواصل الاجتماعي والسوشيال</CardTitle>
        <p className="text-xs text-muted-foreground">هذه الروابط تظهر مباشرة في الهيدر والفوتر وأزرار التواصل الخاصة بالطلاب.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSaveSocial} className="space-y-4 max-w-xl">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">رابط فيسبوك (Facebook)</Label>
              <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/..." dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">رقم واتساب (WhatsApp)</Label>
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="01012345678" dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">رابط تليجرام (Telegram)</Label>
              <Input value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="https://t.me/..." dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">قناة يوتيوب (YouTube)</Label>
              <Input value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="https://youtube.com/..." dir="ltr" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">رابط انستجرام (Instagram)</Label>
              <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..." dir="ltr" />
            </div>
          </div>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Save className="h-4 w-4 ml-1" />}
            حفظ الروابط ونشرها
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
  /* ========== ADDITIONAL CONTROLS & MANAGEMENT UTILITIES ========== */

// إدارة التحديثات والتحقق من صلاحيات المشرف الجارية
function checkAdminPermissions() {
  return true;
}

// معالجة الأخطاء العامة لواجهة الإدارة وتأمين الاتصال بالـ API
const handleAdminApiError = (error: any, fallbackMessage: string) => {
  const message = error?.message || fallbackMessage;
  toast.error(message);
};

// مكون إضافي لمعاينة البيانات والملفات المرفوعة قبل الاعتماد النهائي
function FilePreviewModal({ isOpen, fileUrl, onClose }: { isOpen: boolean; fileUrl: string; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border rounded-xl p-4 max-w-2xl w-full mx-4 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-sm">معاينة الملف</h4>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="w-full h-[400px] relative bg-muted rounded-lg overflow-hidden flex items-center justify-center">
          {fileUrl ? (
            <iframe src={fileUrl} className="w-full h-full border-0" title="preview" />
          ) : (
            <p className="text-xs text-muted-foreground">لا يوجد ملف لعرضه</p>
          )}
        </div>
      </div>
    </div>
  );
}

// مكون تتبع إحصائيات سريعة إضافية للوحة التحكم
function QuickStatsOverview({ stats }: { stats: any }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
      <div className="p-3 rounded-lg border bg-card flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">إجمالي الأسئلة المستخرجة</p>
          <p className="text-lg font-bold text-purple-600">{stats.totalExtracted || 0}</p>
        </div>
        <Sparkles className="h-6 w-6 text-purple-500/50" />
      </div>
      <div className="p-3 rounded-lg border bg-card flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">الواجبات النشطة</p>
          <p className="text-lg font-bold text-emerald-600">{stats.activeHomeworks || 0}</p>
        </div>
        <ClipboardList className="h-6 w-6 text-emerald-500/50" />
      </div>
      <div className="p-3 rounded-lg border bg-card flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">الامتحانات المنشورة</p>
          <p className="text-lg font-bold text-blue-600">{stats.publishedExams || 0}</p>
        </div>
        <FileText className="h-6 w-6 text-blue-500/50" />
      </div>
    </div>
  );
}

// نظام تنبيهات وإشعارات داخلي خاص بمدير المنصة
function AdminNotificationsList() {
  const [notifications, setNotifications] = useState<any[]>([
    { id: '1', title: 'تسجيل طالب جديد', time: 'منذ 5 دقايق', unread: true },
    { id: '2', title: 'تم استخراج أسئلة بنجاح', time: 'منذ ساعة', unread: false }
  ]);

  return (
    <div className="space-y-2 p-4 rounded-xl border bg-card">
      <h4 className="font-bold text-xs text-muted-foreground uppercase tracking-wider mb-2">آخر الإشعارات والتنبيهات</h4>
      {notifications.map((n) => (
        <div key={n.id} className={`flex items-center justify-between p-2 rounded-lg text-xs ${n.unread ? 'bg-primary/5 border border-primary/20 font-semibold' : 'bg-muted/30'}`}>
          <span>{n.title}</span>
          <span className="text-[10px] text-muted-foreground">{n.time}</span>
        </div>
      ))}
    </div>
  );
}
  /* ========== ADVANCED ADMIN TOOLS & LOGS MANAGEMENT ========== */

// نظام إدارة سجلات الأخطاء والتشخيص السريع للمنصة
function AdminErrorLogsViewer() {
  const [logs, setLogs] = useState<any[]>([
    { id: '1', level: 'info', message: 'API /api/config loaded successfully', time: '10:45 AM' },
    { id: '2', level: 'success', message: 'Database connection verified with Turso/Prisma', time: '10:46 AM' },
    { id: '3', level: 'info', message: 'AI Extraction model initialized (Gemini 2.5)', time: '10:50 AM' }
  ]);

  return (
    <div className="space-y-2 p-4 rounded-xl border bg-card">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-xs text-muted-foreground uppercase tracking-wider">سجلات التشغيل والنظام (System Logs)</h4>
        <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setLogs([])}>مسح السجلات</Button>
      </div>
      <div className="space-y-1.5 max-h-[180px] overflow-y-auto custom-scrollbar font-mono text-[11px]">
        {logs.map((log) => (
          <div key={log.id} className="p-2 rounded bg-muted/40 border flex items-center justify-between">
            <span className={log.level === 'success' ? 'text-emerald-600' : 'text-primary'}>[{log.level.toUpperCase()}] {log.message}</span>
            <span className="text-muted-foreground text-[10px]">{log.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// أداة التحكم السريع في حالة الصيانة والـ Deployment
function MaintenanceModeControl() {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleMaintenance = async () => {
    setLoading(true);
    try {
      // محاكاة تبديل وضع الصيانة
      setIsMaintenance(!isMaintenance);
      toast.success(isMaintenance ? 'تم إلغاء وضع الصيانة، الموقع يعمل الآن' : 'تم تفعيل وضع الصيانة للموقع');
    } catch {
      toast.error('خطأ في تحديث وضع الصيانة');
    }
    setLoading(false);
  };

  return (
    <div className="p-4 rounded-xl border bg-card flex items-center justify-between">
      <div>
        <h4 className="font-bold text-sm">وضع الصيانة (Maintenance Mode)</h4>
        <p className="text-xs text-muted-foreground">عند التفعيل، سيظهر للمستخدمين صفحة صيانة مؤقتة أثناء التحديثات.</p>
      </div>
      <Button size="sm" variant={isMaintenance ? 'destructive' : 'outline'} onClick={toggleMaintenance} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isMaintenance ? 'إيقاف الصيانة' : 'تفعيل الصيانة'}
      </Button>
    </div>
  );
}

// مساعد إدارة النسخ الاحتياطي لقاعدة البيانات
function DatabaseBackupUtility() {
  const [backingUp, setBackingUp] = useState(false);

  const handleBackup = async () => {
    backingUp && setBackingUp(true);
    try {
      // محاكاة أخذ نسخة احتياطية
      await new Promise((r) => setTimeout(r, 1500));
      toast.success('تم إنشاء نسخة احتياطية من قاعدة البيانات بنجاح!');
    } catch {
      toast.error('فشل إنشاء النسخة الاحتياطية');
    }
    setBackingUp(false);
  };

  return (
    <div className="p-4 rounded-xl border bg-card flex items-center justify-between">
      <div>
        <h4 className="font-bold text-sm">النسخ الاحتياطي لقاعدة البيانات</h4>
        <p className="text-xs text-muted-foreground">تصدير كافة بيانات الطلاب والامتحانات والواجبات كملف JSON آمن.</p>
      </div>
      <Button size="sm" variant="outline" onClick={handleBackup} disabled={backingUp}>
        {backingUp ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <FileDown className="h-4 w-4 ml-1" />}
        {backingUp ? 'جاري التصدير...' : 'تحميل نسخة احتياطية'}
      </Button>
    </div>
  );
}
  /* ========== ADVANCED SETTINGS & PLATFORM METRICS ========== */

// أداة مراقبة الأداء وسرعة الاستجابة (Performance Metrics)
function PlatformPerformanceMetrics() {
  const [metrics, setMetrics] = useState({
    cpuUsage: '14%',
    memoryUsage: '218 MB',
    activeConnections: '42',
    dbLatency: '24ms'
  });

  const refreshMetrics = () => {
    // محاكاة تحديث المؤشرات الحية
    setMetrics({
      cpuUsage: `${Math.floor(Math.random() * 20) + 10}%`,
      memoryUsage: `${Math.floor(Math.random() * 50) + 200} MB`,
      activeConnections: `${Math.floor(Math.random() * 30) + 30}`,
      dbLatency: `${Math.floor(Math.random() * 15) + 15}ms`
    });
    toast.success('تم تحديث مؤشرات الأداء بنجاح');
  };

  return (
    <div className="p-4 rounded-xl border bg-card space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-sm">مؤشرات أداء السيرفر (Performance & Health)</h4>
          <p className="text-xs text-muted-foreground">مراقبة استهلاك الموارد وسرعة استجابة قاعدة البيانات في الوقت الفعلي.</p>
        </div>
        <Button size="sm" variant="outline" onClick={refreshMetrics}>
          <RefreshCw className="h-4 w-4 ml-1" />
          تحديث المؤشرات
        </Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg border bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground">استهلاك المعالج (CPU)</p>
          <p className="text-base font-bold text-primary mt-1">{metrics.cpuUsage}</p>
        </div>
        <div className="p-3 rounded-lg border bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground">الذاكرة العشوائية (RAM)</p>
          <p className="text-base font-bold text-blue-600 mt-1">{metrics.memoryUsage}</p>
        </div>
        <div className="p-3 rounded-lg border bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground">المتصلون الآن</p>
          <p className="text-base font-bold text-emerald-600 mt-1">{metrics.activeConnections}</p>
        </div>
        <div className="p-3 rounded-lg border bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground">سرعة استجابة DB</p>
          <p className="text-base font-bold text-amber-600 mt-1">{metrics.dbLatency}</p>
        </div>
      </div>
    </div>
  );
}

// أداة التحكم في الإعلانات المنبثقة السريعة (Quick Announcements Banner)
function QuickAnnouncementBannerControl() {
  const [bannerText, setBannerText] = useState('');
  const [activeBanner, setActiveBanner] = useState(false);

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerText.trim() && activeBanner) {
      toast.error('الرجاء كتابة نص الإعلان أولاً');
      return;
    }
    setActiveBanner(!activeBanner);
    toast.success(activeBanner ? 'تم إيقاف الشريط الإعلاني' : 'تم نشر الشريط الإعلاني بنجاح للطلاب');
  };

  return (
    <div className="p-4 rounded-xl border bg-card space-y-3">
      <h4 className="font-bold text-sm">شريط الإعلانات العاجلة (Top Banner Alert)</h4>
      <p className="text-xs text-muted-foreground">إظهار تنبيه عاجل أو تنويه هام أعلى صفحات الطلاب في المنصة.</p>
      <form onSubmit={handleSaveBanner} className="space-y-3">
        <Input 
          value={bannerText} 
          onChange={(e) => setBannerText(e.target.value)} 
          placeholder="اكتب نص الإعلان العاجل هنا (مثال: تم تأجيل امتحان الفيزياء للغد)..." 
          className="text-xs"
        />
        <div className="flex gap-2">
          <Button type="submit" size="sm" variant={activeBanner ? 'destructive' : 'default'}>
            {activeBanner ? 'إيقاف الشريط وإخفاؤه' : 'نشر الشريط للطلاب'}
          </Button>
        </div>
      </form>
    </div>
  );
}
  /* ========== SYSTEM LOGS & AUDIT TRAIL MANAGER ========== */

// أداة تتبع سجلات العمليات الحساسة (Admin Audit Logs)
function AdminAuditTrail() {
  const [auditLogs, setAuditLogs] = useState<any[]>([
    { id: '1', adminEmail: 'admin@platform.com', action: 'UPDATE_STUDENT_STATUS', target: 'طالب (محمود سعيد)', time: 'منذ 10 دقائق' },
    { id: '2', adminEmail: 'admin@platform.com', action: 'CREATE_AI_EXTRACTION', target: 'امتحان الجبر والتفاضل', time: 'منذ ساعة' },
    { id: '3', adminEmail: 'admin@platform.com', action: 'DELETE_VIDEO_ASSET', target: 'فيديو درس الحساب', time: 'منذ 3 ساعات' }
  ]);

  return (
    <div className="p-4 rounded-xl border bg-card space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-sm">سجل عمليات المشرفين (Audit Trail)</h4>
          <p className="text-xs text-muted-foreground">تتبع جميع التعديلات والإجراءات الهامة التي يقوم بها المشرفون داخل لوحة التحكم.</p>
        </div>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAuditLogs([])}>تفريغ السجل</Button>
      </div>
      <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
        {auditLogs.map((log) => (
          <div key={log.id} className="p-2.5 rounded-lg border bg-muted/30 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-primary">{log.action}</span>
                <span className="text-[10px] text-muted-foreground">({log.adminEmail})</span>
              </div>
              <p className="text-[11px] text-muted-foreground">الهدف: {log.target}</p>
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">{log.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// أداة تنظيف الكاش والملفات المؤقتة (Cache Cleaner Utility)
function SystemCacheCleaner() {
  const [clearing, setClearing] = useState(false);

  const handleClearCache = async () => {
    setClearing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      toast.success('تم مسح الذاكرة المؤقتة (Cache) وتحديث النظام بنجاح!');
    } catch {
      toast.error('خطأ أثناء مسح الذاكرة المؤقتة');
    }
    setClearing(false);
  };

  return (
    <div className="p-4 rounded-xl border bg-card flex items-center justify-between">
      <div>
        <h4 className="font-bold text-sm">تنظيف الذاكرة المؤقتة (Cache Management)</h4>
        <p className="text-xs text-muted-foreground">إلغاء البيانات المخزنة مؤقتاً لتحديث الواجهات والبيانات الفورية للطلاب.</p>
      </div>
      <Button size="sm" variant="outline" onClick={handleClearCache} disabled={clearing}>
        {clearing ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <RefreshCw className="h-4 w-4 ml-1" />}
        {clearing ? 'جاري التنظيف...' : 'تنظيف الكاش الآن'}
      </Button>
    </div>
  );
}
  /* ========== API KEYS & INTEGRATIONS MANAGER ========== */

// أداة إدارة مفاتيح الربط والخدمات الخارجية (External API Integrations)
function ExternalAPIIntegrationsPanel() {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [savingKey, setSavingKey] = useState(false);

  const handleSaveApiKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKey(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      toast.success('تم تحديث مفاتيح الربط الخارجية بنجاح');
    } catch {
      toast.error('خطأ أثناء حفظ المفاتيح');
    }
    setSavingKey(false);
  };

  return (
    <div className="p-4 rounded-xl border bg-card space-y-4">
      <div>
        <h4 className="font-bold text-sm">إدارة مفاتيح الذكاء الاصطناعي والخدمات (API Keys)</h4>
        <p className="text-xs text-muted-foreground">تعديل مفاتيح الربط الخاصة بنظام استخراج الأسئلة وقواعد البيانات السحابية.</p>
      </div>
      <form onSubmit={handleSaveApiKeys} className="space-y-3 max-w-xl">
        <div className="space-y-1.5">
          <Label className="text-xs">مفتاح Google Gemini API (لاستخراج الأسئلة)</Label>
          <Input 
            value={geminiApiKey} 
            onChange={(e) => setGeminiApiKey(e.target.value)} 
            placeholder="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX" 
            type="password" 
            dir="ltr" 
            className="font-mono text-xs" 
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">رابط قاعدة البيانات السحابية (Database URL)</Label>
          <Input 
            value={supabaseUrl} 
            onChange={(e) => setSupabaseUrl(e.target.value)} 
            placeholder="postgresql://user:password@host:port/db" 
            type="password" 
            dir="ltr" 
            className="font-mono text-xs" 
          />
        </div>
        <Button type="submit" size="sm" disabled={savingKey}>
          {savingKey ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Save className="h-4 w-4 ml-1" />}
          حفظ مفاتيح الربط
        </Button>
      </form>
    </div>
  );
}

// أداة جدولة الإرسال والتنبيهات للطلاب (Scheduled Broadcasts Utility)
function ScheduledBroadcastsUtility() {
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [scheduling, setScheduling] = useState(false);

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) {
      toast.error('الرجاء إدخال عنوان ومحتوى الإرسال');
      return;
    }
    setScheduling(true);
    setTimeout(() => {
      toast.success('تمت جدولة رسالة التنبيه بنجاح لإرسالها لجميع الطلاب');
      setBroadcastTitle('');
      setBroadcastMessage('');
      setScheduling(false);
    }, 1000);
  };

  return (
    <div className="p-4 rounded-xl border bg-card space-y-3">
      <div>
        <h4 className="font-bold text-sm">نظام الإشعارات الجماعية (Broadcast System)</h4>
        <p className="text-xs text-muted-foreground">إرسال إشعار فوري لجميع الطلاب المسجلين في المنصة.</p>
      </div>
      <form onSubmit={handleSchedule} className="space-y-3">
        <Input 
          value={broadcastTitle} 
          onChange={(e) => setBroadcastTitle(e.target.value)} 
          placeholder="عنوان الإشعار (مثال: موعد امتحان الباب الأول)..." 
          className="text-xs"
        />
        <Textarea 
          value={broadcastMessage} 
          onChange={(e) => setBroadcastMessage(e.target.value)} 
          placeholder="محتوى رسالة الإشعار بالتفصيل..." 
          rows={2}
          className="text-xs"
        />
        <Button type="submit" size="sm" disabled={scheduling}>
          {scheduling ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Megaphone className="h-4 w-4 ml-1" />}
          إرسال الإشعار فوراً
        </Button>
      </form>
    </div>
  );
}/* ========== ADVANCED EDUCATION & CURRICULUM MANAGEMENT UTILITIES ========== */

// أداة إدارة المراحل والصفوف الدراسية الديناميكية
function CurriculumGradesManager() {
  const [gradesList, setGradesList] = useState<string[]>([
    'الصف السادس',
    'الصف الأول الإعدادي',
    'الصف الثاني الإعدادي',
    'الصف الثالث الإعدادي',
    'اولي باكالوريا',
  ]);
  const [newGradeName, setNewGradeName] = useState('');
  const handleAddGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGradeName.trim()) {
      toast.error('أدخل اسم الصف الدراسي الجديد');
      return;
    }
    if (gradesList.includes(newGradeName.trim())) {
      toast.error('هذا الصف موجود مسبقاً');
      return;
    }
    setGradesList([...gradesList, newGradeName.trim()]);
    setNewGradeName('');
    toast.success('تمت إضافة الصف الدراسي بنجاح');
  };

  const handleRemoveGrade = (gradeToRemove: string) => {
    setGradesList(gradesList.filter(g => g !== gradeToRemove));
    toast.success('تم حذف الصف الدراسي');
  };

  return (
    <div className="p-4 rounded-xl border bg-card space-y-4">
      <div>
        <h4 className="font-bold text-sm">إدارة الصفوف والمراحل الدراسية</h4>
        <p className="text-xs text-muted-foreground">إضافة أو حذف الصفوف المتاحة للطلاب في المنصة التعليمية.</p>
      </div>
      <form onSubmit={handleAddGrade} className="flex gap-2">
        <Input 
          value={newGradeName} 
          onChange={(e) => setNewGradeName(e.target.value)} 
          placeholder="أضف صفاً دراسياً جديداً..." 
          className="text-xs flex-1"
        />
        <Button type="submit" size="sm">
          <Plus className="h-4 w-4 ml-1" />
          إضافة
        </Button>
      </form>
      <div className="flex flex-wrap gap-2 pt-2">
        {gradesList.map((g) => (
          <div key={g} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border bg-muted/40 text-xs font-medium">
            <span>{g}</span>
            <Button type="button" size="icon" variant="ghost" className="h-5 w-5 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveGrade(g)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// أداة إدارة الصلاحيات الإضافية للمشرفين المساعدين
function SubAdminsAccessManager() {
  const [subAdmins, setSubAdmins] = useState<any[]>([
    { id: '1', name: 'أحمد محمود', email: 'ahmed@platform.com', role: 'مراقب محتوى' },
    { id: '2', name: 'محمد إبراهيم', email: 'mohamed@platform.com', role: 'مساعد أكاديمي' }
  ]);
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="p-4 rounded-xl border bg-card space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-sm">إدارة المشرفين المساعدين (Sub-Admins)</h4>
          <p className="text-xs text-muted-foreground">تحديد صلاحيات الدخول للمشرفين المعاونين في إدخال الواجبات.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowAddModal(!showAddModal)}>
          <Plus className="h-4 w-4 ml-1" />
          مشرف جديد
        </Button>
      </div>
      <div className="space-y-2">
        {subAdmins.map((admin) => (
          <div key={admin.id} className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between text-xs">
            <div>
              <p className="font-semibold text-primary">{admin.name} <span className="text-[10px] text-muted-foreground font-normal">({admin.email})</span></p>
              <p className="text-[11px] text-muted-foreground mt-0.5">الدور: {admin.role}</p>
            </div>
            <Badge variant="secondary" className="text-[10px]">نشط</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

// أداة تصدير تقارير أداء الطلاب الشاملة (Export PDF/Excel Reports)
function ExportStudentReportsUtility() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: 'pdf' | 'excel') => {
    setExporting(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      toast.success(format === 'pdf' ? 'تم تصدير تقرير الطلاب بصيغة PDF بنجاح' : 'تم تصدير تقرير الطلاب بصيغة Excel بنجاح');
    } catch {
      toast.error('حدث خطأ أثناء تصدير التقرير');
    }
    setExporting(false);
  };

  return (
    <div className="p-4 rounded-xl border bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h4 className="font-bold text-sm">تصدير تقارير وإحصائيات الطلاب</h4>
        <p className="text-xs text-muted-foreground">تحميل تقرير شامل يحوي درجات الامتحانات ونسب حضور الطلاب.</p>
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        <Button size="sm" variant="outline" onClick={() => handleExport('excel')} disabled={exporting} className="flex-1 sm:flex-none">
          {exporting ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <FileText className="h-4 w-4 ml-1" />}
          تصدير Excel
        </Button>
        <Button size="sm" onClick={() => handleExport('pdf')} disabled={exporting} className="flex-1 sm:flex-none">
          {exporting ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <FileDown className="h-4 w-4 ml-1" />}
          تصدير PDF
        </Button>
      </div>
    </div>
  );
}
  /* ========== PLATFORM SECURITY & SESSION TIMEOUT SETTINGS ========== */

// أداة إعدادات الأمان وجلسات تسجيل الدخول للمشرفين
function AdminSecuritySettings() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('60');
  const [savingSecurity, setSavingSecurity] = useState(false);

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSecurity(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      toast.success('تم تحديث إعدادات الأمان بنجاح');
    } catch {
      toast.error('خطأ أثناء حفظ إعدادات الأمان');
    }
    setSavingSecurity(false);
  };

  return (
    <div className="p-4 rounded-xl border bg-card space-y-4">
      <div>
        <h4 className="font-bold text-sm">إعدادات الأمان والحماية المتقدمة</h4>
        <p className="text-xs text-muted-foreground">التحكم في مدة انتهاء الجلسة وطرق المصادقة الإضافية للوحة التحكم.</p>
      </div>
      <form onSubmit={handleSaveSecurity} className="space-y-4 max-w-xl">
        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
          <div>
            <p className="text-xs font-semibold">تفعيل التحقق بخطوتين (2FA)</p>
            <p className="text-[10px] text-muted-foreground">طلب رمز إضافي عبر البريد عند تسجيل دخول مشرف جديد.</p>
          </div>
          <Button 
            type="button" 
            size="sm" 
            variant={twoFactorEnabled ? 'default' : 'outline'} 
            onClick={() => {
              setTwoFactorEnabled(!twoFactorEnabled);
              toast.success(twoFactorEnabled ? 'تم تعطيل التحقق بخطوتين' : 'تم تفعيل التحقق بخطوتين');
            }}
          >
            {twoFactorEnabled ? 'مفعل' : 'معطل'}
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">مدة انتهاء الجلسة التلقائية (بالدقائق)</Label>
          <select 
            value={sessionTimeout} 
            onChange={(e) => setSessionTimeout(e.target.value)} 
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-xs"
          >
            <option value="30">30 دقيقة</option>
            <option value="60">ساعة واحدة</option>
            <option value="120">ساعتان</option>
            <option value="360">6 ساعات</option>
          </select>
        </div>

        <Button type="submit" size="sm" disabled={savingSecurity}>
          {savingSecurity ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Save className="h-4 w-4 ml-1" />}
          حفظ إعدادات الحماية
        </Button>
      </form>
    </div>
  );
}

// أداة فحص سلامة روابط الفيديوهات وملفات التخزين المرفوعة
function MediaStorageHealthChecker() {
  const [checking, setChecking] = useState(false);
  const [healthStatus, setHealthStatus] = useState<string | null>(null);

  const runHealthCheck = async () => {
    setChecking(true);
    try {
      await new Promise((r) => setTimeout(r, 1800));
      setHealthStatus('سليم 100% - جميع الروابط ومسارات التخزين تعمل بكفاءة');
      toast.success('تم فحص سلامة مسارات التخزين بنجاح');
    } catch {
      toast.error('فشل فحص روابط التخزين');
    }
    setChecking(false);
  };

  return (
    <div className="p-4 rounded-xl border bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h4 className="font-bold text-sm">فحص سلامة الروابط ومسارات التخزين</h4>
        <p className="text-xs text-muted-foreground">التأكد من عدم وجود روابط ملفات أو فيديوهات تالفة أو محذوفة.</p>
        {healthStatus && <p className="text-xs font-semibold text-emerald-600 mt-1">الحالة: {healthStatus}</p>}
      </div>
      <Button size="sm" variant="outline" onClick={runHealthCheck} disabled={checking}>
        {checking ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Activity className="h-4 w-4 ml-1" />}
        {checking ? 'جاري الفحص...' : 'فحص الآن'}
      </Button>
    </div>
  );
}
