import { DateTime } from 'luxon'
import Item from '#models/item'
import ItemPrice from '#models/item_price'
import OsrsWikiClient from './osrs_wiki_client.js'

export default class PricesSyncService {
  private wikiClient: OsrsWikiClient

  constructor() {
    this.wikiClient = new OsrsWikiClient()
  }

  async syncPrices(): Promise<number> {
    const { data: prices } = await this.wikiClient.fetchLatestPrices()
    const syncedAt = DateTime.now()

    const existingItemIds = await Item.query().select('id')
    const itemIdSet = new Set(existingItemIds.map((item) => item.id))

    let count = 0
    for (const [itemIdStr, priceData] of Object.entries(prices)) {
      const itemId = parseInt(itemIdStr, 10)

      if (!itemIdSet.has(itemId)) {
        continue
      }

      await ItemPrice.create({
        itemId,
        highPrice: priceData.high ?? null,
        lowPrice: priceData.low ?? null,
        highTime: priceData.highTime ? DateTime.fromSeconds(priceData.highTime) : null,
        lowTime: priceData.lowTime ? DateTime.fromSeconds(priceData.lowTime) : null,
        syncedAt,
      })
      count++
    }

    return count
  }
}
