import { NextRequest, NextResponse } from 'next/server'
import { serverApi, ServerApiError } from '@/lib/server-api'
import type { Group } from '@/lib/types'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cookies = request.headers.get('cookie') || undefined

  try {
    const body = await request.json()
    const data = await serverApi.put<Group>(`/api/groups/${id}`, body, cookies)
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cookies = request.headers.get('cookie') || undefined

  try {
    const data = await serverApi.delete<{ success: boolean }>(`/api/groups/${id}`, cookies)
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
