import { test } from '@japa/runner'
import { computeWindowFeatures, computeMedian } from '#services/regime/window_features'

test.group('Window Features - computeWindowFeatures', () => {
  test('chop ratio is high (close to 1) for trending series', ({ assert }) => {
    // Trending upward - net movement equals total movement
    const prices = [1, 2, 3, 4, 5]
    const features = computeWindowFeatures(prices)
    assert.isAbove(features.chop, 0.8, 'Chop should be high for trending series')
  })

  test('chop ratio is low (close to 0) for oscillating series', ({ assert }) => {
    // Oscillating - net movement is small, total movement is large
    const prices = [1, 3, 1, 3, 1]
    const features = computeWindowFeatures(prices)
    assert.isBelow(features.chop, 0.3, 'Chop should be low for oscillating series')
  })

  test('rangeNorm is small for tight band', ({ assert }) => {
    // Tight price band around 100
    const prices = [100, 101, 100, 101, 100]
    const features = computeWindowFeatures(prices)
    assert.isBelow(features.rangeNorm, 0.02, 'Range norm should be small for tight band')
  })

  test('rangeNorm is larger for wide band', ({ assert }) => {
    // Wide price band
    const prices = [100, 150, 100, 150, 100]
    const features = computeWindowFeatures(prices)
    assert.isAbove(features.rangeNorm, 0.3, 'Range norm should be larger for wide band')
  })

  test('slopeNorm is near zero for flat series', ({ assert }) => {
    // Flat series with small variations
    const prices = [100, 100, 100, 100, 100]
    const features = computeWindowFeatures(prices)
    assert.closeTo(features.slopeNorm, 0, 0.001, 'Slope norm should be near zero for flat series')
  })

  test('slopeNorm is higher for trending series', ({ assert }) => {
    // Clear upward trend
    const prices = [100, 110, 120, 130, 140]
    const features = computeWindowFeatures(prices)
    assert.isAbove(features.slopeNorm, 0.001, 'Slope norm should be positive for upward trend')
  })

  test('crossRate is high for oscillating series', ({ assert }) => {
    // Oscillates around mean - many crossings
    const prices = [100, 102, 98, 102, 98]
    const features = computeWindowFeatures(prices)
    // Should have multiple mean crossings
    assert.isAbove(features.crossRate, 0.2, 'Cross rate should be high for oscillating series')
  })

  test('crossRate is low for trending series', ({ assert }) => {
    // Trending up - stays above/below mean consistently
    const prices = [100, 110, 120, 130, 140]
    const features = computeWindowFeatures(prices)
    assert.isBelow(features.crossRate, 0.3, 'Cross rate should be low for trending series')
  })

  test('handles constant prices (edge case)', ({ assert }) => {
    const prices = [5, 5, 5, 5, 5]
    const features = computeWindowFeatures(prices)

    // Constant prices should have:
    // - chop = 0 (no net movement, no total movement -> 0/0 handled)
    // - rangeNorm = 0 (no range)
    // - slopeNorm = 0 (no slope)
    // - crossRate = 0 (all at mean, no crossings)
    assert.closeTo(features.rangeNorm, 0, 0.001, 'Range norm should be 0 for constant prices')
    assert.closeTo(features.slopeNorm, 0, 0.001, 'Slope norm should be 0 for constant prices')
  })
})

test.group('Window Features - computeMedian', () => {
  test('returns middle value for odd-length array', ({ assert }) => {
    const values = [1, 3, 5]
    assert.equal(computeMedian(values), 3)
  })

  test('returns average of middle values for even-length array', ({ assert }) => {
    const values = [1, 2, 3, 4]
    assert.equal(computeMedian(values), 2.5)
  })

  test('handles single element', ({ assert }) => {
    const values = [7]
    assert.equal(computeMedian(values), 7)
  })

  test('returns 0 for empty array', ({ assert }) => {
    const values: number[] = []
    assert.equal(computeMedian(values), 0)
  })

  test('handles unsorted array correctly', ({ assert }) => {
    const values = [5, 1, 3]
    assert.equal(computeMedian(values), 3)
  })
})
