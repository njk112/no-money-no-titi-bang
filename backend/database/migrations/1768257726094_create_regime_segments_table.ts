import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'regime_segments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('item_id')
        .notNullable()
        .references('id')
        .inTable('items')
        .onDelete('CASCADE')
      table.integer('start_idx').notNullable()
      table.integer('end_idx').notNullable()
      table.timestamp('start_ts').notNullable()
      table.timestamp('end_ts').notNullable()
      table.string('label').notNullable() // RANGE_BOUND | TRENDING
      table.float('chop').notNullable()
      table.float('range_norm').notNullable()
      table.float('slope_norm').notNullable()
      table.float('cross_rate').notNullable()
      table.float('band_midpoint').nullable()
      table.float('band_width_pct').nullable()
      table.float('confidence_score').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['item_id'])
      table.index(['item_id', 'end_ts'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
