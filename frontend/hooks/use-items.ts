'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '@/lib/api'
import type { Item, ItemsParams, ItemsResponse } from '@/lib/types'

interface UseItemsOptions {
  pollInterval?: number
}

interface UseItemsResult {
  items: Item[]
  total: number
  totalPages: number
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function useItems(params: ItemsParams, options?: UseItemsOptions): UseItemsResult {
  const [items, setItems] = useState<Item[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const buildQueryString = useCallback((p: ItemsParams) => {
    const searchParams = new URLSearchParams()
    if (p.page) searchParams.set('page', String(p.page))
    if (p.search) searchParams.set('search', p.search)
    if (p.min_price !== undefined) searchParams.set('min_price', String(p.min_price))
    if (p.max_price !== undefined) searchParams.set('max_price', String(p.max_price))
    if (p.min_margin !== undefined) searchParams.set('min_margin', String(p.min_margin))
    if (p.max_margin !== undefined) searchParams.set('max_margin', String(p.max_margin))
    if (p.min_buy_limit !== undefined) searchParams.set('min_buy_limit', String(p.min_buy_limit))
    if (p.min_volume !== undefined) searchParams.set('min_volume', String(p.min_volume))
    if (p.max_volume !== undefined) searchParams.set('max_volume', String(p.max_volume))
    if (p.members !== undefined) searchParams.set('members', String(p.members))
    if (p.sort) searchParams.set('sort', p.sort)
    if (p.order) searchParams.set('order', p.order)
    const qs = searchParams.toString()
    return qs ? `?${qs}` : ''
  }, [])

  const fetchItems = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const queryString = buildQueryString(params)
      const response = await api.get<ItemsResponse>(`/api/items${queryString}`)
      setItems(response.data)
      setTotal(response.meta.total)
      setTotalPages(response.meta.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch items'))
    } finally {
      setIsLoading(false)
    }
  }, [params, buildQueryString])

  useEffect(() => {
    fetchItems()

    if (options?.pollInterval) {
      intervalRef.current = setInterval(fetchItems, options.pollInterval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchItems, options?.pollInterval])

  return {
    items,
    total,
    totalPages,
    isLoading,
    error,
    refetch: fetchItems,
  }
}
