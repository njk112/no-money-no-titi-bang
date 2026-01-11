'use client'

import { Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { SuggestionItem } from '@/lib/types'

interface SuggestionCardProps {
  suggestion: SuggestionItem
  onItemClick: (id: number) => void
}

export function SuggestionCard({ suggestion, onItemClick }: SuggestionCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onItemClick(suggestion.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {suggestion.icon_url ? (
            <img
              src={suggestion.icon_url}
              alt={suggestion.name}
              className="w-12 h-12 object-contain"
            />
          ) : (
            <div className="w-12 h-12 bg-muted rounded" />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium flex items-center gap-1 truncate">
              {suggestion.name}
              {suggestion.members && (
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />
              )}
            </h3>
            <p className="text-sm text-muted-foreground">
              Buy: {suggestion.suggested_quantity.toLocaleString()}
            </p>
            <p className="text-sm font-medium text-green-600">
              +{suggestion.estimated_profit.toLocaleString()} gp
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
