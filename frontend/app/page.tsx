'use client'

import { useState, useMemo, useEffect } from 'react'
import { Star, ChevronDown, X } from 'lucide-react'
import { SearchInput } from '@/components/search-input'
import { FilterPanel } from '@/components/filter-panel'
import { ItemsTable } from '@/components/items-table'
import { TableSkeleton } from '@/components/table-skeleton'
import { ErrorState } from '@/components/error-state'
import { PaginationControls } from '@/components/pagination-controls'
import { ItemDetailModal } from '@/components/item-detail-modal'
import { LastRefreshed } from '@/components/last-refreshed'
import { RegimeSettingsModal } from '@/components/regime-settings-modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { useItems } from '@/hooks/use-items'
import { useGroups } from '@/hooks/use-groups'
import { useDebounce } from '@/hooks/use-debounce'
import { useSettings } from '@/contexts/settings-context'
import type { ItemsParams } from '@/lib/types'

export default function Dashboard() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [minPrice, setMinPrice] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [minMargin, setMinMargin] = useState<string>('')
  const [minVolume, setMinVolume] = useState<string>('')
  const [maxVolume, setMaxVolume] = useState<string>('')
  const [regime, setRegime] = useState<'all' | 'RANGE_BOUND' | 'TRENDING'>('all')
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [groupFilterMode, setGroupFilterMode] = useState<'include' | 'exclude'>('include')
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)

  const { groups } = useGroups()
  const { favorites, blockedItems, showFavoritesOnly, setShowFavoritesOnly, defaultFilters } = useSettings()
  const debouncedSearch = useDebounce(search, 300)

  // Initialize filters with default values from settings on mount
  const [filtersInitialized, setFiltersInitialized] = useState(false)
  useEffect(() => {
    if (!filtersInitialized && defaultFilters) {
      setMinPrice(defaultFilters.minPrice)
      setMaxPrice(defaultFilters.maxPrice)
      setMinMargin(defaultFilters.minMargin)
      setMinVolume(defaultFilters.minVolume)
      setMaxVolume(defaultFilters.maxVolume)
      setFiltersInitialized(true)
    }
  }, [defaultFilters, filtersInitialized])

  const params: ItemsParams = useMemo(() => {
    const groupParam = selectedGroups.length > 0 ? selectedGroups.join(',') : undefined
    return {
      page,
      search: debouncedSearch || undefined,
      min_price: minPrice ? Number(minPrice) : undefined,
      max_price: maxPrice ? Number(maxPrice) : undefined,
      min_margin: minMargin ? Number(minMargin) : undefined,
      min_volume: minVolume ? Number(minVolume) : undefined,
      max_volume: maxVolume ? Number(maxVolume) : undefined,
      regime: regime !== 'all' ? regime : undefined,
      group: groupFilterMode === 'include' ? groupParam : undefined,
      exclude_group: groupFilterMode === 'exclude' ? groupParam : undefined,
      sort: 'profit',
      order: 'desc',
    }
  }, [page, debouncedSearch, minPrice, maxPrice, minMargin, minVolume, maxVolume, regime, selectedGroups, groupFilterMode])

  const { items, totalPages, isLoading, error, refetch } = useItems(params, { pollInterval: 60000 })

  // Filter out blocked items and optionally filter to favorites only
  const filteredItems = useMemo(() => {
    let result = items.filter((item) => !blockedItems.includes(item.id))
    if (showFavoritesOnly) {
      result = result.filter((item) => favorites.includes(item.id))
    }
    return result
  }, [items, blockedItems, favorites, showFavoritesOnly])

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

  const handleResetFilters = () => {
    setMinPrice(defaultFilters.minPrice)
    setMaxPrice(defaultFilters.maxPrice)
    setMinMargin(defaultFilters.minMargin)
    setMinVolume(defaultFilters.minVolume)
    setMaxVolume(defaultFilters.maxVolume)
    setRegime('all')
    setSelectedGroups([])
    setGroupFilterMode('include')
    setPage(1)
  }

  const handleGroupToggle = (slug: string) => {
    setSelectedGroups(prev =>
      prev.includes(slug)
        ? prev.filter(s => s !== slug)
        : [...prev, slug]
    )
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">OSRS GE Dashboard</h1>
        <LastRefreshed />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Filters sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <FilterPanel onResetFilters={handleResetFilters}>
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
              <div>
                <Label htmlFor="minVolume">Min Volume</Label>
                <Input
                  id="minVolume"
                  type="number"
                  placeholder="0"
                  value={minVolume}
                  onChange={(e) => {
                    setMinVolume(e.target.value)
                    setPage(1)
                  }}
                />
              </div>
              <div>
                <Label htmlFor="maxVolume">Max Volume</Label>
                <Input
                  id="maxVolume"
                  type="number"
                  placeholder="No limit"
                  value={maxVolume}
                  onChange={(e) => {
                    setMaxVolume(e.target.value)
                    setPage(1)
                  }}
                />
              </div>
              <div>
                <Label htmlFor="regime">Regime</Label>
                <Select
                  value={regime}
                  onValueChange={(value: 'all' | 'RANGE_BOUND' | 'TRENDING') => {
                    setRegime(value)
                    setPage(1)
                  }}
                >
                  <SelectTrigger id="regime" className="w-full">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="RANGE_BOUND">Range-Bound</SelectItem>
                    <SelectItem value="TRENDING">Trending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Groups</Label>
                <div className="flex items-center gap-2 mt-1 mb-2">
                  <Button
                    variant={groupFilterMode === 'include' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 h-7 text-xs"
                    onClick={() => {
                      setGroupFilterMode('include')
                      setPage(1)
                    }}
                  >
                    Include
                  </Button>
                  <Button
                    variant={groupFilterMode === 'exclude' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 h-7 text-xs"
                    onClick={() => {
                      setGroupFilterMode('exclude')
                      setPage(1)
                    }}
                  >
                    Exclude
                  </Button>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span className="truncate">
                        {selectedGroups.length > 0
                          ? `${selectedGroups.length} selected`
                          : 'Select groups...'}
                      </span>
                      <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0" align="start">
                    <div className="max-h-60 overflow-y-auto p-2">
                      {groups.map((group) => (
                        <div
                          key={group.id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer"
                          onClick={() => handleGroupToggle(group.slug)}
                        >
                          <Checkbox
                            checked={selectedGroups.includes(group.slug)}
                            onCheckedChange={() => handleGroupToggle(group.slug)}
                          />
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: group.color }}
                          />
                          <span className="text-sm truncate">{group.name}</span>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                {selectedGroups.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedGroups.map((slug) => {
                      const group = groups.find(g => g.slug === slug)
                      if (!group) return null
                      return (
                        <span
                          key={slug}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full"
                          style={{ backgroundColor: group.color, color: '#fff' }}
                        >
                          {group.name}
                          <X
                            className="h-3 w-3 cursor-pointer hover:opacity-70"
                            onClick={() => handleGroupToggle(slug)}
                          />
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
              <div className="pt-2">
                <RegimeSettingsModal />
              </div>
            </div>
          </FilterPanel>
        </aside>

        {/* Main content */}
        <div className="flex-1 space-y-4">
          {/* Search and Favorites Toggle */}
          <div className="flex gap-2">
            <div className="flex-1">
              <SearchInput
                value={search}
                onChange={handleSearchChange}
                placeholder="Search items..."
              />
            </div>
            <Button
              variant={showFavoritesOnly ? 'default' : 'outline'}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className="shrink-0"
            >
              <Star
                className={`w-4 h-4 mr-2 ${showFavoritesOnly ? 'fill-current' : ''}`}
              />
              Favorites
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-lg border">
            {isLoading ? (
              <TableSkeleton />
            ) : error ? (
              <ErrorState message={error.message} onRetry={refetch} />
            ) : (
              <ItemsTable items={filteredItems} onItemClick={handleItemClick} />
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
