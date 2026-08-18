import { cachedFetch } from './cache'

const CG_BASE = 'https://api.coingecko.com/api/v3'
const DAYS_MAP: Record<string, number> = { '1h': 1, '4h': 7, '1d': 90, '1w': 365 }

export type Candle = { time: number; open: number; high: number; low: number; close: number }

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export async function getOhlcv(symbol = 'bitcoin', timeframe = '1d'): Promise<Candle[]> {
  if (timeframe === '1d') {
    const data = await cachedFetch<{ prices: [number, number][] }>(
      `mc_${symbol}_90`,
      `${CG_BASE}/coins/${symbol}/market_chart?vs_currency=usd&days=90`,
      {},
      600,
    )
    return aggregateDaily(data.prices ?? [])
  }

  if (timeframe === '1w') {
    const data = await cachedFetch<{ prices: [number, number][] }>(
      `mc_${symbol}_365_daily`,
      `${CG_BASE}/coins/${symbol}/market_chart?vs_currency=usd&days=365&interval=daily`,
      {},
      1800,
    )
    return aggregateWeekly(data.prices ?? [])
  }

  const days = DAYS_MAP[timeframe] ?? 7
  const data = await cachedFetch<[number, number, number, number, number][]>(
    `ohlcv_${symbol}_${timeframe}`,
    `${CG_BASE}/coins/${symbol}/ohlc?vs_currency=usd&days=${days}`,
    {},
    timeframe === '1h' ? 120 : 300,
  )
  return data.map((o) => ({
    time: Math.floor(o[0] / 1000),
    open: o[1],
    high: o[2],
    low: o[3],
    close: o[4],
  }))
}

function aggregateDaily(prices: [number, number][]): Candle[] {
  const days = new Map<string, number[]>()
  for (const [ms, price] of prices) {
    const day = new Date(ms).toISOString().slice(0, 10)
    const bucket = days.get(day)
    if (bucket) bucket.push(price)
    else days.set(day, [price])
  }

  const candles: Candle[] = []
  for (const [dayStr, list] of days) {
    candles.push({
      time: Math.floor(Date.parse(`${dayStr}T00:00:00Z`) / 1000),
      open: round2(list[0]),
      high: round2(Math.max(...list)),
      low: round2(Math.min(...list)),
      close: round2(list[list.length - 1]),
    })
  }
  candles.sort((a, b) => a.time - b.time)
  return candles
}

function aggregateWeekly(prices: [number, number][]): Candle[] {
  const weeks = new Map<string, { list: number[]; firstMs: number }>()
  for (const [ms, price] of prices) {
    const dt = new Date(ms)
    const utc = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()))
    const dayOfWeek = utc.getUTCDay() === 0 ? 6 : utc.getUTCDay() - 1
    const monday = new Date(utc.getTime() - dayOfWeek * 86400000)
    const key = monday.toISOString().slice(0, 10)
    const bucket = weeks.get(key)
    if (bucket) bucket.list.push(price)
    else weeks.set(key, { list: [price], firstMs: ms })
  }

  const candles: Candle[] = []
  for (const [monday, { list }] of weeks) {
    candles.push({
      time: Math.floor(Date.parse(`${monday}T00:00:00Z`) / 1000),
      open: round2(list[0]),
      high: round2(Math.max(...list)),
      low: round2(Math.min(...list)),
      close: round2(list[list.length - 1]),
    })
  }
  candles.sort((a, b) => a.time - b.time)
  return candles
}

export async function getTicker(symbol = 'bitcoin') {
  const data = await cachedFetch<Record<string, Record<string, number>>>(
    `ticker_${symbol}`,
    `${CG_BASE}/simple/price?ids=${symbol}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true&include_market_cap=true`,
    {},
    30,
  )
  const s = data[symbol] ?? {}
  return {
    symbol: `${symbol}/USD`,
    last: s.usd ?? null,
    high: s.usd_24h_high ?? null,
    low: s.usd_24h_low ?? null,
    change: s.usd_24h_change ?? null,
    volume: s.usd_24h_vol ?? null,
    market_cap: s.usd_market_cap ?? null,
    timestamp: new Date().toISOString(),
    ts: Math.floor(Date.now() / 1000),
  }
}

export async function getCoinInfo(symbol = 'bitcoin') {
  try {
    const data = await cachedFetch<any>(
      `coin_info_${symbol}`,
      `${CG_BASE}/coins/${symbol}?localization=false&tickers=false&community_data=false&developer_data=false`,
      {},
      300,
    )
    const md = data.market_data ?? {}
    return {
      market_cap_usd: md.market_cap?.usd ?? null,
      fully_diluted_valuation_usd: md.fully_diluted_valuation?.usd ?? null,
      total_volume_usd: md.total_volume?.usd ?? null,
      circulating_supply: md.circulating_supply ?? null,
      total_supply: md.total_supply ?? null,
      max_supply: md.max_supply ?? null,
    }
  } catch {
    // fallthrough to ticker estimates
  }

  const ticker = await getTicker(symbol)
  const price = ticker.last
  const circ = 19720000
  const maxS = 21000000
  return {
    market_cap_usd: ticker.market_cap ?? (price != null ? price * circ : null),
    fully_diluted_valuation_usd: price != null ? price * maxS : null,
    total_volume_usd: ticker.volume,
    circulating_supply: circ,
    total_supply: circ,
    max_supply: maxS,
  }
}