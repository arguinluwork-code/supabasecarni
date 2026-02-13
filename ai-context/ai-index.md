# AI Index

## System Map
- `supabase/domain`: domain source of truth (schema and domain-level contracts/helpers).
- `supabase/application/services`: use-case orchestration (sync pull/push, connection test, dashboard service).
- `supabase/integrations`: external I/O adapters (Odoo client + Supabase repositories).
- `supabase/functions`: edge entrypoints and HTTP transport wrappers.
- `frontend/src`: presentation and client DTO consumption.

## Key Modules And Responsibilities
- `supabase/functions/odoo-sync-pull`: HTTP entrypoint for inbound ERP sync.
- `supabase/functions/odoo-sync-push`: HTTP entrypoint for outbound ERP sync.
- `supabase/functions/odoo-test-connection`: HTTP entrypoint for Odoo connectivity check.
- `supabase/functions/dashboard-stats`: HTTP entrypoint for dashboard aggregate payload.
- `supabase/application/services/sync/*-service.ts`: orchestration of sync flows and status/log lifecycle.
- `supabase/integrations/odoo/client.ts`: JSON-RPC transport and Odoo model operations.
- `supabase/integrations/supabase/repositories/*.ts`: raw data access (select/insert/update/delete).

## Domain Logic Location
- DB schema and constraints: `supabase/migrations/20250212000000_initial_schema.sql`.
- Main domain views used by UI:
  - `products_full`
  - `dashboard_stats`
- Domain helper modules:
  - `supabase/domain/logic/product/*`
  - `supabase/domain/contracts/*`

## Application Services Location
- `supabase/application/services/sync/pull-service.ts`
- `supabase/application/services/sync/push-service.ts`
- `supabase/application/services/sync/connection-service.ts`
- `supabase/application/services/dashboard/dashboard-service.ts`

## Integrations Location
- Odoo integration: `supabase/integrations/odoo/*`
- Supabase integration:
  - client: `supabase/integrations/supabase/client.ts`
  - repositories: `supabase/integrations/supabase/repositories/*`

## Edge Function Entrypoints
- `supabase/functions/odoo-sync-pull/index.ts`
- `supabase/functions/odoo-sync-push/index.ts`
- `supabase/functions/odoo-test-connection/index.ts`
- `supabase/functions/dashboard-stats/index.ts`

## Canonical API Contracts
- Envelope (all edge handlers): `ApiResponse<T>` in `supabase/functions/_shared/types.ts`
  - `success: boolean`
  - `data?: T`
  - `error?: string`
  - `message?: string`
- Pull payload: `SyncPullResponse`
  - `elapsed: number`
  - `counts: { taxes, categories, posCategories, products }`
  - `message: string`
- Push payload: `SyncPushResponse`
  - `successCount: number`
  - `errorCount: number`
  - `message: string`
- Dashboard payload: `DashboardStats`
  - `total_products, active_products, pos_products, without_category, without_price, without_barcode, negative_margin, pending_sync, avg_margin, avg_margin_percent, min_price, max_price`
- Sync log row shape: `SyncLog`
  - `timestamp, direction, type, records_affected, status, message, error_details`
