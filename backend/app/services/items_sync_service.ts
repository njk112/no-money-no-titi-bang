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
    const now = new Date().toISOString()

    const records = mapping.map((item) => ({
      id: item.id,
      name: item.name,
      icon_filename: item.icon || null,
      buy_limit: item.limit || null,
      members: item.members ? 1 : 0,
      high_alch: item.highalch || null,
      low_alch: item.lowalch || null,
    }))

    // Batch upsert in chunks using raw SQL for SQLite
    const chunkSize = 500
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize)
      const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ')
      const values = chunk.flatMap((r) => [
        r.id, r.name, r.icon_filename, r.buy_limit, r.members, r.high_alch, r.low_alch, now, now
      ])

      await db.rawQuery(`
        INSERT INTO items (id, name, icon_filename, buy_limit, members, high_alch, low_alch, created_at, updated_at)
        VALUES ${placeholders}
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          icon_filename = excluded.icon_filename,
          buy_limit = excluded.buy_limit,
          members = excluded.members,
          high_alch = excluded.high_alch,
          low_alch = excluded.low_alch,
          updated_at = excluded.updated_at
      `, values)
    }

    return mapping.length
  }
}
