# M1 - Novated Lease Core Calculation Engine

## Objective
Implement deterministic, testable novated lease financial logic and data tables, fully separated from UI concerns.

## Deliverables
- Pure calculation functions under `src/lib/calculators/novatedLease/**`.
- Input validation and structured error handling for invalid scenarios.
- Rule/config tables in `src/data/**` (tax brackets, residual defaults, FBT/ECM assumptions).
- Clear assumption labels for any uncertain or configurable rule.

## Planned File Structure
- Calculator logic:
  - `src/lib/calculators/novatedLease/types.ts`
  - `src/lib/calculators/novatedLease/validate.ts`
  - `src/lib/calculators/novatedLease/calculateNovatedLease.ts`
- Data tables:
  - `src/data/tax/**`
  - `src/data/novatedLease/**`
- Tests:
  - `src/lib/calculators/novatedLease/*.test.ts`

## Test Plan (Minimum 10 Meaningful Cases)
- ICE vehicle (non-EV) with ECM enabled.
- EV with FBT exemption toggle on.
- High income vs low income scenarios.
- Zero/low interest edge case.
- Short vs long term (1 year vs 5 year).
- Residual default vs user override.
- Fees and running costs included.
- Validation errors for negative and missing required inputs.
- Coverage for every exported calculation function.

## Verification Plan
- Execute:
  - `pnpm lint`
  - `pnpm test`
  - `pnpm build`
- Confirm:
  - all calculation modules are pure (no I/O, no time/randomness, no React/DOM)
  - all exported functions are unit-tested

## Exit Criteria
- Core engine is reliable, deterministic, and independently testable.
- Data-driven assumptions are explicit and versionable.
- Test suite demonstrates required novated lease coverage.
