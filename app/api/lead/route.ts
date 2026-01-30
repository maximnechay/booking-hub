import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const payload = {
      ...data,
      receivedAt: new Date().toISOString(),
    }

    console.log('New lead:', payload)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
