// Z-17-a/b v2: per-file writes + variant anchors for divergent platforms
import fs from 'fs'

const REPOS = ['Maths-Genius', 'Mr-Sherif-ElSayed', 'Mr-Mohamed-Sabry', 'Zicola-Math', 'shaimaa-selim-science', 'mensat-alqaid']
const BASE = '/home/z/repos'

function rep(content, oldS, newS, expected, label, file) {
  const n = content.split(oldS).length - 1
  if (n !== expected) { console.log(`  MISS [${file}] ${label}: found ${n}, expected ${expected}`); return { content, misses: 1 } }
  return { content: content.split(oldS).join(newS), misses: 0 }
}

let totalRep = 0, totalMiss = 0

for (const r of REPOS) {
  console.log(`\n=== ${r} ===`)

  // ---------------- gemini.ts ----------------
  const gp = `${BASE}/${r}/src/lib/gemini.ts`
  let g = fs.readFileSync(gp, 'utf8')
  let gm = 0
  if (!g.includes('(ز17)')) {
    ;({ content: g, misses: gm } = rep(g,
      `  var attemptIndex = 0\n`,
      `  var attemptIndex = 0\n  /* (ز17) ساعة الميزانية: لو الموديلات بتلف ومحدش بيرد بنوقف بدل ما الطالب يستنى كتير */\n  var budgetStart = Date.now()\n  function budgetExceeded(): boolean {\n    return !!opts.budgetMs && (Date.now() - budgetStart) > opts.budgetMs\n  }\n`,
      1, 'E1 budget clock', 'gemini.ts'))
    ;({ content: g, misses: gm } = rep(g,
      `        for (var ki = 0; ki < keys.length; ki++) {\n          attemptIndex++`,
      `        for (var ki = 0; ki < keys.length; ki++) {\n          /* (ز17) الميزانية خلصت؟ اخرج فورًا وسلّم للمحرك التالي (ZAI) */\n          if (budgetExceeded()) return null\n          attemptIndex++`,
      1, 'E2 tryModels check', 'gemini.ts'))
    // E3: two possible signatures (standard vs shaimaa with models param)
    const E3_STD = `export async function streamGemini(opts: {\n  parts: any[]\n  generationConfig?: any\n  timeoutMs?: number\n  thinking?: 'low' | 'off' | 'default'\n  onDelta?: (delta: string) => void\n}): Promise<GeminiResult> {`
    const E3_SHA = `export async function streamGemini(opts: {\n  parts: any[]\n  generationConfig?: any\n  timeoutMs?: number\n  thinking?: 'low' | 'off' | 'default'\n  onDelta?: (delta: string) => void\n  models?: string[]           /* lean chain (18-b): سلسلة قصيرة محددة — من غير اكتشاف */\n}): Promise<GeminiResult> {`
    const E3_NEW_STD = `export async function streamGemini(opts: {\n  parts: any[]\n  generationConfig?: any\n  timeoutMs?: number\n  fastFailFirstMs?: number    // (ز17) مهلة قصيرة للمحاولة الأولى فقط\n  budgetMs?: number           // (ز17) ميزانية كلية قبل التسليم للمحرك الاحتياطي\n  thinking?: 'low' | 'off' | 'default'\n  onDelta?: (delta: string) => void\n}): Promise<GeminiResult> {`
    const E3_NEW_SHA = `export async function streamGemini(opts: {\n  parts: any[]\n  generationConfig?: any\n  timeoutMs?: number\n  fastFailFirstMs?: number    // (ز17) مهلة قصيرة للمحاولة الأولى فقط\n  budgetMs?: number           // (ز17) ميزانية كلية قبل التسليم للمحرك الاحتياطي\n  thinking?: 'low' | 'off' | 'default'\n  onDelta?: (delta: string) => void\n  models?: string[]           /* lean chain (18-b): سلسلة قصيرة محددة — من غير اكتشاف */\n}): Promise<GeminiResult> {`
    if (g.includes(E3_STD)) {
      ;({ content: g, misses: gm } = rep(g, E3_STD, E3_NEW_STD, 1, 'E3 streamGemini sig (std)', 'gemini.ts'))
    } else if (g.includes(E3_SHA)) {
      ;({ content: g, misses: gm } = rep(g, E3_SHA, E3_NEW_SHA, 1, 'E3 streamGemini sig (sha)', 'gemini.ts'))
    } else {
      console.log('  MISS [gemini.ts] E3: no known signature'); gm++
    }
    ;({ content: g, misses: gm } = rep(g,
      `  var thinkingMode = opts.thinking || 'low'\n  var lastError = ''\n  var sawQuota = false`,
      `  var thinkingMode = opts.thinking || 'low'\n  var lastError = ''\n  var sawQuota = false\n  /* (ز17) ساعة الميزانية للستريم — نفس منطق callGemini */\n  var budgetStart = Date.now()\n  function budgetExceeded(): boolean {\n    return !!opts.budgetMs && (Date.now() - budgetStart) > opts.budgetMs\n  }`,
      1, 'E3b stream budget clock', 'gemini.ts'))
    ;({ content: g, misses: gm } = rep(g,
      `      for (var ki = 0; ki < keys.length; ki++) {\n        var result = await streamAttempt(models[mi], keys[ki], opts.parts, generationConfig, timeoutMs, thinkingMode, opts.onDelta)`,
      `      for (var ki = 0; ki < keys.length; ki++) {\n        /* (ز17) الميزانية خلصت؟ اخرج فورًا — ZAI بياخد الباقي */\n        if (budgetExceeded()) return null\n        var t = timeoutMs\n        if (mi === 0 && ki === 0 && opts.fastFailFirstMs) t = opts.fastFailFirstMs\n        var result = await streamAttempt(models[mi], keys[ki], opts.parts, generationConfig, t, thinkingMode, opts.onDelta)`,
      1, 'E4 tryList check', 'gemini.ts'))
    if (gm === 0) { fs.writeFileSync(gp, g); totalRep += 4; console.log('  gemini.ts: written ✓') } else totalMiss += gm
  } else console.log('  gemini.ts: already patched')

  // ---------------- assistant route ----------------
  const rp = `${BASE}/${r}/src/app/api/ai/assistant/route.ts`
  let rt = fs.readFileSync(rp, 'utf8')
  let rm = 0
  if (!rt.includes('(ز17)')) {
    ;({ content: rt, misses: rm } = rep(rt,
      `export const maxDuration = 60`,
      `/* (ز17) 30 بدل 60: أقصى عمر للطلب — استهلاك Vercel أقل ورد أسرع */\nexport const maxDuration = 30`,
      1, 'R1 maxDuration', 'route.ts'))
    const RATE = `/* (ز17) حارس استهلاك — حد الرسايل لكل طالب: 20 رسالة / 5 دقايق (كاش في الذاكرة،\n * بيمنع اللوبات والعبث اللي بيحرق حدود Vercel) */\nvar RATE_LIMIT = 20\nvar RATE_WINDOW_MS = 5 * 60 * 1000\nvar rateHits: any = {}\nfunction rateLimitKey(req: Request, studentId: string): string {\n  var ip = ''\n  try {\n    ip = String((req.headers && (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'))) || '').split(',')[0].trim()\n  } catch (e) {}\n  return String(studentId || 'anon') + '|' + ip\n}\nfunction checkRateLimit(req: Request, studentId: string): { ok: boolean; waitSec: number } {\n  var key = rateLimitKey(req, studentId)\n  var now = Date.now()\n  var entry = rateHits[key]\n  if (!entry || now - entry.start > RATE_WINDOW_MS) {\n    rateHits[key] = { start: now, count: 1 }\n    var staleKeys = Object.keys(rateHits)\n    if (staleKeys.length > 5000) {\n      for (var i = 0; i < staleKeys.length; i++) {\n        var e = rateHits[staleKeys[i]]\n        if (!e || now - e.start > RATE_WINDOW_MS) delete rateHits[staleKeys[i]]\n      }\n    }\n    return { ok: true, waitSec: 0 }\n  }\n  entry.count++\n  if (entry.count > RATE_LIMIT) {\n    var waitSec = Math.ceil((entry.start + RATE_WINDOW_MS - now) / 1000)\n    return { ok: false, waitSec: waitSec }\n  }\n  return { ok: true, waitSec: 0 }\n}\n\n`
    ;({ content: rt, misses: rm } = rep(rt,
      `export async function POST(request: Request) {`,
      RATE + `export async function POST(request: Request) {`,
      1, 'R2 rate helpers', 'route.ts'))
    ;({ content: rt, misses: rm } = rep(rt,
      `    var history = buildHistory(body.history)\n`,
      `    var history = buildHistory(body.history)\n\n    /* (ز17) حارس الاستهلاك — قبل أي داتابيز أو محرك AI */\n    var rate = checkRateLimit(request, String(context.studentId || ''))\n    if (!rate.ok) {\n      return NextResponse.json({ error: 'بص يا بطل، بعت رسايل كتير في وقت قصير 😅 استنى ' + Math.max(rate.waitSec, 10) + ' ثانية وجرب تاني.' }, { status: 429 })\n    }\n`,
      1, 'R3 rate check', 'route.ts'))
    // R4-R6: standard platforms. shaimaa has its own deadline/budget system → optional.
    const optional = r === 'shaimaa-selim-science'
    ;({ content: rt, misses: rm } = rep(rt,
      `var timeoutMs = imageParts.length > 0 ? 50000 : 35000`,
      `/* (ز17) مهل أقصر — الرد بيبقى واصل أسرع والاستهلاك أقل */\n    var timeoutMs = imageParts.length > 0 ? 40000 : 22000`,
      optional ? 0 : 1, 'R4 timeouts' + (optional ? ' (optional)' : ''), 'route.ts'))
    // R5: two variants (std vs sherif deep-indent)
    const R5A = `            generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },\n            timeoutMs: timeoutMs,\n            thinking: 'low',`
    const R5A_NEW = `            /* (ز17) 2048 بدل 4096: رد الشات مش محتاج أكتر — إكمال أسرع واستهلاك أقل */\n            generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },\n            timeoutMs: timeoutMs,\n            fastFailFirstMs: 9000,\n            budgetMs: 15000,\n            thinking: 'low',`
    const R5B = `                  generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },\n                  timeoutMs: timeoutMs,\n                  thinking: 'low',`
    const R5B_NEW = `                  /* (ز17) 2048 بدل 4096 — إكمال أسرع واستهلاك أقل */\n                  generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },\n                  timeoutMs: timeoutMs,\n                  fastFailFirstMs: 9000,\n                  budgetMs: 15000,\n                  thinking: 'low',`
    if (rt.includes(R5A)) {
      ;({ content: rt, misses: rm } = rep(rt, R5A, R5A_NEW, 1, 'R5 stream opts (std)' + (optional ? ' (optional)' : ''), 'route.ts'))
    } else if (rt.includes(R5B)) {
      ;({ content: rt, misses: rm } = rep(rt, R5B, R5B_NEW, 1, 'R5 stream opts (sherif)' + (optional ? ' (optional)' : ''), 'route.ts'))
    } else if (!optional) {
      console.log('  MISS [route.ts] R5: no known block'); rm++
    }
    ;({ content: rt, misses: rm } = rep(rt,
      `return callGemini({ parts: geminiParts, generationConfig: { temperature: 0.3, maxOutputTokens: 4096 }, timeoutMs: timeoutMs, thinking: 'low' })`,
      `return callGemini({ parts: geminiParts, generationConfig: { temperature: 0.3, maxOutputTokens: 4096 }, timeoutMs: timeoutMs, budgetMs: 32000, thinking: 'low' })`,
      optional ? 0 : 1, 'R6 images budget' + (optional ? ' (optional)' : ''), 'route.ts'))
    if (rm === 0) { fs.writeFileSync(rp, rt); totalRep += 6; console.log('  assistant route: written ✓') } else totalMiss += rm
  } else console.log('  assistant route: already patched')
}
console.log(`\nTOTAL hunks applied: ${totalRep}, MISSES: ${totalMiss}`)
