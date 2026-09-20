'use client'

import { QRCodeCanvas } from 'qrcode.react'
import { useRef, useState, useTransition } from 'react'
import { updateTableStatus, deleteTable } from '@/app/actions/tables'
import { useTranslations } from 'next-intl'

export type TableRow = {
  id: string
  business_id: string
  name: string
  token: string
  capacity: number | null
  section: string | null
  status: string
  is_active: boolean
}

const STATUS_CONFIG = {
  available: { label: 'Available', emoji: '🟢', bg: 'bg-green-100', text: 'text-green-700' },
  occupied: { label: 'Occupied', emoji: '🔴', bg: 'bg-red-100', text: 'text-red-700' },
  reserved: { label: 'Reserved', emoji: '🟡', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  needs_cleaning: { label: 'Needs Cleaning', emoji: '🧹', bg: 'bg-orange-100', text: 'text-orange-700' },
} as const

interface Props {
  table: TableRow
  appUrl: string
  slug: string
}

export default function TableCard({ table, appUrl, slug }: Props) {
  const t = useTranslations('TableManagement')
  const [status, setStatus] = useState(table.status)
  const [isPending, startTransition] = useTransition()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const canvasId = `qr-table-${table.id}`

  const tableUrl = `${appUrl}/menu/${slug}?t=${table.token}`
  const statusCfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.available

  const downloadQR = () => {
    const canvas = document.querySelector<HTMLCanvasElement>(`#${canvasId} canvas`)
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `table-${table.name.replace(/\s+/g, '-').toLowerCase()}-qr.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const changeStatus = (newStatus: string) => {
    setStatus(newStatus) // optimistic
    startTransition(() => updateTableStatus(table.id, newStatus))
  }

  const handleDelete = () => {
    startTransition(() => deleteTable(table.id, table.business_id))
  }

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-opacity ${isPending ? 'opacity-60' : ''} border-gray-100`}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between">
        <div>
          <h3 className="font-bold text-gray-900 text-lg leading-tight">{table.name}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.text}`}>
              {statusCfg.emoji} {t(`status.${status}` as any)}
            </span>
            {table.capacity && (
              <span className="text-xs text-gray-400">👥 {table.capacity}</span>
            )}
            {table.section && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{table.section}</span>
            )}
          </div>
        </div>
        {/* Delete */}
        <div className="relative">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                className="text-xs text-red-600 font-semibold hover:text-red-800"
              >
                {t('confirm')}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                {t('cancel')}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-gray-300 hover:text-red-400 transition-colors"
              title={t('deleteTable')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* QR Code */}
      <div className="px-4 pb-3 flex items-center gap-4">
        <div id={canvasId} className="flex-shrink-0">
          <QRCodeCanvas
            value={tableUrl}
            size={96}
            fgColor="#0d9488"
            level="M"
            includeMargin
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 break-all leading-relaxed mb-2">{tableUrl}</p>
          <button
            onClick={downloadQR}
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 border border-teal-200 px-3 py-1.5 rounded-lg hover:bg-teal-50 transition-colors"
          >
            ⬇ {t('downloadQR')}
          </button>
        </div>
      </div>

      {/* Status quick-actions */}
      <div className="px-4 pb-4 grid grid-cols-2 gap-1.5">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => changeStatus(key)}
            disabled={status === key || isPending}
            className={`text-xs py-1.5 px-2 rounded-lg font-medium transition-colors ${
              status === key
                ? `${cfg.bg} ${cfg.text} cursor-default`
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            {cfg.emoji} {t(`status.${key}` as any)}
          </button>
        ))}
      </div>
    </div>
  )
}
