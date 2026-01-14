'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

export interface Group {
  id: number
  name: string
  slug: string
  description: string | null
  keywords: string[]
  color: string
  sort_order: number
  is_default: boolean
  item_count: number
}

interface UseGroupsResult {
  groups: Group[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function useGroups(): UseGroupsResult {
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchGroups = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.get<Group[]>('/api/groups')
      setGroups(response)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch groups'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  return {
    groups,
    isLoading,
    error,
    refetch: fetchGroups,
  }
}
