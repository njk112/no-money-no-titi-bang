'use client'

import { useMemo } from 'react'
import type { RegimeSegment } from '@/hooks/use-regime-segments'

interface RegimeTimelineProps {
  segments: RegimeSegment[]
  isLoading?: boolean
}

/**
 * Visualizes regime segments as a horizontal timeline with colored bars.
 * Green (#22c55e) for RANGE_BOUND, Orange (#f97316) for TRENDING.
 */
export function RegimeTimeline({ segments, isLoading }: RegimeTimelineProps) {
  const timelineData = useMemo(() => {
    if (segments.length === 0) return null

    // Find overall time range
    const startTime = Math.min(...segments.map((s) => new Date(s.start_ts).getTime()))
    const endTime = Math.max(...segments.map((s) => new Date(s.end_ts).getTime()))
    const totalDuration = endTime - startTime

    if (totalDuration <= 0) return null

    // Calculate segment positions as percentages
    return segments.map((segment) => {
      const segStart = new Date(segment.start_ts).getTime()
      const segEnd = new Date(segment.end_ts).getTime()
      const leftPercent = ((segStart - startTime) / totalDuration) * 100
      const widthPercent = ((segEnd - segStart) / totalDuration) * 100

      return {
        ...segment,
        leftPercent,
        widthPercent,
      }
    })
  }, [segments])

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="h-4 w-48 bg-muted rounded animate-pulse" />
      </div>
    )
  }

  if (!timelineData || timelineData.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No regime data available
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Timeline bar */}
      <div className="relative h-8 bg-muted/30 rounded-md overflow-hidden border">
        {timelineData.map((segment) => (
          <div
            key={segment.id}
            className="absolute top-0 bottom-0"
            style={{
              left: `${segment.leftPercent}%`,
              width: `${segment.widthPercent}%`,
              backgroundColor:
                segment.label === 'RANGE_BOUND'
                  ? 'rgba(34, 197, 94, 0.2)' // green-500 with 20% opacity
                  : 'rgba(249, 115, 22, 0.2)', // orange-500 with 20% opacity
              borderLeft:
                segment.leftPercent > 0
                  ? segment.label === 'RANGE_BOUND'
                    ? '2px dashed rgba(34, 197, 94, 0.6)'
                    : '2px dashed rgba(249, 115, 22, 0.6)'
                  : 'none',
            }}
            title={`${segment.label}: ${new Date(segment.start_ts).toLocaleDateString()} - ${new Date(segment.end_ts).toLocaleDateString()}`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.6)' }}
          />
          <span>Range-Bound</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: 'rgba(249, 115, 22, 0.2)', border: '1px solid rgba(249, 115, 22, 0.6)' }}
          />
          <span>Trending</span>
        </div>
      </div>
    </div>
  )
}
