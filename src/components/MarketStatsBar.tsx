'use client'

import { useState, useEffect } from 'react'

function formatCompact(n: number | null | undefined) {
  if (n == null) return '—'
  if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T'
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return n.toLocaleString()
}

function formatSupply(n: number | null | undefined) {
  if (n == null) return '—'
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return n.toLocaleString()
}

function StatItem({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="stat-item">
      <span className="stat-label">{label}</span>
      <span className="stat-value">
        {value}{unit && <span className="stat-unit">{unit}</span>}
      </span>
    </div>
  )
}

type CoinInfo = {
  market_cap_usd?: number
  fully_diluted_valuation_usd?: number
  total_volume_usd?: number
  circulating_supply?: number
  total_supply?: number
  max_supply?: number
}

export default function MarketStatsBar() {
  const [info, setInfo] = useState<CoinInfo | null>(null)
  const [treasury, setTreasury] = useState<{ total_btc?: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchAll() {
      try {
        const [i, t] = await Promise.all([
          fetch('/api/technical/coin-info').then(r => r.json()),
          fetch('/api/market/treasury').then(r => r.json()),
        ])
        if (cancelled) return
        setInfo(i)
        setTreasury(t)
      } catch (err) {
        console.error('MarketStats fetch error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchAll()
    const interval = setInterval(fetchAll, 120000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  if (loading || !info) return null

  return (
    <div className="market-stats">
      <StatItem label="Market Cap" value={`$${formatCompact(info.market_cap_usd)}`} />
      <span className="stat-sep" />
      <StatItem label="FDV" value={`$${formatCompact(info.fully_diluted_valuation_usd)}`} />
      <span className="stat-sep" />
      <StatItem label="Volume 24h" value={`$${formatCompact(info.total_volume_usd)}`} />
      <span className="stat-sep" />
      <StatItem label="Circulating" value={formatSupply(info.circulating_supply)} unit=" BTC" />
      <span className="stat-sep" />
      <StatItem label="Total Supply" value={formatSupply(info.total_supply)} unit=" BTC" />
      <span className="stat-sep" />
      <StatItem label="Max Supply" value={formatSupply(info.max_supply)} unit=" BTC" />
      <span className="stat-sep" />
      <StatItem
        label="Treasury"
        value={treasury?.total_btc ? formatSupply(treasury.total_btc) : '—'}
        unit=" BTC"
      />
    </div>
  )
}