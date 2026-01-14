'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import type { Item } from '@/lib/types'

interface UseItemResult {
  item: Item | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function useItem(itemId: number | null): UseItemResult {
  const [item, setItem] = useState<Item | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchItem = useCallback(async () => {
    if (itemId === null) {
      setItem(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await api.get<Item>(`/api/items/${itemId}`)
      setItem(response)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch item'))
    } finally {
      setIsLoading(false)
    }
  }, [itemId])

  useEffect(() => {
    fetchItem()
  }, [fetchItem])

  return {
    item,
    isLoading,
    error,
    refetch: fetchItem,
  }
}
