// @ts-nocheck
// ============================================================
// FILE: src/app/api/ai/practice/route.ts
// PURPOSE: (2026-و66) مولد الأسئلة الذكي — تاب «اتدرب أكتر»
//   الطالب يكتب الفكرة/القانون/المسألة اللي بيتعب فيها →
//   10 أسئلة تدريب فريدة بأرقام مختلفة وخدع وحل خطوة بخطوة.
//
//   3 محركات بالترتيب — اللي ينجح أولًا بيكسب:
//   1) ZAI (z-ai-web-dev-sdk) — نصوص قوية بدون مفاتيح
//   2) Gemini (GEMINI_API_KEYS) — احتياطي على Vercel
//   3) المحرك المحلي (lib/question-gen) — مضمون 100% دايمًا
//      بيتحلل الكلام المفتاحي ويتولد 10 أسئلة محسوبة برمجيًا
//   لو الـ AI رجّع أقل من 10 أسئلة سليمة → بيتكمل من المحرك المحلي
//   عشان الطالب **دايمًا** ياخد 10 أسئلة كاملة مهما حصل.
// ============================================================

import { NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { callGemini, hasGeminiKey, parseGeminiJson } from '@/lib/gemini'
import { generatePracticeSet, sanitizeAiPractice, type PracticeQuestion } from '@/lib/question-gen'

export const runtime = 'nodejs'
export const maxDuration = 60

var SYSTEM_PROMPT = [
  'أنت معلم رياضيات مصري خبير في منصة Maths Genius (مستر وائل).',
  'الطالب هيكتب لك: فكرة، أو قانون، أو مسألة رياضيات بيعاني فيها.',
  'مهمتك: تحلل طلبه وتولد بالظبط 10 أسئلة تدريب فريدة على نفس المهارة/القانون:',
  '- أرقام مختلفة لكل سؤال (ممنوع تكرار نفس الأرقام)',
  '- خدع حل سريعة مختلفة (trick لكل سؤال)',
  '- حل خطوة بخطوة (steps) واضح ومبسط',
  '- لو الطالب كتب مسألة معينة: ولّد 10 مسائل شبيهة ليها بنفس القانون بأرقام مختلفة',
  '- الصعوبة تتدرج: أول 3 سهل، وسط 4 متوسط، آخر 3 صعب',
  '- مستوى منهج مصري (إعدادي/ثانوي) — لغة عربية واضحة وممكن عامية تعليمية لطيفة',
  '- الرياضيات لازم تكون صحيحة 100% — راجع كل حساب قبل ما تكتبه',
  '- ممنوع LaTeX أو رموز معقدة — اكتب الكسور بشكل a/b والأسس بشكل x² أو 2^3',
  '- خطوات قصيرة (2-3 خطوات لكل سؤال) وخدعة في سطر واحد — عشان الرد يكون سريع',
  'أرجع JSON فقط بدون أي كلام زيادة، بالشكل ده:',
  '{"questions":[{"question":"نص السؤال","answer":"الإجابة النهائية","steps":["خطوة 1","خطوة 2","خطوة 3"],"trick":"خدعة سريعة للحل","topic":"اسم المهارة","difficulty":"سهل أو متوسط أو صعب"}]}',
].join('\n')

function buildUserPrompt(topic: string, grade: string): string {
  return [
    'طلب الطالب: «' + String(topic || '').slice(0, 600) + '»',
    grade ? ('الصف الدراسي: ' + grade) : '',
    'ولّد 10 أسئلة تدريب على المهارة دي بالشكل المطلوب (JSON بس).',
  ].filter(Boolean).join('\n')
}

/* ===== محرك 1: ZAI ===== */
async function zaiGenerate(topic: string, grade: string): Promise<PracticeQuestion[] | null> {
  try {
    var zai = await ZAI.create()
    var timeout: any = null
    var completion = await Promise.race([
      zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(topic, grade) },
        ],
        thinking: { type: 'disabled' },
      }),
      new Promise(function (_, rej) { timeout = setTimeout(function () { rej(new Error('timeout')) }, 48000) }),
    ])
    if (timeout) try { clearTimeout(timeout) } catch (e) {}
    var text = ((completion as any)?.choices?.[0]?.message?.content) || ''
    var parsed = parseGeminiJson(String(text || ''))
    if (!parsed) return null
    var qs = sanitizeAiPractice(parsed.questions || parsed.items || parsed)
    return qs.length >= 5 ? qs : null
  } catch (e) {
    return null
  }
}

/* ===== محرك 2: Gemini ===== */
async function geminiGenerate(topic: string, grade: string): Promise<PracticeQuestion[] | null> {
  try {
    if (!hasGeminiKey()) return null
    var res = await callGemini({
      parts: [{ text: SYSTEM_PROMPT + '\n\n' + buildUserPrompt(topic, grade) }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 4096 },
      timeoutMs: 35000,
    })
    if (!res || !res.ok || !res.text) return null
    var parsed = parseGeminiJson(res.text)
    if (!parsed) return null
    var qs = sanitizeAiPractice(parsed.questions || parsed.items || parsed)
    return qs.length >= 5 ? qs : null
  } catch (e) {
    return null
  }
}

export async function POST(request: Request) {
  var started = Date.now()
  try {
    var body = await request.json().catch(function () { return ({} as any) })
    var topic = String(body.topic || body.message || '').trim()
    var grade = String(body.grade || '').trim()
    if (!topic) {
      return NextResponse.json({ ok: false, error: 'اكتب الفكرة أو المسألة اللي عايز تتدرب عليها الأول' }, { status: 400 })
    }
    if (topic.length > 600) topic = topic.slice(0, 600)

    var source = 'ai'
    var questions: PracticeQuestion[] | null = null

    // محرك 1 ثم 2
    questions = await zaiGenerate(topic, grade)
    if (!questions || questions.length < 10) {
      var g = await geminiGenerate(topic, grade)
      if (g && g.length > (questions ? questions.length : 0)) questions = g
    }

    // محرك 3: المحلي — كامل لو مفيش AI، ومكمّل لو الـ AI رجع أقل من 10
    var local = generatePracticeSet(topic)
    if (!questions || questions.length === 0) {
      questions = local
      source = 'local'
    } else if (questions.length < 10) {
      var have = new Set(questions.map(function (q) { return q.question }))
      for (var i = 0; i < local.length && questions.length < 10; i++) {
        if (!have.has(local[i].question)) questions.push(local[i])
      }
    }
    questions = questions.slice(0, 10)

    return NextResponse.json({
      ok: true,
      source: source,
      engine: source === 'ai' ? 'الذكاء الاصطناعي' : 'مولد المنصة الرياضي',
      elapsedMs: Date.now() - started,
      questions: questions,
    })
  } catch (e: any) {
    // حتى لو انفجر كل حاجة — المحلي ما بيفشلش
    try {
      var questionsLocal = generatePracticeSet(String(body && body.topic ? body.topic : ''))
      return NextResponse.json({ ok: true, source: 'local', engine: 'مولد المنصة الرياضي', questions: questionsLocal })
    } catch (e2) {
      return NextResponse.json({ ok: false, error: 'المولد مشغول — جرب تاني' }, { status: 500 })
    }
  }
}
