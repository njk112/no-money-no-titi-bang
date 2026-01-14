# PRD: Frictionless Blocking from Dashboard

## Introduction

Enable users to block items directly from the dashboard without opening the detail modal, and streamline the existing modal blocking flow. Currently, blocking requires clicking into a modal and confirming the action. This feature removes friction by adding a block button to each table row and eliminating all confirmation dialogs, making item management faster and more intuitive.

## Goals

- Allow blocking items directly from the dashboard table rows
- Remove confirmation dialog from blocking flow entirely
- Auto-close modal after blocking an item
- Maintain consistency between dashboard and modal blocking behavior
- Keep the existing Settings page as the place to manage/unblock items

## User Stories

### US-001: Add block button to dashboard table rows
**Description:** As a user, I want to block items directly from the dashboard table so that I don't have to open the modal for every item I want to hide.

**Acceptance Criteria:**
- [ ] Block button (ban icon) appears on each row in ItemsTable
- [ ] Button is styled consistently with existing favorite toggle button
- [ ] Button is visible without hovering (always shown)
- [ ] Clicking the button immediately blocks the item (no confirmation)
- [ ] Item row disappears immediately after blocking
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-002: Remove confirmation dialog from modal blocking
**Description:** As a user, I want to block items from the modal with a single click so that the process is fast and frictionless.

**Acceptance Criteria:**
- [ ] Ban icon in ItemDetailModal blocks immediately on click
- [ ] Inline confirmation UI ("Block this item?" with Confirm/Cancel) is removed
- [ ] `showBlockConfirm` state and related logic is removed
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-003: Close modal after blocking
**Description:** As a user, I want the modal to close automatically after I block an item so that I can continue browsing the dashboard.

**Acceptance Criteria:**
- [ ] Modal closes immediately after block button is clicked
- [ ] `onClose` callback is triggered after `toggleBlocked` is called
- [ ] No visual glitches or flash before modal closes
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: Add a block button (ban icon) to each row in the ItemsTable component, positioned near the existing favorite toggle
- FR-2: Clicking the dashboard block button calls `toggleBlocked(item.id)` immediately without any confirmation
- FR-3: Remove the `showBlockConfirm` state and inline confirmation UI from ItemDetailModal
- FR-4: Modal block button calls `toggleBlocked(item.id)` followed by `onClose()` in a single click handler
- FR-5: Blocked items continue to be filtered out of the dashboard display (existing behavior)

## Non-Goals

- No undo functionality on the dashboard (users manage blocked items via Settings)
- No toast notifications or animations when blocking
- No changes to the Settings page blocked items management
- No batch blocking of multiple items at once
- No keyboard shortcuts for blocking

## Design Considerations

- Block button should use the same `Ban` icon from lucide-react as the modal
- Button placement: After the favorite toggle button in the actions column
- Use `variant="ghost"` and `size="icon"` to match existing button styling
- Consider using a slightly muted color (e.g., `text-muted-foreground`) to not draw too much attention, with hover state for clarity

## Technical Considerations

- Reuse existing `toggleBlocked` function from `useSettings()` context
- ItemsTable component needs access to `toggleBlocked` - either pass as prop or use context directly
- Modal's `onClose` prop is already available - just need to call it after blocking
- No API changes required - blocking remains client-side localStorage only

## Success Metrics

- Users can block items in 1 click from dashboard (down from 3+ clicks: open modal → click ban → confirm)
- Users can block items in 1 click from modal (down from 2 clicks: click ban → confirm)
- Modal closes immediately after blocking with no additional user action

## Open Questions

- None - requirements are clear and implementation is straightforward
