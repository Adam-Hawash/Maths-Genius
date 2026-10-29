'use client'

import { usePharmacy, fmtEGP } from './store'
import { Button } from '@/components/ui/button'
import { ArrowRight, MapPin, Phone, Clock, FileText, Lock, Truck, Store } from 'lucide-react'

const POLICIES: Record<string, { title: string; icon: typeof FileText; body: React.ReactNode }> = {
  terms: {
    title: 'الشروط والأحكام',
    icon: FileText,
    body: (
      <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
        <p>باستخدامك لموقع صيدلية د. وليد الطحاوي فأنت موافق على الشروط التالية:</p>
        <ul className="list-disc pr-5 space-y-2">
          <li>جميع المنتجات المعروضة أصلية 100% ومستوردة من الموزعين المعتمدين رسميًا.</li>
          <li>الأسعار المعروضة بالجنيه المصري وتشمل ضريبة القيمة المضافة، ويحق للصيدلية تحديث الأسعار دون إشعار مسبق.</li>
          <li>الطلب مؤكد بعد التواصل الهاتفي مع العميل وتأكيد العنوان.</li>
          <li>في حالة عدم توفر المنتج، يحق للصيدلية استبداله بمنتج مكافئ بعد موافقة العميل أو إلغاء الطلب واسترداد أي مبالغ مدفوعة.</li>
          <li>يمنع استخدام الموقع لأي غرض غير قانوني أو إساءة الاستخدام الخاصة بعروض الخصم.</li>
          <li>أكواد الخصم والعروض صالحة لفترة محدودة وقابلة للتعديل أو الإيقاف في أي وقت.</li>
        </ul>
      </div>
    ),
  },
  privacy: {
    title: 'سياسة الخصوصية',
    icon: Lock,
    body: (
      <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
        <p>خصوصيتك أمانة عندنا — وده اللي بنعمل بياناتك:</p>
        <ul className="list-disc pr-5 space-y-2">
          <li>بنجمع البيانات الضرورية فقط لتنفيذ الطلب: الاسم، رقم الموبايل، والعنوان.</li>
          <li>جميع البيانات مشفرة ومحفوظة بإجراءات أمان صارمة، ولا يتم مشاركتها مع أي طرف ثالث لأغراض تسويقية.</li>
          <li>معلومات الدفع لا يتم تخزينها على الموقع إطلاقًا — الدفع كاش عند الاستلام.</li>
          <li>يمكنك طلب حذف بياناتك نهائيًا في أي وقت بالتواصل مع خدمة العملاء.</li>
          <li>قد نستخدم رقمك لإرسال إشعارات متعلقة بالطلب فقط (تأكيد، شحن، توصيل).</li>
        </ul>
      </div>
    ),
  },
  delivery: {
    title: 'سياسة التوصيل والاسترجاع',
    icon: Truck,
    body: (
      <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
        <div>
          <h4 className="font-bold text-gray-800 mb-2">🚚 خيارات الشحن:</h4>
          <ul className="list-disc pr-5 space-y-1.5">
            <li><b>التوصيل السريع — نفس اليوم:</b> داخل القاهرة والجيزة ({fmtEGP(60)}) — اطلب قبل 4 عصرًا واستلم نفس اليوم.</li>
            <li><b>سوبر سيفر — 2-3 أيام:</b> داخل القاهرة والجيزة ({fmtEGP(35)}).</li>
            <li><b>شحن المحافظات — 2-7 أيام:</b> لجميع المحافظات المصرية ({fmtEGP(75)}).</li>
            <li><b>توصيل مجاني</b> للطلبات التي تتجاوز {fmtEGP(1500)} لكل محافظات مصر.</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-gray-800 mb-2">🔄 الاسترجاع والاستبدال:</h4>
          <ul className="list-disc pr-5 space-y-1.5">
            <li>يحق لك الاسترجاع أو الاستبدال خلال 14 يومًا من الاستلام بشرط أن يكون المنتج مغلّفًا بحالته الأصلية.</li>
            <li>لأسباب صحية، لا يمكن استرجاع المنتجات المفتوحة (مكملات غذائية، عناية شخصية، مستحضرات تجميل مفتوحة).</li>
            <li>في حالة وصول المنتج تالف أو خطأ في التجهيز، نتحمل كامل تكلفة الاستبدال والشحن.</li>
            <li>يتم رد المبالغ خلال 3-5 أيام عمل بعد استلام المنتج المرتجع ومعاينته.</li>
          </ul>
        </div>
      </div>
    ),
  },
  stores: {
    title: 'فروعنا (Store Finder)',
    icon: Store,
    body: null, // rendered dynamically below
  },
}

export default function Policies({ which }: { which: string }) {
  const { setView, settings } = usePharmacy()
  const policy = POLICIES[which] || POLICIES.terms

  let stores: { name: string; address: string; phone: string; hours: string }[] = []
  try { stores = JSON.parse(settings.storesJson || '[]') } catch { /* ignore */ }

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-6">
      <button className="flex items-center gap-1 text-sm text-cyan-700 font-semibold mb-4 hover:underline" onClick={() => setView({ name: 'home' })}>
        <ArrowRight className="size-4" /> رجوع للرئيسية
      </button>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-5 pb-1">
        {Object.entries(POLICIES).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setView({ name: 'policy', which: k })}
            className={`px-3.5 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition ${which === k ? 'bg-cyan-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-cyan-300'}`}
          >
            {v.title}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-7">
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-5 flex items-center gap-2">
          <policy.icon className="size-6 text-cyan-600" /> {policy.title}
        </h1>

        {which === 'stores' ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">زور أقرب فرع ليك واستفسر من صيادلة المتخصصين بنفسك:</p>
            {stores.map((s, i) => (
              <div key={i} className="border border-cyan-100 bg-cyan-50/40 rounded-xl p-4 space-y-1.5">
                <div className="font-bold text-gray-800 flex items-center gap-2"><MapPin className="size-4 text-cyan-600" /> {s.name}</div>
                <div className="text-sm text-gray-600 pr-6">{s.address}</div>
                <div className="flex flex-wrap gap-4 text-xs text-gray-500 pr-6">
                  <span className="flex items-center gap-1"><Phone className="size-3.5 text-cyan-600" /> {s.phone}</span>
                  <span className="flex items-center gap-1"><Clock className="size-3.5 text-cyan-600" /> {s.hours}</span>
                </div>
              </div>
            ))}
            <div className="bg-cyan-800 text-white rounded-xl p-4 text-sm">
              ☎️ خدمة العملاء: <b>{settings.phone}</b> — {settings.email} — {settings.hours}
            </div>
          </div>
        ) : (
          policy.body
        )}
      </div>
    </div>
  )
}
