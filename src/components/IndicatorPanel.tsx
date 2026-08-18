'use client'

import { useState, useEffect } from 'react'

function rsiCategory(value: number | null): { label: string; color: string } {
  if (value == null) return { label: '—', color: '#7B8794' }
  if (value <= 29) return { label: 'Oversold', color: '#0f9d58' }
  if (value <= 39) return { label: 'Weak', color: '#84cc16' }
  if (value <= 60) return { label: 'Neutral', color: '#eab308' }
  if (value <= 70) return { label: 'Strong', color: '#f97316' }
  return { label: 'Overbought', color: '#b42318' }
}

type IndicatorData = {
  rsi?: { value: number }[]
  macd?: { macd: number; signal: number; histogram: number }[]
}

export default function IndicatorPanel({ timeframe }: { timeframe: string }) {
  const [data, setData] = useState<IndicatorData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      try {
        const res = await fetch(`/api/technical/indicators?symbol=BTC/USDT&timeframe=${timeframe || '1d'}`)
        const json = await res.json()
        if (!cancelled) setData(json)
      } catch (err) {
        console.error('Indicators error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 300000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [timeframe])

  if (loading || !data) return null

  const latestRsi = data.rsi?.length > 0 ? data.rsi[data.rsi.length - 1] : null
  const latestMacd = data.macd?.length > 0 ? data.macd[data.macd.length - 1] : null
  const rsiCat = rsiCategory(latestRsi?.value ?? null)
  const macdCat = (latestMacd?.histogram ?? 0) >= 0
    ? { label: 'Bullish Momentum', color: '#0f9d58' }
    : { label: 'Bearish Momentum', color: '#b42318' }

  return (
    <div className="indicator-cards">
      <div className="metric-card">
        <div className="metric-title">RSI (14)</div>
        <div className="metric-value">
          {latestRsi?.value?.toFixed(1) ?? '—'}
        </div>
        <div className="indicator-tag" style={{ color: rsiCat.color, borderColor: rsiCat.color }}>
          {rsiCat.label}
        </div>
      </div>
      <div className="metric-card">
        <div className="metric-title">MACD (12, 26, 9)</div>
        <div className="metric-value">
          {latestMacd?.macd?.toFixed(1) ?? '—'}
        </div>
        <div className="indicator-sub-row">
          <span className="indicator-sub-label">Histogram</span>
          <span className="indicator-sub-value" style={{ color: (latestMacd?.histogram ?? 0) >= 0 ? '#0f9d58' : '#b42318' }}>
            {latestMacd?.histogram?.toFixed(2) ?? '—'}
          </span>
        </div>
        <div className="indicator-tag" style={{ color: macdCat.color, borderColor: macdCat.color }}>
          {macdCat.label}
        </div>
      </div>
    </div>
  )
}