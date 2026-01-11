import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'item_prices'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('item_id')
        .notNullable()
        .references('id')
        .inTable('items')
        .onDelete('CASCADE')
      table.integer('high_price').nullable()
      table.integer('low_price').nullable()
      table.timestamp('high_time').nullable()
      table.timestamp('low_time').nullable()
      table.timestamp('synced_at').notNullable()

      table.index(['item_id'])
      table.index(['synced_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}