# PRD: Rolling-Window Regime Classifier

## Introduction

Implement an automated rolling-window regime classifier that identifies periods where price action is stable within a tight band (range-bound: choppy oscillations, frequent reversals, low net drift) versus periods dominated by trends, step changes, or regime shifts. This classifier runs during backend price sync, stores regime segments in the database, and provides a full UI with chart overlay visualization and configurable global thresholds in Settings.

The primary use case is to identify and keep "stable-band" patterns for trading strategy optimization, filtering out trending periods that behave differently.

## Goals

- Automatically classify price windows as RANGE_BOUND or TRENDING during price sync
- Store historical regime segments per item in a dedicated database table
- Provide visual chart overlay showing regime segments in item detail modal
- Allow users to tune classification thresholds via Settings page
- Support both batch (historical) and streaming (real-time) classification
- Include auto-calibration utility for threshold optimization
- Enable filtering items by current regime on dashboard
- Export debug data (CSV/JSON) for analysis and chart overlay in external tools

## User Stories

### US-001: Create regime_segments database table and migration
**Description:** As a developer, I need a database table to store classified regime segments per item so that regime data persists and can be queried efficiently.

**Acceptance Criteria:**
- [ ] Create `regime_segments` table with columns: id, item_id (FK), start_idx, end_idx, start_ts, end_ts, label (RANGE_BOUND|TRENDING), chop, range_norm, slope_norm, cross_rate, band_midpoint, band_width_pct, confidence_score
- [ ] Add foreign key constraint to items table with CASCADE delete
- [ ] Add indexes on item_id and (item_id, end_ts) for query performance
- [ ] Generate and run migration successfully
- [ ] Typecheck passes

### US-002: Create regime_thresholds config table and migration
**Description:** As a developer, I need a table to store global regime classification thresholds so they can be configured via Settings without code changes.

**Acceptance Criteria:**
- [ ] Create `regime_thresholds` table with single row: id, chop_max, range_norm_max, slope_norm_max, cross_rate_min, window_size, updated_at
- [ ] Seed with default values: chop_max=0.25, range_norm_max=0.02, slope_norm_max=0.0005, cross_rate_min=0.08, window_size=24
- [ ] Generate and run migration successfully
- [ ] Typecheck passes

### US-003: Implement computeWindowFeatures utility function
**Description:** As a developer, I need a pure function to compute scale-free features from a price window so the classifier can evaluate any price series.

**Acceptance Criteria:**
- [ ] Create `app/services/regime/window_features.ts` with `computeWindowFeatures(prices: number[]): WindowFeatures`
- [ ] Implement chop ratio: `abs(p[n-1] - p[0]) / (sum(abs(diff(p))) + eps)`
- [ ] Implement normalized range: `(max(p) - min(p)) / (median(p) + eps)`
- [ ] Implement normalized slope: `abs(linearRegressionSlope) / (median(p) + eps)`
- [ ] Implement mean-crossing rate: `signChanges / n` where signChanges counts crossings of mean(p)
- [ ] Use epsilon = 1e-10 to avoid division by zero
- [ ] Return typed WindowFeatures object with all four metrics
- [ ] Typecheck passes

### US-004: Implement linear regression slope helper
**Description:** As a developer, I need a helper function to compute linear regression slope for the normalized slope feature calculation.

**Acceptance Criteria:**
- [ ] Create `app/services/regime/linear_regression.ts` with `computeSlope(values: number[]): number`
- [ ] Implement least squares regression: slope = sum((x - xMean)(y - yMean)) / sum((x - xMean)^2)
- [ ] Use 0-indexed time values (t = 0, 1, 2, ..., n-1)
- [ ] Handle edge case of single-element array (return 0)
- [ ] Typecheck passes

### US-005: Implement classifyWindow function
**Description:** As a developer, I need a function to classify a single window as RANGE_BOUND or TRENDING based on computed features and thresholds.

**Acceptance Criteria:**
- [ ] Create `app/services/regime/classifier.ts` with `classifyWindow(features: WindowFeatures, thresholds: Thresholds): RegimeLabel`
- [ ] Return RANGE_BOUND if ALL conditions met: chop < chop_max, rangeNorm < range_norm_max, slopeNorm < slope_norm_max, crossRate > cross_rate_min
- [ ] Return TRENDING otherwise
- [ ] Typecheck passes

### US-006: Implement rolling classifyRegime function
**Description:** As a developer, I need a function that applies the classifier over a rolling window across an entire price series to generate labels for each window.

**Acceptance Criteria:**
- [ ] Add `classifyRegime(series: PricePoint[], opts: ClassifierOptions): WindowLabel[]` to classifier.ts
- [ ] PricePoint contains { price: number, timestamp: Date, index: number }
- [ ] WindowLabel contains { startIdx, endIdx, startTs, endTs, label, features }
- [ ] Support configurable window_size and step_size (default step=1 for maximum granularity)
- [ ] Efficient O(n) rolling computation where possible
- [ ] Typecheck passes

### US-007: Implement buildSegments function for merging consecutive labels
**Description:** As a developer, I need a function to merge consecutive windows with the same label into contiguous segments with aggregated metadata.

**Acceptance Criteria:**
- [ ] Create `app/services/regime/segment_builder.ts` with `buildSegments(labels: WindowLabel[]): RegimeSegment[]`
- [ ] Merge consecutive RANGE_BOUND windows into single segments
- [ ] Merge consecutive TRENDING windows into single segments
- [ ] Calculate segment metadata: band_midpoint (median of prices), band_width_pct ((max-min)/midpoint * 100), confidence_score (average of individual window scores)
- [ ] Confidence score = weighted combination of how strongly each threshold was passed (e.g., chop at 0.10 when threshold is 0.25 = high confidence)
- [ ] Typecheck passes

### US-008: Create RegimeSegment model
**Description:** As a developer, I need a Lucid ORM model for the regime_segments table to interact with the database.

**Acceptance Criteria:**
- [ ] Create `app/models/regime_segment.ts` extending BaseModel
- [ ] Define all columns with appropriate types and decorators
- [ ] Add belongsTo relationship to Item model
- [ ] Add hasMany relationship from Item to RegimeSegments
- [ ] Typecheck passes

### US-009: Create RegimeThreshold model
**Description:** As a developer, I need a Lucid ORM model for the regime_thresholds table to manage global configuration.

**Acceptance Criteria:**
- [ ] Create `app/models/regime_threshold.ts` extending BaseModel
- [ ] Define all columns with appropriate types
- [ ] Add static method `getGlobal()` to fetch the single config row
- [ ] Add static method `updateGlobal(updates)` to update thresholds
- [ ] Typecheck passes

### US-010: Integrate regime classification into PricesSyncService
**Description:** As a developer, I need the regime classifier to run automatically after each price sync so regime data stays current.

**Acceptance Criteria:**
- [ ] Modify `PricesSyncService` to call regime classification after price update
- [ ] Fetch last 24h (or window_size) of prices for each item with new data
- [ ] Run `classifyRegime` and `buildSegments` on the price series
- [ ] Upsert new/updated segments to `regime_segments` table
- [ ] Only recompute segments that may have changed (optimization)
- [ ] Log classification summary (items processed, segments created/updated)
- [ ] Typecheck passes

### US-011: Create RegimeController with API endpoints
**Description:** As a developer, I need API endpoints to fetch regime data and manage thresholds so the frontend can display and configure regime classification.

**Acceptance Criteria:**
- [ ] Create `app/controllers/regime_controller.ts`
- [ ] `GET /api/regime/segments/:itemId` - returns segments for an item with optional date range filter
- [ ] `GET /api/regime/thresholds` - returns current global thresholds
- [ ] `PUT /api/regime/thresholds` - updates global thresholds (validates ranges)
- [ ] `POST /api/regime/recalculate` - triggers full recalculation for all items (or specific item_id)
- [ ] `GET /api/regime/export/:itemId` - returns CSV or JSON export of labels + features
- [ ] Add routes to routes.ts
- [ ] Typecheck passes

### US-012: Implement autoCalibrateThresholds utility
**Description:** As a developer, I need an auto-calibration utility that analyzes price distributions to suggest optimal thresholds, avoiding magic numbers.

**Acceptance Criteria:**
- [ ] Create `app/services/regime/calibration.ts` with `autoCalibrateThresholds(prices: number[], windowSize: number): SuggestedThresholds`
- [ ] Compute rolling feature distributions across the entire price series
- [ ] Suggest chop_max as the 25th percentile of chop values (range-bound should be lower quartile)
- [ ] Suggest range_norm_max as the 25th percentile of rangeNorm values
- [ ] Suggest slope_norm_max as the 25th percentile of slopeNorm values
- [ ] Suggest cross_rate_min as the 75th percentile of crossRate values (range-bound should be higher)
- [ ] Return suggested values with distribution statistics for UI display
- [ ] Typecheck passes

### US-013: Add calibration endpoint to RegimeController
**Description:** As a developer, I need an API endpoint to run auto-calibration on a sample of items and return suggested thresholds.

**Acceptance Criteria:**
- [ ] Add `POST /api/regime/calibrate` endpoint
- [ ] Accept optional item_ids array or use random sample of 50 items if not provided
- [ ] Run calibration across all specified items' price history
- [ ] Return suggested thresholds with per-feature distribution stats (min, max, p25, p50, p75)
- [ ] Typecheck passes

### US-014: Create useRegimeSegments hook
**Description:** As a frontend developer, I need a React hook to fetch regime segments for an item so I can display them in the UI.

**Acceptance Criteria:**
- [ ] Create `hooks/use-regime-segments.ts`
- [ ] Fetch segments from `/api/regime/segments/:itemId`
- [ ] Support date range filter params
- [ ] Return { segments, isLoading, error, refetch }
- [ ] Typecheck passes

### US-015: Create useRegimeThresholds hook
**Description:** As a frontend developer, I need a React hook to fetch and update global regime thresholds for the Settings page.

**Acceptance Criteria:**
- [ ] Create `hooks/use-regime-thresholds.ts`
- [ ] Fetch thresholds from `/api/regime/thresholds`
- [ ] Provide `updateThresholds(updates)` function that calls PUT endpoint
- [ ] Provide `runCalibration(itemIds?)` function that calls calibration endpoint
- [ ] Return { thresholds, isLoading, error, updateThresholds, runCalibration, suggestedThresholds }
- [ ] Typecheck passes

### US-016: Add regime chart overlay to ItemDetailModal
**Description:** As a user, I want to see regime segments visualized on the price chart so I can understand when the item was range-bound vs trending.

**Acceptance Criteria:**
- [ ] Modify ItemDetailModal to fetch regime segments for the displayed item
- [ ] Add colored background regions to price chart: green for RANGE_BOUND, red/orange for TRENDING
- [ ] Show segment boundaries as vertical dashed lines
- [ ] Add legend explaining the colors
- [ ] Segments should align with the 24h price data timeframe
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-017: Add regime info panel to ItemDetailModal
**Description:** As a user, I want to see the current regime classification and key metrics for an item so I understand its current behavior.

**Acceptance Criteria:**
- [ ] Add "Regime Analysis" section below price chart in modal
- [ ] Display current regime label (RANGE_BOUND or TRENDING) with colored badge
- [ ] Show current window features: Chop, Range %, Slope, Cross Rate with values
- [ ] Show band info for RANGE_BOUND: midpoint price, band width %
- [ ] Show confidence score with visual indicator (low/medium/high)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-018: Add regime filter to dashboard FilterPanel
**Description:** As a user, I want to filter dashboard items by their current regime so I can focus on range-bound or trending items.

**Acceptance Criteria:**
- [ ] Add "Regime" dropdown to FilterPanel with options: All, Range-Bound, Trending
- [ ] Filter applied server-side via API query param
- [ ] Update useItems hook to support regime filter param
- [ ] Update ItemsController to filter by current regime
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-019: Add current_regime column to items for efficient filtering
**Description:** As a developer, I need to cache the current regime label on the items table for efficient dashboard filtering without joining segments.

**Acceptance Criteria:**
- [ ] Add `current_regime` column to items table (nullable, RANGE_BOUND|TRENDING|null)
- [ ] Update PricesSyncService to set current_regime after classification
- [ ] Current regime = label of most recent segment (by end_ts)
- [ ] Generate and run migration
- [ ] Typecheck passes

### US-020: Create Regime Thresholds settings section
**Description:** As a user, I want to configure regime classification thresholds in Settings so I can tune the sensitivity of the classifier.

**Acceptance Criteria:**
- [ ] Add "Regime Classification" section to Settings page
- [ ] Display current thresholds with editable number inputs: Chop Max, Range % Max, Slope Max, Cross Rate Min, Window Size
- [ ] Add explanatory help text for each threshold
- [ ] "Save Thresholds" button saves to backend via API
- [ ] Show success/error feedback on save
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-021: Add auto-calibration UI to Settings
**Description:** As a user, I want to run auto-calibration to get suggested threshold values based on actual price data.

**Acceptance Criteria:**
- [ ] Add "Auto-Calibrate" button in Regime Classification settings section
- [ ] Button triggers calibration API call with loading state
- [ ] Display suggested values next to current values after calibration
- [ ] Show "Apply Suggestions" button to copy suggested values to inputs
- [ ] Display distribution stats (p25, p50, p75) in tooltip or expandable section
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-022: Add recalculate button to Settings
**Description:** As a user, I want to trigger a full recalculation of regime segments after changing thresholds so all historical data uses the new settings.

**Acceptance Criteria:**
- [ ] Add "Recalculate All Segments" button in Regime Classification settings
- [ ] Button triggers recalculate API with loading state
- [ ] Show progress indication (if available) or "Recalculating..." message
- [ ] Show success message with count of items/segments processed
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-023: Add debug export functionality
**Description:** As a user, I want to export regime classification data for external analysis and chart overlay in other tools.

**Acceptance Criteria:**
- [ ] Add "Export Data" button in ItemDetailModal regime section
- [ ] Support CSV and JSON format selection
- [ ] Export includes: timestamp, price, window features (chop, rangeNorm, slopeNorm, crossRate), label, segment boundaries
- [ ] File downloads with item name and date range in filename
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-024: Write unit tests for computeWindowFeatures
**Description:** As a developer, I need comprehensive tests for the window features calculation to ensure correctness.

**Acceptance Criteria:**
- [ ] Create `tests/unit/regime/window_features.spec.ts`
- [ ] Test chop ratio: trending series (high chop), oscillating series (low chop)
- [ ] Test normalized range: tight band (low), wide band (high)
- [ ] Test normalized slope: flat series (near zero), trending series (high)
- [ ] Test mean-crossing rate: oscillating (high), trending (low)
- [ ] Test edge cases: single element, two elements, constant prices
- [ ] All tests pass

### US-025: Write unit tests for classifyRegime
**Description:** As a developer, I need tests for the rolling classifier to verify correct labeling behavior.

**Acceptance Criteria:**
- [ ] Create `tests/unit/regime/classifier.spec.ts`
- [ ] Test sinusoidal/bounded oscillation series -> RANGE_BOUND
- [ ] Test linear trend series -> TRENDING
- [ ] Test step change series -> TRENDING/SHIFT
- [ ] Test random walk with drift -> verify reasonable behavior
- [ ] Test random walk without drift -> sanity check
- [ ] Test threshold boundary conditions
- [ ] All tests pass

### US-026: Write unit tests for buildSegments
**Description:** As a developer, I need tests for segment merging to ensure correct aggregation and metadata calculation.

**Acceptance Criteria:**
- [ ] Create `tests/unit/regime/segment_builder.spec.ts`
- [ ] Test merging consecutive same-label windows
- [ ] Test segment boundaries at label transitions
- [ ] Test band midpoint calculation
- [ ] Test band width percentage calculation
- [ ] Test confidence score aggregation
- [ ] Test empty input handling
- [ ] All tests pass

### US-027: Write integration tests for regime classification pipeline
**Description:** As a developer, I need integration tests verifying the full pipeline from price data to stored segments.

**Acceptance Criteria:**
- [ ] Create `tests/integration/regime_classification.spec.ts`
- [ ] Test full flow: prices -> features -> classify -> segments -> database
- [ ] Test API endpoints return correct data
- [ ] Test threshold updates trigger recalculation correctly
- [ ] Test export endpoints return valid CSV/JSON
- [ ] All tests pass

### US-028: Add streaming classification support
**Description:** As a developer, I need the classifier to efficiently handle real-time streaming price updates without full recalculation.

**Acceptance Criteria:**
- [ ] Add `classifyStreaming(newPrice: PricePoint, state: StreamState): { label: RegimeLabel, segment?: RegimeSegment }`
- [ ] Maintain rolling window state for O(1) updates per new price
- [ ] Only emit new segment when label changes or window completes
- [ ] Integrate with PricesSyncService for incremental updates
- [ ] Typecheck passes

## Functional Requirements

- FR-1: Store regime segments in `regime_segments` table with all computed features and metadata
- FR-2: Store global thresholds in `regime_thresholds` table with single-row configuration
- FR-3: Cache current regime label on items table for efficient dashboard filtering
- FR-4: Classify windows as RANGE_BOUND only when ALL threshold conditions are met
- FR-5: Compute features using scale-free normalization (divide by median) for cross-instrument consistency
- FR-6: Use epsilon (1e-10) in all divisions to prevent divide-by-zero errors
- FR-7: Run classification automatically during price sync for items with new data
- FR-8: Support manual recalculation trigger via API for all items or specific item
- FR-9: Auto-calibration uses percentile-based suggestions from actual price distributions
- FR-10: Chart overlay shows regime segments aligned with displayed price data timeframe
- FR-11: Export functionality supports both CSV and JSON formats with all computed data
- FR-12: Streaming mode maintains O(1) per-update complexity using rolling window state
- FR-13: All thresholds configurable via Settings UI with immediate persistence
- FR-14: Regime filter on dashboard queries by cached current_regime column

## Non-Goals

- No per-item threshold customization (global thresholds only for v1)
- No machine learning-based classification (rule-based only)
- No real-time WebSocket push of regime changes (polling/refresh only)
- No regime-based alerts or notifications
- No historical regime comparison or trend analysis
- No integration with external charting tools (export only)

## Design Considerations

- Use existing Shadcn UI components (Card, Button, Input, Label, Select, Badge)
- Chart overlay colors: green (#22c55e) for RANGE_BOUND, orange (#f97316) for TRENDING
- Regime badge styling: green background for RANGE_BOUND, orange for TRENDING
- Settings section follows existing card-based layout pattern
- Confidence indicator: progress bar or star rating (1-5)
- Help tooltips use existing tooltip component pattern
- Export buttons use Download icon from lucide-react

## Technical Considerations

- Linear regression uses standard least squares formula (no external dependency)
- Median calculation uses sorting approach for small windows, quickselect for large
- Rolling window computation caches intermediate values where possible
- Database indexes critical for segment queries by item_id and time range
- Streaming state stored in memory during sync, not persisted
- Calibration runs on backend to avoid sending large price arrays to frontend
- CSV export uses standard comma delimiter with header row
- JSON export uses array of objects matching WindowLabel type

## Success Metrics

- Classifier correctly identifies >90% of visually obvious range-bound periods
- False positive rate for RANGE_BOUND classification <10%
- Classification runs in <100ms per item during sync
- Settings changes reflect immediately in next classification run
- Chart overlay renders without performance impact on modal open
- Auto-calibration completes in <5s for 50-item sample

## Open Questions

- Should confidence score affect dashboard sorting/filtering?
- Should we show regime history (last N regime changes) in item modal?
- What window_size default is optimal for OSRS price data update frequency?
- Should export include raw prices or just computed features?
