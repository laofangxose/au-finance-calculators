# Novated Lease MVP Roadmap

## Scope
- Product: Australia-focused financial calculators website.
- Current MVP target: Novated Lease Calculator.
- Delivery style: incremental milestones with verification at each step.

## Milestones
1. `M0` - Project Scaffold and Quality Baseline
2. `M1` - Novated Lease Core Calculation Engine
3. `M2` - Calculator UI, Shareable URL, Assumptions/Disclaimer

## Milestone Files
- `docs/roadmap/01-m0-scaffold-and-baseline.md`
- `docs/roadmap/02-m1-core-calculation-engine.md`
- `docs/roadmap/03-m2-ui-and-shareable-url.md`

## Global Constraints
- Keep financial logic pure under `src/lib/calculators/novatedLease/**`.
- Keep financial rule tables/config in `src/data/**`.
- Avoid over-engineering and unnecessary dependencies.
- Run local verification per milestone:
  - `pnpm lint`
  - `pnpm test`
  - `pnpm build`

## Out of Scope (MVP)
- Authentication
- Backend APIs / database
- User accounts / saved scenarios
- Payments
- AWS deployment
