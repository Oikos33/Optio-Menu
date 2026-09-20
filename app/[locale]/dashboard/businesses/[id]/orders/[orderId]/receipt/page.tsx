import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import PrintButton from '@/components/menu/PrintButton'

interface Props {
  params: Promise<{ locale: string; id: string; orderId: string }>
}

export const metadata: Metadata = {
  title: 'Receipt — Optio Menu',
}

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number | null
  notes: string | null
}

interface OrderData {
  id: string
  status: string
  total: number | null
  notes: string | null
  created_at: string
  table_name: string | null
  tip_amount: number | null
  order_items: OrderItem[]
}

interface BusinessData {
  id: string
  name: string
  logo_path: string | null
  address: string | null
  currency: string
}

function formatAmt(n: number, currency: string): string {
  const cfg: Record<string, { symbol: string; decimals: number }> = {
    JPY: { symbol: '¥', decimals: 0 },
    KRW: { symbol: '₩', decimals: 0 },
    IDR: { symbol: 'Rp', decimals: 0 },
    VND: { symbol: '₫', decimals: 0 },
    USD: { symbol: '$', decimals: 2 },
    EUR: { symbol: '€', decimals: 2 },
    GBP: { symbol: '£', decimals: 2 },
  }
  const c = cfg[currency] ?? { symbol: currency + ' ', decimals: 2 }
  return `${c.symbol}${n.toFixed(c.decimals)}`
}

export default async function ReceiptPage({ params }: Props) {
  const { id, orderId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify business ownership
  const { data: business } = await (supabase as any)
    .from('businesses')
    .select('id, name, logo_path, address, currency')
    .eq('id', id)
    .eq('user_id', user.id)
    .single() as { data: BusinessData | null }

  if (!business) notFound()

  // Fetch order with items
  const { data: order } = await (supabase as any)
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .eq('business_id', id)
    .single() as { data: OrderData | null }

  if (!order) notFound()

  const currency = business.currency ?? 'JPY'
  const subtotal = order.order_items.reduce(
    (sum: number, i: OrderItem) => sum + (i.price ?? 0) * i.quantity,
    0
  )
  const tipAmount = order.tip_amount ?? 0
  const total = order.total ?? subtotal + tipAmount

  const orderDate = new Date(order.created_at).toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  return (
    <>
      {/* Print-specific global styles injected into <head> via Next.js */}
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .receipt-card {
            box-shadow: none !important;
            border-radius: 0 !important;
            max-width: 100% !important;
          }
          nav, header, footer { display: none !important; }
          #__next > div > nav { display: none !important; }
        }
      `}</style>

      <div className="min-h-screen bg-gray-100 flex items-start justify-center py-8 px-4">
        <div className="receipt-card w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

          {/* Print button — hidden when printing */}
          <PrintButton />

          {/* Restaurant Header */}
          <div className="text-center border-b border-gray-100 pb-5 mb-5">
            {business.logo_path && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`${supabaseUrl}/storage/v1/object/public/${business.logo_path}`}
                alt={business.name}
                className="w-14 h-14 rounded-full object-cover mx-auto mb-2"
              />
            )}
            <h1 className="text-xl font-extrabold text-teal-700">{business.name}</h1>
            {business.address && (
              <p className="text-xs text-gray-400 mt-0.5">{business.address}</p>
            )}
            <p className="text-xs text-gray-400 mt-0.5">{orderDate}</p>
            {order.table_name && (
              <p className="text-xs text-teal-600 font-semibold mt-1">🪑 {order.table_name}</p>
            )}
            <span className="inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </span>
          </div>

          {/* Items table */}
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-400 border-b border-gray-100">
                <th className="text-left py-2 font-medium">Item</th>
                <th className="text-center py-2 font-medium w-10">Qty</th>
                <th className="text-right py-2 font-medium">Price</th>
              </tr>
            </thead>
            <tbody>
              {order.order_items.map((item: OrderItem) => (
                <tr key={item.id} className="border-b border-gray-50">
                  <td className="py-2">
                    <div className="font-medium text-gray-800">{item.name}</div>
                    {item.notes && (
                      <div className="text-xs text-amber-600 mt-0.5">📝 {item.notes}</div>
                    )}
                  </td>
                  <td className="py-2 text-center text-gray-500">{item.quantity}</td>
                  <td className="py-2 text-right font-semibold text-gray-800">
                    {item.price != null ? formatAmt(item.price * item.quantity, currency) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Notes */}
          {order.notes && (
            <div className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-3">
              📝 {order.notes}
            </div>
          )}

          {/* Totals */}
          <div className="border-t border-gray-200 pt-3 space-y-1">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>{formatAmt(subtotal, currency)}</span>
            </div>
            {tipAmount > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Tip</span>
                <span>{formatAmt(tipAmount, currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-extrabold text-teal-700 border-t-2 border-teal-600 mt-2 pt-2">
              <span>Total</span>
              <span>{formatAmt(total, currency)}</span>
            </div>
          </div>

          <p className="text-center text-xs text-gray-300 mt-6">
            Thank you for dining with us! · Powered by Optio Menu
          </p>
        </div>
      </div>
    </>
  )
}
