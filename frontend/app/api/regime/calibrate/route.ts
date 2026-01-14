import { NextRequest, NextResponse } from 'next/server'
import { serverApi, ServerApiError } from '@/lib/server-api'
import type { SuggestedThresholds } from '@/hooks/use-regime-thresholds'

interface CalibrateRequest {
  itemIds?: number[]
}

export async function POST(request: NextRequest) {
  const cookies = request.headers.get('cookie') || undefined

  try {
    const body = await request.json() as CalibrateRequest
    const data = await serverApi.post<SuggestedThresholds>('/api/regime/calibrate', body, cookies)
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
