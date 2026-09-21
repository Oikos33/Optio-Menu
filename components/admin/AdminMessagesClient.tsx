'use client'

import { useState, useTransition } from 'react'
import { updateMessageStatus, type MessageStatus } from '@/app/actions/admin-messages'

interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  source: string
  status: MessageStatus
  created_at: string
}

const STATUS_STYLES: Record<MessageStatus, string> = {
  unread: 'bg-yellow-100 text-yellow-800',
  read: 'bg-blue-100 text-blue-700',
  replied: 'bg-green-100 text-green-700',
  archived: 'bg-gray-100 text-gray-500',
}

const STATUS_LABELS: Record<MessageStatus, string> = {
  unread: 'Unread',
  read: 'Read',
  replied: 'Replied',
  archived: 'Archived',
}

interface MessageRowProps {
  msg: ContactMessage
}

function MessageRow({ msg: initial }: MessageRowProps) {
  const [msg, setMsg] = useState(initial)
  const [expanded, setExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleStatus(status: MessageStatus) {
    startTransition(async () => {
      const { error } = await updateMessageStatus(msg.id, status)
      if (!error) setMsg((prev) => ({ ...prev, status }))
    })
  }

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-colors ${
        msg.status === 'unread'
          ? 'border-yellow-200 bg-yellow-50/40'
          : msg.status === 'archived'
          ? 'border-gray-100 bg-gray-50/50 opacity-70'
          : 'border-gray-100 bg-white'
      }`}
    >
      {/* Header row */}
      <button
        className="w-full text-left px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">{msg.name}</span>
            <span className="text-gray-400 text-xs">{msg.email}</span>
            <span
              className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${STATUS_STYLES[msg.status]}`}
            >
              {STATUS_LABELS[msg.status]}
            </span>
          </div>
          <p className="text-sm text-gray-700 font-medium mt-0.5 truncate">{msg.subject}</p>
          {!expanded && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              {msg.message.slice(0, 100)}{msg.message.length > 100 ? '…' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {new Date(msg.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <span className="text-gray-300 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-100">
          <p className="text-sm text-gray-700 mt-4 whitespace-pre-wrap leading-relaxed">
            {msg.message}
          </p>
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            {msg.status !== 'read' && msg.status !== 'archived' && (
              <button
                disabled={isPending}
                onClick={() => handleStatus('read')}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors"
              >
                ✓ Mark as read
              </button>
            )}
            {msg.status !== 'replied' && (
              <button
                disabled={isPending}
                onClick={() => handleStatus('replied')}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors"
              >
                ↩ Mark as replied
              </button>
            )}
            {msg.status !== 'archived' && (
              <button
                disabled={isPending}
                onClick={() => handleStatus('archived')}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Archive
              </button>
            )}
            {msg.status === 'archived' && (
              <button
                disabled={isPending}
                onClick={() => handleStatus('unread')}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-100 disabled:opacity-50 transition-colors"
              >
                ↺ Restore
              </button>
            )}
            {isPending && <span className="text-xs text-gray-400">Saving…</span>}
          </div>
          <div className="mt-3">
            <a
              href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
              className="text-xs text-teal-600 underline underline-offset-2 hover:text-teal-700"
            >
              Reply via email →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

interface AdminMessagesClientProps {
  messages: ContactMessage[]
}

export default function AdminMessagesClient({ messages }: AdminMessagesClientProps) {
  const [filter, setFilter] = useState<MessageStatus | 'all'>('all')

  const filtered =
    filter === 'all' ? messages : messages.filter((m) => m.status === filter)

  const counts = {
    all: messages.length,
    unread: messages.filter((m) => m.status === 'unread').length,
    read: messages.filter((m) => m.status === 'read').length,
    replied: messages.filter((m) => m.status === 'replied').length,
    archived: messages.filter((m) => m.status === 'archived').length,
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Contact Messages</h1>
        <p className="text-sm text-gray-500 mt-0.5">{messages.length} total messages</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'unread', 'read', 'replied', 'archived'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors capitalize ${
              filter === s
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {s === 'all' ? 'All' : STATUS_LABELS[s]}
            {counts[s] > 0 && (
              <span className="ml-1.5 opacity-70">{counts[s]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Messages list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center text-gray-400 text-sm">
          No {filter === 'all' ? '' : filter} messages
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((msg) => (
            <MessageRow key={msg.id} msg={msg} />
          ))}
        </div>
      )}
    </div>
  )
}
