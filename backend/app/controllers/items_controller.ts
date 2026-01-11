import type { HttpContext } from '@adonisjs/core/http'
import Item from '#models/item'

export default class ItemsController {
  async index({ request, response }: HttpContext) {
    const page = Math.max(1, parseInt(request.input('page', '1'), 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(request.input('limit', '50'), 10) || 50))
    const search = request.input('search', '')
    const minPrice = request.input('min_price')
    const maxPrice = request.input('max_price')
    const minMargin = request.input('min_margin')
    const maxMargin = request.input('max_margin')
    const minBuyLimit = request.input('min_buy_limit')
    const members = request.input('members')
    const sort = request.input('sort', 'profit')
    const order = request.input('order', 'desc')

    const query = Item.query()
      .select(
        'items.id',
        'items.name',
        'items.icon_filename',
        'items.buy_limit',
        'items.members',
        'items.high_alch',
        'items.low_alch',
        'items.created_at',
        'items.updated_at'
      )
      .select('item_prices.high_price')
      .select('item_prices.low_price')
      .select('item_prices.high_time')
      .select('item_prices.low_time')
      .select('item_prices.synced_at')
      .leftJoin('item_prices', (join) => {
        join.on('items.id', '=', 'item_prices.item_id')
      })
      .whereRaw(
        'item_prices.synced_at IS NULL OR item_prices.synced_at = (SELECT MAX(ip2.synced_at) FROM item_prices ip2 WHERE ip2.item_id = items.id)'
      )

    // Search filter (US-013)
    if (search) {
      query.whereILike('items.name', `%${search}%`)
    }

    // Price range filters (US-014)
    if (minPrice) {
      query.where('item_prices.low_price', '>=', parseInt(minPrice, 10))
    }
    if (maxPrice) {
      query.where('item_prices.low_price', '<=', parseInt(maxPrice, 10))
    }

    // Margin filters (US-014)
    if (minMargin) {
      query.whereRaw(
        '(item_prices.high_price - item_prices.low_price) >= ?',
        [parseInt(minMargin, 10)]
      )
    }
    if (maxMargin) {
      query.whereRaw(
        '(item_prices.high_price - item_prices.low_price) <= ?',
        [parseInt(maxMargin, 10)]
      )
    }

    // Buy limit filter (US-014)
    if (minBuyLimit) {
      query.where('items.buy_limit', '>=', parseInt(minBuyLimit, 10))
    }

    // Members filter (US-014)
    if (members === 'true') {
      query.where('items.members', true)
    } else if (members === 'false') {
      query.where('items.members', false)
    }

    // Clone query for count (before pagination)
    const countQuery = query.clone()
    const totalResult = await countQuery.count('* as count').first()
    const totalCount = Number(totalResult?.$extras.count || 0)
    const totalPages = Math.ceil(totalCount / limit)

    // Sorting (US-015)
    const orderDirection = order === 'asc' ? 'ASC' : 'DESC'
    const nullsPosition = order === 'asc' ? 'NULLS FIRST' : 'NULLS LAST'

    switch (sort) {
      case 'margin':
        query.orderByRaw(`(item_prices.high_price - item_prices.low_price) ${orderDirection} ${nullsPosition}`)
        break
      case 'price':
        query.orderByRaw(`item_prices.low_price ${orderDirection} ${nullsPosition}`)
        break
      case 'name':
        query.orderBy('items.name', order === 'asc' ? 'asc' : 'desc')
        break
      case 'buy_limit':
        query.orderByRaw(`items.buy_limit ${orderDirection} ${nullsPosition}`)
        break
      case 'profit':
      default:
        query.orderByRaw(
          `CASE WHEN item_prices.high_price IS NOT NULL AND item_prices.low_price IS NOT NULL AND items.buy_limit IS NOT NULL THEN (item_prices.high_price - item_prices.low_price) * items.buy_limit END ${orderDirection} ${nullsPosition}`
        )
        break
    }

    const items = await query.offset((page - 1) * limit).limit(limit)

    const data = items.map((item) => {
      const highPrice = item.$extras.high_price
      const lowPrice = item.$extras.low_price
      const buyLimit = item.buyLimit

      const profitMargin =
        highPrice != null && lowPrice != null ? highPrice - lowPrice : null
      const maxProfit =
        profitMargin != null && buyLimit != null ? profitMargin * buyLimit : null

      return {
        id: item.id,
        name: item.name,
        icon_url: item.iconUrl,
        buy_limit: buyLimit,
        members: item.members,
        high_alch: item.highAlch,
        low_alch: item.lowAlch,
        high_price: highPrice ?? null,
        low_price: lowPrice ?? null,
        high_time: item.$extras.high_time ?? null,
        low_time: item.$extras.low_time ?? null,
        profit_margin: profitMargin,
        max_profit: maxProfit,
      }
    })

    return response.json({
      data,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages,
      },
    })
  }

  async show({ params, response }: HttpContext) {
    // Fetch item without join to avoid id collision
    const item = await Item.find(params.id)

    if (!item) {
      return response.notFound({ message: 'Item not found' })
    }

    // Fetch latest price separately
    const latestPrice = await item
      .related('prices')
      .query()
      .orderBy('synced_at', 'desc')
      .first()

    const highPrice = latestPrice?.highPrice ?? null
    const lowPrice = latestPrice?.lowPrice ?? null
    const buyLimit = item.buyLimit

    const profitMargin =
      highPrice != null && lowPrice != null ? highPrice - lowPrice : null
    const maxProfit =
      profitMargin != null && buyLimit != null ? profitMargin * buyLimit : null

    return response.json({
      id: item.id,
      name: item.name,
      icon_url: item.iconUrl,
      buy_limit: buyLimit,
      members: item.members,
      high_alch: item.highAlch,
      low_alch: item.lowAlch,
      high_price: highPrice,
      low_price: lowPrice,
      high_time: latestPrice?.highTime?.toISO() ?? null,
      low_time: latestPrice?.lowTime?.toISO() ?? null,
      profit_margin: profitMargin,
      max_profit: maxProfit,
      ge_tracker_url: item.geTrackerUrl,
    })
  }
}
