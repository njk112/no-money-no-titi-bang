'use client'

import { useState } from 'react'
import { Star, ExternalLink, Ban, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/modal'
import { LastRefreshed } from '@/components/last-refreshed'
import { RegimeTimeline } from '@/components/regime-timeline'
import { RegimeAnalysis } from '@/components/regime-analysis'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useItem } from '@/hooks/use-item'
import { useGroups } from '@/hooks/use-groups'
import { useRegimeSegments } from '@/hooks/use-regime-segments'
import { useSettings } from '@/contexts/settings-context'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

interface ItemDetailModalProps {
  itemId: number | null
  isOpen: boolean
  onClose: () => void
}

function formatNumber(num: number | null): string {
  if (num === null) return '-'
  return num.toLocaleString()
}

function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return '-'
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}

export function ItemDetailModal({ itemId, isOpen, onClose }: ItemDetailModalProps) {
  const { item, isLoading, error, refetch } = useItem(isOpen ? itemId : null)
  const { groups } = useGroups()
  const { segments, isLoading: isLoadingRegime } = useRegimeSegments(isOpen ? itemId : null)
  const { favorites, toggleFavorite, toggleBlocked } = useSettings()
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json')
  const [isExporting, setIsExporting] = useState(false)
  const [isSavingGroup, setIsSavingGroup] = useState(false)

  const isFavorited = itemId ? favorites.includes(itemId) : false

  const handleGroupChange = async (groupId: string) => {
    if (!itemId) return

    setIsSavingGroup(true)
    try {
      await api.patch(`/api/items/${itemId}/group`, {
        groupId: groupId === 'unclassified' ? null : Number(groupId)
      })
      toast.success('Group updated successfully')
      refetch()
    } catch (err) {
      toast.error('Failed to update group')
      console.error('Failed to update group:', err)
    } finally {
      setIsSavingGroup(false)
    }
  }

  const handleExport = async () => {
    if (!itemId || !item) return

    setIsExporting(true)
    try {
      const url = `/api/regime/export/${itemId}?format=${exportFormat}`

      if (exportFormat === 'csv') {
        // For CSV, fetch as text and trigger download
        const response = await fetch(`${api.baseUrl}${url}`)
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `${item.name.replace(/\s+/g, '-')}-regime-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(downloadUrl)
        document.body.removeChild(a)
      } else {
        // For JSON, fetch and trigger download
        const data = await api.get<unknown>(url)
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `${item.name.replace(/\s+/g, '-')}-regime-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(downloadUrl)
        document.body.removeChild(a)
      }
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setIsExporting(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {isLoading && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      )}

      {error && (
        <div className="text-center py-4 text-destructive">
          Failed to load item details
        </div>
      )}

      {item && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            {item.icon_url ? (
              <img
                src={item.icon_url}
                alt={item.name}
                className="w-16 h-16 object-contain"
              />
            ) : (
              <div className="w-16 h-16 bg-muted rounded" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {item.name}
                  {item.members && (
                    <span className="text-xs text-yellow-600 font-medium px-1.5 py-0.5 bg-yellow-100 rounded">P2P</span>
                  )}
                </h2>
                {item.group ? (
                  <span
                    className="px-2 py-0.5 text-xs rounded-full text-white"
                    style={{ backgroundColor: item.group.color }}
                  >
                    {item.group.name}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-600">
                    Unclassified
                  </span>
                )}
                <button
                  onClick={() => toggleFavorite(item.id)}
                  className="p-1 hover:bg-muted rounded"
                  title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star
                    className={cn(
                      'w-5 h-5 transition-colors',
                      isFavorited
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'text-muted-foreground hover:text-yellow-500'
                    )}
                  />
                </button>
                <button
                  onClick={() => {
                    toggleBlocked(item.id)
                    onClose()
                  }}
                  className="p-1 hover:bg-muted rounded"
                  title="Block item"
                >
                  <Ban className="w-5 h-5 text-muted-foreground hover:text-red-500 transition-colors" />
                </button>
              </div>
            </div>
          </div>

          {/* Group Selection */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">
              Change Group
            </h3>
            <Select
              value={item.group?.id.toString() ?? 'unclassified'}
              onValueChange={handleGroupChange}
              disabled={isSavingGroup}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unclassified">Unclassified</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      {group.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Regime Timeline Section */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">
              Price Regime
            </h3>
            <RegimeTimeline segments={segments} isLoading={isLoadingRegime} />
          </div>

          {/* Regime Analysis Section */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">
              Regime Analysis
            </h3>
            <RegimeAnalysis segments={segments} isLoading={isLoadingRegime} />
            {segments.length > 0 && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                <Select
                  value={exportFormat}
                  onValueChange={(value: 'json' | 'csv') => setExportFormat(value)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  <Download className="w-4 h-4 mr-1" />
                  {isExporting ? 'Exporting...' : 'Export Data'}
                </Button>
              </div>
            )}
          </div>

          {/* Current Prices Section */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">
              Current Prices
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Instant Buy</div>
                <div className="font-medium text-lg">{formatNumber(item.low_price)} gp</div>
                <div className="text-xs text-muted-foreground">
                  {formatRelativeTime(item.low_time)}
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Instant Sell</div>
                <div className="font-medium text-lg">{formatNumber(item.high_price)} gp</div>
                <div className="text-xs text-muted-foreground">
                  {formatRelativeTime(item.high_time)}
                </div>
              </div>
            </div>
          </div>

          {/* 24h Price Stats Section */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">
              24h Price Range
            </h3>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="space-y-2">
                <div className="font-medium text-muted-foreground">Overall</div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">High:</span>
                  <span className="text-green-600">{formatNumber(item.overall_high ?? null)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Low:</span>
                  <span className="text-red-600">{formatNumber(item.overall_low ?? null)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-muted-foreground">Buying</div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">High:</span>
                  <span>{formatNumber(item.buying_high ?? null)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Low:</span>
                  <span>{formatNumber(item.buying_low ?? null)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-muted-foreground">Selling</div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">High:</span>
                  <span>{formatNumber(item.selling_high ?? null)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Low:</span>
                  <span>{formatNumber(item.selling_low ?? null)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profit Potential Section */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">
              Profit Potential
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Buy Limit</div>
                <div className="font-medium">{formatNumber(item.buy_limit)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Margin</div>
                <div className={cn(
                  'font-medium',
                  item.profit_margin && item.profit_margin > 0 ? 'text-green-600' : ''
                )}>
                  {formatNumber(item.profit_margin)} gp
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Max Profit</div>
                <div className="font-medium text-lg text-green-600">
                  {formatNumber(item.max_profit)} gp
                </div>
              </div>
            </div>
          </div>

          {/* Alchemy Values Section */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">
              Alchemy Values
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">High Alch</div>
                <div className="font-medium">{formatNumber(item.high_alch)} gp</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Low Alch</div>
                <div className="font-medium">{formatNumber(item.low_alch)} gp</div>
              </div>
            </div>
          </div>

          {/* Trading Volume Section */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">
              Trading Volume
            </h3>
            <div>
              <div className="text-sm text-muted-foreground">Daily Volume</div>
              <div className="font-medium">{formatNumber(item.volume ?? null)}</div>
            </div>
          </div>

          {/* External Link */}
          {item.ge_tracker_url && (
            <div className="pt-2">
              <Button variant="outline" className="w-full" asChild>
                <a
                  href={item.ge_tracker_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on GE-Tracker
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          )}

          {/* Last Refreshed */}
          <div className="pt-4 border-t">
            <LastRefreshed />
          </div>
        </div>
      )}
    </Modal>
  )
}
