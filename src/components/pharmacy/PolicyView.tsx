"use client";

import { MapPin, Phone, Clock } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT, POLICY_CONTENT, type PolicyKey } from "@/lib/i18n";
import { STORE_BRANCHES } from "@/lib/pharmacy";

export function PolicyView({ policyKey }: { policyKey: PolicyKey }) {
  const lang = useStore((s) => s.lang);
  const t = useT(lang);
  const content = POLICY_CONTENT[policyKey][lang];

  if (policyKey === "stores") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-black text-foreground">{t.storesTitle}</h1>
        <p className="mt-1.5 text-sm font-bold text-muted-foreground">{t.storesSub}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {STORE_BRANCHES.map((b) => (
            <div key={b.name} className="rounded-2xl border bg-card p-5">
              <h2 className="flex items-center gap-2 text-base font-black text-foreground">
                <MapPin className="h-4.5 w-4.5 text-primary" aria-hidden />
                {b.name}
              </h2>
              <p className="mt-2.5 text-[13px] font-bold leading-relaxed text-muted-foreground">{b.address}</p>
              <p className="mt-2 flex items-center gap-2 text-[13px] font-bold text-foreground/80">
                <Phone className="h-3.5 w-3.5 text-primary" aria-hidden />
                <span dir="ltr">{b.phone}</span>
              </p>
              <p className="mt-1.5 flex items-center gap-2 text-[12px] font-bold text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-primary" aria-hidden />
                {b.hours}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-black text-foreground">{content.title}</h1>
      <div className="mt-6 flex flex-col gap-6">
        {content.sections.map((s, i) => (
          <section key={i} className="rounded-2xl border bg-card p-5" aria-label={s.title}>
            <h2 className="text-base font-black text-primary">{s.title}</h2>
            <div className="mt-2.5 flex flex-col gap-2">
              {s.body.map((line, j) => (
                <p key={j} className="text-[13.5px] font-semibold leading-relaxed text-foreground/80">{line}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
