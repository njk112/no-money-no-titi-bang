import { NextRequest, NextResponse } from 'next/server'
import { serverApi, ServerApiError } from '@/lib/server-api'
import type { Thresholds, ThresholdUpdates } from '@/hooks/use-regime-thresholds'

export async function GET(request: NextRequest) {
  const cookies = request.headers.get('cookie') || undefined

  try {
    const data = await serverApi.get<Thresholds>('/api/regime/thresholds', cookies)
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof ServerApiError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      )
    }
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const cookies = request.headers.get('cookie') || undefined

  try {
    const body = await request.json() as ThresholdUpdates
    const data = await serverApi.put<Thresholds>('/api/regime/thresholds', body, cookies)
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof ServerApiError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      )
    }
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
