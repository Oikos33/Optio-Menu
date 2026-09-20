'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl text-base mb-6 transition-colors"
    >
      🖨️ Print Receipt
    </button>
  )
}
