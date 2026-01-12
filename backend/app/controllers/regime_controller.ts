import type { HttpContext } from '@adonisjs/core/http'
import Item from '#models/item'
import RegimeSegment from '#models/regime_segment'
import RegimeThreshold from '#models/regime_threshold'

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
}
