# M3 — De-demo / Productize

## Goal
Remove demo/training artifacts so the site presents as a real product, keeping only Novated Lease and reusable framework code.

## Scope

### Remove demo user-facing artifacts
- Route: `/calculators/simple-interest`
  - `src/app/calculators/simple-interest/page.tsx`
- Homepage demo copy/CTA
  - `src/app/page.tsx`
  - `src/app/page.module.css` (cleanup unused demo styles)
- Calculators index demo copy/card
  - `src/app/calculators/page.tsx`
- Product metadata wording "prototype(s)"
  - `src/app/layout.tsx`

### Remove demo code artifacts
- `src/lib/calculators/simpleInterest.ts`
- `src/lib/calculators/simpleInterest.test.ts`
- `src/components/simpleInterest/SimpleInterestCalculator.tsx`
- `src/components/simpleInterest/SimpleInterestForm.tsx`
- `src/components/simpleInterest/SimpleInterestResults.tsx`
- `src/components/simpleInterest/SimpleInterestCalculator.module.css`
- `src/test/smoke.test.js` (replace/remove M0 training smoke test)

### Keep
- Reusable framework:
  - `src/components/calculator/CalculatorPage.tsx`
  - `src/components/calculator/CalculatorPage.module.css`
  - `src/lib/urlState/useQueryState.ts`
  - `src/lib/urlState/queryParams.ts`
- Novated Lease product surfaces and logic:
  - `src/app/calculators/novated-lease/page.tsx`
  - `src/components/novatedLease/**`
  - `src/lib/calculators/novatedLease/**`
  - `src/lib/ui/fieldMeta/novatedLease.ts`
  - `src/content/glossary.ts`
  - `src/data/au/**`

## New Production IA

### `/` Homepage
- Title: **Novated Lease Calculator**
- Primary CTA: **Start Calculator** -> `/calculators/novated-lease`
- No demo/prototype wording.

### `/calculators` (optional index, keep)
- List only real calculators.
- Currently only:
  - Novated Lease

### Primary route
- `/calculators/novated-lease` is the core product entry.

## Implementation Steps
1. Update `src/app/page.tsx` copy/CTAs to production wording.
2. Remove unused homepage demo styles in `src/app/page.module.css`.
3. Update `src/app/calculators/page.tsx` to remove demo card/copy.
4. Delete `src/app/calculators/simple-interest/page.tsx`.
5. Delete `src/components/simpleInterest/**`.
6. Delete `src/lib/calculators/simpleInterest.ts`.
7. Delete `src/lib/calculators/simpleInterest.test.ts`.
8. Remove or replace `src/test/smoke.test.js` with product-relevant smoke coverage.
9. Update metadata description in `src/app/layout.tsx`.
10. Run text sweep for demo wording and remove remaining user-facing occurrences.

## Verification
- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `rg -n "simple-interest|Demo|demo|prototype|prototypes|placeholder|coming soon" src/app src/components src/lib README.md`
- `git diff --stat`

## Acceptance Criteria
- No links or routes to `/calculators/simple-interest` remain.
- No user-facing demo/prototype wording in app UI.
- Only Novated Lease appears in product IA surfaces.
- Lint/test/build pass.
