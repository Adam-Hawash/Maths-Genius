/**
 * Seed data for Dr. Walid El-Tahan Pharmacy
 * Run: bun run db:push && bun run scripts/seed.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/* ---------------------------------- Brands --------------------------------- */
const brands = [
  { slug: "la-roche-posay", name: "La Roche-Posay", nameAr: "لاروش بوزيه", color: "#0B5FA5", country: "France" },
  { slug: "cerave", name: "CeraVe", nameAr: "سيرا في", color: "#1B3A6B", country: "USA" },
  { slug: "vichy", name: "Vichy", nameAr: "فيشي", color: "#0A4C8B", country: "France" },
  { slug: "the-ordinary", name: "The Ordinary", nameAr: "ذي أوردينري", color: "#111111", country: "Canada" },
  { slug: "bioderma", name: "Bioderma", nameAr: "بيوديرما", color: "#0072BC", country: "France" },
  { slug: "avene", name: "Avène", nameAr: "أفين", color: "#008891", country: "France" },
  { slug: "eucerin", name: "Eucerin", nameAr: "يوسيرين", color: "#005BA9", country: "Germany" },
  { slug: "garnier", name: "Garnier", nameAr: "جارنييه", color: "#00A650", country: "France" },
  { slug: "loreal", name: "L'Oréal Paris", nameAr: "لوريال باريس", color: "#000000", country: "France" },
  { slug: "maybelline", name: "Maybelline", nameAr: "ميبيلين", color: "#D6006E", country: "USA" },
  { slug: "nivea", name: "Nivea", nameAr: "نيڤيا", color: "#003DA5", country: "Germany" },
  { slug: "johnsons", name: "Johnson's", nameAr: "جونسون", color: "#CE011F", country: "USA" },
  { slug: "pampers", name: "Pampers", nameAr: "بامبرز", color: "#00AEEF", country: "USA" },
  { slug: "centrum", name: "Centrum", nameAr: "سنترم", color: "#8B1E3F", country: "USA" },
  { slug: "omron", name: "Omron", nameAr: "أومرون", color: "#0B75B2", country: "Japan" },
  { slug: "sensodyne", name: "Sensodyne", nameAr: "سنسوداين", color: "#E4002B", country: "UK" },
  { slug: "cosrx", name: "COSRX", nameAr: "كورسكس", color: "#1A1A1A", country: "Korea" },
  { slug: "beauty-of-joseon", name: "Beauty of Joseon", nameAr: "بيوتي أوف جوسون", color: "#7C5A3C", country: "Korea" },
  { slug: "lattafa", name: "Lattafa", nameAr: "لطافة", color: "#8E6B23", country: "UAE" },
  { slug: "armaf", name: "Armaf", nameAr: "أرماف", color: "#B8860B", country: "UAE" },
  { slug: "evapharma", name: "Eva Pharma", nameAr: "إيفا فارما", color: "#0E7490", country: "Egypt" },
  { slug: "yankee-candle", name: "Yankee Candle", nameAr: "يانكي كاندل", color: "#5D4037", country: "USA" },
  { slug: "sanita", name: "Sanita", nameAr: "سانيتا", color: "#F26522", country: "Egypt" },
];

/* -------------------------------- Categories ------------------------------- */
const categories = [
  // Health & Wellness
  { slug: "skin-care", nameAr: "العناية بالبشرة", nameEn: "Skin Care", group: "health", icon: "Droplets", sort: 1 },
  { slug: "hair-care", nameAr: "العناية بالشعر", nameEn: "Hair Care", group: "health", icon: "Scissors", sort: 2 },
  { slug: "bath-body", nameAr: "العناية بالجسم", nameEn: "Bath & Body", group: "health", icon: "Bath", sort: 3 },
  { slug: "oral-care", nameAr: "العناية بالفم والأسنان", nameEn: "Oral Care", group: "health", icon: "Smile", sort: 4 },
  { slug: "eye-care", nameAr: "العناية بالعين", nameEn: "Eye Care", group: "health", icon: "Eye", sort: 5 },
  { slug: "personal-care", nameAr: "العناية الشخصية", nameEn: "Personal Care", group: "health", icon: "Sparkles", sort: 6 },
  { slug: "vitamins", nameAr: "فيتامينات ومكملات", nameEn: "Vitamins & Supplements", group: "health", icon: "Pill", sort: 7 },
  { slug: "devices", nameAr: "أجهزة طبية", nameEn: "Medical Devices", group: "health", icon: "Stethoscope", sort: 8 },
  // Beauty & Cosmetics
  { slug: "perfumes", nameAr: "عطور وفراجرانس", nameEn: "Perfumes & Fragrances", group: "beauty", icon: "Flower2", sort: 9 },
  { slug: "makeup-face", nameAr: "مكياج الوجه", nameEn: "Face Makeup", group: "beauty", icon: "Palette", sort: 10 },
  { slug: "makeup-lips", nameAr: "مكياج الشفاه", nameEn: "Lips Makeup", group: "beauty", icon: "Heart", sort: 11 },
  { slug: "makeup-eyes", nameAr: "مكياج العيون", nameEn: "Eye Makeup", group: "beauty", icon: "Eye", sort: 12 },
  { slug: "beauty-tools", nameAr: "أدوات التجميل", nameEn: "Beauty Tools", group: "beauty", icon: "Brush", sort: 13 },
  // Mother & Baby
  { slug: "nursing", nameAr: "الرضاعة الطبيعية", nameEn: "Nursing", group: "baby", icon: "Baby", sort: 14 },
  { slug: "feeding", nameAr: "تغذية الأطفال", nameEn: "Feeding", group: "baby", icon: "Milk", sort: 15 },
  { slug: "baby-gear", nameAr: "مستلزمات الأطفال", nameEn: "Baby Gear", group: "baby", icon: "Car", sort: 16 },
  { slug: "baby-skincare", nameAr: "عناية ببشرة الطفل", nameEn: "Baby Skincare", group: "baby", icon: "Baby", sort: 17 },
  { slug: "diapering", nameAr: "الحفاضات", nameEn: "Diapering", group: "baby", icon: "Package", sort: 18 },
  // Specialized
  { slug: "k-beauty", nameAr: "منتجات K-Beauty", nameEn: "K-Beauty", group: "special", icon: "Star", sort: 19 },
  { slug: "dermocosmetics", nameAr: "ديرمو كوزمتكس", nameEn: "Dermocosmetics", group: "special", icon: "FlaskConical", sort: 20 },
  { slug: "home-scents", nameAr: "روائح المنزل", nameEn: "Home Scents", group: "special", icon: "Flame", sort: 21 },
];

/* --------------------------------- Products -------------------------------- */
type Seed = {
  slug: string; nameAr: string; nameEn: string; descAr: string; descEn: string;
  price: number; compareAtPrice?: number; brand: string; category: string;
  skinType?: string; size?: string; rating?: number; reviewsCount?: number;
  featured?: boolean; isNew?: boolean; stock?: number;
};

const products: Seed[] = [
  // ---------------- Dermocosmetics + Skin care ----------------
  { slug: "lrp-effaclar-gel", nameAr: "لاروش بوزيه إيفاكلار جل منظف للبشرة الدهنية 400مل", nameEn: "La Roche-Posay Effaclar Purifying Gel 400ml", descAr: "جل منظف لطيف ينظف البشرة الدهنية والمعرضة لحب الشباب بعمق دون جفاف، يحترم توازن البشرة ويقلل اللمعان الزائد.", descEn: "A gentle purifying gel that deeply cleanses oily, acne-prone skin without drying, reduces excess shine.", price: 545, compareAtPrice: 650, brand: "la-roche-posay", category: "dermocosmetics", skinType: "دهنية", size: "400ml", rating: 4.8, reviewsCount: 214, featured: true },
  { slug: "lrp-anthelios-uvmune", nameAr: "لاروش بوزيه أنثيليوس UVmune واقي شمس SPF50+ 50مل", nameEn: "La Roche-Posay Anthelios UVmune 400 SPF50+ 50ml", descAr: "حماية عالية جدًا من الأشعة فوق البنفسجية UVB وUVA الطويلة، مقاوم للماء والعرق، مناسب للبشرة الحساسة.", descEn: "Very high UVA/UVB protection, water and sweat resistant, suitable for sensitive skin.", price: 825, compareAtPrice: 950, brand: "la-roche-posay", category: "dermocosmetics", skinType: "حساسة", size: "50ml", rating: 4.9, reviewsCount: 342, featured: true },
  { slug: "lrp-lipikar-baume", nameAr: "لاروش بوزيه لبيكار بالم AP+M مرطب مركز للجسم 400مل", nameEn: "La Roche-Posay Lipikar Baume AP+M 400ml", descAr: "بلسم مرطب مريح للبشرة الجافة جدًا والمتهيجة، يوازن الميكروبيوم ويمنح ترطيب يدوم 48 ساعة لكل العائلة.", descEn: "Soothing body balm for very dry, irritated skin. Balances the skin microbiome with 48h hydration.", price: 690, brand: "la-roche-posay", category: "bath-body", skinType: "جافة", size: "400ml", rating: 4.7, reviewsCount: 156 },
  { slug: "cerave-moisturizing-cream", nameAr: "سيرا في كريم مرطب للوجه والجسم 454 جم", nameEn: "CeraVe Moisturizing Cream 454g", descAr: "كريم مرطب غني بالسيراميدات وحمض الهيالورونيك لترطيب عميق يدوم 24 ساعة للبشرة الجافة جدًا، للوجه والجسم.", descEn: "Rich moisturizing cream with ceramides and hyaluronic acid for 24h deep hydration, face & body.", price: 640, compareAtPrice: 720, brand: "cerave", category: "skin-care", skinType: "جافة", size: "454g", rating: 4.8, reviewsCount: 289, featured: true },
  { slug: "cerave-foaming-cleanser", nameAr: "سيرا في جل رغوي منظف للبشرة العادية للدهنية 236مل", nameEn: "CeraVe Foaming Cleanser 236ml", descAr: "منظف رغوي يومي يزيل الزيوت والأوساخ دون الإخلال بحاجز البشرة الواقي، بالسيراميدات والنياسيناميد.", descEn: "Daily foaming cleanser that removes oil and dirt without disrupting the skin barrier.", price: 445, brand: "cerave", category: "skin-care", skinType: "دهنية", size: "236ml", rating: 4.7, reviewsCount: 198 },
  { slug: "cerave-sa-smoothing", nameAr: "سيرا في كريم تقشير SA للبشرة الخشنة 177مل", nameEn: "CeraVe SA Smoothing Cream 177ml", descAr: "كريم بحمض الساليسيليك لتقشير البشرة الخشنة والمناطق الخشنة على الجسم، ينعّم ويصفّي الملمس.", descEn: "Salicylic acid cream that smooths rough, bumpy skin texture on the body.", price: 520, brand: "cerave", category: "skin-care", skinType: "مختلطة", size: "177ml", rating: 4.6, reviewsCount: 87, isNew: true },
  { slug: "vichy-mineral-89", nameAr: "فيشي مينيرال 89 مقوي ومكثف مرطب 50مل", nameEn: "Vichy Minéral 89 Booster 50ml", descAr: "بوستر يومي بـ 89% مياه بركانية فيشي غنية بالمعادن، يقوي حاجز البشرة ويمنحها امتلاءً وترطيبًا فوريًا.", descEn: "Daily booster with 89% Vichy volcanic water. Strengthens skin barrier with instant plumpness.", price: 745, compareAtPrice: 850, brand: "vichy", category: "dermocosmetics", skinType: "عادية", size: "50ml", rating: 4.8, reviewsCount: 231, featured: true },
  { slug: "ordinary-niacinamide", nameAr: "ذي أوردينري نياسيناميد 10% + زنك 1% سيروم 30مل", nameEn: "The Ordinary Niacinamide 10% + Zinc 1% 30ml", descAr: "سيروم مركّز يقلل ظهور المسامات وعيوب البشرة ويوازن إفراز الدهون، مناسب للبشرة الدهنية والمعرضة للحبوب.", descEn: "Targeted serum that reduces the look of blemishes and congestion, balances oil.", price: 490, brand: "the-ordinary", category: "skin-care", skinType: "دهنية", size: "30ml", rating: 4.6, reviewsCount: 402, featured: true },
  { slug: "ordinary-hyaluronic", nameAr: "ذي أوردينري حمض الهيالورونيك 2% + B5 سيروم 30مل", nameEn: "The Ordinary Hyaluronic Acid 2% + B5 30ml", descAr: "ترطيب عميق متعدد المستويات بحمض الهيالورونيك النقي وفيتامين B5 لبشرة ممتلئة ونضرة.", descEn: "Multi-depth hydration with pure hyaluronic acid and vitamin B5 for plump, dewy skin.", price: 530, brand: "the-ordinary", category: "skin-care", size: "30ml", skinType: "جافة", rating: 4.7, reviewsCount: 356 },
  { slug: "ordinary-glycolic-toner", nameAr: "ذي أوردينري تونر حمض الجلايكوليك 7% 240مل", nameEn: "The Ordinary Glycolic Acid 7% Toning Solution 240ml", descAr: "تونر مقشر لطيف يمنح البشرة إشراقة وتوحيدًا في اللون مع استخدام منتظم، يقلل ظهور البقع الداكنة.", descEn: "Mild exfoliating toner for brighter, more even complexion and reduced dark spots.", price: 580, compareAtPrice: 660, brand: "the-ordinary", category: "skin-care", skinType: "مختلطة", size: "240ml", rating: 4.5, reviewsCount: 178 },
  { slug: "bioderma-sensibio-h2o", nameAr: "بيوديرما سنسبيو H2O ماء ميسيلار 500مل", nameEn: "Bioderma Sensibio H2O Micellar Water 500ml", descAr: "ماء ميسيلار مينزّل المكياج وينظف البشرة الحساسة بلطف دون شطف، الرقم 1 عالميًا للبشرة الحساسة.", descEn: "The world's No.1 micellar water for sensitive skin. Removes makeup gently, no rinse needed.", price: 585, brand: "bioderma", category: "dermocosmetics", skinType: "حساسة", size: "500ml", rating: 4.8, reviewsCount: 267, featured: true },
  { slug: "avene-tolerance-hydra10", nameAr: "أفين توليرانس هيدرا-10 كريم مرطب للبشرة شديدة الحساسية 40مل", nameEn: "Avène Tolérance Hydra-10 Cream 40ml", descAr: "كريم مرطب بمكونات أساسية فقط لبشرة شديدة الحساسية وأيضًا الأرجية، بأقل مكونات وأقصى تحمل.", descEn: "Minimalist moisturizer for highly sensitive and allergy-prone skin. Fragrance-free.", price: 655, brand: "avene", category: "dermocosmetics", skinType: "حساسة", size: "40ml", rating: 4.6, reviewsCount: 92 },
  { slug: "eucerin-sun-oil-control", nameAr: "يوسيرين صن أويل كونترول جل كريم SPF50+ 50مل", nameEn: "Eucerin Sun Oil Control Gel-Cream SPF50+ 50ml", descAr: "واقي شمس بلمسة مطفية للبشرة الدهنية المعرضة لحب الشباب، يتحكم في اللمعان حتى 8 ساعات.", descEn: "Matte-finish sunscreen for oily, blemish-prone skin. Controls shine for up to 8 hours.", price: 730, brand: "eucerin", category: "dermocosmetics", skinType: "دهنية", size: "50ml", rating: 4.7, reviewsCount: 143 },
  { slug: "nivea-soft-cream", nameAr: "نيڤيا سوفت كريم مرطب خفيف للوجه والجسم 200مل", nameEn: "Nivea Soft Moisturizing Cream 200ml", descAr: "كريم خفيف سريع الامتصاص بفيتامين E وجوجوجا، ترطيب يومي منعش للوجه والجسم واليدين.", descEn: "Light, fast-absorbing cream with vitamin E and jojoba for everyday freshness.", price: 185, brand: "nivea", category: "skin-care", skinType: "عادية", size: "200ml", rating: 4.5, reviewsCount: 512 },

  // ---------------- Hair care ----------------
  { slug: "vichy-dercos-density", nameAr: "فيشي ديركوس تكنيك شامبو كثافة الشعر 400مل", nameEn: "Vichy Dercos Technique Density Shampoo 400ml", descAr: "شامبو يكثف الشعر ويقلل التساقط مع الاستخدام المنتظم، غني بالأمينوكسيدل والفيتامينات B وPP.", descEn: "Hair-density shampoo that reduces hair fall with regular use. Enriched with aminexil & vitamins.", price: 665, brand: "vichy", category: "hair-care", size: "400ml", rating: 4.5, reviewsCount: 121 },
  { slug: "garnier-fructis-hair-food", nameAr: "جارنييه فروكتيس هير فود قناع تغذية للشعر التالف", nameEn: "Garnier Fructis Hair Food Nourishing Mask 390ml", descAr: "قناع تغذية مكثف 3 في 1 (قناع/بلسم/تركه) للشعر الجاف والمتقصف، بخلاصة الأفوكادو وزيت الزيتون.", descEn: "3-in-1 intensive nourishing hair mask/conditioner for dry hair with avocado & olive oil.", price: 175, compareAtPrice: 210, brand: "garnier", category: "hair-care", size: "390ml", rating: 4.6, reviewsCount: 329 },
  { slug: "loreal-elvive-total-repair", nameAr: "لوريال إلفيف تول ريبير 5 شامبو إصلاح الشعر التالف 600مل", nameEn: "L'Oréal Elvive Total Repair 5 Shampoo 600ml", descAr: "يصلح مشاكل الشعر التالف الخمسة: التقصّف، الجفاف، الهيشان، الخشونة والضعف، مع كيراميدات وبروتين.", descEn: "Repairs the 5 signs of damaged hair: breakage, dryness, dullness, roughness & split ends.", price: 265, brand: "loreal", category: "hair-care", size: "600ml", rating: 4.5, reviewsCount: 244 },

  // ---------------- Oral care ----------------
  { slug: "sensodyne-pronamel", nameAr: "سنسوداين بروناميل معجونة تقوي مينا الأسنان 75مل", nameEn: "Sensodyne Pronamel Toothpaste 75ml", descAr: "معجونة يومية تحمي مينا الأسنان من تآكل الأحماض وتخفف حساسية الأسنان مع الاستخدام المنتظم.", descEn: "Daily toothpaste that protects enamel from acid erosion and relieves tooth sensitivity.", price: 215, brand: "sensodyne", category: "oral-care", size: "75ml", rating: 4.7, reviewsCount: 189 },
  { slug: "parodontax-herbal", nameAr: "بارودونتاكس معجونة عشبية لنزيف اللثة 75مل", nameEn: "Parodontax Herbal Toothpaste 75ml", descAr: "معجونة متخصصة في علاج ونزيف اللثة مع مزيج من 7 مستخلصات عشبية، تعمل على صحة اللثة والأسنان.", descEn: "Specialist toothpaste for bleeding gums with a blend of 7 herbal extracts.", price: 195, brand: "sensodyne", category: "oral-care", size: "75ml", rating: 4.6, reviewsCount: 97 },

  // ---------------- Eye care ----------------
  { slug: "systane-ultra-drops", nameAr: "سيستين ألترا قطرات ترطيب للعين الجافة 10مل", nameEn: "Systane Ultra Lubricant Eye Drops 10ml", descAr: "قطرات مرطبة سريعة Relief لجفاف العين والتهيج، آمنة مع العدسات اللاصقة.", descEn: "Fast-acting lubricant drops for dry eye relief. Safe to use with contact lenses.", price: 245, brand: "evapharma", category: "eye-care", size: "10ml", rating: 4.7, reviewsCount: 76 },

  // ---------------- Personal care ----------------
  { slug: "nivea-men-deodorant", nameAr: "نيڤيا مين مزيل عرق رول أون حماية 48 ساعة 50مل", nameEn: "Nivea Men Roll-On Deodorant 48h 50ml", descAr: "حماية فعالة من العرق والرائحة لمدة 48 ساعة، لطيف على البشرة ولا يترك آثارًا على الملابس.", descEn: "48h effective protection against sweat and odor, gentle on skin, no white marks.", price: 125, brand: "nivea", category: "personal-care", size: "50ml", rating: 4.5, reviewsCount: 265 },
  { slug: "sanita-wet-wipes", nameAr: "سانيتا مناديل مبللة بألوفيرا 3 عبوات", nameEn: "Sanita Wet Wipes with Aloe Vera 3 Packs", descAr: "مناديل مبللة ناعمة بخلاصة الألوفيرا للنظافة اليومية للعائلة، خالية من الكحول.", descEn: "Soft wet wipes with aloe vera for the whole family's daily hygiene. Alcohol-free.", price: 65, brand: "sanita", category: "personal-care", size: "3x60", rating: 4.4, reviewsCount: 143 },

  // ---------------- Vitamins ----------------
  { slug: "centrum-adults", nameAr: "سنترم للبالغين أقراص متعددة الفيتامينات 60 قرص", nameEn: "Centrum Adults Multivitamin 60 Tablets", descAr: "فيتامينات ومعادن أساسية متكاملة لدعم المناعة والطاقة والصحة العامة للبالغين، 23 عنصرًا غذائيًا.", descEn: "Complete multivitamin with 23 nutrients supporting immunity, energy & overall health.", price: 465, compareAtPrice: 520, brand: "centrum", category: "vitamins", size: "60 tabs", rating: 4.8, reviewsCount: 318, featured: true },
  { slug: "centrum-kids", nameAr: "سنترم كيدز جولي فيتامينات للأطفال 30 قرص", nameEn: "Centrum Kids Chewables 30 Tablets", descAr: "فيتامينات مضغوطة بطعم لذيذ تدعم نمو الأطفال ومناعتهم وشدهم للتركيز.", descEn: "Great-tasting chewable multivitamins supporting children's growth, immunity & focus.", price: 355, brand: "centrum", category: "vitamins", size: "30 tabs", rating: 4.7, reviewsCount: 167 },
  { slug: "eva-vitamin-c-1000", nameAr: "إيفا فيتامين سي 1000 ملجم فو برونيس 20 قرص فوار", nameEn: "Eva Vitamin C 1000mg Effervescent 20 Tablets", descAr: "فيتامين سي فوار بنكهة البرتقال لدعم المناعة ومضاد أكسدة قوي، امتصاص سريع.", descEn: "Orange-flavored effervescent vitamin C for immune support. Fast absorption.", price: 95, brand: "evapharma", category: "vitamins", size: "20 tabs", rating: 4.6, reviewsCount: 421, isNew: true },
  { slug: "eva-collagen-cream", nameAr: "إيفا كولاجين كريم للعناية بالبشرة 100مل", nameEn: "Eva Collagen Skin Care Cream 100ml", descAr: "كريم مرطب بالكولاجين وفيتامين E يجدد نضارة البشرة ويحسن مرونتها، مناسب للاستخدام اليومي.", descEn: "Collagen & vitamin E moisturizing cream that renews radiance and improves elasticity.", price: 130, brand: "evapharma", category: "skin-care", skinType: "عادية", size: "100ml", rating: 4.4, reviewsCount: 356 },

  // ---------------- Devices ----------------
  { slug: "omron-m2-bp", nameAr: "أومرون M2 جهاز قياس ضغط الدم الذراع", nameEn: "Omron M2 Upper Arm Blood Pressure Monitor", descAr: "جهاز قياس ضغط دقيق ومعتمد طبيًا مع كشف النبض غير المنتظم وذاكرة لآخر 30 قراءة.", descEn: "Clinically accurate blood pressure monitor with irregular heartbeat detection and 30-reading memory.", price: 2450, compareAtPrice: 2800, brand: "omron", category: "devices", size: "1 unit", rating: 4.8, reviewsCount: 88, featured: true },
  { slug: "omron-thermometer", nameAr: "أومرون مقياس حرارة رقمي GentleTemp", nameEn: "Omron GentleTemp Digital Thermometer", descAr: "مقياس حرارة رقمي سريع ودقيق مع تنبيه حمى وذاكرة آخر قراءة، آمن للأطفال والبالغين.", descEn: "Fast, accurate digital thermometer with fever alarm and last-reading memory.", price: 385, brand: "omron", category: "devices", rating: 4.6, reviewsCount: 54 },

  // ---------------- Perfumes ----------------
  { slug: "lattafa-yara", nameAr: "لطافة يارا أو دو بارفان للنساء 100مل", nameEn: "Lattafa Yara Eau de Parfum for Women 100ml", descAr: "عطر نسائي ساحر بمزيج التمر والفانيليا والزعفران، ثبات طويل ورائحة شرقية دافئة.", descEn: "Captivating women's fragrance with dates, vanilla and saffron. Long-lasting oriental warmth.", price: 950, compareAtPrice: 1100, brand: "lattafa", category: "perfumes", size: "100ml", rating: 4.8, reviewsCount: 233, featured: true },
  { slug: "armaf-cdn-intense", nameAr: "أرماف كلوب دي نوي إنتنس مان أو دو بارفان 105مل", nameEn: "Armaf Club de Nuit Intense Man EDP 105ml", descAr: "عطر رجالي فخم بنفحات الخشب والحمضيات والتوابل، بديل معروف بعطر عالمي فاخر بثبات ممتاز.", descEn: "Luxurious men's fragrance with woody, citrus and spicy notes. Excellent longevity.", price: 1250, brand: "armaf", category: "perfumes", size: "105ml", rating: 4.7, reviewsCount: 187 },

  // ---------------- Makeup ----------------
  { slug: "maybelline-fit-me", nameAr: "ميبيلين فت مي فاونديشن ماتي + بور 30مل", nameEn: "Maybelline Fit Me Matte + Poreless Foundation 30ml", descAr: "فاونديشن بتركيبة مطفية تناسب البشرة الدهنية، تغطية متوسطة طبيعية تتحمل طول اليوم.", descEn: "Matte, poreless foundation with natural medium coverage that lasts all day.", price: 395, brand: "maybelline", category: "makeup-face", skinType: "دهنية", size: "30ml", rating: 4.6, reviewsCount: 412, featured: true },
  { slug: "maybelline-lash-sensational", nameAr: "ميبيلين لاش سنساشونال ماسكارا تكثيف وتطويل", nameEn: "Maybelline Lash Sensational Mascara", descAr: "ماسكارا بفرشاة مموجة تكثف وتفصل الرموش لمنظر رموش مروحة كثيفة بدون تكتل.", descEn: "Fanning brush mascara that volumizes and separates lashes without clumping.", price: 325, brand: "maybelline", category: "makeup-eyes", size: "9.5ml", rating: 4.7, reviewsCount: 298 },
  { slug: "loreal-infallible-lipstick", nameAr: "لوريال إنفاليبل ليكيب ليپ ستك مات ثبات 12 ساعة", nameEn: "L'Oréal Infallible Matte Liquid Lipstick", descAr: "أحمر شفاه سائل بلمسة مطفية وثبات يدوم حتى 12 ساعة بدون جفاف للشفاه.", descEn: "Matte liquid lipstick with up to 12h wear without drying lips.", price: 365, brand: "loreal", category: "makeup-lips", size: "5ml", rating: 4.5, reviewsCount: 176 },
  { slug: "maybelline-baby-skin", nameAr: "ميبيلين بابي سكين برايمر يقلل المسامات 22مل", nameEn: "Maybelline Baby Skin Pore Eraser Primer 22ml", descAr: "برايمر خفيف يملأ المسامات ويهيئ البشرة لمكياج ناعم يدوم أطول.", descEn: "Lightweight primer that blurs pores and preps skin for longer-lasting makeup.", price: 285, brand: "maybelline", category: "makeup-face", size: "22ml", rating: 4.4, reviewsCount: 154 },

  // ---------------- Beauty tools ----------------
  { slug: "real-techniques-brush-set", nameAr: "ريال تكنيقس طقم فرش مكياج أساسي 5 قطع", nameEn: "Real Techniques Everyday Essentials Brush Set 5pc", descAr: "طقم فرش أساسي بذوات صناعية ناعمة للفوندشن والبودرة والكونتور، مع إسفنجة مكياج.", descEn: "Essential brush set with soft synthetic bristles for foundation, powder & contour, plus a sponge.", price: 685, brand: "evapharma", category: "beauty-tools", rating: 4.6, reviewsCount: 63, isNew: true },
  { slug: "jade-facial-roller", nameAr: "رولر جاد مبرد للوجه لتصفير البشرة", nameEn: "Jade Facial Roller for De-puffing", descAr: "رولر حجر الجاد المبرد لتدليك الوجه وتقليل الانتفاخ وتنشيط الدورة الدموية للإشراقة الطبيعية.", descEn: "Cooling jade roller that de-puffs, boosts circulation and gives natural glow.", price: 240, brand: "evapharma", category: "beauty-tools", rating: 4.3, reviewsCount: 45 },

  // ---------------- Mother & Baby ----------------
  { slug: "pampers-baby-dry-mega", nameAr: "بامبرز بيبي دراي حفاضات علبة عملاقة (حجم 4)", nameEn: "Pampers Baby Dry Diapers Mega Box (Size 4)", descAr: "حفاضات بامبرز بامتصاص فائق وطبقة جافة تصل لـ 12 ساعة، تمنع التسريب وتحافظ على نوم طفلك المريح.", descEn: "Up to 12h of dryness with super-absorbent layers to keep baby comfortable and sleeping well.", price: 1450, compareAtPrice: 1620, brand: "pampers", category: "diapering", size: "Mega 176 pcs", rating: 4.8, reviewsCount: 523, featured: true },
  { slug: "johnsons-baby-shampoo", nameAr: "جونسون شامبو الأطفال لا دموع منه 500مل", nameEn: "Johnson's Baby Shampoo No More Tears 500ml", descAr: "شامبو الأطفال بتركيبة لا تدمع العين، ينظف الشعر الرقيق بلطف ويتركه ناعمًا وقابلًا للتسريح.", descEn: "No More Tears formula gently cleanses baby's fine hair, leaving it soft and easy to comb.", price: 165, brand: "johnsons", category: "baby-skincare", size: "500ml", rating: 4.7, reviewsCount: 389 },
  { slug: "johnsons-baby-lotion", nameAr: "جونسون لوشن الأطفال للترطيب 24 ساعة 500مل", nameEn: "Johnson's Baby Lotion 24h Moisture 500ml", descAr: "لوشن مرطب لطيف يرطب بشرة طفلك لمدة 24 ساعة ويعزز لحظات التدليك والحنان.", descEn: "Gentle moisturizing lotion with 24h hydration, perfect for baby massage time.", price: 175, brand: "johnsons", category: "baby-skincare", size: "500ml", rating: 4.6, reviewsCount: 276 },
  { slug: "philips-avent-bottle", nameAr: "فيليبس أفنت رضاعة مضادة للمغص 260مل", nameEn: "Philips Avent Anti-colic Baby Bottle 260ml", descAr: "زجاجة رضاعة بنظام مضاد للمغص يقلل ابتلاع الهواء، حلمة شكل مطاطية طبية تدفق مناسب.", descEn: "Anti-colic bottle system that reduces air intake with a clinically tested nipple.", price: 480, brand: "evapharma", category: "feeding", size: "260ml", rating: 4.7, reviewsCount: 134 },
  { slug: "medela-nursing-pads", nameAr: "ميديلا فوط الرضاعة الطبيعية الفائقة الامتصاص 30 فوط", nameEn: "Medela Ultra-Absorbent Nursing Pads 30 pcs", descAr: "فوط رضاعة مريحة بأقصى امتصاص تحمي من التسريب وتحافظ على جفاف البشرة طوال الليل.", descEn: "Ultra-absorbent, comfortable nursing pads protecting against leaks day and night.", price: 295, brand: "evapharma", category: "nursing", size: "30 pcs", rating: 4.6, reviewsCount: 78 },
  { slug: "chicco-stroller-toy", nameAr: "شيكو لعبة عربة الأطفال المحمولة النشطة", nameEn: "Chicco Portable Stroller Activity Toy", descAr: "لعبة نشطة مثبتة على عربة الطفل تحفز حاسة اللمس والبصر وتسلّي طفلك في التنقل.", descEn: "Stroller-mounted activity toy stimulating touch and vision to keep baby entertained.", price: 350, brand: "evapharma", category: "baby-gear", rating: 4.4, reviewsCount: 31, isNew: true },

  // ---------------- K-Beauty ----------------
  { slug: "cosrx-snail-essence", nameAr: "كورسكس إيسنس مخاط الحلزون 96% 100مل", nameEn: "COSRX Snail Mucin 96% Essence 100ml", descAr: "إيسنس الكوري الأشهر بـ 96% مخاط الحلزون لترطيب مكثف وتجدد البشرة وتصفير علامات الحبوب.", descEn: "Korea's iconic 96% snail mucin essence for deep hydration, repair and scar fading.", price: 720, compareAtPrice: 800, brand: "cosrx", category: "k-beauty", skinType: "مختلطة", size: "100ml", rating: 4.8, reviewsCount: 344, featured: true },
  { slug: "cosrx-pimple-patch", nameAr: "كورسكس لصقات حب الشباب ماستر باتش (72 لصقة)", nameEn: "COSRX Master Patch Acne Pimple Patch (72 patches)", descAr: "لصقات شفافة لامتصاص صديد الحبوب وحمايتها من البكتيريا، تسرّع الشفاء وتخفي الحبة نهارًا.", descEn: "Transparent hydrocolloid patches that absorb impurities and speed up healing.", price: 245, brand: "cosrx", category: "k-beauty", skinType: "دهنية", size: "72 patches", rating: 4.7, reviewsCount: 298 },
  { slug: "boj-relief-sun", nameAr: "بيوتي أوف جوسون ريليف صن واقي شمس أرز SPF50+ 50مل", nameEn: "Beauty of Joseon Relief Sun Rice SPF50+ 50ml", descAr: "واقي شمس كوري بتركيبة خفيفة كالكريم، لا يترك أثر أبيض، مع الأرز ومستخلص الحبوب لترطيب مريح.", descEn: "Korean chemical sunscreen with a lightweight cream texture, no white cast, rice extract.", price: 560, compareAtPrice: 620, brand: "beauty-of-joseon", category: "k-beauty", skinType: "عادية", size: "50ml", rating: 4.8, reviewsCount: 412, featured: true },
  { slug: "boj-glow-serum", nameAr: "بيوتي أوف جوسون جلو سيروم بتقنية بروبورات نيفيولا", nameEn: "Beauty of Joseon Glow Deep Serum 30ml", descAr: "سيروم إشراقة بمزيج النياسيناميد والأرز لتفتيح البقع وتوحيد لون البشرة بلمعة صحية.", descEn: "Brightening serum with niacinamide and rice for even tone and healthy glow.", price: 545, brand: "beauty-of-joseon", category: "k-beauty", skinType: "مختلطة", size: "30ml", rating: 4.6, reviewsCount: 187, isNew: true },

  // ---------------- Home scents ----------------
  { slug: "yankee-vanilla-candle", nameAr: "يانكي كاندل شمعة معطرة فانيليا كوكي (حرق حتى 150 ساعة)", nameEn: "Yankee Candle Vanilla Cookie Scented Candle (150h)", descAr: "شمعة معطرة برائحة الفانيليا الدافئة، شمع عالي الجودة بحرق متساوٍ حتى 150 ساعة.", descEn: "Premium scented candle with warm vanilla aroma and up to 150 hours of even burn.", price: 850, brand: "yankee-candle", category: "home-scents", size: "623g", rating: 4.7, reviewsCount: 92 },
  { slug: "yankee-reed-diffuser", nameAr: "يانكي ديفيوزر بالعصي لروائح المنزل اللافندر 88مل", nameEn: "Yankee Candle Reed Diffuser Lavender 88ml", descAr: "ديفيوزر بالعصي يمنح منزلك رائحة لافندر مريحة تدوم أسابيع بدون لهب أو كهرباء.", descEn: "Reed diffuser filling your home with relaxing lavender for weeks, flame-free.", price: 690, brand: "yankee-candle", category: "home-scents", size: "88ml", rating: 4.5, reviewsCount: 47 },

  // ---------------- Bath & body extra ----------------
  { slug: "nivea-body-lotion", nameAr: "نيڤيا لوشن الجسم العميق المرطب 400مل", nameEn: "Nivea Nourishing Body Lotion 400ml", descAr: "لوشن غني بزيت اللوز وحديد الهيالورونيك لترطيب عميق 48 ساعة للبشرة الجافة.", descEn: "Rich almond oil & hyaluronic acid lotion for 48h deep moisturization.", price: 175, brand: "nivea", category: "bath-body", skinType: "جافة", size: "400ml", rating: 4.5, reviewsCount: 233 },
  { slug: "loreal-body-expertise", nameAr: "لوريال بادي إكسبرتيز لوشن شد الجسم بالكولاجين 400مل", nameEn: "L'Oréal Body Expertise Collagen Firming Lotion 400ml", descAr: "لوشن مقوي للجسم بالكولاجين يحسن مرونة البشرة وشدّها مع الاستخدام اليومي.", descEn: "Collagen body lotion improving skin firmness and elasticity with daily use.", price: 245, brand: "loreal", category: "bath-body", size: "400ml", rating: 4.4, reviewsCount: 65, isNew: true },
];

/* -------------------------------- Promo codes ------------------------------ */
const promos = [
  { code: "WELCOME15", type: "PERCENT", value: 15, minSubtotal: 0, description: "خصم 15% على طلبك — أهلاً بيك في الصيدلية" },
  { code: "SECOND40", type: "BOGO_SECOND40", value: 40, minSubtotal: 0, description: "اشتري قطعة واحصل على خصم 40% على القطعة التانية" },
  { code: "SAVE50", type: "FIXED", value: 50, minSubtotal: 400, description: "خصم 50 جنيه على الطلبات فوق 400 جنيه" },
  { code: "FREESHIP", type: "FREESHIP", value: 0, minSubtotal: 0, description: "شحن مجاني على طلبك" },
];

async function main() {
  console.log("🧹 Clearing pharmacy data...");
  await db.order.deleteMany();
  await db.promoCode.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
  await db.brand.deleteMany();

  console.log("🏷️ Seeding brands...");
  const brandMap = new Map<string, string>();
  for (const b of brands) {
    const row = await db.brand.create({ data: b });
    brandMap.set(b.slug, row.id);
  }

  console.log("🗂️ Seeding categories...");
  const catMap = new Map<string, string>();
  for (const c of categories) {
    const row = await db.category.create({ data: c });
    catMap.set(c.slug, row.id);
  }

  console.log(`💊 Seeding ${products.length} products...`);
  for (const p of products) {
    await db.product.create({
      data: {
        slug: p.slug,
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        descAr: p.descAr,
        descEn: p.descEn,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        brandId: brandMap.get(p.brand)!,
        categoryId: catMap.get(p.category)!,
        skinType: p.skinType ?? null,
        size: p.size ?? null,
        rating: p.rating ?? 4.5,
        reviewsCount: p.reviewsCount ?? 0,
        stock: p.stock ?? 50,
        featured: p.featured ?? false,
        isNew: p.isNew ?? false,
      },
    });
  }

  console.log("🎟️ Seeding promo codes...");
  for (const pr of promos) {
    await db.promoCode.create({ data: pr });
  }

  const counts = {
    brands: await db.brand.count(),
    categories: await db.category.count(),
    products: await db.product.count(),
    promos: await db.promoCode.count(),
  };
  console.log("✅ Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
