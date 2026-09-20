'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'model'
  text: string
}

interface Props {
  businessId: string
  locale: string
  menuItemNames?: string[] // for quick-add suggestions
}

const STARTERS = [
  "I'm not very hungry",
  "Something vegetarian?",
  "What's most popular?",
  "I love spicy food",
  "No meat please",
  "Surprise me!",
]

export default function AIAssistant({ businessId, locale, menuItemNames = [] }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
      if (messages.length === 0) {
        // Greeting message
        setMessages([{
          role: 'model',
          text: "Hi! 👋 I'm your ordering assistant. Tell me what you're in the mood for and I'll recommend something from the menu!",
        }])
      }
    }
  }, [open])

  useEffect(() => { scrollToBottom() }, [messages])

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', text: text.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setHasError(false)

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          message: text.trim(),
          history: messages, // send full history for multi-turn
          locale,
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'model', text: data.reply ?? 'Sorry, something went wrong.' }])
    } catch {
      setHasError(true)
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting. Please try again!" }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating chat button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-24 right-4 z-40 w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-700 text-white rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center text-xl"
        title="Ask AI assistant"
        aria-label="AI ordering assistant"
      >
        {open ? '✕' : '🤖'}
      </button>

      {/* Chat panel */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="fixed bottom-40 right-4 z-50 w-80 max-h-[60vh] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-3 flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <div>
                <p className="text-white font-semibold text-sm">AI Ordering Assistant</p>
                <p className="text-teal-200 text-xs">Powered by Gemini</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-teal-600 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Loading bubble */}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-3 py-2">
                    <span className="flex gap-1 items-center h-4">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                    </span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick starter chips — only show at start */}
            {messages.length <= 1 && (
              <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto no-scrollbar">
                {STARTERS.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="flex-shrink-0 text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-full hover:bg-teal-100 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-3 pb-3 pt-1 border-t border-gray-100 flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send(input)}
                placeholder="What are you in the mood for?"
                className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
                disabled={loading}
              />
              <button
                onClick={() => send(input)}
                disabled={loading || !input.trim()}
                className="w-9 h-9 bg-teal-600 text-white rounded-xl flex items-center justify-center hover:bg-teal-700 disabled:opacity-40 transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4 rotate-90" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
