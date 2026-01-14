import { NextRequest, NextResponse } from 'next/server'
import { serverApi, ServerApiError } from '@/lib/server-api'
import type { Item } from '@/lib/types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const cookies = request.headers.get('cookie') || undefined

  // Forward the ids query parameter to the backend
  const ids = searchParams.get('ids')
  const endpoint = `/api/items/batch${ids ? `?ids=${ids}` : ''}`

  try {
    const data = await serverApi.get<Item[]>(endpoint, cookies)
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
