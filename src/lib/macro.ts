import { cachedFetch } from './cache'

const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations'
const FRED_KEY = process.env.FRED_API_KEY ?? ''
const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart'

type MacroSeries = { value: number | null; change: number | null; change_is_pct: boolean }

async function yahooNow(symbol: string): Promise<MacroSeries> {
  try {
    const data = await cachedFetch<any>(
      `yahoo_${symbol}`,
      `${YAHOO_BASE}/${encodeURIComponent(symbol)}?range=5d&interval=1d`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } },
      120,
    )
    const result = data?.chart?.result?.[0]
    const closes = result?.indicators?.quote?.[0]?.close
    if (!Array.isArray(closes)) return { value: null, change: null, change_is_pct: true }

    const values = closes.filter((v: number | null) => v != null) as number[]
    if (!values.length) return { value: null, change: null, change_is_pct: true }
    const current = values[values.length - 1]
    const prev = values.length > 1 ? values[values.length - 2] : current
    const change = prev !== 0 ? ((current - prev) / prev) * 100 : 0
    return { value: round2(current), change: round2(change), change_is_pct: true }
  } catch {
    return { value: null, change: null, change_is_pct: true }
  }
}

async function fredValue(seriesId: string): Promise<MacroSeries> {
  if (!FRED_KEY) return { value: null, change: null, change_is_pct: false }
  try {
    const data = await cachedFetch<any>(
      `fred_${seriesId}`,
      `${FRED_BASE}?series_id=${seriesId}&api_key=${FRED_KEY}&file_type=json&sort_order=desc&limit=2`,
      {},
      300,
    )
    const obs: any[] = data.observations ?? []
    if (obs.length < 1) return { value: null, change: null, change_is_pct: false }
    const current = parseFloat(obs[0].value)
    const prev = obs.length > 1 ? parseFloat(obs[1].value) : current
    return { value: current, change: round2(current - prev), change_is_pct: false }
  } catch {
    return { value: null, change: null, change_is_pct: false }
  }
}

export async function getAllMacro() {
  const [dxy, spx, ndx, fed, cpi, nfci] = await Promise.all([
    yahooNow('DX-Y.NYB'),
    yahooNow('^GSPC'),
    yahooNow('^IXIC'),
    fredValue('FEDFUNDS'),
    fredValue('CPIAUCSL'),
    fredValue('NFCI'),
  ])
  return {
    dxy,
    sp500: spx,
    nasdaq: ndx,
    fed_rate: fed,
    cpi,
    nfci,
    timestamp: new Date().toISOString(),
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}