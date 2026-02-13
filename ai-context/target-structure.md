# Target Structure

## Proposed Folder Tree

```text
supabasecarni/
├─ ai-context/
│  ├─ ai-context.md
│  ├─ business-logic-review.md
│  └─ target-structure.md
├─ supabase/
│  ├─ domain/
│  │  ├─ migrations/
│  │  │  ├─ 20250212000000_initial_schema.sql
│  │  │  └─ 20250212000001_seed_tags.sql
│  │  ├─ schema/
│  │  │  ├─ entities.ts
│  │  │  ├─ value-objects.ts
│  │  │  └─ enums.ts
│  │  ├─ logic/
│  │  │  ├─ product/
│  │  │  │  ├─ pricing.ts
│  │  │  │  ├─ sync-status.ts
│  │  │  │  └─ tags.ts
│  │  │  └─ analytics/
│  │  │     └─ kpis.ts
│  │  └─ contracts/
│  │     ├─ sync.ts
│  │     └─ dashboard.ts
│  ├─ application/
│  │  ├─ services/
│  │  │  ├─ sync/
│  │  │  │  ├─ pull-service.ts
│  │  │  │  ├─ push-service.ts
│  │  │  │  └─ connection-service.ts
│  │  │  ├─ dashboard/
│  │  │  │  └─ dashboard-service.ts
│  │  │  └─ logging/
│  │  │     └─ sync-log-service.ts
│  │  ├─ validation/
│  │  │  ├─ config-validation.ts
│  │  │  └─ request-validation.ts
│  │  └─ mappers/
│  │     ├─ product-mapper.ts
│  │     └─ tag-mapper.ts
│  ├─ integrations/
│  │  ├─ odoo/
│  │  │  ├─ client.ts
│  │  │  ├─ models.ts
│  │  │  ├─ mapper.ts
│  │  │  └─ transport.ts
│  │  └─ supabase/
│  │     ├─ client.ts
│  │     └─ repositories/
│  │        ├─ products-repo.ts
│  │        ├─ categories-repo.ts
│  │        ├─ tags-repo.ts
│  │        ├─ config-repo.ts
│  │        └─ sync-log-repo.ts
│  ├─ functions/
│  │  ├─ _shared/
│  │  │  ├─ http/
│  │  │  │  ├─ response.ts
│  │  │  │  └─ cors.ts
│  │  │  ├─ infra/
│  │  │  │  └─ env.ts
│  │  │  └─ utils/
│  │  │     ├─ common/
│  │  │     │  ├─ array.ts
│  │  │     │  ├─ date.ts
│  │  │     │  ├─ async.ts
│  │  │     │  └─ logging.ts
│  │  │     └─ domain/
│  │  │        ├─ tags.ts
│  │  │        └─ pricing.ts
│  │  ├─ odoo-sync-pull/
│  │  │  └─ index.ts
│  │  ├─ odoo-sync-push/
│  │  │  └─ index.ts
│  │  ├─ odoo-test-connection/
│  │  │  └─ index.ts
│  │  └─ dashboard-stats/
│  │     └─ index.ts
│  └─ tests/
│     ├─ application/
│     ├─ domain/
│     └─ integrations/
├─ frontend/
│  └─ src/
│     ├─ app/
│     │  ├─ routes.tsx
│     │  └─ providers.tsx
│     ├─ presentation/
│     │  ├─ pages/
│     │  ├─ components/
│     │  ├─ hooks/
│     │  └─ styles/
│     ├─ client/
│     │  ├─ supabase/
│     │  │  ├─ browser-client.ts
│     │  │  └─ api.ts
│     │  └─ dto/
│     │     ├─ products.ts
│     │     ├─ dashboard.ts
│     │     └─ sync.ts
│     └─ state/
│        └─ ui/
│           └─ app-store.ts
└─ scripts/
   ├─ test-functions.sh
   ├─ test-odoo-direct.sh
   └─ test-odoo-connection.js
```

## Mapping: Current Paths -> New Paths

| Current path | New path |
|---|---|
| `supabase/migrations/20250212000000_initial_schema.sql` | `supabase/domain/migrations/20250212000000_initial_schema.sql` |
| `supabase/migrations/20250212000001_seed_tags.sql` | `supabase/domain/migrations/20250212000001_seed_tags.sql` |
| `supabase/functions/_shared/odoo-client.ts` | `supabase/integrations/odoo/client.ts` |
| `supabase/functions/_shared/database.ts` | `supabase/integrations/supabase/repositories/*` + `supabase/integrations/supabase/client.ts` |
| `supabase/functions/_shared/types.ts` | Split to `supabase/domain/contracts/*.ts` and `supabase/integrations/odoo/models.ts` |
| `supabase/functions/_shared/utils.ts` | Split to `supabase/functions/_shared/utils/common/*` and `supabase/functions/_shared/utils/domain/*` |
| `supabase/functions/odoo-sync-pull/index.ts` | Handler stays in place; orchestration moves to `supabase/application/services/sync/pull-service.ts` |
| `supabase/functions/odoo-sync-push/index.ts` | Handler stays in place; orchestration moves to `supabase/application/services/sync/push-service.ts` |
| `supabase/functions/odoo-test-connection/index.ts` | Handler stays in place; logic moves to `supabase/application/services/sync/connection-service.ts` |
| `supabase/functions/dashboard-stats/index.ts` | Handler stays in place; logic moves to `supabase/application/services/dashboard/dashboard-service.ts` |
| `frontend/src/lib/supabase.ts` | `frontend/src/client/supabase/browser-client.ts` |
| `frontend/src/types/database.ts` | `frontend/src/client/dto/*.ts` |
| `frontend/src/store/appStore.ts` | `frontend/src/state/ui/app-store.ts` |
| `frontend/src/pages/*.tsx` | `frontend/src/presentation/pages/*.tsx` |
| `frontend/src/components/layout/*.tsx` | `frontend/src/presentation/components/layout/*.tsx` |
| `frontend/src/styles/*` and page css files | `frontend/src/presentation/styles/*` |
| `test-functions.sh` | `scripts/test-functions.sh` |
| `test-odoo-direct.sh` | `scripts/test-odoo-direct.sh` |
| `test-odoo-connection.js` | `scripts/test-odoo-connection.js` |

## What Should NOT Be Moved

- `supabase/functions/<function-name>/index.ts` entrypoint files.
Reason: Supabase edge function deployment expects this folder + filename convention.

- SQL migration filenames and ordering semantics.
Reason: migration history and deployment order depend on deterministic names.

- Frontend boot entry `frontend/src/main.tsx`.
Reason: Vite entry wiring expects this unless build config is also changed.

- Top-level operational docs (`README.md`, `TESTING.md`, `ODOO_TROUBLESHOOTING.md`, `MIGRATION_STATUS.md`).
Reason: stable navigation and onboarding references.

## Minimal Refactor Strategy (No Behavior Change)

1. Create new folders and copy (not rewrite) shared code into target locations.
2. Keep each edge `index.ts` as thin adapters; replace in-file logic with calls to new application services.
3. Extract Odoo client and Supabase repository access behind integration modules; keep function signatures equivalent.
4. Split `utils.ts` by moving only pure helpers first (array/date/async/logging) and re-export from old path temporarily.
5. Isolate domain helpers (`parseTags`, pricing helpers, sync status helpers) into domain utility files and import from services.
6. Move frontend files into `presentation` and `client` folders with barrel exports to preserve import ergonomics.
7. Preserve all request/response payload shapes and DB writes exactly; run existing function tests unchanged.
8. After imports are stable, remove transitional re-exports in a final cleanup pass.

## AI Navigation Notes

- Single source of truth for business rules: `supabase/domain/*`.
- All external I/O boundaries: `supabase/integrations/*`.
- All use-case orchestration: `supabase/application/services/*`.
- Edge handlers remain shallow and predictable for agents.
- Frontend restricted to rendering + interaction state; no domain calculations.
