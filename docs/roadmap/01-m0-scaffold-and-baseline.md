# M0 - Project Scaffold and Quality Baseline

## Objective
Establish a clean, verifiable Next.js + TypeScript + pnpm baseline so all later milestones can ship with CI-green confidence.

## Deliverables
- Next.js App Router scaffold with strict TypeScript.
- Linting configured with Next.js recommended ESLint setup.
- Test framework chosen and configured (Vitest preferred).
- Basic project scripts wired for lint/test/build.

## Planned File Structure
- Root:
  - `package.json`
  - `pnpm-lock.yaml`
  - `tsconfig.json`
  - `next.config.*`
- App:
  - `src/app/layout.tsx`
  - `src/app/page.tsx`
- Tests:
  - `vitest.config.ts` (or Jest equivalent)
  - test setup file if needed

## Verification Plan
- Execute:
  - `pnpm lint`
  - `pnpm test`
  - `pnpm build`
- Confirm:
  - no TypeScript errors
  - no unused imports/variables
  - commands pass locally and in CI

## Exit Criteria
- Project scaffolding is complete and runnable.
- CI workflow succeeds on branch and PR runs.
- Baseline is ready for pure financial logic implementation in M1.
