import { cachedFetch } from './cache'

const HYPERLIQUID_INFO = 'https://api.hyperliquid.xyz/info'

const LOW_LS_RATIO = 1.2
const HIGH_LS_RATIO = 1.8
const HIGH_FUNDING = 0.01
const LOW_NEG_FUNDING = -0.01

const INTERPRETATIONS: Record<string, { label: string; description: string; risk: string; color: string }> = {
  bullish_jenuh: {
    label: 'Bullish Jenuh / Overleveraged Longs',
    description:
      'Pasar didorong oleh pembeli agresif dengan leverage tinggi. Berisiko memicu Long Squeeze (koreksi tajam akibat likuidasi massal posisi long).',
    risk: 'Long Squeeze',
    color: '#EF5350',
  },
  short_squeeze: {
    label: 'Short Squeeze',
    description:
      'Kenaikan harga terjadi karena trader short dipaksa menutup posisi (buying back), bukan pembelian organik baru.',
    risk: 'Potensi koreksi setelah buying back selesai',
    color: '#f97316',
  },
  bearish_jenuh: {
    label: 'Bearish Kuat / Jenuh Short',
    description:
      'Agresivitas penjual sangat tinggi. Jika harga berbalik naik, berpotensi Short Squeeze hebat karena posisi short terlikuidasi berjamaah.',
    risk: 'Short Squeeze potensial',
    color: '#26A69A',
  },
  long_liquidation: {
    label: 'Long Liquidation / Panic Selling',
    description:
      'Penurunan harga karena posisi long terlikuidasi atau panic selling. Sering menjadi tanda local bottom sudah dekat.',
    risk: 'Potensi reversal (local bottom)',
    color: '#eab308',
  },
  normal: {
    label: 'Normal',
    description: 'Tidak ada kondisi ekstrem terdeteksi. Pasar dalam keadaan relatif seimbang.',
    risk: 'Normal',
    color: '#7B8794',
  },
}

function estimateLsFromFunding(fundingRate: number, premium: number) {
  const raw = fundingRate * 10000 + premium * 5
  const lsRatio = Math.max(0.2, Math.min(5.0, 1.0 + raw))
  const longRatio = lsRatio / (1 + lsRatio)
  return {
    long_ratio: round4(longRatio),
    short_ratio: round4(1 - longRatio),
    ls_ratio: round4(lsRatio),
    source: 'estimated_funding',
  }
}

function interpret(priceTrend: number, fundingRate: number, lsRatio: number) {
  const priceUp = priceTrend > 0
  const fundingHighPos = fundingRate > HIGH_FUNDING / 100
  const fundingHighNeg = fundingRate < LOW_NEG_FUNDING / 100
  const lsHigh = lsRatio > HIGH_LS_RATIO
  const lsLow = lsRatio < LOW_LS_RATIO

  let key: string
  if (priceUp && fundingHighPos && lsHigh) key = 'bullish_jenuh'
  else if (priceUp && !fundingHighPos && lsLow) key = 'short_squeeze'
  else if (!priceUp && fundingHighNeg && lsLow) key = 'bearish_jenuh'
  else if (!priceUp && !fundingHighNeg && lsHigh) key = 'long_liquidation'
  else key = 'normal'

  return { key, ...INTERPRETATIONS[key] }
}

export async function getFoils() {
  let data: any
  try {
    data = await cachedFetch<any>(`hl_meta`, HYPERLIQUID_INFO, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
    }, 60)
  } catch {
    return null
  }

  const meta = data[0]
  const assetCtxs = data[1]

  let btcIdx = -1
  for (let i = 0; i < meta.universe.length; i++) {
    if (meta.universe[i].name === 'BTC') {
      btcIdx = i
      break
    }
  }

  if (btcIdx < 0) {
    return {
      error: 'BTC not found in Hyperliquid universe',
      open_interest: { value: 0, change_pct: null },
      funding_rate: { value: 0, annualized_pct: 0, timestamp: 0 },
      long_short_ratio: { long_ratio: 0.5, short_ratio: 0.5, ls_ratio: 1.0, source: 'none' },
      price_change_pct: 0,
      interpretation: INTERPRETATIONS.normal,
      updated_at: new Date().toISOString(),
    }
  }

  const ctx = assetCtxs[btcIdx]
  const fundingRate = parseFloat(ctx.funding)
  const openInterest = parseFloat(ctx.openInterest)
  const premium = parseFloat(ctx.premium)
  const markPx = parseFloat(ctx.markPx)
  const prevDayPx = parseFloat(ctx.prevDayPx)
  const dayNtlVlm = parseFloat(ctx.dayNtlVlm)

  const priceChangePct = prevDayPx ? ((markPx - prevDayPx) / prevDayPx) * 100 : 0
  const lsData = estimateLsFromFunding(fundingRate, premium)
  const interpretation = interpret(priceChangePct, fundingRate, lsData.ls_ratio)

  return {
    open_interest: { value: openInterest, change_pct: null },
    funding_rate: {
      value: fundingRate,
      annualized_pct: round6(fundingRate * 3 * 365 * 100),
      timestamp: 0,
    },
    long_short_ratio: lsData,
    price_change_pct: round2(priceChangePct),
    interpretation,
    market_data: {
      mark_px: markPx,
      premium,
      oracle_px: parseFloat(ctx.oraclePx ?? 0),
      volume_24h: dayNtlVlm,
    },
    updated_at: new Date().toISOString(),
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000
}

function round6(n: number): number {
  return Math.round(n * 1000000) / 1000000
}