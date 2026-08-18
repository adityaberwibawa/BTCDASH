import { NextResponse } from 'next/server'
import { getMempoolFees } from '@/lib/mempool'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(await getMempoolFees())
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}