'use client'

import { useMemo } from 'react'
import { TrendingUp, Repeat, AlertTriangle, CheckCircle } from 'lucide-react'
import type { RegimeSegment } from '@/hooks/use-regime-segments'

interface RegimeTimelineProps {
  segments: RegimeSegment[]
  isLoading?: boolean
}

interface TrendSummary {
  icon: 'stable' | 'trending' | 'warning' | 'opportunity'
  title: string
  description: string
}

function getDirectionText(direction: -1 | 0 | 1): string {
  if (direction === 1) return 'upward'
  if (direction === -1) return 'downward'
  return 'sideways'
}

function getTrendSummary(segments: RegimeSegment[]): TrendSummary | null {
  if (segments.length === 0) return null

  // Sort by end time to get most recent
  const sorted = [...segments].sort(
    (a, b) => new Date(b.end_ts).getTime() - new Date(a.end_ts).getTime()
  )
  const current = sorted[0]
  const previous = sorted[1]

  const now = new Date()
  const currentAge = (now.getTime() - new Date(current.end_ts).getTime()) / (1000 * 60 * 60) // hours

  // Check if current segment is recent (within 48 hours)
  const isRecent = currentAge < 48
  const direction = current.slope_direction
  const directionText = getDirectionText(direction)

  if (current.label === 'RANGE_BOUND') {
    // Currently range-bound
    if (previous && previous.label === 'TRENDING') {
      const prevDirection = previous.slope_direction
      const prevDirText = prevDirection === 1 ? 'rising' : prevDirection === -1 ? 'falling' : 'moving'
      return {
        icon: 'opportunity',
        title: 'Just stabilized',
        description: `Price was ${prevDirText} but has now settled into a range. Good time to start flipping if the pattern holds.`,
      }
    }

    // Calculate how long it's been range-bound
    const duration = new Date(current.end_ts).getTime() - new Date(current.start_ts).getTime()
    const daysRangeBound = duration / (1000 * 60 * 60 * 24)

    if (daysRangeBound > 7) {
      return {
        icon: 'stable',
        title: 'Stable for flipping',
        description: `Price has been range-bound for ${Math.round(daysRangeBound)} days. Consistent pattern suggests reliable flipping opportunity.`,
      }
    }

    return {
      icon: 'stable',
      title: 'Currently range-bound',
      description: 'Price is oscillating within a predictable band. Suitable for flipping - buy low, sell high within the range.',
    }
  } else {
    // Currently trending
    const trendDescription = direction === 1
      ? 'Price is trending upward. Risky for flipping - you may sell too early and miss gains, or buy at a peak.'
      : direction === -1
        ? 'Price is trending downward. Risky for flipping - you may buy and watch it keep falling.'
        : 'Price is moving but direction is unclear. Wait for a clearer pattern before trading.'

    if (previous && previous.label === 'RANGE_BOUND') {
      const brokeDirection = direction === 1 ? 'broke upward' : direction === -1 ? 'broke downward' : 'broke out'
      return {
        icon: 'warning',
        title: `Just ${brokeDirection}`,
        description: `Price recently ${brokeDirection} from its stable range. ${trendDescription}`,
      }
    }

    return {
      icon: 'trending',
      title: direction === 1 ? 'Trending up' : direction === -1 ? 'Trending down' : 'Currently trending',
      description: trendDescription,
    }
  }
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

  const trendSummary = useMemo(() => getTrendSummary(segments), [segments])

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

      {/* Trend Summary */}
      {trendSummary && (
        <div
          className={`flex items-start gap-2 p-2.5 rounded-md text-sm ${
            trendSummary.icon === 'stable'
              ? 'bg-green-50 border border-green-200'
              : trendSummary.icon === 'opportunity'
                ? 'bg-blue-50 border border-blue-200'
                : trendSummary.icon === 'warning'
                  ? 'bg-amber-50 border border-amber-200'
                  : 'bg-orange-50 border border-orange-200'
          }`}
        >
          <div className="mt-0.5">
            {trendSummary.icon === 'stable' && (
              <CheckCircle className="w-4 h-4 text-green-600" />
            )}
            {trendSummary.icon === 'opportunity' && (
              <Repeat className="w-4 h-4 text-blue-600" />
            )}
            {trendSummary.icon === 'warning' && (
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            )}
            {trendSummary.icon === 'trending' && (
              <TrendingUp className="w-4 h-4 text-orange-600" />
            )}
          </div>
          <div>
            <div
              className={`font-medium ${
                trendSummary.icon === 'stable'
                  ? 'text-green-700'
                  : trendSummary.icon === 'opportunity'
                    ? 'text-blue-700'
                    : trendSummary.icon === 'warning'
                      ? 'text-amber-700'
                      : 'text-orange-700'
              }`}
            >
              {trendSummary.title}
            </div>
            <div className="text-muted-foreground text-xs mt-0.5">
              {trendSummary.description}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
