'use client'

import { useEffect, useRef } from 'react'

interface Props {
  lat: number
  lng: number
  name: string
  address?: string | null
}

export default function MapSection({ lat, lng, name, address }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Dynamic import to avoid SSR issues with Leaflet
    import('leaflet').then(L => {
      import('leaflet/dist/leaflet.css')
      if (!mapRef.current) return

      // Avoid double-init
      if ((mapRef.current as any)._leaflet_id) return

      const map = L.map(mapRef.current).setView([lat, lng], 15)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)

      const icon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      })
      L.marker([lat, lng], { icon }).addTo(map).bindPopup(name)
    })
  }, [lat, lng, name])

  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">📍 Location</h3>
      {address && <p className="text-xs text-gray-500 mb-2">{address}</p>}
      <div
        ref={mapRef}
        className="w-full h-48 rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
      />
    </div>
  )
}
