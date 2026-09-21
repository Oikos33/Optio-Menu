'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Business } from '@/types/database'

interface AdminUsersTableProps {
  businesses: Business[]
}

export default function AdminUsersTable({ businesses: initial }: AdminUsersTableProps) {
  const [businesses, setBusinesses] = useState(initial)
  const [suspending, setSuspending] = useState<string | null>(null)

  async function handleSuspend(id: string) {
    setSuspending(id)
    const supabase = createClient()
    const { error } = await (supabase as any)
      .from('businesses')
      .update({ is_active: false })
      .eq('id', id)
    if (!error) {
      setBusinesses((prev) =>
        prev.map((b) => (b.id === id ? { ...b, is_active: false } : b))
      )
    }
    setSuspending(null)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Restaurant Users</h1>
        <p className="text-sm text-gray-500 mt-0.5">{businesses.length} registered restaurants</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {businesses.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No restaurants yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3">Restaurant</th>
                  <th className="px-5 py-3">Slug</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {businesses.map((biz) => (
                  <tr key={biz.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {biz.name[0]?.toUpperCase() ?? '?'}
                        </div>
                        <span className="font-medium text-gray-900 truncate max-w-[160px]">
                          {biz.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500 font-mono text-xs">{biz.slug}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          biz.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {biz.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(biz.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/menu/${biz.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:text-teal-700 text-xs font-medium underline underline-offset-2"
                        >
                          View menu ↗
                        </a>
                        {biz.is_active && (
                          <button
                            onClick={() => handleSuspend(biz.id)}
                            disabled={suspending === biz.id}
                            className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {suspending === biz.id ? 'Suspending…' : 'Suspend'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
