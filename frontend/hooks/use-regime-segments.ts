'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

/**
 * Regime segment from the backend API.
 */
export interface RegimeSegment {
  id: number
  item_id: number
  start_idx: number
  end_idx: number
  start_ts: string
  end_ts: string
  label: 'RANGE_BOUND' | 'TRENDING'
  chop: number
  range_norm: number
  slope_norm: number
  cross_rate: number
  band_midpoint: number | null
  band_width_pct: number | null
  confidence_score: number | null
}

interface UseRegimeSegmentsOptions {
  startTs?: Date
  endTs?: Date
}

interface UseRegimeSegmentsResult {
  segments: RegimeSegment[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function useRegimeSegments(
  itemId: number | null,
  options?: UseRegimeSegmentsOptions
): UseRegimeSegmentsResult {
  const [segments, setSegments] = useState<RegimeSegment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchSegments = useCallback(async () => {
    if (itemId === null) {
      setSegments([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Build query params
      const params = new URLSearchParams()
      if (options?.startTs) {
        params.set('startTs', options.startTs.toISOString())
      }
      if (options?.endTs) {
        params.set('endTs', options.endTs.toISOString())
      }

      const queryString = params.toString()
      const endpoint = `/api/regime/segments/${itemId}${queryString ? `?${queryString}` : ''}`

      const response = await api.get<RegimeSegment[]>(endpoint)
      setSegments(response)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch regime segments'))
    } finally {
      setIsLoading(false)
    }
  }, [itemId, options?.startTs, options?.endTs])

  useEffect(() => {
    fetchSegments()
  }, [fetchSegments])

  return {
    segments,
    isLoading,
    error,
    refetch: fetchSegments,
  }
}
