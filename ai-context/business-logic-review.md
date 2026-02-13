# Business Logic Review

## Scope
Most relevant files and folders containing pricing rules, validations, state transitions, calculations, or domain decisions.

## Folders

| Path | Why it contains business logic (business terms) | Clean placement |
|---|---|---|
| `supabase/migrations` | Defines core business rules at data level: margin calculation, valid sync states, change-tracking behavior, KPI views, and audit semantics. | `/domain` |
| `supabase/functions/odoo-sync-pull` | Implements inbound synchronization workflow from ERP, including what data is authoritative and how it is transformed into local catalog records. | `/services` |
| `supabase/functions/odoo-sync-push` | Implements outbound synchronization workflow, deciding when local product changes are eligible to be sent and how sync outcomes are recorded. | `/services` |
| `frontend/src/pages` | Contains user-facing domain decisions (product filtering, margin grouping, sync eligibility cues) currently executed in UI layer. | `/domain` |

## Files

| Path | Why it contains business logic (business terms) | Clean placement |
|---|---|---|
| `supabase/migrations/20250212000000_initial_schema.sql` | Central source of product economics and lifecycle rules: price/cost margin formulas, allowed sync statuses, automatic transition to pending on edits, audit trail creation, and dashboard KPI definitions. | `/domain` |
| `supabase/migrations/20250212000001_seed_tags.sql` | Encodes default business taxonomy (commercial profile, conservation, department, etc.) used to classify products. | `/domain` |
| `supabase/functions/odoo-sync-pull/index.ts` | Applies business sync policy for full refresh (taxes/categories/products), tag parsing, and local status normalization after import. | `/services` |
| `supabase/functions/odoo-sync-push/index.ts` | Applies business sync policy for pending product updates, success/error state transitions, and Odoo payload construction (prices, availability, tags). | `/services` |
| `supabase/functions/_shared/database.ts` | Enforces operational validation needed for business continuity (required Odoo config) and standardized sync event logging used by operations. | `/services` |
| `supabase/functions/_shared/odoo-client.ts` | Encapsulates ERP interaction semantics that affect domain behavior (many2one/many2many formatting, read/write contract with Odoo). | `/services` |
| `supabase/functions/_shared/utils.ts` | Includes domain-relevant normalization helpers (tag string parsing/joining, margin-percent helper), even though the file is mixed with generic utilities. | `/domain` |
| `frontend/src/pages/Products.tsx` | Contains product management rules used by business users: search/filter criteria, margin-based filtering, batch update decisions, and local pending-sync marking after edits. | `/domain` |
| `frontend/src/pages/Analytics.tsx` | Defines reporting decisions: margin buckets, top/bottom margin ranking, and status distribution calculations used for business monitoring. | `/domain` |
| `frontend/src/pages/Sync.tsx` | Encodes operational sync flow decisions in UI: when push is allowed, how pending changes are surfaced, and how sync outcomes are interpreted for users. | `/services` |
