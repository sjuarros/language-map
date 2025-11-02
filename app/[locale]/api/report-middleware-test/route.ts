import { NextResponse } from 'next/server'

let latestResults: any = null

export async function POST(request: Request) {
  const results = await request.json()
  latestResults = results
  console.log('[Report API] Middleware test results:', JSON.stringify(results, null, 2))
  return NextResponse.json({ received: true })
}

export async function GET() {
  return NextResponse.json({
    results: latestResults,
    message: 'Visit /test to run the middleware test, then check this endpoint for results'
  })
}
