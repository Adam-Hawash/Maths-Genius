'use client'

import { usePharmacy, fmtEGP } from './store'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Phone, Package } from 'lucide-react'

export default function OrderSuccess({ orderNumber }: { orderNumber: string }) {
  const { setView, settings } = usePharmacy()
  return (
    <div className="max-w-lg mx-auto px-4 py-14 text-center">
      <div className="size-20 rounded-full bg-emerald-50 grid place-items-center mx-auto mb-5">
        <CheckCircle2 className="size-12 text-emerald-500" />
      </div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-2">تم تأكيد طلبك! 🎉</h1>
      <p className="text-gray-500 text-sm mb-5">شكرًا لثقتك في صيدلية د. وليد الطحاوي</p>

      <div className="bg-cyan-50 border border-cyan-100 rounded-2xl p-5 space-y-2 mb-6">
        <div className="flex items-center justify-center gap-2 text-cyan-900">
          <Package className="size-5" />
          <span className="font-bold text-sm">رقم الطلب:</span>
        </div>
        <div className="text-xl font-extrabold text-cyan-700 tracking-wide" dir="ltr">{orderNumber}</div>
        <p className="text-xs text-gray-500 leading-relaxed pt-1">
          هنتواصل معاك على رقم الموبايل لتأكيد الطلب وتحديد موعد التوصيل.
          <br />الدفع كاش عند الاستلام — تأكد من المنتج قبل الدفع.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <Button className="bg-cyan-700 hover:bg-cyan-800" onClick={() => setView({ name: 'home' })}>
          متابعة التسوق
        </Button>
        <Button variant="outline" className="border-cyan-200 text-cyan-700" onClick={() => setView({ name: 'policy', which: 'delivery' })}>
          سياسة التوصيل والاسترجاع
        </Button>
      </div>
      <p className="text-xs text-gray-400 mt-6 flex items-center justify-center gap-1">
        <Phone className="size-3" /> أي استفسار: {settings.phone || '0100 123 4567'}
      </p>
    </div>
  )
}
