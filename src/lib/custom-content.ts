/* (و78) المحتوى الديناميكي — نصائح ومميزات إضافية بتتضاف من لوحة الأدمن
   (فوق الثابتة في اللاندينج) وبتتخزن JSON في مفتاح واحد:
   custom_tips / custom_features = [{"titleAr":"..","titleEn":"..","descAr":"..","descEn":".."}]
   التحليل هنا آمن عن قصد: أي JSON بايظ أو شكل غلط → مصفوفة فاضية بدل ما يكسر الصفحة. */

export interface CustomContentItem {
  titleAr: string
  titleEn: string
  descAr: string
  descEn: string
}

export function emptyCustomItem(): CustomContentItem {
  return { titleAr: '', titleEn: '', descAr: '', descEn: '' }
}

export function parseCustomContent(raw: any): CustomContentItem[] {
  var out: CustomContentItem[] = []
  try {
    var parsed = typeof raw === 'string' && raw.trim() !== '' ? JSON.parse(raw) : (Array.isArray(raw) ? raw : null)
    if (!Array.isArray(parsed)) return out
    for (var i = 0; i < parsed.length; i++) {
      var it = parsed[i]
      if (!it || typeof it !== 'object' || Array.isArray(it)) continue
      out.push({
        titleAr: typeof it.titleAr === 'string' ? it.titleAr : '',
        titleEn: typeof it.titleEn === 'string' ? it.titleEn : '',
        descAr: typeof it.descAr === 'string' ? it.descAr : '',
        descEn: typeof it.descEn === 'string' ? it.descEn : '',
      })
    }
  } catch (e) {}
  return out
}
