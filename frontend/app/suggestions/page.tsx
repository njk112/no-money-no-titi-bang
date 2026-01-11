'use client'

import { useState } from 'react'
import { BudgetInput } from '@/components/budget-input'
import { SuggestionsGrid } from '@/components/suggestions-grid'
import { ItemDetailModal } from '@/components/item-detail-modal'
import { useSuggestions } from '@/hooks/use-suggestions'

export default function SuggestionsPage() {
  const { suggestions, isLoading, fetchSuggestions } = useSuggestions()
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Suggestions</h1>

      <BudgetInput onSubmit={fetchSuggestions} isLoading={isLoading} />

      <SuggestionsGrid
        suggestions={suggestions}
        isLoading={isLoading}
        onItemClick={setSelectedItemId}
      />

      <ItemDetailModal
        itemId={selectedItemId}
        isOpen={selectedItemId !== null}
        onClose={() => setSelectedItemId(null)}
      />
    </div>
  )
}
