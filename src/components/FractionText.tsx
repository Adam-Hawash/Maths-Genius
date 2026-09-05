import * as React from 'react'

/*
 * FractionText — renders text that contains fractions as REAL stacked
 * fractions: numerator on top, a horizontal bar, denominator below.
 * (The user asked for "حاجة فوق وحاجة تحت" — something above and
 *  something below — instead of a plain inline mark.)
 *
 * Supported inputs — all converted to the same stacked visual:
 *   1. \frac{a}{b}      → machine marker (inserted by AI extraction
 *                         and by the MathKeyboard fraction button)
 *   2. a/b              → plain digit fractions (e.g. 3/4) — legacy
 *                         text and MCQ options
 *   3. a \n ─── \n b    → old stacked-text format (numerator line,
 *                         ─ separator row, denominator line)
 * Everything else renders as normal text (whitespace preserved).
 */

type Seg = { t: 'text'; v: string } | { t: 'frac'; a: string; b: string }

/* old stacked-text format: "3 \n ─── \n 4" */
var OLD_STACKED_RE = /(\d+(?:\.\d+)?)\s*\n\s*─+\s*\n\s*(\d+(?:\.\d+)?)/g
/* \frac{a}{b} marker */
var LATEX_FRAC_RE = /\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g
/* plain digit fraction a/b */
var SLASH_FRAC_RE = /(\d{1,4})\s*\/\s*(\d{1,4})/g

function tokenize(
  re: RegExp,
  text: string,
  onMatch: (m: RegExpExecArray, src: string) => Seg | null
): Seg[] {
  var segs: Seg[] = []
  var last = 0
  re.lastIndex = 0
  var m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m[0].length === 0) { re.lastIndex++; continue }
    var seg = onMatch(m, text)
    if (seg) {
      if (m.index > last) segs.push({ t: 'text', v: text.slice(last, m.index) })
      segs.push(seg)
      last = m.index + m[0].length
    }
  }
  if (last < text.length) segs.push({ t: 'text', v: text.slice(last) })
  return segs
}

/* a/b → stacked only when not glued to other digits/slashes/dots
   (so "1/2/3" or "3.5/2" stay plain text) */
function slashMatch(m: RegExpExecArray, src: string): Seg | null {
  var before = m.index > 0 ? src[m.index - 1] : ''
  var afterIdx = m.index + m[0].length
  var after = afterIdx < src.length ? src[afterIdx] : ''
  if (/[\d\/.]/.test(before) || /[\d\/]/.test(after)) return null
  return { t: 'frac', a: m[1], b: m[2] }
}

function parseSegments(text: string): Seg[] {
  // 1) old stacked-text format first
  var segs = tokenize(OLD_STACKED_RE, text, function (m) {
    return { t: 'frac', a: m[1], b: m[2] }
  })
  // 2) then \frac{a}{b} inside the remaining text
  var out: Seg[] = []
  for (var i = 0; i < segs.length; i++) {
    if (segs[i].t === 'frac') { out.push(segs[i]); continue }
    out = out.concat(
      tokenize(LATEX_FRAC_RE, (segs[i] as any).v, function (m) {
        return { t: 'frac', a: m[1], b: m[2] }
      })
    )
  }
  // 3) then plain a/b digits inside the remaining text
  var out2: Seg[] = []
  for (var j = 0; j < out.length; j++) {
    if (out[j].t === 'frac') { out2.push(out[j]); continue }
    out2 = out2.concat(tokenize(SLASH_FRAC_RE, (out[j] as any).v, slashMatch))
  }
  return out2
}

function Frac({ a, b }: { a: string; b: string }) {
  return (
    <span
      dir="ltr"
      className="inline-flex flex-col items-center align-middle mx-1 text-[0.92em] leading-[1.15]"
    >
      <span className="px-1 whitespace-nowrap">{a}</span>
      <span className="w-full border-t-[1.5px] border-current" aria-hidden="true" />
      <span className="px-1 whitespace-nowrap">{b}</span>
    </span>
  )
}

export function FractionText({ text, className }: { text: string; className?: string }) {
  if (!text) return null
  var segs = parseSegments(String(text))
  if (segs.length === 0) return <span className={className}>{text}</span>
  return (
    <span className={'whitespace-pre-wrap ' + (className || '')}>
      {segs.map(function (s, i) {
        return s.t === 'frac' ? (
          <Frac key={i} a={(s as any).a} b={(s as any).b} />
        ) : (
          <React.Fragment key={i}>{(s as any).v}</React.Fragment>
        )
      })}
    </span>
  )
}

export default FractionText
