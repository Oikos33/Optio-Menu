// Currency formatting and conversion utilities

export const CURRENCIES: Record<string, { symbol: string; name: string; decimals: number }> = {
  JPY: { symbol: '¥', name: 'Japanese Yen', decimals: 0 },
  USD: { symbol: '$', name: 'US Dollar', decimals: 2 },
  EUR: { symbol: '€', name: 'Euro', decimals: 2 },
  GBP: { symbol: '£', name: 'British Pound', decimals: 2 },
  KRW: { symbol: '₩', name: 'Korean Won', decimals: 0 },
  CNY: { symbol: '¥', name: 'Chinese Yuan', decimals: 2 },
  AUD: { symbol: 'A$', name: 'Australian Dollar', decimals: 2 },
  SGD: { symbol: 'S$', name: 'Singapore Dollar', decimals: 2 },
  HKD: { symbol: 'HK$', name: 'Hong Kong Dollar', decimals: 2 },
  THB: { symbol: '฿', name: 'Thai Baht', decimals: 2 },
  IDR: { symbol: 'Rp', name: 'Indonesian Rupiah', decimals: 0 },
  MYR: { symbol: 'RM', name: 'Malaysian Ringgit', decimals: 2 },
  VND: { symbol: '₫', name: 'Vietnamese Dong', decimals: 0 },
  INR: { symbol: '₹', name: 'Indian Rupee', decimals: 2 },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', decimals: 2 },
  BRL: { symbol: 'R$', name: 'Brazilian Real', decimals: 2 },
  MXN: { symbol: 'MX$', name: 'Mexican Peso', decimals: 2 },
  AED: { symbol: 'د.إ', name: 'UAE Dirham', decimals: 2 },
  SAR: { symbol: '﷼', name: 'Saudi Riyal', decimals: 2 },
  TRY: { symbol: '₺', name: 'Turkish Lira', decimals: 2 },
}

export function formatAmount(amount: number, currency: string): string {
  const cfg = CURRENCIES[currency] ?? { symbol: currency + ' ', decimals: 2 }
  if (currency === 'JPY' || currency === 'KRW' || currency === 'IDR' || currency === 'VND') {
    return `${cfg.symbol}${Math.round(amount).toLocaleString()}`
  }
  return `${cfg.symbol}${amount.toFixed(cfg.decimals)}`
}

/** Detect the guest's likely home currency from browser locale */
export function detectGuestCurrency(): string {
  if (typeof navigator === 'undefined') return 'USD'
  const lang = navigator.language
  const map: Record<string, string> = {
    'ja': 'JPY', 'ja-JP': 'JPY',
    'ko': 'KRW', 'ko-KR': 'KRW',
    'zh-CN': 'CNY', 'zh-TW': 'TWD',
    'en-US': 'USD', 'en-CA': 'CAD', 'en-AU': 'AUD', 'en-GB': 'GBP',
    'en-IN': 'INR', 'en-SG': 'SGD', 'en-HK': 'HKD',
    'fr': 'EUR', 'de': 'EUR', 'es': 'EUR', 'it': 'EUR', 'pt-PT': 'EUR',
    'pt-BR': 'BRL', 'es-MX': 'MXN',
    'th': 'THB', 'id': 'IDR', 'ms': 'MYR', 'vi': 'VND', 'hi': 'INR',
    'ar': 'AED', 'tr': 'TRY',
  }
  return map[lang] ?? map[lang.split('-')[0]] ?? 'USD'
}

/** Fetch conversion rate from Frankfurter (free, no API key) */
export async function getConversionRate(from: string, to: string): Promise<number | null> {
  if (from === to) return 1
  // Frankfurter doesn't support some currencies (KRW, IDR, VND…) — fall back gracefully
  const unsupported = ['KRW', 'IDR', 'VND', 'TWD', 'SAR', 'AED']
  if (unsupported.includes(from) || unsupported.includes(to)) return null
  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=${from}&to=${to}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.rates?.[to] ?? null
  } catch {
    return null
  }
}

/** Country → likely default tip percentage (0 = tipping uncommon) */
export const DEFAULT_TIP_BY_CURRENCY: Record<string, number> = {
  USD: 18, CAD: 15, AUD: 0, GBP: 10,
  EUR: 0, JPY: 0, KRW: 0, CNY: 0,
  THB: 10, SGD: 0, HKD: 0, IDR: 10,
  BRL: 10, MXN: 10, AED: 10, SAR: 10,
}
