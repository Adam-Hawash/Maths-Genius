# Task ID: 3-a — subagent-science-labs

**Agent:** subagent-science-labs
**Project:** /home/z/shaimaa-selim-science (منصة د. شماء سليم Science)
**Task:** بناء قسم «مختبر العلوم التفاعلي» — 5 ملفات جديدة فقط، بدون تعديل أي ملف موجود.

## Files Created
| File | Lines | Purpose |
|---|---|---|
| src/components/science/ChemistryLab.tsx | 462 | جدول دوري 43 عنصرًا + محاكي 17 تفاعلًا كيميائيًا بدورق فقاعات |
| src/components/science/PhysicsSandbox.tsx | 456 | قذيفة مقذوفات + بندول + قانون أوم (rAF حي) |
| src/components/science/BiologyAtlas.tsx | 424 | مجسم جسم بشري 3D بالسحب + 7 أعضاء + لولب DNA |
| src/components/science/GeologyEarth.tsx | 576 | مقطع طبقات الأرض بسلايدر عمق + بركان + صفائح تكتونية |
| src/components/landing/ScienceLabsSection.tsx | 148 | غلاف القسم في صفحة الهبوط (id="science-labs") |

## Verification
- `bunx tsc --noEmit` → **0 أخطاء في ملفاتي الخمسة** (26 خطأ baseline موجودة مسبقًا في components/ui بسبب missing @radix-ui في نسخة البيئة — لم أثبّت أي حزمة كما هيّئت).
- لا console.log / لا TODO / لا طلبات شبكة / لا صور خارجية — كل البصريات SVG + CSS + إيموجي.
- كل requestAnimationFrame وsetTimeout أُلغيت في useEffect cleanup.
- Dark-mode آمن (bg-card/border-border + شفافيات ألوان).

## Notes for Next Agents
- الدمج: `<ScienceLabsSection />` من `@/components/landing/ScienceLabsSection` (named export) داخل page.tsx حيث يُطلب — القسم self-contained بالكامل.
- الألوان متطابقة مع لوحة Tailwind: teal-600/teal-400 للبراند، emerald-500 كيمياء، amber-500 فيزياء، rose-500 أحياء، orange-600 جيولوجيا.
- ملاحظة: lucide-react 0.511 لا يحتوي أيقونة `Volcano` (اتأكدت من node_modules) — استُخدمت `Mountain`/`Flame` بدلًا منها.
