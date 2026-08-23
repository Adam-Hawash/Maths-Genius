'use client'

import { useAppStore } from '@/stores/app-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight, Upload, Loader2, Smartphone, CreditCard, Wallet,
  CheckCircle2, Copy, Check, Shield, Info, X,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'

export function StudentPaymentView() {
  const { pendingPaymentVideo, setView, setPendingPaymentVideo, siteConfig, currentStudent } = useAppStore()
  const [paymentMethod, setPaymentMethod] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [notes, setNotes] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const video = pendingPaymentVideo

  const vodafoneCash = siteConfig?.payment_vodafone_cash || ''
  const instapay = siteConfig?.payment_instapay || ''
  const fawry = siteConfig?.payment_fawry || ''

  const hasAnyMethod = !!(vodafoneCash || instapay || fawry)

  const selectedNumber = paymentMethod === 'vodafone_cash' ? vodafoneCash
    : paymentMethod === 'instapay' ? instapay
    : paymentMethod === 'fawry' ? fawry
    : ''

  useEffect(() => {
    if (!video) { setView('student-portal') }
  }, [video, setView])

  const handleCopy = async () => {
    if (!selectedNumber) return
    try {
      await navigator.clipboard.writeText(selectedNumber)
      setCopied(true)
      toast.success('تم نسخ الرقم')
      setTimeout(() => setCopied(false), 2000)
    } catch { toast.error('فشل النسخ') }
  }

  const handleSubmit = async () => {
    if (!paymentMethod) { toast.error('اختر طريقة الدفع أولاً'); return }
    if (!receiptFile) { toast.error('ارفع صورة إثبات الدفع'); return }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('videoId', video.id)
      formData.append('videoTitle', video.title)
      formData.append('amount', String(video.price))
      formData.append('paymentMethod', paymentMethod)
      formData.append('receipt', receiptFile)
      formData.append('notes', notes)
      if (currentStudent) {
        formData.append('studentId', currentStudent.id)
        formData.append('studentName', currentStudent.name)
      }
      const res = await fetch('/api/payments', { method: 'POST', body: formData })
      if (res.ok) {
        setSubmitted(true)
        toast.success('تم إرسال إثبات الدفع بنجاح!')
      } else {
        const data = await res.json().catch(function() { return { error: 'خطأ' } })
        toast.error(data.error || 'حدث خطأ أثناء الإرسال')
      }
    } catch { toast.error('خطأ في الاتصال') }
    finally { setUploading(false) }
  }

  const handleBack = () => {
    setPendingPaymentVideo(null)
    setView('student-portal')
  }

  if (!video) return null

  /* ========== SUCCESS SCREEN ========== */
  if (submitted) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center border-emerald-200 dark:border-emerald-800/50">
          <CardContent className="p-8 space-y-4">
            <div className="mx-auto h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold">تم إرسال إثبات الدفع بنجاح!</h2>
            <p className="text-muted-foreground leading-relaxed">انتظر موافقة الأدمن على الدفع. هيظهرلك الفيديو فوراً لما يتم قبول الدفع.</p>
            <Button onClick={handleBack} className="mt-4">
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة للدروس
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  /* ========== MAIN PAYMENT PAGE ========== */
  return (
    <div className="flex-1 py-6 px-4 sm:px-6">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowRight className="h-4 w-4 ml-1" />
            رجوع
          </Button>
          <h1 className="text-xl font-bold">الدفع</h1>
        </div>

        {/* Video Info Card */}
        <Card className="mb-6 overflow-hidden">
          <div className="bg-gradient-to-l from-primary/10 to-transparent p-4">
            <p className="text-xs text-muted-foreground mb-1">فيديو</p>
            <p className="font-bold text-base truncate">{video.title}</p>
          </div>
          <CardContent className="p-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">سعر الفيديو</span>
            <Badge className="text-xl px-4 py-1.5 bg-amber-500 text-white font-bold">
              {video.price} ج.م
            </Badge>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="mb-6">
          <CardContent className="p-4 space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold">طرق الدفع</h2>
              <p className="text-xs text-muted-foreground">يرجى اختيار الطريقة المناسبة لإتمام عملية الشراء</p>
            </div>

            {!hasAnyMethod ? (
              <p className="text-center text-sm text-muted-foreground py-6">لم يتم إعداد أرقام الدفع بعد</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {vodafoneCash && (
                  <button
                    onClick={() => setPaymentMethod('vodafone_cash')}
                    className={"flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 " + (paymentMethod === 'vodafone_cash'
                      ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/20'
                      : 'border-muted hover:border-amber-400/50 bg-card')}
                  >
                    <div className={"h-12 w-12 rounded-xl flex items-center justify-center " + (paymentMethod === 'vodafone_cash' ? 'bg-red-500' : 'bg-red-100 dark:bg-red-900/30')}
                      >
                      <Smartphone className={"h-6 w-6 " + (paymentMethod === 'vodafone_cash' ? 'text-white' : 'text-red-600')} />
                    </div>
                    <span className={"text-xs font-bold " + (paymentMethod === 'vodafone_cash' ? 'text-amber-400' : 'text-muted-foreground')}>
                      فودافون كاش
                    </span>
                  </button>
                )}
                {instapay && (
                  <button
                    onClick={() => setPaymentMethod('instapay')}
                    className={"flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 " + (paymentMethod === 'instapay'
                      ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/20'
                      : 'border-muted hover:border-amber-400/50 bg-card')}
                  >
                    <div className={"h-12 w-12 rounded-xl flex items-center justify-center " + (paymentMethod === 'instapay' ? 'bg-violet-500' : 'bg-violet-100 dark:bg-violet-900/30')}>
                      <CreditCard className={"h-6 w-6 " + (paymentMethod === 'instapay' ? 'text-white' : 'text-violet-600')} />
                    </div>
                    <span className={"text-xs font-bold " + (paymentMethod === 'instapay' ? 'text-amber-400' : 'text-muted-foreground')}>
                      إنستا باي
                    </span>
                  </button>
                )}
                {fawry && (
                  <button
                    onClick={() => setPaymentMethod('fawry')}
                    className={"flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 " + (paymentMethod === 'fawry'
                      ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/20'
                      : 'border-muted hover:border-amber-400/50 bg-card')}
                  >
                    <div className={"h-12 w-12 rounded-xl flex items-center justify-center " + (paymentMethod === 'fawry' ? 'bg-blue-500' : 'bg-blue-100 dark:bg-blue-900/30')}>
                      <Wallet className={"h-6 w-6 " + (paymentMethod === 'fawry' ? 'text-white' : 'text-blue-600')} />
                    </div>
                    <span className={"text-xs font-bold " + (paymentMethod === 'fawry' ? 'text-amber-400' : 'text-muted-foreground')}>
                      فوري
                    </span>
                  </button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Method - Show Number + Copy */}
        {paymentMethod && selectedNumber && (
          <Card className="mb-6 border-primary/30 bg-gradient-to-l from-primary/5 to-transparent">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-semibold">حول المبلغ على الرقم التالي:</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-background border rounded-xl px-4 py-3 font-mono text-lg font-bold tracking-wider" dir="ltr">
                  {selectedNumber}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 shrink-0 rounded-xl"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">اضغط على زرار النسخ واحتفظ بالرقم، ثم حول المبلغ وارفع إثبات الدفع</p>
            </CardContent>
          </Card>
        )}

        {/* Upload Receipt */}
        {paymentMethod && (
          <Card className="mb-6">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-bold text-sm">ارفع إثبات الدفع</h3>
              <label
                className={"flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all " + (receiptFile
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-primary/50 hover:bg-muted/30')}
              >
                {receiptFile ? (
                  <>
                    <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-primary">{receiptFile.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">اضغط لتغيير الصورة</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">اضغط لاختيار صورة الإيصال</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG</p>
                    </div>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                />
              </label>
            </CardContent>
          </Card>
        )}

        {/* Notes (optional) */}
        {paymentMethod && receiptFile && (
          <Card className="mb-6">
            <CardContent className="p-4 space-y-2">
              <h3 className="font-bold text-sm">ملاحظات <span className="text-muted-foreground font-normal text-xs">(اختياري)</span></h3>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: الاسم على الحساب، رقم التحويل..."
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                rows={2}
              />
            </CardContent>
          </Card>
        )}

        {/* Price Summary + Confirm Button */}
        {paymentMethod && receiptFile && (
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between px-2">
              <span className="text-sm text-muted-foreground">المجموع</span>
              <span className="text-2xl font-bold text-primary">{video.price} ج.م</span>
            </div>
            <Button
              className="w-full py-6 text-base font-bold rounded-2xl"
              size="lg"
              onClick={handleSubmit}
              disabled={uploading}
            >
              {uploading
                ? <Loader2 className="h-5 w-5 animate-spin ml-2" />
                : <Shield className="h-5 w-5 ml-2" />
              }
              {uploading ? 'جاري الإرسال...' : 'تأكيد الدفع'}
            </Button>
          </div>
        )}

        {/* Important Notes */}
        <div className="rounded-2xl border border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/10 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600" />
            <h4 className="text-xs font-bold">معلومات مهمة</h4>
          </div>
          <ul className="text-[11px] text-muted-foreground space-y-1 list-disc list-inside">
            <li>سيتم مراجعة الدفع من قبل الأدمن خلال ساعات قليلة</li>
            <li>بعد قبول الدفع، سيتم تفعيل الفيديو فوراً</li>
            <li>إذا لم يتم قبول طلبك، سيتم إبلاغك بالسبب</li>
            <li>تأكد من رفع صورة واضحة لإثبات التحويل</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
