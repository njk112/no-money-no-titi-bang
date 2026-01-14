import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'regime_thresholds'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.float('chop_max').notNullable()
      table.float('range_norm_max').notNullable()
      table.float('slope_norm_max').notNullable()
      table.float('cross_rate_min').notNullable()
      table.integer('window_size').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
