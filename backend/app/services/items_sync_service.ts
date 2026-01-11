import db from '@adonisjs/lucid/services/db'
import Item from '#models/item'
import OsrsWikiClient from './osrs_wiki_client.js'

export default class ItemsSyncService {
  private wikiClient: OsrsWikiClient

  constructor() {
    this.wikiClient = new OsrsWikiClient()
  }

  async syncItems(): Promise<number> {
    const mapping = await this.wikiClient.fetchMapping()

    await db.transaction(async (trx) => {
      for (const item of mapping) {
        await Item.updateOrCreate(
          { id: item.id },
          {
            id: item.id,
            name: item.name,
            iconFilename: item.icon || null,
            buyLimit: item.limit || null,
            members: item.members,
            highAlch: item.highalch || null,
            lowAlch: item.lowalch || null,
          },
          { client: trx }
        )
      }
    })

    return mapping.length
  }
}
