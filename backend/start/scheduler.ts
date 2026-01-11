import cron from 'node-cron'
import env from '#start/env'
import logger from '@adonisjs/core/services/logger'
import ItemsSyncService from '#services/items_sync_service'
import PricesSyncService from '#services/prices_sync_service'

const syncCron = env.get('SYNC_CRON', '0 0 * * *')

async function runSync() {
  const startTime = Date.now()
  logger.info('Scheduled sync starting...')

  try {
    logger.info('Syncing items...')
    const itemsSyncService = new ItemsSyncService()
    const itemsCount = await itemsSyncService.syncItems()
    logger.info(`Synced ${itemsCount} items`)

    logger.info('Syncing prices...')
    const pricesSyncService = new PricesSyncService()
    const pricesCount = await pricesSyncService.syncPrices()
    logger.info(`Synced ${pricesCount} prices`)

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2)
    logger.info(`Scheduled sync completed in ${totalTime}s`)
  } catch (error) {
    logger.error('Scheduled sync failed')
    logger.error(error instanceof Error ? error.message : String(error))
  }
}

if (cron.validate(syncCron)) {
  cron.schedule(syncCron, runSync)
  logger.info(`Scheduler initialized with cron: ${syncCron}`)
} else {
  logger.warn(`Invalid SYNC_CRON value: ${syncCron}. Scheduler not started.`)
}
