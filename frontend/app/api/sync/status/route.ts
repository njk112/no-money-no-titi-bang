import { NextRequest, NextResponse } from 'next/server'
import { serverApi, ServerApiError } from '@/lib/server-api'

interface SyncStatusResponse {
  last_synced_at: string | null
}

export async function GET(request: NextRequest) {
  const cookies = request.headers.get('cookie') || undefined

  try {
    const data = await serverApi.get<SyncStatusResponse>('/api/sync/status', cookies)
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
