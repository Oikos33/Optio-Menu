'use client'

import { useState } from 'react'
import { Link } from '@/i18n/navigation'

const SUBJECTS = [
  'General Inquiry',
  'Register My Restaurant',
  'Partnership / B2B',
  'Technical Support',
  'Press & Media',
  'Other',
] as const

type FormState = 'idle' | 'submitting' | 'success' | 'error'

interface ContactFormProps {
  locale: string
}

export default function ContactForm({ locale: _locale }: ContactFormProps) {
  const [subject, setSubject] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [formState, setFormState] = useState<FormState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const charCount = message.length

  function resetForm() {
    setSubject('')
    setName('')
    setEmail('')
    setMessage('')
    setFormState('idle')
    setErrorMsg('')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (message.trim().length < 20) {
      setErrorMsg('Message must be at least 20 characters.')
      setFormState('error')
      return
    }

    setFormState('submitting')
    setErrorMsg('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
          source: 'contact_form',
        }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Something went wrong')
      }

      setFormState('success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setErrorMsg(msg)
      setFormState('error')
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-teal-600 font-medium mb-8 transition-colors"
      >
        ← Optio Menu
      </Link>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">

        {/* ── Left: Info panel ─────────────────────────────── */}
        <div className="md:col-span-2 bg-teal-600 text-white rounded-2xl p-8 flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-extrabold mb-3">Get in touch</h1>
            <p className="text-teal-100 text-sm leading-relaxed">
              Have a question? Want to register your restaurant? We&apos;d love to hear from you.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <span className="text-lg mt-0.5">📧</span>
              <div>
                <p className="text-xs text-teal-300 font-semibold uppercase tracking-wide mb-0.5">Email</p>
                <a
                  href="mailto:contact@optio-menu.ai"
                  className="text-sm text-white hover:text-teal-200 transition-colors"
                >
                  contact@optio-menu.ai
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-lg mt-0.5">🌐</span>
              <div>
                <p className="text-xs text-teal-300 font-semibold uppercase tracking-wide mb-0.5">Website</p>
                <a
                  href="https://www.optio-menu.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white hover:text-teal-200 transition-colors"
                >
                  www.optio-menu.ai
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-lg mt-0.5">🕐</span>
              <div>
                <p className="text-xs text-teal-300 font-semibold uppercase tracking-wide mb-0.5">Response time</p>
                <p className="text-sm text-white">1–2 business days</p>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-teal-500">
            <p className="text-sm text-teal-100 leading-relaxed">
              Building the future of restaurant tech — from Japan to the world 🇯🇵
            </p>
          </div>
        </div>

        {/* ── Right: Form ──────────────────────────────────── */}
        <div className="md:col-span-3 bg-white rounded-2xl shadow-sm p-8">
          {formState === 'success' ? (
            /* Success state */
            <div className="flex flex-col items-center justify-center h-full py-12 text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Message sent!</h2>
              <p className="text-gray-500 text-sm">We&apos;ll be in touch soon.</p>
              <button
                onClick={resetForm}
                className="mt-2 text-sm text-teal-600 hover:text-teal-700 font-medium underline underline-offset-2 transition-colors"
              >
                Send another message
              </button>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Send us a message</h2>
                <p className="text-sm text-gray-400">We read every message.</p>
              </div>

              {/* Error banner */}
              {formState === 'error' && errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  {errorMsg}
                </div>
              )}

              {/* Subject */}
              <div>
                <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Subject <span className="text-red-400">*</span>
                </label>
                <select
                  id="subject"
                  required
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                >
                  <option value="" disabled>Select a topic…</option>
                  {SUBJECTS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="Your name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                />
              </div>

              {/* Message */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-700">
                    Message <span className="text-red-400">*</span>
                  </label>
                  <span
                    className={`text-xs font-medium tabular-nums ${
                      charCount < 20 ? 'text-gray-400' : 'text-teal-600'
                    }`}
                  >
                    {charCount} char{charCount !== 1 ? 's' : ''}{charCount < 20 ? ' (min 20)' : ''}
                  </span>
                </div>
                <textarea
                  id="message"
                  required
                  minLength={20}
                  rows={5}
                  placeholder="Tell us what's on your mind…"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition resize-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={formState === 'submitting'}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                {formState === 'submitting' ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    Sending…
                  </>
                ) : (
                  'Send message →'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
