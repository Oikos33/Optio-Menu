import { Link } from '@/i18n/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Optio Menu',
  description: 'Privacy policy for Optio Menu',
}

export default function PrivacyPage() {
  const updated = 'September 20, 2026'

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 py-4">
        <div className="max-w-3xl mx-auto px-4">
          <Link href="/" className="font-extrabold text-xl tracking-tight">
            <span className="text-indigo-600">Optio</span>Menu
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12 prose prose-gray">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: {updated}</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Who we are</h2>
            <p>Optio Menu (<strong>optio-menu.ai</strong>) is a free digital menu platform for restaurants and food businesses operated by Oikos Ltd. We help businesses create QR-code menus that guests can view on any device.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. What data we collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Account data:</strong> When you sign up, we collect your email address and, if you use Google Sign-In, your name and profile picture.</li>
              <li><strong>Business data:</strong> Restaurant name, address, menu items, photos, and descriptions you enter.</li>
              <li><strong>Guest activity:</strong> Favorite items and comments left by guests on menu pages.</li>
              <li><strong>Usage data:</strong> Page views and interactions collected via Google Analytics (anonymised IP).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. How we use your data</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To provide and operate the Optio Menu service.</li>
              <li>To display your menu to guests who scan your QR code.</li>
              <li>To send transactional emails (e.g. password reset).</li>
              <li>To improve the service through anonymised analytics.</li>
            </ul>
            <p className="mt-3">We do <strong>not</strong> sell your data to third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Third-party services</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Supabase</strong> — database, authentication, and file storage (EU/US servers).</li>
              <li><strong>Vercel</strong> — web hosting and CDN.</li>
              <li><strong>Google Analytics</strong> — anonymised usage analytics.</li>
              <li><strong>Google OAuth</strong> — optional sign-in method.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Cookies</h2>
            <p>We use session cookies required for authentication and Google Analytics cookies for usage measurement. No advertising cookies are used.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Data retention</h2>
            <p>Your data is retained for as long as your account is active. You may delete your account and all associated data at any time by contacting us.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Your rights</h2>
            <p>You have the right to access, correct, or delete your personal data. To exercise these rights, email us at <a href="mailto:hello@optio-menu.ai" className="text-indigo-600 hover:underline">hello@optio-menu.ai</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Contact</h2>
            <p>For any privacy-related questions:<br />
              <a href="mailto:hello@optio-menu.ai" className="text-indigo-600 hover:underline">hello@optio-menu.ai</a><br />
              Oikos Ltd, Japan
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-400">
        <Link href="/" className="hover:text-gray-600">← Back to Optio Menu</Link>
      </footer>
    </div>
  )
}
