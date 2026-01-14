'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { useItems } from '@/hooks/use-items'
import { useGroups, Group } from '@/hooks/use-groups'
import type { Item } from '@/lib/types'

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

function suggestGroup(itemName: string, groups: Group[]): Group | null {
  const nameLower = itemName.toLowerCase()

  // Check groups in sort_order (excluding Unknown which should be last)
  const sortedGroups = [...groups]
    .filter(g => g.slug !== 'unknown')
    .sort((a, b) => a.sort_order - b.sort_order)

  for (const group of sortedGroups) {
    for (const keyword of group.keywords) {
      if (nameLower.includes(keyword.toLowerCase())) {
        return group
      }
    }
  }

  return null
}

const UNKNOWN_PARAMS = { group: 'unknown' } as const

export default function ReviewUnknownsPage() {
  const { items, isLoading: itemsLoading, total } = useItems(UNKNOWN_PARAMS)
  const { groups, isLoading: groupsLoading } = useGroups()

  const isLoading = itemsLoading || groupsLoading

  const itemsWithSuggestions = useMemo(() => {
    if (!groups.length) return items.map(item => ({ item, suggestedGroup: null }))

    return items.map(item => ({
      item,
      suggestedGroup: suggestGroup(item.name, groups)
    }))
  }, [items, groups])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Settings
          </Button>
        </Link>
      </div>

      <h1 className="text-3xl font-bold">Review Unknown Items</h1>

      <Card>
        <CardHeader>
          <CardTitle>Unknown Items</CardTitle>
          <CardDescription>
            Items that have not been classified into a group. Review and assign them to appropriate groups.
            {!isLoading && ` (${total} items)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading...
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No unknown items found. All items have been classified!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="w-12">Icon</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Suggested Group</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsWithSuggestions.map(({ item, suggestedGroup }) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Checkbox />
                    </TableCell>
                    <TableCell>
                      <ItemIcon src={item.icon_url} alt={item.name} />
                    </TableCell>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-1">
                        {item.name}
                        {item.members && (
                          <span className="text-xs text-yellow-600 font-medium">P2P</span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(item.high_price)}
                    </TableCell>
                    <TableCell>
                      {suggestedGroup ? (
                        <span
                          className="inline-block px-2 py-0.5 text-xs rounded-full text-white"
                          style={{ backgroundColor: suggestedGroup.color }}
                        >
                          {suggestedGroup.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">No suggestion</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
