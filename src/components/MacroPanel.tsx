'use client'

import { useState, useEffect } from 'react'

type MacroSeries = { value: number | null; change: number | null; change_is_pct: boolean }

const INDICATORS = [
  { key: 'dxy', label: 'DXY', unit: '', correlation: 'negatif', color: 'var(--red)' },
  { key: 'sp500', label: 'S&P 500', unit: '', correlation: 'positif', color: 'var(--green)' },
  { key: 'nasdaq', label: 'Nasdaq', unit: '', correlation: 'positif', color: 'var(--green)' },
  { key: 'fed_rate', label: 'Fed Rate', unit: '%', correlation: 'negatif', color: 'var(--red)' },
  { key: 'cpi', label: 'CPI', unit: '%', correlation: 'positif', color: 'var(--green)' },
  { key: 'nfci', label: 'NFCI', unit: '', correlation: 'negatif', color: 'var(--red)' },
]

function MacroRow({ item, data }: { item: (typeof INDICATORS)[number]; data?: MacroSeries }) {
  if (!data || data.value == null) return null

  const isUp = (data.change ?? 0) > 0
  const isDown = (data.change ?? 0) < 0
  const arrow = isUp ? '▲' : isDown ? '▼' : '—'
  const arrowColor = isUp ? 'var(--green)' : isDown ? 'var(--red)' : '#7B8794'
  const isPct = data.change_is_pct !== false
  const changeText = `${Math.abs(data.change || 0).toFixed(2)}${isPct ? '%' : ''}`

  let stance = 'netral'
  if (isUp) stance = item.correlation === 'negatif' ? 'bearish' : 'bullish'
  else if (isDown) stance = item.correlation === 'negatif' ? 'bullish' : 'bearish'

  return (
    <div className="macro-row">
      <div className="macro-label">
        <span className="macro-dot" style={{ background: item.color }} />
        {item.label}
      </div>
      <div className="macro-value">{data.value?.toLocaleString()}{item.unit}</div>
      <div className="macro-change" style={{ color: arrowColor }}>
        <span className="macro-arrow">{arrow}</span> {changeText}
      </div>
      <div className={`macro-corr macro-corr--${stance}`}>
        {stance}
      </div>
    </div>
  )
}

export default function MacroPanel() {
  const [data, setData] = useState<Record<string, MacroSeries> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      try {
        const res = await fetch('/api/macro/current')
        const json = await res.json()
        if (!cancelled) setData(json)
      } catch (err) {
        console.error('Macro fetch error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 120000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  if (loading) return (
    <div className="macro-panel">
      <div className="panel-loading">loading macro...</div>
    </div>
  )

  return (
    <div className="macro-panel">
      <h2>Macro Indicators</h2>
      <div className="macro-rows">
        {INDICATORS.map(item => (
          <MacroRow key={item.key} item={item} data={data?.[item.key]} />
        ))}
      </div>
    </div>
  )
}