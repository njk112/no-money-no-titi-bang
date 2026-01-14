import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSeeder {
  async run() {
    // Check if a row already exists to avoid duplicates
    const existing = await db.from('regime_thresholds').first()
    if (existing) {
      return
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
    await db.table('regime_thresholds').insert({
      chop_max: 0.25,
      range_norm_max: 0.02,
      slope_norm_max: 0.0005,
      cross_rate_min: 0.08,
      window_size: 24,
      created_at: now,
      updated_at: now,
    })
  }
}