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
            var v = e.target.value.replace(/[^\d]/g, '')
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
  var store = useAppStore()
  var setView = store.setView
  var setCurrentStudent = store.setCurrentStudent
  var setCurrentAdmin = store.setCurrentAdmin
  var setAdminLoggedIn = store.setAdminLoggedIn
  var [loginTab, setLoginTab] = useState('student')
  var [studentPhone, setStudentPhone] = useState('')
  var [studentLoading, setStudentLoading] = useState(false)
  var [adminEmail, setAdminEmail] = useState('')
  var [adminPassword, setAdminPassword] = useState('')
  var [adminLoading, setAdminLoading] = useState(false)
  var [adminStatusMsg, setAdminStatusMsg] = useState('')

  var handleStudentLogin = async function () {
    if (!studentPhone.trim()) {
      toast.error('الرجاء إدخال رقم الهاتف')
      return
    }
    if (!PHONE_REGEX.test(studentPhone.trim())) {
      toast.error('رقم الهاتف يجب أن يكون 11 رقم')
      return
    }
    setStudentLoading(true)
    try {
      var res = await fetch('/api/students?phone=' + encodeURIComponent(studentPhone.trim()))
      var data = await res.json()
      var students = data.students || []
      var student = students.find(function (s) { return s.phone === studentPhone.trim() })
      if (!student) {
        toast.error('لم يتم العثور على حساب بهذا الرقم')
        setStudentLoading(false)
        return
      }
      if (student.status === 'pending') {
        setCurrentStudent(student)
        setView('student-pending')
        toast.info('حسابك قيد المراجعة، انتظر موافقة المسؤول')
      } else if (student.status === 'rejected') {
        toast.error('تم رفض طلب التسجيل، تواصل مع المسؤول')
      } else if (student.status === 'approved') {
        setCurrentStudent(student)
        setView('student-portal')
        toast.success('مرحباً ' + student.name + '!')
        fetch('/api/students/track-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: student.id }),
        }).catch(function () {})
      }
    } catch (e) { toast.error('حدث خطأ في الاتصال') }
    setStudentLoading(false)
  }

  var handleAdminLogin = async function () {
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
      console.log('[AuthPages] Sending admin login request...')
      var res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
        signal: controller.signal,
      })
      console.log('[AuthPages] Response status:', res.status)
      var data = await res.json()
      console.log('[AuthPages] Response data:', data)
      if (res.ok) {
        setAdminStatusMsg('جاري تحميل لوحة التحكم...')
        console.log('[AuthPages] Login success! Setting admin state...')
        setCurrentAdmin(data.admin)
        setAdminLoggedIn(true)
        setView('admin-dashboard')
        toast.success('مرحباً بك في لوحة التحكم')
        console.log('[AuthPages] State updated successfully')
      } else {
        toast.
