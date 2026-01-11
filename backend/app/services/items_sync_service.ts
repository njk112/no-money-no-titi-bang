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

    const records = mapping.map((item) => ({
      id: item.id,
      name: item.name,
      icon_filename: item.icon || null,
      buy_limit: item.limit || null,
      members: item.members,
      high_alch: item.highalch || null,
      low_alch: item.lowalch || null,
    }))

    // Batch upsert using onConflict
    await db.table('items')
      .insert(records)
      .onConflict('id')
      .merge(['name', 'icon_filename', 'buy_limit', 'members', 'high_alch', 'low_alch'])

    return mapping.length
  }
}
