import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'

export default async function HomePage() {
  const t = await getTranslations('HomePage')

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ── Nav ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-extrabold text-xl tracking-tight flex items-center gap-2">
            <Image src="/logo.png" alt="Optio Menu" width={32} height={32} className="rounded-lg" />
            <span className="text-teal-600">Optio</span>Menu
          </span>
          <div className="flex items-center gap-3">
            <Link href="/rankings" className="text-sm text-gray-500 hover:text-teal-600 font-medium hidden sm:inline">
              🏆 Rankings
            </Link>
            <Link href="/contact" className="text-sm text-gray-500 hover:text-teal-600 font-medium hidden sm:inline">
              Contact
            </Link>
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900">
              {t('nav.signIn')}
            </Link>
            <Link
              href="/login"
              className="bg-teal-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-teal-700 transition-colors"
            >
              {t('nav.getStartedFree')}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          {t('hero.badge')}
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-6">
          {t('hero.title')}<br />
          <span className="text-teal-600">{t('hero.titleHighlight')}</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          {t('hero.subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="bg-teal-600 text-white font-bold px-8 py-4 rounded-2xl text-lg hover:bg-teal-700 transition-colors shadow-lg shadow-teal-200"
          >
            {t('hero.ctaPrimary')}
          </Link>
          <a
            href="#how-it-works"
            className="bg-gray-100 text-gray-700 font-semibold px-8 py-4 rounded-2xl text-lg hover:bg-gray-200 transition-colors"
          >
            {t('hero.ctaSecondary')}
          </a>
        </div>
      </section>

      {/* ── Mock preview ────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 pb-20">
        <div className="bg-gradient-to-b from-teal-50 to-white rounded-3xl border border-teal-100 p-6 text-center shadow-xl shadow-teal-100">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-sm mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold text-xl">S</div>
              <div className="text-left">
                <p className="font-bold text-gray-900">{t('preview.mockRestaurantName')}</p>
                <p className="text-xs text-gray-400">{t('preview.mockRestaurantType')}</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { name: 'Tonkotsu Ramen', price: '¥980', emoji: '🍜' },
                { name: 'Gyoza (6pc)', price: '¥480', emoji: '🥟' },
                { name: 'Matcha Latte', price: '¥580', emoji: '🍵' },
              ].map(item => (
                <div key={item.name} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <span className="text-xl">{item.emoji}</span>
                  <span className="flex-1 text-sm font-medium text-gray-900 text-left">{item.name}</span>
                  <span className="text-sm font-bold text-teal-600">{item.price}</span>
                  <span className="text-gray-300">♡</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">{t('preview.caption')}</p>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-center mb-12">{t('features.heading')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '📱', titleKey: 'features.items.qr.title', descKey: 'features.items.qr.desc' },
              { icon: '🌍', titleKey: 'features.items.languages.title', descKey: 'features.items.languages.desc' },
              { icon: '💬', titleKey: 'features.items.comments.title', descKey: 'features.items.comments.desc' },
              { icon: '❤️', titleKey: 'features.items.favorites.title', descKey: 'features.items.favorites.desc' },
              { icon: '📸', titleKey: 'features.items.photos.title', descKey: 'features.items.photos.desc' },
              { icon: '⚡', titleKey: 'features.items.updates.title', descKey: 'features.items.updates.desc' },
            ].map(f => (
              <div key={f.titleKey} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1">{t(f.titleKey as Parameters<typeof t>[0])}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{t(f.descKey as Parameters<typeof t>[0])}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold mb-12">{t('howItWorks.heading')}</h2>
          <div className="space-y-6">
            {[
              { step: '1', titleKey: 'howItWorks.steps.step1.title', descKey: 'howItWorks.steps.step1.desc' },
              { step: '2', titleKey: 'howItWorks.steps.step2.title', descKey: 'howItWorks.steps.step2.desc' },
              { step: '3', titleKey: 'howItWorks.steps.step3.title', descKey: 'howItWorks.steps.step3.desc' },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-5 text-left bg-gray-50 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-extrabold text-lg flex items-center justify-center flex-shrink-0">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{t(s.titleKey as Parameters<typeof t>[0])}</h3>
                  <p className="text-sm text-gray-500">{t(s.descKey as Parameters<typeof t>[0])}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="bg-teal-600 py-20 text-center text-white">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-4xl font-extrabold mb-4">{t('cta.heading')}</h2>
          <p className="text-teal-200 text-lg mb-8">
            {t('cta.subtitle')}
          </p>
          <Link
            href="/login"
            className="inline-block bg-white text-teal-700 font-bold px-10 py-4 rounded-2xl text-lg hover:bg-teal-50 transition-colors shadow-lg"
          >
            {t('cta.button')}
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400 space-y-2">
        <p>{t('footer.copyright', { year: new Date().getFullYear() })} · <a href={`mailto:${t('footer.email')}`} className="hover:text-gray-600">{t('footer.email')}</a></p>
        <p className="flex items-center justify-center gap-4">
          <Link href="/privacy" className="hover:text-gray-600">{t('footer.privacyPolicy')}</Link>
          <Link href="/terms" className="hover:text-gray-600">{t('footer.termsOfService')}</Link>
          <Link href="/contact" className="hover:text-gray-600">Contact</Link>
        </p>
      </footer>

    </div>
  )
}
