'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import PriceChart from './PriceChart'
import OnChainPanel from './OnChainPanel'
import FoilsPanel from './FoilsPanel'
import FearGreedPanel from './FearGreedPanel'
import MacroPanel from './MacroPanel'
import IndicatorPanel from './IndicatorPanel'
import AltseasonPanel from './AltseasonPanel'
import MarketStatsBar from './MarketStatsBar'

type Ticker = {
  last?: number
  change?: number
  high?: number
  low?: number
  volume?: number
}

type Candle = { time: number; open: number; high: number; low: number; close: number }
type EmaMap = Record<string, { time: number; value: number }[]>

export default function Dashboard() {
  const [candleData, setCandleData] = useState<Candle[]>([])
  const [ticker, setTicker] = useState<Ticker | null>(null)
  const [timeframe, setTimeframe] = useState('1d')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clock, setClock] = useState('')

  const [emaData, setEmaData] = useState<EmaMap | null>(null)
  const [emaOn, setEmaOn] = useState(false)
  const isFirstLoad = useRef(true)

  const fetchCandles = useCallback(async (tf: string) => {
    try {
      const res = await fetch(`/api/technical/candles?symbol=BTC/USDT&timeframe=${tf}&limit=365`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setCandleData(json.data || [])
    } catch (err) {
      console.error('Candle fetch error:', err)
      setError('Failed to load chart data')
    }
  }, [])

  const fetchTicker = useCallback(async () => {
    try {
      const res = await fetch(`/api/technical/ticker?symbol=BTC/USDT`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setTicker(json)
      setError(null)
    } catch (err) {
      console.error('Ticker fetch error:', err)
    }
  }, [])

  const fetchEMA = useCallback(async (tf: string) => {
    try {
      const res = await fetch(`/api/technical/indicators?symbol=BTC/USDT&timeframe=${tf}`)
      if (!res.ok) return
      const json = await res.json()
      setEmaData(json.ema || {})
    } catch (err) {
      console.error('EMA fetch error:', err)
    }
  }, [])

  useEffect(() => {
    fetchTicker()
    const tickerInterval = setInterval(fetchTicker, 30000)
    const clockInterval = setInterval(() => setClock(new Date().toLocaleTimeString('en-US', { hour12: false })), 1000)
    return () => {
      clearInterval(tickerInterval)
      clearInterval(clockInterval)
    }
  }, [fetchTicker])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (isFirstLoad.current) setLoading(true)
      await Promise.all([fetchCandles(timeframe), fetchEMA(timeframe)])
      if (!cancelled) {
        if (isFirstLoad.current) setLoading(false)
        isFirstLoad.current = false
      }
    }
    load()
    const slowInterval = setInterval(() => { fetchCandles(timeframe); fetchEMA(timeframe) }, 300000)
    return () => {
      cancelled = true
      clearInterval(slowInterval)
    }
  }, [timeframe, fetchCandles, fetchEMA])

  const handleTimeframeChange = (tf: string) => {
    setTimeframe(tf)
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <div className="header-left">
            <div className="btc-logo" aria-hidden="true">₿</div>
            <div>
              <div className="header-kicker">BOWOWEB / BTC-USDT</div>
              <h1>Bitcoin Market Desk</h1>
              <div className="header-sub">technical / macro / on-chain / sentiment</div>
            </div>
          </div>
          <div className="header-right">
            <div className="header-badge"><span className="live-dot" /> LIVE</div>
            <div className="header-time"><span>UTC+7</span> {clock}</div>
          </div>
        </div>
        {ticker && (
          <div className="ticker-bar">
            <span className="ticker-price">
              ${ticker.last?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`ticker-change ${(ticker.change ?? 0) >= 0 ? 'positive' : 'negative'}`}>
              {(ticker.change ?? 0) >= 0 ? '+' : ''}{ticker.change?.toFixed(2)}%
            </span>
            <span className="ticker-sep">|</span>
            <div className="ticker-group">
              <span className="ticker-label">H</span>
              <span className="ticker-detail">${ticker.high?.toLocaleString()}</span>
            </div>
            <div className="ticker-group">
              <span className="ticker-label">L</span>
              <span className="ticker-detail">${ticker.low?.toLocaleString()}</span>
            </div>
            <span className="ticker-sep">|</span>
            <div className="ticker-group">
              <span className="ticker-label">Vol</span>
              <span className="ticker-detail">{((ticker.volume ?? 0) / 1e9).toFixed(2)}B USD</span>
            </div>
          </div>
        )}
      </header>

      {loading ? (
        <div className="loading">
          <div className="spinner" />
          <span>Loading market data...</span>
        </div>
      ) : error ? (
        <div className="error-banner" role="alert">{error}</div>
      ) : (
        <>
          {ticker && <MarketStatsBar />}
          <div className="dashboard-grid">
            <div className="grid-left">
              <MacroPanel />
              <FearGreedPanel />
              <IndicatorPanel timeframe={timeframe} />
              <AltseasonPanel />
            </div>
            <div className="grid-main">
              <PriceChart
                data={candleData}
                timeframe={timeframe}
                onTimeframeChange={handleTimeframeChange}
                emaData={emaData}
                emaOn={emaOn}
                onToggleEma={() => setEmaOn(v => !v)}
              />
              <FoilsPanel />
              <OnChainPanel />
            </div>
          </div>
        </>
      )}
    </div>
  )
}