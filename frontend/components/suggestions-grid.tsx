'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { SuggestionCard } from '@/components/suggestion-card'
import type { SuggestionItem } from '@/lib/types'

interface SuggestionsGridProps {
  suggestions: SuggestionItem[]
  isLoading: boolean
  onItemClick: (id: number) => void
}

export function SuggestionsGrid({
  suggestions,
  isLoading,
  onItemClick,
}: SuggestionsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="w-12 h-12" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Enter a budget to see suggestions
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {suggestions.map((suggestion) => (
        <SuggestionCard
          key={suggestion.id}
          suggestion={suggestion}
          onItemClick={onItemClick}
        />
      ))}
    </div>
  )
}
