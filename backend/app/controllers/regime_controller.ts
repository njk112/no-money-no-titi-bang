import type { HttpContext } from '@adonisjs/core/http'
import Item from '#models/item'
import ItemPrice from '#models/item_price'
import RegimeSegment from '#models/regime_segment'
import RegimeThreshold from '#models/regime_threshold'
import { RegimeClassificationService } from '#services/regime/regime_classification_service'
import { autoCalibrateThresholds } from '#services/regime/calibration'
import type { PricePoint } from '#services/regime/classifier'

export default class RegimeController {
  /**
   * GET /api/regime/segments/:itemId
   * Fetch regime segments for an item.
   */
  async index({ params, request, response }: HttpContext) {
    const itemId = parseInt(params.itemId, 10)

    // Verify item exists
    const item = await Item.find(itemId)
    if (!item) {
      return response.notFound({ message: 'Item not found' })
    }

    // Build query with optional date range filtering
    const query = RegimeSegment.query()
      .where('itemId', itemId)
      .orderBy('startTs', 'asc')

    const startTs = request.input('startTs')
    const endTs = request.input('endTs')

    if (startTs) {
      query.where('startTs', '>=', new Date(startTs))
    }
    if (endTs) {
      query.where('endTs', '<=', new Date(endTs))
    }

    const segments = await query

    return response.json(
      segments.map((seg) => ({
        id: seg.id,
        item_id: seg.itemId,
        start_idx: seg.startIdx,
        end_idx: seg.endIdx,
        start_ts: seg.startTs.toISO(),
        end_ts: seg.endTs.toISO(),
        label: seg.label,
        chop: seg.chop,
        range_norm: seg.rangeNorm,
        slope_norm: seg.slopeNorm,
        cross_rate: seg.crossRate,
        band_midpoint: seg.bandMidpoint,
        band_width_pct: seg.bandWidthPct,
        confidence_score: seg.confidenceScore,
      }))
    )
  }

  /**
   * GET /api/regime/thresholds
   * Fetch global threshold configuration.
   */
  async getThresholds({ response }: HttpContext) {
    const thresholds = await RegimeThreshold.getGlobal()

    return response.json({
      chop_max: thresholds.chopMax,
      range_norm_max: thresholds.rangeNormMax,
      slope_norm_max: thresholds.slopeNormMax,
      cross_rate_min: thresholds.crossRateMin,
      window_size: thresholds.windowSize,
    })
  }

  /**
   * PUT /api/regime/thresholds
   * Update global threshold configuration.
   */
  async updateThresholds({ request, response }: HttpContext) {
    const body = request.body()

    // Validate numeric ranges
    const errors: string[] = []

    if (body.chop_max !== undefined) {
      const val = parseFloat(body.chop_max)
      if (isNaN(val) || val <= 0 || val > 1) {
        errors.push('chop_max must be a number between 0 and 1')
      }
    }

    if (body.range_norm_max !== undefined) {
      const val = parseFloat(body.range_norm_max)
      if (isNaN(val) || val <= 0) {
        errors.push('range_norm_max must be a positive number')
      }
    }

    if (body.slope_norm_max !== undefined) {
      const val = parseFloat(body.slope_norm_max)
      if (isNaN(val) || val <= 0) {
        errors.push('slope_norm_max must be a positive number')
      }
    }

    if (body.cross_rate_min !== undefined) {
      const val = parseFloat(body.cross_rate_min)
      if (isNaN(val) || val <= 0 || val > 1) {
        errors.push('cross_rate_min must be a number between 0 and 1')
      }
    }

    if (body.window_size !== undefined) {
      const val = parseInt(body.window_size, 10)
      if (isNaN(val) || val <= 0) {
        errors.push('window_size must be a positive integer')
      }
    }

    if (errors.length > 0) {
      return response.badRequest({ errors })
    }

    // Build updates object
    const updates: {
      chopMax?: number
      rangeNormMax?: number
      slopeNormMax?: number
      crossRateMin?: number
      windowSize?: number
    } = {}

    if (body.chop_max !== undefined) updates.chopMax = parseFloat(body.chop_max)
    if (body.range_norm_max !== undefined) updates.rangeNormMax = parseFloat(body.range_norm_max)
    if (body.slope_norm_max !== undefined) updates.slopeNormMax = parseFloat(body.slope_norm_max)
    if (body.cross_rate_min !== undefined) updates.crossRateMin = parseFloat(body.cross_rate_min)
    if (body.window_size !== undefined) updates.windowSize = parseInt(body.window_size, 10)

    const thresholds = await RegimeThreshold.updateGlobal(updates)

    return response.json({
      chop_max: thresholds.chopMax,
      range_norm_max: thresholds.rangeNormMax,
      slope_norm_max: thresholds.slopeNormMax,
      cross_rate_min: thresholds.crossRateMin,
      window_size: thresholds.windowSize,
    })
  }

  /**
   * POST /api/regime/recalculate
   * Trigger full recalculation of regime segments.
   * Optional body: { itemId: number } to recalculate single item.
   */
  async recalculate({ request, response }: HttpContext) {
    const body = request.body()
    const classificationService = new RegimeClassificationService()

    // Get window size for price history fetch
    const thresholds = await RegimeThreshold.getGlobal()
    const windowSize = thresholds.windowSize

    let itemsProcessed = 0
    let segmentsCreated = 0

    // Get list of item IDs to process
    let itemIds: number[]
    if (body.itemId) {
      // Single item recalculation
      const itemId = parseInt(body.itemId, 10)
      const item = await Item.find(itemId)
      if (!item) {
        return response.notFound({ message: 'Item not found' })
      }
      itemIds = [itemId]
    } else {
      // Recalculate all items with price history
      const itemsWithPrices = await ItemPrice.query()
        .select('itemId')
        .distinct('itemId')
      itemIds = itemsWithPrices.map((p) => p.itemId)
    }

    // Process each item
    for (const itemId of itemIds) {
      try {
        // Fetch recent price history
        const priceHistory = await ItemPrice.query()
          .where('itemId', itemId)
          .orderBy('syncedAt', 'desc')
          .limit(windowSize * 2)
          .select('id', 'itemId', 'highPrice', 'lowPrice', 'syncedAt')

        // Need at least windowSize prices to classify
        if (priceHistory.length < windowSize) continue

        // Reverse to get chronological order
        priceHistory.reverse()

        // Convert to PricePoint format
        const pricePoints: PricePoint[] = priceHistory.map((p, index) => ({
          price: p.highPrice ?? p.lowPrice ?? 0,
          timestamp: p.syncedAt.toJSDate(),
          index,
        }))

        // Run classification
        const segments = await classificationService.classifyItem(itemId, pricePoints)

        // Save segments
        if (segments.length > 0) {
          await classificationService.saveSegments(itemId, segments)
          segmentsCreated += segments.length
        }

        itemsProcessed++
      } catch (error) {
        console.error(`Recalculate failed for item ${itemId}:`, error)
      }
    }

    return response.json({
      itemsProcessed,
      segmentsCreated,
    })
  }

  /**
   * GET /api/regime/export/:itemId
   * Export regime data in CSV or JSON format.
   */
  async export({ params, request, response }: HttpContext) {
    const itemId = parseInt(params.itemId, 10)

    // Verify item exists
    const item = await Item.find(itemId)
    if (!item) {
      return response.notFound({ message: 'Item not found' })
    }

    const format = request.input('format', 'json')
    const startTs = request.input('startTs')
    const endTs = request.input('endTs')

    // Fetch price history
    const priceQuery = ItemPrice.query()
      .where('itemId', itemId)
      .orderBy('syncedAt', 'asc')
      .select('syncedAt', 'highPrice', 'lowPrice')

    if (startTs) {
      priceQuery.where('syncedAt', '>=', new Date(startTs))
    }
    if (endTs) {
      priceQuery.where('syncedAt', '<=', new Date(endTs))
    }

    const prices = await priceQuery

    // Fetch regime segments
    const segmentQuery = RegimeSegment.query()
      .where('itemId', itemId)
      .orderBy('startTs', 'asc')

    if (startTs) {
      segmentQuery.where('startTs', '>=', new Date(startTs))
    }
    if (endTs) {
      segmentQuery.where('endTs', '<=', new Date(endTs))
    }

    const segments = await segmentQuery

    // Build segment lookup by timestamp range
    const getLabel = (ts: Date): string | null => {
      for (const seg of segments) {
        if (ts >= seg.startTs.toJSDate() && ts <= seg.endTs.toJSDate()) {
          return seg.label
        }
      }
      return null
    }

    const getFeatures = (ts: Date) => {
      for (const seg of segments) {
        if (ts >= seg.startTs.toJSDate() && ts <= seg.endTs.toJSDate()) {
          return {
            chop: seg.chop,
            rangeNorm: seg.rangeNorm,
            slopeNorm: seg.slopeNorm,
            crossRate: seg.crossRate,
          }
        }
      }
      return null
    }

    // Build export data
    const exportData = prices.map((p) => {
      const ts = p.syncedAt.toJSDate()
      const features = getFeatures(ts)
      return {
        timestamp: p.syncedAt.toISO(),
        price: p.highPrice ?? p.lowPrice ?? null,
        chop: features?.chop ?? null,
        range_norm: features?.rangeNorm ?? null,
        slope_norm: features?.slopeNorm ?? null,
        cross_rate: features?.crossRate ?? null,
        label: getLabel(ts),
      }
    })

    if (format === 'csv') {
      // Build CSV
      const header = 'timestamp,price,chop,range_norm,slope_norm,cross_rate,label'
      const rows = exportData.map((row) =>
        [
          row.timestamp,
          row.price ?? '',
          row.chop ?? '',
          row.range_norm ?? '',
          row.slope_norm ?? '',
          row.cross_rate ?? '',
          row.label ?? '',
        ].join(',')
      )
      const csv = [header, ...rows].join('\n')

      response.header('Content-Type', 'text/csv')
      response.header('Content-Disposition', `attachment; filename="regime_${itemId}.csv"`)
      return response.send(csv)
    }

    // Default JSON format
    return response.json(exportData)
  }

  /**
   * POST /api/regime/calibrate
   * Run auto-calibration and return suggested thresholds.
   */
  async calibrate({ request, response }: HttpContext) {
    const body = request.body()

    // Get window size from current thresholds
    const thresholds = await RegimeThreshold.getGlobal()
    const windowSize = thresholds.windowSize

    // Determine which items to use for calibration
    let itemIds: number[]
    if (body.itemIds && Array.isArray(body.itemIds) && body.itemIds.length > 0) {
      // Use provided item IDs
      itemIds = body.itemIds.map((id: string | number) => parseInt(String(id), 10)).filter((id: number) => !isNaN(id))
    } else {
      // Select random sample of 50 items with sufficient price history
      const itemsWithPrices = await ItemPrice.query()
        .select('itemId')
        .distinct('itemId')

      // Shuffle and take up to 50
      const shuffled = itemsWithPrices
        .map((p) => p.itemId)
        .sort(() => Math.random() - 0.5)
        .slice(0, 50)

      itemIds = shuffled
    }

    // Collect price arrays for each item
    const allPrices: number[][] = []

    for (const itemId of itemIds) {
      const priceHistory = await ItemPrice.query()
        .where('itemId', itemId)
        .orderBy('syncedAt', 'asc')
        .limit(windowSize * 3)
        .select('highPrice', 'lowPrice')

      // Need at least windowSize prices
      if (priceHistory.length >= windowSize) {
        const prices = priceHistory.map((p) => p.highPrice ?? p.lowPrice ?? 0)
        allPrices.push(prices)
      }
    }

    // Run calibration
    const suggested = autoCalibrateThresholds(allPrices, windowSize)

    return response.json({
      suggested: {
        chop_max: suggested.chopMax,
        range_norm_max: suggested.rangeNormMax,
        slope_norm_max: suggested.slopeNormMax,
        cross_rate_min: suggested.crossRateMin,
      },
      stats: {
        chop: suggested.chopStats,
        range_norm: suggested.rangeNormStats,
        slope_norm: suggested.slopeNormStats,
        cross_rate: suggested.crossRateStats,
      },
      meta: {
        items_sampled: allPrices.length,
        windows_analyzed: suggested.windowCount,
        window_size: windowSize,
      },
    })
  }
}
