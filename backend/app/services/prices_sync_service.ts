import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Item from '#models/item'
import ItemPrice from '#models/item_price'
import RegimeThreshold from '#models/regime_threshold'
import OsrsWikiClient from './osrs_wiki_client.js'
import { RegimeClassificationService } from './regime/regime_classification_service.js'
import type { PricePoint } from './regime/classifier.js'

export default class PricesSyncService {
  private wikiClient: OsrsWikiClient
  private classificationService: RegimeClassificationService

  constructor() {
    this.wikiClient = new OsrsWikiClient()
    this.classificationService = new RegimeClassificationService()
  }

  async syncPrices(): Promise<number> {
    const [{ data: prices }, { data: volumes }] = await Promise.all([
      this.wikiClient.fetchLatestPrices(),
      this.wikiClient.fetchVolumes(),
    ])
    const syncedAt = DateTime.now()

    const existingItemIds = await Item.query().select('id')
    const itemIdSet = new Set(existingItemIds.map((item) => item.id))

    const priceRecords: Array<{
      itemId: number
      highPrice: number | null
      lowPrice: number | null
      highTime: DateTime | null
      lowTime: DateTime | null
      volume: number | null
      syncedAt: DateTime
    }> = []

    for (const [itemIdStr, priceData] of Object.entries(prices)) {
      const itemId = parseInt(itemIdStr, 10)
      if (!itemIdSet.has(itemId)) continue

      priceRecords.push({
        itemId,
        highPrice: priceData.high ?? null,
        lowPrice: priceData.low ?? null,
        highTime: priceData.highTime ? DateTime.fromSeconds(priceData.highTime) : null,
        lowTime: priceData.lowTime ? DateTime.fromSeconds(priceData.lowTime) : null,
        volume: volumes[itemIdStr] ?? null,
        syncedAt,
      })
    }

    await db.transaction(async (trx) => {
      const createdPrices = await ItemPrice.createMany(priceRecords, { client: trx })

      // Update items with latest_price_id for fast lookups
      for (const price of createdPrices) {
        await trx.rawQuery(
          'UPDATE items SET latest_price_id = ? WHERE id = ?',
          [price.id, price.itemId]
        )
      }
    })

    // Run regime classification for items that received new price data
    await this.runRegimeClassification(priceRecords.map((p) => p.itemId))

    return priceRecords.length
  }

  /**
   * Run regime classification for the specified items.
   * Errors are caught and logged to prevent breaking the price sync.
   */
  private async runRegimeClassification(itemIds: number[]): Promise<void> {
    if (itemIds.length === 0) return

    try {
      // Get window size from global thresholds
      const thresholds = await RegimeThreshold.getGlobal()
      const windowSize = thresholds.windowSize

      let itemsProcessed = 0
      let totalSegmentsCreated = 0

      // Process each item that received new price data
      for (const itemId of itemIds) {
        try {
          // Fetch recent price history for this item
          const priceHistory = await ItemPrice.query()
            .where('itemId', itemId)
            .orderBy('syncedAt', 'desc')
            .limit(windowSize * 2) // Fetch more than needed to ensure sufficient history
            .select('id', 'itemId', 'highPrice', 'lowPrice', 'syncedAt')

          // Need at least windowSize prices to classify
          if (priceHistory.length < windowSize) continue

          // Reverse to get chronological order (oldest first)
          priceHistory.reverse()

          // Convert to PricePoint format using average of high/low prices
          const pricePoints: PricePoint[] = priceHistory.map((p, index) => ({
            price: p.highPrice ?? p.lowPrice ?? 0,
            timestamp: p.syncedAt.toJSDate(),
            index,
          }))

          // Run classification
          const segments = await this.classificationService.classifyItem(itemId, pricePoints)

          // Save segments if any were created
          if (segments.length > 0) {
            await this.classificationService.saveSegments(itemId, segments)
            totalSegmentsCreated += segments.length
          }

          itemsProcessed++
        } catch (itemError) {
          // Log per-item errors but continue processing other items
          console.error(`Regime classification failed for item ${itemId}:`, itemError)
        }
      }

      console.log(`Regime classification: processed ${itemsProcessed} items, created ${totalSegmentsCreated} segments`)
    } catch (error) {
      // Log error but don't throw - classification errors shouldn't break price sync
      console.error('Regime classification failed:', error)
    }
  }
}
