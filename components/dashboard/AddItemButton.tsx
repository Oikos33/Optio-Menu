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
          ? 'bg-teal-600 text-white hover:bg-teal-700'
          : 'bg-teal-600 text-white hover:bg-teal-700'
      }`}
    >
      + Add item
    </Link>
  )
}
