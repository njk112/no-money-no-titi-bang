# PRD: Volume Filter Bug Fix

## Introduction

The volume filter fields (min volume, max volume) exist in the UI but do not work. When users enter volume values (especially large numbers like 10,000,000), the filters are ignored because the volume parameters are never sent to the backend API. This is a bug in the frontend query string builder.

## Goals

- Fix volume filtering so users can filter items by minimum and maximum volume
- Ensure large numbers (e.g., 10,000,000+) are handled correctly
- Maintain consistency with how other numeric filters (price, margin) work

## User Stories

### US-001: Add volume parameters to API query string
**Description:** As a user, I want my volume filter inputs to be sent to the API so that items are actually filtered by volume.

**Acceptance Criteria:**
- [ ] `min_volume` parameter is included in the API query string when set
- [ ] `max_volume` parameter is included in the API query string when set
- [ ] Values are converted to strings correctly (matching other filters)
- [ ] Typecheck passes
- [ ] Verify in browser: entering min_volume=10000000 returns only items with volume >= 10,000,000

### US-002: Verify large number handling
**Description:** As a user, I want to enter large volume numbers (e.g., 10,000,000) and have them filter correctly.

**Acceptance Criteria:**
- [ ] Numbers up to JavaScript's safe integer limit work correctly
- [ ] No scientific notation issues (10000000 not converted to 1e7)
- [ ] Filter correctly returns items matching the volume criteria
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: The `buildQueryString` function in `use-items.ts` must include `min_volume` when `params.min_volume` is defined
- FR-2: The `buildQueryString` function in `use-items.ts` must include `max_volume` when `params.max_volume` is defined
- FR-3: Volume values must be converted to strings using `String()` (consistent with other numeric filters)

## Non-Goals

- No changes to backend API (already supports volume filters)
- No changes to the UI input fields (already exist and work)
- No input validation changes (out of scope for this bug fix)

## Technical Considerations

- **Root Cause:** In `frontend/hooks/use-items.ts`, the `buildQueryString` function (lines 23-37) builds the API query string but is missing `min_volume` and `max_volume` parameters
- **Backend:** Already supports volume filtering via `parseInt()` in `backend/app/controllers/items_controller.ts:73-79`
- **Database:** Volume column is `bigInteger` so can handle large numbers

## Code Location

| File | Lines | Issue |
|------|-------|-------|
| `frontend/hooks/use-items.ts` | 23-37 | Missing `min_volume` and `max_volume` in query string builder |

## Success Metrics

- Volume filters work for all valid numeric inputs
- Large numbers (10,000,000+) filter correctly
- No regressions to other filters (price, margin)

## Open Questions

None - root cause is identified and fix is straightforward.
