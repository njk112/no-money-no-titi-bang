import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Item from './item.js'

export default class RegimeSegment extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare itemId: number

  @column()
  declare startIdx: number

  @column()
  declare endIdx: number

  @column.dateTime()
  declare startTs: DateTime

  @column.dateTime()
  declare endTs: DateTime

  @column()
  declare label: string

  @column()
  declare chop: number

  @column()
  declare rangeNorm: number

  @column()
  declare slopeNorm: number

  @column()
  declare crossRate: number

  @column()
  declare bandMidpoint: number | null

  @column()
  declare bandWidthPct: number | null

  @column()
  declare confidenceScore: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Item)
  declare item: BelongsTo<typeof Item>
}
