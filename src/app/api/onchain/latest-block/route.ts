import { NextResponse } from 'next/server'
import { getLatestBlock } from '@/lib/mempool'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(await getLatestBlock())
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}