'use client'

import { useState, useEffect } from 'react'

function formatHashrate(h: number | null | undefined) {
  if (h == null) return '—'
  return (h / 1e18).toFixed(2)
}

function formatNumber(n: number | null | undefined) {
  if (n == null) return '—'
  if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T'
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return n.toLocaleString()
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <h2>{title}</h2>
      <div className="onchain-grid">{children}</div>
    </>
  )
}

function Card({ title, value, unit }: { title: string; value: React.ReactNode; unit?: string }) {
  return (
    <div className="metric-card">
      <div className="metric-title">{title}</div>
      <div className="metric-value">
        {value ?? '—'}
        {unit && <span className="metric-unit">{unit}</span>}
      </div>
    </div>
  )
}

type Stats = {
  hashrate_24h?: number
  difficulty?: number
  total_blocks?: number
  latest_block_tx?: number
}

type Fees = {
  fastest_fee?: number
  half_hour_fee?: number
  hour_fee?: number
  economy_fee?: number
}

type Block = {
  height?: number
  size?: number
  weight?: number
  tx_count?: number
}

export default function OnChainPanel() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [fees, setFees] = useState<Fees | null>(null)
  const [block, setBlock] = useState<Block | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchAll() {
      try {
        const [s, f, b] = await Promise.all([
          fetch('/api/onchain/stats').then(r => r.json()),
          fetch('/api/onchain/fees').then(r => r.json()),
          fetch('/api/onchain/latest-block').then(r => r.json()),
        ])
        if (cancelled) return
        setStats(s)
        setFees(f)
        setBlock(b)
      } catch (err) {
        console.error('On-chain fetch error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchAll()
    const interval = setInterval(fetchAll, 120000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  if (loading) return (
    <div className="onchain-panel">
      <div className="panel-loading">loading on-chain...</div>
    </div>
  )

  return (
    <div className="onchain-panel">
      <Section title="Network">
        <Card title="Hashrate" value={formatHashrate(stats?.hashrate_24h)} unit=" EH/s" />
        <Card title="Difficulty" value={formatNumber(stats?.difficulty)} />
        <Card title="Total Blocks" value={stats?.total_blocks?.toLocaleString()} />
        <Card title="Last Block Tx" value={stats?.latest_block_tx?.toLocaleString()} />
      </Section>

      <Section title="Fee Market">
        <Card title="Fastest" value={fees?.fastest_fee} unit=" sat/vB" />
        <Card title="30 min" value={fees?.half_hour_fee} unit=" sat/vB" />
        <Card title="60 min" value={fees?.hour_fee} unit=" sat/vB" />
        <Card title="Economy" value={fees?.economy_fee} unit=" sat/vB" />
      </Section>

      {block && (
        <Section title="Latest Block">
          <Card title="Height" value={block.height?.toLocaleString()} />
          <Card title="Size" value={block.size?.toLocaleString()} unit=" B" />
          <Card title="Weight" value={block.weight?.toLocaleString()} unit=" WU" />
          <Card title="Tx Count" value={block.tx_count?.toLocaleString()} />
        </Section>
      )}
    </div>
  )
}