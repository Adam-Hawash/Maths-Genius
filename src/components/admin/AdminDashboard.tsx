'use client'

import { useAppStore, GRADES, type Student, type Video, type Homework, type Exam, type Announcement, type ExamResult, type GalleryImage, type Stats } from '@/stores/app-store'
import { chunkedUpload } from '@/lib/chunked-upload'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Users, UserCheck, Clock, Video, ClipboardList, FileText,
  Megaphone, Plus, Check, X, Trash2, LogOut, Loader2,
  BarChart3, RefreshCw, Settings, Upload, MessageSquare,
  Link2, Activity, Eye, Image, Trophy, UserX, Camera,
  PlayCircle, Pause, Film, Search, FileDown, PictureInPicture2, Save
} from 'lucide-react'
import { CMSPanel } from './CMSPanel'
import { SocialLinksPanel } from './SocialLinksPanel'
import { CommunityPanel } from './CommunityPanel'
import { ActivityPanel } from './ActivityPanel'
import { useState, useEffect, useRef } from 'react'
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
      } catch { /* silent */ }
    } catch { /* silent */ }
    setSettingsLoading(false)
  }

  const saveSettings = async () => {
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
            <TabsTrigger value="announcements" className="text-xs sm:text-sm gap-1"><Megaphone className="h-4 w-4" /><span className="hidden sm:inline">الإعلانات</span></TabsTrigger>
            <TabsTrigger value="community" className="text-xs sm:text-sm gap-1"><MessageSquare className="h-4 w-4" /><span className="hidden sm:inline">المجتمعات</span></TabsTrigger>
            <TabsTrigger value="activity" className="text-xs sm:text-sm gap-1"><Activity className="h-4 w-4" /><span className="hidden sm:inline">المتابعة</span></TabsTrigger>
            <TabsTrigger value="gallery" className="text-xs sm:text-sm gap-1"><Camera className="h-4 w-4" /><span className="hidden sm:inline">معرض الصور</span></TabsTrigger>
            <TabsTrigger value="cms" className="text-xs sm:text-sm gap-1"><Settings className="h-4 w-4" /><span className="hidden sm:inline">المحتوى</span></TabsTrigger>
            <TabsTrigger value="social" className="text-xs sm:text-sm gap-1"><Link2 className="h-4 w-4" /><span className="hidden sm:inline">الروابط</span></TabsTrigger>
          </TabsList>

          <TabsContent value="students"><StudentsManager onStatsRefresh={fetchStats} /></TabsContent>
          <TabsContent value="my-students"><MyStudentsPanel /></TabsContent>
          <TabsContent value="videos"><VideoManager onStatsRefresh={fetchStats} /></TabsContent>
          <TabsContent value="homework">
            <ContentManager<Homework> title="إدارة الواجبات | Homework" apiPath="/api/homework" itemName="homework"
              fields={{ title: { label: 'عنوان الواجب | HW Title', type: 'text' }, content: { label: 'المحتوى | Content', type: 'textarea' } }}
              renderTitle={(item) => item.title} renderSubtitle={(item) => item.content?.substring(0, 80) || (item.filePath ? `📎 ${item.fileType}` : '')}
              supportFileUpload fileCategory="homework" acceptedTypes=".pdf,.doc,.docx,image/*" supportAnswerKey supportThumbnail onRefresh={fetchStats} />
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

        {/* Admin Settings Dialog */}
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
            <div className="bg-card border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold flex items-center gap-2"><Settings className="h-5 w-5 text-primary" />إعدادات الحساب</h3>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSettings(false)}><X className="h-4 w-4" /></Button>
              </div>
              {settingsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : (
                <div className="space-y-4">
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
                  {/* Resend API Key */}
                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground">مفتاح Resend API للإيميلات</p>
                      <Button size="sm" variant="outline" onClick={async () => {
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
                    <p className="text-[10px] text-muted-foreground">يُستخدم لإرسال إشعارات بالبريد للطلاب. احصل عليه من resend.com</p>
                  </div>
                  {/* Hero Developer Portfolio URL */}
                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground">رابط Hero Developer Portfolio</p>
                      <Button size="sm" variant="outline" onClick={async () => {
                        setHeroDevSaving(true)
                        try {
                          const res = await fetch('/api/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hero_developer_url: heroDevUrl }) })
                          if (res.ok) {
                            const store = await import('@/stores/app-store')
                            const cfg = store.useAppStore.getState().siteConfig
                            store.useAppStore.getState().setSiteConfig({ ...cfg, hero_developer_url: heroDevUrl })
                            toast.success('تم حفظ رابط Hero Developer')
                          } else { toast.error('خطأ في الحفظ') }
                        } catch { toast.error('خطأ في الحفظ') }
                        setHeroDevSaving(false)
                      }} disabled={heroDevSaving}>
                        {heroDevSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                      </Button>
                    </div>
                    <Input value={heroDevUrl} onChange={(e) => setHeroDevUrl(e.target.value)} placeholder="https://hero-developer-portfolio-11.vercel.app" dir="ltr" type="url" className="font-mono text-xs" />
                    <p className="text-[10px] text-muted-foreground">الرابط يظهر في الهيدر (Hero Developer) والفوتر (Made by Adam Hawash). غيّره في أي وقت وبيتنعكس فوراً.</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={saveSettings} disabled={settingsSaving || !settingsOldPass} className="flex-1">
                      {settingsSaving ? <Loader2 className="h-4 w-4 ml-1 animate-spin" /> : <Save className="h-4 w-4 ml-1" />}
                      {settingsSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                    </Button>
                    <Button variant="outline" onClick={() => { setShowSettings(false); setSettingsOldPass(''); setSettingsNewPass('') }}>إلغاء</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============ StatCard ============
function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`p-2.5 rounded-xl ${color}`}><Icon className="h-5 w-5" /></div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// ============ StudentsManager ============
function StudentsManager({ onStatsRefresh }: { onStatsRefresh: () => void }) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const loadStudents = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/students')
      const data = await res.json()
      setStudents(data.students || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { loadStudents() }, [])

  const handleAction = async (id: string, action: string) => {
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
      if (res.ok) { toast.success('تم بنجاح'); loadStudents(); onStatsRefresh() }
      else { const d = await res.json(); toast.error(d.error || 'خطأ') }
    } catch { toast.error('خطأ في الاتصال') }
  }

  const filtered = students.filter(function(s: any) {
    if (filter === 'pending') return s.status === 'pending'
    if (filter === 'approved') return s.status === 'approved'
    if (filter === 'rejected') return s.status === 'rejected'
    return true
  }).filter(function(s: any) {
    if (!search) return true
    var q = search.toLowerCase()
    return s.name.toLowerCase().indexOf(q) !== -1 || s.phone.indexOf(q) !== -1 || (s.grade || '').toLowerCase().indexOf(q) !== -1
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5" />إدارة الطلاب</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="بحث بالاسم أو الهاتف..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" dir="rtl" />
          </div>
          <div className="flex gap-1">
            {(['all', 'pending', 'approved', 'rejected'] as const).map(function(f) {
              var count = f === 'all' ? students.length : students.filter(function(s: any) { return s.status === f }).length
              return (
                <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="text-[10px] h-8 px-2">
                  {{ all: 'الكل', pending: 'معلّق', approved: 'مفعّل', rejected: 'مرفوض' }[f]} ({count})
                </Button>
              )
            })}
          </div>
        </div>
        {loading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-10 text-sm">لا يوجد طلاب</p>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
            {filtered.map(function(student: any) {
              return (
                <div key={student.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="font-semibold text-sm">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.phone} | {student.grade}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={student.status === 'approved' ? 'default' : student.status === 'rejected' ? 'destructive' : 'secondary'} className="text-[10px]">
                        {{ approved: 'مفعّل', pending: 'معلّق', rejected: 'مرفوض' }[student.status as string] || student.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">تسجيل: {student.loginCount || 0} | آخر دخول: {student.lastLogin ? new Date(student.lastLogin).toLocaleDateString('ar-EG') : 'لم يدخل'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {student.status === 'pending' && (
                      <>
                        <Button size="sm" variant="default" className="h-7 text-[10px]" onClick={() => handleAction(student.id, 'approve')}><Check className="h-3 w-3 ml-1" />قبول</Button>
                        <Button size="sm" variant="destructive" className="h-7 text-[10px]" onClick={() => handleAction(student.id, 'reject')}><X className="h-3 w-3 ml-1" />رفض</Button>
                      </>
                    )}
                    {student.status === 'approved' && (
                      <Button size="sm" variant="outline" className="h-7 text-[10px] text-destructive" onClick={() => handleAction(student.id, 'reject')}><UserX className="h-3 w-3 ml-1" />إلغاء</Button>
                    )}
                    {student.status === 'rejected' && (
                      <Button size="sm" variant="default" className="h-7 text-[10px]" onClick={() => handleAction(student.id, 'approve')}><Check className="h-3 w-3 ml-1" />تفعيل</Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={async () => {
                      if (!confirm('حذف هذا الطالب نهائياً؟')) return
                      try {
                        const res = await fetch(`/api/students/${student.id}`, { method: 'DELETE' })
                        if (res.ok) { toast.success('تم الحذف'); loadStudents(); onStatsRefresh() }
                      } catch {}
                    }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============ MyStudentsPanel ============
function MyStudentsPanel() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/students')
        const data = await res.json()
        setStudents((data.students || []).filter(function(s: any) { return s.status === 'approved' }))
      } catch {}
      setLoading(false)
    })()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5" />طلابي المفعّلين</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : students.length === 0 ? (
          <p className="text-center text-muted-foreground py-10 text-sm">لا يوجد طلاب مفعّلين</p>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
            {students.map(function(student: any) {
              return (
                <div key={student.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-semibold text-sm">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.grade} | {student.phone}</p>
                  </div>
                  <div className="text-left text-xs text-muted-foreground shrink-0">
                    <p>دخول: {student.loginCount || 0}</p>
                    <p>{student.lastLogin ? new Date(student.lastLogin).toLocaleDateString('ar-EG') : '-'}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============ VideoManager ============
function VideoManager({ onStatsRefresh }: { onStatsRefresh: () => void }) {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formValues, setFormValues] = useState<any>({})
  const [formFile, setFormFile] = useState<File | null>(null)
  const [formFileUrl, setFormFileUrl] = useState('')
  const [formFilePath, setFormFilePath] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [filterGrade, setFilterGrade] = useState('all')

  const loadVideos = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/videos')
      const data = await res.json()
      setVideos(data.videos || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { loadVideos() }, [])

  const handleSubmit = async () => {
    if (!formValues.title) { toast.error('أدخل عنوان الفيديو'); return }
    if (!formValues.url && !formFilePath && !formFile) { toast.error('أدخل رابط أو ارفع ملف'); return }
    setSubmitting(true)
    try {
      var body: any = { ...formValues }
      if (formFilePath) body.filePath = formFilePath
      if (formFileUrl && !formFilePath) body.url = formFileUrl
      var url = '/api/videos'
      var method = 'POST'
      if (editId) { url = `/api/videos/${editId}`; method = 'PUT' }
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) { toast.success(editId ? 'تم التحديث' : 'تم الإضافة'); setShowForm(false); setFormValues({}); setFormFile(null); setFormFileUrl(''); setFormFilePath(''); setEditId(null); loadVideos(); if (!editId) onStatsRefresh() }
      else { const d = await res.json(); toast.error(d.error || 'خطأ') }
    } catch { toast.error('خطأ في الاتصال') }
    setSubmitting(false)
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    setUploadMsg('جاري الرفع...')
    try {
      var data = await chunkedUpload(file, 'videos')
      setFormFilePath(data.filePath)
      setUploadMsg('تم الرفع بنجاح ✓')
      toast.success('تم رفع الفيديو')
    } catch (err: any) { toast.error(err.message || 'خطأ في الرفع'); setUploadMsg('') }
    setUploading(false)
  }

  const handleEdit = (video: Video) => {
    setFormValues({ title: video.title, grade: video.grade, url: video.url || '', thumbnail: video.thumbnail || '' })
    setFormFilePath(video.filePath || '')
    setFormFileUrl(video.url || '')
    setEditId(video.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('حذف هذا الفيديو؟')) return
    try {
      const res = await fetch(`/api/videos/${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('تم الحذف'); loadVideos(); onStatsRefresh() }
    } catch {}
  }

  const filtered = filterGrade === 'all' ? videos : videos.filter(function(v) { return v.grade === filterGrade })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2"><Video className="h-5 w-5" />إدارة الفيديوهات</CardTitle>
          <Button size="sm" onClick={() => { setShowForm(true); setEditId(null); setFormValues({}); setFormFile(null); setFormFileUrl(''); setFormFilePath('') }}><Plus className="h-4 w-4 ml-1" />إضافة</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1"><Label className="text-xs">العنوان *</Label><Input value={formValues.title || ''} onChange={(e) => setFormValues({ ...formValues, title: e.target.value })} /></div>
              <div className="space-y-1">
                <Label className="text-xs">الصف</Label>
                <select value={formValues.grade || ''} onChange={(e) => setFormValues({ ...formValues, grade: e.target.value })} className="w-full h-9 rounded-md border bg-background px-3 text-sm">
                  <option value="">كل الصفوف</option>
                  {GRADES.map(function(g) { return <option key={g} value={g}>{g}</option> })}
                </select>
              </div>
              <div className="space-y-1 sm:col-span-2"><Label className="text-xs">رابط YouTube / URL</Label><Input value={formFileUrl || formValues.url || ''} onChange={(e) => setFormFileUrl(e.target.value)} dir="ltr" placeholder="https://youtube.com/watch?v=..." /></div>
              <div className="space-y-1 sm:col-span-2"><Label className="text-xs">صورة مصغرة (رابط)</Label><Input value={formValues.thumbnail || ''} onChange={(e) => setFormValues({ ...formValues, thumbnail: e.target.value })} dir="ltr" placeholder="https://..." /></div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  رفع ملف فيديو
                </Button>
                <span className="text-[10px] text-muted-foreground">أو رابط أعلاه</span>
              </div>
              <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]) }} />
              {uploadMsg && <p className="text-xs text-primary">{uploadMsg}</p>}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSubmit} disabled={submitting || uploading}>{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editId ? 'تحديث' : 'حفظ'}</Button>
              <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setFormValues({}); setFormFile(null); setFormFileUrl(''); setFormFilePath(''); setEditId(null); setUploadMsg('') }}>إلغاء</Button>
            </div>
          </div>
        )}
        <div className="flex gap-1 flex-wrap">
          <Button variant={filterGrade === 'all' ? 'default' : 'outline'} size="sm" className="text-[10px] h-7" onClick={() => setFilterGrade('all')}>الكل ({videos.length})</Button>
          {GRADES.map(function(g) {
            var c = videos.filter(function(v) { return v.grade === g }).length
            if (c === 0) return null
            return <Button key={g} variant={filterGrade === g ? 'default' : 'outline'} size="sm" className="text-[10px] h-7" onClick={() => setFilterGrade(g)}>{g.replace(/الصف /g, '').replace(/الابتدائي/g, 'ا').replace(/الاعدادي/g, 'ع')} ({c})</Button>
          })}
        </div>
        {loading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-10 text-sm">لا توجد فيديوهات</p>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
            {filtered.map(function(video) {
              return (
                <div key={video.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-lg border bg-card">
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="font-semibold text-sm">{video.title}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-md">{video.url || video.filePath || ''}</p>
                    <div className="flex items-center gap-2"><Badge variant="secondary" className="text-[10px]">{video.grade || 'عام'}</Badge>{video.fileType && <Badge variant="outline" className="text-[10px]">{video.fileType}</Badge>}<span className="text-[10px] text-muted-foreground">{new Date(video.createdAt).toLocaleDateString('ar-EG')}</span></div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(video)}><Eye className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(video.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============ ExamTrackingPanel ============
function ExamTrackingPanel() {
  const [results, setResults] = useState<ExamResult[]>([])
  const [loading, setLoading] = useState(true)
  const [filterGrade, setFilterGrade] = useState('all')

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/exam-results')
        const data = await res.json()
        setResults(data.results || [])
      } catch {}
      setLoading(false)
    })()
  }, [])

  const filtered = filterGrade === 'all' ? results : results.filter(function(r: any) { return r.student?.grade === filterGrade })

  var avgScore = filtered.length > 0 ? (filtered.reduce(function(sum, r) { return sum + r.score }, 0) / filtered.length).toFixed(1) : '0'
  var maxScore = filtered.length > 0 ? Math.max(...filtered.map(function(r) { return r.score })) : 0
  var passCount = filtered.filter(function(r) { return r.score >= (r.maxScore || 100) * 0.5 }).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><Trophy className="h-5 w-5" />متابعة الامتحانات</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-xl font-bold text-primary">{avgScore}</p><p className="text-[10px] text-muted-foreground">متوسط الدرجات</p></div>
          <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-xl font-bold text-emerald-600">{maxScore}</p><p className="text-[10px] text-muted-foreground">أعلى درجة</p></div>
          <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-xl font-bold text-amber-600">{passCount}/{filtered.length}</p><p className="text-[10px] text-muted-foreground">ناجح / الكل</p></div>
        </div>
        <div className="flex gap-1 flex-wrap">
          <Button variant={filterGrade === 'all' ? 'default' : 'outline'} size="sm" className="text-[10px] h-7" onClick={() => setFilterGrade('all')}>الكل</Button>
          {GRADES.map(function(g) { return <Button key={g} variant={filterGrade === g ? 'default' : 'outline'} size="sm" className="text-[10px] h-7" onClick={() => setFilterGrade(g)}>{g.replace(/الصف /g, '').replace(/الابتدائي/g, 'ا').replace(/الاعدادي/g, 'ع')}</Button> })}
        </div>
        {loading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-10 text-sm">لا توجد نتائج</p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
            {filtered.map(function(result: any) {
              var pct = result.maxScore > 0 ? Math.round(result.score / result.maxScore * 100) : 0
              return (
                <div key={result.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-semibold text-sm">{result.student?.name || 'طالب'}</p>
                    <p className="text-xs text-muted-foreground">{result.student?.grade || '-'} | {new Date(result.submittedAt).toLocaleDateString('ar-EG')}</p>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="font-bold text-sm">{result.score}/{result.maxScore}</p>
                    <div className="w-20 h-1.5 bg-muted rounded-full mt-1"><div className={"h-full rounded-full " + (pct >= 50 ? "bg-emerald-500" : "bg-destructive")} style={{ width: pct + '%' }} /></div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============ ContentManager (Generic) ============
function ContentManager<T extends { id: string; title: string; content?: string; filePath?: string; fileType?: string; thumbnail?: string; grade?: string; answerKeyPath?: string; createdAt: string }>({ title, apiPath, itemName, fields, renderTitle, renderSubtitle, supportFileUpload, fileCategory, acceptedTypes, supportAnswerKey, supportThumbnail, onRefresh }: {
  title: string; apiPath: string; itemName: string;
  fields: Record<string, { label: string; type: 'text' | 'textarea' }>;
  renderTitle: (item: T) => string; renderSubtitle: (item: T) => string;
  supportFileUpload?: boolean; fileCategory?: string; acceptedTypes?: string;
  supportAnswerKey?: boolean; supportThumbnail?: boolean;
  onRefresh?: () => void;
}) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formValues, setFormValues] = useState<any>({})
  const [formFile, setFormFile] = useState<File | null>(null)
  const [formFilePath, setFormFilePath] = useState('')
  const [formFileUrl, setFormFileUrl] = useState('')
  const [answerKeyFile, setAnswerKeyFile] = useState<File | null>(null)
  const [answerKeyPath, setAnswerKeyPath] = useState('')
  const [answerKeyUrl, setAnswerKeyUrl] = useState('')
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPath, setThumbnailPath] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const answerKeyRef = useRef<HTMLInputElement>(null)
  const thumbnailRef = useRef<HTMLInputElement>(null)

  const loadItems = async () => {
    setLoading(true)
    try {
      const res = await fetch(apiPath)
      const data = await res.json()
      setItems(data[itemName] || data.items || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { loadItems() }, [])

  const handleSubmit = async () => {
    if (!formValues.title) { toast.error('أدخل العنوان'); return }
    setSubmitting(true)
    try {
      var body: any = { ...formValues }
      if (formFilePath) body.filePath = formFilePath
      if (formFileUrl && !formFilePath) { /* url only */ }
      if (answerKeyPath) body.answerKeyPath = answerKeyPath
      if (answerKeyUrl && !answerKeyPath) body.answerKeyUrl = answerKeyUrl
      if (thumbnailPath) body.thumbnail = thumbnailPath
      if (thumbnailUrl && !thumbnailPath) body.thumbnail = thumbnailUrl
      var url = apiPath
      var method = 'POST'
      if (editId) { url = `${apiPath}/${editId}`; method = 'PUT' }
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) { toast.success(editId ? 'تم التحديث' : 'تم الإضافة'); setShowForm(false); resetForm(); loadItems(); onRefresh?.() }
      else { const d = await res.json(); toast.error(d.error || 'خطأ') }
    } catch { toast.error('خطأ في الاتصال') }
    setSubmitting(false)
  }

  const resetForm = () => { setFormValues({}); setFormFile(null); setFormFilePath(''); setFormFileUrl(''); setAnswerKeyFile(null); setAnswerKeyPath(''); setAnswerKeyUrl(''); setThumbnailFile(null); setThumbnailPath(''); setThumbnailUrl(''); setEditId(null); setUploadMsg('') }

  const handleUpload = async (file: File) => {
    setUploading(true)
    setUploadMsg('جاري الرفع...')
    try {
      var data = await chunkedUpload(file, fileCategory || 'general')
      setFormFilePath(data.filePath)
      setUploadMsg('تم الرفع بنجاح ✓')
    } catch (err: any) { toast.error(err.message || 'خطأ'); setUploadMsg('') }
    setUploading(false)
  }

  const handleAnswerKeyUpload = async (file: File) => {
    setUploading(true)
    try {
      var data = await chunkedUpload(file, 'general')
      setAnswerKeyPath(data.filePath)
      toast.success('تم رفع مفتاح الإجابة')
    } catch (err: any) { toast.error(err.message || 'خطأ') }
    setUploading(false)
  }

  const handleThumbnailUpload = async (file: File) => {
    setUploading(true)
    try {
      var data = await chunkedUpload(file, 'photos')
      setThumbnailPath(data.filePath)
      toast.success('تم رفع الصورة المصغرة')
    } catch (err: any) { toast.error(err.message || 'خطأ') }
    setUploading(false)
  }

  const handleEdit = (item: T) => {
    setFormValues({ title: item.title, content: item.content || '', grade: item.grade || '' })
    setFormFilePath(item.filePath || '')
    setFormFileUrl('')
    setAnswerKeyPath(item.answerKeyPath || '')
    setAnswerKeyUrl('')
    setThumbnailPath(item.thumbnail || '')
    setThumbnailUrl('')
    setEditId(item.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('حذف هذا العنصر؟')) return
    try {
      const res = await fetch(`${apiPath}/${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('تم الحذف'); loadItems(); onRefresh?.() }
    } catch {}
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Button size="sm" onClick={() => { setShowForm(true); setEditId(null); resetForm() }}><Plus className="h-4 w-4 ml-1" />إضافة</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
            {Object.entries(fields).map(function([key, field]) {
              return (
                <div key={key} className={field.type === 'textarea' ? '' : 'grid grid-cols-1 sm:grid-cols-2 gap-3'}>
                  <div className="space-y-1" style={field.type === 'textarea' ? { gridColumn: '1/-1' } as any : {}}>
                    <Label className="text-xs">{field.label}</Label>
                    {field.type === 'textarea' ? (
                      <Textarea value={formValues[key] || ''} onChange={(e) => setFormValues({ ...formValues, [key]: e.target.value })} rows={3} />
                    ) : (
                      <Input value={formValues[key] || ''} onChange={(e) => setFormValues({ ...formValues, [key]: e.target.value })} />
                    )}
                  </div>
                </div>
              )
            })}
            {supportFileUpload && (
              <div className="space-y-1.5">
                <Label className="text-xs">ملف (رفع أو رابط)</Label>
                <div className="flex items-center gap-3">
                  <input ref={fileRef} type="file" accept={acceptedTypes || '*'} className="hidden" onChange={(e) => { setFormFile(e.target.files?.[0] || null); setFormFilePath(''); setFormFileUrl('') }} />
                  <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4 ml-1" />رفع ملف</Button>
                  {formFile && <span className="text-xs text-muted-foreground">{(formFile.size / 1024).toFixed(0)} KB</span>}
                  {formFilePath && <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">ملف مرفوع ✓</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground shrink-0">أو رابط:</span>
                  <Input placeholder="https://..." value={formFileUrl} onChange={(e) => { setFormFileUrl(e.target.value); if (e.target.value.trim()) { setFormFile(null); setFormFilePath('') } }} dir="ltr" className="h-8 text-xs" />
                </div>
              </div>
            )}
            {supportAnswerKey && (
              <div className="space-y-1.5">
                <Label className="text-xs">مفتاح الإجابة (اختياري)</Label>
                <div className="flex items-center gap-3">
                  <input ref={answerKeyRef} type="file" accept=".pdf,.doc,.docx,image/*" className="hidden" onChange={(e) => { setAnswerKeyFile(e.target.files?.[0] || null); setAnswerKeyPath(''); setAnswerKeyUrl('') }} />
                  <Button type="button" variant="outline" size="sm" onClick={() => answerKeyRef.current?.click()}><Upload className="h-4 w-4 ml-1" />رفع إجابة</Button>
                  {answerKeyPath && <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-600">إجابة مرفوعة ✓</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground shrink-0">أو رابط:</span>
                  <Input placeholder="https://..." value={answerKeyUrl} onChange={(e) => { setAnswerKeyUrl(e.target.value); if (e.target.value.trim()) { setAnswerKeyFile(null); setAnswerKeyPath('') } }} dir="ltr" className="h-8 text-xs" />
                </div>
              </div>
            )}
            {supportThumbnail && (
              <div className="space-y-1.5">
                <Label className="text-xs">صورة مصغرة (اختياري - رفع أو رابط)</Label>
                <div className="flex items-center gap-3">
                  <input ref={thumbnailRef} type="file" accept="image/*" className="hidden" onChange={(e) => { setThumbnailFile(e.target.files?.[0] || null); setThumbnailPath(''); setThumbnailUrl('') }} />
                  <Button type="button" variant="outline" size="sm" onClick={() => thumbnailRef.current?.click()}><PictureInPicture2 className="h-4 w-4 ml-1" />{thumbnailFile ? thumbnailFile.name : 'رفع صورة'}</Button>
                  {thumbnailFile && <span className="text-xs text-muted-foreground">{(thumbnailFile.size / 1024).toFixed(0)} KB</span>}
                  {thumbnailPath && <div className="w-12 h-8 rounded border overflow-hidden"><img src={thumbnailPath} alt="thumb" className="w-full h-full object-cover" /></div>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground shrink-0">أو رابط:</span>
                  <Input placeholder="https://..." value={thumbnailUrl} onChange={(e) => { setThumbnailUrl(e.target.value); if (e.target.value.trim()) { setThumbnailFile(null); setThumbnailPath('') } }} dir="ltr" className="h-8 text-xs" />
                </div>
              </div>
            )}
            {uploadMsg && <p className="text-xs text-primary animate-pulse">{uploadMsg}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSubmit} disabled={submitting || uploading}>{submitting || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ'}</Button>
              <Button size="sm" variant="outline" onClick={() => { setShowForm(false); resetForm() }}>إلغاء</Button>
            </div>
          </div>
        )}
        {loading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : items.length === 0 ? (
          <p className="text-center text-muted-foreground py-10 text-sm">لا توجد عناصر</p>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
            {items.map((item: any) => (
              <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-lg border bg-card">
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="font-semibold text-sm">{renderTitle(item)}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-md">{renderSubtitle(item)}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-[10px]">{item.grade}</Badge>
                    {(item as any).thumbnail && <Badge variant="outline" className="text-[10px] border-purple-500/40 text-purple-600">صورة</Badge>}
                    {item.filePath && <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">أسئلة</Badge>}
                    {item.answerKeyPath && <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-600">إجابة</Badge>}
                    <span className="text-[10px] text-muted-foreground">{new Date(item.createdAt).toLocaleDateString('ar-EG')}</span>
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============ GalleryManager ============
function GalleryManager() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const loadImages = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/gallery')
      const data = await res.json()
      setImages(data.images || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { loadImages() }, [])

  const handleUpload = async (files: FileList) => {
    setUploading(true)
    for (var i = 0; i < files.length; i++) {
      try {
        var data = await chunkedUpload(files[i], 'photos')
        await fetch('/api/gallery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filePath: data.filePath, title: files[i].name, sortOrder: images.length + i }) })
      } catch {}
    }
    setUploading(false)
    loadImages()
    toast.success('تم رفع الصور')
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('تم الحذف'); loadImages() }
    } catch {}
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2"><Camera className="h-5 w-5" />معرض الصور</CardTitle>
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) handleUpload(e.target.files) }} />
            <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 ml-1" />}
              رفع صور
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : images.length === 0 ? (
          <p className="text-center text-muted-foreground py-10 text-sm">لا توجد صور</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto custom-scrollbar">
            {images.map(function(img) {
              return (
                <div key={img.id} className="relative group rounded-lg overflow-hidden border aspect-square">
                  <img src={img.filePath} alt={img.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(img.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
