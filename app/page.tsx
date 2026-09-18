import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ── Nav ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-extrabold text-xl tracking-tight">
            <span className="text-indigo-600">Optio</span>Menu
          </span>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900">
              Sign in
            </Link>
            <Link
              href="/login"
              className="bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          ✨ Free forever — no credit card required
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-6">
          Your restaurant menu,<br />
          <span className="text-indigo-600">one QR scan away</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          Create a beautiful digital menu in minutes. Share it with a QR code.
          Let guests browse, favorite dishes, and leave comments — all for free.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="bg-indigo-600 text-white font-bold px-8 py-4 rounded-2xl text-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            Create your menu →
          </Link>
          <a
            href="#how-it-works"
            className="bg-gray-100 text-gray-700 font-semibold px-8 py-4 rounded-2xl text-lg hover:bg-gray-200 transition-colors"
          >
            See how it works
          </a>
        </div>
      </section>

      {/* ── Mock preview ────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 pb-20">
        <div className="bg-gradient-to-b from-indigo-50 to-white rounded-3xl border border-indigo-100 p-6 text-center shadow-xl shadow-indigo-100">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-sm mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">S</div>
              <div className="text-left">
                <p className="font-bold text-gray-900">Sunset Café</p>
                <p className="text-xs text-gray-400">Japanese · Shibuya, Tokyo</p>
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
                  <span className="text-sm font-bold text-indigo-600">{item.price}</span>
                  <span className="text-gray-300">♡</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">Your menu looks like this on any phone, instantly</p>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-center mb-12">Everything you need. Nothing you don't.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '📱', title: 'Instant QR Code', desc: 'Every menu gets a unique QR code. Download it, print it, and stick it on your table.' },
              { icon: '🌍', title: '15 Languages', desc: 'Your menu auto-translates for international guests. No extra work required.' },
              { icon: '💬', title: 'Guest Comments', desc: 'Guests can comment on dishes in real time — like a built-in review system for each item.' },
              { icon: '❤️', title: 'Favorite Dishes', desc: 'Signed-in guests can save their favourite dishes to re-order or remember for next time.' },
              { icon: '📸', title: 'Photo Menus', desc: 'Upload a photo for every dish. Looks gorgeous on any device.' },
              { icon: '⚡', title: 'Instant Updates', desc: 'Change prices, add items, toggle availability — updates appear live within 60 seconds.' },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold mb-12">Up and running in 3 steps</h2>
          <div className="space-y-6">
            {[
              { step: '1', title: 'Create your restaurant', desc: 'Sign up free, enter your name, address, and upload your logo.' },
              { step: '2', title: 'Add your menu items', desc: 'Add dishes with photos, descriptions, and prices. Organise by section.' },
              { step: '3', title: 'Share your QR code', desc: 'Download and print your QR code. Guests scan it to see your menu instantly.' },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-5 text-left bg-gray-50 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-extrabold text-lg flex items-center justify-center flex-shrink-0">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{s.title}</h3>
                  <p className="text-sm text-gray-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="bg-indigo-600 py-20 text-center text-white">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-4xl font-extrabold mb-4">Ready to go digital?</h2>
          <p className="text-indigo-200 text-lg mb-8">
            Join restaurants already using Optio Menu. Free forever.
          </p>
          <Link
            href="/login"
            className="inline-block bg-white text-indigo-700 font-bold px-10 py-4 rounded-2xl text-lg hover:bg-indigo-50 transition-colors shadow-lg"
          >
            Create your free menu →
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} Optio Menu · <a href="mailto:hello@optio-menu.ai" className="hover:text-gray-600">hello@optio-menu.ai</a></p>
      </footer>

    </div>
  )
}
