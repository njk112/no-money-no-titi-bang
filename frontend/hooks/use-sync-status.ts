'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '@/lib/api'

interface SyncStatusResponse {
  last_synced_at: string | null
}

interface UseSyncStatusResult {
  lastSyncedAt: string | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function useSyncStatus(): UseSyncStatusResult {
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchStatus = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.get<SyncStatusResponse>('/api/sync/status')
      setLastSyncedAt(response.last_synced_at)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch sync status'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()

    intervalRef.current = setInterval(fetchStatus, 60000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchStatus])

  return {
    lastSyncedAt,
    isLoading,
    error,
    refetch: fetchStatus,
  }
}
