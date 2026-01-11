# PRD: OSRS GE Trading Dashboard

## Introduction

Build a trading analysis dashboard for Old School RuneScape's Grand Exchange (GE) that fetches price data from the OSRS Wiki Real-time Prices API, identifies profitable flip opportunities, and presents them to users. The system fetches all tradeable items, calculates profit margins (buying low vs selling high), and helps users find the best trades based on their available capital and item liquidity.

## Goals

- Fetch and store price data for ALL tradeable items from OSRS Wiki API
- Calculate and display profit margins using the flip strategy (Buy at "Buying Low", Sell at "Selling High")
- Provide a searchable, filterable dashboard of items sorted by profitability
- Enable users to find optimal trades based on their budget (PnL + volume consideration)
- Sync pricing data every 24 hours automatically
- Track users via anonymous sessions (no login required)

## Data Sources

### Primary: OSRS Wiki Real-time Prices API
- **Base URL:** `https://prices.runescape.wiki/api/v1/osrs`
- **Mapping endpoint:** `/mapping` - Returns all items with id, name, buy limit, icon filename, members status (single request)
- **Prices endpoint:** `/latest` - Returns latest high/low prices for ALL items (single request)
- **Time-series:** `/timeseries?id={id}&timestep=24h` - Historical data per item
- **Documentation:** https://oldschool.runescape.wiki/w/RuneScape:Real-time_Prices

### Secondary: GE-Tracker (for external links only)
- Item pages: `https://www.ge-tracker.com/item/{item-name-slug}`
- Used for "View on GE-Tracker" links in item modals

### Icons
- OSRS Wiki provides icon filenames in `/mapping` response
- Full URL format: `https://oldschool.runescape.wiki/images/{icon_filename}`

## User Stories

---

### Phase 1: Database & Models

#### US-001: Items table migration
**Description:** As a developer, I need an items table to store basic item information.

**Acceptance Criteria:**
- [ ] Create migration for `items` table
- [ ] Columns: id (integer, primary key - OSRS item ID), name (string), icon_filename (string nullable), buy_limit (integer nullable), members (boolean default false), high_alch (integer nullable), low_alch (integer nullable), created_at, updated_at
- [ ] Migration runs successfully with `node ace migration:run`
- [ ] Typecheck passes

#### US-002: Item prices table migration
**Description:** As a developer, I need a prices table to store price snapshots.

**Acceptance Criteria:**
- [ ] Create migration for `item_prices` table
- [ ] Columns: id (auto increment), item_id (foreign key to items), high_price (integer nullable), low_price (integer nullable), high_time (datetime nullable), low_time (datetime nullable), synced_at (datetime)
- [ ] Foreign key constraint on item_id with cascade delete
- [ ] Index on item_id and synced_at
- [ ] Migration runs successfully
- [ ] Typecheck passes

#### US-003: Item model
**Description:** As a developer, I need an Item model to interact with the items table.

**Acceptance Criteria:**
- [ ] Create Item model in `app/models/item.ts`
- [ ] Define columns matching migration
- [ ] HasMany relationship to ItemPrice
- [ ] Computed property `iconUrl` that returns full wiki image URL
- [ ] Computed property `geTrackerUrl` that returns GE-Tracker item page URL
- [ ] Typecheck passes

#### US-004: ItemPrice model
**Description:** As a developer, I need an ItemPrice model to interact with the prices table.

**Acceptance Criteria:**
- [ ] Create ItemPrice model in `app/models/item_price.ts`
- [ ] Define columns matching migration
- [ ] BelongsTo relationship to Item
- [ ] Typecheck passes

---

### Phase 2: Data Sync Services

#### US-005: OSRS Wiki API client
**Description:** As a developer, I need a client to fetch data from the OSRS Wiki API.

**Acceptance Criteria:**
- [ ] Create service in `app/services/osrs_wiki_client.ts`
- [ ] Set User-Agent header: `"osrs-ge-tracker - OSRS trading dashboard"` (Wiki requires descriptive User-Agent)
- [ ] Method `fetchMapping()` that calls `https://prices.runescape.wiki/api/v1/osrs/mapping`
- [ ] Returns typed array: `{ id: number, name: string, examine: string, members: boolean, lowalch: number, highalch: number, limit: number, value: number, icon: string }[]`
- [ ] Method `fetchLatestPrices()` that calls `https://prices.runescape.wiki/api/v1/osrs/latest`
- [ ] Returns typed object: `{ data: { [itemId: string]: { high: number, highTime: number, low: number, lowTime: number } } }`
- [ ] Throws Error with descriptive message on non-200 response
- [ ] Typecheck passes

#### US-006: Items sync service
**Description:** As a developer, I need a service to sync item metadata from the Wiki API.

**Acceptance Criteria:**
- [ ] Create service in `app/services/items_sync_service.ts`
- [ ] Method `syncItems()` that fetches mapping and upserts all items
- [ ] Uses database transaction for atomicity
- [ ] Returns count of items synced
- [ ] Typecheck passes

#### US-007: Prices sync service
**Description:** As a developer, I need a service to sync price data from the Wiki API.

**Acceptance Criteria:**
- [ ] Create service in `app/services/prices_sync_service.ts`
- [ ] Method `syncPrices()` that fetches latest prices and creates ItemPrice records
- [ ] Only creates records for items that exist in our database
- [ ] Sets synced_at to current timestamp
- [ ] Returns count of prices synced
- [ ] Typecheck passes

#### US-008: Items sync CLI command
**Description:** As a developer, I need a CLI command to sync items.

**Acceptance Criteria:**
- [ ] Create Ace command `node ace sync:items`
- [ ] Calls ItemsSyncService.syncItems()
- [ ] Logs start, completion, and item count
- [ ] Exits with error code on failure
- [ ] Typecheck passes

#### US-009: Prices sync CLI command
**Description:** As a developer, I need a CLI command to sync prices.

**Acceptance Criteria:**
- [ ] Create Ace command `node ace sync:prices`
- [ ] Calls PricesSyncService.syncPrices()
- [ ] Logs start, completion, and price count
- [ ] Exits with error code on failure
- [ ] Typecheck passes

#### US-010: Full sync CLI command
**Description:** As a developer, I need a CLI command to run both syncs.

**Acceptance Criteria:**
- [ ] Create Ace command `node ace sync:all`
- [ ] Runs items sync first, then prices sync
- [ ] Logs total time taken
- [ ] Typecheck passes

---

### Phase 3: Backend API - Items

#### US-011: Items list endpoint - basic
**Description:** As a frontend, I need to fetch a paginated list of items with latest prices.

**Acceptance Criteria:**
- [ ] Create ItemsController in `app/controllers/items_controller.ts`
- [ ] GET `/api/items` endpoint
- [ ] Query params: `page` (default 1), `limit` (default 50, max 100)
- [ ] Returns items joined with their latest price record (subquery for most recent synced_at per item)
- [ ] Response shape:
```json
{
  "data": [{ "id": 4151, "name": "Abyssal whip", "icon_url": "...", "members": true, "buy_limit": 70, "high_alch": 72000, "low_alch": 48000, "high_price": 1500000, "low_price": 1450000, "high_time": "2024-01-01T12:00:00Z", "low_time": "2024-01-01T11:30:00Z" }],
  "meta": { "total": 3700, "page": 1, "limit": 50, "totalPages": 74 }
}
```
- [ ] Typecheck passes

#### US-012: Items list endpoint - calculated fields
**Description:** As a frontend, I need profit calculations included in the items response.

**Acceptance Criteria:**
- [ ] Add calculated fields to items response: profit_margin (high_price - low_price), max_profit (profit_margin * buy_limit)
- [ ] Handle null buy_limit (max_profit = null)
- [ ] Handle null prices (profit_margin = null)
- [ ] Default sort by max_profit descending (nulls last)
- [ ] Typecheck passes

#### US-013: Items list endpoint - search
**Description:** As a frontend, I need to search items by name.

**Acceptance Criteria:**
- [ ] Add `search` query param to GET `/api/items`
- [ ] Case-insensitive partial match on item name
- [ ] Empty search returns all items
- [ ] Typecheck passes

#### US-014: Items list endpoint - filters
**Description:** As a frontend, I need to filter items by price, margin, buy limit, and members status.

**Acceptance Criteria:**
- [ ] Add query params: `min_price`, `max_price` (filter on low_price)
- [ ] Add query params: `min_margin`, `max_margin` (filter on calculated profit_margin)
- [ ] Add query param: `min_buy_limit` (filter on buy_limit)
- [ ] Add query param: `members` (boolean) - if true, only members items; if false, only F2P items; if omitted, all items
- [ ] All filters combine with AND logic
- [ ] Typecheck passes

#### US-015: Items list endpoint - sorting
**Description:** As a frontend, I need to sort items by different criteria.

**Acceptance Criteria:**
- [ ] Add `sort` query param with options: profit, margin, price, name, buy_limit
- [ ] Add `order` query param: asc, desc (default desc)
- [ ] profit = max_profit, margin = profit_margin, price = low_price
- [ ] Typecheck passes

#### US-016: Single item endpoint
**Description:** As a frontend, I need to fetch detailed data for one item.

**Acceptance Criteria:**
- [ ] GET `/api/items/:id` endpoint
- [ ] Returns item with latest price data
- [ ] Includes all fields: name, icon_url, buy_limit, members, high_alch, low_alch
- [ ] Includes price fields: high_price, low_price, high_time, low_time
- [ ] Includes calculated: profit_margin, max_profit, ge_tracker_url
- [ ] Returns 404 with message if item not found
- [ ] Typecheck passes

#### US-017: Suggestions endpoint
**Description:** As a frontend, I need item recommendations based on a budget.

**Acceptance Criteria:**
- [ ] GET `/api/suggestions` endpoint
- [ ] Required query param: `budget` (integer, GP amount). Returns 400 if missing or invalid.
- [ ] Filter: only items where `low_price <= budget` AND `low_price > 0` AND `profit_margin > 0` AND `buy_limit > 0`
- [ ] Scoring formula: `score = (profit_margin * buy_limit) * log10(buy_limit + 1)` (higher buy_limit = more tradeable = better)
- [ ] Returns top 6 items sorted by score descending
- [ ] For each item, calculate:
  - `suggested_quantity`: `Math.min(Math.floor(budget / low_price), buy_limit)`
  - `estimated_profit`: `suggested_quantity * profit_margin`
- [ ] Response includes all item fields plus `suggested_quantity` and `estimated_profit`
- [ ] Typecheck passes

---

### Phase 4: Frontend - Setup & Layout

#### US-018: API client setup
**Description:** As a frontend developer, I need a configured API client for backend calls.

**Acceptance Criteria:**
- [ ] Create `lib/api.ts` with fetch wrapper
- [ ] Base URL configurable via environment variable (default: http://localhost:3333)
- [ ] Includes credentials for session cookies
- [ ] Typed response handling with generics
- [ ] Typecheck passes

#### US-019: App layout component
**Description:** As a user, I want a consistent app layout with header.

**Acceptance Criteria:**
- [ ] Create `components/layout/app-layout.tsx`
- [ ] Header with app title "OSRS GE Tracker"
- [ ] Navigation links: Dashboard, Suggestions
- [ ] Main content area with padding
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-020: Mobile navigation menu
**Description:** As a user, I want navigation accessible on mobile.

**Acceptance Criteria:**
- [ ] Add hamburger menu button visible on mobile only
- [ ] Clicking hamburger opens sheet/drawer with nav links
- [ ] Links close the drawer when clicked
- [ ] Uses shadcn Sheet component
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-021: Apply layout to pages
**Description:** As a frontend developer, I need pages to use the layout.

**Acceptance Criteria:**
- [ ] Wrap root layout with AppLayout
- [ ] All pages render inside the layout
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Phase 5: Frontend - Dashboard Core

#### US-022: Dashboard page structure
**Description:** As a user, I want the dashboard page to show items.

**Acceptance Criteria:**
- [ ] Update page at `/`
- [ ] Page title "Dashboard" as h1
- [ ] Sections for: search (top), filters (sidebar/top), table (main)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-023: Items data fetching hook
**Description:** As a frontend developer, I need to fetch items from the API.

**Acceptance Criteria:**
- [ ] Create `hooks/use-items.ts`
- [ ] Hook signature: `useItems(params: ItemsParams): ItemsResult`
- [ ] Params type:
```typescript
type ItemsParams = {
  page?: number
  search?: string
  min_price?: number
  max_price?: number
  min_margin?: number
  max_margin?: number
  min_buy_limit?: number
  members?: boolean  // true = members only, false = F2P only, undefined = all
  sort?: 'profit' | 'margin' | 'price' | 'name' | 'buy_limit'
  order?: 'asc' | 'desc'
}
```
- [ ] Result type: `{ items: Item[], total: number, totalPages: number, isLoading: boolean, error: Error | null, refetch: () => void }`
- [ ] Builds query string from non-undefined params
- [ ] Refetches when any param changes (use params as useEffect dependency or SWR key)
- [ ] Typecheck passes

#### US-024: Items table structure
**Description:** As a user, I want to see items in a table format.

**Acceptance Criteria:**
- [ ] Create `components/items-table.tsx` using shadcn Table
- [ ] Columns: Icon, Name, Buy Price (low_price), Sell Price (high_price), Margin, Buy Limit, Max Profit
- [ ] Accepts items array as prop
- [ ] Shows "No items found" when array is empty
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-025: Items table row formatting
**Description:** As a user, I want table data formatted clearly.

**Acceptance Criteria:**
- [ ] Icon column shows 32x32 image from icon_url (or placeholder div if null)
- [ ] Name column shows item name with yellow star icon (lucide Star, filled) next to members-only items
- [ ] Prices formatted with commas (e.g., "1,234,567")
- [ ] Margin shows color: green if > 100, yellow if 1-100, gray if <= 0 or null
- [ ] Buy Limit shows number or "-" if null
- [ ] Max Profit shows formatted number or "-" if null
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-026: Items table row click handler
**Description:** As a user, I want to click a row to see item details.

**Acceptance Criteria:**
- [ ] Rows have hover state (background color change)
- [ ] Clicking row calls onItemClick(itemId) callback prop
- [ ] Cursor shows pointer on hover
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-027: Table loading skeleton
**Description:** As a user, I want to see a loading state while items load.

**Acceptance Criteria:**
- [ ] Create `components/table-skeleton.tsx`
- [ ] Shows 10 skeleton rows matching table column structure
- [ ] Uses shadcn Skeleton component
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-028: Table error state
**Description:** As a user, I want to see an error message if loading fails.

**Acceptance Criteria:**
- [ ] Create `components/error-state.tsx`
- [ ] Shows alert icon and error message text
- [ ] "Try Again" button that calls onRetry callback
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Phase 6: Frontend - Search & Filters

#### US-029: Search input component
**Description:** As a user, I want to search for items by name.

**Acceptance Criteria:**
- [ ] Create `components/search-input.tsx`
- [ ] Uses shadcn Input with search icon (lucide Search)
- [ ] Placeholder "Search items..."
- [ ] X button to clear when value is not empty
- [ ] Calls onChange(value) callback
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-030: Search integration with debounce
**Description:** As a user, I want search to update results as I type.

**Acceptance Criteria:**
- [ ] Add SearchInput to dashboard above table
- [ ] Create useDebounce hook or use lodash.debounce (300ms)
- [ ] Debounced value updates URL search param `?search=`
- [ ] URL change triggers useItems refetch
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-031: Filter panel component
**Description:** As a user, I want a panel to set filter criteria.

**Acceptance Criteria:**
- [ ] Create `components/filter-panel.tsx`
- [ ] Props: `children` (filter inputs will be passed as children)
- [ ] Renders shadcn Card with CardHeader "Filters" and CardContent for children
- [ ] Desktop (md+): always visible, renders normally
- [ ] Mobile (<md): collapsed by default, "Filters" button toggles visibility using local state
- [ ] Uses shadcn Collapsible for mobile toggle behavior
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-032: Price range filter
**Description:** As a user, I want to filter by price range.

**Acceptance Criteria:**
- [ ] Add to FilterPanel: two number inputs side by side
- [ ] Labels: "Min Price", "Max Price"
- [ ] Values update URL params `min_price`, `max_price` (debounced 300ms)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-033: Margin range filter
**Description:** As a user, I want to filter by profit margin range.

**Acceptance Criteria:**
- [ ] Add to FilterPanel: two number inputs side by side
- [ ] Labels: "Min Margin", "Max Margin"
- [ ] Values update URL params `min_margin`, `max_margin` (debounced 300ms)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-034: Buy limit filter
**Description:** As a user, I want to filter by minimum buy limit.

**Acceptance Criteria:**
- [ ] Add to FilterPanel: single number input
- [ ] Label: "Min Buy Limit"
- [ ] Value updates URL param `min_buy_limit` (debounced 300ms)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-034b: Members filter
**Description:** As a user, I want to filter by members/F2P status.

**Acceptance Criteria:**
- [ ] Add to FilterPanel: select/dropdown with options "All", "Members Only", "F2P Only"
- [ ] Label: "Item Type"
- [ ] Default: "All" (no filter applied)
- [ ] Value updates URL param `members` (true/false/omitted)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-035: Clear filters button
**Description:** As a user, I want to reset all filters quickly.

**Acceptance Criteria:**
- [ ] Add "Clear Filters" button at bottom of FilterPanel
- [ ] Only visible when at least one filter param is set
- [ ] Clicking clears all filter URL params
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Phase 7: Frontend - Pagination

#### US-036: Pagination component
**Description:** As a user, I want to navigate between pages of items.

**Acceptance Criteria:**
- [ ] Create `components/pagination.tsx` using shadcn Pagination
- [ ] Props: currentPage, totalPages, onPageChange
- [ ] Shows: Previous, page numbers (with ellipsis if many), Next
- [ ] Previous disabled on page 1, Next disabled on last page
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-037: Pagination integration
**Description:** As a user, I want pagination to work with the items table.

**Acceptance Criteria:**
- [ ] Add Pagination below items table
- [ ] Shows total items count
- [ ] Clicking page updates URL param `page`
- [ ] Page resets to 1 when search/filters change
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Phase 8: Frontend - Item Detail Modal

#### US-038: Modal shell component
**Description:** As a frontend developer, I need a reusable modal using shadcn Dialog.

**Acceptance Criteria:**
- [ ] Create `components/modal.tsx` wrapping shadcn Dialog
- [ ] Props: isOpen, onClose, title (optional), children
- [ ] Renders DialogContent with optional DialogHeader/DialogTitle
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-039: Item detail data fetching
**Description:** As a frontend developer, I need to fetch single item data.

**Acceptance Criteria:**
- [ ] Create `hooks/use-item.ts`
- [ ] Accepts itemId (number | null)
- [ ] Returns: item, isLoading, error
- [ ] Only fetches when itemId is not null
- [ ] Typecheck passes

#### US-040: Item detail modal layout
**Description:** As a user, I want to see item details in a modal.

**Acceptance Criteria:**
- [ ] Create `components/item-detail-modal.tsx`
- [ ] Props: itemId (number | null), isOpen, onClose
- [ ] Uses useItem hook to fetch data
- [ ] Header: item icon (64x64), item name as title, yellow star icon next to name if members-only
- [ ] Shows skeleton while loading
- [ ] Shows error state if fetch fails
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-041: Item detail modal - price section
**Description:** As a user, I want to see price information in the modal.

**Acceptance Criteria:**
- [ ] Add "Prices" section to modal content
- [ ] 2-column grid showing: Buy Price (low_price), Sell Price (high_price)
- [ ] Show last update times (high_time, low_time) formatted as relative time
- [ ] Values formatted with commas
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-042: Item detail modal - profit section
**Description:** As a user, I want to see profit calculations in the modal.

**Acceptance Criteria:**
- [ ] Add "Profit Potential" section below prices
- [ ] Shows: Buy Limit, Profit Margin, Max Profit
- [ ] Max Profit in larger green text
- [ ] Shows "-" for null values
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-042b: Item detail modal - alchemy section
**Description:** As a user, I want to see alchemy values in the modal.

**Acceptance Criteria:**
- [ ] Add "Alchemy Values" section below profit section
- [ ] Shows: High Alch value, Low Alch value
- [ ] Values formatted with commas and "gp" suffix
- [ ] Shows "-" for null values
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-043: Item detail modal - external link
**Description:** As a user, I want to view the item on GE-Tracker.

**Acceptance Criteria:**
- [ ] Add "View on GE-Tracker" button in modal footer
- [ ] Uses item's ge_tracker_url field
- [ ] Opens in new tab (target="_blank", rel="noopener")
- [ ] Button has external link icon (lucide ExternalLink)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-044: Item modal integration in dashboard
**Description:** As a user, I want clicking table rows to open the modal.

**Acceptance Criteria:**
- [ ] Dashboard page manages selectedItemId state (number | null)
- [ ] Pass onItemClick to ItemsTable that sets selectedItemId
- [ ] Render ItemDetailModal with selectedItemId
- [ ] onClose sets selectedItemId to null
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Phase 9: Frontend - Suggestions Page

#### US-045: Suggestions page structure
**Description:** As a user, I want a page to get item recommendations.

**Acceptance Criteria:**
- [ ] Create page at `/suggestions`
- [ ] Page title "Suggestions" as h1
- [ ] Uses app layout
- [ ] Two sections: budget input (top), results (below)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-046: Budget input component
**Description:** As a user, I want to enter my budget.

**Acceptance Criteria:**
- [ ] Create `components/budget-input.tsx`
- [ ] Large number input with label "Enter your budget (GP)"
- [ ] Formats display with commas as user types
- [ ] "Get Suggestions" button next to input
- [ ] Button disabled when value is empty or 0
- [ ] Calls onSubmit(budget) when button clicked
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-047: Suggestions data fetching
**Description:** As a frontend developer, I need to fetch suggestions.

**Acceptance Criteria:**
- [ ] Create `hooks/use-suggestions.ts`
- [ ] Method `fetchSuggestions(budget)` that fetches `/api/suggestions?budget={budget}`
- [ ] Returns: suggestions, isLoading, error, fetch function
- [ ] Does not fetch on mount (manual trigger only)
- [ ] Typecheck passes

#### US-048: Suggestion cards grid
**Description:** As a user, I want suggestions displayed as cards.

**Acceptance Criteria:**
- [ ] Create `components/suggestions-grid.tsx`
- [ ] Grid: 3 columns desktop, 2 tablet, 1 mobile
- [ ] Shows 6 skeleton cards when loading
- [ ] Shows "Enter a budget to see suggestions" when no data and not loading
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-049: Suggestion card component
**Description:** As a user, I want each suggestion to show key info.

**Acceptance Criteria:**
- [ ] Create `components/suggestion-card.tsx` using shadcn Card
- [ ] Props: `suggestion: SuggestionItem`, `onItemClick: (id: number) => void`
- [ ] Layout: icon (48x48) on left, text on right
- [ ] Shows: item name (with yellow star if members), suggested quantity (e.g., "Buy: 70"), estimated profit in green (e.g., "+3,500,000 gp")
- [ ] Card has `cursor-pointer` and hover:shadow-md
- [ ] onClick calls `onItemClick(suggestion.id)`
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-050: Suggestions page integration
**Description:** As a user, I want the suggestions page fully functional.

**Acceptance Criteria:**
- [ ] Wire up BudgetInput to trigger useSuggestions.fetch
- [ ] Pass suggestions to SuggestionsGrid
- [ ] Clicking card opens ItemDetailModal (reuse from dashboard)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Phase 10: Scheduled Sync

#### US-051: Scheduled sync configuration
**Description:** As a system, I need automatic price syncing every 24 hours.

**Acceptance Criteria:**
- [ ] Install node-cron or use AdonisJS scheduler
- [ ] Create scheduler that runs `sync:all` every 24 hours
- [ ] Schedule configurable via .env (SYNC_CRON="0 0 * * *")
- [ ] Logs when sync starts and completes
- [ ] Typecheck passes

---

## Functional Requirements

- FR-1: System must fetch all items from OSRS Wiki `/mapping` endpoint
- FR-2: System must fetch all prices from OSRS Wiki `/latest` endpoint
- FR-3: System must store items with: id, name, icon_filename, buy_limit, members, high_alch, low_alch
- FR-4: System must store prices with: high_price, low_price, high_time, low_time, synced_at
- FR-5: Price data must sync automatically every 24 hours
- FR-6: Profit margin calculated as: high_price - low_price
- FR-7: Max profit calculated as: profit_margin * buy_limit
- FR-8: Dashboard must display top 50 items by default, sorted by max profit
- FR-9: Dashboard must support pagination with 50 items per page
- FR-10: Users must be able to search items by name (partial, case-insensitive)
- FR-11: Users must be able to filter by: price range, margin range, min buy limit, members status
- FR-12: Filters apply instantly with 300ms debounce
- FR-13: Item modal must display all price fields, calculated metrics, alchemy values, and GE-Tracker link
- FR-17: Members-only items must display yellow star icon in table and modal
- FR-14: Suggestions endpoint must return top 6 items for given budget considering PnL and buy limit
- FR-15: All business logic must reside in the backend; frontend is display-only
- FR-16: Users tracked via anonymous sessions (no login required)

## Non-Goals

- No user authentication/accounts
- No real-time price updates (24-hour sync is sufficient)
- No historical price charts or trend analysis
- No price alerts or notifications
- No user-specific watchlists or favorites
- No automated trading or bot integration
- No proxy rotation
- No mobile app (responsive web only)
- No dark mode (can add later)
- No client-side sorting/filtering (all server-side)

## Technical Considerations

- **Backend:** AdonisJS 6 with Lucid ORM
- **Frontend:** Next.js 16 with React 19
- **Database:** SQLite with better-sqlite3
- **UI Components:** Shadcn UI
- **Data Source:** OSRS Wiki Real-time Prices API (https://prices.runescape.wiki/api/v1/osrs)
- **Icons:** OSRS Wiki images (URL from icon_filename)
- **Scheduling:** node-cron or AdonisJS scheduler
- **Session:** AdonisJS session with cookies (anonymous)

## Success Metrics

- All tradeable items (~3700) successfully fetched and stored
- Price data refreshes successfully every 24 hours without errors
- Dashboard loads within 2 seconds
- Search and filter results update within 500ms
- Users can identify top profit opportunities within 30 seconds of landing

## Sources

- [OSRS Wiki Real-time Prices API](https://oldschool.runescape.wiki/w/RuneScape:Real-time_Prices)
- [osrsbox-db GitHub](https://github.com/osrsbox/osrsbox-db)
- [oldschool-api npm](https://www.npmjs.com/package/oldschool-api)
