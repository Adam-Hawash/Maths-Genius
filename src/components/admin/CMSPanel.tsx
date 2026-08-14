'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Settings, Save, Upload, Loader2, Image as ImageIcon, Trash2, Link2 } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import type { SiteConfig } from '@/stores/app-store'
import { chunkedUpload } from '@/lib/chunked-upload'

const CONFIG_FIELDS = [
  { key: 'hero_badge', label: 'شارة البطل | Hero Badge', type: 'text' },
  { key: 'hero_title_line1', label: 'عنوان البطل سطر 1 | Hero Title Line 1', type: 'text' },
  { key: 'hero_title_line2', label: 'عنوان البطل سطر 2 | Hero Title Line 2', type: 'text' },
  { key: 'hero_subtitle', label: 'نص البطل | Hero Subtitle', type: 'textarea' },
  { key: 'hero_stat1_value', label: 'إحصائية 1 القيمة', type: 'text' },
  { key: 'hero_stat1_label', label: 'إحصائية 1 التسمية', type: 'text' },
  { key: 'hero_stat2_value', label: 'إحصائية 2 القيمة', type: 'text' },
  { key: 'hero_stat2_label', label: 'إحصائية 2 التسمية', type: 'text' },
  { key: 'hero_stat3_value', label: 'إحصائية 3 القيمة', type: 'text' },
  { key: 'hero_stat3_label', label: 'إحصائية 3 التسمية', type: 'text' },
  { key: 'instructor_name', label: 'اسم المعلم | Instructor Name', type: 'text' },
  { key: 'instructor_title', label: 'لقب المعلم | Instructor Title', type: 'text' },
  { key: 'feature1_title', label: 'ميزة 1 العنوان', type: 'text' },
  { key: 'feature1_desc', label: 'ميزة 1 الوصف', type: 'textarea' },
  { key: 'feature2_title', label: 'ميزة 2 العنوان', type: 'text' },
  { key: 'feature2_desc', label: 'ميزة 2 الوصف', type: 'textarea' },
  { key: 'feature3_title', label: 'ميزة 3 العنوان', type: 'text' },
  { key: 'feature3_desc', label: 'ميزة 3 الوصف', type: 'textarea' },
  { key: 'feature4_title', label: 'ميزة 4 العنوان', type: 'text' },
  { key: 'feature4_desc', label: 'ميزة 4 الوصف', type: 'textarea' },
  { key: 'gallery_title', label: 'عنوان معرض الصور | Gallery Title', type: 'text' },
  { key: 'gallery_subtitle', label: 'وصف معرض الصور | Gallery Subtitle', type: 'textarea' },
]

interface ImageSlot {
  configKey: string
  label: string
  labelEn: string
  shape: 'circle' | 'wide' | 'square'
}

const IMAGE_SLOTS: ImageSlot[] = [
  { configKey: 'instructor_photo', label: 'صورة المعلم', labelEn: 'Instructor Photo', shape: 'circle' },
  { configKey: 'hero_bg_image', label: 'صورة خلفية البطل', labelEn: 'Hero Background', shape: 'wide' },
  { configKey: 'site_logo', label: 'شعار الموقع', labelEn: 'Site Logo', shape: 'wide' },
  { configKey: 'tip1_image', label: 'نصيحة 1', labelEn: 'Tip 1', shape: 'square' },
  { configKey: 'tip2_image', label: 'نصيحة 2', labelEn: 'Tip 2', shape: 'square' },
  { configKey: 'tip3_image', label: 'نصيحة 3', labelEn: 'Tip 3', shape: 'square' },
]

export function CMSPanel() {
  const [config, setConfig] = useState<SiteConfig>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [previews, setPreviews] = useState<Record<string, string>>({})

  const loadConfig = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/config')
      const data = await res.json()
      setConfig(data)
      const pvs: Record<string, string> = {}
      IMAGE_SLOTS.forEach(slot => { pvs[slot.configKey] = data[slot.configKey] || '' })
      setPreviews(pvs)
    } catch { toast.error('خطأ في تحميل الإعدادات') }
    setLoading(false)
  }

  useEffect(() => { loadConfig() }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) })
      if (res.ok) {
        toast.success('تم حفظ الإعدادات بنجاح | Settings saved')
        const storeState = await (await import('@/stores/app-store')).useAppStore.getState()
        storeState.setSiteConfig(config)
      } else { toast.error('خطأ في الحفظ') }
    } catch { toast.error('خطأ في الاتصال') }
    setSaving(false)
  }

  const handleUpload = async (file: File, configKey: string) => {
    setUploading(configKey)
    try {
      const data = await chunkedUpload(file, 'photos')
      const newConfig = { ...config, [configKey]: data.filePath }
      setConfig(newConfig)
      setPreviews(prev => ({ ...prev, [configKey]: data.filePath }))
      toast.success('تم رفع الصورة بنجاح')
    } catch (err: any) { toast.error(err.message || 'خطأ في رفع الصورة') }
    setUploading(null)
  }

  const handleRemove = (configKey: string) => {
    const newConfig = { ...config, [configKey]: '' }
    setConfig(newConfig)
    setPreviews(prev => ({ ...prev, [configKey]: '' }))
    toast.success('تم إزالة الصورة')
  }

  const handleSetUrl = (configKey: string, url: string) => {
    const newConfig = { ...config, [configKey]: url }
    setConfig(newConfig)
    setPreviews(prev => ({ ...prev, [configKey]: url }))
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="space-y-6">
      {/* Dynamic Image Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2"><ImageIcon className="h-5 w-5" />إدارة الصور | Image Management</span>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'جاري الحفظ...' : 'حفظ الكل'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {IMAGE_SLOTS.map((slot) => {
              const preview = previews[slot.configKey] || ''
              const isUploading = uploading === slot.configKey
              return (
                <div key={slot.configKey} className="flex flex-col items-center gap-2 p-4 rounded-lg border border-dashed hover:border-primary/30 transition-colors">
                  {/* Preview */}
                  <div className={`overflow-hidden border-2 border-primary/20 shrink-0 bg-muted ${slot.shape === 'circle' ? 'w-24 h-24 rounded-full' : slot.shape === 'wide' ? 'w-full h-24 rounded-lg' : 'w-full h-20 rounded-lg'}`}>
                    {preview ? (
                      <img src={preview} alt={slot.label} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        {slot.shape === 'circle' ? <span className="text-2xl">👤</span> : <ImageIcon className="h-6 w-6" />}
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium text-center">{slot.label} | {slot.labelEn}</p>

                  {/* Upload / URL / Remove buttons */}
                  <div className="flex items-center gap-1.5">
                    <input
                      ref={(el) => { fileRefs.current[slot.configKey] = el }}
                      type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, slot.configKey) }}
                    />
                    <Button variant="outline" size="sm" onClick={() => fileRefs.current[slot.configKey]?.click()} disabled={isUploading} className="h-8">
                      {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                      <span className="text-[10px] mr-1">رفع</span>
                    </Button>
                    {preview && (
                      <Button variant="ghost" size="sm" onClick={() => handleRemove(slot.configKey)} className="h-8">
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </div>

                  {/* URL fallback */}
                  <div className="flex items-center gap-1.5 w-full">
                    <Link2 className="h-3 w-3 text-muted-foreground shrink-0" />
                    <Input
                      placeholder="أو أدخل رابط صورة..."
                      value={config[slot.configKey] && !config[slot.configKey].startsWith('/uploads/') ? config[slot.configKey] : ''}
                      onChange={(e) => handleSetUrl(slot.configKey, e.target.value)}
                      dir="ltr" className="h-7 text-[10px]"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Text Config Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />تخصيص النصوص | Site Text Customization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 sm:grid-cols-2">
            {CONFIG_FIELDS.map((field) => (
              <div key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                <Label className="text-xs mb-1 block">{field.label}</Label>
                {field.type === 'textarea' ? (
                  <Textarea value={config[field.key] || ''} onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })} rows={3} />
                ) : (
                  <Input value={config[field.key] || ''} onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Save className="h-4 w-4 ml-1" />}
              {saving ? 'جاري الحفظ...' : 'حفظ النصوص | Save Texts'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
