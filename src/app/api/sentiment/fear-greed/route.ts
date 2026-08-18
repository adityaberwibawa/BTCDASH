import { NextResponse } from 'next/server'
import { getFearGreed } from '@/lib/sentiment'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(await getFearGreed())
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}