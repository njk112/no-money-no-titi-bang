# PRD: Prices and Volume Auto-Sync Feature

## Introduction

Add automatic price and volume synchronization that runs every minute on the backend, with frontend auto-refresh and "last refreshed" display. This ensures users always have fresh market data for making informed trading decisions in the OSRS Grand Exchange.

## Goals

- Sync prices and volume data from OSRS Wiki API every minute
- Auto-refresh frontend data without requiring manual page refresh
- Display "last refreshed" timestamp in modal and dashboard header
- Provide rate-limited manual refresh option for users who want immediate updates
- Maintain system stability with silent retry on sync failures

## User Stories

### US-001: Separate Price Sync Scheduler
**Description:** As a system, I need to sync prices every minute independently from the daily item sync so that price data stays fresh without unnecessary API calls for item metadata.

**Acceptance Criteria:**
- [ ] New `PRICES_SYNC_CRON` environment variable (default: `* * * * *`)
- [ ] Price sync runs independently from item sync
- [ ] Daily item sync (`SYNC_CRON`) remains unchanged
- [ ] Sync failures are logged and silently retry on next interval
- [ ] Typecheck/lint passes

### US-002: Sync Status API Endpoint
**Description:** As a frontend developer, I need an API endpoint to get the last sync timestamp so I can display when data was last refreshed.

**Acceptance Criteria:**
- [ ] `GET /api/sync/status` endpoint returns `{ last_synced_at: string | null }`
- [ ] Timestamp reflects the most recent successful price sync
- [ ] Returns `null` if no sync has occurred yet
- [ ] Response time under 100ms
- [ ] Typecheck/lint passes

### US-003: Frontend Auto-Refresh
**Description:** As a user, I want the items table to automatically refresh every 60 seconds so I see updated prices without manually refreshing the page.

**Acceptance Criteria:**
- [ ] Items table data refreshes every 60 seconds automatically
- [ ] Refresh happens silently without UI disruption
- [ ] Current filters, search, and pagination are preserved during refresh
- [ ] No duplicate requests if user is actively filtering
- [ ] Typecheck/lint passes

### US-004: Last Refreshed Display in Dashboard Header
**Description:** As a user, I want to see when data was last refreshed in the dashboard header so I know how current the prices are.

**Acceptance Criteria:**
- [ ] "Last refreshed: X min ago" displays in dashboard header
- [ ] Shows relative time (e.g., "just now", "2 min ago", "1 hour ago")
- [ ] Updates automatically as time passes
- [ ] Shows "Loading..." during initial fetch
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-005: Last Refreshed Display in Item Modal
**Description:** As a user, I want to see when data was last refreshed in the item detail modal so I know how current the displayed prices are.

**Acceptance Criteria:**
- [ ] "Last refreshed" displays at the bottom of the item detail modal
- [ ] Uses same relative time format as dashboard
- [ ] Styled consistently with modal design (muted text, refresh icon)
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-006: Rate-Limited Manual Refresh Button
**Description:** As a user, I want a manual refresh button so I can get the latest data immediately when I need it, with rate limiting to prevent API abuse.

**Acceptance Criteria:**
- [ ] Refresh button visible near "Last refreshed" text
- [ ] Clicking triggers immediate data refetch
- [ ] Button disabled for 30 seconds after click (rate limit)
- [ ] Visual feedback during refresh (spinning icon or disabled state)
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: Add `PRICES_SYNC_CRON` environment variable with default value `* * * * *` (every minute)
- FR-2: Create separate price sync cron job that runs `PricesSyncService.syncPrices()` only
- FR-3: Keep existing `SYNC_CRON` for daily full sync (items + prices)
- FR-4: Create `GET /api/sync/status` endpoint returning latest `synced_at` timestamp from `item_prices` table
- FR-5: Create `useSyncStatus` hook that polls `/api/sync/status` every 60 seconds
- FR-6: Add optional `pollInterval` parameter to `useItems` hook for auto-refresh
- FR-7: Create `LastRefreshed` component displaying relative time with refresh icon
- FR-8: Add manual refresh button with 30-second cooldown
- FR-9: Display `LastRefreshed` component in dashboard header
- FR-10: Display `LastRefreshed` component in item detail modal footer

## Non-Goals

- No WebSocket or real-time push updates (polling is sufficient for 1-minute intervals)
- No user-configurable sync frequency
- No sync status notifications or alerts
- No historical sync logs or audit trail in UI
- No sync progress indicator during backend sync

## Design Considerations

- Reuse existing relative time formatting pattern from `item-detail-modal.tsx`
- Use `lucide-react` `RefreshCw` icon for refresh indicator
- Match existing muted text styling (`text-muted-foreground`)
- Place "Last refreshed" in dashboard header aligned right, near filters
- Place "Last refreshed" in modal footer with border-top separator

## Technical Considerations

- **Backend scheduler:** Use existing `node-cron` library, add second cron job
- **Sync status query:** Single query on `item_prices` table with `ORDER BY synced_at DESC LIMIT 1`
- **Frontend polling:** Use `setInterval` in hooks with cleanup on unmount
- **Rate limiting:** Client-side only (30s cooldown state), no server-side rate limiting needed
- **Error handling:** Backend logs errors, silently retries; frontend shows stale timestamp

### Files to Modify

**Backend:**
- `backend/start/scheduler.ts` - Add separate price sync cron
- `backend/start/routes.ts` - Register new route
- `backend/app/controllers/sync_controller.ts` - New file

**Frontend:**
- `frontend/hooks/use-sync-status.ts` - New file
- `frontend/hooks/use-items.ts` - Add polling parameter
- `frontend/components/last-refreshed.tsx` - New file
- `frontend/components/item-detail-modal.tsx` - Add last refreshed
- `frontend/app/page.tsx` - Add last refreshed + enable polling

## Success Metrics

- Price data is never more than 2 minutes stale during normal operation
- Users can identify data freshness at a glance
- Zero increase in page load time (async polling)
- Manual refresh available within 30 seconds of last refresh

## Open Questions

- None - all requirements clarified
