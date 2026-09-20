import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import type { BusinessWithType } from '@/types/database'
import { getImageUrl } from '@/lib/utils'
import { getTranslations } from 'next-intl/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/dashboard')

  const t = await getTranslations('DashboardPage')

  const { data: businesses } = await supabase
    .from('businesses')
    .select('*, business_types(id, name)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-extrabold text-xl text-teal-600 tracking-tight flex items-center gap-2">
            <Image src="/logo.png" alt="Optio Menu" width={32} height={32} className="rounded-lg" />
            <span className="text-teal-600">Optio</span><span className="text-gray-900">Menu</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block">{user!.email}</span>
            <form action="/auth/signout" method="POST">
              <button className="text-sm text-gray-400 hover:text-gray-600">{t('signOut')}</button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('myMenus')}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {businesses?.length !== 1
                ? t('restaurantCountPlural', { count: businesses?.length ?? 0 })
                : t('restaurantCount', { count: 1 })}
            </p>
          </div>
          <Link
            href="/dashboard/businesses/new"
            className="bg-teal-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-teal-700 transition-colors"
          >
            {t('newRestaurant')}
          </Link>
        </div>

        {!businesses?.length ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-4xl mb-3">🍽️</p>
            <h2 className="font-semibold text-gray-700 mb-1">{t('empty.heading')}</h2>
            <p className="text-sm text-gray-500 mb-4">{t('empty.subtitle')}</p>
            <Link
              href="/dashboard/businesses/new"
              className="inline-block bg-teal-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-teal-700"
            >
              {t('empty.cta')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(businesses as BusinessWithType[]).map(biz => (
              <Link
                key={biz.id}
                href={`/dashboard/businesses/${biz.id}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-teal-200 hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-3">
                  {biz.logo_path ? (
                    <img
                      src={getImageUrl(biz.logo_path, { width: 80 })}
                      alt={biz.name}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0 text-teal-600 text-xl font-bold">
                      {biz.name[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 group-hover:text-teal-600 transition-colors truncate">
                      {biz.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">/menu/{biz.slug}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                        biz.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {biz.is_active ? t('status.active') : t('status.inactive')}
                      </span>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-teal-400 ml-auto mt-1 flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
