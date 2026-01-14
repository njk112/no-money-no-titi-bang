import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'regime_segments'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // -1 = down, 0 = flat, 1 = up
      table.integer('slope_direction').defaultTo(0)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('slope_direction')
    })
  }
}
