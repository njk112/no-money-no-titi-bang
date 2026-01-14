import { NextRequest, NextResponse } from 'next/server'
import { serverApi, ServerApiError } from '@/lib/server-api'

interface GroupStats {
  totalGroups: number
  totalItems: number
  itemsByGroup: Record<string, number>
}

export async function GET(request: NextRequest) {
  const cookies = request.headers.get('cookie') || undefined

  try {
    const data = await serverApi.get<GroupStats>('/api/groups/stats', cookies)
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
