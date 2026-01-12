'use client'

import { RefreshCw } from 'lucide-react'
import { useSyncStatus } from '@/hooks/use-sync-status'

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
  const { lastSyncedAt, isLoading } = useSyncStatus()

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <RefreshCw className="h-4 w-4" />
        <span>Loading...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <RefreshCw className="h-4 w-4" />
      <span>Last refreshed: {formatRelativeTime(lastSyncedAt)}</span>
    </div>
  )
}
