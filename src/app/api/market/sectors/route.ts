import { NextResponse } from 'next/server'
import { getSectors } from '@/lib/market'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(await getSectors())
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}