'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import { useSyncStatus } from '@/hooks/use-sync-status'
import { cn } from '@/lib/utils'

const COOLDOWN_SECONDS = 30

function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return 'Never'

  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)

  if (diffSeconds < 60) {
    return 'just now'
  } else if (diffMinutes < 60) {
    return `${diffMinutes} min ago`
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  } else {
    return date.toLocaleDateString()
  }
}

export function LastRefreshed() {
  const { lastSyncedAt, isLoading, refetch } = useSyncStatus()
  const [cooldownRemaining, setCooldownRemaining] = useState(0)

  const isOnCooldown = cooldownRemaining > 0
  const isSpinning = isLoading || isOnCooldown

  useEffect(() => {
    if (cooldownRemaining <= 0) return

    const timer = setInterval(() => {
      setCooldownRemaining((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [cooldownRemaining])

  const handleRefresh = useCallback(() => {
    if (isOnCooldown || isLoading) return
    refetch()
    setCooldownRemaining(COOLDOWN_SECONDS)
  }, [isOnCooldown, isLoading, refetch])

  const getButtonTitle = () => {
    if (isLoading) return 'Refreshing...'
    if (isOnCooldown) return `Wait ${cooldownRemaining}s`
    return 'Refresh'
  }

  if (isLoading && !isOnCooldown) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>Loading...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <button
        onClick={handleRefresh}
        disabled={isOnCooldown || isLoading}
        title={getButtonTitle()}
        className={cn(
          'p-1 rounded hover:bg-muted transition-colors',
          (isOnCooldown || isLoading) && 'cursor-not-allowed opacity-50'
        )}
      >
        <RefreshCw className={cn('h-4 w-4', isSpinning && 'animate-spin')} />
      </button>
      <span>Last refreshed: {formatRelativeTime(lastSyncedAt)}</span>
    </div>
  )
}
