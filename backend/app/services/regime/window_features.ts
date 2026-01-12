import { computeSlope } from './linear_regression.js'

/**
 * Scale-free features computed from a price window.
 */
export interface WindowFeatures {
  /** Chop ratio: how much of total movement is net movement (0=oscillating, 1=trending) */
  chop: number
  /** Normalized range: (max - min) / median */
  rangeNorm: number
  /** Normalized slope: abs(slope) / median */
  slopeNorm: number
  /** Mean-crossing rate: frequency of crossing the mean price */
  crossRate: number
}

const EPSILON = 1e-10

/**
 * Compute the median of an array of numbers.
 *
 * @param values - Array of numbers
 * @returns The median value
 */
export function computeMedian(values: number[]): number {
  if (values.length === 0) {
    return 0
  }

  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }

  return sorted[mid]
}

/**
 * Compute scale-free features from a price window.
 *
 * @param prices - Array of prices in the window
 * @returns WindowFeatures object with chop, rangeNorm, slopeNorm, crossRate
 */
export function computeWindowFeatures(prices: number[]): WindowFeatures {
  const n = prices.length

  // Handle edge cases
  if (n === 0) {
    return { chop: 0, rangeNorm: 0, slopeNorm: 0, crossRate: 0 }
  }

  if (n === 1) {
    return { chop: 0, rangeNorm: 0, slopeNorm: 0, crossRate: 0 }
  }

  // Calculate basic statistics
  const median = computeMedian(prices)
  const mean = prices.reduce((sum, p) => sum + p, 0) / n
  const min = Math.min(...prices)
  const max = Math.max(...prices)

  // Chop ratio: abs(p[n-1] - p[0]) / (sum(abs(diff(p))) + eps)
  // Net movement / total movement
  const netMovement = Math.abs(prices[n - 1] - prices[0])
  let totalMovement = 0
  for (let i = 1; i < n; i++) {
    totalMovement += Math.abs(prices[i] - prices[i - 1])
  }
  const chop = netMovement / (totalMovement + EPSILON)

  // Normalized range: (max - min) / (median + eps)
  const rangeNorm = (max - min) / (median + EPSILON)

  // Normalized slope: abs(slope) / (median + eps)
  const slope = computeSlope(prices)
  const slopeNorm = Math.abs(slope) / (median + EPSILON)

  // Mean-crossing rate: count sign changes in (p - mean(p)), return crossings / n
  let crossings = 0
  const deviations = prices.map((p) => p - mean)
  for (let i = 1; i < n; i++) {
    // Sign change if one is positive and other is negative (or zero boundary)
    if (deviations[i - 1] * deviations[i] < 0) {
      crossings++
    }
  }
  const crossRate = crossings / n

  return { chop, rangeNorm, slopeNorm, crossRate }
}
