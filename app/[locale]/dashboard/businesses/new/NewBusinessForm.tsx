'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { slugify, getTranslation } from '@/lib/utils'
import type { BusinessType } from '@/types/database'
import { useTranslations } from 'next-intl'

interface Props {
  userId: string
  businessTypes: BusinessType[]
}

export default function NewBusinessForm({ userId, businessTypes }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslations('NewBusinessForm')

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [businessTypeId, setBusinessTypeId] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleNameChange = (v: string) => {
    setName(v)
    if (!slugEdited) setSlug(slugify(v))
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) return
    setSaving(true)
    setError('')

    try {
      // Upload logo if provided
      let logo_path: string | null = null
      if (logoFile) {
        const ext = logoFile.name.split('.').pop()
        const path = `logos/${userId}/${slug}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('menu-items')
          .upload(path, logoFile, { upsert: true })
        if (uploadError) throw uploadError
        logo_path = path
      }

      // Create business
      const { data: business, error: insertError } = await (supabase as any)
        .from('businesses')
        .insert({
          user_id: userId,
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          address: address.trim() || null,
          business_type_id: businessTypeId || null,
          logo_path,
          is_active: true,
        })
        .select('id')
        .single()

      if (insertError) throw insertError
      router.push(`/dashboard/businesses/${business.id}`)
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

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('restaurantName')}</label>
        <input
          type="text" required maxLength={255}
          value={name} onChange={e => handleNameChange(e.target.value)}
          placeholder={t('restaurantNamePlaceholder')}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('menuUrl')}
          <span className="text-gray-400 font-normal ml-1">{t('menuUrlHint')}</span>
        </label>
        <input
          type="text" required maxLength={100}
          value={slug}
          onChange={e => { setSlug(slugify(e.target.value)); setSlugEdited(true) }}
          placeholder={t('menuUrlPlaceholder')}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-300"
        />
      </div>

      {/* Business type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('type')}</label>
        <select
          value={businessTypeId}
          onChange={e => setBusinessTypeId(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
        >
          <option value="">{t('selectType')}</option>
          {businessTypes.map(bt => (
            <option key={bt.id} value={bt.id}>
              {getTranslation(bt.name, 'en')}
            </option>
          ))}
        </select>
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

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('address')}</label>
        <input
          type="text" maxLength={500}
          value={address} onChange={e => setAddress(e.target.value)}
          placeholder={t('addressPlaceholder')}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
        />
      </div>

      {/* Logo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('logo')}</label>
        {logoPreview ? (
          <div className="flex items-center gap-3">
            <img src={logoPreview} className="w-16 h-16 rounded-xl object-cover border" alt="Logo preview" />
            <button type="button" onClick={() => { setLogoFile(null); setLogoPreview(null) }}
              className="text-sm text-red-400 hover:text-red-600">{t('removeLogo')}</button>
          </div>
        ) : (
          <label className="flex flex-col items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-6 cursor-pointer hover:border-teal-300 transition-colors">
            <span className="text-2xl">📷</span>
            <span className="text-sm text-gray-500">{t('clickToUploadLogo')}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </label>
        )}
      </div>

      <div className="pt-2">
        <button
          type="submit" disabled={saving}
          className="w-full bg-teal-600 text-white font-semibold py-3 rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          {saving ? t('creating') : t('createRestaurant')}
        </button>
      </div>
    </form>
  )
}
