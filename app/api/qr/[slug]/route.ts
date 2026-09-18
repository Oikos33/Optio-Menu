import { NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // Verify business exists
  const supabase = await createClient()
  const { data: business } = await supabase
    .from('businesses')
    .select('slug, name')
    .eq('slug', slug)
    .single()

  if (!business) {
    return new NextResponse('Not found', { status: 404 })
  }

  const menuUrl = `${process.env.NEXT_PUBLIC_APP_URL}/menu/${slug}`

  // Generate QR code as PNG buffer
  const pngBuffer = await QRCode.toBuffer(menuUrl, {
    type: 'png',
    width: 512,
    margin: 2,
    color: {
      dark: '#1e1b4b',  // indigo-950
      light: '#ffffff',
    },
  })

  return new NextResponse(new Uint8Array(pngBuffer), {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="${slug}-qr.png"`,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
