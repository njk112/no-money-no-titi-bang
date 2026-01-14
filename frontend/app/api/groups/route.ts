import { NextRequest, NextResponse } from 'next/server'
import { serverApi, ServerApiError } from '@/lib/server-api'
import type { Group } from '@/lib/types'

export async function GET(request: NextRequest) {
  const cookies = request.headers.get('cookie') || undefined

  try {
    const data = await serverApi.get<Group[]>('/api/groups', cookies)
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

export async function POST(request: NextRequest) {
  const cookies = request.headers.get('cookie') || undefined

  try {
    const body = await request.json()
    const data = await serverApi.post<Group>('/api/groups', body, cookies)
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
