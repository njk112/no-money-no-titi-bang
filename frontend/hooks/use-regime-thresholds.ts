'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

/**
 * Threshold configuration from the backend API.
 */
export interface Thresholds {
  chop_max: number
  range_norm_max: number
  slope_norm_max: number
  cross_rate_min: number
  window_size: number
}

/**
 * Distribution statistics for a feature.
 */
export interface DistributionStats {
  min: number
  max: number
  p25: number
  p50: number
  p75: number
}

/**
 * Suggested thresholds with distribution statistics from auto-calibration.
 */
export interface SuggestedThresholds {
  suggested: {
    chop_max: number
    range_norm_max: number
    slope_norm_max: number
    cross_rate_min: number
  }
  stats: {
    chop: DistributionStats
    range_norm: DistributionStats
    slope_norm: DistributionStats
    cross_rate: DistributionStats
  }
  meta: {
    items_sampled: number
    windows_analyzed: number
    window_size: number
  }
}

/**
 * Update payload for thresholds.
 */
export interface ThresholdUpdates {
  chop_max?: number
  range_norm_max?: number
  slope_norm_max?: number
  cross_rate_min?: number
  window_size?: number
}

interface UseRegimeThresholdsResult {
  thresholds: Thresholds | null
  isLoading: boolean
  error: Error | null
  updateThresholds: (updates: ThresholdUpdates) => Promise<void>
  runCalibration: (itemIds?: number[]) => Promise<void>
  suggestedThresholds: SuggestedThresholds | null
  isCalibrating: boolean
}

export function useRegimeThresholds(): UseRegimeThresholdsResult {
  const [thresholds, setThresholds] = useState<Thresholds | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [suggestedThresholds, setSuggestedThresholds] = useState<SuggestedThresholds | null>(null)
  const [isCalibrating, setIsCalibrating] = useState(false)

  const fetchThresholds = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await api.get<Thresholds>('/api/regime/thresholds')
      setThresholds(response)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch thresholds'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchThresholds()
  }, [fetchThresholds])

  const updateThresholds = useCallback(async (updates: ThresholdUpdates) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await api.put<Thresholds>('/api/regime/thresholds', updates)
      setThresholds(response)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update thresholds'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const runCalibration = useCallback(async (itemIds?: number[]) => {
    setIsCalibrating(true)
    setError(null)

    try {
      const body = itemIds ? { itemIds } : {}
      const response = await api.post<SuggestedThresholds>('/api/regime/calibrate', body)
      setSuggestedThresholds(response)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to run calibration'))
      throw err
    } finally {
      setIsCalibrating(false)
    }
  }, [])

  return {
    thresholds,
    isLoading,
    error,
    updateThresholds,
    runCalibration,
    suggestedThresholds,
    isCalibrating,
  }
}
