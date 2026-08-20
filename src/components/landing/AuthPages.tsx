'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useAppStore, GRADES } from '@/stores/app-store'
import { ArrowRight, User, Phone, Lock, GraduationCap, Users, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
}

const TEXT_ONLY_REGEX = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-zA-Z\s]+$/
const PHONE_REGEX = /^\d{11}$/

function PhoneField({ value, onChange, placeholder, id, error }: {
  value: string; onChange: (v: string) => void; placeholder: string; id: string; error?: string
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-foreground">
        {placeholder} <span className="text-destructive">*</span>
      </Label>
      <div className="relative">
        <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            const v = e.target.value.replace(/[^\d]/g, '')
            if (v.length <= 11) onChange(v)
          }}
          dir="ltr"
          className={`pr-10 min-h-[44px] ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}
          maxLength={11}
        />
      </div>
      {error && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
    </div>
  )
}

function NameField({ value, onChange, placeholder, id, error }: {
  value: string; onChange: (v: string) => void; placeholder: string; id: string; error?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-foreground text-xs">
        {placeholder} <span className="text-destructive">*</span>
      </Label>
      <Input
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`min-h-[44px] ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}
      />
      {error && <p className="text-[10px] text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
    </div>
  )
}

export function LoginView() {
  const { setView, setCurrentStudent, setCurrentAdmin, setAdminLoggedIn } = useAppStore()
  const [loginTab, setLoginTab] = useState('student')
  const [studentPhone, setStudentPhone] = useState('')
  const [studentLoading, setStudentLoading] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminStatusMsg, setAdminStatusMsg] = useState('')

  const handleStudentLogin = async () => {
    if (!studentPhone.trim()) {
      toast.error('الرجاء إدخال رقم الهاتف')
      return
    }
    if (!PHONE_REGEX.test(studentPhone.trim())) {
      toast.error('رقم الهاتف يجب أن يكون 11 رقم')
      return
    }
    if (studentLoading) return
    setStudentLoading(true)

    var controller = new AbortController()
    var timeout = setTimeout(function () { controller.abort() }, 15000)

    try {
      const res = await fetch('/api/students?phone=' + encodeURIComponent(studentPhone.trim()), {
        signal: controller.signal,
      })
      const data = await res.json()
      const students: Array<{
        id: string; name: string; phone: string; grade: string; status: string; createdAt: string; updatedAt: string
      }> = data.students || []
      const student = students.find((s) => s.phone === studentPhone.trim())
      if (!student) {
        toast.error('لم يتم العثور على حساب بهذا الرقم')
        setStudentLoading(false)
        clearTimeout(timeout)
        return
      }
      if (student.status === 'pending') {
        setCurrentStudent(student as any)
        setView('student-pending')
        toast.info('حسابك قيد المراجعة، انتظر موافقة المسؤول')
      } else if (student.status === 'rejected') {
        toast.error('تم رفض طلب التسجيل، تواصل مع المسؤول')
      } else if (student.status === 'approved') {
        setCurrentStudent(student as any)
        setView('student-portal')
        toast.success('مرحباً ' + student.name + '!')
        fetch('/api/students/track-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: student.id }),
        }).catch(() => {})
      }
    } catch (err: any) {
      if (err && err.name === 'AbortError') {
        toast.error('انتهت مهلة الاتصال — حاول مرة أخرى')
      } else {
        toast.error('حدث خطأ في الاتصال')
      }
    }
    clearTimeout(timeout)
    setStudentLoading(false)
  }

  const handleAdminLogin = async () => {
    if (!adminEmail || !adminPassword) {
      toast.error('الرجاء إدخال البريد وكلمة المرور')
      return
    }
    if (adminLoading) return
    setAdminLoading(true)
    setAdminStatusMsg('جاري الاتصال بالسيرفر...')

    var controller = new AbortController()
    var timeout = setTimeout(function () { controller.abort() }, 15000)

    try {
      setAdminStatusMsg('جاري التحقق من البيانات...')
      var res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
        signal: controller.signal,
      })
      var data = await res.json()
      if (res.ok) {
        setAdminStatusMsg('جاري تحميل لوحة التحكم...')
        setCurrentAdmin(data.admin)
        setAdminLoggedIn(true)
        setView('admin-dashboard')
        toast.success('مرحباً بك في لوحة التحكم')
      } else {
        toast.error(data.error || 'خطأ في تسجيل الدخول')
      }
    } catch (err: any) {
      if (err && err.name === 'AbortError') {
        toast.error('انتهت مهلة الاتصال — حاول مرة أخرى')
      } else {
        toast.error('حدث خطأ في الاتصال بالسيرفر')
      }
    }
    clearTimeout(timeout)
    setAdminLoading(false)
    setAdminStatusMsg('')
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <motion.div className="w-full max-w-md" initial="hidden" animate="visible" variants={fadeInUp} transition={{ duration: 0.5, ease: 'easeOut' }}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">تسجيل الدخول</h1>
          <p className="text-sm text-muted-foreground">ادخل إلى حسابك للمتابعة</p>
        </div>
        <div className="relative rounded-2xl p-[2px] bg-gradient-to-br from-gold-400 via-gold-600 to-gold-400">
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardContent className="p-6">
              <Tabs value={loginTab} onValueChange={setLoginTab} className="w-full">
                <TabsList className="w-full h-11 mb-6">
                  <TabsTrigger value="student" className="flex-1 gap-2 min-h-[44px]">
                    <User className="h-4 w-4" />طالب
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="flex-1 gap-2 min-h-[44px]">
                    <Lock className="h-4 w-4" />مشرف
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="student">
                  <div className="space-y-4">
                    <PhoneField value={studentPhone} onChange={setStudentPhone} placeholder="رقم الهاتف" id="login-phone" />
                    <Button className="w-full min-h-[44px] font-semibold" onClick={handleStudentLogin} disabled={studentLoading}>
                      {studentLoading ? (<><Loader2 className="h-4 w-4 ml-2 animate-spin" />جاري تسجيل الدخول...</>) : 'تسجيل الدخول'}
                    </Button>
                    <p className="text-center text-sm text-muted-foreground">
                      ليس لديك حساب؟{' '}
                      <button onClick={() => setView('auth-register')} className="text-primary font-medium hover:underline cursor-pointer">أنشئ حساباً جديداً</button>
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="admin">
                  <div className="space-y-4">
                    <Badge variant="outline" className="mb-2 w-full justify-center py-1">دخول المشرفين فقط</Badge>
                    <div className="space-y-2">
                      <Label htmlFor="auth-admin-email" className="text-foreground">البريد الإلكتروني</Label>
                      <Input id="auth-admin-email" type="email" placeholder="البريد الإلكتروني" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !adminLoading) handleAdminLogin() }} dir="ltr" className="min-h-[44px]" disabled={adminLoading} autoComplete="email" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="auth-admin-password" className="text-foreground">كلمة المرور</Label>
                      <Input id="auth-admin-password" type="password" placeholder="كلمة المرور" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !adminLoading) handleAdminLogin() }} dir="ltr" className="min-h-[44px]" disabled={adminLoading} autoComplete="current-password" />
                    </div>
                    {adminStatusMsg && (
                      <p className="text-xs text-center text-muted-foreground animate-pulse">{adminStatusMsg}</p>
                    )}
                    <Button className="w-full min-h-[44px] font-semibold" onClick={handleAdminLogin} disabled={adminLoading}>
                      {adminLoading ? (<><Loader2 className="h-4 w-4 ml-2 animate-spin" />جاري تسجيل الدخول...</>) : 'دخول لوحة التحكم'}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        <div className="mt-6 text-center">
          <button onClick={() => setView('landing')} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] px-3 cursor-pointer">
            <ArrowRight className="h-4 w-4" />العودة للرئيسية
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export function RegisterView() {
  const { setView, setCurrentStudent } = useAppStore()
  const [name1, setName1] = useState('')
  const [name2, setName2] = useState('')
  const [name3, setName3] = useState('')
  const [name4, setName4] = useState('')
  const [phone, setPhone] = useState('')
  const [grade, setGrade] = useState('')
  const [parentName1, setParentName1] = useState('')
  const [parentName2, setParentName2] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!name1.trim()) e.name1 = 'مطلوب'
    else if (!TEXT_ONLY_REGEX.test(name1.trim())) e.name1 = 'حروف فقط'
    if (!name2.trim()) e.name2 = 'مطلوب'
    else if (!TEXT_ONLY_REGEX.test(name2.trim())) e.name2 = 'حروف فقط'
    if (!name3.trim()) e.name3 = 'مطلوب'
    else if (!TEXT_ONLY_REGEX.test(name3.trim())) e.name3 = 'حروف فقط'
    if (!name4.trim()) e.name4 = 'مطلوب'
    else if (!TEXT_ONLY_REGEX.test(name4.trim())) e.name4 = 'حروف فقط'
    if (!phone.trim()) e.phone = 'مطلوب'
    else if (!PHONE_REGEX.test(phone.trim())) e.phone = 'يجب أن يكون 11 رقم بالضبط'
    if (!grade) e.grade = 'مطلوب'
    if (!parentName1.trim()) e.parentName1 = 'مطلوب'
    else if (!TEXT_ONLY_REGEX.test(parentName1.trim())) e.parentName1 = 'حروف فقط'
    if (!parentName2.trim()) e.parentName2 = 'مطلوب'
    else if (!TEXT_ONLY_REGEX.test(parentName2.trim())) e.parentName2 = 'حروف فقط'
    if (!parentPhone.trim()) e.parentPhone = 'مطلوب'
    else if (!PHONE_REGEX.test(parentPhone.trim())) e.parentPhone = 'يجب أن يكون 11 رقم بالضبط'
    setErrors(e)
    if (Object.keys(e).length > 0) {
      toast.error('الرجاء تصحيح الحقول المشار إليها')
      return false
    }
    return true
  }

  const handleRegister = async () => {
    if (!validate()) return
    const fullName = `${name1.trim()} ${name2.trim()} ${name3.trim()} ${name4.trim()}`
    const fullParentName = `${parentName1.trim()} ${parentName2.trim()}`
    setLoading(true)
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fullName, phone: phone.trim(), grade, parentName: fullParentName, parentPhone: parentPhone.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setCurrentStudent(data.student)
        setView('student-pending')
        toast.success('تم تسجيل طلبك بنجاح! انتظر موافقة المسؤول')
      } else {
        toast.error(data.error || 'حدث خطأ في التسجيل')
      }
    } catch { toast.error('حدث خطأ في الاتصال') }
    setLoading(false)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
      <motion.div className="w-full max-w-lg" initial="hidden" animate="visible" variants={fadeInUp} transition={{ duration: 0.5, ease: 'easeOut' }}>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mb-3">
            <Users className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">إنشاء حساب جديد</h1>
          <p className="text-sm text-muted-foreground">سجل بياناتك وابدأ رحلة التعلم</p>
        </div>
        <div className="relative rounded-2xl p-[2px] bg-gradient-to-br from-gold-400 via-gold-600 to-gold-400">
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardContent className="p-5">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-foreground mb-2">اسم الطالب الرباعي</p>
                  <div className="grid grid-cols-2 gap-2">
                    <NameField value={name1} onChange={setName1} placeholder="الاسم الأول" id="reg-name1" error={errors.name1} />
                    <NameField value={name2} onChange={setName2} placeholder="الاسم الثاني" id="reg-name2" error={errors.name2} />
                    <NameField value={name3} onChange={setName3} placeholder="الاسم الثالث" id="reg-name3" error={errors.name3} />
                    <NameField value={name4} onChange={setName4} placeholder="الاسم الرابع" id="reg-name4" error={errors.name4} />
                  </div>
                </div>
                <PhoneField value={phone} onChange={setPhone} placeholder="رقم هاتف الطالب" id="reg-phone" error={errors.phone} />
                <div className="space-y-2">
                  <Label htmlFor="reg-grade" className="text-foreground">
                    الصف الدراسي <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <GraduationCap className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <select
                      id="reg-grade"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className={`flex h-11 w-full rounded-md border border-input bg-transparent pr-10 pl-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[44px] appearance-none cursor-pointer ${errors.grade ? 'border-destructive' : ''}`}
                    >
                      <option value="">اختر الصف الدراسي</option>
                      {GRADES.map((g) => (<option key={g} value={g}>{g}</option>))}
                    </select>
                  </div>
                  {errors.grade && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.grade}</p>}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-2">اسم ولي الأمر</p>
                  <div className="grid grid-cols-2 gap-2">
                    <NameField value={parentName1} onChange={setParentName1} placeholder="الاسم الأول" id="reg-pname1" error={errors.parentName1} />
                    <NameField value={parentName2} onChange={setParentName2} placeholder="الاسم الثاني" id="reg-pname2" error={errors.parentName2} />
                  </div>
                </div>
                <PhoneField value={parentPhone} onChange={setParentPhone} placeholder="رقم هاتف ولي الأمر" id="reg-parent-phone" error={errors.parentPhone} />
                <Button className="w-full min-h-[44px] font-semibold" onClick={handleRegister} disabled={loading}>
                  {loading ? (<><Loader2 className="h-4 w-4 ml-2 animate-spin" />جاري التسجيل...</>) : 'إنشاء الحساب'}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  لديك حساب بالفعل؟{' '}
                  <button onClick={() => setView('auth-login')} className="text-primary font-medium hover:underline cursor-pointer">سجل دخولك</button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="mt-6 text-center">
          <button onClick={() => setView('landing')} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] px-3 cursor-pointer">
            <ArrowRight className="h-4 w-4" />العودة للرئيسية
          </button>
        </div>
      </motion.div>
    </div>
  )
}
