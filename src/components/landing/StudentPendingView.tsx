'use client'

import { useAppStore } from '@/stores/app-store'
import { GraduationCap, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect } from 'react'

export function StudentPendingView() {
  const { setView, logout, currentStudent } = useAppStore()

  // Check if student has pending payments
  const [pendingPayments, setPendingPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentStudent?.id) return
    fetch(`/api/my-payments?studentId=${currentStudent.id}`)
      .then(r => r.json())
      .then(data => {
        setPendingPayments((data.payments || []).filter((p: any) => p.status === 'pending'))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [currentStudent?.id])

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="relative inline-block">
          <div className="absolute -inset-6 rounded-full bg-amber-500/10 blur-xl" />
          <div className="relative w-20 h-20 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            {loading ? (
              <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
            ) : (
              <GraduationCap className="h-10 w-10 text-amber-500" />
            )}
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">انتظر موافقة الأدمن</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            تم استلام طلبك بنجاح وجاري مراجعته من قبل الأدمن. ستحصل على إشعار فور الموافقة على طلبك.
          </p>
        </div>

        {pendingPayments.length > 0 && (
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2 text-sm">
            <p className="font-semibold text-amber-600 dark:text-amber-400">
              لديك {pendingPayments.length} دفعة في انتظار الموافقة
            </p>
            {pendingPayments.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{p.videoTitle || 'دفع'}</span>
                <span>{p.amount} جنيه - {p.method === 'fawry' ? 'فوري' : p.method === 'instapay' ? 'تحويل بنكي' : 'فودافون كاش'}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => setView('student-portal')}>
            <ArrowRight className="h-4 w-4 ml-1" />
            العودة للبوابة
          </Button>
          <Button variant="ghost" onClick={logout}>
            تسجيل خروج
          </Button>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
