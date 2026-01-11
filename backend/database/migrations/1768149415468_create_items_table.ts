import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('id').primary().notNullable()
      table.string('name').notNullable()
      table.string('icon_filename').nullable()
      table.integer('buy_limit').nullable()
      table.boolean('members').defaultTo(false)
      table.integer('high_alch').nullable()
      table.integer('low_alch').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}