'use client'

import { useState, useEffect } from 'react'

function formatOi(value: number | null | undefined) {
  if (!value) return '—'
  if (value > 1) return (value / 1).toFixed(3) + ' BTC'
  return value.toFixed(2)
}

function formatFunding(value: number | null | undefined) {
  if (value == null) return '—'
  return (value * 100).toFixed(4) + '%'
}

function getFundingBadge(value: number | null | undefined) {
  if ((value ?? 0) > 0.01 / 100) return { label: 'Positif', cls: 'foils-badge-pos' }
  if ((value ?? 0) < -0.01 / 100) return { label: 'Negatif', cls: 'foils-badge-neg' }
  return { label: 'Netral', cls: 'foils-badge-net' }
}

type FoilsData = {
  open_interest?: { value: number; change_pct: number | null }
  funding_rate?: { value: number }
  long_short_ratio?: { ls_ratio: number; long_ratio: number; short_ratio: number; source: string }
  interpretation?: { key: string; label: string; description: string; risk: string; color: string }
}

export default function FoilsPanel() {
  const [data, setData] = useState<FoilsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      try {
        const res = await fetch('/api/foils/current')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (!cancelled) setData(json)
      } catch (err) {
        console.error('FOILS fetch error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  if (loading) return (
    <div className="foils-panel">
      <div className="panel-loading">loading foils...</div>
    </div>
  )

  if (!data) return null

  const oi = data.open_interest ?? { value: 0, change_pct: null }
  const fr = data.funding_rate ?? { value: null }
  const lsr = data.long_short_ratio ?? { ls_ratio: 0, long_ratio: 0.5, short_ratio: 0.5, source: 'none' }
  const interp = data.interpretation ?? { key: 'normal', label: 'Normal', description: '', risk: '', color: '#7B8794' }
  const badge = getFundingBadge(fr.value)
  const hasOiDelta = oi.change_pct != null
  const oiUp = (oi.change_pct ?? 0) >= 0

  return (
    <div className="foils-panel">
      <h2>Funding · Open Interest · Long/Short</h2>

      <div className="foils-metrics">
        <div className="foils-metric">
          <span className="foils-metric-label">Open Interest</span>
          <span className="foils-metric-value">{formatOi(oi.value)}</span>
          <span className={`foils-metric-delta ${hasOiDelta ? (oiUp ? 'positive' : 'negative') : ''}`}>
            {hasOiDelta ? `${oiUp ? '↑' : '↓'} ${Math.abs(oi.change_pct ?? 0).toFixed(2)}%` : '—'}
          </span>
        </div>

        <div className="foils-metric">
          <span className="foils-metric-label">Funding Rate</span>
          <span className="foils-metric-value">{formatFunding(fr.value)}</span>
          <span className={`foils-badge ${badge.cls}`}>{badge.label}</span>
        </div>

        <div className="foils-metric">
          <span className="foils-metric-label">Long / Short</span>
          <span className="foils-metric-value">{lsr.ls_ratio?.toFixed(2)}</span>
          <div className="foils-ls-bar">
            <div className="foils-ls-track">
              <div
                className="foils-ls-fill"
                style={{ width: `${(lsr.long_ratio / (lsr.long_ratio + lsr.short_ratio)) * 100}%` }}
              />
            </div>
            <div className="foils-ls-labels">
              <span className="foils-ls-long">L {(lsr.long_ratio * 100).toFixed(0)}%</span>
              <span className="foils-ls-short">S {(lsr.short_ratio * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="foils-interp" style={{ borderLeftColor: interp.color }}>
        <div className="foils-interp-label" style={{ color: interp.color }}>
          {interp.key !== 'normal' ? '⚠ ' : ''}{interp.label}
        </div>
        <div className="foils-interp-desc">{interp.description}</div>
        {interp.key !== 'normal' && (
          <div className="foils-interp-risk" style={{ color: interp.color }}>
            Risiko: {interp.risk}
          </div>
        )}
      </div>

      <div className="foils-footer">
        OI: Binance · FR: Binance · L/S: {lsr.source === 'bybit' ? 'Bybit' : 'estimasi funding'}
      </div>
    </div>
  )
}