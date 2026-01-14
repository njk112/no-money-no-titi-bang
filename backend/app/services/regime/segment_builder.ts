import type { RegimeLabel, WindowLabel } from './classifier.js'
import { computeMedian, type WindowFeatures } from './window_features.js'

/**
 * A merged segment of consecutive windows with the same regime label.
 */
export interface RegimeSegment {
  /** Start index in the price series */
  startIdx: number
  /** End index in the price series */
  endIdx: number
  /** Start timestamp of the segment */
  startTs: Date
  /** End timestamp of the segment */
  endTs: Date
  /** The regime classification label */
  label: RegimeLabel
  /** Band midpoint price (RANGE_BOUND only) */
  bandMidpoint: number | null
  /** Band width as percentage of midpoint (RANGE_BOUND only) */
  bandWidthPct: number | null
  /** Confidence score (0-1) indicating how strongly thresholds were passed */
  confidenceScore: number | null
  /** Average of all window features in this segment */
  avgFeatures: WindowFeatures
  /** Slope direction: -1 = down, 0 = flat, 1 = up */
  slopeDirection: -1 | 0 | 1
}

/**
 * Calculate confidence score based on how far features are from thresholds.
 * Higher score = more confidently classified.
 *
 * For RANGE_BOUND: lower chop/range/slope and higher crossRate = more confident
 * For TRENDING: the opposite
 */
function calculateConfidenceScore(
  label: RegimeLabel,
  features: WindowFeatures,
  defaultThresholds = { chopMax: 0.25, rangeNormMax: 0.02, slopeNormMax: 0.0005, crossRateMin: 0.08 }
): number {
  const { chopMax, rangeNormMax, slopeNormMax, crossRateMin } = defaultThresholds

  if (label === 'RANGE_BOUND') {
    // For RANGE_BOUND, we want values below thresholds
    // Calculate how much "room" we have from each threshold (0 = at threshold, 1 = far below)
    const chopMargin = Math.max(0, 1 - features.chop / chopMax)
    const rangeMargin = Math.max(0, 1 - features.rangeNorm / rangeNormMax)
    const slopeMargin = Math.max(0, 1 - features.slopeNorm / slopeNormMax)
    // For crossRate, we want it above the minimum
    const crossMargin = Math.max(0, Math.min(1, (features.crossRate - crossRateMin) / (1 - crossRateMin)))

    return (chopMargin + rangeMargin + slopeMargin + crossMargin) / 4
  } else {
    // For TRENDING, confidence is based on how much thresholds were exceeded
    const chopExcess = Math.max(0, Math.min(1, (features.chop - chopMax) / (1 - chopMax)))
    const rangeExcess = Math.max(0, Math.min(1, features.rangeNorm / rangeNormMax - 1))
    const slopeExcess = Math.max(0, Math.min(1, features.slopeNorm / slopeNormMax - 1))
    const crossDeficit = Math.max(0, 1 - features.crossRate / crossRateMin)

    // Take max of excesses (any single strong indicator is enough for trending)
    return Math.max(chopExcess, rangeExcess, slopeExcess, crossDeficit)
  }
}

/**
 * Average multiple WindowFeatures objects.
 */
function averageFeatures(features: WindowFeatures[]): WindowFeatures {
  if (features.length === 0) {
    return { chop: 0, rangeNorm: 0, slopeNorm: 0, crossRate: 0, rawSlope: 0 }
  }

  const sum = features.reduce(
    (acc, f) => ({
      chop: acc.chop + f.chop,
      rangeNorm: acc.rangeNorm + f.rangeNorm,
      slopeNorm: acc.slopeNorm + f.slopeNorm,
      crossRate: acc.crossRate + f.crossRate,
      rawSlope: acc.rawSlope + f.rawSlope,
    }),
    { chop: 0, rangeNorm: 0, slopeNorm: 0, crossRate: 0, rawSlope: 0 }
  )

  const n = features.length
  return {
    chop: sum.chop / n,
    rangeNorm: sum.rangeNorm / n,
    slopeNorm: sum.slopeNorm / n,
    crossRate: sum.crossRate / n,
    rawSlope: sum.rawSlope / n,
  }
}

/**
 * Determine slope direction from average raw slope.
 * Uses a small threshold to avoid noise.
 */
function getSlopeDirection(avgRawSlope: number, median: number): -1 | 0 | 1 {
  // Normalize slope relative to price magnitude to determine significance
  const normalizedSlope = median > 0 ? avgRawSlope / median : 0
  const threshold = 0.0001 // Small threshold for "flat"

  if (normalizedSlope > threshold) return 1  // Up
  if (normalizedSlope < -threshold) return -1 // Down
  return 0 // Flat
}

/**
 * Build merged segments from consecutive window labels with the same classification.
 *
 * @param labels - Array of WindowLabel results from classifyRegime
 * @param prices - Array of prices for band calculations (indices should align with labels)
 * @returns Array of merged RegimeSegment objects
 */
export function buildSegments(labels: WindowLabel[], prices: number[]): RegimeSegment[] {
  if (labels.length === 0) {
    return []
  }

  const segments: RegimeSegment[] = []
  let currentSegmentLabels: WindowLabel[] = [labels[0]]

  for (let i = 1; i < labels.length; i++) {
    if (labels[i].label === currentSegmentLabels[0].label) {
      // Same label, extend current segment
      currentSegmentLabels.push(labels[i])
    } else {
      // Different label, finalize current segment and start new one
      segments.push(finalizeSegment(currentSegmentLabels, prices))
      currentSegmentLabels = [labels[i]]
    }
  }

  // Finalize the last segment
  segments.push(finalizeSegment(currentSegmentLabels, prices))

  return segments
}

/**
 * Finalize a segment from a group of consecutive window labels.
 */
function finalizeSegment(windowLabels: WindowLabel[], prices: number[]): RegimeSegment {
  const first = windowLabels[0]
  const last = windowLabels[windowLabels.length - 1]
  const label = first.label

  // Extract all features
  const allFeatures = windowLabels.map((wl) => wl.features)
  const avgFeatures = averageFeatures(allFeatures)

  // Calculate confidence score based on average features
  const confidenceScore = calculateConfidenceScore(label, avgFeatures)

  // Calculate band metrics for RANGE_BOUND segments
  let bandMidpoint: number | null = null
  let bandWidthPct: number | null = null

  if (label === 'RANGE_BOUND') {
    // Extract prices within this segment's range
    const segmentPrices = prices.slice(first.startIdx, last.endIdx + 1)

    if (segmentPrices.length > 0) {
      bandMidpoint = computeMedian(segmentPrices)
      const minPrice = Math.min(...segmentPrices)
      const maxPrice = Math.max(...segmentPrices)

      if (bandMidpoint > 0) {
        bandWidthPct = ((maxPrice - minPrice) / bandMidpoint) * 100
      }
    }
  }

  // Calculate slope direction
  const segmentPricesForSlope = prices.slice(first.startIdx, last.endIdx + 1)
  const medianPrice = segmentPricesForSlope.length > 0 ? computeMedian(segmentPricesForSlope) : 0
  const slopeDirection = getSlopeDirection(avgFeatures.rawSlope, medianPrice)

  return {
    startIdx: first.startIdx,
    endIdx: last.endIdx,
    startTs: first.startTs,
    endTs: last.endTs,
    label,
    bandMidpoint,
    bandWidthPct,
    confidenceScore,
    avgFeatures,
    slopeDirection,
  }
}
