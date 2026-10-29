"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingBag, Tag, Trash2, Truck, X } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useStore, cartSubtotal, freeShippingRemaining, fmtPrice, productName } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/pharmacy";

export function CartSheet() {
  const lang = useStore((s) => s.lang);
  const t = useT(lang);
  const cartOpen = useStore((s) => s.cartOpen);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const cart = useStore((s) => s.cart);
  const updateQty = useStore((s) => s.updateQty);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const navigate = useStore((s) => s.navigate);
  const promo = useStore((s) => s.promo);
  const setPromo = useStore((s) => s.setPromo);

  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);

  const subtotal = cartSubtotal(cart);
  const remaining = freeShippingRemaining(cart);
  const progress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  const applyPromo = async () => {
    if (!code.trim()) return;
    setChecking(true);
    try {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          items: cart.map((i) => ({ productId: i.productId, qty: i.qty, price: i.price })),
          subtotal,
        }),
      });
      const data = await res.json();
      if (data.valid) {
        setPromo({ code: data.code, discount: data.discount, freeShipping: data.freeShipping });
        toast.success(t.promoApplied, { description: data.message });
        setCode("");
      } else {
        setPromo(null);
        toast.error(data.message);
      }
    } catch {
      toast.error(lang === "ar" ? "حدث خطأ — حاول تاني" : "Something went wrong, try again");
    } finally {
      setChecking(false);
    }
  };

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent side={lang === "ar" ? "left" : "right"} className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <ShoppingBag className="h-5 w-5 text-primary" aria-hidden />
            {t.cartTitle}
            <span className="text-xs font-black text-muted-foreground">({cart.length})</span>
          </SheetTitle>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-accent">
              <ShoppingBag className="h-9 w-9 text-primary" aria-hidden />
            </span>
            <p className="text-lg font-black">{t.cartEmpty}</p>
            <p className="text-sm font-semibold text-muted-foreground">{t.cartEmptySub}</p>
            <Button className="mt-2 h-10 rounded-xl px-6 text-sm font-black" onClick={() => navigate({ name: "shop" })}>
              {t.shopNow}
            </Button>
          </div>
        ) : (
          <>
            {/* free shipping progress */}
            <div className="border-b bg-accent/50 px-4 py-3">
              <div className="mb-1.5 flex items-center gap-2 text-xs font-black">
                <Truck className="h-4 w-4 text-primary" aria-hidden />
                {remaining > 0 ? (
                  <span className="text-foreground/80">{t.freeShipProgress.replace("{x}", fmtPrice(remaining, lang))}</span>
                ) : (
                  <span className="text-emerald-700">{t.freeShipDone}</span>
                )}
              </div>
              <Progress value={progress} className="h-2" aria-label="free shipping progress" />
            </div>

            {/* items */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <ul className="flex flex-col gap-3">
                {cart.map((item) => (
                  <li key={item.productId} className="flex gap-3 rounded-2xl border p-3">
                    <span
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-lg font-black text-white"
                      style={{ backgroundColor: item.brand.color }}
                      aria-hidden
                    >
                      {item.brand.name.charAt(0)}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-[13px] font-black leading-snug">{productName(item, lang)}</p>
                        <button
                          type="button"
                          aria-label={`${t.remove} — ${productName(item, lang)}`}
                          className="shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => removeFromCart(item.productId)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                      <span className="text-[11px] font-bold text-muted-foreground">
                        {lang === "ar" ? item.brand.nameAr : item.brand.name}
                      </span>
                      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center rounded-lg border" dir="ltr">
                          <button
                            type="button" aria-label="-"
                            className="flex h-7 w-7 items-center justify-center transition-colors hover:bg-muted"
                            onClick={() => updateQty(item.productId, item.qty - 1)}
                          >
                            <Minus className="h-3 w-3" aria-hidden />
                          </button>
                          <span className="w-7 text-center text-xs font-black">{item.qty}</span>
                          <button
                            type="button" aria-label="+"
                            className="flex h-7 w-7 items-center justify-center transition-colors hover:bg-muted"
                            onClick={() => updateQty(item.productId, item.qty + 1)}
                          >
                            <Plus className="h-3 w-3" aria-hidden />
                          </button>
                        </div>
                        <span className="text-sm font-black text-primary">{fmtPrice(item.price * item.qty, lang)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* summary */}
            <div className="border-t bg-white p-4">
              {/* promo */}
              {promo ? (
                <div className="mb-3 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-700">
                    <Tag className="h-4 w-4" aria-hidden />
                    {promo.code}
                    {promo.discount > 0 && <span dir="ltr">- {fmtPrice(promo.discount, lang)}</span>}
                    {promo.freeShipping && <span>🚚 {t.free}</span>}
                  </div>
                  <button
                    type="button" aria-label={t.remove}
                    className="rounded-lg p-1 text-emerald-700 transition-colors hover:bg-emerald-100"
                    onClick={() => setPromo(null)}
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              ) : (
                <div className="mb-3 flex gap-2">
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                    placeholder={t.promoPlaceholder}
                    className="h-10 rounded-xl bg-muted/60 text-xs font-bold"
                    aria-label={t.promoCodeLabel}
                  />
                  <Button variant="outline" className="h-10 shrink-0 rounded-xl px-4 text-xs font-black" disabled={checking || !code.trim()} onClick={applyPromo}>
                    {checking ? "..." : t.promoApply}
                  </Button>
                </div>
              )}

              <div className="flex flex-col gap-1.5 text-[13px] font-bold">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t.subtotal}</span>
                  <span>{fmtPrice(subtotal, lang)}</span>
                </div>
                {promo && promo.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>{t.discount} ({promo.code})</span>
                    <span dir="ltr">- {fmtPrice(promo.discount, lang)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>{lang === "ar" ? "الشحن" : "Shipping"}</span>
                  <span className="text-xs">{t.shippingCalculated}</span>
                </div>
                <Separator className="my-1.5" />
                <div className="flex justify-between text-base font-black text-foreground">
                  <span>{t.total}</span>
                  <span className="text-primary">{fmtPrice(subtotal - (promo?.discount ?? 0), lang)}</span>
                </div>
              </div>

              <Button className="mt-3 h-12 w-full rounded-xl text-sm font-black shadow-lg shadow-primary/25" onClick={() => navigate({ name: "checkout" })}>
                {t.checkoutBtn}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
