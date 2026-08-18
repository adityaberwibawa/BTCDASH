import { NextResponse } from 'next/server'
import { getAltseason } from '@/lib/market'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(await getAltseason())
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}