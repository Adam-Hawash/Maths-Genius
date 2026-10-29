"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Loader2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Emblem, OrnamentDivider } from "./Ornaments";

export function AdminLoginView({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        onSuccess();
      } else {
        setError(data.error || "بيانات الدخول غير صحيحة");
      }
    } catch {
      setError("تعذّر الاتصال بالخادم — حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden px-4 py-16">
      {/* الخلفية */}
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src="/images/hero-pattern.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-night-800/88" />
        <div className="absolute inset-0 pattern-glow-top" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="frame-ornate rounded-2xl bg-card/90 p-8 shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur-sm glow-gold-soft">
          <div className="flex flex-col items-center text-center">
            <Emblem size={72} className="glow-gold" />
            <h1 className="mt-4 font-ruqaa text-3xl font-bold text-gold-gradient">
              دخول المشرفين
            </h1>
            <p className="mt-1 flex items-center gap-1.5 font-kufi text-xs text-cream/55">
              <ShieldCheck className="size-3.5 text-gold-500/80" />
              هذه المنطقة مخصّصة لإدارة المنصّة
            </p>
            <OrnamentDivider width={220} className="mt-3 max-w-full" />
          </div>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="admin-email" className="font-kufi text-cream/85">
                البريد الإلكتروني
              </Label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-gold-500/70" />
                <Input
                  id="admin-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="أدخل البريد الإلكتروني"
                  autoComplete="username"
                  className="border-gold-500/25 bg-night-600/50 ps-9 text-cream placeholder:text-cream/35 focus-visible:ring-gold-500/60"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="admin-password" className="font-kufi text-cream/85">
                كلمة السر
              </Label>
              <div className="relative">
                <LockKeyhole className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-gold-500/70" />
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة السر"
                  autoComplete="current-password"
                  className="border-gold-500/25 bg-night-600/50 ps-9 text-cream placeholder:text-cream/35 focus-visible:ring-gold-500/60"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-11 bg-gold-500 font-kufi text-base font-semibold text-night-900 hover:bg-gold-400"
            >
              {loading ? <Loader2 className="size-5 animate-spin" /> : "تأكيد الدخول"}
            </Button>
          </form>
        </div>

        <Button
          variant="ghost"
          onClick={onBack}
          className="mx-auto mt-5 flex font-kufi text-cream/60 hover:text-gold-300"
        >
          <ArrowRight className="size-4" />
          عودة إلى الموقع
        </Button>
      </div>
    </div>
  );
}
