'use client'

import { useState, useMemo } from 'react'
import { SearchInput } from '@/components/search-input'
import { FilterPanel } from '@/components/filter-panel'
import { ItemsTable } from '@/components/items-table'
import { TableSkeleton } from '@/components/table-skeleton'
import { ErrorState } from '@/components/error-state'
import { PaginationControls } from '@/components/pagination-controls'
import { ItemDetailModal } from '@/components/item-detail-modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useItems } from '@/hooks/use-items'
import { useDebounce } from '@/hooks/use-debounce'
import type { ItemsParams } from '@/lib/types'

export default function Dashboard() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [minPrice, setMinPrice] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [minMargin, setMinMargin] = useState<string>('')
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)

  const debouncedSearch = useDebounce(search, 300)

  const params: ItemsParams = useMemo(() => ({
    page,
    search: debouncedSearch || undefined,
    min_price: minPrice ? Number(minPrice) : undefined,
    max_price: maxPrice ? Number(maxPrice) : undefined,
    min_margin: minMargin ? Number(minMargin) : undefined,
    sort: 'profit',
    order: 'desc',
  }), [page, debouncedSearch, minPrice, maxPrice, minMargin])

  const { items, totalPages, isLoading, error, refetch } = useItems(params)

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1) // Reset to page 1 on search
  }

  const handleItemClick = (itemId: number) => {
    setSelectedItemId(itemId)
  }

  const handleCloseModal = () => {
    setSelectedItemId(null)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">OSRS GE Dashboard</h1>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Filters sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <FilterPanel>
            <div className="space-y-4">
              <div>
                <Label htmlFor="minPrice">Min Price</Label>
                <Input
                  id="minPrice"
                  type="number"
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value)
                    setPage(1)
                  }}
                />
              </div>
              <div>
                <Label htmlFor="maxPrice">Max Price</Label>
                <Input
                  id="maxPrice"
                  type="number"
                  placeholder="No limit"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value)
                    setPage(1)
                  }}
                />
              </div>
              <div>
                <Label htmlFor="minMargin">Min Margin</Label>
                <Input
                  id="minMargin"
                  type="number"
                  placeholder="0"
                  value={minMargin}
                  onChange={(e) => {
                    setMinMargin(e.target.value)
                    setPage(1)
                  }}
                />
              </div>
            </div>
          </FilterPanel>
        </aside>

        {/* Main content */}
        <div className="flex-1 space-y-4">
          {/* Search */}
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            placeholder="Search items..."
          />

          {/* Table */}
          <div className="rounded-lg border">
            {isLoading ? (
              <TableSkeleton />
            ) : error ? (
              <ErrorState message={error.message} onRetry={refetch} />
            ) : (
              <ItemsTable items={items} onItemClick={handleItemClick} />
            )}
          </div>

          {/* Pagination */}
          {!isLoading && !error && totalPages > 1 && (
            <PaginationControls
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </div>
      </div>

      {/* Item Detail Modal */}
      <ItemDetailModal
        itemId={selectedItemId}
        isOpen={selectedItemId !== null}
        onClose={handleCloseModal}
      />
    </div>
  )
}
