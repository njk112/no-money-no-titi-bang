# PRD: Next.js API Routes for Backend Obfuscation

## Introduction

Migrate all frontend API calls to use Next.js API Routes as a proxy layer, hiding the backend URL and structure from client-side code. Currently, the frontend directly calls the AdonisJS backend at `NEXT_PUBLIC_API_URL`, exposing the backend location in browser network requests. This feature will route all API traffic through Next.js server-side routes, keeping the backend URL completely hidden from clients.

## Goals

- Hide backend API URL from client-side JavaScript and browser network tab
- Route all CRUD operations through Next.js API Routes (`/app/api/...`)
- Pass through existing authentication (cookies/credentials) seamlessly
- Maintain current functionality with no breaking changes to the UI
- Remove `NEXT_PUBLIC_API_URL` environment variable (replace with server-only `API_URL`)
- Establish a consistent pattern for future API integrations

## User Stories

### US-001: Create API utility for server-side fetching
**Description:** As a developer, I need a server-side API utility to make requests to the backend from Next.js API routes.

**Acceptance Criteria:**
- [ ] Create `/frontend/lib/server-api.ts` with fetch wrapper for server-side use
- [ ] Uses `API_URL` environment variable (not NEXT_PUBLIC_)
- [ ] Supports GET, POST, PUT, DELETE methods
- [ ] Forwards cookies/credentials from incoming requests
- [ ] Handles errors consistently with proper status codes
- [ ] Typecheck passes

---

### US-002: Create Items API routes
**Description:** As a user, I want to browse and search items without exposing backend URLs.

**Acceptance Criteria:**
- [ ] Create `GET /app/api/items/route.ts` - proxy for listing items with all query params (page, limit, search, filters, sort)
- [ ] Create `GET /app/api/items/batch/route.ts` - proxy for batch fetching items by IDs
- [ ] Create `GET /app/api/items/[id]/route.ts` - proxy for single item details
- [ ] All query parameters forwarded correctly
- [ ] Typecheck passes

---

### US-003: Create Suggestions API route
**Description:** As a user, I want to view trading suggestions without exposing backend URLs.

**Acceptance Criteria:**
- [ ] Create `GET /app/api/suggestions/route.ts` - proxy for fetching suggestions
- [ ] Typecheck passes

---

### US-004: Create Sync Status API route
**Description:** As a user, I want to see last sync timestamp without exposing backend URLs.

**Acceptance Criteria:**
- [ ] Create `GET /app/api/sync/status/route.ts` - proxy for sync status
- [ ] Typecheck passes

---

### US-005: Create Regime API routes
**Description:** As a user, I want to view and manage regime analysis without exposing backend URLs.

**Acceptance Criteria:**
- [ ] Create `GET /app/api/regime/segments/[itemId]/route.ts` - proxy for regime segments
- [ ] Create `GET /app/api/regime/thresholds/route.ts` - proxy for getting thresholds
- [ ] Create `PUT /app/api/regime/thresholds/route.ts` - proxy for updating thresholds
- [ ] Create `POST /app/api/regime/calibrate/route.ts` - proxy for auto-calibration
- [ ] Create `POST /app/api/regime/recalculate/route.ts` - proxy for recalculating segments
- [ ] Create `GET /app/api/regime/export/[itemId]/route.ts` - proxy for exporting data (JSON/CSV)
- [ ] Export route handles both JSON and CSV response types correctly
- [ ] Typecheck passes

---

### US-006: Update frontend API client
**Description:** As a developer, I need the frontend API client to call Next.js routes instead of the backend directly.

**Acceptance Criteria:**
- [ ] Update `/frontend/lib/api.ts` to use relative URLs (e.g., `/api/items` instead of `${NEXT_PUBLIC_API_URL}/api/items`)
- [ ] Remove `NEXT_PUBLIC_API_URL` usage from client-side code
- [ ] All existing hooks continue to work without modification
- [ ] Typecheck passes
- [ ] Verify items list loads in browser using dev-browser skill

---

### US-007: Update environment configuration
**Description:** As a developer, I need proper environment variable setup for the new architecture.

**Acceptance Criteria:**
- [ ] Add `API_URL` to `.env.example` with documentation
- [ ] Remove `NEXT_PUBLIC_API_URL` from environment files
- [ ] Update any documentation referencing the old variable
- [ ] Typecheck passes

---

### US-008: Verify all features work end-to-end
**Description:** As a user, I want all existing functionality to work exactly as before.

**Acceptance Criteria:**
- [ ] Items list loads with pagination
- [ ] Item search and filtering works
- [ ] Item detail modal opens and displays data
- [ ] Regime segments display correctly
- [ ] Regime threshold editing works
- [ ] Calibration and recalculation work
- [ ] Data export (JSON/CSV) downloads correctly
- [ ] Suggestions page loads
- [ ] Sync status displays and polls correctly
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: All Next.js API routes must forward cookies from the incoming request to the backend
- FR-2: All Next.js API routes must return the same response structure as the backend
- FR-3: API routes must forward all query parameters to the backend unchanged
- FR-4: API routes must handle and forward all HTTP methods (GET, POST, PUT, DELETE)
- FR-5: Error responses from the backend must be forwarded with appropriate status codes
- FR-6: The CSV export endpoint must stream the response with correct content-type headers
- FR-7: The frontend API client must use relative URLs only (no absolute backend URLs)
- FR-8: The `API_URL` environment variable must only be accessible server-side

## Non-Goals

- No caching layer implementation (can be added later)
- No rate limiting (can be added later)
- No request/response transformation (pure proxy)
- No additional authentication beyond passing through existing cookies
- No API versioning
- No request logging/monitoring (can be added later)

## Technical Considerations

### Next.js API Route Structure
```
/frontend/app/api/
├── items/
│   ├── route.ts              # GET /api/items
│   ├── batch/
│   │   └── route.ts          # GET /api/items/batch
│   └── [id]/
│       └── route.ts          # GET /api/items/:id
├── suggestions/
│   └── route.ts              # GET /api/suggestions
├── sync/
│   └── status/
│       └── route.ts          # GET /api/sync/status
└── regime/
    ├── segments/
    │   └── [itemId]/
    │       └── route.ts      # GET /api/regime/segments/:itemId
    ├── thresholds/
    │   └── route.ts          # GET, PUT /api/regime/thresholds
    ├── calibrate/
    │   └── route.ts          # POST /api/regime/calibrate
    ├── recalculate/
    │   └── route.ts          # POST /api/regime/recalculate
    └── export/
        └── [itemId]/
            └── route.ts      # GET /api/regime/export/:itemId
```

### Server-side API utility pattern
```typescript
// /frontend/lib/server-api.ts
const API_URL = process.env.API_URL // Server-only, not exposed to client

export async function serverFetch(
  endpoint: string,
  options: RequestInit & { cookies?: string }
) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Cookie: options.cookies || '',
      ...options.headers,
    },
  })
  return response
}
```

### Cookie forwarding pattern
```typescript
// In each route handler
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()

  const response = await serverFetch('/api/items', {
    cookies: cookieHeader,
  })

  return Response.json(await response.json())
}
```

### Environment Variables
- Remove: `NEXT_PUBLIC_API_URL` (client-exposed)
- Add: `API_URL` (server-only, e.g., `http://localhost:3333`)

## Success Metrics

- Backend URL (`localhost:3333` or production URL) does not appear in browser Network tab
- All existing functionality works identically to before migration
- No `NEXT_PUBLIC_API_URL` present in client JavaScript bundle
- Zero breaking changes to existing hooks and components

## Open Questions

- Should we add request timeout configuration to the proxy routes?
- Should we implement retry logic for failed backend requests?
- Should we add structured logging for debugging proxy issues?
