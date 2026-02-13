## 1. Main Modules and Responsibilities

### Product Operations (core business)
- Purpose: maintain product catalog (price, cost, margin, status, POS availability, tags).
- Main places:
  - `supabase/migrations/20250212000000_initial_schema.sql`
  - `frontend/src/pages/Products.tsx`

### Odoo Synchronization (ERP bridge)
- Purpose: keep Supabase and Odoo aligned in both directions.
- Main places:
  - Pull from Odoo: `supabase/functions/odoo-sync-pull/index.ts`
  - Push to Odoo: `supabase/functions/odoo-sync-push/index.ts`
  - Odoo API client: `supabase/functions/_shared/odoo-client.ts`

### Analytics and Dashboard
- Purpose: provide business KPIs (active products, pending sync, margins, quality issues).
- Main places:
  - Precomputed DB view logic: `supabase/migrations/20250212000000_initial_schema.sql` (`dashboard_stats` view)
  - API endpoint: `supabase/functions/dashboard-stats/index.ts`
  - UI: `frontend/src/pages/Dashboard.tsx`, `frontend/src/pages/Analytics.tsx`

### Classification Model (categories + tags)
- Purpose: product segmentation for operations and reporting.
- Main places:
  - Schema and relationships: `supabase/migrations/20250212000000_initial_schema.sql`
  - Tag seeds: `supabase/migrations/20250212000001_seed_tags.sql`
  - UI: `frontend/src/pages/Categories.tsx`, `frontend/src/pages/Tags.tsx`

### Shared Backend Infrastructure
- Purpose: common DB access, config, logging, response handling.
- Main places:
  - `supabase/functions/_shared/database.ts`
  - `supabase/functions/_shared/utils.ts`
  - `supabase/functions/_shared/types.ts`

---

## 2. End-to-End Data Flow (Input → Processing → Output)

### A) Odoo → Platform (full pull sync)
1. Input: manual trigger to `odoo-sync-pull` edge function.
2. Processing:
   - Reads Odoo config from `config`.
   - Calls Odoo JSON-RPC for taxes, categories, POS categories, products.
   - Clears and repopulates tables; maps tags into `product_tags`.
   - Updates sync metadata and writes `sync_log`.
3. Output:
   - Updated Supabase tables/views (`products`, `categories`, `tags`, `products_full`, `dashboard_stats`).
   - Frontend reads fresh data directly from Supabase.

### B) User edits in UI → Odoo (push sync)
1. Input: user edits product fields in `Products` page.
2. Processing:
   - Frontend updates `products` table.
   - DB trigger marks product as `modified=true`, `sync_status='PENDING'`, logs into `pending_changes`.
   - `odoo-sync-push` sends only pending products to Odoo and updates sync status per product.
3. Output:
   - Odoo product updated.
   - Local product status becomes `SYNCED` or `ERROR`.
   - Sync operation recorded in `sync_log`.

### C) Analytics flow
1. Input: dashboard/analytics page load.
2. Processing: reads `dashboard_stats` and `products_full`.
3. Output: KPI cards, margin distribution, category distribution, pending-sync indicators.

---

## 3. External Integrations

### Databases
- Supabase PostgreSQL (primary system of record).

### APIs
- Odoo 19 JSON-RPC API via `OdooClient` (`/jsonrpc`).

### Auth/Security platform
- Supabase Auth + RLS are configured at DB level (policies currently permissive for authenticated users).

### Files/Storage
- Supabase Storage is referenced for product images (`image_url`), with bucket setup documented in README.

### Queues/Schedulers
- No queue system found.
- No built-in scheduler/cron implementation found in repo (sync appears manual-triggered).

---

## 4. Where Business Logic Lives

### Strongest business rules
- `supabase/migrations/20250212000000_initial_schema.sql`
  - Margin calculations (generated columns)
  - Change tracking triggers
  - Sync-status transitions
  - Aggregated business views (`products_full`, `dashboard_stats`)

### Integration business rules
- `supabase/functions/odoo-sync-pull/index.ts`
- `supabase/functions/odoo-sync-push/index.ts`
- `supabase/functions/_shared/odoo-client.ts`

### UI-side business behavior (secondary logic)
- Filtering/sorting/bulk actions in `frontend/src/pages/Products.tsx`
- Derived analytics in `frontend/src/pages/Analytics.tsx`

---

## 5. Entry Points

### Runtime entry points
- Frontend app bootstrap: `frontend/src/main.tsx`
- Frontend routing shell: `frontend/src/App.tsx`

### API handlers (Edge Functions)
- `supabase/functions/odoo-test-connection/index.ts`
- `supabase/functions/odoo-sync-pull/index.ts`
- `supabase/functions/odoo-sync-push/index.ts`
- `supabase/functions/dashboard-stats/index.ts`

### Operational scripts
- `test-functions.sh`
- `test-odoo-connection.js`
- `test-odoo-direct.sh`

---

## 6. High-Coupling Files (impact many parts)

- `supabase/migrations/20250212000000_initial_schema.sql`  
  Central contract for tables, views, triggers, RLS, sync behavior.
- `supabase/functions/_shared/database.ts`  
  Shared by all edge functions for config/logging/data access.
- `supabase/functions/_shared/odoo-client.ts`  
  Single integration adapter to ERP; affects all sync operations.
- `supabase/functions/odoo-sync-pull/index.ts`  
  Broad write impact across multiple master tables.
- `supabase/functions/odoo-sync-push/index.ts`  
  Critical for outbound data integrity to Odoo.
- `frontend/src/types/database.ts`  
  Frontend data contract; tightly coupled to DB/Edge response shapes.
- `frontend/src/pages/Sync.tsx`  
  Coupled to both `sync_log` schema and edge-function response formats.

---

## 7. Potential Risk Areas if Refactored

- **Schema-contract drift across layers**: frontend expects `sync_log` fields (`started_at`, `operation`, etc.) that do not match migration schema (`timestamp`, `direction`, etc.).  
  Relevant: `frontend/src/pages/Sync.tsx`, `frontend/src/types/database.ts`, `supabase/migrations/20250212000000_initial_schema.sql`.

- **API-response contract mismatch**: Sync UI expects payload keys (`summary`, `updated`) different from edge-function responses (`counts`, `successCount`).  
  Relevant: `frontend/src/pages/Sync.tsx`, `supabase/functions/odoo-sync-pull/index.ts`, `supabase/functions/odoo-sync-push/index.ts`.

- **Identifier-model mismatch risk**: some frontend logic mixes internal IDs and Odoo IDs (category tree/filter logic), which can silently break filtering/hierarchy behavior.  
  Relevant: `frontend/src/pages/Categories.tsx`, `frontend/src/pages/Products.tsx`, schema in `supabase/migrations/20250212000000_initial_schema.sql`.

- **Destructive pull sync behavior**: pull flow clears full tables before reinserting; interruptions can leave partial state.  
  Relevant: `supabase/functions/odoo-sync-pull/index.ts`, `supabase/functions/_shared/database.ts`.

- **Business rules split between DB + frontend**: margins/status logic mostly DB-driven, but analytics/filter logic duplicated in UI; changes need coordinated updates in both layers.
