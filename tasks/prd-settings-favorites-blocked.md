# PRD: Settings, Favorites & Blocked Items

## Introduction

Add a Settings page and item management features to the OSRS GE Tracker dashboard. Users can favorite items for quick access, block items they don't want to see, configure default filter values, and manage all preferences from a dedicated Settings page. All data persists in localStorage (no backend changes required).

## Goals

- Allow users to favorite items from the table and modal for easy tracking
- Enable filtering the dashboard to show only favorited items
- Allow users to block/hide unwanted items from the dashboard
- Provide a Settings page to configure default filter values
- Provide a Settings page to manage favorites and blocked items lists
- Persist all preferences in localStorage

## User Stories

### US-001: Create localStorage persistence hook
**Description:** As a developer, I need a reusable hook to safely read/write localStorage with SSR compatibility so that user preferences persist across sessions.

**Acceptance Criteria:**
- [ ] Create `hooks/use-local-storage.ts` with generic type support
- [ ] Handle SSR by checking for window availability
- [ ] Sync across browser tabs via storage event listener
- [ ] Typecheck passes

### US-002: Create settings context for global state
**Description:** As a developer, I need a React context to manage favorites, blocked items, and default filters globally so all components can access and modify this state.

**Acceptance Criteria:**
- [ ] Create `contexts/settings-context.tsx` with SettingsProvider
- [ ] Expose `favorites` Set with `toggleFavorite`, `removeFavorite`, `clearFavorites`
- [ ] Expose `blockedItems` Set with `toggleBlocked`, `removeBlocked`, `clearBlocked`
- [ ] Expose `defaultFilters` object with `setDefaultFilters`, `resetToSystemDefaults`
- [ ] Expose `showFavoritesOnly` boolean with setter
- [ ] Create `useSettings` hook for consuming the context
- [ ] Wrap app with SettingsProvider in layout
- [ ] Typecheck passes

### US-003: Add favorite star to items table
**Description:** As a user, I want to click a star icon on any table row to favorite/unfavorite an item so I can mark items I want to track.

**Acceptance Criteria:**
- [ ] Add star icon column as first column in items table
- [ ] Filled yellow star for favorited items, outline star for non-favorites
- [ ] Clicking star toggles favorite state
- [ ] Star click does not trigger row click (open modal)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-004: Add favorite/block buttons to item modal
**Description:** As a user, I want to favorite or block an item from its detail modal so I can manage items while viewing their details.

**Acceptance Criteria:**
- [ ] Add star button in modal header next to item name
- [ ] Star toggles favorite state with visual feedback (filled/outline)
- [ ] Add block button (Ban icon) in modal header
- [ ] Clicking block shows inline confirmation text, item marked as blocked after confirm
- [ ] Modal stays open after blocking, item hidden from list after modal closes
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: Add favorites filter toggle to dashboard
**Description:** As a user, I want to toggle a "Favorites" filter on the dashboard so I can quickly see only my favorited items.

**Acceptance Criteria:**
- [ ] Add "Favorites" toggle button near the search/filter area
- [ ] When enabled, only show items that are both favorited AND match other active filters
- [ ] Visual indication when favorites filter is active (filled star, different button style)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-006: Hide blocked items from dashboard
**Description:** As a user, I want blocked items automatically hidden from the dashboard so I don't see items I'm not interested in.

**Acceptance Criteria:**
- [ ] Blocked items are filtered out of the items list on dashboard
- [ ] Blocking works with pagination (blocked items don't count toward displayed items)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-007: Create Settings page layout
**Description:** As a user, I want a dedicated Settings page accessible from the navigation so I can manage all my preferences in one place.

**Acceptance Criteria:**
- [ ] Create `/settings` route with page component
- [ ] Add "Settings" link to navigation (after Suggestions)
- [ ] Page has clear heading and organized sections
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-008: Default filter values settings section
**Description:** As a user, I want to configure default values for dashboard filters so I can save my preferred starting filters.

**Acceptance Criteria:**
- [ ] Settings section with inputs for: Min Price, Max Price, Min Margin, Min Volume, Max Volume
- [ ] "Save Defaults" button saves current input values to localStorage
- [ ] "Reset to System Defaults" button clears saved defaults (sets all to empty)
- [ ] Show success feedback when defaults are saved
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-009: Add "Reset to Defaults" button on dashboard
**Description:** As a user, I want a button on the dashboard to reset filters to my saved defaults so I can quickly return to my preferred filter settings.

**Acceptance Criteria:**
- [ ] Add "Reset to Defaults" button in filter panel
- [ ] Clicking button sets all filter inputs to saved default values
- [ ] If no defaults saved, resets to empty values
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-010: Favorites management in Settings
**Description:** As a user, I want to view and manage my favorited items in Settings so I can remove favorites without finding them in the table.

**Acceptance Criteria:**
- [ ] Settings section showing list of favorited items with icon and name
- [ ] Each item has a "Remove" button to unfavorite
- [ ] "Clear All Favorites" button with confirmation removes all favorites
- [ ] Empty state message when no favorites exist
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-011: Blocked items management in Settings
**Description:** As a user, I want to view and manage my blocked items in Settings so I can unblock items if I change my mind.

**Acceptance Criteria:**
- [ ] Settings section showing list of blocked items with icon and name
- [ ] Each item has an "Unblock" button to remove from blocked list
- [ ] "Clear All Blocked" button with confirmation removes all blocked items
- [ ] Empty state message when no blocked items exist
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: Store favorites as array of item IDs in localStorage key `osrs-ge-tracker-favorites`
- FR-2: Store blocked items as array of item IDs in localStorage key `osrs-ge-tracker-blocked`
- FR-3: Store default filters as JSON object in localStorage key `osrs-ge-tracker-default-filters`
- FR-4: Favorites filter is additive - shows items that are favorited AND match other active filters
- FR-5: Blocked items are hidden from dashboard but accessible in Settings
- FR-6: Star icon in table must not trigger row click when clicked
- FR-7: Block action in modal shows confirmation before blocking, modal stays open
- FR-8: Default filters only apply when user clicks "Reset to Defaults" button
- FR-9: Settings page displays item names and icons by fetching item data for stored IDs
- FR-10: All preference changes sync across browser tabs via storage events

## Non-Goals

- No backend changes or database storage for preferences
- No "Show blocked items" toggle on dashboard (only manageable in Settings)
- No automatic application of default filters on page load
- No export/import of preferences
- No favorite/block from suggestion cards (only main table and modal)

## Design Considerations

- Use existing Shadcn UI components (Card, Button, Input, Label)
- Star icon: `Star` from lucide-react (filled yellow when active)
- Block icon: `Ban` from lucide-react
- Settings sections should use Card components for visual grouping
- Maintain responsive design for mobile
- Follow existing color patterns (yellow for favorites, destructive red for block/remove actions)

## Technical Considerations

- React Context for global state management
- `useLocalStorage` hook for SSR-safe persistence
- Client-side filtering of blocked items (items still fetched from API)
- Fetch item details for Settings lists using existing API endpoint
- No changes to backend API required

## Success Metrics

- Users can favorite an item in under 2 clicks
- Users can block an item in under 3 clicks (including confirmation)
- All preferences persist after page refresh
- Settings page loads and displays all sections without errors

## Open Questions

- None at this time
