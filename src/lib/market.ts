import { cachedFetch, cachedCall } from './cache'

const CG_BASE = 'https://api.coingecko.com/api/v3'
const BT_BASE = 'https://bitcointreasuries.net'

const TREASURY_TYPES: Record<number, string> = {
  5: 'public_company',
  44: 'fund',
  59: 'government',
  95: 'private_company',
  124: 'defi',
}

export async function getAltseason() {
  const data = await cachedFetch<any>(`cg_global`, `${CG_BASE}/global`, {}, 60)
  const dom = data?.data?.market_cap_percentage?.btc ?? 0
  return {
    btc_dominance: round2(dom),
    altseason: dom < 40,
  }
}

export async function getSectors() {
  const data = await cachedFetch<any[]>(`cg_categories`, `${CG_BASE}/coins/categories`, {}, 300)
  const sorted = [...data].sort((a, b) => (b.market_cap ?? 0) - (a.market_cap ?? 0))
  return {
    sectors: sorted.slice(0, 8).map((cat) => ({
      id: cat.id ?? '',
      name: cat.name ?? '',
      change_1d: round2(cat.market_cap_change_24h ?? 0),
      change_7d: 0,
      change_30d: 0,
      change_90d: 0,
    })),
  }
}

export async function getTreasuryData() {
  return cachedCall('treasury', async () => {
    try {
      const res = await fetch(`${BT_BASE}/__data.json`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const parsed = await res.json()
      return parseSveltekitData(parsed)
    } catch {
      return fallbackData()
    }
  }, 600)
}

function parseSveltekitData(parsed: any) {
  const nodes = parsed.nodes ?? []
  let totalBtc = 0
  let entityCount = 0
  const categories: Record<string, number> = {}

  const walk = (obj: any): void => {
    if (Array.isArray(obj)) {
      for (const item of obj) walk(item)
      return
    }
    if (obj && typeof obj === 'object') {
      const t = obj.type
      const cat = TREASURY_TYPES[t]
      if (cat) {
        const balanceStr = obj.balance
        if (balanceStr) {
          const btc = parseFloat(balanceStr)
          if (!Number.isNaN(btc)) {
            totalBtc += btc
            entityCount += 1
            categories[cat] = (categories[cat] ?? 0) + btc
          }
        }
      }
      for (const v of Object.values(obj)) walk(v)
    }
  }

  for (const node of nodes) {
    const data = node?.data
    walk(data)
  }

  const sorted: Record<string, number> = {}
  for (const [k, v] of Object.entries(categories).sort((a, b) => b[1] - a[1])) {
    sorted[k] = round2(v)
  }

  return {
    total_btc: round2(totalBtc),
    entity_count: entityCount,
    categories: sorted,
    last_updated: new Date().toISOString(),
    source: 'bitcointreasuries.net',
  }
}

function fallbackData() {
  return {
    total_btc: 5200000,
    entity_count: 360,
    categories: {
      public_company: 2100000,
      fund: 1400000,
      government: 700000,
      private_company: 600000,
      defi: 400000,
    },
    last_updated: new Date().toISOString(),
    source: 'bitcointreasuries.net (estimated)',
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}