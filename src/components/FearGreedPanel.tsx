'use client'

import { useState, useEffect } from 'react'

function getColor(value: number) {
  if (value <= 24) return '#b42318'
  if (value <= 44) return '#f97316'
  if (value <= 54) return '#eab308'
  if (value <= 74) return '#0f9d58'
  return '#16a34a'
}

type FngData = {
  current?: { value: number; classification: string } | null
  history?: { value: number }[]
}

export default function FearGreedPanel() {
  const [data, setData] = useState<FngData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      try {
        const res = await fetch('/api/sentiment/fear-greed')
        const json = await res.json()
        if (!cancelled) setData(json)
      } catch (err) {
        console.error('Fear & Greed error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 300000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  if (loading) return (
    <div className="fng-panel">
      <div className="panel-loading">loading sentiment...</div>
    </div>
  )

  if (!data?.current) return null

  const { value, classification } = data.current
  const color = getColor(value)
  const deg = (value / 100) * 180

  return (
    <div className="fng-panel">
      <h2>Fear & Greed</h2>
      <div className="fng-gauge-wrap">
        <svg viewBox="0 0 120 70" className="fng-gauge">
          <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="#242830" strokeWidth="10" strokeLinecap="round" />
          <path d="M10 60 A50 50 0 0 1 110 60"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(value / 100) * 157} 157`}
          />
          <circle cx={60 - 50 * Math.cos(deg * Math.PI / 180)} cy={60 - 50 * Math.sin(deg * Math.PI / 180)} r="5" fill={color} />
        </svg>
        <div className="fng-value" style={{ color }}>{value}</div>
        <div className="fng-label">{classification}</div>
      </div>
      <div className="fng-history">
        {data.history?.slice(0, 30).reverse().map((item, i) => (
          <div
            key={i}
            className="fng-bar"
            style={{
              background: getColor(item.value),
              height: `${(item.value / 100) * 24}px`,
              opacity: 0.4 + (i / 30) * 0.6,
            }}
          />
        ))}
      </div>
    </div>
  )
}