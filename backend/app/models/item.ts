import { DateTime } from 'luxon'
import { BaseModel, column, computed, hasMany, belongsTo } from '@adonisjs/lucid/orm'
import type { HasMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import ItemPrice from './item_price.js'
import RegimeSegment from './regime_segment.js'
import ItemGroup from './item_group.js'

export default class Item extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare iconFilename: string | null

  @column()
  declare buyLimit: number | null

  @column()
  declare members: boolean

  @column()
  declare highAlch: number | null

  @column()
  declare lowAlch: number | null

  @column()
  declare latestPriceId: number | null

  @column()
  declare currentRegime: string | null

  @column()
  declare groupId: number | null

  @column.dateTime()
  declare classifiedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => ItemPrice)
  declare prices: HasMany<typeof ItemPrice>

  @hasMany(() => RegimeSegment)
  declare regimeSegments: HasMany<typeof RegimeSegment>

  @belongsTo(() => ItemGroup)
  declare group: BelongsTo<typeof ItemGroup>

  @computed()
  get iconUrl(): string | null {
    if (!this.iconFilename) {
      return null
    }
    // Wiki URLs use underscores instead of spaces
    const encodedFilename = this.iconFilename.replace(/ /g, '_')
    return `https://oldschool.runescape.wiki/images/${encodedFilename}`
  }

  @computed()
  get geTrackerUrl(): string {
    return `https://www.ge-tracker.com/item/${this.id}`
  }
}
