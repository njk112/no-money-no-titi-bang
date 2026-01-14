import { NextRequest, NextResponse } from 'next/server'
import { serverApi, ServerApiError } from '@/lib/server-api'
import type { RegimeSegment } from '@/hooks/use-regime-segments'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params
  const cookies = request.headers.get('cookie') || undefined
  const searchParams = new URL(request.url).searchParams
  const queryString = searchParams.toString()

  try {
    const endpoint = `/api/regime/segments/${itemId}${queryString ? `?${queryString}` : ''}`
    const data = await serverApi.get<RegimeSegment[]>(endpoint, cookies)
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
