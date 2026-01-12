import { test } from '@japa/runner'
import { computeSlope } from '#services/regime/linear_regression'

test.group('Linear Regression - computeSlope', () => {
  test('returns positive slope for ascending series', ({ assert }) => {
    const values = [1, 2, 3, 4, 5]
    const slope = computeSlope(values)
    assert.isAbove(slope, 0, 'Slope should be positive for ascending series')
    assert.closeTo(slope, 1, 0.0001, 'Slope should be approximately 1')
  })

  test('returns negative slope for descending series', ({ assert }) => {
    const values = [5, 4, 3, 2, 1]
    const slope = computeSlope(values)
    assert.isBelow(slope, 0, 'Slope should be negative for descending series')
    assert.closeTo(slope, -1, 0.0001, 'Slope should be approximately -1')
  })

  test('returns 0 for flat line (constant values)', ({ assert }) => {
    const values = [3, 3, 3, 3]
    const slope = computeSlope(values)
    assert.equal(slope, 0, 'Slope should be 0 for constant values')
  })

  test('returns 0 for single element array', ({ assert }) => {
    const values = [5]
    const slope = computeSlope(values)
    assert.equal(slope, 0, 'Slope should be 0 for single element')
  })

  test('returns 0 for empty array', ({ assert }) => {
    const values: number[] = []
    const slope = computeSlope(values)
    assert.equal(slope, 0, 'Slope should be 0 for empty array')
  })

  test('returns correct slope for two elements', ({ assert }) => {
    const values = [1, 3]
    const slope = computeSlope(values)
    // For [1, 3] with x values [0, 1]:
    // xMean = 0.5, yMean = 2
    // numerator = (0-0.5)*(1-2) + (1-0.5)*(3-2) = 0.5 + 0.5 = 1
    // denominator = (0-0.5)^2 + (1-0.5)^2 = 0.25 + 0.25 = 0.5
    // slope = 1 / 0.5 = 2
    assert.closeTo(slope, 2, 0.0001, 'Slope should be 2 for [1, 3]')
  })

  test('handles steeper positive slope', ({ assert }) => {
    const values = [0, 2, 4, 6, 8]
    const slope = computeSlope(values)
    assert.closeTo(slope, 2, 0.0001, 'Slope should be 2 for evenly spaced values')
  })

  test('handles oscillating values around mean', ({ assert }) => {
    // Values that oscillate around 5
    const values = [4, 6, 4, 6, 4]
    const slope = computeSlope(values)
    // Should be close to 0 since overall trend is flat
    assert.closeTo(slope, 0, 0.5, 'Slope should be close to 0 for oscillating values')
  })
})
