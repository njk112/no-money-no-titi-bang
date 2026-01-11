import type { HttpContext } from '@adonisjs/core/http'
import Item from '#models/item'

export default class SuggestionsController {
  async index({ request, response }: HttpContext) {
    const budgetParam = request.input('budget')

    if (!budgetParam || isNaN(parseInt(budgetParam, 10))) {
      return response.badRequest({ message: 'Budget parameter is required and must be a valid integer' })
    }

    const budget = parseInt(budgetParam, 10)

    const items = await Item.query()
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
      .where('item_prices.low_price', '<=', budget)
      .where('item_prices.low_price', '>', 0)
      .whereRaw('(item_prices.high_price - item_prices.low_price) > 0')
      .where('items.buy_limit', '>', 0)

    // Calculate scores and sort
    const scoredItems = items
      .map((item) => {
        const highPrice = item.$extras.high_price
        const lowPrice = item.$extras.low_price
        const buyLimit = item.buyLimit!

        const profitMargin = highPrice - lowPrice
        const score = profitMargin * buyLimit * Math.log10(buyLimit + 1)

        const suggestedQuantity = Math.min(Math.floor(budget / lowPrice), buyLimit)
        const estimatedProfit = suggestedQuantity * profitMargin

        return {
          id: item.id,
          name: item.name,
          icon_url: item.iconUrl,
          buy_limit: buyLimit,
          members: item.members,
          high_alch: item.highAlch,
          low_alch: item.lowAlch,
          high_price: highPrice,
          low_price: lowPrice,
          high_time: item.$extras.high_time ?? null,
          low_time: item.$extras.low_time ?? null,
          profit_margin: profitMargin,
          max_profit: profitMargin * buyLimit,
          ge_tracker_url: item.geTrackerUrl,
          suggested_quantity: suggestedQuantity,
          estimated_profit: estimatedProfit,
          score,
        }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)

    // Remove score from response
    const data = scoredItems.map(({ score: _score, ...rest }) => rest)

    return response.json({ data })
  }
}
