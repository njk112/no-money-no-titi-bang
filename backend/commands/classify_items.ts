import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import Item from '#models/item'
import ItemGroup from '#models/item_group'
import { DateTime } from 'luxon'

export default class ClassifyItems extends BaseCommand {
  static commandName = 'items:classify'
  static description = 'Classify items into groups based on keyword matching'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('Starting item classification...')

    // Fetch all groups ordered by sort_order
    const groups = await ItemGroup.query().orderBy('sort_order', 'asc')
    this.logger.info(`Loaded ${groups.length} groups`)

    // Find the Unknown group (should be last by sort_order)
    const unknownGroup = groups.find((g) => g.slug === 'unknown')
    if (!unknownGroup) {
      this.logger.error('Unknown group not found. Please run the seeder first.')
      return
    }

    // Fetch all items that need classification
    const items = await Item.query().orderBy('id', 'asc')
    this.logger.info(`Found ${items.length} items to classify`)

    // Track statistics per group
    const stats: Record<string, number> = {}
    groups.forEach((g) => {
      stats[g.name] = 0
    })

    let processedCount = 0

    for (const item of items) {
      // Try to match item name against each group's keywords
      let matchedGroup: typeof unknownGroup | null = null
      const itemNameLower = item.name.toLowerCase()

      // Process groups in sort_order (first match wins)
      for (const group of groups) {
        // Skip Unknown group in matching - it's the fallback
        if (group.slug === 'unknown') continue

        // Check if any keyword matches (case-insensitive partial match)
        const hasMatch = group.keywords.some((keyword) =>
          itemNameLower.includes(keyword.toLowerCase())
        )

        if (hasMatch) {
          matchedGroup = group
          break
        }
      }

      // If no match, assign to Unknown group
      if (!matchedGroup) {
        matchedGroup = unknownGroup
      }

      // Update item's group and classification timestamp
      item.groupId = matchedGroup.id
      item.classifiedAt = DateTime.now()
      await item.save()

      stats[matchedGroup.name]++
      processedCount++

      // Log progress every 100 items
      if (processedCount % 100 === 0) {
        this.logger.info(`Processed ${processedCount}/${items.length} items`)
      }
    }

    // Log final statistics
    this.logger.info('Classification complete!')
    this.logger.info('Statistics:')
    for (const group of groups) {
      const count = stats[group.name]
      if (count > 0) {
        this.logger.info(`  ${group.name}: ${count} items`)
      }
    }
    this.logger.info(`Total processed: ${processedCount} items`)
  }
}