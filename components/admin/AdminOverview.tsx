interface RecentSignup {
  name: string
  slug: string
  createdAt: string
}

interface AdminStats {
  totalRestaurants: number
  activeRestaurants: number
  ordersToday: number
  ordersThisWeek: number
  unreadMessages: number
  reservationsToday: number
  recentSignups: RecentSignup[]
}

interface AdminOverviewProps {
  stats: AdminStats
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: string
  label: string
  value: number | string
  sub?: string
  color: string
}) {
  return (
    <div className={`bg-white rounded-2xl border ${color} p-5 shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  )
}

export default function AdminOverview({ stats }: AdminOverviewProps) {
  const {
    totalRestaurants,
    activeRestaurants,
    ordersToday,
    ordersThisWeek,
    unreadMessages,
    reservationsToday,
    recentSignups,
  } = stats

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
        <p className="text-sm text-gray-500 mt-0.5">Real-time snapshot of your platform</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="🏪"
          label="Restaurants"
          value={totalRestaurants}
          sub={`${activeRestaurants} active`}
          color="border-teal-100"
        />
        <StatCard
          icon="📦"
          label="Orders Today"
          value={ordersToday}
          sub={`${ordersThisWeek} this week`}
          color="border-blue-100"
        />
        <StatCard
          icon="📅"
          label="Reservations Today"
          value={reservationsToday}
          color="border-purple-100"
        />
        <StatCard
          icon="📩"
          label="Unread Messages"
          value={unreadMessages}
          color={unreadMessages > 0 ? 'border-yellow-200' : 'border-gray-100'}
        />
      </div>

      {/* Recent signups */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900">Recent Signups</h2>
          <p className="text-xs text-gray-400 mt-0.5">Last 10 restaurants registered</p>
        </div>
        {recentSignups.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">No signups yet</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentSignups.map((r) => (
              <div key={r.slug} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-sm flex-shrink-0">
                    {r.name[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.name}</p>
                    <p className="text-xs text-gray-400 truncate">/menu/{r.slug}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(r.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
