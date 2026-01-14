import {
  classifyWindow,
  type Thresholds,
  type RegimeLabel,
  type PricePoint,
} from './classifier.js'
import { computeWindowFeatures, type WindowFeatures } from './window_features.js'
import type { RegimeSegment } from './segment_builder.js'
import { computeMedian } from './window_features.js'

/**
 * State object for streaming classification.
 * Maintains a rolling window buffer and tracks the current regime.
 */
export interface StreamState {
  /** Size of the rolling window */
  windowSize: number
  /** Classification thresholds */
  thresholds: Thresholds
  /** Rolling buffer of recent price points (max length = windowSize) */
  priceBuffer: PricePoint[]
  /** Current computed features (null until buffer is full) */
  currentFeatures: WindowFeatures | null
  /** Current regime label (null until first classification) */
  currentLabel: RegimeLabel | null
  /** Timestamp when current segment started */
  segmentStartTs: Date | null
  /** Start index when current segment started */
  segmentStartIdx: number | null
  /** Accumulated features for the current segment (for averaging) */
  segmentFeatures: WindowFeatures[]
}

/**
 * Result of a streaming update operation.
 */
export interface StreamUpdateResult {
  /** Updated state object */
  state: StreamState
  /** Whether the label changed from the previous classification */
  labelChanged: boolean
  /** Completed segment if label changed (the previous segment) */
  segment?: RegimeSegment
}

/**
 * Initialize a new streaming classification state.
 *
 * @param windowSize - Size of the rolling window
 * @param thresholds - Classification thresholds
 * @returns Initial StreamState object
 */
export function initStreamState(windowSize: number, thresholds: Thresholds): StreamState {
  return {
    windowSize,
    thresholds,
    priceBuffer: [],
    currentFeatures: null,
    currentLabel: null,
    segmentStartTs: null,
    segmentStartIdx: null,
    segmentFeatures: [],
  }
}

/**
 * Calculate average of accumulated features.
 */
function averageFeatures(features: WindowFeatures[]): WindowFeatures {
  if (features.length === 0) {
    return { chop: 0, rangeNorm: 0, slopeNorm: 0, crossRate: 0 }
  }

  const sum = features.reduce(
    (acc, f) => ({
      chop: acc.chop + f.chop,
      rangeNorm: acc.rangeNorm + f.rangeNorm,
      slopeNorm: acc.slopeNorm + f.slopeNorm,
      crossRate: acc.crossRate + f.crossRate,
    }),
    { chop: 0, rangeNorm: 0, slopeNorm: 0, crossRate: 0 }
  )

  const n = features.length
  return {
    chop: sum.chop / n,
    rangeNorm: sum.rangeNorm / n,
    slopeNorm: sum.slopeNorm / n,
    crossRate: sum.crossRate / n,
  }
}

/**
 * Calculate confidence score based on how far features are from thresholds.
 */
function calculateConfidenceScore(
  label: RegimeLabel,
  features: WindowFeatures,
  thresholds: Thresholds
): number {
  const { chopMax, rangeNormMax, slopeNormMax, crossRateMin } = thresholds

  if (label === 'RANGE_BOUND') {
    const chopMargin = Math.max(0, 1 - features.chop / chopMax)
    const rangeMargin = Math.max(0, 1 - features.rangeNorm / rangeNormMax)
    const slopeMargin = Math.max(0, 1 - features.slopeNorm / slopeNormMax)
    const crossMargin = Math.max(0, Math.min(1, (features.crossRate - crossRateMin) / (1 - crossRateMin)))

    return (chopMargin + rangeMargin + slopeMargin + crossMargin) / 4
  } else {
    const chopExcess = Math.max(0, Math.min(1, (features.chop - chopMax) / (1 - chopMax)))
    const rangeExcess = Math.max(0, Math.min(1, features.rangeNorm / rangeNormMax - 1))
    const slopeExcess = Math.max(0, Math.min(1, features.slopeNorm / slopeNormMax - 1))
    const crossDeficit = Math.max(0, 1 - features.crossRate / crossRateMin)

    return Math.max(chopExcess, rangeExcess, slopeExcess, crossDeficit)
  }
}

/**
 * Finalize a completed segment when label changes.
 */
function finalizeSegment(
  state: StreamState,
  endTs: Date,
  endIdx: number
): RegimeSegment {
  const label = state.currentLabel!
  const avgFeatures = averageFeatures(state.segmentFeatures)
  const confidenceScore = calculateConfidenceScore(label, avgFeatures, state.thresholds)

  // Calculate band metrics for RANGE_BOUND segments
  let bandMidpoint: number | null = null
  let bandWidthPct: number | null = null

  if (label === 'RANGE_BOUND') {
    const prices = state.priceBuffer.map((p) => p.price)
    if (prices.length > 0) {
      bandMidpoint = computeMedian(prices)
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)

      if (bandMidpoint > 0) {
        bandWidthPct = ((maxPrice - minPrice) / bandMidpoint) * 100
      }
    }
  }

  return {
    startIdx: state.segmentStartIdx!,
    endIdx,
    startTs: state.segmentStartTs!,
    endTs,
    label,
    bandMidpoint,
    bandWidthPct,
    confidenceScore,
    avgFeatures,
  }
}

/**
 * Update the streaming classifier with a new price point.
 *
 * This function maintains a rolling window buffer, recomputes features
 * when the buffer is full, and detects label transitions to emit segments.
 *
 * @param state - Current stream state
 * @param newPrice - New price point to add
 * @returns StreamUpdateResult with updated state and optional completed segment
 */
export function updateStream(state: StreamState, newPrice: PricePoint): StreamUpdateResult {
  // Create a new state object (immutable update)
  const newState: StreamState = {
    ...state,
    priceBuffer: [...state.priceBuffer, newPrice],
    segmentFeatures: [...state.segmentFeatures],
  }

  // Maintain rolling window - remove oldest if over capacity
  if (newState.priceBuffer.length > state.windowSize) {
    newState.priceBuffer = newState.priceBuffer.slice(-state.windowSize)
  }

  // Not enough data yet for classification
  if (newState.priceBuffer.length < state.windowSize) {
    return {
      state: newState,
      labelChanged: false,
    }
  }

  // Compute features for current window
  const prices = newState.priceBuffer.map((p) => p.price)
  const features = computeWindowFeatures(prices)
  newState.currentFeatures = features

  // Classify the current window
  const newLabel = classifyWindow(features, state.thresholds)

  // Check if this is the first classification
  if (state.currentLabel === null) {
    newState.currentLabel = newLabel
    newState.segmentStartTs = newState.priceBuffer[0].timestamp
    newState.segmentStartIdx = newState.priceBuffer[0].index
    newState.segmentFeatures = [features]

    return {
      state: newState,
      labelChanged: false, // First classification isn't a "change"
    }
  }

  // Check if label changed
  const labelChanged = newLabel !== state.currentLabel

  if (labelChanged) {
    // Finalize the previous segment
    const previousBufferEnd = state.priceBuffer[state.priceBuffer.length - 1]
    const segment = finalizeSegment(state, previousBufferEnd.timestamp, previousBufferEnd.index)

    // Start new segment
    newState.currentLabel = newLabel
    newState.segmentStartTs = newPrice.timestamp
    newState.segmentStartIdx = newPrice.index
    newState.segmentFeatures = [features]

    return {
      state: newState,
      labelChanged: true,
      segment,
    }
  }

  // Same label - accumulate features for averaging
  newState.currentLabel = newLabel
  newState.segmentFeatures.push(features)

  return {
    state: newState,
    labelChanged: false,
  }
}
