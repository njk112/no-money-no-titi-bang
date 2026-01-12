'use client'

import { Star, ExternalLink } from 'lucide-react'
import { Modal } from '@/components/modal'
import { LastRefreshed } from '@/components/last-refreshed'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useItem } from '@/hooks/use-item'
import { cn } from '@/lib/utils'

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
  const { item, isLoading, error } = useItem(isOpen ? itemId : null)

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
            <h2 className="text-xl font-bold flex items-center gap-2">
              {item.name}
              {item.members && (
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              )}
            </h2>
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
