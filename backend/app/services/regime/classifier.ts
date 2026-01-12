import { computeWindowFeatures, type WindowFeatures } from './window_features.js'

/**
 * Classification thresholds for determining regime type.
 */
export interface Thresholds {
  /** Maximum chop ratio for RANGE_BOUND classification */
  chopMax: number
  /** Maximum normalized range for RANGE_BOUND classification */
  rangeNormMax: number
  /** Maximum normalized slope for RANGE_BOUND classification */
  slopeNormMax: number
  /** Minimum mean-crossing rate for RANGE_BOUND classification */
  crossRateMin: number
}

/**
 * Regime classification label.
 */
export type RegimeLabel = 'RANGE_BOUND' | 'TRENDING'

/**
 * Classify a single window based on computed features and thresholds.
 *
 * Returns RANGE_BOUND only if ALL conditions are met:
 * - chop < chopMax (low directional efficiency)
 * - rangeNorm < rangeNormMax (tight price band)
 * - slopeNorm < slopeNormMax (minimal trend)
 * - crossRate > crossRateMin (frequent mean reversion)
 *
 * Returns TRENDING if any condition fails.
 *
 * @param features - Computed window features
 * @param thresholds - Classification thresholds
 * @returns RegimeLabel ('RANGE_BOUND' or 'TRENDING')
 */
export function classifyWindow(features: WindowFeatures, thresholds: Thresholds): RegimeLabel {
  const isRangeBound =
    features.chop < thresholds.chopMax &&
    features.rangeNorm < thresholds.rangeNormMax &&
    features.slopeNorm < thresholds.slopeNormMax &&
    features.crossRate > thresholds.crossRateMin

  return isRangeBound ? 'RANGE_BOUND' : 'TRENDING'
}

/**
 * A single price data point with timestamp and index.
 */
export interface PricePoint {
  /** The price value */
  price: number
  /** The timestamp of this price point */
  timestamp: Date
  /** The original index in the price series */
  index: number
}

/**
 * Classification result for a single window.
 */
export interface WindowLabel {
  /** Start index in the price series */
  startIdx: number
  /** End index in the price series */
  endIdx: number
  /** Start timestamp of the window */
  startTs: Date
  /** End timestamp of the window */
  endTs: Date
  /** The regime classification label */
  label: RegimeLabel
  /** The computed features for this window */
  features: WindowFeatures
}

/**
 * Options for the rolling classifier.
 */
export interface ClassifierOptions {
  /** Size of the rolling window */
  windowSize: number
  /** Step size between windows (default: 1) */
  stepSize?: number
  /** Classification thresholds */
  thresholds: Thresholds
}

/**
 * Apply the regime classifier over a rolling window across an entire price series.
 *
 * @param series - Array of price points to classify
 * @param opts - Classifier options including window size, step size, and thresholds
 * @returns Array of WindowLabel objects for each window position
 */
export function classifyRegime(series: PricePoint[], opts: ClassifierOptions): WindowLabel[] {
  const { windowSize, stepSize = 1, thresholds } = opts

  // Handle case where series is shorter than window size
  if (series.length < windowSize) {
    return []
  }

  const results: WindowLabel[] = []

  // Iterate through series with rolling window
  for (let i = 0; i <= series.length - windowSize; i += stepSize) {
    const windowStart = i
    const windowEnd = i + windowSize - 1

    // Extract prices for this window
    const windowPrices = series.slice(windowStart, windowStart + windowSize).map((p) => p.price)

    // Compute features and classify
    const features = computeWindowFeatures(windowPrices)
    const label = classifyWindow(features, thresholds)

    results.push({
      startIdx: series[windowStart].index,
      endIdx: series[windowEnd].index,
      startTs: series[windowStart].timestamp,
      endTs: series[windowEnd].timestamp,
      label,
      features,
    })
  }

  return results
}
