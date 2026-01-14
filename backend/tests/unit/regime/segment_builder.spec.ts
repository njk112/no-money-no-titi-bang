import { test } from '@japa/runner'
import { buildSegments } from '#services/regime/segment_builder'
import type { WindowLabel } from '#services/regime/classifier'
import type { WindowFeatures } from '#services/regime/window_features'

// Helper to create WindowLabel objects for testing
function createWindowLabel(
  startIdx: number,
  endIdx: number,
  label: 'RANGE_BOUND' | 'TRENDING',
  features: Partial<WindowFeatures> = {}
): WindowLabel {
  const defaultFeatures: WindowFeatures = {
    chop: label === 'RANGE_BOUND' ? 0.1 : 0.5,
    rangeNorm: label === 'RANGE_BOUND' ? 0.01 : 0.05,
    slopeNorm: label === 'RANGE_BOUND' ? 0.0001 : 0.001,
    crossRate: label === 'RANGE_BOUND' ? 0.15 : 0.03,
    ...features,
  }

  return {
    startIdx,
    endIdx,
    startTs: new Date(2024, 0, 1 + startIdx),
    endTs: new Date(2024, 0, 1 + endIdx),
    label,
    features: defaultFeatures,
  }
}

test.group('Segment Builder - buildSegments', () => {
  test('returns empty array for empty input', ({ assert }) => {
    const result = buildSegments([], [])
    assert.deepEqual(result, [])
  })

  test('merges consecutive RANGE_BOUND windows into one segment', ({ assert }) => {
    const labels: WindowLabel[] = [
      createWindowLabel(0, 5, 'RANGE_BOUND'),
      createWindowLabel(1, 6, 'RANGE_BOUND'),
      createWindowLabel(2, 7, 'RANGE_BOUND'),
    ]
    const prices = [100, 101, 100, 102, 101, 100, 101, 100]

    const result = buildSegments(labels, prices)

    assert.equal(result.length, 1, 'Should produce single segment')
    assert.equal(result[0].label, 'RANGE_BOUND')
    assert.equal(result[0].startIdx, 0)
    assert.equal(result[0].endIdx, 7)
  })

  test('merges consecutive TRENDING windows into one segment', ({ assert }) => {
    const labels: WindowLabel[] = [
      createWindowLabel(0, 5, 'TRENDING'),
      createWindowLabel(1, 6, 'TRENDING'),
      createWindowLabel(2, 7, 'TRENDING'),
    ]
    const prices = [100, 110, 120, 130, 140, 150, 160, 170]

    const result = buildSegments(labels, prices)

    assert.equal(result.length, 1, 'Should produce single segment')
    assert.equal(result[0].label, 'TRENDING')
    assert.equal(result[0].startIdx, 0)
    assert.equal(result[0].endIdx, 7)
  })

  test('creates segment boundary at label transition', ({ assert }) => {
    const labels: WindowLabel[] = [
      createWindowLabel(0, 5, 'RANGE_BOUND'),
      createWindowLabel(1, 6, 'RANGE_BOUND'),
      createWindowLabel(2, 7, 'TRENDING'),
      createWindowLabel(3, 8, 'TRENDING'),
    ]
    const prices = [100, 101, 100, 120, 140, 160, 180, 200, 220]

    const result = buildSegments(labels, prices)

    assert.equal(result.length, 2, 'Should produce two segments')
    assert.equal(result[0].label, 'RANGE_BOUND')
    assert.equal(result[0].endIdx, 6)
    assert.equal(result[1].label, 'TRENDING')
    assert.equal(result[1].startIdx, 2)
  })

  test('RB-TR-RB pattern creates 3 segments', ({ assert }) => {
    const labels: WindowLabel[] = [
      createWindowLabel(0, 5, 'RANGE_BOUND'),
      createWindowLabel(1, 6, 'RANGE_BOUND'),
      createWindowLabel(2, 7, 'TRENDING'),
      createWindowLabel(3, 8, 'TRENDING'),
      createWindowLabel(4, 9, 'RANGE_BOUND'),
      createWindowLabel(5, 10, 'RANGE_BOUND'),
    ]
    const prices = [100, 101, 100, 110, 120, 130, 120, 125, 124, 125, 124]

    const result = buildSegments(labels, prices)

    assert.equal(result.length, 3, 'Should produce three segments')
    assert.equal(result[0].label, 'RANGE_BOUND')
    assert.equal(result[1].label, 'TRENDING')
    assert.equal(result[2].label, 'RANGE_BOUND')
  })

  test('calculates bandMidpoint for RANGE_BOUND segment', ({ assert }) => {
    const labels: WindowLabel[] = [
      createWindowLabel(0, 5, 'RANGE_BOUND'),
      createWindowLabel(1, 6, 'RANGE_BOUND'),
    ]
    // Prices: [100, 102, 98, 104, 96, 100, 101]
    // Segment covers indices 0-6, median of sorted [96, 98, 100, 100, 101, 102, 104] = 100
    const prices = [100, 102, 98, 104, 96, 100, 101]

    const result = buildSegments(labels, prices)

    assert.equal(result.length, 1)
    assert.equal(result[0].label, 'RANGE_BOUND')
    assert.isNotNull(result[0].bandMidpoint, 'bandMidpoint should be calculated for RANGE_BOUND')
    assert.equal(result[0].bandMidpoint, 100, 'bandMidpoint should be median of segment prices')
  })

  test('calculates bandWidthPct correctly', ({ assert }) => {
    const labels: WindowLabel[] = [createWindowLabel(0, 4, 'RANGE_BOUND')]
    // Prices: [100, 110, 90, 105, 95]
    // Sorted: [90, 95, 100, 105, 110]
    // Median = 100, min = 90, max = 110
    // bandWidthPct = ((110 - 90) / 100) * 100 = 20%
    const prices = [100, 110, 90, 105, 95]

    const result = buildSegments(labels, prices)

    assert.equal(result.length, 1)
    assert.isNotNull(result[0].bandWidthPct)
    assert.closeTo(result[0].bandWidthPct!, 20, 0.01, 'bandWidthPct should be 20%')
  })

  test('TRENDING segment has null bandMidpoint and bandWidthPct', ({ assert }) => {
    const labels: WindowLabel[] = [createWindowLabel(0, 5, 'TRENDING')]
    const prices = [100, 110, 120, 130, 140, 150]

    const result = buildSegments(labels, prices)

    assert.equal(result.length, 1)
    assert.equal(result[0].label, 'TRENDING')
    assert.isNull(result[0].bandMidpoint, 'TRENDING segment should have null bandMidpoint')
    assert.isNull(result[0].bandWidthPct, 'TRENDING segment should have null bandWidthPct')
  })

  test('confidenceScore is between 0 and 1', ({ assert }) => {
    const labels: WindowLabel[] = [
      createWindowLabel(0, 5, 'RANGE_BOUND'),
      createWindowLabel(1, 6, 'TRENDING'),
    ]
    const prices = [100, 101, 100, 110, 120, 130, 140]

    const result = buildSegments(labels, prices)

    assert.equal(result.length, 2)

    for (const segment of result) {
      assert.isNotNull(segment.confidenceScore, 'confidenceScore should not be null')
      assert.isAtLeast(segment.confidenceScore!, 0, 'confidenceScore should be >= 0')
      assert.isAtMost(segment.confidenceScore!, 1, 'confidenceScore should be <= 1')
    }
  })

  test('avgFeatures is computed correctly from multiple windows', ({ assert }) => {
    const labels: WindowLabel[] = [
      createWindowLabel(0, 5, 'RANGE_BOUND', { chop: 0.1, rangeNorm: 0.01, slopeNorm: 0.0001, crossRate: 0.2 }),
      createWindowLabel(1, 6, 'RANGE_BOUND', { chop: 0.2, rangeNorm: 0.02, slopeNorm: 0.0002, crossRate: 0.3 }),
      createWindowLabel(2, 7, 'RANGE_BOUND', { chop: 0.3, rangeNorm: 0.03, slopeNorm: 0.0003, crossRate: 0.4 }),
    ]
    const prices = [100, 101, 100, 101, 100, 101, 100, 101]

    const result = buildSegments(labels, prices)

    assert.equal(result.length, 1)
    // Average: chop = 0.2, rangeNorm = 0.02, slopeNorm = 0.0002, crossRate = 0.3
    assert.closeTo(result[0].avgFeatures.chop, 0.2, 0.001)
    assert.closeTo(result[0].avgFeatures.rangeNorm, 0.02, 0.001)
    assert.closeTo(result[0].avgFeatures.slopeNorm, 0.0002, 0.00001)
    assert.closeTo(result[0].avgFeatures.crossRate, 0.3, 0.001)
  })

  test('single window creates valid segment', ({ assert }) => {
    const labels: WindowLabel[] = [createWindowLabel(0, 5, 'RANGE_BOUND')]
    const prices = [100, 101, 100, 101, 100, 101]

    const result = buildSegments(labels, prices)

    assert.equal(result.length, 1)
    assert.equal(result[0].startIdx, 0)
    assert.equal(result[0].endIdx, 5)
    assert.equal(result[0].label, 'RANGE_BOUND')
    assert.isNotNull(result[0].avgFeatures)
    assert.isNotNull(result[0].confidenceScore)
  })

  test('preserves timestamps from window labels', ({ assert }) => {
    const startDate = new Date(2024, 5, 15)
    const endDate = new Date(2024, 5, 20)

    const labels: WindowLabel[] = [
      {
        startIdx: 0,
        endIdx: 5,
        startTs: startDate,
        endTs: endDate,
        label: 'RANGE_BOUND',
        features: { chop: 0.1, rangeNorm: 0.01, slopeNorm: 0.0001, crossRate: 0.2 },
      },
    ]
    const prices = [100, 101, 100, 101, 100, 101]

    const result = buildSegments(labels, prices)

    assert.equal(result.length, 1)
    assert.deepEqual(result[0].startTs, startDate)
    assert.deepEqual(result[0].endTs, endDate)
  })
})
