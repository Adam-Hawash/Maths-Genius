'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Wallet, Check, X, Loader2, Eye, Trash2, Smartphone, CreditCard,
  Image as ImageIcon, Search, Clock, CheckCircle2, XCircle, Receipt
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import Image from 'next/image'

interface PaymentItem {
  id: string
  studentId: string
  studentName: string
  studentPhone: string
  studentGrade: string
  videoId: string
  videoTitle: string
  amount: number
  method: string
  receiptPath: string
  receiptType: string
  note: string
  status: string
  reviewedAt: string
  createdAt: string
  updatedAt: string
}

interface PaymentCounts {
  total: number
  pending: number
  approved: number
  rejected: number
}

var methodLabels: Record<string, { label: string; icon: any; color: string }> = {
  vodafone_cash: { label: 'فودافون كاش', icon: Smartphone, color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
  instapay: { label: 'إنستا باي', icon: CreditCard, color: 'text-violet-600 bg-violet-100 dark:bg-violet-900/30' },
  fawry: { label: 'فوري', icon: CreditCard, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
}

var statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'قيد المراجعة', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  approved: { label: 'مقبول', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  rejected: { label: 'مرفوض', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
}

export function PaymentsPanel({ onRefresh }: { onRefresh: () => void }) {
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [counts, setCounts] = useState<PaymentCounts>({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [search, setSearch] = useState('')
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null)
  const [receiptBlobUrl, setReceiptBlobUrl] = useState<string | null>(null)
  const [receiptLoading, setReceiptLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showRejectNotes, setShowRejectNotes] = useState<string | null>(null)
  const [rejectNotes, setRejectNotes] = useState('')
  const [showApproveConfirm, setShowApproveConfirm] = useState<string | null>(null)

  var loadPayments = async function(showLoader: boolean = true) {
    if (showLoader) setLoading(true)
    try {
      var params = new URLSearchParams({ pageSize: '100' })
      if (filter !== 'all') params.set('status', filter)
      var res = await fetch('/api/payments?' + params)
      if (!res.ok) {
        toast.error('خطأ في تحميل المدفوعات')
        setLoading(false)
        return
      }
      var data = await res.json()
      setPayments(data.payments || [])
      setCounts(data.counts || { total: 0, pending: 0, approved: 0, rejected: 0 })
    } catch {
      toast.error('خطأ في الاتصال')
    }
    setLoading(false)
  }

  useEffect(function() { loadPayments() }, [filter])

  var filteredPayments = payments.filter(function(p) {
    if (!search.trim()) return true
    var s = search.toLowerCase()
    return (
      (p.studentName || '').toLowerCase().includes(s) ||
      (p.videoTitle || '').toLowerCase().includes(s) ||
      (p.method || '').toLowerCase().includes(s) ||
      String(p.amount).includes(s)
    )
  })

  var handleViewReceipt = async function(paymentId: string) {
    var payment = payments.find(function(p) { return p.id === paymentId })
    if (!payment || !payment.receiptPath) {
      toast.error('لا يوجد إيصال لهذا الدفع')
      return
    }
    setViewingReceipt(paymentId)
    setReceiptLoading(true)
    setReceiptBlobUrl(null)
    try {
      var res = await fetch('/api/files/' + payment.receiptPath)
      if (res.ok) {
        var blob = await res.blob()
        setReceiptBlobUrl(URL.createObjectURL(blob))
      } else {
        toast.error('فشل تحميل صورة الإيصال')
        setViewingReceipt(null)
      }
    } catch {
      toast.error('خطأ في تحميل الإيصال')
      setViewingReceipt(null)
    }
    setReceiptLoading(false)
  }

  var handleApprove = async function(paymentId: string) {
    setActionLoading(paymentId)
    try {
      var res = await fetch('/api/payments/' + paymentId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      })
      if (res.ok) {
        toast.success('تم قبول الدفع بنجاح')
        loadPayments(false)
        onRefresh()
        setShowApproveConfirm(null)
      } else {
        var d = await res.json()
        toast.error(d.error || 'خطأ في التحديث')
      }
    } catch { toast.error('خطأ في الاتصال') }
    setActionLoading(null)
  }

  var handleReject = async function(paymentId: string) {
    setActionLoading(paymentId)
    try {
      var res = await fetch('/api/payments/' + paymentId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', adminNotes: rejectNotes }),
      })
      if (res.ok) {
        toast.success('تم رفض الدفع')
        loadPayments(false)
        onRefresh()
        setShowRejectNotes(null)
        setRejectNotes('')
      } else {
        var d = await res.json()
        toast.error(d.error || 'خطأ في التحديث')
      }
    } catch { toast.error('خطأ في الاتصال') }
    setActionLoading(null)
  }

  var handleDelete = async function(paymentId: string) {
    if (!confirm('هل أنت متأكد من حذف هذا الدفع؟')) return
    try {
      var res = await fetch('/api/payments/' + paymentId, { method: 'DELETE' })
      if (res.ok) {
        toast.success('تم حذف الدفع')
        loadPayments(false)
        onRefresh()
      } else {
        toast.error('خطأ في الحذف')
      }
    } catch { toast.error('خطأ في الاتصال') }
  }

  var closeReceiptDialog = function() {
    if (receiptBlobUrl) URL.revokeObjectURL(receiptBlobUrl)
    setViewingReceipt(null)
    setReceiptBlobUrl(null)
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={function() { setFilter('pending') }}>
          <CardContent className="p-3 text-center">
            <Clock className="h-5 w-5 text-amber-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{counts.pending}</p>
            <p className="text-[10px] text-muted-foreground">قيد المراجعة</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={function() { setFilter('approved') }}>
          <CardContent className="p-3 text-center">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{counts.approved}</p>
            <p className="text-[10px] text-muted-foreground">مقبول</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={function() { setFilter('rejected') }}>
          <CardContent className="p-3 text-center">
            <XCircle className="h-5 w-5 text-red-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-red-600 dark:text-red-400">{counts.rejected}</p>
            <p className="text-[10px] text-muted-foreground">مرفوض</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={function() { setFilter('all') }}>
          <CardContent className="p-3 text-center">
            <Receipt className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold">{counts.total}</p>
            <p className="text-[10px] text-muted-foreground">الإجمالي</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              إدارة المدفوعات
            </CardTitle>
            <div className="flex gap-2 items-center flex-wrap">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={function(e) { setSearch(e.target.value) }}
                  placeholder="بحث..." className="h-8 w-44 pr-8 text-xs"
                />
              </div>
              <div className="flex gap-1 bg-muted rounded-lg p-1">
                {(['pending', 'all', 'approved', 'rejected'] as const).map(function(f) {
                  return (
                    <Button key={f} variant={filter === f ? 'default' : 'ghost'} size="sm" className="text-xs h-7 px-2" onClick={function() { setFilter(f) }}>
                      {f === 'pending' ? 'معلق' : f === 'approved' ? 'مقبول' : f === 'rejected' ? 'مرفوض' : 'الكل'}
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">لا يوجد مدفوعات</p>
              <p className="text-[10px] text-muted-foreground mt-1">المدفوعات هتظهر هنا لما الطلاب يبعتوا إيصالات</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
              {filteredPayments.map(function(p) {
                var method = methodLabels[p.method] || { label: p.method, icon: Wallet, color: 'text-muted-foreground bg-muted' }
                var status = statusConfig[p.status] || statusConfig.pending
                var MethodIcon = method.icon
                var StatusIcon = status.icon
                return (
                  <div key={p.id} className={"p-4 rounded-xl border transition-all " + (p.status === 'pending' ? 'border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10' : 'bg-card')}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-sm">{p.studentName || 'طالب غير معروف'}</span>
                          <Badge className={"text-[10px] " + status.color}>
                            <StatusIcon className="h-3 w-3 ml-1" />
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">فيديو: {p.videoTitle || '—'}</p>
                        {p.studentGrade && <p className="text-[10px] text-muted-foreground">الصف: {p.studentGrade}</p>}
                      </div>
                      <div className="text-left shrink-0">
                        <p className="text-lg font-bold text-primary">{p.amount} <span className="text-xs font-normal text-muted-foreground">ج.م</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap mb-3">
                      <div className={"flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium " + method.color}>
                        <MethodIcon className="h-3.5 w-3.5" />
                        {method.label}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{new Date(p.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {p.note && (
                      <div className="mb-3 p-2 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                        <span className="font-medium">ملاحظات:</span> {p.note}
                      </div>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      {p.receiptPath && (
                        <Button size="sm" variant="outline" className="text-xs h-8" onClick={function() { handleViewReceipt(p.id) }}>
                          <Eye className="h-3.5 w-3.5 ml-1" />
                          عرض الإيصال
                        </Button>
                      )}
                      {p.status === 'pending' && (
                        <>
                          <Button size="sm" className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={function() { setShowApproveConfirm(p.id) }} disabled={actionLoading === p.id}>
                            {actionLoading === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 ml-1" />}
                            قبول
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs h-8 text-destructive hover:bg-destructive/10 border-destructive/30" onClick={function() { setShowRejectNotes(p.id); setRejectNotes('') }} disabled={actionLoading === p.id}>
                            {actionLoading === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5 ml-1" />}
                            رفض
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive ml-auto" onClick={function() { handleDelete(p.id) }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {viewingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={closeReceiptDialog}>
          <div className="bg-card border rounded-2xl p-4 w-full max-w-lg mx-4 shadow-2xl" onClick={function(e) { e.stopPropagation() }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                صورة الإيصال
              </h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={closeReceiptDialog}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {receiptLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : receiptBlobUrl ? (
              <div className="relative rounded-lg overflow-hidden border bg-black/5 aspect-[3/4] max-h-[70vh]">
                <Image src={receiptBlobUrl} alt="إيصال الدفع" fill className="object-contain" unoptimized />
              </div>
            ) : (
              <p className="text-center py-10 text-sm text-muted-foreground">فشل تحميل الإيصال</p>
            )}
          </div>
        </div>
      )}

      {showApproveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={function() { setShowApproveConfirm(null) }}>
          <div className="bg-card border rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl" onClick={function(e) { e.stopPropagation() }}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg">تأكيد القبول</h3>
                <p className="text-sm text-muted-foreground mt-1">هل أنت متأكد من قبول هذا الدفع؟</p>
                <p className="text-xs text-muted-foreground mt-1">سيتم تفعيل الوصول للفيديو للطالب</p>
              </div>
              <div className="flex gap-2 w-full">
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={function() { handleApprove(showApproveConfirm) }} disabled={actionLoading === showApproveConfirm}>
                  {actionLoading === showApproveConfirm ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 ml-1" />}
                  نعم، قبول
                </Button>
                <Button variant="outline" className="flex-1" onClick={function() { setShowApproveConfirm(null) }}>إلغاء</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRejectNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={function() { setShowRejectNotes(null) }}>
          <div className="bg-card border rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl" onClick={function(e) { e.stopPropagation() }}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="h-7 w-7 text-red-600" />
              </div>
              <div className="w-full text-right">
                <h3 className="font-bold text-lg">سبب الرفض (اختياري)</h3>
                <p className="text-sm text-muted-foreground mt-1">اكتب سبب الرفض للطالب</p>
              </div>
              <Textarea value={rejectNotes} onChange={function(e) { setRejectNotes(e.target.value) }} placeholder="مثال: الإيصال غير واضح، ارفع إيصال آخر..." rows={3} className="w-full text-sm" />
              <div className="flex gap-2 w-full">
                <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={function() { handleReject(showRejectNotes) }} disabled={actionLoading === showRejectNotes}>
                  {actionLoading === showRejectNotes ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 ml-1" />}
                  رفض
                </Button>
                <Button variant="outline" className="flex-1" onClick={function() { setShowRejectNotes(null); setRejectNotes('') }}>إلغاء</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
