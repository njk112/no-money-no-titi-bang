/**
 * Compute linear regression slope using least squares method.
 *
 * Uses 0-indexed time values (t = 0, 1, 2, ..., n-1) as x values.
 *
 * @param values - Array of y values (prices)
 * @returns The slope of the regression line
 */
export function computeSlope(values: number[]): number {
  const n = values.length

  // Handle edge cases
  if (n <= 1) {
    return 0
  }

  // Calculate means
  // For x values 0, 1, 2, ..., n-1, mean is (n-1)/2
  const xMean = (n - 1) / 2
  const yMean = values.reduce((sum, val) => sum + val, 0) / n

  // Calculate slope using least squares formula:
  // slope = sum((x - xMean)(y - yMean)) / sum((x - xMean)^2)
  let numerator = 0
  let denominator = 0

  for (let i = 0; i < n; i++) {
    const xDiff = i - xMean
    const yDiff = values[i] - yMean
    numerator += xDiff * yDiff
    denominator += xDiff * xDiff
  }

  // Avoid division by zero (shouldn't happen with n > 1, but safety first)
  if (denominator === 0) {
    return 0
  }

  return numerator / denominator
}
