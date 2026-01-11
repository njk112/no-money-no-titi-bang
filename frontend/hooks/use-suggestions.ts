'use client'

import { useState, useCallback } from 'react'
import { api } from '@/lib/api'
import type { SuggestionItem, SuggestionsResponse } from '@/lib/types'

interface UseSuggestionsResult {
  suggestions: SuggestionItem[]
  isLoading: boolean
  error: Error | null
  fetchSuggestions: (budget: number) => Promise<void>
}

export function useSuggestions(): UseSuggestionsResult {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchSuggestions = useCallback(async (budget: number) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await api.get<SuggestionsResponse>(
        `/api/suggestions?budget=${budget}`
      )
      setSuggestions(response.data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch suggestions'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    suggestions,
    isLoading,
    error,
    fetchSuggestions,
  }
}
