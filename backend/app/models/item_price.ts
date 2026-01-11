import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Item from './item.js'

export default class ItemPrice extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare itemId: number

  @column()
  declare highPrice: number | null

  @column()
  declare lowPrice: number | null

  @column.dateTime()
  declare highTime: DateTime | null

  @column.dateTime()
  declare lowTime: DateTime | null

  @column.dateTime()
  declare syncedAt: DateTime

  @belongsTo(() => Item)
  declare item: BelongsTo<typeof Item>
}
