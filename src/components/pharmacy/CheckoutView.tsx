"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, Banknote, Building2, CreditCard, Loader2, Lock, MapPin, Smartphone, Truck, Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  useStore, cartSubtotal, fmtPrice, productName, type OrderResult,
} from "@/lib/store";
import { useT } from "@/lib/i18n";
import { CAIRO_GIZA, GOVERNORATES, SHIPPING_METHODS } from "@/lib/pharmacy";

export function CheckoutView() {
  const lang = useStore((s) => s.lang);
  const t = useT(lang);
  const cart = useStore((s) => s.cart);
  const promo = useStore((s) => s.promo);
  const navigate = useStore((s) => s.navigate);
  const clearCart = useStore((s) => s.clearCart);
  const setPromo = useStore((s) => s.setPromo);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gov, setGov] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [shipping, setShipping] = useState<string>("express");
  const [payment, setPayment] = useState<string>("cod");
  const [placing, setPlacing] = useState(false);

  const subtotal = cartSubtotal(cart);
  const discount = promo?.discount ?? 0;

  const isCairoGiza = CAIRO_GIZA.includes(gov);
  const availableShipping = useMemo(() => {
    if (shipping === "pickup") return SHIPPING_METHODS.filter((m) => m.id === "pickup");
    if (!gov) return SHIPPING_METHODS.filter((m) => m.id !== "pickup");
    return SHIPPING_METHODS.filter(
      (m) => m.id !== "pickup" && (!m.cairoGizaOnly || isCairoGiza)
    );
  }, [gov, isCairoGiza, shipping]);

  // Keep shipping valid when the governorate changes
  useEffect(() => {
    if (!availableShipping.some((m) => m.id === shipping) && availableShipping.length) {
      setShipping(availableShipping[0].id);
    }
  }, [availableShipping]);

  const chosenMethod = SHIPPING_METHODS.find((m) => m.id === shipping) ?? null;
  const freeShip = promo?.freeShipping || subtotal >= 999;
  const shippingCost = chosenMethod
    ? chosenMethod.id === "pickup" || freeShip ? 0 : chosenMethod.price
    : 0;
  const total = Math.max(0, subtotal - discount + shippingCost);

  const placeOrder = async () => {
    if (!name.trim() || !phone.trim() || !gov || !address.trim()) {
      toast.error(t.errFillAll);
      return;
    }
    if (!/^01\d{9}$/.test(phone.trim())) {
      toast.error(t.errPhone);
      return;
    }
    if (shipping !== "pickup" && !city.trim()) {
      toast.error(t.errFillAll);
      return;
    }
    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name.trim(),
          phone: phone.trim(),
          governorate: gov,
          city: city.trim(),
          address: address.trim(),
          notes: notes.trim(),
          paymentMethod: payment,
          shippingMethod: shipping,
          promoCode: promo?.code ?? null,
          items: cart.map((i) => ({ productId: i.productId, qty: i.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? (lang === "ar" ? "تعذر إنشاء الطلب" : "Could not place the order"));
        return;
      }
      const order: OrderResult = data.order;
      clearCart();
      setPromo(null);
      toast.success(t.orderSuccess);
      navigate({ name: "confirm", order });
    } catch {
      toast.error(lang === "ar" ? "حدث خطأ — حاول تاني" : "Something went wrong, try again");
    } finally {
      setPlacing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-24 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-accent">
          <Truck className="h-9 w-9 text-primary" aria-hidden />
        </span>
        <p className="text-lg font-black">{t.cartEmpty}</p>
        <Button className="h-11 rounded-xl px-7 text-sm font-black" onClick={() => navigate({ name: "shop" })}>
          {t.shopNow}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <button
        type="button"
        className="mb-4 flex items-center gap-1.5 text-[13px] font-black text-muted-foreground transition-colors hover:text-primary"
        onClick={() => navigate({ name: "shop" })}
      >
        <ArrowRight className="h-4 w-4 ltr:rotate-180" aria-hidden />
        {t.backToCart}
      </button>
      <h1 className="mb-6 text-xl font-black sm:text-2xl">{t.checkoutTitle}</h1>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* =========================== form =========================== */}
        <div className="flex flex-col gap-5">
          {/* contact */}
          <section className="rounded-2xl border bg-card p-5" aria-labelledby="h-contact">
            <h2 id="h-contact" className="mb-4 flex items-center gap-2 text-base font-black">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Smartphone className="h-4 w-4" aria-hidden /></span>
              {t.contactInfo}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="co-name" className="text-xs font-black">{t.fullName} *</Label>
                <Input id="co-name" value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl text-sm font-bold" autoComplete="name" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="co-phone" className="text-xs font-black">{t.phone} * <span className="text-[10px] font-bold text-muted-foreground">({t.phoneHint})</span></Label>
                <Input
                  id="co-phone" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, "").slice(0, 11))}
                  className="h-11 rounded-xl text-sm font-bold" inputMode="numeric" dir="ltr" placeholder="01xxxxxxxxx" autoComplete="tel"
                />
              </div>
            </div>
          </section>

          {/* address */}
          <section className="rounded-2xl border bg-card p-5" aria-labelledby="h-address">
            <h2 id="h-address" className="mb-4 flex items-center gap-2 text-base font-black">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><MapPin className="h-4 w-4" aria-hidden /></span>
              {t.addressInfo}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-black">{t.governorate} *</Label>
                <Select value={gov} onValueChange={setGov}>
                  <SelectTrigger className="h-11 rounded-xl text-sm font-bold" aria-label={t.governorate}>
                    <SelectValue placeholder={t.selectGov} />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {GOVERNORATES.map((g) => (
                      <SelectItem key={g} value={g} className="text-[13px] font-bold">{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="co-city" className="text-xs font-black">{t.city} *</Label>
                <Input id="co-city" value={city} onChange={(e) => setCity(e.target.value)} className="h-11 rounded-xl text-sm font-bold" disabled={shipping === "pickup"} />
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-1.5">
              <Label htmlFor="co-address" className="text-xs font-black">{t.address} *</Label>
              <Textarea id="co-address" value={address} onChange={(e) => setAddress(e.target.value)} className="min-h-20 rounded-xl text-sm font-bold" placeholder={t.addressHint} rows={2} />
            </div>
            <div className="mt-4 flex flex-col gap-1.5">
              <Label htmlFor="co-notes" className="text-xs font-black">{t.notes}</Label>
              <Input id="co-notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="h-11 rounded-xl text-sm font-bold" />
            </div>
          </section>

          {/* shipping */}
          <section className="rounded-2xl border bg-card p-5" aria-labelledby="h-shipping">
            <h2 id="h-shipping" className="mb-4 flex items-center gap-2 text-base font-black">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Truck className="h-4 w-4" aria-hidden /></span>
              {t.shippingMethod}
            </h2>
            <RadioGroup value={shipping} onValueChange={setShipping} className="grid gap-3 sm:grid-cols-2">
              {SHIPPING_METHODS.map((m) => {
                const disabled = m.id !== "pickup" && gov !== "" && !availableShipping.some((a) => a.id === m.id);
                return (
                  <Label
                    key={m.id}
                    htmlFor={`sh-${m.id}`}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors ${shipping === m.id ? "border-primary bg-accent" : "hover:border-primary/40"} ${disabled ? "pointer-events-none opacity-40" : ""}`}
                  >
                    <RadioGroupItem id={`sh-${m.id}`} value={m.id} className="mt-0.5" />
                    <div className="flex-1 leading-tight">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-black">{lang === "ar" ? m.nameAr : m.nameEn}</span>
                        <span className="text-xs font-black text-primary">
                          {m.price === 0 ? t.free : fmtPrice(m.price, lang)}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-muted-foreground">{lang === "ar" ? m.etaAr : m.etaEn}</span>
                      {m.cairoGizaOnly && !isCairoGiza && (
                        <span className="block text-[10px] font-bold text-amber-600">
                          {lang === "ar" ? "⚠ متاح للقاهرة والجيزة فقط" : "⚠ Cairo & Giza only"}
                        </span>
                      )}
                    </div>
                  </Label>
                );
              })}
            </RadioGroup>
            {shipping !== "pickup" && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-accent/60 px-3 py-2 text-[11px] font-black text-accent-foreground">
                <Building2 className="h-3.5 w-3.5" aria-hidden />
                {lang === "ar"
                  ? "شحن مجاني لكل الطلبات فوق 999 ج.م — أو اختار استلام من الفرع ببلاش"
                  : "Free shipping above 999 EGP — or pick up from a branch for free"}
              </div>
            )}
          </section>

          {/* payment */}
          <section className="rounded-2xl border bg-card p-5" aria-labelledby="h-payment">
            <h2 id="h-payment" className="mb-4 flex items-center gap-2 text-base font-black">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Wallet className="h-4 w-4" aria-hidden /></span>
              {t.paymentMethod}
            </h2>
            <RadioGroup value={payment} onValueChange={setPayment} className="grid gap-3 sm:grid-cols-3">
              {[
                { id: "cod", icon: Banknote, label: t.cod, desc: t.codDesc },
                { id: "card", icon: CreditCard, label: t.card, desc: t.cardDesc },
                { id: "instapay", icon: Smartphone, label: t.instapay, desc: t.instapayDesc },
              ].map((m) => (
                <Label
                  key={m.id}
                  htmlFor={`pay-${m.id}`}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors ${payment === m.id ? "border-primary bg-accent" : "hover:border-primary/40"}`}
                >
                  <RadioGroupItem id={`pay-${m.id}`} value={m.id} className="mt-0.5" />
                  <div className="leading-tight">
                    <span className="flex items-center gap-1.5 text-[13px] font-black"><m.icon className="h-4 w-4 text-primary" aria-hidden />{m.label}</span>
                    <span className="text-[11px] font-bold text-muted-foreground">{m.desc}</span>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </section>
        </div>

        {/* ========================= summary ========================= */}
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-2xl border bg-card p-5">
            <h2 className="mb-4 text-base font-black">{t.orderSummary}</h2>
            <ul className="mb-3 max-h-56 space-y-2.5 overflow-y-auto pe-1">
              {cart.map((i) => (
                <li key={i.productId} className="flex items-start justify-between gap-2 text-[13px] font-bold">
                  <span className="line-clamp-2 leading-snug text-foreground/85">
                    {productName(i, lang)} <span className="text-muted-foreground">×{i.qty}</span>
                  </span>
                  <span className="shrink-0 font-black text-foreground/90">{fmtPrice(i.price * i.qty, lang)}</span>
                </li>
              ))}
            </ul>
            <Separator className="my-3" />
            <div className="flex flex-col gap-2 text-[13px] font-bold">
              <div className="flex justify-between text-muted-foreground">
                <span>{t.subtotal}</span><span>{fmtPrice(subtotal, lang)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>{t.discount} ({promo?.code})</span>
                  <span dir="ltr">- {fmtPrice(discount, lang)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>{lang === "ar" ? "الشحن" : "Shipping"}</span>
                <span>{chosenMethod ? (shippingCost === 0 ? t.free : fmtPrice(shippingCost, lang)) : "—"}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between text-lg font-black">
                <span>{t.total}</span>
                <span className="text-primary">{fmtPrice(total, lang)}</span>
              </div>
            </div>
            <Button className="mt-4 h-12 w-full gap-2 rounded-xl text-sm font-black shadow-lg shadow-primary/25" disabled={placing} onClick={placeOrder}>
              {placing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Lock className="h-4 w-4" aria-hidden />}
              {placing ? t.placing : t.placeOrder}
            </Button>
            <p className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-[11px] font-bold text-muted-foreground">
              <Lock className="h-3 w-3" aria-hidden />
              {t.secureNote}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
