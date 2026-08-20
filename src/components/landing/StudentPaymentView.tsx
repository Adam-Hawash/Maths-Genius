'use client'

import { useAppStore } from '@/stores/app-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { ArrowRight, Upload, CheckCircle2, Loader2, CreditCard, Smartphone, Building2 } from 'lucide-react'
import { toast } from 'sonner'

export function StudentPaymentView() {
  const { currentStudent, pendingPaymentVideo, setView, siteConfig } = useAppStore()
  const [method, setMethod] = useState('')
  const [receipt, setReceipt] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const video = pendingPaymentVideo
  if (!video || !currentStudent) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-muted-foreground">لا يوجد فيديو محدد للدفع</p>
      </div>
    )
  }

  const price = video.price || 0
  const vodafoneCash = siteConfig.payment_vodafone_cash || ''
  const instapay = siteConfig.payment_instapay || ''
  const fawry = siteConfig.payment_fawry || ''

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حجم الصورة كبير جداً (الحد 5 ميجا)')
        return
      }
      setReceipt(file)
      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (!method) { toast.error('اختر طريقة الدفع أولاً'); return }
    if (!receipt) { toast.error('ارفع صورة الوصل'); return }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('studentId', currentStudent.id)
      formData.append('method', method)
      formData.append('amount', String(price))
      formData.append('videoId', video.id)
      formData.append('videoTitle', video.title)
      formData.append('receipt', receipt)

      const res = await fetch('/api/payments', { method: 'POST', body: formData })
      if (res.ok) {
        setSubmitted(true)
        toast.success('تم إرسال طلب الدفع بنجاح! سيتم مراجعته قريباً')
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'فشل إرسال طلب الدفع')
      }
    } catch {
      toast.error('خطأ في الاتصال')
    }
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
            <h2 className="text-xl font-bold">تم إرسال طلب الدفع!</h2>
            <p className="text-muted-foreground">سيتم مراجعة الدفع من قبل الأستاذ وائل وتشغيل الفيديو فوراً بعد التأكيد.</p>
            <Button onClick={() => setView('student-portal')} className="mt-4">
              <ArrowRight className="h-4 w-4 ml-1" />
              العودة للدروس
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const paymentMethods = [
    { id: 'vodafone_cash', label: 'Vodafone Cash', icon: Smartphone, number: vodafoneCash, color: 'text-red-500' },
    { id: 'instapay', label: 'InstaPay', icon: CreditCard, number: instapay, color: 'text-purple-500' },
    { id: 'fawry', label: 'Fawry', icon: Building2, number: fawry, color: 'text-blue-500' },
  ]

  const availableMethods = paymentMethods.filter(m => m.number)

  return (
    <div className="min-h-[60vh] p-4 max-w-2xl mx-auto space-y-6">
      {/* Back + Video Info */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setView('student-portal')}>
          <ArrowRight className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold">الدفع</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">الدرس</p>
            <p className="font-bold text-lg">{video.title}</p>
            <p className="text-2xl font-bold text-amber-500">{price} ج.م</p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">اختر طريقة الدفع</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {availableMethods.length === 0 ? (
            <p className="text-muted-foreground text-sm">لم يتم إعداد طرق الدفع بعد. تواصل مع الأستاذ وائل.</p>
          ) : (
            availableMethods.map((m) => (
              <div
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  method === m.id ? 'border-amber-500 bg-amber-500/5' : 'border-muted hover:border-muted-foreground/30'
                }`}
              >
                <m.icon className={`h-6 w-6 ${m.color}`} />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{m.label}</p>
                  <p className="text-xs text-muted-foreground font-mono" dir="ltr">{m.number}</p>
                </div>
                {method === m.id && <CheckCircle2 className="h-5 w-5 text-amber-500" />}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Receipt Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">رفع صورة الوصل</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onClick={() => document.getElementById('receipt-input')?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              preview ? 'border-emerald-500 bg-emerald-500/5' : 'border-muted hover:border-muted-foreground/30'
            }`}
          >
            {preview ? (
              <img src={preview} alt="وصل" className="max-h-48 mx-auto rounded-lg" />
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">اضغط لرفع صورة الوصل</p>
                <p className="text-xs text-muted-foreground">PNG, JPG - حد أقصى 5 ميجا</p>
              </div>
            )}
          </div>
          <input
            id="receipt-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <Button
        className="w-full py-6 text-lg bg-amber-500 hover:bg-amber-600"
        onClick={handleSubmit}
        disabled={!method || !receipt || submitting}
      >
        {submitting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          'إرسال طلب الدفع'
        )}
      </Button>
    </div>
  )
}
