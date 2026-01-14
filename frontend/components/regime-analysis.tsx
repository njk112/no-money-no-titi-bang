'use client'

import { useMemo } from 'react'
import { Info } from 'lucide-react'
import type { RegimeSegment } from '@/hooks/use-regime-segments'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface RegimeAnalysisProps {
  segments: RegimeSegment[]
  isLoading?: boolean
}

function formatFeatureValue(value: number, decimals: number = 4): string {
  return value.toFixed(decimals)
}

function getConfidenceLevel(score: number | null): { label: string; className: string } {
  if (score === null) return { label: 'N/A', className: 'bg-muted text-muted-foreground' }
  if (score >= 0.7) return { label: 'High', className: 'bg-green-100 text-green-700' }
  if (score >= 0.4) return { label: 'Medium', className: 'bg-yellow-100 text-yellow-700' }
  return { label: 'Low', className: 'bg-red-100 text-red-700' }
}

const featureExplanations = {
  chop: {
    title: 'Chop (Directional Efficiency)',
    description: 'Measures how much of the total price movement is "net" movement vs back-and-forth oscillation.',
    examples: [
      { label: 'Low (0.1)', meaning: 'Price zigzags a lot - moved 100gp total but only 10gp net. Good for flipping!' },
      { label: 'High (0.8)', meaning: 'Price moves steadily in one direction - trending market.' },
    ],
  },
  rangeNorm: {
    title: 'Range % (Price Band Width)',
    description: 'How wide is the gap between the highest and lowest prices, relative to the item\'s value.',
    examples: [
      { label: 'Low (0.01)', meaning: 'Tight 1% band - stable prices, predictable flipping range.' },
      { label: 'High (0.10)', meaning: 'Wide 10% swings - volatile, risky for flipping.' },
    ],
  },
  slopeNorm: {
    title: 'Slope (Trend Direction)',
    description: 'Is the price trending up or down over time? Based on a linear regression line.',
    examples: [
      { label: 'Low (0.0001)', meaning: 'Flat - no clear trend, price bouncing around the same level.' },
      { label: 'High (0.001)', meaning: 'Tilted - price is climbing or falling steadily.' },
    ],
  },
  crossRate: {
    title: 'Cross Rate (Mean Reversion)',
    description: 'How often does the price cross its average? High crossing = price keeps returning to the middle.',
    examples: [
      { label: 'High (0.15)', meaning: 'Crosses average frequently - mean-reverting, great for flipping!' },
      { label: 'Low (0.02)', meaning: 'Rarely crosses - price stays above or below average (trending).' },
    ],
  },
}

interface InfoTooltipProps {
  feature: keyof typeof featureExplanations
}

function InfoTooltip({ feature }: InfoTooltipProps) {
  const info = featureExplanations[feature]
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <Info className="w-3.5 h-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-sm">
        <div className="space-y-2">
          <p className="font-medium">{info.title}</p>
          <p className="text-muted-foreground">{info.description}</p>
          <div className="space-y-1 pt-1 border-t">
            {info.examples.map((ex, i) => (
              <div key={i} className="text-xs">
                <span className="font-medium">{ex.label}:</span>{' '}
                <span className="text-muted-foreground">{ex.meaning}</span>
              </div>
            ))}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export function RegimeAnalysis({ segments, isLoading }: RegimeAnalysisProps) {
  const currentSegment = useMemo(() => {
    if (segments.length === 0) return null
    // Find most recent segment by end_ts
    return segments.reduce((latest, seg) =>
      new Date(seg.end_ts) > new Date(latest.end_ts) ? seg : latest
    )
  }, [segments])

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!currentSegment) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        No regime data available
      </div>
    )
  }

  const confidence = getConfidenceLevel(currentSegment.confidence_score)

  return (
    <div className="space-y-3">
      {/* Current Regime Label */}
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'px-2.5 py-1 rounded-full text-sm font-medium',
            currentSegment.label === 'RANGE_BOUND'
              ? 'bg-green-100 text-green-700'
              : 'bg-orange-100 text-orange-700'
          )}
        >
          {currentSegment.label === 'RANGE_BOUND' ? 'Range-Bound' : 'Trending'}
        </span>
        <span className={cn('px-2 py-0.5 rounded text-xs font-medium', confidence.className)}>
          {confidence.label} Confidence
        </span>
      </div>

      {/* Window Features Grid */}
      <div className="grid grid-cols-4 gap-3 text-sm">
        <div className="p-2 bg-muted/50 rounded">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Chop</span>
            <InfoTooltip feature="chop" />
          </div>
          <div className="font-medium">{formatFeatureValue(currentSegment.chop)}</div>
        </div>
        <div className="p-2 bg-muted/50 rounded">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Range %</span>
            <InfoTooltip feature="rangeNorm" />
          </div>
          <div className="font-medium">{formatFeatureValue(currentSegment.range_norm)}</div>
        </div>
        <div className="p-2 bg-muted/50 rounded">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Slope</span>
            <InfoTooltip feature="slopeNorm" />
          </div>
          <div className="font-medium">{formatFeatureValue(currentSegment.slope_norm, 6)}</div>
        </div>
        <div className="p-2 bg-muted/50 rounded">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Cross Rate</span>
            <InfoTooltip feature="crossRate" />
          </div>
          <div className="font-medium">{formatFeatureValue(currentSegment.cross_rate)}</div>
        </div>
      </div>

      {/* Band Info for RANGE_BOUND */}
      {currentSegment.label === 'RANGE_BOUND' &&
        currentSegment.band_midpoint !== null &&
        currentSegment.band_width_pct !== null && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-2 bg-green-50 rounded border border-green-100">
              <div className="text-xs text-green-600">Band Midpoint</div>
              <div className="font-medium text-green-700">
                {currentSegment.band_midpoint.toLocaleString()} gp
              </div>
            </div>
            <div className="p-2 bg-green-50 rounded border border-green-100">
              <div className="text-xs text-green-600">Band Width</div>
              <div className="font-medium text-green-700">
                {currentSegment.band_width_pct.toFixed(2)}%
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
