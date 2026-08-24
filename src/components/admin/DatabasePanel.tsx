'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Database, Loader2, RefreshCw, CheckCircle2, XCircle, PlugZap,
  HardDriveDownload, Save, Sparkles, KeyRound, Copy,
} from 'lucide-react'
import { toast } from 'sonner'

type TableInfo = { name: string; rows: number | null; missing?: boolean }

type DbStatus = {
  hasUrl: boolean
  hasToken: boolean
  urlVarName: string
  maskedUrl: string
  driver: string
  connected: boolean
  tables: TableInfo[]
  error: string
}

export function DatabasePanel() {
  const [status, setStatus] = useState<DbStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [url, setUrl] = useState('')
  const [token, setToken] = useState('')
  const [testing, setTesting] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [geminiKey, setGeminiKey] = useState('')
  const [savingKey, setSavingKey] = useState(false)

  const loadStatus = async (showToast = false) => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/database')
      const data = await res.json()
      setStatus(data)
      if (showToast) toast.success('تم تحديث حالة قاعدة البيانات')
    } catch {
      toast.error('تعذر قراءة حالة قاعدة البيانات')
    }
    setLoading(false)
  }

  const loadKeys = async () => {
    try {
      const res = await fetch('/api/config')
      const data = await res.json()
      setGeminiKey(data.gemini_api_key || '')
    } catch { /* silent */ }
  }

  useEffect(() => { loadStatus(); loadKeys() }, [])

  const runAction = async (action: 'test' | 'migrate' | 'seed-admin') => {
    const setBusy = action === 'test' ? setTesting : action === 'migrate' ? setMigrating : setSeeding
    setBusy(true)
    try {
      const res = await fetch('/api/admin/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, url: url.trim(), token: token.trim() }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        toast.success(data.message || 'تم بنجاح')
        if (action === 'test' && Array.isArray(data.missing) && data.missing.length > 0) {
          toast.warning('جداول ناقصة: ' + data.missing.length + ' — اضغط "إنشاء / تحديث الجداول"')
        }
        if (action !== 'test') loadStatus()
      } else {
        toast.error(data.error || 'فشل الإجراء')
      }
    } catch {
      toast.error('خطأ في الاتصال بالسيرفر')
    }
    setBusy(false)
  }

  const saveGeminiKey = async () => {
    setSavingKey(true)
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gemini_api_key: geminiKey.trim() }),
      })
      if (res.ok) toast.success('تم حفظ مفتاح الذكاء الاصطناعي')
      else toast.error('خطأ في الحفظ')
    } catch { toast.error('خطأ في الحفظ') }
    setSavingKey(false)
  }

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success('تم نسخ ' + label)
    } catch { toast.error('تعذر النسخ') }
  }

  const missingTables = (status?.tables || []).filter((t) => t.missing)

  return (
    <div className="space-y-4">
      {/* Connection status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              قاعدة البيانات | Database
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => loadStatus(true)} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <RefreshCw className="h-4 w-4 ml-1" />}
              تحديث
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && !status ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 p-3 rounded-xl border bg-card">
                  {status?.connected ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">حالة الاتصال</p>
                    <p className="font-bold text-sm">{status?.connected ? 'متصل' : 'غير متصل'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl border bg-card">
                  <PlugZap className="h-5 w-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">نوع الاتصال</p>
                    <p className="font-bold text-sm truncate">{status?.driver || '—'}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-2 text-xs">
                <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">رابط القاعدة الحالي</span>
                  <span className="font-mono truncate max-w-[60%]" dir="ltr">{status?.maskedUrl || 'غير موجود'}</span>
                </div>
                <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">متغير الرابط</span>
                  <Badge variant="outline" className="font-mono text-[10px]">{status?.urlVarName || 'غير مضبوط'}</Badge>
                </div>
                <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">TURSO_AUTH_TOKEN</span>
                  <Badge variant="outline" className={`text-[10px] ${status?.hasToken ? 'text-emerald-600 border-emerald-500/40' : 'text-destructive border-destructive/40'}`}>
                    {status?.hasToken ? 'موجود' : 'غير موجود'}
                  </Badge>
                </div>
              </div>

              {status?.error && (
                <p className="text-xs text-destructive p-3 rounded-lg bg-destructive/10" dir="ltr">{status.error}</p>
              )}

              {/* Tables */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground">الجداول ({status?.tables?.length || 0})</p>
                  {missingTables.length > 0 && (
                    <Badge className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
                      {missingTables.length} جدول ناقص
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[240px] overflow-y-auto custom-scrollbar">
                  {(status?.tables || []).map((t) => (
                    <div key={t.name} className="flex items-center justify-between gap-2 p-2 rounded-lg border bg-card">
                      <span className="text-[11px] font-mono truncate" dir="ltr">{t.name}</span>
                      {t.missing ? (
                        <Badge variant="outline" className="text-[9px] text-destructive border-destructive/40">ناقص</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[9px]">{t.rows}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add / switch database */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            إضافة قاعدة بيانات Turso (الرابط والتوكن)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Database URL</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="libsql://your-db-name.turso.io"
              dir="ltr"
              className="font-mono text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Auth Token</Label>
            <Input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="eyJhbGciOi..."
              type="password"
              dir="ltr"
              className="font-mono text-xs"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => runAction('test')} disabled={testing}>
              {testing ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <PlugZap className="h-4 w-4 ml-1" />}
              اختبار الاتصال
            </Button>
            <Button size="sm" onClick={() => runAction('migrate')} disabled={migrating}>
              {migrating ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <HardDriveDownload className="h-4 w-4 ml-1" />}
              إنشاء / تحديث الجداول
            </Button>
            <Button size="sm" variant="outline" onClick={() => runAction('seed-admin')} disabled={seeding}>
              {seeding ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <CheckCircle2 className="h-4 w-4 ml-1" />}
              تجهيز حساب الأدمن
            </Button>
          </div>

          <div className="p-3 rounded-xl bg-muted/50 space-y-2 text-[11px] leading-relaxed">
            <p className="font-semibold text-foreground">مهم جداً — مكان حفظ البيانات دي بشكل دائم:</p>
            <p className="text-muted-foreground">
              الخانتين اللي فوق للاختبار وتشغيل الجداول فوراً. لكن السيرفر بيقرأ الاتصال من متغيرات البيئة،
              فلازم تحفظهم في إعدادات المشروع (Settings ← Vars) بالأسماء دي بالضبط:
            </p>
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-background border">
              <span className="font-mono" dir="ltr">DATABASE_URL</span>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyText('DATABASE_URL', 'اسم المتغير')}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-background border">
              <span className="font-mono" dir="ltr">TURSO_AUTH_TOKEN</span>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyText('TURSO_AUTH_TOKEN', 'اسم المتغير')}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-muted-foreground">
              بعد الحفظ اعمل Redeploy، وبعدها اضغط هنا على &quot;إنشاء / تحديث الجداول&quot; مرة واحدة.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI key */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            مفتاح الذكاء الاصطناعي (استخراج الأسئلة)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            المنصة بتستخدم Vercel AI Gateway تلقائياً بدون أي مفتاح لما تكون شغالة على Vercel.
            المفتاح اللي تحت اختياري — لو حبيت تستخدم مفتاح Gemini بتاعك بدل الـ Gateway أو كخطة بديلة عند الفشل.
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs">Gemini API Key (اختياري)</Label>
            <div className="flex gap-2">
              <Input
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIza..."
                type="password"
                dir="ltr"
                className="font-mono text-xs"
              />
              <Button size="icon" variant="outline" onClick={saveGeminiKey} disabled={savingKey}>
                {savingKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            بديل تالت: أضف متغير <span className="font-mono" dir="ltr">AI_GATEWAY_API_KEY</span> أو
            <span className="font-mono" dir="ltr"> GEMINI_API_KEY</span> في Vars بتاعة المشروع.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
