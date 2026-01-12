import type { WindowFeatures } from './window_features.js'

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
