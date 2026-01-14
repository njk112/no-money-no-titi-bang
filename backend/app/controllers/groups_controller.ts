import type { HttpContext } from '@adonisjs/core/http'
import ItemGroup from '#models/item_group'
import db from '@adonisjs/lucid/services/db'

export default class GroupsController {
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
}
