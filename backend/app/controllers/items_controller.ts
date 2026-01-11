import type { HttpContext } from '@adonisjs/core/http'
import Item from '#models/item'

export default class ItemsController {
  async index({ request, response }: HttpContext) {
    const page = Math.max(1, parseInt(request.input('page', '1'), 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(request.input('limit', '50'), 10) || 50))

    const query = Item.query()
      .select('items.*')
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

    const total = await Item.query().count('* as count').first()
    const totalCount = Number(total?.$extras.count || 0)
    const totalPages = Math.ceil(totalCount / limit)

    const items = await query.offset((page - 1) * limit).limit(limit)

    const data = items.map((item) => ({
      id: item.id,
      name: item.name,
      icon_url: item.iconUrl,
      buy_limit: item.buyLimit,
      members: item.members,
      high_alch: item.highAlch,
      low_alch: item.lowAlch,
      high_price: item.$extras.high_price ?? null,
      low_price: item.$extras.low_price ?? null,
      high_time: item.$extras.high_time ?? null,
      low_time: item.$extras.low_time ?? null,
    }))

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
}
