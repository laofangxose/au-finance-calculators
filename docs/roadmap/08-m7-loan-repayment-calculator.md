# M7: Loan Repayment Calculator

## Goal
Add a Loan Repayment Calculator with two user modes:
- Forward mode: principal -> periodic repayment + amortization schedule
- Reverse mode: periodic repayment -> estimated borrowing capacity

This milestone is a new calculator surface and pure engine module.

## Scope
- New calculator route: `/calculators/loan-repayment` (canonical)
- Home selector card for Loan Repayment (available)
- Pure amortization engine under `src/lib/calculators/loanRepayment/**`
- URL query sync and restore for all loan inputs
- Interactive balance chart (remaining balance over time)
- Amortization schedule table (first N rows with expand)
- i18n support for EN and ZH

## Non-Goals
- No offset/redraw facilities
- No fees, insurance, tax, or other add-ons
- No variable interest rates
- No backend persistence
- No analytics/ad integration changes

## Data Model and Pure Function API
- `LoanRepaymentFrequency`: `weekly | fortnightly | monthly | yearly`
- `LoanRepaymentMode`: `forward | reverse`
- Forward input:
  - `principal`
  - `annualInterestRatePct`
  - `termYears`
  - `frequency`
- Reverse input:
  - `paymentPerPeriod`
  - `annualInterestRatePct`
  - `termYears`
  - `frequency`
- Core outputs:
  - `paymentPerPeriod` (forward)
  - `estimatedPrincipal` (reverse)
  - `schedule[]`: period/payment/interest/principal/remainingBalance/totalInterestToDate
  - summary: totalPaid, totalInterest, numberOfPayments

Pure API sketch:
- `calculateAmortization(input) -> LoanRepaymentResult`
- `solvePrincipalFromPayment(input) -> LoanRepaymentResult`

## URL Param Schema
- `m`: mode (`forward`/`reverse`)
- `p`: principal
- `pm`: payment per period
- `r`: annual interest rate (%)
- `y`: term years
- `f`: frequency (`weekly|fortnightly|monthly|yearly`)

Defaults are omitted from URL via existing query-state helper behavior.

## i18n Namespaces
- `home.card.loanRepayment.*`
- `loanRepayment.*`
  - `pageTitle`, `description`
  - `mode.*`
  - `fields.*`
  - `outputs.*`
  - `summary.*`
  - `schedule.*`
  - `chart.*`
  - `validation.*`

## Rounding and Numerical Approach
- Internal amortization calculations in decimal numbers with per-period currency rounding.
- Final period adjusts principal/payment to avoid negative remaining balance.
- Special handling for `0%` rate:
  - forward: `payment = principal / n`
  - reverse: `principal = payment * n`

## Definition of Done
- Route `/calculators/loan-repayment` implemented and reachable from home.
- Forward and reverse modes work with URL sync/restore.
- Pure engine module + unit tests implemented.
- Interactive balance chart implemented and responsive.
- Schedule table supports first N rows + expand.
- EN/ZH translation coverage for new UI.
- `pnpm lint`, `pnpm test`, `pnpm build` pass.

## Risks and Mitigations
- Precision/rounding drift:
  - enforce per-period currency rounding and final payment adjustment.
- Zero/near-zero interest:
  - explicit branch for zero-rate formulas.
- Frequency conversions:
  - centralized payments-per-year mapping.
- Chart performance for long schedules:
  - optional point downsampling for chart rendering only.
- URL sync regression:
  - keep existing query-state hook; only add local keys/defaults.
