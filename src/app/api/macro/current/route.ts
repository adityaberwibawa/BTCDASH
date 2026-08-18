import { NextResponse } from 'next/server'
import { getAllMacro } from '@/lib/macro'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(await getAllMacro())
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}