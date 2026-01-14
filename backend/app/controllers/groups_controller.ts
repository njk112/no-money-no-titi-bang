import type { HttpContext } from '@adonisjs/core/http'
import ItemGroup from '#models/item_group'
import db from '@adonisjs/lucid/services/db'

export default class GroupsController {
  /**
   * Generate a slug from a name (kebab-case)
   */
  private slugify(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  async index({ response }: HttpContext) {
    // Get all groups with item counts
    const groups = await ItemGroup.query()
      .select('item_groups.*')
      .select(
        db.raw('(SELECT COUNT(*) FROM items WHERE items.group_id = item_groups.id) as item_count')
      )
      .orderBy('sort_order', 'asc')

    const data = groups.map((group) => ({
      id: group.id,
      name: group.name,
      slug: group.slug,
      description: group.description,
      keywords: group.keywords,
      color: group.color,
      sort_order: group.sortOrder,
      is_default: group.isDefault,
      item_count: Number(group.$extras.item_count || 0),
    }))

    return response.json(data)
  }

  async create({ request, response }: HttpContext) {
    const { name, description, keywords, color } = request.body()

    // Validate name is not empty
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return response.status(400).json({ error: 'Name is required' })
    }

    // Generate slug from name
    const slug = this.slugify(name)
    if (!slug) {
      return response.status(400).json({ error: 'Could not generate valid slug from name' })
    }

    // Check if slug already exists
    const existingGroup = await ItemGroup.findBy('slug', slug)
    if (existingGroup) {
      return response.status(400).json({ error: 'A group with this name already exists' })
    }

    // Get max sort_order and add 1
    const maxSortOrder = await ItemGroup.query().max('sort_order as max_sort_order').first()
    const nextSortOrder = (maxSortOrder?.$extras.max_sort_order || 0) + 1

    // Create the group
    const group = await ItemGroup.create({
      name: name.trim(),
      slug,
      description: description || null,
      keywords: keywords || [],
      color: color || '#6B7280',
      sortOrder: nextSortOrder,
      isDefault: false,
    })

    return response.status(201).json({
      id: group.id,
      name: group.name,
      slug: group.slug,
      description: group.description,
      keywords: group.keywords,
      color: group.color,
      sort_order: group.sortOrder,
      is_default: group.isDefault,
      item_count: 0,
    })
  }

  async update({ params, request, response }: HttpContext) {
    const group = await ItemGroup.find(params.id)
    if (!group) {
      return response.status(404).json({ error: 'Group not found' })
    }

    const { name, description, keywords, color } = request.body()

    // Validate name if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return response.status(400).json({ error: 'Name cannot be empty' })
      }
      group.name = name.trim()
    }

    // Update other fields (slug is NOT updated - immutable after creation)
    if (description !== undefined) {
      group.description = description || null
    }
    if (keywords !== undefined) {
      group.keywords = keywords || []
    }
    if (color !== undefined) {
      group.color = color || '#6B7280'
    }

    await group.save()

    // Get item count for response
    const itemCount = await db
      .from('items')
      .where('group_id', group.id)
      .count('* as count')
      .first()

    return response.json({
      id: group.id,
      name: group.name,
      slug: group.slug,
      description: group.description,
      keywords: group.keywords,
      color: group.color,
      sort_order: group.sortOrder,
      is_default: group.isDefault,
      item_count: Number(itemCount?.count || 0),
    })
  }

  async destroy({ params, response }: HttpContext) {
    const group = await ItemGroup.find(params.id)
    if (!group) {
      return response.status(404).json({ error: 'Group not found' })
    }

    // Cannot delete the 'Unknown' group
    if (group.slug === 'unknown') {
      return response.status(400).json({ error: 'Cannot delete the Unknown group' })
    }

    // Cannot delete groups with assigned items
    const itemCount = await db
      .from('items')
      .where('group_id', group.id)
      .count('* as count')
      .first()

    const count = Number(itemCount?.count || 0)
    if (count > 0) {
      return response.status(400).json({
        error: `Cannot delete group with ${count} assigned item${count === 1 ? '' : 's'}. Reassign items first.`,
      })
    }

    await group.delete()

    return response.json({ message: 'Group deleted successfully' })
  }

  async stats({ response }: HttpContext) {
    // Get profitability stats per group
    // Join items with item_prices (via latest_price_id) and aggregate by group
    const stats = await db
      .from('item_groups')
      .leftJoin('items', 'item_groups.id', 'items.group_id')
      .leftJoin('item_prices', 'items.latest_price_id', 'item_prices.id')
      .select('item_groups.id as group_id')
      .select('item_groups.name as group_name')
      .select('item_groups.slug as group_slug')
      .select('item_groups.color as group_color')
      .count('items.id as item_count')
      .sum('item_prices.volume as total_volume')
      .select(
        db.raw(
          'AVG(CASE WHEN item_prices.high_price IS NOT NULL AND item_prices.low_price IS NOT NULL ' +
            'THEN item_prices.high_price - item_prices.low_price END) as avg_margin'
        )
      )
      .select(
        db.raw(
          'SUM(CASE WHEN item_prices.high_price IS NOT NULL AND item_prices.low_price IS NOT NULL AND items.buy_limit IS NOT NULL ' +
            'THEN (item_prices.high_price - item_prices.low_price) * ' +
            'CASE WHEN items.buy_limit < COALESCE(item_prices.volume, 0) THEN items.buy_limit ELSE COALESCE(item_prices.volume, 0) END ' +
            'END) as total_max_profit'
        )
      )
      .groupBy('item_groups.id')
      .orderByRaw('total_max_profit DESC NULLS LAST')

    const data = stats.map((row: Record<string, unknown>) => ({
      group_id: row.group_id,
      group_name: row.group_name,
      group_slug: row.group_slug,
      group_color: row.group_color,
      item_count: Number(row.item_count || 0),
      total_volume: Number(row.total_volume || 0),
      avg_margin: row.avg_margin != null ? Math.round(Number(row.avg_margin)) : 0,
      total_max_profit: Number(row.total_max_profit || 0),
    }))

    return response.json(data)
  }
}
