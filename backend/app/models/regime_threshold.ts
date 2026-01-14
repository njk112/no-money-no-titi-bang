import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

/**
 * Partial threshold updates for updateGlobal method.
 */
export interface ThresholdUpdates {
  chopMax?: number
  rangeNormMax?: number
  slopeNormMax?: number
  crossRateMin?: number
  windowSize?: number
}

export default class RegimeThreshold extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare chopMax: number

  @column()
  declare rangeNormMax: number

  @column()
  declare slopeNormMax: number

  @column()
  declare crossRateMin: number

  @column()
  declare windowSize: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  /**
   * Fetch the global threshold configuration (single row).
   */
  static async getGlobal(): Promise<RegimeThreshold> {
    const threshold = await RegimeThreshold.query().first()
    if (!threshold) {
      throw new Error('No regime threshold configuration found. Run the seeder first.')
    }
    return threshold
  }

  /**
   * Update the global threshold configuration.
   */
  static async updateGlobal(updates: ThresholdUpdates): Promise<RegimeThreshold> {
    const threshold = await RegimeThreshold.getGlobal()

    if (updates.chopMax !== undefined) threshold.chopMax = updates.chopMax
    if (updates.rangeNormMax !== undefined) threshold.rangeNormMax = updates.rangeNormMax
    if (updates.slopeNormMax !== undefined) threshold.slopeNormMax = updates.slopeNormMax
    if (updates.crossRateMin !== undefined) threshold.crossRateMin = updates.crossRateMin
    if (updates.windowSize !== undefined) threshold.windowSize = updates.windowSize

    await threshold.save()
    return threshold
  }
}
