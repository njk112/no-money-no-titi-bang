import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import ItemsSyncService from '#services/items_sync_service'

export default class SyncItems extends BaseCommand {
  static commandName = 'sync:items'
  static description = 'Sync items from OSRS Wiki API'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('Starting items sync...')

    try {
      const syncService = new ItemsSyncService()
      const count = await syncService.syncItems()
      this.logger.success(`Successfully synced ${count} items`)
    } catch (error) {
      this.logger.error('Failed to sync items')
      this.logger.error(error instanceof Error ? error.message : String(error))
      this.exitCode = 1
    }
  }
}