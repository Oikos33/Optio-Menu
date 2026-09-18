import Link from 'next/link'

interface Props {
  businessId: string
  primary?: boolean
}

export default function AddItemButton({ businessId, primary }: Props) {
  return (
    <Link
      href={`/dashboard/businesses/${businessId}/items/new`}
      className={`text-sm font-semibold px-3 py-1.5 rounded-xl transition-colors ${
        primary
          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
          : 'bg-indigo-600 text-white hover:bg-indigo-700'
      }`}
    >
      + Add item
    </Link>
  )
}
