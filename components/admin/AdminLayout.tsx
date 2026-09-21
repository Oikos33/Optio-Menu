'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface AdminLayoutProps {
  children: React.ReactNode
  activeTab: 'overview' | 'users' | 'messages'
  locale: string
}

const navItems = [
  { id: 'overview' as const, label: 'Overview', icon: '🏠', path: '/admin' },
  { id: 'users' as const, label: 'Users', icon: '👥', path: '/admin/users' },
  { id: 'messages' as const, label: 'Messages', icon: '📩', path: '/admin/messages' },
] as const

export default function AdminLayout({ children, activeTab, locale }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-slate-900 text-white sticky top-0 z-20 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-lg tracking-tight">
              <span className="text-teal-400">Optio</span>
              <span className="text-white">Menu</span>
            </span>
            <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
              🛡️ Admin Panel
            </span>
          </div>
          <Link
            href={`/${locale}`}
            className="text-slate-400 hover:text-white text-sm transition-colors flex items-center gap-1"
          >
            ← Back to site
          </Link>
        </div>

        {/* Mobile nav tabs */}
        <nav className="lg:hidden flex border-t border-slate-700 overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={`/${locale}${item.path}`}
              className={`flex-1 min-w-[80px] flex flex-col items-center gap-0.5 py-2 px-3 text-xs font-medium transition-colors ${
                activeTab === item.id
                  ? 'text-teal-400 border-b-2 border-teal-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 py-6 gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-52 flex-shrink-0">
          <nav className="bg-slate-900 rounded-2xl p-2 flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={`/${locale}${item.path}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === item.id
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
            {/* Placeholder future item */}
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 cursor-not-allowed select-none mt-1">
              <span className="text-base">📊</span>
              <span>Analytics</span>
              <span className="ml-auto text-[10px] bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded">soon</span>
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}
