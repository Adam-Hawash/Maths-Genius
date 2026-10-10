"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingBag, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useStore, fmtPrice, productName } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { ProductVisual, Stars } from "./ProductVisual";

export function QuickViewDialog() {
  const lang = useStore((s) => s.lang);
  const t = useT(lang);
  const quickView = useStore((s) => s.quickView);
  const setQuickView = useStore((s) => s.setQuickView);
  const addToCart = useStore((s) => s.addToCart);
  const [qty, setQty] = useState(1);

  const product = quickView;
  const discount =
    product?.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0;

  return (
    <Dialog
      open={!!product}
      onOpenChange={(open) => {
        if (!open) {
          setQuickView(null);
          setQty(1);
        }
      }}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-2xl">
        {product && (
          <div className="grid gap-0 sm:grid-cols-2">
            <ProductVisual product={product} className="h-64 w-full sm:h-full sm:min-h-[380px]" />
            <div className="flex flex-col gap-3 p-5">
              <DialogHeader className="space-y-1.5 text-start">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="font-bold text-primary">
                    {lang === "ar" ? product.brand.nameAr : product.brand.name}
                  </Badge>
                  {discount > 0 && <Badge className="bg-rose-600 text-white">{t.off} {discount}%</Badge>}
                  {product.isNew && <Badge className="bg-violet-600 text-white">{t.new}</Badge>}
                </div>
                <DialogTitle className="text-start text-lg leading-snug">{productName(product, lang)}</DialogTitle>
                <DialogDescription className="text-start text-[13px] leading-relaxed">
                  {lang === "ar" ? product.descAr : product.descEn}
                </DialogDescription>
              </DialogHeader>

              <Stars rating={product.rating} reviews={product.reviewsCount} className="text-sm" />

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-muted-foreground">
                {product.size && <span>{t.size}: {product.size}</span>}
                {product.skinType && <span>{t.skinTypeLabel}: {product.skinType}</span>}
                <span className={product.stock > 0 ? "text-emerald-600" : "text-rose-600"}>
                  {product.stock > 0 ? t.inStock : t.outOfStock}
                </span>
              </div>

              <div className="flex items-end gap-2.5">
                <span className="text-2xl font-black text-primary">{fmtPrice(product.price, lang)}</span>
                {discount > 0 && product.compareAtPrice && (
                  <span className="pb-0.5 text-sm font-semibold text-muted-foreground line-through">
                    {fmtPrice(product.compareAtPrice, lang)}
                  </span>
                )}
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-xl border" dir="ltr">
                  <button
                    type="button" aria-label="-"
                    className="flex h-10 w-10 items-center justify-center rounded-s-xl transition-colors hover:bg-muted"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                  >
                    <Minus className="h-4 w-4" aria-hidden />
                  </button>
                  <span className="w-10 text-center text-sm font-black">{qty}</span>
                  <button
                    type="button" aria-label="+"
                    className="flex h-10 w-10 items-center justify-center rounded-e-xl transition-colors hover:bg-muted"
                    onClick={() => setQty((q) => Math.min(20, q + 1))}
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <Button
                  className="h-10 flex-1 gap-2 rounded-xl"
                  onClick={() => {
                    addToCart(product, qty);
                    toast.success(t.addedToCart, { description: productName(product, lang) });
                    setQuickView(null);
                    setQty(1);
                  }}
                >
                  <ShoppingBag className="h-4 w-4" aria-hidden />
                  {t.addToBag} — {fmtPrice(product.price * qty, lang)}
                </Button>
              </div>

              <div className="mt-1 flex items-center gap-4 text-[11px] font-semibold text-muted-foreground">
                <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5 text-primary" aria-hidden /> {t.trustShip}</span>
                <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden /> {t.heroChip1}</span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
