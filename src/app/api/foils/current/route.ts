import { NextResponse } from 'next/server'
import { getFoils } from '@/lib/foils'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await getFoils()
    if (!data) return NextResponse.json({ error: 'Hyperliquid unreachable' }, { status: 502 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}