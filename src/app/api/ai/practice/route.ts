// @ts-nocheck
// ============================================================
// FILE: src/app/api/ai/practice/route.ts
// PURPOSE: مولد الأسئلة الذكي — تاب «اتدرب أكتر»
//   الطالب يكتب الفكرة/القانون/المسألة/المعادلة (أو يرفع صورة معادلة) →
//   10 أسئلة تدريب فريدة بأرقام مختلفة وخدع وحل خطوة بخطوة.
//
//   (2026-و68) طلب المستر: الأسئلة كلها **بالإنجليزي** وبأسلوب
//   Maths Genius («Solve for x: 6(x - 1) = 18») — مش بالعربي.
//   + دعم رفع صورة معادلة (VLM): الزاي والجيميني بيقرا الصورة ويولد
//     10 أسئلة على نفس الفكرة/المعادلة بأرقام مختلفة.
//
//   3 محركات بالترتيب — اللي ينجح أولًا بيكسب:
//   1) ZAI (z-ai-web-dev-sdk) — نصوص + رؤية بدون مفاتيح
//   2) Gemini (GEMINI_API_KEYS) — احتياطي على Vercel (نصوص + رؤية)
//   3) المحرك المحلي (lib/question-gen) — مضمون 100% للنصوص
//   لو الـ AI رجّع أقل من 10 أسئلة سليمة → بيتكمل من المحرك المحلي
//   عشان الطالب **دايمًا** ياخد 10 أسئلة كاملة مهما حصل.
// ============================================================

import { NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { callGemini, hasGeminiKey, parseGeminiJson } from '@/lib/gemini'
import { generatePracticeSet, sanitizeAiPractice, type PracticeQuestion } from '@/lib/question-gen'

export const runtime = 'nodejs'
export const maxDuration = 60

/* (2026-و68) برومبت إنجليزي — أسلوب Maths Genius بالظبط */
var SYSTEM_PROMPT = [
  'You are an expert Egyptian math teacher on the "Maths Genius" platform.',
  'The student will send you: an idea, a rule/law, a specific problem, or an EQUATION they struggle with (as text or as a photo).',
  'Your task: analyze the request and generate EXACTLY 10 unique practice questions on the SAME skill/law:',
  '- Different numbers for every question (never repeat the same numbers)',
  '- A different quick solving trick for every question',
  '- Clear step-by-step solution (2-3 short steps each)',
  '- If the student sent a specific problem/equation: generate 10 similar problems using the SAME rule with different numbers',
  '- Difficulty gradient: first 3 Easy, middle 4 Medium, last 3 Hard',
  '- EVERYTHING you output must be in ENGLISH (question, answer, steps, trick, topic) — school math style like "Solve for x: 6(x - 1) = 18"',
  '- The math MUST be 100% correct — verify every calculation before writing it',
  '- No LaTeX or complex symbols — write fractions as a/b and powers as x² or 2^3',
  '- Keep steps short (2-3 per question) and the trick in one line — so the response is fast',
  'Return JSON only with no extra text, in this exact shape:',
  '{"questions":[{"question":"question text","answer":"final answer","steps":["step 1","step 2","step 3"],"trick":"quick solving trick","topic":"skill name","difficulty":"Easy or Medium or Hard"}]}',
].join('\n')

function buildUserPrompt(topic: string, grade: string): string {
  return [
    'Student request: «' + String(topic || '').slice(0, 600) + '»',
    grade ? ('Grade level: ' + grade) : '',
    'Generate 10 practice questions on this skill in the required shape (JSON only, everything in English).',
  ].filter(Boolean).join('\n')
}

/* استخراج base64 من dataURL — للرؤية (VLM) */
function parseDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
  var m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/.exec(String(dataUrl || ''))
  if (!m) return null
  var mime = m[1].toLowerCase()
  if (mime.indexOf('image/') !== 0) return null
  var data = m[2].replace(/\s/g, '')
  if (!data || data.length < 64) return null
  return { mimeType: mime, data: data }
}

/* ===== محرك 1: ZAI — نصوص + رؤية ===== */
async function zaiGenerate(topic: string, grade: string, imageDataUrl: string): Promise<PracticeQuestion[] | null> {
  try {
    var zai = await ZAI.create()
    var userContent: any = buildUserPrompt(topic, grade)
    if (imageDataUrl) {
      userContent = [
        { type: 'text', text: buildUserPrompt(topic, grade) },
        { type: 'image_url', image_url: { url: imageDataUrl } },
      ]
    }
    var timeout: any = null
    var completion = await Promise.race([
      zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
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

/* ===== محرك 2: Gemini — نصوص + رؤية ===== */
async function geminiGenerate(topic: string, grade: string, imageDataUrl: string): Promise<PracticeQuestion[] | null> {
  try {
    if (!hasGeminiKey()) return null
    var parts: any[] = [{ text: SYSTEM_PROMPT + '\n\n' + buildUserPrompt(topic, grade) }]
    var img = parseDataUrl(imageDataUrl)
    if (img) {
      parts.push({ inline_data: { mime_type: img.mimeType, data: img.data } })
    }
    var res = await callGemini({
      parts: parts,
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
  var body: any = {}
  try {
    body = await request.json().catch(function () { return ({} as any) })
    var topic = String(body.topic || body.message || '').trim()
    var grade = String(body.grade || '').trim()
    var imageDataUrl = String(body.image || '').trim()
    var hasImage = !!parseDataUrl(imageDataUrl)

    // لو فيه صورة → حد للطلب 1200 حرف؛ لو نص فقط → مطلوب نص
    if (topic.length > (hasImage ? 1200 : 600)) topic = topic.slice(0, hasImage ? 1200 : 600)
    if (!topic && !hasImage) {
      return NextResponse.json({ ok: false, error: 'اكتب الفكرة أو المسألة اللي عايز تتدرب عليها الأول' }, { status: 400 })
    }
    // حجم الصورة: حد 6MB base64 تقريبًا
    if (hasImage && imageDataUrl.length > 8 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: 'الصورة كبيرة أوي — صوّر المعادلة بحجم أصغر و جرب تاني' }, { status: 413 })
    }

    var source = 'ai'
    var questions: PracticeQuestion[] | null = null

    // محرك 1 ثم 2 (بصورة أو من غيرها)
    questions = await zaiGenerate(topic, grade, hasImage ? imageDataUrl : '')
    if (!questions || questions.length < 10) {
      var g = await geminiGenerate(topic, grade, hasImage ? imageDataUrl : '')
      if (g && g.length > (questions ? questions.length : 0)) questions = g
    }

    // محرك 3: المحلي — بيتاح للنصوص بس (الصورة محتاج رؤية)
    if (!hasImage) {
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
    } else if (questions) {
      questions = questions.slice(0, 10)
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json({ ok: false, error: 'مقدرتش أقرا الصورة كويس — جرب تصورها بإضاءة أحسن، أو اكتب المعادلة نص' }, { status: 502 })
    }

    return NextResponse.json({
      ok: true,
      source: source,
      engine: source === 'ai' ? 'AI' : 'Maths Genius Engine',
      elapsedMs: Date.now() - started,
      questions: questions,
    })
  } catch (e: any) {
    // حتى لو انفجر كل حاجة — المحلي ما بيفشلش (للنصوص)
    try {
      var t = String(body && body.topic ? body.topic : '')
      if (t) {
        var questionsLocal = generatePracticeSet(t)
        return NextResponse.json({ ok: true, source: 'local', engine: 'Maths Genius Engine', questions: questionsLocal })
      }
    } catch (e2) {}
    return NextResponse.json({ ok: false, error: 'المولد مشغول — جرب تاني' }, { status: 500 })
  }
}
