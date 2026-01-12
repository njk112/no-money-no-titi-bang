import type { HttpContext } from '@adonisjs/core/http'
import ItemPrice from '#models/item_price'

export default class SyncController {
  async status({ response }: HttpContext) {
    const latestPrice = await ItemPrice.query()
      .select('synced_at')
      .orderBy('synced_at', 'desc')
      .first()

    return response.json({
      last_synced_at: latestPrice?.syncedAt?.toISO() ?? null,
    })
  }
}
