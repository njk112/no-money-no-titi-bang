import { NextRequest, NextResponse } from 'next/server'
import { serverApi, ServerApiError } from '@/lib/server-api'
import type { ItemsResponse } from '@/lib/types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const cookies = request.headers.get('cookie') || undefined

  // Forward all query parameters to the backend
  const queryString = searchParams.toString()
  const endpoint = `/api/items${queryString ? `?${queryString}` : ''}`

  try {
    const data = await serverApi.get<ItemsResponse>(endpoint, cookies)
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
