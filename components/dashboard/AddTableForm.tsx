'use client'

import { useState, useTransition, useRef } from 'react'
import { createTable } from '@/app/actions/tables'
import { useTranslations } from 'next-intl'

interface Props {
  businessId: string
}

export default function AddTableForm({ businessId }: Props) {
  const t = useTranslations('TableManagement')
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await createTable(formData)
        formRef.current?.reset()
        setOpen(false)
      } catch (err: any) {
        setError(err.message || 'Something went wrong')
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-teal-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-teal-700 transition-colors"
      >
        + {t('addTable')}
      </button>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-teal-200 shadow-md p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">{t('addTable')}</h3>
        <button onClick={() => { setOpen(false); setError('') }} className="text-gray-400 hover:text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
        <input type="hidden" name="businessId" value={businessId} />

        {error && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('tableName')} <span className="text-red-400">*</span>
          </label>
          <input
            name="name"
            required
            placeholder={t('tableNamePlaceholder')}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('capacity')}</label>
            <input
              name="capacity"
              type="number"
              min="1"
              max="50"
              placeholder="4"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('section')}</label>
            <input
              name="section"
              placeholder={t('sectionPlaceholder')}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 bg-teal-600 text-white font-semibold py-2 rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors text-sm"
          >
            {isPending ? t('creating') : t('createTable')}
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); setError('') }}
            className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            {t('cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}
