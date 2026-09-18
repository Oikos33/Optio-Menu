// Supabase Storage image loader for next/image
// Automatically transforms images via Supabase's CDN
export default function supabaseLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}) {
  // If it's already a full URL (external), return as-is
  if (src.startsWith('http')) return src

  // If it's a placeholder, return as-is
  if (src.startsWith('/')) return src

  const params = new URLSearchParams({
    width: String(width),
    quality: String(quality || 80),
    format: 'webp',
  })

  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/render/image/public/${src}?${params}`
}
