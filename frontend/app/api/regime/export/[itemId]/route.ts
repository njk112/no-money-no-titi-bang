import { NextRequest, NextResponse } from 'next/server'
import { serverApi, ServerApiError } from '@/lib/server-api'

const API_URL = process.env.API_URL || 'http://localhost:3333'

interface ExportDataPoint {
  timestamp: string
  price: number | null
  chop: number | null
  range_norm: number | null
  slope_norm: number | null
  cross_rate: number | null
  label: string | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params
  const cookies = request.headers.get('cookie') || undefined
  const searchParams = new URL(request.url).searchParams
  const format = searchParams.get('format') || 'json'
  const queryString = searchParams.toString()

  const endpoint = `/api/regime/export/${itemId}${queryString ? `?${queryString}` : ''}`

  try {
    if (format === 'csv') {
      // For CSV, fetch directly and stream the response
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (cookies) {
        headers['Cookie'] = cookies
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }))
        return NextResponse.json(
          { message: error.message || 'Request failed' },
          { status: response.status }
        )
      }

      // Get the CSV content and forward it with correct headers
      const csvContent = await response.text()
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': response.headers.get('Content-Disposition') || `attachment; filename="regime_${itemId}.csv"`,
        },
      })
    }

    // For JSON, use the standard serverApi
    const data = await serverApi.get<ExportDataPoint[]>(endpoint, cookies)
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
