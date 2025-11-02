import { NextResponse } from 'next/server'

let debugLogs: any[] = []

export async function POST(request: Request) {
  const data = await request.json()
  debugLogs.push(data)
  console.log('[Debug Cookies]', JSON.stringify(data, null, 2))
  return NextResponse.json({ received: true })
}

export async function GET() {
  return NextResponse.json({
    logs: debugLogs.slice(-10), // Last 10 entries
    count: debugLogs.length
  })
}
