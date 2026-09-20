// Supabase Storage image loader for next/image
// Uses standard public storage URLs (works on all Supabase plans)
export default function supabaseLoader({
  src,
}: {
  src: string
  width: number
  quality?: number
}) {
  // If it's already a full URL (external image or placeholder), return as-is
  if (src.startsWith('http') || src.startsWith('/')) return src

  // Build the plain public storage URL — all images are in the 'menu-items' bucket
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/menu-items/${src}`
}
