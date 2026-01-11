'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Item } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ItemsTableProps {
  items: Item[]
  onItemClick?: (itemId: number) => void
}

function ItemIcon({ src, alt }: { src: string | null; alt: string }) {
  const [hasError, setHasError] = useState(false)

  if (!src || hasError) {
    return <div className="w-8 h-8 bg-muted rounded" />
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-8 h-8 object-contain"
      loading="lazy"
      onError={() => setHasError(true)}
    />
  )
}

function formatNumber(num: number | null): string {
  if (num === null) return '-'
  return num.toLocaleString()
}

function getMarginColor(margin: number | null): string {
  if (margin === null || margin <= 0) return 'text-muted-foreground'
  if (margin <= 100) return 'text-yellow-600'
  return 'text-green-600'
}

export function ItemsTable({ items, onItemClick }: ItemsTableProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No items found
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">Icon</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="text-right">Buy Price</TableHead>
          <TableHead className="text-right">Sell Price</TableHead>
          <TableHead className="text-right">Margin</TableHead>
          <TableHead className="text-right">Buy Limit</TableHead>
          <TableHead className="text-right">Max Profit</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow
            key={item.id}
            className={cn(
              'cursor-pointer hover:bg-muted/50',
              onItemClick && 'cursor-pointer'
            )}
            onClick={() => onItemClick?.(item.id)}
          >
            <TableCell>
              <ItemIcon src={item.icon_url} alt={item.name} />
            </TableCell>
            <TableCell className="font-medium">
              <span className="flex items-center gap-1">
                {item.name}
                {item.members && (
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                )}
              </span>
            </TableCell>
            <TableCell className="text-right">
              {formatNumber(item.low_price)}
            </TableCell>
            <TableCell className="text-right">
              {formatNumber(item.high_price)}
            </TableCell>
            <TableCell className={cn('text-right', getMarginColor(item.profit_margin))}>
              {formatNumber(item.profit_margin)}
            </TableCell>
            <TableCell className="text-right">
              {formatNumber(item.buy_limit)}
            </TableCell>
            <TableCell className="text-right">
              {formatNumber(item.max_profit)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
