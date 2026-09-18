import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { GoogleAnalytics } from '@next/third-parties/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Optio Menu — Free QR Menu for Restaurants',
  description: 'Create a beautiful digital menu for your restaurant. Free forever. Instant QR code.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://optio-menu.ai'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.className} antialiased bg-gray-50`}>
        {children}
      </body>
      {/* Google Analytics — only loads in production when GA_ID is set */}
      {process.env.NEXT_PUBLIC_GA_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      )}
    </html>
  )
}
