import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'item_groups'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('name').notNullable()
      table.string('slug').unique().notNullable()
      table.string('description').nullable()
      table.text('keywords').notNullable() // JSON stored as text
      table.string('color').notNullable()
      table.integer('sort_order').notNullable()
      table.boolean('is_default').defaultTo(true)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
