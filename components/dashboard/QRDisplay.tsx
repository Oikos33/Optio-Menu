'use client'

import { QRCodeCanvas } from 'qrcode.react'
import { useRef } from 'react'

interface Props {
  slug: string
  appUrl: string
}

export default function QRDisplay({ slug, appUrl }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const menuUrl = `${appUrl}/menu/${slug}`

  const download = () => {
    const canvas = document.querySelector<HTMLCanvasElement>('#qr-canvas canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `${slug}-qr.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
      <h3 className="font-semibold text-gray-700 text-sm mb-4">QR Code</h3>
      <div id="qr-canvas" className="flex justify-center mb-3">
        <QRCodeCanvas
          value={menuUrl}
          size={160}
          fgColor="#1e1b4b"
          level="M"
          includeMargin
        />
      </div>
      <button
        onClick={download}
        className="w-full bg-teal-600 text-white text-sm font-semibold py-2 rounded-xl hover:bg-teal-700 transition-colors mb-2"
      >
        ⬇ Download PNG
      </button>
      <p className="text-xs text-gray-400 break-all">{menuUrl}</p>
    </div>
  )
}
