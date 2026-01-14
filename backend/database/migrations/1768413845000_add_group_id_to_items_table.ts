import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'items'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('group_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('item_groups')
        .onDelete('SET NULL')
      table.timestamp('classified_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('group_id')
      table.dropColumn('classified_at')
    })
  }
}
