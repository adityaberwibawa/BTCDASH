import { NextResponse } from 'next/server'
import { getBasicStats } from '@/lib/mempool'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(await getBasicStats())
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}