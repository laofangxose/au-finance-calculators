# Novated Lease MVP Roadmap

## Scope
- Product: Australia-focused financial calculators website.
- Current MVP target: Novated Lease Calculator.
- Delivery style: incremental milestones with verification at each step.

## Milestones
1. `M0` - Project Scaffold and Quality Baseline
2. `M1` - Novated Lease Core Calculation Engine
3. `M2` - Calculator UI, Shareable URL, Assumptions/Disclaimer
4. `M3` - De-demo and Productize App Surfaces
5. `M4` - Internal Beta Polish (i18n, theme, IA)
6. `M5` - Legal and Feedback Infrastructure
7. `M6` - Mobile Usability and Responsive Polish
8. `M7` - Loan Repayment Calculator (forward + reverse amortization)
9. `M7 Phase 2` - Offset/Extra, PI vs IO, Dual-axis chart

## Milestone Files
- `docs/roadmap/01-m0-scaffold-and-baseline.md`
- `docs/roadmap/02-m1-core-calculation-engine.md`
- `docs/roadmap/03-m2-ui-and-shareable-url.md`
- `docs/roadmap/04-m3-de-demo-productize.md`
- `docs/roadmap/05-m4-internal-beta-polish.md`
- `docs/roadmap/06-m5-legal-and-feedback-infrastructure.md`
- `docs/roadmap/07-m6-mobile-usability-and-responsive-polish.md`
- `docs/roadmap/08-m7-loan-repayment-calculator.md`
- `docs/roadmap/08-m7-loan-repayment-phase2-offset-extra-io-chart.md`

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
