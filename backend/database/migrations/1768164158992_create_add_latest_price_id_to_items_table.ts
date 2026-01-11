import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'items'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('latest_price_id').nullable().references('id').inTable('item_prices').onDelete('SET NULL')
      table.index(['latest_price_id'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('latest_price_id')
    })
  }
}
