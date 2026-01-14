# PRD: Item Group Classification System

## Introduction

Add a group classification system to items so users can filter and track profitability by item type. Items will be assigned to exactly one group (e.g., Armor, Weapons, Potions), enabling filtered views on the dashboard and profitability analysis per category. The system will leverage OSRS Wiki data for automatic classification during initial population.

## Research Summary: OSRS Item Categories

Before implementation, research was conducted on OSRS Wiki and community APIs to determine optimal default groups.

### Sources Consulted
- [OSRS Wiki Category:Items](https://oldschool.runescape.wiki/w/Category:Items) - 99 subcategories, 12,045 items
- [OSRS Wiki Category:Equipment_Slots](https://oldschool.runescape.wiki/w/Category:Equipment_Slots) - 13 equipment slot types
- [OSRS Wiki Real-time Prices API](https://oldschool.runescape.wiki/w/RuneScape:Real-time_Prices)
- [OSRSBox Database](https://www.osrsbox.com/projects/osrsbox-db/) - Comprehensive item metadata

### OSRS Wiki Equipment Slots (13 categories)
- Ammunition (126 items), Body (499), Cape (267), Feet (205), Hands (189)
- Head (777), Jaw (8), Legs (482), Neck (153), Ring (80)
- Shield (297), Two-handed (420), Weapon (622)

### OSRS Wiki Item Categories (key trading categories)
- Armour, Weapons (Magic/Melee/Ranged), Edible items (261), Potions
- Runes, Ores, Metal bars, Logs, Seeds, Jewellery, Tools

### Recommended Default Groups (expanded from original)

Based on research, the following **12 default groups** are recommended for GE trading analysis:

| Group | Description | Detection Keywords |
|-------|-------------|-------------------|
| Armor | Body, legs, head, feet, hands, cape, shield slot items | helm, platebody, chainbody, platelegs, boots, gloves, shield, coif, d'hide |
| Weapons | Melee, ranged, magic weapons (1h and 2h) | sword, scimitar, dagger, mace, bow, crossbow, staff, wand |
| Ammunition | Arrows, bolts, darts, thrown weapons | arrow, bolt, dart, javelin, knife, thrownaxe |
| Potions | All drinkable potions | potion, (1), (2), (3), (4), brew, mix |
| Food | Edible items for healing | shark, lobster, monkfish, karambwan, pie, cake |
| Herbs | Grimy and clean herbs | grimy, herb, guam, marrentill, tarromin, harralander |
| Runes | Magic runes | rune (with specific patterns: fire rune, death rune, etc.) |
| Skilling Materials | Ores, bars, logs, leather, gems | ore, bar, log, leather, gem, uncut |
| Jewellery | Rings, amulets, necklaces, bracelets | ring of, amulet of, necklace of, bracelet of |
| Seeds | Farming seeds | seed (excluding special items) |
| Resources | Fish, bones, hides, secondary ingredients | raw, bones, hide, scale, essence |
| Unknown | Unclassified items | (default fallback) |

## Goals

- Track profitability by item group to identify which categories yield best returns
- Enable filtering dashboard by item group for focused trading strategies
- Automatically classify existing items using OSRS Wiki data and name-based inference
- Provide batch assignment workflow for efficiently handling "Unknown" items
- Support extensible group definitions via settings

## User Stories

### US-001: Research and finalize default groups
**Description:** As a developer, I need to verify the proposed default groups against OSRS Wiki API data before implementation.

**Acceptance Criteria:**
- [ ] Query OSRS Wiki API to fetch item metadata for sample items
- [ ] Validate that proposed keyword patterns correctly classify sample items
- [ ] Document any additional groups needed based on API data
- [ ] Finalize the list of default groups (minimum 10, maximum 15)
- [ ] Create mapping of OSRS Wiki categories to our groups where available

---

### US-002: Create item_groups database table
**Description:** As a developer, I need a database table to store group definitions so they can be managed and extended.

**Acceptance Criteria:**
- [ ] Create migration for `item_groups` table with fields: id, name, slug, description, keywords (JSON), color, sort_order, is_default, created_at, updated_at
- [ ] Create ItemGroup Lucid model with appropriate relationships
- [ ] Add `group_id` foreign key column to `items` table (nullable, defaults to "Unknown" group)
- [ ] Add `classified_at` timestamp column to `items` table (nullable, tracks when item was last classified)
- [ ] Seed default groups from finalized list
- [ ] Migration runs successfully
- [ ] Typecheck passes

---

### US-003: Add group_id to Item model and API
**Description:** As a developer, I need items to reference their group so the relationship is queryable.

**Acceptance Criteria:**
- [ ] Update Item model with `belongsTo(ItemGroup)` relationship
- [ ] Update ItemGroup model with `hasMany(Item)` relationship
- [ ] Update `GET /api/items` to include group data in response
- [ ] Update `GET /api/items/:id` to include group data
- [ ] Add `group` filter parameter to items list endpoint
- [ ] Typecheck passes

---

### US-004: Create initial item classification script
**Description:** As a developer, I need a script to manually classify existing items into groups based on OSRS Wiki data and name patterns.

**Acceptance Criteria:**
- [ ] Create AdonisJS command `node ace items:classify`
- [ ] Add `"classify": "node ace items:classify"` script to backend `package.json`
- [ ] First, attempt to fetch category data from OSRS Wiki API for each item
- [ ] If Wiki category available, map to corresponding group
- [ ] If no Wiki data, use keyword matching against item name
- [ ] All keywords are treated equally - first group with any matching keyword wins (process groups in sort_order)
- [ ] Items that don't match any pattern get assigned to "Unknown"
- [ ] Set `classified_at` timestamp on all processed items
- [ ] Log classification statistics (count per group, unknowns)
- [ ] Script is idempotent (can re-run safely, updates classified_at on each run)
- [ ] This is a manual operation only - no cron/scheduled runs
- [ ] Typecheck passes

---

### US-005: Add group filter to dashboard filter panel
**Description:** As a user, I want to filter items by group (include or exclude) so I can focus on specific item categories.

**Acceptance Criteria:**
- [ ] Add group multi-select to FilterPanel component with two modes: Include and Exclude
- [ ] Include mode: show only items in selected groups (`?group=weapons,armor`)
- [ ] Exclude mode: show all items EXCEPT those in selected groups (`?exclude_group=unknown,herbs`)
- [ ] Toggle switch or tabs to switch between Include/Exclude mode
- [ ] Fetch available groups from new `GET /api/groups` endpoint
- [ ] Filter persists in URL params (both `group` and `exclude_group` supported)
- [ ] "All Groups" is default state (no filter applied)
- [ ] Filter works in combination with existing filters (price, regime, etc.)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-006: Display group badge on items table
**Description:** As a user, I want to see each item's group at a glance so I can quickly identify item types.

**Acceptance Criteria:**
- [ ] Add "Group" column to ItemsTable (after Name column)
- [ ] Display group name with colored badge (using group's color field)
- [ ] Column is sortable
- [ ] Badge is compact and doesn't disrupt table layout
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-007: Show group in item detail modal
**Description:** As a user, I want to see and potentially change an item's group in the detail view.

**Acceptance Criteria:**
- [ ] Display current group in item detail modal header area
- [ ] Add dropdown to change group (saves immediately via API)
- [ ] Create `PATCH /api/items/:id/group` endpoint
- [ ] Show confirmation toast on successful change
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-008: Create groups management settings page
**Description:** As a user, I want a dedicated settings page to manage item groups so I can add custom groups or modify existing ones.

**Acceptance Criteria:**
- [ ] Create new route `/settings/groups`
- [ ] Display list of all groups with: name, description, item count, color, keywords
- [ ] Add "Add Group" button that opens modal
- [ ] Add "Edit" action for each group row
- [ ] Add "Delete" action for non-default groups (with confirmation)
- [ ] Prevent deletion of groups that have items (show count, offer reassignment)
- [ ] Create corresponding API endpoints: `GET /api/groups`, `POST /api/groups`, `PUT /api/groups/:id`, `DELETE /api/groups/:id`
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-009: Create group add/edit modal
**Description:** As a user, I want a modal to add or edit group details.

**Acceptance Criteria:**
- [ ] Modal with form fields: name, description, color picker, keywords (comma-separated)
- [ ] Slug auto-generated from name (kebab-case)
- [ ] Color picker with preset palette + custom option
- [ ] Keywords field with helper text explaining usage
- [ ] Validation: name required, name unique, slug unique
- [ ] Save button calls appropriate API (POST for new, PUT for edit)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-010: Create "Review Unknowns" page
**Description:** As a user, I want a dedicated interface to review and batch-assign items marked as "Unknown" so I can efficiently categorize unclassified items.

**Acceptance Criteria:**
- [ ] Create new route `/review-unknowns`
- [ ] Display table of items where group = "Unknown"
- [ ] Show item icon, name, current price, suggested group (based on name keywords)
- [ ] "Suggested group" column uses same keyword logic as classification script
- [ ] Checkbox selection for multiple items
- [ ] "Assign to Group" dropdown that appears when items selected
- [ ] Bulk action applies group to all selected items via `PATCH /api/items/batch-group`
- [ ] Create batch endpoint that accepts array of item IDs and group ID
- [ ] Show success toast with count of updated items
- [ ] Table auto-refreshes after batch assignment
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-011: Add group statistics to dashboard
**Description:** As a user, I want to see profitability statistics broken down by group so I can identify which categories are most profitable.

**Acceptance Criteria:**
- [ ] Add collapsible "Group Statistics" section to dashboard (above or below filters)
- [ ] Show for each group: item count, total volume, average margin, total max profit
- [ ] Create `GET /api/groups/stats` endpoint that aggregates item data by group
- [ ] Clicking a group stat row filters dashboard to that group
- [ ] Stats refresh with main dashboard poll (60s)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: Create `item_groups` table with fields: id (PK), name, slug (unique), description, keywords (JSON array), color (hex), sort_order, is_default (boolean), timestamps
- FR-2: Add `group_id` foreign key to `items` table referencing `item_groups.id`
- FR-2a: Add `classified_at` timestamp to `items` table (nullable, set when classification runs)
- FR-3: Seed 12 default groups on migration: Armor, Weapons, Ammunition, Potions, Food, Herbs, Runes, Skilling Materials, Jewellery, Seeds, Resources, Unknown
- FR-4: The "Unknown" group must always exist and cannot be deleted
- FR-5: `GET /api/items` must support `group` query parameter for include filtering (single or comma-separated)
- FR-5a: `GET /api/items` must support `exclude_group` query parameter for exclude filtering (single or comma-separated)
- FR-6: `GET /api/groups` must return all groups with item counts
- FR-7: `GET /api/groups/stats` must return aggregated profitability metrics per group
- FR-8: `PATCH /api/items/:id/group` must update single item's group
- FR-9: `PATCH /api/items/batch-group` must accept `{itemIds: number[], groupId: number}` and update all specified items
- FR-10: Classification script must be runnable via `node ace items:classify`
- FR-10a: Add `classify` script to backend `package.json` (e.g., `"classify": "node ace items:classify"`) for easy manual execution
- FR-10b: Classification is a manual operation only - no automatic/scheduled runs
- FR-11: Classification must prioritize: Wiki API data > keyword matching > Unknown fallback
- FR-11a: Keyword matching treats all keywords equally - first group (by sort_order) with any matching keyword wins
- FR-12: Group keywords must support case-insensitive partial matching against item names
- FR-13: Dashboard filter panel must include group filter that works with existing filters
- FR-14: Items table must display group as colored badge
- FR-15: Groups settings page must allow CRUD operations on groups
- FR-16: Review Unknowns page must show suggested group based on keyword analysis

## Non-Goals

- No group hierarchy or sub-groups (flat structure only)
- No group-based notifications or alerts
- No historical tracking of group changes (only current assignment matters)
- No group-based price predictions or analysis beyond basic stats

## Technical Considerations

- Use existing modal component pattern from `item-detail-modal.tsx` and `regime-settings-modal.tsx`
- Keywords stored as JSON array in SQLite (use Lucid's JSON column type)
- Group colors should use Tailwind color palette for consistency
- Classification script should batch API requests to OSRS Wiki (respect rate limits)
- Consider caching Wiki API responses during classification to avoid redundant calls
- Frontend state for group filter should sync with URL params like existing filters

## Design Considerations

- Group badge colors should be distinct but not clash with regime badges
- Settings page should follow existing pattern (if one exists) or match dashboard styling
- Review Unknowns page should prioritize quick bulk actions over individual edits
- Consider keyboard shortcuts for power users doing bulk classification

## Success Metrics

- 90%+ of items automatically classified on first run (< 10% Unknown)
- Users can filter to a specific group in 2 clicks
- Bulk assignment of 50+ items completes in under 5 seconds
- Group statistics accurately reflect item data within dashboard refresh cycle

## Decisions Made

1. **Group filter supports exclude mode** - Multi-select with Include/Exclude toggle allows filtering to show all except selected groups (e.g., hide Unknown and Herbs). Both `group` and `exclude_group` URL params supported.

2. **Classification timestamp added** - `classified_at` timestamp column added to items table to track when each item was last classified. Updated on every classification run.

3. **Keywords are all equal** - No priority ordering for keywords. First group (by sort_order) with any matching keyword wins. Simpler to manage than weighted/priority systems.

4. **AI suggestions as future enhancement** - The Review Unknowns page will NOT include AI-based suggestions from examine text in initial scope. This is noted as a potential future enhancement but not implemented now. Current keyword matching on item name is sufficient for MVP.

## Future Enhancements (Out of Scope)

- AI-suggested classifications based on item examine text fetched from Wiki API
- Automatic re-classification when item names change
- Group hierarchy or sub-groups
- Import/export of group configurations
