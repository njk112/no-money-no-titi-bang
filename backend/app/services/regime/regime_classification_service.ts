import { DateTime } from 'luxon'
import RegimeThreshold from '#models/regime_threshold'
import RegimeSegmentModel from '#models/regime_segment'
import Item from '#models/item'
import { classifyRegime, type PricePoint } from './classifier.js'
import { buildSegments, type RegimeSegment } from './segment_builder.js'

/**
 * Service that orchestrates the full regime classification pipeline.
 */
export class RegimeClassificationService {
  /**
   * Classify an item's price history and return computed segments.
   * Does NOT persist to database - call saveSegments() separately.
   *
   * @param itemId - The item ID (used for reference, not queried)
   * @param prices - Array of PricePoint objects from the item's price history
   * @returns Array of computed RegimeSegment objects
   */
  async classifyItem(_itemId: number, prices: PricePoint[]): Promise<RegimeSegment[]> {
    // Fetch global thresholds
    const thresholdConfig = await RegimeThreshold.getGlobal()

    const thresholds = {
      chopMax: thresholdConfig.chopMax,
      rangeNormMax: thresholdConfig.rangeNormMax,
      slopeNormMax: thresholdConfig.slopeNormMax,
      crossRateMin: thresholdConfig.crossRateMin,
    }

    // Run classification over rolling windows
    const windowLabels = classifyRegime(prices, {
      windowSize: thresholdConfig.windowSize,
      stepSize: 1,
      thresholds,
    })

    // Merge consecutive windows into segments
    const priceValues = prices.map((p) => p.price)
    const segments = buildSegments(windowLabels, priceValues)

    return segments
  }

  /**
   * Save regime segments to the database.
   * Uses full replace strategy - deletes existing segments and inserts new ones.
   * Also updates the item's current_regime column.
   *
   * @param itemId - The item ID
   * @param segments - Array of RegimeSegment objects to save
   */
  async saveSegments(itemId: number, segments: RegimeSegment[]): Promise<void> {
    // Delete existing segments for this item
    await RegimeSegmentModel.query().where('itemId', itemId).delete()

    // Insert new segments
    for (const segment of segments) {
      await RegimeSegmentModel.create({
        itemId,
        startIdx: segment.startIdx,
        endIdx: segment.endIdx,
        startTs: DateTime.fromJSDate(segment.startTs),
        endTs: DateTime.fromJSDate(segment.endTs),
        label: segment.label,
        chop: segment.avgFeatures.chop,
        rangeNorm: segment.avgFeatures.rangeNorm,
        slopeNorm: segment.avgFeatures.slopeNorm,
        crossRate: segment.avgFeatures.crossRate,
        bandMidpoint: segment.bandMidpoint,
        bandWidthPct: segment.bandWidthPct,
        confidenceScore: segment.confidenceScore,
      })
    }

    // Update item's current_regime with the most recent segment's label
    if (segments.length > 0) {
      // Find segment with latest endTs
      const mostRecentSegment = segments.reduce((latest, seg) =>
        seg.endTs > latest.endTs ? seg : latest
      )

      await Item.query().where('id', itemId).update({ currentRegime: mostRecentSegment.label })
    }
  }
}
