'use client'

import { useState, useEffect } from 'react'

type SeasonData = { altseason?: boolean; btc_dominance?: number }
type Sector = { id: string; name: string; change_1d: number; change_7d: number; change_30d: number; change_90d: number }

export default function AltseasonPanel() {
  const [season, setSeason] = useState<SeasonData | null>(null)
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      try {
        const [s, sec] = await Promise.all([
          fetch('/api/market/altseason').then(r => r.json()),
          fetch('/api/market/sectors').then(r => r.json()),
        ])
        if (cancelled) return
        setSeason(s)
        setSectors(sec.sectors || [])
      } catch (err) {
        console.error('Altseason fetch error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 120000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  if (loading) return null

  const isAlt = season?.altseason
  const domColor = isAlt ? '#0f9d58' : '#b42318'

  return (
    <div className="altseason-panel">
      <div className="altseason-header">
        <div className="altseason-dominance">
          <span className="metric-title">BTC Dominance</span>
          <span className="metric-value" style={{ color: domColor }}>
            {season?.btc_dominance?.toFixed(1) ?? '—'}%
          </span>
        </div>
        <div className="altseason-label" style={{ color: domColor, borderColor: domColor }}>
          {isAlt ? 'Altseason' : 'Bitcoin Season'}
        </div>
      </div>

      {sectors.length > 0 && (
        <div className="sectors-table">
          <div className="sectors-header">
            <span className="sectors-col-name">Sector</span>
            <span className="sectors-col-pct">24h</span>
            <span className="sectors-col-pct">7d</span>
            <span className="sectors-col-pct">30d</span>
            <span className="sectors-col-pct">90d</span>
          </div>
          {sectors.map(s => (
            <div key={s.id} className="sectors-row">
              <span className="sectors-col-name">{s.name}</span>
              <span className="sectors-col-pct" style={{ color: s.change_1d >= 0 ? '#0f9d58' : '#b42318' }}>{s.change_1d >= 0 ? '+' : ''}{s.change_1d}%</span>
              <span className="sectors-col-pct" style={{ color: s.change_7d >= 0 ? '#0f9d58' : '#b42318' }}>{s.change_7d >= 0 ? '+' : ''}{s.change_7d}%</span>
              <span className="sectors-col-pct" style={{ color: s.change_30d >= 0 ? '#0f9d58' : '#b42318' }}>{s.change_30d >= 0 ? '+' : ''}{s.change_30d}%</span>
              <span className="sectors-col-pct" style={{ color: s.change_90d >= 0 ? '#0f9d58' : '#b42318' }}>{s.change_90d >= 0 ? '+' : ''}{s.change_90d}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}