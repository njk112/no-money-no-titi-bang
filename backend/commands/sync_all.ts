import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import ItemsSyncService from '#services/items_sync_service'
import PricesSyncService from '#services/prices_sync_service'

export default class SyncAll extends BaseCommand {
  static commandName = 'sync:all'
  static description = 'Sync items and prices from OSRS Wiki API'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const startTime = Date.now()

    this.logger.info('Starting full sync...')

    try {
      this.logger.info('Syncing items...')
      const itemsSyncService = new ItemsSyncService()
      const itemsCount = await itemsSyncService.syncItems()
      this.logger.success(`Synced ${itemsCount} items`)

      this.logger.info('Syncing prices...')
      const pricesSyncService = new PricesSyncService()
      const pricesCount = await pricesSyncService.syncPrices()
      this.logger.success(`Synced ${pricesCount} prices`)

      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2)
      this.logger.success(`Full sync completed in ${totalTime}s`)
    } catch (error) {
      this.logger.error('Failed to complete sync')
      this.logger.error(error instanceof Error ? error.message : String(error))
      this.exitCode = 1
    }
  }
}