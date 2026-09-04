'use client'

import { useState, useRef, useEffect } from 'react'
import { Calculator, X, Delete, CornerDownLeft, Image as ImageIcon, Loader2 } from 'lucide-react'
import { chunkedUpload } from '@/lib/chunked-upload'

interface MathKeyboardProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  rows?: number
  onImageUpload?: (filePath: string) => void
}

interface SymbolButton {
  label: string
  insert: string
  hint?: string
}

interface SymbolGroup {
  title: string
  symbols: SymbolButton[]
}

const SYMBOL_GROUPS: SymbolGroup[] = [
  {
    title: 'أساسيات',
    symbols: [
      { label: '+', insert: '+', hint: 'جمع' },
      { label: '−', insert: '-', hint: 'طرح' },
      { label: '×', insert: '×', hint: 'ضرب' },
      { label: '÷', insert: '÷', hint: 'قسمة' },
      { label: '=', insert: '=', hint: 'يساوي' },
      { label: '≠', insert: '≠', hint: 'لا يساوي' },
      { label: '<', insert: '<', hint: 'أصغر من' },
      { label: '>', insert: '>', hint: 'أكبر من' },
      { label: '≤', insert: '≤', hint: 'أصغر أو يساوي' },
      { label: '≥', insert: '≥', hint: 'أكبر أو يساوي' },
      { label: '±', insert: '±', hint: 'زائد أو ناقص' },
      { label: '( )', insert: '(', hint: 'أقواس' },
    ],
  },
  {
    title: 'الأُسس والجذور',
    symbols: [
      { label: 'x¹', insert: '¹', hint: 'أس 1' },
      { label: 'x²', insert: '²', hint: 'تربيع' },
      { label: 'x³', insert: '³', hint: 'تكعيب' },
      { label: 'x⁴', insert: '⁴', hint: 'أس 4' },
      { label: 'x⁵', insert: '⁵', hint: 'أس 5' },
      { label: 'xⁿ', insert: 'ⁿ', hint: 'أس n' },
      { label: '√', insert: '√', hint: 'جذر تربيعي' },
      { label: '∛', insert: '∛', hint: 'جذر تكعيبي' },
      { label: '∜', insert: '∜', hint: 'جذر رابع' },
      { label: '½', insert: '½', hint: 'نصف' },
      { label: '⅓', insert: '⅓', hint: 'ثلث' },
      { label: '¼', insert: '¼', hint: 'ربع' },
    ],
  },
  {
    title: 'رموز متقدمة',
    symbols: [
      { label: '∑', insert: '∑', hint: 'سيجما' },
      { label: '∫', insert: '∫', hint: 'تكامل' },
      { label: 'Δ', insert: 'Δ', hint: 'دلتا' },
      { label: 'θ', insert: 'θ', hint: 'ثيتا' },
      { label: 'α', insert: 'α', hint: 'ألفا' },
      { label: 'β', insert: 'β', hint: 'بيتا' },
      { label: 'γ', insert: 'γ', hint: 'جاما' },
      { label: 'λ', insert: 'λ', hint: 'لامدا' },
      { label: 'μ', insert: 'μ', hint: 'ميو' },
      { label: 'σ', insert: 'σ', hint: 'سيجما' },
      { label: 'φ', insert: 'φ', hint: 'فاي' },
      { label: 'ω', insert: 'ω', hint: 'أوميجا' },
    ],
  },
  {
    title: 'أن角ات ونسب',
    symbols: [
      { label: '°', insert: '°', hint: 'درجة' },
      { label: '∠', insert: '∠', hint: 'زاوية' },
      { label: '⊥', insert: '⊥', hint: 'تعامد' },
      { label: '∥', insert: '∥', hint: 'توازي' },
      { label: 'sin', insert: 'sin', hint: 'جيب' },
      { label: 'cos', insert: 'cos', hint: 'جتا' },
      { label: 'tan', insert: 'tan', hint: 'ظل' },
      { label: 'log', insert: 'log', hint: 'لوغاريتم' },
      { label: 'ln', insert: 'ln', hint: 'لوغاريتم طبيعي' },
      { label: '|x|', insert: '|', hint: 'قيمة مطلقة' },
      { label: 'gcd', insert: 'gcd', hint: 'ق.م.م' },
      { label: 'lcm', insert: 'lcm', hint: 'م.م.م' },
    ],
  },
  {
    title: 'أرقام',
    symbols: [
      { label: '0', insert: '0' },
      { label: '1', insert: '1' },
      { label: '2', insert: '2' },
      { label: '3', insert: '3' },
      { label: '4', insert: '4' },
      { label: '5', insert: '5' },
      { label: '6', insert: '6' },
      { label: '7', insert: '7' },
      { label: '8', insert: '8' },
      { label: '9', insert: '9' },
      { label: '.', insert: '.' },
      { label: ',', insert: ',' },
    ],
  },
]

export function MathKeyboard({ value, onChange, placeholder = 'اكتب إجابتك هنا...', rows = 4, onImageUpload }: MathKeyboardProps) {
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [activeGroup, setActiveGroup] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string>('')
  const [cursorPos, setCursorPos] = useState(0)

  // Smart insert: detect math context for "natural" writing feel
  // e.g. √ then 3 → ∛ (cube root), ^ then 2 → ² (squared), ^ then 3 → ³
  const insertSymbol = (symbol: string) => {
    if (!textareaRef.current) {
      onChange(value + symbol)
      return
    }
    const start = textareaRef.current.selectionStart
    const end = textareaRef.current.selectionEnd

    // Look at the last character before cursor for smart insertion
    const charBefore = start > 0 ? value[start - 1] : ''
    let actualSymbol = symbol

    // SMART: cube root, fourth root, etc.
    // If user typed √ then presses 3 → convert to ∛ (cube root)
    // If user typed √ then presses 4 → convert to ∜ (fourth root)
    if (charBefore === '√') {
      if (symbol === '3') {
        // Replace √ with ∛
        const newValue = value.substring(0, start - 1) + '∛' + value.substring(end)
        onChange(newValue)
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus()
            textareaRef.current.setSelectionRange(start, start)
          }
        }, 0)
        return
      } else if (symbol === '4') {
        const newValue = value.substring(0, start - 1) + '∜' + value.substring(end)
        onChange(newValue)
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus()
            textareaRef.current.setSelectionRange(start, start)
          }
        }, 0)
        return
      } else if (symbol === '2') {
        // √2 stays as √2 (square root of 2)
        const newValue = value.substring(0, start) + symbol + value.substring(end)
        onChange(newValue)
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus()
            textareaRef.current.setSelectionRange(start + 1, start + 1)
          }
        }, 0)
        return
      }
    }

    // SMART: powers — ^ then number → superscript
    // ^2 → ², ^3 → ³, ^4 → ⁴ (and similar for higher powers using Unicode where available)
    if (charBefore === '^') {
      const superMap: Record<string, string> = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
      }
      if (superMap[symbol]) {
        // Replace ^ + digit with superscript digit
        const newValue = value.substring(0, start - 1) + superMap[symbol] + value.substring(end)
        onChange(newValue)
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus()
            textareaRef.current.setSelectionRange(start, start)
          }
        }, 0)
        return
      }
      // x^n where x is letter (like x^2) - convert x^2 → x²
      if (/[0-9a-z]/i.test(charBefore) === false) {
        // ^ alone (no preceding letter), insert as superscript directly
        const superMap2: Record<string, string> = {
          '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
          '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
        }
        if (superMap2[symbol]) {
          const newValue = value.substring(0, start - 1) + superMap2[symbol] + value.substring(end)
          onChange(newValue)
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.focus()
              textareaRef.current.setSelectionRange(start, start)
            }
          }, 0)
          return
        }
      }
    }

    // SMART: × or ÷ between numbers — automatically space them
    if (symbol === '×' || symbol === '÷' || symbol === '+' || symbol === '-') {
      // Check if surrounded by numbers — auto-insert spaces around operator for readability
      const charAfter = end < value.length ? value[end] : ''
      const hasNumBefore = /[0-9²³⁴⁵⁶⁷⁸⁹⁰¹]/.test(charBefore)
      const hasNumAfter = /[0-9a-zA-Z(√∑∫π]/.test(charAfter)
      if (hasNumBefore && hasNumAfter) {
        // Already well-formed, just insert the operator
        actualSymbol = ' ' + symbol + ' '
      }
    }

    // SMART: opening parenthesis after function name (sin, cos, tan, log, ln)
    // e.g. typing sin then ( → sin(
    if (symbol === '(' && start >= 3) {
      const prevThree = value.substring(start - 3, start).toLowerCase()
      if (['sin', 'cos', 'tan', 'log', 'lcm', 'gcd'].includes(prevThree)) {
        actualSymbol = '('
      }
    }

    const newValue = value.substring(0, start) + actualSymbol + value.substring(end)
    onChange(newValue)
    setCursorPos(start + actualSymbol.length)
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(start + actualSymbol.length, start + actualSymbol.length)
      }
    }, 0)
  }

  const handleBackspace = () => {
    if (!textareaRef.current) {
      onChange(value.slice(0, -1))
      return
    }
    const start = textareaRef.current.selectionStart
    const end = textareaRef.current.selectionEnd
    if (start === end && start > 0) {
      const newValue = value.substring(0, start - 1) + value.substring(end)
      onChange(newValue)
      setCursorPos(start - 1)
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          textareaRef.current.setSelectionRange(start - 1, start - 1)
        }
      }, 0)
    } else if (start !== end) {
      const newValue = value.substring(0, start) + value.substring(end)
      onChange(newValue)
      setCursorPos(start)
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          textareaRef.current.setSelectionRange(start, start)
        }
      }, 0)
    }
  }

  const handleEnter = () => {
    insertSymbol('\n')
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate it's an image
    if (!file.type.startsWith('image/')) {
      alert('برجاء اختيار صورة فقط')
      return
    }

    // Check size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('حجم الصورة كبير جداً (الحد الأقصى 10MB)')
      return
    }

    setUploading(true)
    try {
      const data = await chunkedUpload(file, 'homework-answers', undefined, undefined)
      setUploadedImage(data.filePath)
      if (onImageUpload) {
        onImageUpload(data.filePath)
      }
      // Also append a marker in the text so the teacher can see an image was attached
      const marker = '\n[📷 صورة مرفقة]\n'
      onChange(value + marker)
    } catch (err: any) {
      alert('فشل رفع الصورة: ' + (err.message || 'حاول مرة أخرى'))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="w-full space-y-2">
      {/* Toolbar above textarea - not overlapping */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors disabled:opacity-50"
          title="رفع صورة الحل"
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ImageIcon className="h-3.5 w-3.5" />
          )}
          <span>{uploading ? 'جاري الرفع...' : 'رفع صورة'}</span>
        </button>
        <button
          type="button"
          onClick={() => setShowKeyboard(!showKeyboard)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            showKeyboard
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
          title="آلة حاسبة للرموز الرياضية"
        >
          <Calculator className="h-3.5 w-3.5" />
          <span>الرموز الرياضية</span>
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
      {/* Textarea below the toolbar */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full min-h-[120px] p-3 text-sm rounded-lg border border-border bg-background text-foreground resize-y font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          dir="auto"
        />
      </div>

      {uploadedImage && (
        <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/40">
          <ImageIcon className="h-4 w-4 text-emerald-600" />
          <span className="text-xs text-emerald-700 dark:text-emerald-300">تم رفع الصورة بنجاح - هتظهر للأستاذ في التصحيح</span>
          <button
            type="button"
            onClick={() => {
              setUploadedImage('')
              if (onImageUpload) onImageUpload('')
            }}
            className="mr-auto text-xs text-red-500 hover:underline"
          >
            حذف
          </button>
        </div>
      )}

      {showKeyboard && (
        <div className="mt-2 border border-border rounded-lg bg-card shadow-lg overflow-hidden">
          {/* Group tabs */}
          <div className="flex overflow-x-auto border-b border-border bg-muted/30 custom-scrollbar">
            {SYMBOL_GROUPS.map((group, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveGroup(idx)}
                className={`px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                  activeGroup === idx
                    ? 'bg-card text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {group.title}
              </button>
            ))}
          </div>

          {/* Symbols grid */}
          <div className="p-2">
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5">
              {SYMBOL_GROUPS[activeGroup].symbols.map((sym, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => insertSymbol(sym.insert)}
                  title={sym.hint || sym.label}
                  className="aspect-square flex items-center justify-center text-lg font-semibold bg-muted/50 hover:bg-primary hover:text-primary-foreground rounded-md transition-colors border border-border/50 select-none"
                >
                  {sym.label}
                </button>
              ))}

              {/* Backspace button */}
              <button
                type="button"
                onClick={handleBackspace}
                title="حذف"
                className="aspect-square flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-md transition-colors border border-red-500/20 select-none"
              >
                <Delete className="h-4 w-4" />
              </button>

              {/* Enter button */}
              <button
                type="button"
                onClick={handleEnter}
                title="سطر جديد"
                className="aspect-square flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 rounded-md transition-colors border border-emerald-500/20 select-none"
              >
                <CornerDownLeft className="h-4 w-4" />
              </button>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowKeyboard(false)}
              className="mt-2 w-full py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors flex items-center justify-center gap-1.5"
            >
              <X className="h-3.5 w-3.5" />
              إغلاق لوحة الرموز
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

