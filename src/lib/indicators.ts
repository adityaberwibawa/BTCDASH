import type { Candle } from './coingecko'

function ewmSeries(values: number[], span: number): number[] {
  const alpha = 2 / (span + 1)
  const out: number[] = new Array(values.length)
  if (values.length === 0) return out
  out[0] = values[0]
  for (let i = 1; i < values.length; i++) {
    out[i] = alpha * values[i] + (1 - alpha) * out[i - 1]
  }
  return out
}

function rollingMean(values: number[], window: number): number[] {
  const out: number[] = new Array(values.length).fill(NaN)
  let sum = 0
  for (let i = 0; i < values.length; i++) {
    sum += values[i]
    if (i >= window) sum -= values[i - window]
    if (i >= window - 1) out[i] = sum / window
  }
  return out
}

export function computeIndicators(ohlcv: Candle[]) {
  if (!ohlcv.length) return { ma: {}, rsi: [], macd: {} }

  const close = ohlcv.map((c) => c.close)
  const times = ohlcv.map((c) => c.time)

  const ema: Record<string, { time: number; value: number }[]> = {}
  for (const period of [13, 21]) {
    const key = `ema_${period}`
    const series = ewmSeries(close, period)
    ema[key] = series.map((v, i) => ({ time: times[i], value: round2(v) }))
  }

  const delta = close.map((v, i) => (i === 0 ? 0 : v - close[i - 1]))
  const gain = delta.map((d) => (d > 0 ? d : 0))
  const loss = delta.map((d) => (d < 0 ? -d : 0))
  const avgGain = rollingMean(gain, 14)
  const avgLoss = rollingMean(loss, 14)
  const rsi: { time: number; value: number }[] = []
  for (let i = 0; i < close.length; i++) {
    const ag = avgGain[i]
    const al = avgLoss[i]
    if (Number.isNaN(ag) || Number.isNaN(al) || al === 0) continue
    const rs = ag / al
    rsi.push({ time: times[i], value: round2(100 - 100 / (1 + rs)) })
  }

  const ema12 = ewmSeries(close, 12)
  const ema26 = ewmSeries(close, 26)
  const macdLine = close.map((_, i) => ema12[i] - ema26[i])
  const signalLine = ewmSeries(macdLine, 9)
  const macd: { time: number; macd: number; signal: number; histogram: number }[] = []
  for (let i = 0; i < close.length; i++) {
    macd.push({
      time: times[i],
      macd: round2(macdLine[i]),
      signal: round2(signalLine[i]),
      histogram: round2(macdLine[i] - signalLine[i]),
    })
  }

  return { ema, rsi, macd }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}