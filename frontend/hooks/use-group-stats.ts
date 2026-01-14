'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

export interface GroupStats {
  group_id: number
  group_name: string
  group_slug: string
  group_color: string
  item_count: number
  total_volume: number
  avg_margin: number
  total_max_profit: number
}

interface UseGroupStatsResult {
  stats: GroupStats[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function useGroupStats(): UseGroupStatsResult {
  const [stats, setStats] = useState<GroupStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchStats = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.get<GroupStats[]>('/api/groups/stats')
      setStats(response)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch group stats'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  }
}
