# M2 - Calculator UI, Shareable URL, Assumptions/Disclaimer

## Objective
Deliver a usable Novated Lease calculator page that connects UI inputs to pure logic and supports scenario sharing via query parameters.

## Deliverables
- Calculator route/page in `src/app/**`.
- Form inputs with validation feedback and results presentation.
- Query-param serialization/deserialization for shareable scenarios.
- Visible assumptions section and estimate-only disclaimer in UI.

## Planned File Structure
- Route:
  - `src/app/novated-lease/page.tsx`
- Components:
  - `src/components/novatedLease/*`
- URL/state helpers:
  - `src/lib/urlScenario.ts`

## Test Plan
- Unit tests for query param encode/decode helpers.
- Component tests for:
  - input validation behavior
  - rendering of key result values
  - assumptions/disclaimer visibility
- Ensure formula logic remains outside React components.

## Verification Plan
- Execute:
  - `pnpm lint`
  - `pnpm test`
  - `pnpm build`
- Confirm:
  - page works with default state and shared URL state
  - assumptions and disclaimer are user-visible

## Exit Criteria
- Users can input a scenario, view estimate outputs, and share scenario links.
- UI respects architecture boundaries (no embedded financial formulas).
- MVP requirements for novated lease calculator are met.
