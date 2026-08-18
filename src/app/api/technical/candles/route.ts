import { NextResponse } from 'next/server'
import { getOhlcv } from '@/lib/coingecko'

export const dynamic = 'force-dynamic'

const SYMBOL_MAP: Record<string, string> = {
  'BTC/USDT': 'bitcoin',
  'ETH/USDT': 'ethereum',
  'SOL/USDT': 'solana',
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawSymbol = searchParams.get('symbol') ?? 'BTC/USDT'
  const timeframe = searchParams.get('timeframe') ?? '1d'
  const coinId = SYMBOL_MAP[rawSymbol] ?? rawSymbol.toLowerCase()
  try {
    const data = await getOhlcv(coinId, timeframe)
    return NextResponse.json({ symbol: rawSymbol, timeframe, data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}