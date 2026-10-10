'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, Lock, LogOut, ArrowRight, RefreshCw } from 'lucide-react'
import { useAdmin } from '@/lib/cart-store'
import { ProductsTab } from './products-tab'
import { CategoriesTab } from './categories-tab'
import { BrandsTab } from './brands-tab'
import { OrdersTab } from './orders-tab'
import { PromosTab } from './promos-tab'
import { SettingsTab } from './settings-tab'
import { DashboardTab } from './dashboard-tab'

export function AdminPanel({ onBackToStore }: { onBackToStore: () => void }) {
  const { token, email, setAuth, logout } = useAdmin()
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (email) setLoginEmail(email)
  }, [email])

  async function login() {
    const em = loginEmail.trim()
    if (!em || !loginPassword) {
      toast.error('اكتب البريد وكلمة المرور')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/pharmacy/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: em, password: loginPassword }),
      })
      const data = (await res.json()) as { ok?: boolean; token?: string; email?: string; error?: string }
      if (!res.ok || !data.ok || !data.token) {
        toast.error(data.error || 'بيانات الدخول غير صحيحة')
        return
      }
      setAuth(data.token, data.email || em)
      setLoginPassword('')
      toast.success('أهلاً بك في لوحة التحكم 👋')
    } catch {
      toast.error('حدث خطأ في الشبكة')
    } finally {
      setBusy(false)
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-secondary to-background p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <span className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Lock className="h-6 w-6" />
            </span>
            <CardTitle className="text-lg font-black">لوحة تحكم الصيدلية</CardTitle>
            <CardDescription>
              منطقة خاصة بإدارة صيدلية د. وليد التهان — الدخول للمصرح لهم فقط
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-email" className="text-xs font-bold">
                البريد الإلكتروني
              </Label>
              <Input
                id="admin-email"
                type="email"
                dir="ltr"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@eltahanpharmacy.com"
                className="h-11 text-start"
                autoComplete="username"
                onKeyDown={(e) => e.key === 'Enter' && login()}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-password" className="text-xs font-bold">
                كلمة المرور
              </Label>
              <Input
                id="admin-password"
                type="password"
                dir="ltr"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 text-start"
                autoComplete="current-password"
                onKeyDown={(e) => e.key === 'Enter' && login()}
              />
            </div>
            <Button type="button" onClick={login} disabled={busy} className="h-11 w-full font-extrabold">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'دخول'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onBackToStore}
              className="h-9 w-full gap-1.5 text-xs text-muted-foreground"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              العودة للمتجر
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      {/* Admin header */}
      <header className="sticky top-0 z-40 border-b bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-2xl text-primary-foreground">
            ⚕️
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold">لوحة تحكم الصيدلية</p>
            <p className="truncate text-[11px] text-muted-foreground" dir="ltr">
              {email}
            </p>
          </div>
          <Badge variant="secondary" className="hidden sm:inline-flex">
            أدمن
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setReloadKey((k) => k + 1)}
            title="تحديث البيانات"
            aria-label="تحديث البيانات"
            className="h-10 w-10"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onBackToStore}
            className="hidden h-10 gap-1.5 text-xs sm:inline-flex"
          >
            <ArrowRight className="h-4 w-4" />
            المتجر
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              logout()
              toast.info('تم تسجيل الخروج')
            }}
            className="h-10 gap-1.5 text-xs text-destructive hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            خروج
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 p-4">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="ph-scroll-x mb-4 flex h-auto w-full justify-start gap-1 overflow-x-auto p-1">
            <TabsTrigger value="dashboard" className="gap-1.5 px-3 py-2 text-xs">
              📊 الرئيسية
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-1.5 px-3 py-2 text-xs">
              📦 الطلبات
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-1.5 px-3 py-2 text-xs">
              💊 المنتجات
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-1.5 px-3 py-2 text-xs">
              🗂️ الفئات
            </TabsTrigger>
            <TabsTrigger value="brands" className="gap-1.5 px-3 py-2 text-xs">
              🏷️ الماركات
            </TabsTrigger>
            <TabsTrigger value="promos" className="gap-1.5 px-3 py-2 text-xs">
              🎟️ أكواد الخصم
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5 px-3 py-2 text-xs">
              ⚙️ الإعدادات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab token={token} reloadKey={reloadKey} />
          </TabsContent>
          <TabsContent value="orders">
            <OrdersTab token={token} reloadKey={reloadKey} />
          </TabsContent>
          <TabsContent value="products">
            <ProductsTab token={token} reloadKey={reloadKey} />
          </TabsContent>
          <TabsContent value="categories">
            <CategoriesTab token={token} reloadKey={reloadKey} />
          </TabsContent>
          <TabsContent value="brands">
            <BrandsTab token={token} reloadKey={reloadKey} />
          </TabsContent>
          <TabsContent value="promos">
            <PromosTab token={token} reloadKey={reloadKey} />
          </TabsContent>
          <TabsContent value="settings">
            <SettingsTab token={token} reloadKey={reloadKey} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
