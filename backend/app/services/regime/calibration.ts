import { computeWindowFeatures, type WindowFeatures } from './window_features.js'

/**
 * Distribution statistics for a feature.
 */
export interface DistributionStats {
  min: number
  max: number
  p25: number
  p50: number
  p75: number
}

/**
 * Suggested thresholds with distribution statistics.
 */
export interface SuggestedThresholds {
  /** Suggested chopMax threshold (25th percentile) */
  chopMax: number
  /** Suggested rangeNormMax threshold (25th percentile) */
  rangeNormMax: number
  /** Suggested slopeNormMax threshold (25th percentile) */
  slopeNormMax: number
  /** Suggested crossRateMin threshold (75th percentile) */
  crossRateMin: number
  /** Distribution stats for chop values */
  chopStats: DistributionStats
  /** Distribution stats for rangeNorm values */
  rangeNormStats: DistributionStats
  /** Distribution stats for slopeNorm values */
  slopeNormStats: DistributionStats
  /** Distribution stats for crossRate values */
  crossRateStats: DistributionStats
  /** Number of windows analyzed */
  windowCount: number
}

/**
 * Calculate percentile of a sorted array.
 */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0

  const index = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)

  if (lower === upper) {
    return sorted[lower]
  }

  const weight = index - lower
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

/**
 * Calculate distribution statistics for an array of values.
 */
function calculateStats(values: number[]): DistributionStats {
  if (values.length === 0) {
    return { min: 0, max: 0, p25: 0, p50: 0, p75: 0 }
  }

  const sorted = [...values].sort((a, b) => a - b)

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p25: percentile(sorted, 25),
    p50: percentile(sorted, 50),
    p75: percentile(sorted, 75),
  }
}

/**
 * Auto-calibrate thresholds based on price distributions.
 *
 * Analyzes rolling features across all provided price arrays and suggests
 * thresholds based on percentiles:
 * - chopMax: 25th percentile (low values indicate range-bound)
 * - rangeNormMax: 25th percentile (low values indicate range-bound)
 * - slopeNormMax: 25th percentile (low values indicate range-bound)
 * - crossRateMin: 75th percentile (high values indicate range-bound)
 *
 * @param allPrices - Array of price arrays (one per item)
 * @param windowSize - Size of rolling window
 * @returns Suggested thresholds with distribution statistics
 */
export function autoCalibrateThresholds(
  allPrices: number[][],
  windowSize: number
): SuggestedThresholds {
  // Collect all feature values across all price arrays
  const chopValues: number[] = []
  const rangeNormValues: number[] = []
  const slopeNormValues: number[] = []
  const crossRateValues: number[] = []

  for (const prices of allPrices) {
    // Skip if not enough prices for window
    if (prices.length < windowSize) continue

    // Compute features for each window position
    for (let i = 0; i <= prices.length - windowSize; i++) {
      const window = prices.slice(i, i + windowSize)
      const features: WindowFeatures = computeWindowFeatures(window)

      chopValues.push(features.chop)
      rangeNormValues.push(features.rangeNorm)
      slopeNormValues.push(features.slopeNorm)
      crossRateValues.push(features.crossRate)
    }
  }

  // Calculate distribution statistics
  const chopStats = calculateStats(chopValues)
  const rangeNormStats = calculateStats(rangeNormValues)
  const slopeNormStats = calculateStats(slopeNormValues)
  const crossRateStats = calculateStats(crossRateValues)

  return {
    // Suggest thresholds based on percentiles
    chopMax: chopStats.p25,
    rangeNormMax: rangeNormStats.p25,
    slopeNormMax: slopeNormStats.p25,
    crossRateMin: crossRateStats.p75,
    // Include full distribution stats
    chopStats,
    rangeNormStats,
    slopeNormStats,
    crossRateStats,
    windowCount: chopValues.length,
  }
}
