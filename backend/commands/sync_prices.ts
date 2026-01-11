import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import PricesSyncService from '#services/prices_sync_service'

export default class SyncPrices extends BaseCommand {
  static commandName = 'sync:prices'
  static description = 'Sync prices from OSRS Wiki API'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('Starting prices sync...')

    try {
      const syncService = new PricesSyncService()
      const count = await syncService.syncPrices()
      this.logger.success(`Successfully synced ${count} prices`)
    } catch (error) {
      this.logger.error('Failed to sync prices')
      this.logger.error(error instanceof Error ? error.message : String(error))
      this.exitCode = 1
    }
  }
}