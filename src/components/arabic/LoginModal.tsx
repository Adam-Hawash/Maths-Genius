"use client";

import { useState } from "react";
import { Loader2, LockKeyhole, UserRound } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrnamentDivider } from "./Ornaments";

export function LoginModal({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok && data.role === "admin-gate") {
        toast.success("تم التحقق بنجاح — أكمل الدخول كمشرف");
        setId("");
        setPassword("");
        onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-gold-500/30 bg-card p-0 sm:rounded-xl">
        <div className="pattern-glow-top rounded-t-xl border-b border-gold-500/20 bg-night-700/60 px-6 pb-5 pt-6 text-center">
          <DialogHeader className="items-center space-y-0">
            <DialogTitle className="font-ruqaa text-2xl font-bold text-gold-gradient">
              تسجيل الدخول
            </DialogTitle>
            <DialogDescription className="mt-1 font-kufi text-xs text-cream/60">
              منصّة مستر محمد صبري — اللغة العربية
            </DialogDescription>
          </DialogHeader>
          <OrnamentDivider width={220} className="mx-auto mt-3 max-w-full" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="login-id" className="font-kufi text-cream/85">
              رقم تسجيل الدخول
            </Label>
            <div className="relative">
              <UserRound className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-gold-500/70" />
              <Input
                id="login-id"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="أدخل رقم تسجيل الدخول"
                dir="ltr"
                inputMode="numeric"
                autoComplete="username"
                className="border-gold-500/25 bg-night-600/50 ps-9 text-center tracking-widest text-cream placeholder:text-cream/35 focus-visible:ring-gold-500/60"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="login-password" className="font-kufi text-cream/85">
              كلمة السر
            </Label>
            <div className="relative">
              <LockKeyhole className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-gold-500/70" />
              <Input
                id="login-password"
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
            {loading ? <Loader2 className="size-5 animate-spin" /> : "دخول"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
