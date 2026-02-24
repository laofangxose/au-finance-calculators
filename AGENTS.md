# AGENTS.md

## 0. Purpose

This repository is a learning project to practice modern agentic AI coding workflow (Codex CLI).
Product: Australia-focused financial calculators website.
Current target calculator: Novated Lease Calculator.

The agent must prioritize:
- correctness + testability of financial logic
- incremental milestones with verification
- CI green at every merge to main

---

## 1. Scope (Current MVP)

### Must Have
- Frontend-only Next.js app (App Router) with TypeScript + pnpm
- Novated Lease calculator page with shareable URL (query params)
- Calculation logic implemented as pure functions with unit tests
- Basic UX: input validation, results display, assumptions/disclaimer

### Explicitly Out of Scope (for now)
- Authentication
- Backend APIs / database
- User accounts / saved scenarios
- Payments
- AWS deployment (can be added later, but not in MVP milestones)

---

## 2. Tech Stack

- Next.js (App Router)
- TypeScript (strict)
- pnpm
- Unit tests: Vitest (preferred) OR Jest (choose one and stick to it)
- Linting: ESLint (Next.js recommended)
- Formatting: Prettier (optional but recommended)

---

## 3. Architecture Rules

### 3.1 Directory Conventions
- UI routes/pages:
  - `src/app/**`
- Shared UI components:
  - `src/components/**`
- Calculation logic (MUST be pure):
  - `src/lib/calculators/novatedLease/**`
- Shared utilities:
  - `src/lib/**`
- Data tables / rule configs (NO hardcoding magic numbers in logic):
  - `src/data/**`

### 3.2 Purity Requirements for Financial Logic
All code under `src/lib/calculators/novatedLease/**` MUST:
- be deterministic pure functions
- have no I/O, no Date.now(), no randomness
- accept input objects and return output objects
- have no React/DOM dependencies
- contain no network calls

### 3.3 Separation of Concerns
- React components must NOT contain financial formulas.
- Any constants/tables (tax brackets, ATO residual defaults, FBT/ECM parameters) must be defined in `src/data/**` and imported.

---

## 4. Financial Assumptions & Disclaimers

- The calculator provides estimates only; not financial/tax/legal advice.
- All tax/FBT assumptions must be transparent in the UI (an “Assumptions” section).
- Any rule tables must be versioned (e.g., by FY) where relevant.

If uncertain about a rule:
- implement a configurable assumption with a clear label
- document it in `src/data/**` and mention it in UI assumptions
- add a unit test demonstrating the assumption

---

## 5. Testing Requirements

### 5.1 Unit Tests
- Every exported calculation function must have unit tests.
- Minimum test coverage for novated lease module: **10 meaningful cases**.
- Tests must cover:
  - ICE vehicle (non-EV) with ECM enabled
  - EV with FBT exemption toggle on
  - High income vs low income (different marginal rates)
  - Zero/low interest edge case
  - Short vs long term (1 year vs 5 year)
  - Residual default vs user override
  - Fees & running costs included
  - Validation errors (negative inputs / missing required fields)

### 5.2 Verification Commands (Must Pass Locally)
- `pnpm lint`
- `pnpm test`
- `pnpm build`

The agent must run these commands at the end of each milestone and fix failures.

---

## 6. CI Requirements (GitHub Actions)

### 6.1 CI Must Run On
- Pull requests to `main`
- Pushes to `main`

### 6.2 CI Steps (Minimum)
- checkout
- setup Node LTS
- enable pnpm
- install dependencies with lockfile
- run:
  - `pnpm lint`
  - `pnpm test`
  - `pnpm build`

### 6.3 CI Files
- CI workflow must live at:
  - `.github/workflows/ci.yml`

---

## 7. Git Workflow Rules

### 7.1 Branching
- Work should be done on feature branches:
  - `feature/<short-name>` (e.g., `feature/novated-ui`)
- `main` must remain green (CI passing).

### 7.2 Commits
- Commits must be atomic and meaningful.
- Each milestone must produce at least one commit.
- Commit message format:
  - `type(scope): description`
Examples:
- `chore(init): scaffold nextjs app`
- `feat(novated): add core lease payment calculation`
- `test(novated): cover ev fbt exemption scenarios`
- `ci: add github actions workflow`

### 7.3 Secrets
- Never commit `.env*`, credentials, API keys, or any secrets.
- `.env.example` is allowed (no real values).

---

## 8. Milestone Execution Rules (Agentic Workflow)

### 8.1 Plan-first
Before implementing major logic, the agent must:
- propose a milestone plan with deliverables
- propose file structure changes
- propose test plan
Then wait for human approval.

### 8.2 One Milestone At A Time
The agent must:
1. implement ONLY the current milestone scope
2. run verification commands
3. make a commit
4. stop and provide verification steps (exact commands + expected outputs)

### 8.3 No Over-engineering
- Avoid adding libraries unless necessary.
- Prefer simple code over abstractions.
- Any new dependency must be justified (why needed, alternatives considered).

---

## 9. Definition of Done (DoD)

A milestone is DONE only when:
- local verification commands pass (`lint/test/build`)
- CI workflow exists (once introduced) and passes on PR
- no TypeScript errors
- no unused imports/vars
- user-facing assumptions/disclaimer present where needed

---

## 10. Future Expansion (Not Now)

Potential later phases:
- Backend API for saved scenarios
- AWS deployment (App Runner/ECS) + RDS
- Scenario sharing via short links
- More calculators

---

## 11. Decision Awareness

Before implementing major changes, the agent MUST read:

docs/DECISIONS.md

If a proposed change conflicts with an existing decision,
the agent must:
- explicitly point out the conflict
- ask for human confirmation before proceeding