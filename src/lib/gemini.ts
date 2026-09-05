// @ts-nocheck
// ============================================================
// FILE: src/lib/gemini.ts
// PURPOSE: Central Gemini AI helper used by ALL AI features
//          (المساعد الذكي + استخراج الواجبات والامتحانات + تصحيح الصور)
//
// MODEL: Gemini 3.6 first (as requested), then latest flash, then 2.0 flash.
// KEYS:  Supports MULTIPLE API keys for automatic rotation when quota (429)
//        is exhausted on one key:
//          - GEMINI_API_KEY       (single key, as before)
//          - GEMINI_API_KEYS      (comma-separated keys — preferred)
//        Example in Vercel Environment Variables:
//          GEMINI_API_KEYS=AIzaSy....,AIzaSy....,AIzaSy....
// ============================================================

export var GEMINI_MODELS = ['gemini-3.6-flash', 'gemini-flash-latest']

const QUOTA_HINT = 'الحصة اليومية لمفتاح Gemini خلصت (429). الحل: ضيف مفتاح/مفاتيح تانية في Vercel → Settings → Environment Variables باسم GEMINI_API_KEYS (مفصولة بفواصل) أو فعّل الفاتورة من Google AI Studio.'

// Collect all configured keys, in order
export function getGeminiApiKeys(): string[] {
  var keys = []
  var multi = process.env.GEMINI_API_KEYS || ''
  var single = process.env.GEMINI_API_KEY || ''
  if (multi.trim()) {
    var parts = multi.split(',')
    for (var i = 0; i < parts.length; i++) {
      var k = parts[i].trim()
      if (k) keys.push(k)
    }
  }
  if (single.trim()) keys.push(single.trim())
  // de-duplicate
  var seen = {}
  var unique = []
  for (var j = 0; j < keys.length; j++) {
    if (!seen[keys[j]]) { seen[keys[j]] = true; unique.push(keys[j]) }
  }
  return unique
}

export function hasGeminiKey(): boolean {
  return getGeminiApiKeys().length > 0
}

export interface GeminiResult {
  ok: boolean
  text?: string
  model?: string
  error?: string
  status?: number
}

// Single attempt against one model + one key
async function attempt(model: string, apiKey: string, parts: any[], generationConfig: any, timeoutMs: number): Promise<GeminiResult> {
  var controller = new AbortController()
  var timeoutHandle = setTimeout(function() { controller.abort() }, timeoutMs)
  try {
    var modelUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey
    var res = await fetch(modelUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: parts }], generationConfig: generationConfig }),
      signal: controller.signal,
    })
    if (res.ok) {
      var data = await res.json()
      var text = ''
      try { text = data.candidates[0].content.parts[0].text || '' } catch (e) {}
      if (text && text.trim()) return { ok: true, text: text.trim(), model: model }
      return { ok: false, error: model + ': response had no text', status: 200 }
    }
    var errBody = ''
    try { errBody = await res.text() } catch (e) {}
    return { ok: false, error: model + ': ' + res.status + ' ' + (errBody || '').substring(0, 300), status: res.status }
  } catch (e) {
    var msg = (e && e.name === 'AbortError') ? 'timeout after ' + timeoutMs + 'ms' : (e.message || 'network error')
    return { ok: false, error: model + ': ' + msg }
  } finally {
    clearTimeout(timeoutHandle)
  }
}

// ============================================================
// Main entry — try Gemini 3.6 first across ALL configured keys,
// then fall back through the model list. Rotates keys on 429.
// ============================================================
export async function callGemini(opts: {
  parts: any[]
  generationConfig?: any
  timeoutMs?: number          // per-attempt timeout (default 30000)
  fastFailFirstMs?: number    // optional shorter timeout for the very first attempt
}): Promise<GeminiResult> {
  var keys = getGeminiApiKeys()
  if (keys.length === 0) {
    return { ok: false, error: 'GEMINI_API_KEY not found — أضف المفتاح في Vercel Environment Variables أو ملف .env.local' }
  }

  var generationConfig = opts.generationConfig || { temperature: 0.1, maxOutputTokens: 8192 }
  var timeoutMs = opts.timeoutMs || 30000
  var lastError = ''
  var sawQuota = false
  var attemptIndex = 0

  // Outer: models (Gemini 3.6 first) — Inner: keys (rotation on quota)
  // Two passes: the second pass (after a short pause) clears short RPM blips.
  for (var pass = 0; pass < 2; pass++) {
    if (pass > 0) {
      if (!sawQuota) break
      await new Promise(function (r) { setTimeout(r, 2500) })
    }
    for (var mi = 0; mi < GEMINI_MODELS.length; mi++) {
      for (var ki = 0; ki < keys.length; ki++) {
        attemptIndex++
        var t = timeoutMs
        if (attemptIndex === 1 && opts.fastFailFirstMs) t = opts.fastFailFirstMs
        var result = await attempt(GEMINI_MODELS[mi], keys[ki], opts.parts, generationConfig, t)
        if (result.ok) return result
        lastError = result.error || ''
        if (result.status === 429) {
          sawQuota = true
          // small pause before switching key/model so we don't burn RPM
          await new Promise(function (r) { setTimeout(r, 400) })
        } else if (result.status === 404) {
          // model retired (e.g. gemini-2.0-flash) — skip its remaining keys
          break
        }
      }
    }
  }

  if (sawQuota) {
    lastError = QUOTA_HINT + ' [' + lastError + ']'
  }
  return { ok: false, error: lastError, status: sawQuota ? 429 : undefined }
}

// Extract first JSON object from an AI text response
export function parseGeminiJson(text: string): any | null {
  if (!text || !text.trim()) return null
  var jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  try {
    return JSON.parse(jsonMatch[0])
  } catch (e) {
    return null
  }
}
