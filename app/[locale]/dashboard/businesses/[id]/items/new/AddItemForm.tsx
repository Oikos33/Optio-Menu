'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { getTranslation } from '@/lib/utils'
import type { MenuSection } from '@/types/database'
import { useTranslations } from 'next-intl'

interface Props {
  businessId: string
  userId: string
  sections: MenuSection[]
}

export default function AddItemForm({ businessId, userId, sections }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslations('AddItemForm')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')

    try {
      let image_path: string | null = null

      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const path = `${userId}/${businessId}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('menu-items')
          .upload(path, imageFile, { upsert: false })
        if (uploadError) throw uploadError
        image_path = path
        setUploadProgress(100)
      }

      const { error: insertError } = await (supabase as any)
        .from('menu_items')
        .insert({
          business_id: businessId,
          menu_section_id: sectionId || null,
          name: { en: name.trim() },
          description: description.trim() ? { en: description.trim() } : null,
          price: price ? parseFloat(price) : null,
          image_path,
          sort_order: 0,
        })

      if (insertError) throw insertError
      router.push(`/dashboard/businesses/${businessId}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || t('somethingWentWrong'))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>
      )}

      {/* Image upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('photo')}</label>
        {imagePreview ? (
          <div className="relative">
            <img src={imagePreview} alt="Preview"
              className="w-full max-h-56 object-cover rounded-xl border border-gray-100" />
            <button
              type="button"
              onClick={() => { setImageFile(null); setImagePreview(null) }}
              className="absolute top-2 right-2 bg-white/80 backdrop-blur rounded-full w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-white shadow"
            >✕</button>
          </div>
        ) : (
          <label className="flex flex-col items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-8 cursor-pointer hover:border-teal-300 transition-colors">
            <span className="text-3xl">📷</span>
            <span className="text-sm text-gray-500">{t('clickToUploadPhoto')}</span>
            <span className="text-xs text-gray-400">{t('photoHint')}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
        )}
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('itemName')}</label>
        <input
          type="text" required maxLength={255}
          value={name} onChange={e => setName(e.target.value)}
          placeholder={t('itemNamePlaceholder')}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
        <textarea
          rows={2} maxLength={2000}
          value={description} onChange={e => setDescription(e.target.value)}
          placeholder={t('descriptionPlaceholder')}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none"
        />
      </div>

      {/* Price + Section */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('price')}</label>
          <input
            type="number" step="0.01" min="0" max="99999"
            value={price} onChange={e => setPrice(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
          />
        </div>
        {sections.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('section')}</label>
            <select
              value={sectionId} onChange={e => setSectionId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
            >
              <option value="">{t('noSection')}</option>
              {sections.map(s => (
                <option key={s.id} value={s.id}>
                  {getTranslation(s.name, 'en')}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="pt-2">
        <button
          type="submit" disabled={saving}
          className="w-full bg-teal-600 text-white font-semibold py-3 rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          {saving ? (uploadProgress > 0 ? t('uploading', { progress: uploadProgress }) : t('saving')) : t('addToMenu')}
        </button>
      </div>
    </form>
  )
}
