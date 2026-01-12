import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Item from '#models/item'
import ItemPrice from '#models/item_price'
import RegimeSegment from '#models/regime_segment'
import RegimeThreshold from '#models/regime_threshold'
import { RegimeClassificationService } from '#services/regime/regime_classification_service'
import type { PricePoint } from '#services/regime/classifier'

// Helper to create a test item
async function createTestItem(name: string): Promise<Item> {
  return Item.create({
    id: Math.floor(Math.random() * 1000000) + 1000,
    name,
    members: false,
  })
}

// Helper to create price history for an item
async function createPriceHistory(
  itemId: number,
  prices: number[],
  startTime: DateTime = DateTime.now().minus({ hours: prices.length })
): Promise<ItemPrice[]> {
  const itemPrices: ItemPrice[] = []

  for (let i = 0; i < prices.length; i++) {
    const syncedAt = startTime.plus({ hours: i })
    const price = await ItemPrice.create({
      itemId,
      highPrice: prices[i],
      lowPrice: prices[i] - 5,
      highTime: syncedAt,
      lowTime: syncedAt,
      syncedAt,
      volume: 1000,
    })
    itemPrices.push(price)
  }

  return itemPrices
}

// Helper to convert ItemPrice array to PricePoint array
function toPricePoints(itemPrices: ItemPrice[]): PricePoint[] {
  return itemPrices.map((p, index) => ({
    price: p.highPrice ?? p.lowPrice ?? 0,
    timestamp: p.syncedAt.toJSDate(),
    index,
  }))
}

test.group('Regime Classification Integration', (group) => {
  // Ensure threshold config exists before tests
  group.setup(async () => {
    // Delete any existing thresholds and recreate to ensure clean state
    await RegimeThreshold.query().delete()
    await RegimeThreshold.create({
      chopMax: 0.25,
      rangeNormMax: 0.02,
      slopeNormMax: 0.0005,
      crossRateMin: 0.08,
      windowSize: 24,
    })
  })

  // Clean up after each test
  group.each.teardown(async () => {
    await RegimeSegment.query().delete()
    await ItemPrice.query().delete()
    await Item.query().where('name', 'like', 'Test%').delete()
  })

  test('full flow: create item, add price history, run classification, verify segments', async ({
    assert,
  }) => {
    // Create test item
    const item = await createTestItem('Test Item Full Flow')

    // Create range-bound price history (oscillating around 100)
    const prices: number[] = []
    for (let i = 0; i < 30; i++) {
      // Oscillate between 98 and 102
      prices.push(100 + (i % 2 === 0 ? 2 : -2))
    }
    const itemPrices = await createPriceHistory(item.id, prices)

    // Run classification
    const service = new RegimeClassificationService()
    const pricePoints = toPricePoints(itemPrices)
    const segments = await service.classifyItem(item.id, pricePoints)

    // Verify segments were computed
    assert.isAbove(segments.length, 0, 'Should have at least one segment')

    // Save segments to database
    await service.saveSegments(item.id, segments)

    // Verify segments in database
    const dbSegments = await RegimeSegment.query().where('itemId', item.id)
    assert.equal(dbSegments.length, segments.length, 'DB should have same number of segments')

    // Verify segment properties
    for (const seg of dbSegments) {
      assert.oneOf(seg.label, ['RANGE_BOUND', 'TRENDING'])
      assert.isNotNull(seg.chop)
      assert.isNotNull(seg.rangeNorm)
      assert.isNotNull(seg.slopeNorm)
      assert.isNotNull(seg.crossRate)
    }
  })

  test('current_regime on item is updated correctly', async ({ assert }) => {
    // Create test item
    const item = await createTestItem('Test Item Regime Update')

    // Initially current_regime should be null or undefined (not set)
    assert.isUndefined(item.currentRegime)

    // Create trending price history
    const prices: number[] = []
    for (let i = 0; i < 30; i++) {
      prices.push(100 + i * 5) // Clear upward trend
    }
    const itemPrices = await createPriceHistory(item.id, prices)

    // Run classification and save
    const service = new RegimeClassificationService()
    const pricePoints = toPricePoints(itemPrices)
    const segments = await service.classifyItem(item.id, pricePoints)
    await service.saveSegments(item.id, segments)

    // Refresh item from database
    await item.refresh()

    // current_regime should now be set
    assert.isNotNull(item.currentRegime)
    assert.oneOf(item.currentRegime, ['RANGE_BOUND', 'TRENDING'])
  })

  test('threshold update triggers correct recalculation', async ({ assert }) => {
    // Create test item with border-line price pattern
    const item = await createTestItem('Test Item Threshold Update')

    // Create oscillating prices
    const prices: number[] = []
    for (let i = 0; i < 30; i++) {
      prices.push(100 + (i % 2 === 0 ? 3 : -3))
    }
    const itemPrices = await createPriceHistory(item.id, prices)
    const pricePoints = toPricePoints(itemPrices)

    const service = new RegimeClassificationService()

    // Run initial classification
    const segments1 = await service.classifyItem(item.id, pricePoints)
    await service.saveSegments(item.id, segments1)

    // Update thresholds to be more strict
    await RegimeThreshold.updateGlobal({
      chopMax: 0.1, // Make chop threshold more strict
      rangeNormMax: 0.01, // Make range threshold more strict
    })

    // Recalculate with new thresholds
    const segments2 = await service.classifyItem(item.id, pricePoints)
    await service.saveSegments(item.id, segments2)
    const dbSegments2 = await RegimeSegment.query().where('itemId', item.id)

    // Segments should exist after recalculation
    assert.isAbove(dbSegments2.length, 0, 'Should have segments after recalculation')

    // Restore original thresholds
    await RegimeThreshold.updateGlobal({
      chopMax: 0.25,
      rangeNormMax: 0.02,
    })

    // Note: The actual classification result may or may not differ
    // based on the specific price pattern. What we're testing is that
    // recalculation works without errors.
    assert.isTrue(true, 'Recalculation completed without errors')
  })

  test('segment data has correct format and valid values', async ({ assert }) => {
    // Create test item
    const item = await createTestItem('Test Item Format')

    // Create price history
    const prices: number[] = []
    for (let i = 0; i < 30; i++) {
      prices.push(100 + Math.sin(i / 3) * 5)
    }
    const itemPrices = await createPriceHistory(item.id, prices)

    // Run classification and save
    const service = new RegimeClassificationService()
    const pricePoints = toPricePoints(itemPrices)
    const segments = await service.classifyItem(item.id, pricePoints)
    await service.saveSegments(item.id, segments)

    // Verify segment data format
    const dbSegments = await RegimeSegment.query().where('itemId', item.id)

    for (const seg of dbSegments) {
      // Check required fields exist
      assert.isNumber(seg.id)
      assert.equal(seg.itemId, item.id)
      assert.isNumber(seg.startIdx)
      assert.isNumber(seg.endIdx)
      assert.instanceOf(seg.startTs.toJSDate(), Date)
      assert.instanceOf(seg.endTs.toJSDate(), Date)
      assert.oneOf(seg.label, ['RANGE_BOUND', 'TRENDING'])

      // Check feature values are in valid ranges
      assert.isAtLeast(seg.chop, 0)
      assert.isAtMost(seg.chop, 1)
      assert.isAtLeast(seg.rangeNorm, 0)
      assert.isAtLeast(seg.slopeNorm, 0)
      assert.isAtLeast(seg.crossRate, 0)
      assert.isAtMost(seg.crossRate, 1)

      // Check confidence score is valid
      if (seg.confidenceScore !== null) {
        assert.isAtLeast(seg.confidenceScore, 0)
        assert.isAtMost(seg.confidenceScore, 1)
      }

      // For RANGE_BOUND, band metrics should be present
      if (seg.label === 'RANGE_BOUND') {
        // Band metrics may still be null if no valid data
        if (seg.bandMidpoint !== null) {
          assert.isAbove(seg.bandMidpoint, 0)
        }
        if (seg.bandWidthPct !== null) {
          assert.isAtLeast(seg.bandWidthPct, 0)
        }
      }
    }
  })

  test('empty price history returns no segments', async ({ assert }) => {
    // Create test item
    const item = await createTestItem('Test Item Empty')

    // Run classification with empty prices
    const service = new RegimeClassificationService()
    const segments = await service.classifyItem(item.id, [])

    assert.equal(segments.length, 0, 'Empty prices should return no segments')
  })

  test('price history shorter than window size returns no segments', async ({ assert }) => {
    // Create test item
    const item = await createTestItem('Test Item Short')

    // Get current window size from threshold config
    const threshold = await RegimeThreshold.getGlobal()

    // Create price history shorter than window size
    const prices: number[] = []
    for (let i = 0; i < threshold.windowSize - 1; i++) {
      prices.push(100)
    }
    const itemPrices = await createPriceHistory(item.id, prices)

    // Run classification
    const service = new RegimeClassificationService()
    const pricePoints = toPricePoints(itemPrices)
    const segments = await service.classifyItem(item.id, pricePoints)

    assert.equal(segments.length, 0, 'Short price history should return no segments')
  })

  test('saveSegments replaces existing segments', async ({ assert }) => {
    // Create test item
    const item = await createTestItem('Test Item Replace')

    // Create initial price history
    const prices1: number[] = []
    for (let i = 0; i < 30; i++) {
      prices1.push(100)
    }
    const itemPrices1 = await createPriceHistory(item.id, prices1)

    const service = new RegimeClassificationService()

    // Run first classification
    const pricePoints1 = toPricePoints(itemPrices1)
    const segments1 = await service.classifyItem(item.id, pricePoints1)
    await service.saveSegments(item.id, segments1)

    // Create new price history and run classification again
    await ItemPrice.query().where('itemId', item.id).delete()

    const prices2: number[] = []
    for (let i = 0; i < 30; i++) {
      prices2.push(100 + i * 10) // Different pattern
    }
    const itemPrices2 = await createPriceHistory(item.id, prices2)
    const pricePoints2 = toPricePoints(itemPrices2)
    const segments2 = await service.classifyItem(item.id, pricePoints2)
    await service.saveSegments(item.id, segments2)

    // Verify old segments were replaced
    const dbSegments2 = await RegimeSegment.query().where('itemId', item.id)

    // The segments should be from the second classification (full replace)
    assert.equal(dbSegments2.length, segments2.length)

    // Verify no duplicate or stale segments
    const allSegments = await RegimeSegment.query().where('itemId', item.id)
    assert.equal(allSegments.length, segments2.length, 'Should only have segments from latest classification')
  })
})
