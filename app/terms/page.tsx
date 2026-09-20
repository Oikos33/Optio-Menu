import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — Optio Menu',
  description: 'Terms of service for Optio Menu',
}

export default function TermsPage() {
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

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: {updated}</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance</h2>
            <p>By creating an account or using Optio Menu, you agree to these Terms of Service. If you do not agree, do not use the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. The service</h2>
            <p>Optio Menu provides a free platform for restaurants and food businesses to create and share digital menus via QR codes. The service is provided "as is" with no uptime guarantee on the free tier.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Your account</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You are responsible for keeping your login credentials secure.</li>
              <li>You must provide accurate information when registering.</li>
              <li>One account per person or business entity.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Your content</h2>
            <p>You retain ownership of all menu content (text, photos, descriptions) you upload. By uploading content, you grant Optio Menu a license to display it to your menu guests. You are responsible for ensuring your content does not infringe third-party rights.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Prohibited uses</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Do not upload illegal, offensive, or misleading content.</li>
              <li>Do not attempt to disrupt or abuse the service.</li>
              <li>Do not use the service for purposes other than digital menu creation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Termination</h2>
            <p>We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time by contacting us.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Limitation of liability</h2>
            <p>Optio Menu is not liable for any indirect, incidental, or consequential damages arising from your use of the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Changes</h2>
            <p>We may update these terms from time to time. Continued use of the service after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Contact</h2>
            <p><a href="mailto:hello@optio-menu.ai" className="text-indigo-600 hover:underline">hello@optio-menu.ai</a><br />Oikos Ltd, Japan</p>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-400">
        <Link href="/" className="hover:text-gray-600">← Back to Optio Menu</Link>
      </footer>
    </div>
  )
}
