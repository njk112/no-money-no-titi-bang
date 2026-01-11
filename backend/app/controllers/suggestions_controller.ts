import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class SuggestionsController {
  async index({ request, response }: HttpContext) {
    const budgetParam = request.input('budget')

    if (!budgetParam || isNaN(parseInt(budgetParam, 10))) {
      return response.badRequest({ message: 'Budget parameter is required and must be a valid integer' })
    }

    const budget = parseInt(budgetParam, 10)

    // Calculate score in SQL: (high - low) * buy_limit * log10(buy_limit + 1)
    // Sort and limit in database for efficiency
    const items = await db.rawQuery(`
      SELECT
        items.id,
        items.name,
        items.icon_filename,
        items.buy_limit,
        items.members,
        items.high_alch,
        items.low_alch,
        ip.high_price,
        ip.low_price,
        ip.high_time,
        ip.low_time,
        (ip.high_price - ip.low_price) as profit_margin,
        (ip.high_price - ip.low_price) * items.buy_limit as max_profit,
        MIN(? / ip.low_price, items.buy_limit) as suggested_quantity,
        MIN(? / ip.low_price, items.buy_limit) * (ip.high_price - ip.low_price) as estimated_profit
      FROM items
      INNER JOIN item_prices ip ON items.id = ip.item_id
      INNER JOIN (
        SELECT item_id, MAX(synced_at) as max_synced_at
        FROM item_prices
        GROUP BY item_id
      ) latest ON ip.item_id = latest.item_id AND ip.synced_at = latest.max_synced_at
      WHERE ip.low_price <= ?
        AND ip.low_price > 0
        AND (ip.high_price - ip.low_price) > 0
        AND items.buy_limit > 0
      ORDER BY (ip.high_price - ip.low_price) * items.buy_limit DESC
      LIMIT 6
    `, [budget, budget, budget])

    const data = items.map((item: Record<string, unknown>) => ({
      id: item.id,
      name: item.name,
      icon_url: item.icon_filename
        ? `https://oldschool.runescape.wiki/images/${String(item.icon_filename).replace(/ /g, '_')}`
        : null,
      buy_limit: item.buy_limit,
      members: Boolean(item.members),
      high_alch: item.high_alch,
      low_alch: item.low_alch,
      high_price: item.high_price,
      low_price: item.low_price,
      high_time: item.high_time,
      low_time: item.low_time,
      profit_margin: item.profit_margin,
      max_profit: item.max_profit,
      ge_tracker_url: `https://www.ge-tracker.com/item/${item.id}`,
      suggested_quantity: Math.floor(item.suggested_quantity as number),
      estimated_profit: Math.floor(item.estimated_profit as number),
    }))

    return response.json({ data })
  }
}
