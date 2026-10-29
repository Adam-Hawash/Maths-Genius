"use client";

import { CheckCircle2, MapPin, Package, Phone, Truck } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useStore, fmtPrice, type OrderResult } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { SHIPPING_METHODS } from "@/lib/pharmacy";

export function ConfirmView({ order }: { order: OrderResult }) {
  const lang = useStore((s) => s.lang);
  const t = useT(lang);
  const navigate = useStore((s) => s.navigate);

  const method = SHIPPING_METHODS.find((m) => m.id === order.shippingMethod);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 220, damping: 16 }}
        className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100"
      >
        <CheckCircle2 className="h-11 w-11 text-emerald-600" aria-hidden />
      </motion.div>

      <div className="mb-6 text-center">
        <h1 className="text-2xl font-black text-foreground">{t.confirmTitle}</h1>
        <p className="mt-1.5 text-sm font-bold text-muted-foreground">{t.confirmThanks}</p>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        {/* order number strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-accent px-5 py-4">
          <span className="text-[13px] font-black text-accent-foreground">{t.orderNo}</span>
          <span className="rounded-lg bg-white px-3 py-1 text-sm font-black text-primary shadow-sm" dir="ltr">{order.orderNumber}</span>
        </div>

        <div className="p-5">
          {/* meta */}
          <div className="mb-4 grid gap-3 text-[13px] font-bold sm:grid-cols-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Truck className="h-4 w-4 text-primary" aria-hidden />
              <span>{t.confirmEta}: {method ? (lang === "ar" ? method.etaAr : method.etaEn) : "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" aria-hidden />
              <span>{order.governorate}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 text-primary" aria-hidden />
              <span dir="ltr">16345</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="h-4 w-4 text-primary" aria-hidden />
              <span>{t.confirmItems} ({order.items.length})</span>
            </div>
          </div>

          <Separator className="my-4" />

          {/* items */}
          <ul className="mb-4 flex flex-col gap-2.5">
            {order.items.map((i, idx) => (
              <li key={idx} className="flex items-start justify-between gap-2 text-[13px] font-bold">
                <span className="leading-snug text-foreground/85">{lang === "ar" ? i.nameAr : i.nameEn} <span className="text-muted-foreground">×{i.qty}</span></span>
                <span className="shrink-0 font-black">{fmtPrice(i.price * i.qty, lang)}</span>
              </li>
            ))}
          </ul>

          <Separator className="my-3" />

          <div className="flex flex-col gap-2 text-[13px] font-bold">
            <div className="flex justify-between text-muted-foreground"><span>{t.subtotal}</span><span>{fmtPrice(order.subtotal, lang)}</span></div>
            {order.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>{t.discount}{order.promoCode ? ` (${order.promoCode})` : ""}</span>
                <span dir="ltr">- {fmtPrice(order.discount, lang)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>{lang === "ar" ? "الشحن" : "Shipping"}</span>
              <span>{order.shippingCost === 0 ? t.free : fmtPrice(order.shippingCost, lang)}</span>
            </div>
            <div className="mt-1 flex justify-between text-lg font-black">
              <span>{t.total}</span>
              <span className="text-primary">{fmtPrice(order.total, lang)}</span>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-[13px] font-bold text-muted-foreground">{t.confirmWillCall}</p>

      <div className="mt-5 flex justify-center">
        <Button size="lg" className="h-12 rounded-xl px-8 text-sm font-black shadow-lg shadow-primary/25" onClick={() => navigate({ name: "home" })}>
          {t.continueShopping}
        </Button>
      </div>
    </div>
  );
}
