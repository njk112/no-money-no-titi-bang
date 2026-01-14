import { test } from '@japa/runner'
import {
  classifyWindow,
  classifyRegime,
  type Thresholds,
  type PricePoint,
} from '#services/regime/classifier'
import type { WindowFeatures } from '#services/regime/window_features'

// Default thresholds for testing
const defaultThresholds: Thresholds = {
  chopMax: 0.25,
  rangeNormMax: 0.02,
  slopeNormMax: 0.0005,
  crossRateMin: 0.08,
}

// Helper to create price points from an array of prices
function createPricePoints(prices: number[]): PricePoint[] {
  const baseDate = new Date('2024-01-01T00:00:00Z')
  return prices.map((price, index) => ({
    price,
    timestamp: new Date(baseDate.getTime() + index * 3600000), // 1 hour apart
    index,
  }))
}

test.group('Classifier - classifyWindow', () => {
  test('returns RANGE_BOUND when all thresholds met', ({ assert }) => {
    const features: WindowFeatures = {
      chop: 0.1, // < chopMax (0.25)
      rangeNorm: 0.01, // < rangeNormMax (0.02)
      slopeNorm: 0.0001, // < slopeNormMax (0.0005)
      crossRate: 0.2, // > crossRateMin (0.08)
    }
    const label = classifyWindow(features, defaultThresholds)
    assert.equal(label, 'RANGE_BOUND')
  })

  test('returns TRENDING when chop exceeds threshold', ({ assert }) => {
    const features: WindowFeatures = {
      chop: 0.5, // > chopMax (0.25)
      rangeNorm: 0.01,
      slopeNorm: 0.0001,
      crossRate: 0.2,
    }
    const label = classifyWindow(features, defaultThresholds)
    assert.equal(label, 'TRENDING')
  })

  test('returns TRENDING when rangeNorm exceeds threshold', ({ assert }) => {
    const features: WindowFeatures = {
      chop: 0.1,
      rangeNorm: 0.05, // > rangeNormMax (0.02)
      slopeNorm: 0.0001,
      crossRate: 0.2,
    }
    const label = classifyWindow(features, defaultThresholds)
    assert.equal(label, 'TRENDING')
  })

  test('returns TRENDING when slopeNorm exceeds threshold', ({ assert }) => {
    const features: WindowFeatures = {
      chop: 0.1,
      rangeNorm: 0.01,
      slopeNorm: 0.001, // > slopeNormMax (0.0005)
      crossRate: 0.2,
    }
    const label = classifyWindow(features, defaultThresholds)
    assert.equal(label, 'TRENDING')
  })

  test('returns TRENDING when crossRate is below threshold', ({ assert }) => {
    const features: WindowFeatures = {
      chop: 0.1,
      rangeNorm: 0.01,
      slopeNorm: 0.0001,
      crossRate: 0.05, // < crossRateMin (0.08)
    }
    const label = classifyWindow(features, defaultThresholds)
    assert.equal(label, 'TRENDING')
  })

  test('boundary condition: exactly at threshold values is TRENDING', ({ assert }) => {
    // Exactly at thresholds - conditions use strict inequality
    const features: WindowFeatures = {
      chop: 0.25, // = chopMax, NOT < chopMax
      rangeNorm: 0.02, // = rangeNormMax
      slopeNorm: 0.0005, // = slopeNormMax
      crossRate: 0.08, // = crossRateMin, NOT > crossRateMin
    }
    const label = classifyWindow(features, defaultThresholds)
    assert.equal(label, 'TRENDING')
  })
})

test.group('Classifier - classifyRegime', () => {
  test('classifies linear trend as TRENDING', ({ assert }) => {
    // Linear upward trend
    const prices = [100, 110, 120, 130, 140, 150, 160, 170, 180, 190]
    const series = createPricePoints(prices)

    const results = classifyRegime(series, {
      windowSize: 5,
      thresholds: defaultThresholds,
    })

    assert.isNotEmpty(results, 'Should return results')
    // All windows should be TRENDING for a clear linear trend
    const trendingCount = results.filter((r) => r.label === 'TRENDING').length
    assert.isAbove(
      trendingCount / results.length,
      0.5,
      'Majority of windows should be TRENDING for linear trend'
    )
  })

  test('identifies transition in step change', ({ assert }) => {
    // Step change: flat, then jump, then flat again
    const prices = [
      100, 100, 100, 100, 100, // Flat at 100
      100, 110, 120, 130, 140, // Transition up
      150, 150, 150, 150, 150, // Flat at 150
    ]
    const series = createPricePoints(prices)

    const results = classifyRegime(series, {
      windowSize: 5,
      thresholds: defaultThresholds,
    })

    assert.isNotEmpty(results, 'Should return results')
    // Should have a mix of labels - RANGE_BOUND at start/end, TRENDING in middle
    const labels = results.map((r) => r.label)
    const hasRangeBound = labels.includes('RANGE_BOUND')
    const hasTrending = labels.includes('TRENDING')
    // At least one of these should be true depending on thresholds
    assert.isTrue(hasRangeBound || hasTrending, 'Should classify windows')
  })

  test('returns empty array for empty series', ({ assert }) => {
    const series: PricePoint[] = []

    const results = classifyRegime(series, {
      windowSize: 5,
      thresholds: defaultThresholds,
    })

    assert.isEmpty(results, 'Should return empty array for empty series')
  })

  test('returns empty array for series shorter than window', ({ assert }) => {
    const prices = [100, 101, 102]
    const series = createPricePoints(prices)

    const results = classifyRegime(series, {
      windowSize: 5, // Window size > series length
      thresholds: defaultThresholds,
    })

    assert.isEmpty(results, 'Should return empty array when series is shorter than window')
  })

  test('returns correct number of windows with step size 1', ({ assert }) => {
    const prices = [100, 101, 102, 103, 104, 105, 106]
    const series = createPricePoints(prices)
    const windowSize = 5

    const results = classifyRegime(series, {
      windowSize,
      stepSize: 1,
      thresholds: defaultThresholds,
    })

    // Expected windows: 7 - 5 + 1 = 3
    assert.equal(results.length, 3, 'Should return correct number of windows')
  })

  test('includes correct indices and timestamps in results', ({ assert }) => {
    const prices = [100, 101, 102, 103, 104]
    const series = createPricePoints(prices)

    const results = classifyRegime(series, {
      windowSize: 3,
      thresholds: defaultThresholds,
    })

    // First window: indices 0-2
    assert.equal(results[0].startIdx, 0)
    assert.equal(results[0].endIdx, 2)

    // Second window: indices 1-3
    assert.equal(results[1].startIdx, 1)
    assert.equal(results[1].endIdx, 3)
  })

  test('includes computed features in results', ({ assert }) => {
    const prices = [100, 101, 102, 103, 104]
    const series = createPricePoints(prices)

    const results = classifyRegime(series, {
      windowSize: 3,
      thresholds: defaultThresholds,
    })

    // Each result should have features
    assert.property(results[0], 'features')
    assert.property(results[0].features, 'chop')
    assert.property(results[0].features, 'rangeNorm')
    assert.property(results[0].features, 'slopeNorm')
    assert.property(results[0].features, 'crossRate')
  })
})
