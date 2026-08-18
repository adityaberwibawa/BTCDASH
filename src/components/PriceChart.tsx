'use client'

import { useEffect, useRef } from 'react'

const EMA_COLORS: Record<string, string> = { ema_13: '#ff6b00', ema_21: '#9ca3af' }

type Candle = { time: number; open: number; high: number; low: number; close: number }
type EmaMap = Record<string, { time: number; value: number }[]>

export default function PriceChart({
  data,
  timeframe,
  onTimeframeChange,
  emaData,
  emaOn,
  onToggleEma,
}: {
  data: Candle[]
  timeframe: string
  onTimeframeChange?: (tf: string) => void
  emaData: EmaMap | null
  emaOn: boolean
  onToggleEma?: () => void
}) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)
  const seriesRef = useRef<Record<string, any>>({})
  const lwcRef = useRef<any>(null)
  const dataRef = useRef<Candle[]>([])

  useEffect(() => {
    dataRef.current = data ?? []
  }, [data])

  useEffect(() => {
    let disposed = false
    let cleanup: (() => void) | null = null

    async function init() {
      const lwc = await import('lightweight-charts')
      if (disposed || !chartContainerRef.current) return
      lwcRef.current = lwc

      const chart = lwc.createChart(chartContainerRef.current, {
        layout: {
          background: { type: lwc.ColorType.Solid, color: 'transparent' },
          textColor: '#a7adb7',
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
        },
        grid: { vertLines: { color: '#282b31' }, horzLines: { color: '#282b31' } },
        crosshair: {
          mode: 0,
          vertLine: { color: '#ff6b00', width: 1, style: 2, labelBackgroundColor: '#ff6b00' },
          horzLine: { color: '#ff6b00', width: 1, style: 2, labelBackgroundColor: '#ff6b00' },
        },
        timeScale: { borderColor: '#464a52', timeVisible: true, secondsVisible: false },
        rightPriceScale: { borderColor: '#464a52' },
        width: chartContainerRef.current.clientWidth,
        height: Math.max(240, Math.min(360, (window.innerHeight - 390) * 0.48)),
        handleScroll: true,
        handleScale: true,
      })

      const candleSeries = chart.addSeries(lwc.CandlestickSeries, {
        upColor: '#0f9d58', downColor: '#b42318',
        borderUpColor: '#0f9d58', borderDownColor: '#b42318',
        wickUpColor: '#0f9d58', wickDownColor: '#b42318',
      })
      if (dataRef.current.length) candleSeries.setData(dataRef.current as any)
      seriesRef.current.candle = candleSeries
      chartRef.current = chart

      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({
            width: chartContainerRef.current.clientWidth,
            height: Math.max(180, Math.min(270, (window.innerHeight - 390) * 0.42)),
          })
        }
      }
      window.addEventListener('resize', handleResize)

      cleanup = () => {
        window.removeEventListener('resize', handleResize)
        chart.remove()
        chartRef.current = null
        seriesRef.current = {}
      }
    }

    init()
    return () => {
      disposed = true
      cleanup?.()
    }
  }, [])

  useEffect(() => {
    const series = seriesRef.current.candle
    if (series) series.setData(data?.length ? data : [])
  }, [data])

  useEffect(() => {
    const chart = chartRef.current
    const lwc = lwcRef.current
    if (!chart || !lwc) return

    Object.entries(EMA_COLORS).forEach(([key, color]) => {
      const existing = seriesRef.current[key]
      if (existing) { chart.removeSeries(existing); delete seriesRef.current[key] }
      if (emaOn && emaData?.[key]) {
        const series = chart.addSeries(lwc.LineSeries, { color, lineWidth: 1 })
        series.setData(emaData[key].map((d) => ({ time: d.time, value: d.value })))
        seriesRef.current[key] = series
      }
    })
  }, [emaData, emaOn])

  const timeframes = ['1h', '4h', '1d', '1w']

  return (
    <div className="chart-wrapper">
      <div className="chart-header">
        <h2>BTC/USDT / {timeframe?.toUpperCase()}</h2>
        <div className="tf-group">
          <div className="timeframe-buttons">
            {timeframes.map((tf) => (
              <button key={tf} type="button" aria-pressed={timeframe === tf} className={`tf-btn ${timeframe === tf ? 'active' : ''}`} onClick={() => onTimeframeChange?.(tf)}>
                {tf.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="overlay-toggles">
            <button
              type="button"
              aria-pressed={emaOn}
              className={`tf-btn ${emaOn ? 'active' : ''}`}
              onClick={() => onToggleEma?.()}
            >
              EMA 13/21
            </button>
          </div>
        </div>
      </div>
      <div ref={chartContainerRef} />
    </div>
  )
}