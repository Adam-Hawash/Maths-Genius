import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/admin-auth'

const prisma = new PrismaClient()

// ─────────────────────────── Brands (16) ───────────────────────────
const BRANDS: { name: string; slug: string; color: string; featured: boolean }[] = [
  { name: 'La Roche-Posay', slug: 'la-roche-posay', color: '#0E7490', featured: true },
  { name: 'CeraVe', slug: 'cerave', color: '#1D4ED8', featured: true },
  { name: 'Vichy', slug: 'vichy', color: '#0F766E', featured: true },
  { name: 'The Ordinary', slug: 'the-ordinary', color: '#374151', featured: true },
  { name: 'Bioderma', slug: 'bioderma', color: '#0891B2', featured: true },
  { name: 'Eucerin', slug: 'eucerin', color: '#0369A1', featured: true },
  { name: 'Nivea', slug: 'nivea', color: '#1E40AF', featured: true },
  { name: "Garnier", slug: 'garnier', color: '#15803D', featured: true },
  { name: "L'Oreal", slug: 'loreal', color: '#B91C1C', featured: true },
  { name: 'Maybelline', slug: 'maybelline', color: '#DB2777', featured: true },
  { name: 'Eva', slug: 'eva', color: '#7C3AED', featured: true },
  { name: "Johnson's", slug: 'johnsons', color: '#B45309', featured: true },
  { name: 'Chicco', slug: 'chicco', color: '#0284C7', featured: true },
  { name: 'Avent', slug: 'avent', color: '#0D9488', featured: true },
  { name: 'COSRX', slug: 'cosrx', color: '#4D7C0F', featured: true },
  { name: 'Omron', slug: 'omron', color: '#DC2626', featured: true },
]

// ─────────────────────────── Categories (21) ───────────────────────────
const CATEGORIES: { name: string; slug: string; group: string; emoji: string; sortOrder: number }[] = [
  { name: 'فيتامينات ومكملات', slug: 'vitamins-supplements', group: 'health', emoji: '🍊', sortOrder: 1 },
  { name: 'أدوية بدون وصفة', slug: 'otc-medicine', group: 'health', emoji: '💊', sortOrder: 2 },
  { name: 'سعال وزكام', slug: 'cold-flu', group: 'health', emoji: '🤧', sortOrder: 3 },
  { name: 'عناية بالفم والأسنان', slug: 'oral-care', group: 'health', emoji: '🦷', sortOrder: 4 },
  { name: 'مستلزمات طبية', slug: 'medical-supplies', group: 'health', emoji: '🩹', sortOrder: 5 },
  { name: 'العناية بالبشرة', slug: 'skincare', group: 'beauty', emoji: '🧴', sortOrder: 6 },
  { name: 'مرطبات وترطيب عميق', slug: 'moisturizers', group: 'beauty', emoji: '💧', sortOrder: 7 },
  { name: 'واقي شمس', slug: 'sunscreen', group: 'beauty', emoji: '☀️', sortOrder: 8 },
  { name: 'العناية بالشعر', slug: 'haircare', group: 'beauty', emoji: '💇‍♀️', sortOrder: 9 },
  { name: 'مكياج', slug: 'makeup', group: 'beauty', emoji: '💄', sortOrder: 10 },
  { name: 'عطور', slug: 'fragrance', group: 'beauty', emoji: '🌸', sortOrder: 11 },
  { name: 'حفاضات ومنتجات الرضاعة', slug: 'diapers-feeding', group: 'mother-baby', emoji: '🍼', sortOrder: 12 },
  { name: 'عناية بالطفل', slug: 'baby-care', group: 'mother-baby', emoji: '👶', sortOrder: 13 },
  { name: 'مستلزمات الأم', slug: 'mom-essentials', group: 'mother-baby', emoji: '🤰', sortOrder: 14 },
  { name: 'أجهزة قياس الضغط', slug: 'bp-monitors', group: 'devices', emoji: '🩺', sortOrder: 15 },
  { name: 'أجهزة السكري', slug: 'diabetes-care', group: 'devices', emoji: '🩸', sortOrder: 16 },
  { name: 'موازين وأجهزة قياس', slug: 'scales-monitors', group: 'devices', emoji: '⚖️', sortOrder: 17 },
  { name: 'نظافة شخصية', slug: 'hygiene', group: 'personal-care', emoji: '🧼', sortOrder: 18 },
  { name: 'عناية بالرجال', slug: 'men-care', group: 'personal-care', emoji: '🧔', sortOrder: 19 },
  { name: 'تغذية رياضية', slug: 'sports-nutrition', group: 'nutrition', emoji: '💪', sortOrder: 20 },
  { name: 'أطعمة صحية', slug: 'health-food', group: 'nutrition', emoji: '🥗', sortOrder: 21 },
]

// ─────────────────────────── Products ───────────────────────────
type SeedProduct = {
  name: string
  slug: string
  description: string
  price: number
  oldPrice?: number
  emoji: string
  /** مسارات صور مبدئية من /images/products — أول صورة هي الرئيسية. مش بيتكتب إلا لو موجود عشان الرفع من الأدمن ما يتشالش */
  images?: string[]
  skinType?: string
  size?: string
  stock: number
  tags: string[]
  bundleOffer?: boolean
  categorySlug: string
  brandSlug?: string
}

// صور مبدئية للمنتجات المميزة (paths من public/images/products)
// (6-b) كل فئة ليها صورة افتراضية — أي منتج من غير صورة بياخد صورة فئته عند الإنشاء،
// والأدمن يقدر يبدلها بصورة المنتج الحقيقية من لوحة التحكم في أي وقت
const IMG = {
  dermo: '/images/products/dermo-care.png',
  baby: '/images/products/baby-care.png',
  vitamins: '/images/products/vitamins.png',
  main: '/images/products/pharmacy-main.png',
  medicine: '/images/products/medicine.png',
  oral: '/images/products/oralcare.png',
  devices: '/images/products/devices.png',
  hair: '/images/products/haircare.png',
  makeup: '/images/products/makeup.png',
  nutrition: '/images/products/nutrition.png',
}

/* صورة افتراضية لكل فئة (بالـ slug) */
const CATEGORY_IMAGES: Record<string, string> = {
  'vitamins-supplements': IMG.vitamins,
  'otc-medicine': IMG.medicine,
  'cold-flu': IMG.medicine,
  'oral-care': IMG.oral,
  'medical-supplies': IMG.devices,
  skincare: IMG.dermo,
  moisturizers: IMG.dermo,
  sunscreen: IMG.dermo,
  haircare: IMG.hair,
  makeup: IMG.makeup,
  fragrance: IMG.makeup,
  'diapers-feeding': IMG.baby,
  'baby-care': IMG.baby,
  'mom-care': IMG.baby,
  'mom-essentials': IMG.baby,
  'bp-monitors': IMG.devices,
  'diabetes-care': IMG.devices,
  'scales-monitors': IMG.devices,
  hygiene: IMG.oral,
  'men-care': IMG.hair,
  'sports-nutrition': IMG.nutrition,
  'health-food': IMG.nutrition,
}

const PRODUCTS: SeedProduct[] = [
  // فيتامينات ومكملات
  { name: 'فيتامين سي 1000 مجم - 20 قرص فوارة', slug: 'vitamin-c-1000-20', description: 'فيتامين سي بتركيز عالي لتقوية المناعة ودعم صحة الجسم، بشرائط فوارة بنكهة البرتقال اللذيذة. يُذاب قرص واحد في كوب ماء يوميًا.', price: 95, oldPrice: 120, emoji: '🍊', images: [IMG.vitamins], size: '20 قرص', stock: 45, tags: ['مناعة', 'فيتامينات'], categorySlug: 'vitamins-supplements' },
  { name: 'أوميجا 3 زيت السمك - 60 كبسولة', slug: 'omega-3-fish-oil-60', description: 'أوميجا 3 النقي لدعم صحة القلب والدماغ والمفاصل، مستخلص من أسماك المحيط العميقة وخالٍ من المعادن الثقيلة.', price: 320, emoji: '🐟', images: [IMG.vitamins, IMG.main], size: '60 كبسولة', stock: 30, tags: ['قلب', 'أوميجا'], bundleOffer: true, categorySlug: 'vitamins-supplements' },
  { name: 'فيتامين د3 50000 وحدة - 8 كبسولات', slug: 'vitamin-d3-50000-8', description: 'جرعة أسبوعية عالية من فيتامين د3 لعلاج نقص فيتامين د وتقوية العظام، بتوجيه من الطبيب.', price: 78, emoji: '☀️', size: '8 كبسولة', stock: 60, tags: ['عظام', 'فيتامين د'], categorySlug: 'vitamins-supplements' },
  { name: 'حديد وفوليك سانوستول - 30 قرص', slug: 'ferrofol-30', description: 'مكمل حديد وحمض الفوليك للحوامل والمصابين بفقر الدم، سهل الامتصاص ولا يسبب إمساك.', price: 145, emoji: '🩸', size: '30 قرص', stock: 4, tags: ['حديد', 'حمل'], categorySlug: 'vitamins-supplements' },
  { name: 'زنك 25 مجم - 50 قرص', slug: 'zinc-25-50', description: 'الزنك مضاد أكسدة أساسي لدعم المناعة وصحة البشرة والشعر.', price: 85, oldPrice: 100, emoji: '🛡️', size: '50 قرص', stock: 38, tags: ['مناعة', 'شعر'], categorySlug: 'vitamins-supplements' },

  // أدوية بدون وصفة
  { name: 'بنادول اكسترا 500 مجم - 24 قرص', slug: 'panadol-extra-24', description: 'مسكن للألم وخافض للحرارة يحتوي باراسيتامول وكافيين، لعلاج الصداع وآلام الأسنان والمفاصل.', price: 48, emoji: '💊', images: [IMG.main], size: '24 قرص', stock: 80, tags: ['مسكن', 'صداع'], bundleOffer: true, categorySlug: 'otc-medicine' },
  { name: 'بروفين 400 مجم - 30 قرص', slug: 'brufen-400-30', description: 'إيبوبروفين مضاد التهاب وغير ستيرويدي لآلام المفاصل والعضلات والصداع النصفي.', price: 42, emoji: '💊', size: '30 قرص', stock: 65, tags: ['مسكن', 'التهابات'], categorySlug: 'otc-medicine' },
  { name: 'فيرفوجل جل - 35 جم', slug: 'verfugel-gel-35', description: 'جل مخدر موضعي لتخفيف ألم اللثة عند التقويم وقرح الفم، آمن وسريع المفعول.', price: 110, emoji: '🦷', size: '35 جم', stock: 2, tags: ['فم', 'لثة'], categorySlug: 'otc-medicine' },
  { name: 'جافيسكون شراب للحموضة - 200 مل', slug: 'gaviscon-syrup-200', description: 'شراب يعمل على الحد من حموضة وحرقة المعدة وارتجاع المريء بشكل طبيعي وآمن.', price: 130, emoji: '🫙', size: '200 مل', stock: 28, tags: ['معدة', 'حموضة'], categorySlug: 'otc-medicine' },

  // سعال وزكام
  { name: 'شراب بروتوس للسعال الجاف - 120 مل', slug: 'pro syrup-dry-120', description: 'شراب مضاد للسعال الجيف المزعج خاصة ليلاً، بنكهة العسل الليمون.', price: 65, emoji: '🍯', size: '120 مل', stock: 40, tags: ['سعال'], categorySlug: 'cold-flu' },
  { name: 'أوديفين حبوب للزكام - 20 قرص', slug: 'odifin-cold-20', description: 'حبوب مركبة لعلاج أعراض الزكام والرشح واحتقان الأنف والعطاس.', price: 38, emoji: '🤧', size: '20 قرص', stock: 55, tags: ['زكام', 'رشح'], categorySlug: 'cold-flu' },
  { name: 'رشاش أوترفين للأنف - 15 مل', slug: 'otrivin-nasal-15', description: 'رشاش أنف يخفف احتقان الأنف بسرعة ويسهل التنفس، مناسب للكبار.', price: 58, emoji: '🌬️', size: '15 مل', stock: 33, tags: ['أنف', 'احتقان'], categorySlug: 'cold-flu' },
  { name: 'بخاخ فوسيالين للحلق - 30 مل', slug: 'fusylin-throat-30', description: 'بخاخ مضاد بكتيري لعلاج التهاب الحلق واللوزتين، بدون طعم مؤلم.', price: 72, emoji: '🗣️', size: '30 مل', stock: 3, tags: ['حلق'], categorySlug: 'cold-flu' },

  // عناية بالفم
  { name: 'معجون سيبلودنت للأسنان الحساسة - 75 مل', slug: 'sensodyne-75', description: 'معجون أسنان مخصص للأسنان الحساسة يوفر حماية فورية وملمس ناعم، بنكهة النعناع المنعش.', price: 125, oldPrice: 150, emoji: '🦷', size: '75 مل', stock: 42, tags: ['أسنان', 'حساسية'], bundleOffer: true, categorySlug: 'oral-care' },
  { name: 'غسول فم ليسترين كول - 250 مل', slug: 'listerine-cool-250', description: 'غسول فم مضاد للبكتيريا يمنح أنفاسًا منعشة لمدة 24 ساعة ويحارب جير الأسنان.', price: 90, emoji: '💦', size: '250 مل', stock: 50, tags: ['غسول', 'نَفَس'], categorySlug: 'oral-care' },
  { name: 'فرشاة أسنان طبية متوسطة نعومة', slug: 'toothbrush-med', description: 'فرشاة أسنان برأس صغير وشعيرات ناعمة تصل للأماكن الصعبة بلطف.', price: 35, emoji: '🪥', stock: 90, tags: ['فرشاة'], categorySlug: 'oral-care' },

  // مستلزمات طبية
  { name: 'لصقات قطنية إسعافية - علبة 20', slug: 'plasters-20', description: 'لصقات لاصقة مريحة بأحجام مختلفة لحماية الجروح الصغيرة والحفاظ عليها نظيفة.', price: 30, emoji: '🩹', stock: 100, tags: ['إسعافات'], categorySlug: 'medical-supplies' },
  { name: 'شماغ طبي حمض - علبة 50 قطعة', slug: 'mask-box-50', description: 'كمامات طبية ثلاثية الطبقات عالية الترشيح، مريحة وملائمة لجميع أحجام الوجه.', price: 45, oldPrice: 60, emoji: '😷', stock: 120, tags: ['كمامات'], categorySlug: 'medical-supplies' },
  { name: 'ميزان حرارة ديجيتال', slug: 'digital-thermometer', description: 'ميزان حرارة رقمي سريع القراءة خلال 10 ثوانٍ مع شاشة واضحة وذاكرة لآخر قراءة.', price: 150, emoji: '🌡️', stock: 25, tags: ['حرارة'], categorySlug: 'medical-supplies' },
  { name: 'شاش طبي معقم - رول 10 متر', slug: 'gauze-roll-10', description: 'شاش قطني معقم عالي النقاء للاستخدام في تغطية الجروح والضمادات.', price: 22, emoji: '🧵', stock: 6, tags: ['شاش'], categorySlug: 'medical-supplies' },

  // العناية بالبشرة
  { name: 'سيروم نياسينامايد 10% + زنك', slug: 'the-ordinary-niacinamide', description: 'سيروم من The Ordinary لتقليل ظهور المسامات وتوحيد لون البشرة والتحكم في إفراز الدهون، مناسب للبشرة الدهنية.', price: 550, oldPrice: 650, emoji: '🧪', images: [IMG.dermo, IMG.main], skinType: 'oily', size: '30 مل', stock: 22, tags: ['سيروم', 'مسامات'], bundleOffer: true, categorySlug: 'skincare', brandSlug: 'the-ordinary' },
  { name: 'غسول ميسيلار بيوديرما سنسبيو - 500 مل', slug: 'bioderma-sensibio-500', description: 'ماء ميسيلار لطيف لإزالة المكياج والتنظيف العميق للبشرة الحساسة دون تهيج، رقم 1 عالميًا.', price: 480, emoji: '💧', images: [IMG.dermo], skinType: 'sensitive', size: '500 مل', stock: 18, tags: ['غسول', 'ميسيلار'], categorySlug: 'skincare', brandSlug: 'bioderma' },
  { name: 'غسول فوم CeraVe للبشرة الدهنية - 236 مل', slug: 'cerave-foaming-236', description: 'غسول رغوي يحتوي سيراميدات ونياسينامايد ينظف البشرة بعمق دون أن يجففها ويحافظ على حاجز البشرة.', price: 420, emoji: '🫧', images: [IMG.dermo], skinType: 'oily', size: '236 مل', stock: 26, tags: ['غسول', 'سيراميدات'], categorySlug: 'skincare', brandSlug: 'cerave' },
  { name: 'COSRX سيروم حلزون البحر 96% - 100 مل', slug: 'cosrx-snail-96', description: 'سيروم مركز من مخاط الحلزون لترطيب البشرة وتجديدها وتقليل آثار الحبوب، خفيف وسريع الامتصاص.', price: 590, oldPrice: 700, emoji: '🐌', images: [IMG.dermo], skinType: 'combination', size: '100 مل', stock: 15, tags: ['سيروم', 'ترطيب'], bundleOffer: true, categorySlug: 'skincare', brandSlug: 'cosrx' },
  { name: 'تونر La Roche-Posay لطيف - 200 مل', slug: 'lrp-toner-200', description: 'تونر ميحراري من La Roche-Posay ينقي البشرة ويهدئ التهيج ويحضر البشرة للترطيب.', price: 395, emoji: '🌊', skinType: 'sensitive', size: '200 مل', stock: 20, tags: ['تونر'], categorySlug: 'skincare', brandSlug: 'la-roche-posay' },

  // مرطبات
  { name: 'كريم CeraVe مرطب للبشرة الجافة - 454 جم', slug: 'cerave-cream-454', description: 'كريم غني بالسيراميدات وحمض الهيالورونيك لترطيب مكثف يدوم 48 ساعة للبشرة الجافة جدًا.', price: 620, emoji: '🧴', images: [IMG.dermo], skinType: 'dry', size: '454 جم', stock: 24, tags: ['مرطب', 'سيراميدات'], categorySlug: 'moisturizers', brandSlug: 'cerave' },
  { name: 'لوشن يوريسيرين يوريتين 10% - 250 مل', slug: 'eucerin-urea-250', description: 'لوشن علاجي للياقة البشرة الجافة والخشنة جدًا، يعيد بناء حاجز البشرة الطبيعي.', price: 410, oldPrice: 480, emoji: '💧', skinType: 'dry', size: '250 مل', stock: 21, tags: ['مرطب', 'يوريا'], categorySlug: 'moisturizers', brandSlug: 'eucerin' },
  { name: 'كريم فيشي ليسيوم 24 ساعة - 50 مل', slug: 'vichy-aqualia-50', description: 'كريم ترطيب يومي بتقنية الفيولي الواتر لترطيب البشرة 24 ساعة وإشراقة صحية.', price: 540, emoji: '🫧', skinType: 'normal', size: '50 مل', stock: 17, tags: ['مرطب'], categorySlug: 'moisturizers', brandSlug: 'vichy' },
  { name: 'كريم لاروش بوزاي ليبكار للحاجز - 40 مل', slug: 'lrp-lipikar-40', description: 'كريم علاجي للبشرة الحساسة والمتشققة، يهدئ الحكة والجفاف الشديد فورًا.', price: 460, emoji: '🧴', skinType: 'sensitive', size: '40 مل', stock: 19, tags: ['مرطب', 'حساسة'], categorySlug: 'moisturizers', brandSlug: 'la-roche-posay' },

  // واقي شمس
  { name: 'واقي شمس La Roche-Posay شالاك SPF50 - 50 مل', slug: 'lrp-anthelios-50', description: 'حماية عالية جدًا من أشعة الشمس بتركيبة شالاك ضد الأشعة الطويلة، مقاوم للماء وخفيف على البشرة.', price: 750, oldPrice: 890, emoji: '☀️', images: [IMG.dermo, IMG.main], skinType: 'all', size: '50 مل', stock: 14, tags: ['واقي شمس', 'SPF50'], bundleOffer: true, categorySlug: 'sunscreen', brandSlug: 'la-roche-posay' },
  { name: 'واقي شمس فيشي كابيتال سولييل SPF50 - 50 مل', slug: 'vichy-capital-spf50', description: 'واقي شمس يومي بلمسة نهائية غير دهنية مناسب تحت المكياج، مع مضادات أكسدة.', price: 680, emoji: '🧢', skinType: 'normal', size: '50 مل', stock: 16, tags: ['واقي شمس'], categorySlug: 'sunscreen', brandSlug: 'vichy' },
  { name: 'واقي شمس Eucerin Oil Control SPF50+ - 50 مل', slug: 'eucerin-oil-spf50', description: 'واقي شمس جل جاف مخصص للبشرة الدهنية والمعرضة لحب الشباب، يتحكم في اللمعان.', price: 620, emoji: '🧴', skinType: 'oily', size: '50 مل', stock: 13, tags: ['واقي شمس', 'دهنية'], categorySlug: 'sunscreen', brandSlug: 'eucerin' },

  // العناية بالشعر
  { name: 'شامبو كيرافيل للشعر التالف - 400 مل', slug: 'céravil-shampoo-400', description: 'شامبو خالٍ من السلفات يقوي الشعر التالف والمصبوغ ويعيد لمعانه الطبيعي.', price: 320, emoji: '🧴', size: '400 مل', stock: 30, tags: ['شامبو'], categorySlug: 'haircare' },
  { name: 'ماسك Eva للشعر بالكيراتين - 500 مل', slug: 'eva-keratin-mask-500', description: 'ماسك تغذية مكثفة بالكيراتين وزيت الأرجان لعلاج الشعر الجاف والتالف في دقائق.', price: 180, oldPrice: 220, emoji: '💇‍♀️', size: '500 مل', stock: 35, tags: ['ماسك', 'كيراتين'], categorySlug: 'haircare', brandSlug: 'eva' },
  { name: 'سيروم فيشي ديكروس ضد التساقط - 100 مل', slug: 'vichy-dercos-100', description: 'سيروم علاجي ضد تساقط الشعر يقلل التساقط ويحفز نمو الشعر مع الاستخدام المنتظم.', price: 820, emoji: '🌱', size: '100 مل', stock: 9, tags: ['تساقط'], categorySlug: 'haircare', brandSlug: 'vichy' },
  { name: 'زيت جارنييه أفوكادو للشعر - 150 مل', slug: 'garnier-avocado-oil', description: 'زيت مغذي للشعر الجاف والمجعد يمتص بسرعة ويترك الشعر ناعمًا ولامعًا.', price: 95, emoji: '🥑', size: '150 مل', stock: 48, tags: ['زيت'], categorySlug: 'haircare', brandSlug: 'garnier' },

  // مكياج
  { name: 'كريم أساس مايبلين فِت مي - 30 مل', slug: 'maybelline-fit-me-30', description: 'كريم أساس بتركيبة مطفية تغطية متوسطة طبيعية يتوفر منه درجات تناسب كل البشرات.', price: 385, oldPrice: 450, emoji: '💄', size: '30 مل', stock: 27, tags: ['أساس', 'مكياج'], categorySlug: 'makeup', brandSlug: 'maybelline' },
  { name: 'ماسكارا لوريال فولومي - 10 مل', slug: 'loreal-volume-10', description: 'ماسكارا تكثيف فوري للرموش بفرشاة مبتكرة تعطي حجوم مضاعفة بدون تكتل.', price: 350, emoji: '👁️', size: '10 مل', stock: 23, tags: ['ماسكارا'], categorySlug: 'makeup', brandSlug: 'loreal' },
  { name: 'أحمر شفاه مايبلين سوبر ستي - 3 جم', slug: 'maybelline-superstay-3', description: 'أحمر شفاه ثابت حتى 12 ساعة بتركيبة مريحة غير جافة ودرجات جذابة.', price: 275, emoji: '💋', size: '3 جم', stock: 31, tags: ['شفاه'], categorySlug: 'makeup', brandSlug: 'maybelline' },

  // عطور
  { name: 'عطر ايفا فريش للنساء - 100 مل', slug: 'eva-fresh-100', description: 'عطر نسائي منعش بمزيج الحمضيات والزهور يناسب الاستخدام اليومي وثبات ممتاز.', price: 260, emoji: '🌸', size: '100 مل', stock: 20, tags: ['عطر'], categorySlug: 'fragrance', brandSlug: 'eva' },
  { name: 'عطر جارنييه للرجال - 100 مل', slug: 'garnier-men-100', description: 'عطر رجالي خشبي منعش مناسب للصيف وثبات يصل إلى 8 ساعات.', price: 310, emoji: '🎩', size: '100 مل', stock: 15, tags: ['عطر'], categorySlug: 'fragrance', brandSlug: 'garnier' },

  // حفاضات ومنتجات الرضاعة
  { name: 'حفاضات تشيكو لجميع الأعمار - علبة 40', slug: 'chicco-diapers-40', description: 'حفاضات ناعمة على بشرة طفلك مع امتصاص فائق حتى 12 ساعة وحماية من التسريب.', price: 285, oldPrice: 330, emoji: '🍼', images: [IMG.baby], size: '40 حفاض', stock: 26, tags: ['حفاضات'], categorySlug: 'diapers-feeding', brandSlug: 'chicco' },
  { name: 'زجاجة رضاعة أفنت طبيعية - 260 مل', slug: 'avent-bottle-260', description: 'زجاجة رضاعة بزبدة تشبه شكل الثدي لتقليل انزعاج الطفل، خالية من BPA.', price: 210, emoji: '🍼', stock: 24, tags: ['رضاعة'], categorySlug: 'diapers-feeding', brandSlug: 'avent' },
  { name: 'حليب أطفال نان مرحلة 2 - 400 جم', slug: 'nan-stage2-400', description: 'حليب متابعة مخصص للأطفال من 6-12 شهرًا مدعم بالبروبيوتيك والفيتامينات.', price: 240, emoji: '🥛', size: '400 جم', stock: 5, tags: ['حليب'], categorySlug: 'diapers-feeding' },

  // عناية بالطفل
  { name: 'شامبو جونسون للأطفال - 500 مل', slug: 'johnsons-shampoo-500', description: 'شامبو لطيف لا يبكي العين بتركيبة مناسبة لشعر الأطفال الرقيق، رقم 1 بوصفة الأمهات.', price: 165, emoji: '👶', images: [IMG.baby, IMG.main], size: '500 مل', stock: 40, tags: ['شامبو', 'أطفال'], bundleOffer: true, categorySlug: 'baby-care', brandSlug: 'johnsons' },
  { name: 'كريم جونسون للطفل بزيوت طبيعية - 200 مل', slug: 'johnsons-cream-200', description: 'كريم مرطب لطيف ل بشرة طفلك الحساسة مع 24 ساعة ترطيب مستمر.', price: 130, emoji: '🧴', size: '200 مل', stock: 34, tags: ['مرطب', 'أطفال'], categorySlug: 'baby-care', brandSlug: 'johnsons' },
  { name: 'منديل مبلل للأطفال - علبة 72', slug: 'baby-wipes-72', description: 'مناديل مبللة بحليب اللوز بدون كحول أو عطور، آمنة على بشرة الوجه واليدين.', price: 68, emoji: '🧷', stock: 60, tags: ['مناديل'], categorySlug: 'baby-care', brandSlug: 'chicco' },
  { name: 'كريم تغيير الحفاض بيوديرما - 100 مل', slug: 'bioderma-baby-100', description: 'كريم حماية لمنطقة الحفاض يعالج الاحمرار والتهيج ويحمي من الرطوبة.', price: 290, emoji: '🧸', images: [IMG.baby], size: '100 مل', stock: 18, tags: ['حفاض', 'حماية'], categorySlug: 'baby-care', brandSlug: 'bioderma' },

  // مستلزمات الأم
  { name: 'كريم ضد تشققات الحمل - 250 مل', slug: 'stretch-mark-250', description: 'كريم غني بزبدة الشيا وفيتامين E لتحفيز مرونة البشرة ومنع التشققات أثناء الحمل.', price: 230, oldPrice: 280, emoji: '🤰', size: '250 مل', stock: 16, tags: ['حمل', 'مرونة'], categorySlug: 'mom-essentials' },
  { name: 'خرزات حمل وفيتامينات - 30 قرص', slug: 'prenatal-30', description: 'مكمل غذائي متكامل للحوامل يحتوي جميع الفيتامينات والمعادن الأساسية لنمو الجنين.', price: 180, emoji: '💊', size: '30 قرص', stock: 22, tags: ['حمل'], categorySlug: 'mom-essentials' },

  // أجهزة قياس الضغط
  { name: 'جهاز أومرون قياس ضغط M2 - ذراعي', slug: 'omron-m2', description: 'جهاز قياس ضغط دم إلكتروني ذراعي من أومرون بشاشة كبيرة وذاكرة 30 قياسًا وضمان 3 سنوات.', price: 1450, oldPrice: 1700, emoji: '🩺', stock: 12, tags: ['ضغط', 'أومرون'], categorySlug: 'bp-monitors', brandSlug: 'omron' },
  { name: 'جهاز أومرون ميموري M6 كونفورت', slug: 'omron-m6', description: 'جهاز ضغط متقدم بتقنية IntelliSense واكتشاف عدم انتظام ضربات القلب مع حقيبة حفظ.', price: 2350, emoji: '🫀', stock: 6, tags: ['ضغط'], categorySlug: 'bp-monitors', brandSlug: 'omron' },

  // أجهزة السكري
  { name: 'جهاز قياس سكر أكيوتشيك - كامل', slug: 'accu-chek-kit', description: 'جهاز قياس سكر الدم مع قلم وخز و10 شرائح مجانية، نتائج دقيقة خلال 5 ثوانٍ.', price: 950, emoji: '🩸', stock: 14, tags: ['سكر'], categorySlug: 'diabetes-care' },
  { name: 'شرائح قياس سكر - علبة 50', slug: 'strips-50', description: 'شرائح قياس سكر أصلية متوافقة مع الأجهزة الشائعة، علبة 50 شريحة.', price: 260, emoji: '🧾', stock: 8, tags: ['شرائح', 'سكر'], categorySlug: 'diabetes-care' },
  { name: 'إبر قلم الأنسولين - علبة 100', slug: 'pen-needles-100', description: 'إبر رفيعة للقلم الأنسولين بحقنة سلسة وخالية من الألم لأقصى راحة.', price: 180, emoji: '💉', stock: 30, tags: ['أنسولين'], categorySlug: 'diabetes-care' },

  // موازين وأجهزة
  { name: 'ميزان شخصي رقمي زجاجي', slug: 'digital-scale-glass', description: 'ميزان وزن رقمي بسطح زجاجي مقاوم للانزلاق وشاشة LED دقة 100 جرام حتى 180 كجم.', price: 520, emoji: '⚖️', stock: 15, tags: ['ميزان'], categorySlug: 'scales-monitors' },
  { name: 'نباض إصبع أوكسيمتر', slug: 'pulse-oximeter', description: 'جهاز قياس نسبة الأكسجين في الدم ونبضات القلب من الإصبع، شاشة OLED واضحة.', price: 430, oldPrice: 520, emoji: '🫁', stock: 20, tags: ['أكسجين'], categorySlug: 'scales-monitors' },

  // نظافة شخصية
  { name: 'صابون سيف طبي - 120 جم', slug: 'safeguard-120', description: 'صابون طبي مضاد للبكتيريا يحمي العائلة من الجراثيم مع رائحة منعشة تدوم.', price: 28, emoji: '🧼', stock: 110, tags: ['صابون'], categorySlug: 'hygiene', brandSlug: 'johnsons' },
  { name: 'جل معقم أيدي - 250 مل', slug: 'hand-sanitizer-250', description: 'معقم أيدي بكحول 70% يقتل 99.9% من الجراثيم دون ماء، غير مجفف للبشرة.', price: 55, emoji: '🧴', stock: 70, tags: ['معقم'], bundleOffer: true, categorySlug: 'hygiene' },
  { name: 'شفرات نيش للاستحمام - 5 قطع', slug: 'razors-5', description: 'شفرات استحمام بحركة انزلاق سلسة وضبط مرن يمنحك حلاقة مريحة بدون جروح.', price: 145, emoji: '🪒', stock: 25, tags: ['حلاقة'], categorySlug: 'hygiene', brandSlug: 'nivea' },

  // عناية بالرجال
  { name: 'رغوة حلاقة نيڤيا للرجال - 200 مل', slug: 'nivea-shaving-200', description: 'رغوة حلاقة كريمية غنية تحمي البشرة من الحرق وتجعل الشفرة تنزلق بسهولة.', price: 120, emoji: '🧔', size: '200 مل', stock: 32, tags: ['حلاقة'], categorySlug: 'men-care', brandSlug: 'nivea' },
  { name: 'ديودرانت نيڤيا للرجال - 150 مل', slug: 'nivea-deo-150', description: 'مزيل عرق رجالي بحماية 48 ساعة ضد العرق والروائح مع عناية بالبشرة.', price: 98, emoji: '🧴', size: '150 مل', stock: 44, tags: ['مزيل عرق'], categorySlug: 'men-care', brandSlug: 'nivea' },
  { name: 'غسول وجه للرجال بالفحم - 150 مل', slug: 'men-charcoal-wash-150', description: 'غسول بالفحم المنشط ينقي مسامات الرجال ويزيل الزيوت الزائدة بعد يوم طويل.', price: 175, oldPrice: 210, emoji: '🖤', skinType: 'oily', size: '150 مل', stock: 21, tags: ['غسول', 'فحم'], categorySlug: 'men-care' },

  // تغذية رياضية
  { name: 'واي بروتين كونسنترات - 2 كجم', slug: 'whey-protein-2kg', description: 'واي بروتين عالي الجودة 24 جم بروتين لكل سكوب لبناء العضلات والتعافي بعد التمرين.', price: 2450, oldPrice: 2800, emoji: '💪', size: '2 كجم', stock: 10, tags: ['بروتين'], bundleOffer: true, categorySlug: 'sports-nutrition' },
  { name: 'كرياتين مونوهيدرات - 300 جم', slug: 'creatine-300', description: 'كرياتين نقي 100% لزيادة القوة والأداء الرياضي، يذوب بسرعة ولا طعم له.', price: 580, emoji: '⚡', size: '300 جم', stock: 13, tags: ['كرياتين'], categorySlug: 'sports-nutrition' },

  // أطعمة صحية
  { name: 'عسل طبيعي جبلي - 500 جم', slug: 'mountain-honey-500', description: 'عسل جبلي طبيعي 100% غير مصفى، غني بمضادات الأكسدة ومنقّى بالطريقة التقليدية.', price: 340, emoji: '🍯', size: '500 جم', stock: 17, tags: ['عسل'], categorySlug: 'health-food' },
  { name: 'شوفان كامل - 1 كجم', slug: 'oats-1kg', description: 'شوفان كامل الحبة غني بالألياف يمنحك طاقة تدوم طول اليوم ويدعم صحة القلب.', price: 95, emoji: '🥣', size: '1 كجم', stock: 55, tags: ['شوفان', 'ألياف'], categorySlug: 'health-food' },
  { name: 'زيت زيتون بكر - 750 مل', slug: 'olive-oil-750', description: 'زيت زيتون بكر ممتاز معصور على البارد بمذاق أصيل وفوائد صحية مثبتة.', price: 410, oldPrice: 470, emoji: '🫒', size: '750 مل', stock: 23, tags: ['زيت زيتون'], categorySlug: 'health-food' },
  { name: 'مكسرات مشكلة نيئة - 400 جم', slug: 'mixed-nuts-400', description: 'مزيج لذيذ من اللوز والجوز والكاجو والبندق، نيء وغير مملح وغني بالدهون الصحية.', price: 490, emoji: '🥜', size: '400 جم', stock: 7, tags: ['مكسرات'], categorySlug: 'health-food' },
]

// ─────────────────────────── Promo codes ───────────────────────────
const PROMOS = [
  { code: 'WELCOME10', type: 'percent', value: 10, minTotal: 200, active: true },
  { code: 'SAVE50', type: 'fixed', value: 50, minTotal: 500, active: true },
  { code: 'PHARMA15', type: 'percent', value: 15, minTotal: 300, active: true },
]

// ─────────────────────────── Site settings ───────────────────────────
const SETTINGS: { key: string; value: string }[] = [
  { key: 'shipping_same_day', value: '35' },
  { key: 'shipping_super_saver', value: '25' },
  { key: 'shipping_governorates', value: '45' },
  { key: 'free_shipping_threshold', value: '600' },
  { key: 'support_phone', value: '19980' },
  { key: 'hero_title', value: 'صحتك أمانة عندنا' },
  { key: 'hero_subtitle', value: 'كل ما تحتاجه من أدوية ومنتجات العناية والتجميل يوصلك لباب البيت — منتجات أصلية 100% من صيدليات د. وليد التهان' },
  { key: 'support_hours', value: 'الدعم متاح من 10 صباحًا حتى 6 مساءً' },
]

async function main() {
  console.log('🌱 Seeding pharmacy database…')

  // Admin — الباسورد مش متخزن نصيًا هنا (hash بس) عشان الكود يتقدر يتنشر على GitHub بأمان.
  // الباسورد الفعلي عند صاحب المنصة — ولو عايز تغيّره:
  //   echo -n 'الباسورد-الجديد' | sha256sum  →  حط الناتج في PHARMACY_ADMIN_HASH أو بدّل الثابت تحت
  const adminEmail = 'admin.9f3k2@eltahanpharmacy.com'
  const adminPasswordHash =
    process.env.PHARMACY_ADMIN_HASH || '44e32a847fd15ab54e525940ce7ac57baf8e3fdee84ee7f9ae567739463db91d'
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminPasswordHash },
    create: { email: adminEmail, passwordHash: adminPasswordHash },
  })
  console.log('✓ Admin user ready')

  // Brands
  const brandMap = new Map<string, string>()
  for (const b of BRANDS) {
    const brand = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: { name: b.name, color: b.color, featured: b.featured },
      create: b,
    })
    brandMap.set(b.slug, brand.id)
  }
  console.log(`✓ ${BRANDS.length} brands`)

  // Categories
  const catMap = new Map<string, string>()
  for (const c of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, group: c.group, emoji: c.emoji, sortOrder: c.sortOrder },
      create: c,
    })
    catMap.set(c.slug, cat.id)
  }
  console.log(`✓ ${CATEGORIES.length} categories`)

  // Products
  let productCount = 0
  for (const p of PRODUCTS) {
    const categoryId = catMap.get(p.categorySlug)
    if (!categoryId) throw new Error(`Missing category ${p.categorySlug}`)
    const data = {
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      oldPrice: p.oldPrice ?? null,
      emoji: p.emoji,
      // undefined = سيب الصور زي ما هي (الرفع من الأدمن ما يتشالش عند إعادة الـ seed)
      // عند الإنشاء بس: منتج من غير صورة بياخد صورة فئته الافتراضية
      images: p.images ? JSON.stringify(p.images) : undefined,
      skinType: p.skinType ?? null,
      size: p.size ?? null,
      stock: p.stock,
      tags: JSON.stringify(p.tags),
      bundleOffer: p.bundleOffer ?? false,
      active: true,
      categoryId,
      brandId: p.brandSlug ? brandMap.get(p.brandSlug) ?? null : null,
    }
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: data,
      create: {
        ...data,
        images: p.images
          ? JSON.stringify(p.images)
          : CATEGORY_IMAGES[p.categorySlug]
            ? JSON.stringify([CATEGORY_IMAGES[p.categorySlug]])
            : undefined,
      },
    })
    productCount++
  }
  console.log(`✓ ${productCount} products`)

  // Promos
  for (const pr of PROMOS) {
    await prisma.promoCode.upsert({ where: { code: pr.code }, update: pr, create: pr })
  }
  console.log(`✓ ${PROMOS.length} promo codes`)

  // Settings
  for (const s of SETTINGS) {
    await prisma.siteSetting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s })
  }
  console.log(`✓ ${SETTINGS.length} site settings`)

  console.log('🎉 Seed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
