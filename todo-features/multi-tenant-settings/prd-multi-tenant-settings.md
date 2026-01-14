# PRD: Multi-Tenant Database Architecture with User Settings & Permissioning

## Introduction

Refactor the application to support multi-tenancy at the user level, moving all settings from browser localStorage to the database. This enables settings synchronization across devices when users sign in (future OAuth implementation) and establishes a permission tier system to gate premium features like regime threshold modification and calibration.

Currently, favorites, blocked items, and default filters are stored in localStorage (lost on device/browser change), while regime thresholds are global (shared across all users). This feature introduces user-specific settings storage and a tiered permission model to support future monetization.

## Goals

- Migrate all user settings (favorites, blocked items, default filters) from localStorage to database
- Make regime thresholds user-specific instead of global
- Implement a tenant (user) model with unique identifiers for future OAuth integration
- Create a permission tier system (Free → Basic → Pro → Enterprise)
- Gate regime threshold modification and calibration/recalculation behind paid tiers
- Design schema to be auth-agnostic (works with anonymous users now, OAuth users later)
- Maintain backwards compatibility during transition (graceful localStorage fallback)

## User Stories

### US-001: Create tenant database schema
**Description:** As a developer, I need a tenant table to store user/client records so each user has a unique identity for settings ownership.

**Acceptance Criteria:**
- [ ] Create `tenants` table with: `id` (UUID, PK), `external_id` (nullable, for future OAuth), `provider` (nullable, e.g., 'google', 'discord'), `email` (nullable), `display_name` (nullable), `tier` (enum: 'free', 'basic', 'pro', 'enterprise', default 'free'), `last_active_at` (TIMESTAMP), `created_at`, `updated_at`
- [ ] Add unique constraint on `(provider, external_id)` for OAuth users
- [ ] Create Lucid model with appropriate TypeScript types
- [ ] Migration runs successfully
- [ ] Typecheck passes

### US-002: Create user settings database schema
**Description:** As a developer, I need a user_settings table to persist favorites, blocked items, and default filters per tenant.

**Acceptance Criteria:**
- [ ] Create `user_settings` table with: `id` (INT, PK), `tenant_id` (UUID, FK to tenants), `favorites` (JSON array of item IDs), `blocked_items` (JSON array of item IDs), `default_filters` (JSON object with minPrice, maxPrice, minMargin, minVolume, maxVolume), `show_favorites_only` (BOOLEAN, default false), `created_at`, `updated_at`
- [ ] Add unique constraint on `tenant_id` (one settings row per tenant)
- [ ] Add cascade delete when tenant is removed
- [ ] Create Lucid model with JSON column serialization
- [ ] Migration runs successfully
- [ ] Typecheck passes

### US-003: Create tenant-specific regime thresholds schema
**Description:** As a developer, I need to support per-tenant regime thresholds so each user can have their own classification settings.

**Acceptance Criteria:**
- [ ] Create `tenant_regime_thresholds` table with: `id` (INT, PK), `tenant_id` (UUID, FK to tenants), `chop_max` (FLOAT), `range_norm_max` (FLOAT), `slope_norm_max` (FLOAT), `cross_rate_min` (FLOAT), `window_size` (INT), `created_at`, `updated_at`
- [ ] Add unique constraint on `tenant_id`
- [ ] Add cascade delete when tenant is removed
- [ ] Keep existing `regime_thresholds` table as system defaults for new tenants
- [ ] Create Lucid model
- [ ] Migration runs successfully
- [ ] Typecheck passes

### US-004: Create permission tier definitions
**Description:** As a developer, I need a clear definition of what each tier can access so the application can enforce permissions consistently.

**Acceptance Criteria:**
- [ ] Create `config/permissions.ts` defining tier capabilities:
  - `free`: View items, use filters, manage favorites/blocked items, view regime segments
  - `basic`: All free features (reserved for future differentiation)
  - `pro`: All basic features + export data + modify regime thresholds + run calibration + run recalculation
  - `enterprise`: All pro features + (reserved for future features)
- [ ] Export TypeScript types for tier names and permission checks
- [ ] Create helper function `canAccess(tier: Tier, feature: Feature): boolean`
- [ ] Typecheck passes

### US-005: Implement anonymous tenant creation
**Description:** As a user visiting the app without signing in, I want a tenant record created automatically so my settings persist in the database.

**Acceptance Criteria:**
- [ ] Create service to generate anonymous tenant with UUID
- [ ] Store tenant UUID in httpOnly cookie (or localStorage as fallback)
- [ ] On first request, check for existing tenant cookie; create new tenant if missing
- [ ] Anonymous tenants have `provider: null`, `external_id: null`
- [ ] Anonymous tenants default to 'free' tier
- [ ] Typecheck passes

### US-006: Create tenant middleware
**Description:** As a developer, I need middleware that attaches the current tenant to every request so controllers can access tenant context.

**Acceptance Criteria:**
- [ ] Create `tenant_middleware.ts` that reads tenant UUID from localStorage-provided header (e.g., `X-Tenant-ID`)
- [ ] Attach tenant record to request context (e.g., `ctx.tenant`)
- [ ] If no tenant found, create anonymous tenant and return ID in response header
- [ ] Update `last_active_at` timestamp on each request (for cleanup job)
- [ ] Middleware runs on all API routes
- [ ] Typecheck passes

### US-007: Create user settings API endpoints
**Description:** As a frontend developer, I need API endpoints to read and update user settings so the frontend can sync with the database.

**Acceptance Criteria:**
- [ ] `GET /api/settings` - Returns current tenant's settings (favorites, blocked_items, default_filters, show_favorites_only)
- [ ] `PUT /api/settings` - Updates current tenant's settings (partial update supported)
- [ ] `PUT /api/settings/favorites` - Update favorites array
- [ ] `PUT /api/settings/blocked-items` - Update blocked items array
- [ ] `PUT /api/settings/filters` - Update default filters
- [ ] All endpoints use tenant from middleware context
- [ ] Returns 200 with updated settings on success
- [ ] Typecheck passes

### US-008: Create tenant-specific regime threshold endpoints
**Description:** As a frontend developer, I need regime threshold endpoints that respect tenant context and permissions.

**Acceptance Criteria:**
- [ ] Modify `GET /api/regime/thresholds` to return tenant's thresholds (fallback to global defaults if none set)
- [ ] Modify `PUT /api/regime/thresholds` to update tenant's thresholds (creates row if not exists)
- [ ] Add permission check: return 403 if tenant tier is 'free' or 'basic'
- [ ] Include `tier` and `canModify` in response for frontend UI state
- [ ] Typecheck passes

### US-009: Add permission checks to calibration endpoint
**Description:** As a system, I need to restrict calibration to paid tiers so free users cannot auto-calibrate thresholds.

**Acceptance Criteria:**
- [ ] Modify `POST /api/regime/calibrate` to check tenant tier
- [ ] Return 403 with `{ error: 'upgrade_required', requiredTier: 'pro' }` if tier is 'free' or 'basic'
- [ ] On success, save calibrated thresholds to tenant's `tenant_regime_thresholds` row
- [ ] Typecheck passes

### US-010: Add permission checks to recalculation endpoint
**Description:** As a system, I need to restrict recalculation to paid tiers so free users cannot trigger expensive recomputation.

**Acceptance Criteria:**
- [ ] Modify `POST /api/regime/recalculate` to check tenant tier
- [ ] Return 403 with `{ error: 'upgrade_required', requiredTier: 'pro' }` if tier is 'free' or 'basic'
- [ ] Use tenant's thresholds (not global) when recalculating
- [ ] Typecheck passes

### US-011: Update frontend settings context for API sync
**Description:** As a user, I want my settings to sync with the database so they persist across devices and browsers.

**Acceptance Criteria:**
- [ ] Modify `SettingsContext` to fetch initial settings from `GET /api/settings` on mount
- [ ] Send `X-Tenant-ID` header with all API requests (from localStorage)
- [ ] Store new tenant ID from response header if not already in localStorage
- [ ] Update settings via API calls, with localStorage as cache
- [ ] Implement optimistic updates with rollback on API failure
- [ ] On API failure/offline: fall back to localStorage cache, queue changes for sync
- [ ] Show subtle offline indicator when operating from cache
- [ ] Sync queued changes when connection restored
- [ ] Show loading state while fetching initial settings
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-012: Update settings page for permission-aware UI
**Description:** As a user, I want to see which features require an upgrade so I understand the value of paid tiers.

**Acceptance Criteria:**
- [ ] Fetch tenant tier from API (add to settings or separate endpoint)
- [ ] Disable regime threshold inputs if tier is 'free' or 'basic'
- [ ] Disable calibrate button if tier is 'free' or 'basic'
- [ ] Disable recalculate button if tier is 'free' or 'basic'
- [ ] Show upgrade prompt/badge on locked features (e.g., "Pro feature")
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-013: Create tenant info API endpoint
**Description:** As a frontend developer, I need an endpoint to get current tenant info including tier for UI permission checks.

**Acceptance Criteria:**
- [ ] `GET /api/tenant` - Returns `{ id, tier, displayName, email, provider, permissions: { canModifyThresholds, canCalibrate, canRecalculate, canExport } }`
- [ ] Permissions object computed from tier using permission config
- [ ] Typecheck passes

### US-014: Seed default settings for new tenants
**Description:** As a new user, I want sensible default settings so the app is immediately usable.

**Acceptance Criteria:**
- [ ] When creating new tenant, also create `user_settings` row with empty favorites, empty blocked_items, default filters from constants
- [ ] Copy global `regime_thresholds` to `tenant_regime_thresholds` for new tenant
- [ ] Use database transaction to ensure atomic creation
- [ ] Typecheck passes

### US-015: Add migration path for existing localStorage data
**Description:** As an existing user with localStorage settings, I want my settings migrated to the database so I don't lose my configuration.

**Acceptance Criteria:**
- [ ] Frontend checks for existing localStorage settings on first load
- [ ] If localStorage has data and API returns empty/default settings, prompt user to migrate
- [ ] Provide "Import local settings" action that POSTs localStorage data to API
- [ ] Clear localStorage after successful migration (or keep as cache)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-016: Implement anonymous tenant cleanup job
**Description:** As a system administrator, I want inactive anonymous tenants deleted after 30 days to keep the database tidy.

**Acceptance Criteria:**
- [ ] Create scheduled job/command to delete anonymous tenants with no activity for 30+ days
- [ ] Only delete tenants where `provider IS NULL` (anonymous)
- [ ] Track `last_active_at` timestamp on tenant (updated on any API request)
- [ ] Add `last_active_at` column to tenants table via migration
- [ ] Cascade delete removes associated user_settings and tenant_regime_thresholds
- [ ] Job can be run manually via CLI command (e.g., `node ace tenants:cleanup`)
- [ ] Log count of deleted tenants
- [ ] Typecheck passes

### US-017: Add export permission check
**Description:** As a system, I need to restrict data export to Pro+ tiers.

**Acceptance Criteria:**
- [ ] Modify `GET /api/regime/export/:itemId` to check tenant tier
- [ ] Return 403 with `{ error: 'upgrade_required', requiredTier: 'pro' }` if tier is 'free' or 'basic'
- [ ] Typecheck passes

## Functional Requirements

- FR-1: The system must create a `tenants` table storing user identity, OAuth provider info (nullable), and permission tier
- FR-2: The system must create a `user_settings` table storing favorites, blocked items, and default filters as JSON per tenant
- FR-3: The system must create a `tenant_regime_thresholds` table storing per-tenant classification thresholds
- FR-4: The system must automatically create an anonymous tenant for users without authentication
- FR-5: The system must store tenant identifier in a cookie for session persistence
- FR-6: The system must attach tenant context to all API requests via middleware
- FR-7: The system must return 403 Forbidden when non-paying tenants attempt to modify regime thresholds
- FR-8: The system must return 403 Forbidden when non-paying tenants attempt to run calibration
- FR-9: The system must return 403 Forbidden when non-paying tenants attempt to run recalculation
- FR-10: The system must use tenant-specific thresholds for regime classification operations
- FR-11: The system must fall back to global default thresholds if tenant has no custom thresholds
- FR-12: The system must provide API endpoints for reading and updating user settings
- FR-13: The system must support partial updates to settings (e.g., only update favorites)
- FR-14: The frontend must sync settings with the database on load and on change
- FR-15: The frontend must disable premium features for non-paying tiers with upgrade prompts
- FR-16: The system must support future OAuth integration without schema changes

## Non-Goals

- **Authentication implementation** - OAuth login is deferred to a future feature; this PRD only prepares the schema
- **Payment integration** - No Stripe/payment processing; tier upgrades will be manual/admin for now
- **Admin panel for tier management** - Tier changes done via database directly initially
- **Data migration tooling** - No automated migration of existing anonymous data to OAuth accounts
- **Rate limiting by tier** - All tiers have same rate limits initially
- **Team/organization tenancy** - Tenants are individual users only; no shared team settings
- **Regime segments per tenant** - Regime segments remain global; only thresholds are per-tenant

## Technical Considerations

### Database Schema Design
```
tenants
├── id (UUID, PK)
├── external_id (VARCHAR, nullable) -- OAuth user ID
├── provider (VARCHAR, nullable) -- 'google', 'discord', 'github'
├── email (VARCHAR, nullable)
├── display_name (VARCHAR, nullable)
├── tier (ENUM: free/basic/pro/enterprise, default 'free')
├── last_active_at (TIMESTAMP) -- For cleanup job
├── created_at, updated_at
└── UNIQUE(provider, external_id)

user_settings
├── id (INT, PK)
├── tenant_id (UUID, FK → tenants, UNIQUE)
├── favorites (JSON) -- [1234, 5678, ...]
├── blocked_items (JSON) -- [111, 222, ...]
├── default_filters (JSON) -- {minPrice: "100", ...}
├── show_favorites_only (BOOLEAN)
├── created_at, updated_at
└── ON DELETE CASCADE

tenant_regime_thresholds
├── id (INT, PK)
├── tenant_id (UUID, FK → tenants, UNIQUE)
├── chop_max, range_norm_max, slope_norm_max, cross_rate_min (FLOAT)
├── window_size (INT)
├── created_at, updated_at
└── ON DELETE CASCADE
```

### Tenant Identification Flow
1. Frontend checks localStorage for `tenant_id`
2. Request sent to API with `X-Tenant-ID` header (if tenant_id exists)
3. Middleware checks for `X-Tenant-ID` header
4. If found: Load tenant from database, attach to context, update `last_active_at`
5. If not found: Create anonymous tenant, return new ID in `X-Tenant-ID` response header
6. Frontend stores returned tenant ID in localStorage for future requests
7. Controller accesses tenant via `ctx.tenant`

### Permission Tier Matrix
| Feature | Free | Basic | Pro | Enterprise |
|---------|------|-------|-----|------------|
| View items & filters | ✓ | ✓ | ✓ | ✓ |
| Favorites & blocked items | ✓ | ✓ | ✓ | ✓ |
| View regime segments | ✓ | ✓ | ✓ | ✓ |
| Export data | ✗ | ✗ | ✓ | ✓ |
| Modify regime thresholds | ✗ | ✗ | ✓ | ✓ |
| Run calibration | ✗ | ✗ | ✓ | ✓ |
| Run recalculation | ✗ | ✗ | ✓ | ✓ |

### SQLite JSON Handling
- SQLite supports JSON via `json()` function and JSON1 extension
- Lucid ORM can serialize/deserialize JSON columns automatically
- Use `@column({ serialize: (v) => JSON.stringify(v), consume: (v) => JSON.parse(v) })`

### Future OAuth Preparation
- Schema supports `provider` + `external_id` for OAuth mapping
- Anonymous tenants can be "claimed" by setting these fields after OAuth login
- UUID primary key ensures no conflicts during account linking

## Success Metrics

- Settings persist across browser sessions without localStorage
- Settings sync correctly when accessed from different browsers/devices (same tenant cookie)
- 100% of regime threshold modifications blocked for free/basic tiers
- 100% of calibration requests blocked for free/basic tiers
- 100% of recalculation requests blocked for free/basic tiers
- No regression in page load time (settings fetch < 200ms)
- Existing localStorage users can migrate settings without data loss

## Design Decisions

1. **Cookie vs localStorage for tenant ID** - Use localStorage for now (simpler implementation). Migrate to httpOnly cookies when implementing OAuth authentication.

2. **Tenant ID in URL** - Infer tenant from context via middleware. Endpoints use simple paths like `GET /api/settings` rather than `GET /api/tenants/:id/settings`.

3. **Offline support** - Fall back to localStorage cache when API is unreachable. Sync settings when connection is restored. Show subtle indicator when operating offline.

4. **Export restriction scope** - Export is a Pro+ feature only. Free and Basic tiers cannot export data.

5. **Anonymous tenant cleanup** - Delete anonymous tenants after 30 days of inactivity. Run cleanup job periodically to keep database tidy.
