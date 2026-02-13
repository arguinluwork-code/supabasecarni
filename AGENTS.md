# AGENTS

## Architecture Rules
- DB is the domain source of truth: schema, constraints, and canonical persisted state live in Supabase migrations/views.
- `supabase/application/services` owns orchestration and workflow sequencing.
- `supabase/integrations` owns all external I/O (Supabase repositories, Odoo API/transport).
- `frontend` is presentation only: render backend/domain-provided values, avoid domain decisions in UI.

## Where Business Rules Go
- Put durable business rules in DB/domain:
  - constraints, computed fields, canonical naming, status semantics.
- Put process coordination in application services:
  - flow order, retries, sync lifecycle transitions, operation-level logging.
- Keep integrations mechanical:
  - data retrieval/storage and protocol adaptation only.

## Contract-First Guideline
- Define/update response and DTO contracts first.
- Keep one canonical field name per concept across DB/view -> edge response -> frontend DTO.
- Map at boundaries (repository/service/handler), never in multiple UI components.
- If a contract changes, update:
  1. edge response serializer
  2. frontend DTO/type
  3. affected pages/hooks
  in the same change set.

## Naming Conventions
- Services: `<usecase>-service.ts` (examples: `pull-service.ts`, `push-service.ts`).
- Repositories: `<entity>-repo.ts` (examples: `products-repo.ts`, `sync-log-repo.ts`).
- Integration clients/transports: `client.ts`, `transport.ts`, `mapper.ts`.
- Domain helpers: small, explicit modules under `supabase/domain/logic/<area>/`.

## Adding A New Feature (Recommended Flow)
1. Define/confirm contract and canonical field names (DB/view + API + DTO).
2. Add/extend repository calls in `supabase/integrations/supabase/repositories`.
3. Implement orchestration in `supabase/application/services/<area>`.
4. Keep edge function `index.ts` thin: parse request, call service, return envelope.
5. Expose data to frontend through DTOs; keep page logic presentational.
6. Validate end-to-end contract alignment (no duplicated mapping logic).

## Guardrails For Agents
- Do not place new raw SQL/data-access inside edge handlers.
- Do not place domain calculations in frontend pages/components.
- Prefer importing from layer-owned modules directly; avoid temporary compatibility paths.
- Preserve entrypoint file locations under `supabase/functions/<fn>/index.ts`.
