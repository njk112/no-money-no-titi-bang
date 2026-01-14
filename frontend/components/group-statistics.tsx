'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { api } from '@/lib/api'

interface GroupStats {
  group_id: number
  group_name: string
  group_slug: string
  group_color: string
  item_count: number
  total_volume: number
  avg_margin: number
  total_max_profit: number
}

interface GroupStatisticsProps {
  onGroupClick: (slug: string) => void
  pollInterval?: number
}

function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + 'B'
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M'
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K'
  }
  return num.toLocaleString()
}

export function GroupStatistics({ onGroupClick, pollInterval = 60000 }: GroupStatisticsProps) {
  const [stats, setStats] = useState<GroupStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get<GroupStats[]>('/api/groups/stats')
      setStats(response)
    } catch (err) {
      console.error('Failed to fetch group stats:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, pollInterval)
    return () => clearInterval(interval)
  }, [fetchStats, pollInterval])

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border bg-card">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between px-4 py-3 h-auto"
          >
            <span className="text-sm font-semibold">Group Statistics</span>
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4">
            {isLoading ? (
              <div className="text-sm text-muted-foreground py-2">Loading...</div>
            ) : (
              <div className="space-y-1">
                {stats.map((stat) => (
                  <button
                    key={stat.group_id}
                    onClick={() => onGroupClick(stat.group_slug)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent text-left transition-colors"
                  >
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: stat.group_color }}
                    />
                    <span className="text-sm flex-1 min-w-0 truncate">{stat.group_name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{stat.item_count}</span>
                    <span className="text-xs font-medium shrink-0 w-14 text-right">{formatNumber(stat.total_max_profit)}</span>
                  </button>
                ))}
                <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground border-t mt-2 pt-2">
                  <div className="w-3 h-3" />
                  <span className="flex-1">Group</span>
                  <span className="shrink-0">Items</span>
                  <span className="w-14 text-right">Max Profit</span>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
