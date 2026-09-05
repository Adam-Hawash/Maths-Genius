'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, X, Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function AIAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'أهلاً بك 👋 أنا المساعد الذكي بتاع المنصة. اسألني عن أي حاجة - الواجبات، الامتحانات، الدروس، أو أي مشكلة تقنية!',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const sendMessage = async () => {
    var msg = input.trim()
    if (!msg || loading) return

    setInput('')
    setMessages(function(prev) {
      return [...prev, { role: 'user', content: msg }]
    })
    setLoading(true)

    try {
      // Get current page context
      var page = typeof window !== 'undefined' ? window.location.pathname : ''
      var studentId = ''
      try {
        var stored = localStorage.getItem('current-student')
        if (stored) {
          var parsed = JSON.parse(stored)
          if (parsed && parsed.state && parsed.state.currentStudent) {
            studentId = parsed.state.currentStudent.id || ''
          }
        }
      } catch (e) {}

      var res = await Promise.race([
        fetch('/api/ai/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg, context: { page: page, studentId: studentId } }),
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 45000)),
      ])
      var data = await res.json()
      var reply = data.reply || 'مش قادر أرد دلوقتي. حاول تاني 🙏'
      setMessages(function(prev) {
        return [...prev, { role: 'assistant', content: reply }]
      })
    } catch (e) {
      setMessages(function(prev) {
        return [...prev, { role: 'assistant', content: 'حصلت مشكلة في الاتصال. حاول تاني 🙏' }]
      })
    }
    setLoading(false)
  }

  return (
    <>
      {/* Floating Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
        style={{ boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)' }}
        title="مساعد ذكي"
        aria-label="مساعد ذكي"
      >
        {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[calc(100vw-2.5rem)] sm:w-[400px] max-w-[400px] max-h-[500px] flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-3 flex items-center gap-2 shrink-0">
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">المساعد الذكي</p>
              <p className="text-[10px] opacity-90">اسألني عن أي حاجة في المنصة</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-8 w-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar" style={{ minHeight: '250px', maxHeight: '350px' }}>
            {messages.map(function(msg, i) {
              var isUser = msg.role === 'user'
              return (
                <div key={i} className={'flex ' + (isUser ? 'justify-start' : 'justify-end')}>
                  <div
                    className={
                      'max-w-[85%] p-2.5 rounded-2xl text-sm whitespace-pre-wrap break-words ' +
                      (isUser
                        ? 'bg-primary text-primary-foreground rounded-tl-none'
                        : 'bg-muted text-foreground rounded-tr-none')
                    }
                    dir="auto"
                  >
                    {msg.content}
                  </div>
                </div>
              )
            })}
            {loading && (
              <div className="flex justify-end">
                <div className="bg-muted text-foreground p-2.5 rounded-2xl rounded-tr-none flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs">كاتب...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border bg-card shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={function(e) { setInput(e.target.value) }}
                onKeyDown={function(e) {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder="اكتب سؤالك..."
                disabled={loading}
                className="flex-1 h-10 px-3 rounded-full bg-background border border-input text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                maxLength={500}
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
