# M7 Phase 2: Loan Repayment Enhancements

## Goal
Extend the loan repayment calculator with:
- Offset balance support
- Constant extra repayment support
- Repayment type selector (`PI` vs `IO`)
- Dual-axis chart replacing the amortization table
- Cleanup of legacy simple-interest placeholder surfaces

## Scope
- Pure engine updates under `src/lib/calculators/loanRepayment/**`
- UI updates under `src/components/loanRepayment/**`
- URL query-state extension for new inputs
- i18n updates in EN/ZH
- Home selector cleanup (remove simple-interest/interest-rate placeholder)

## Reverse Mode Decision
- Decision: **Option A** (MVP)
- Reverse mode supports **PI only**
- If user selects `IO` in reverse mode, engine returns a typed validation issue and UI shows localized guidance.
- Rationale:
  - Keeps reverse behavior deterministic and easy to explain.
  - Avoids ambiguous IO borrowing-capacity assumptions with offset and extra settings.
  - Keeps implementation robust without introducing opaque solver assumptions.

## Math Spec

### Shared Definitions
- `n = termYears * paymentsPerYear(frequency)` (rounded to nearest integer, minimum 1)
- `r = annualInterestRatePct / 100 / paymentsPerYear(frequency)`
- `effectiveBalanceForInterest = max(0, remainingBalance - offsetBalance)`
- `interest = effectiveBalanceForInterest * r` (rounded per period to cents)

### PI (Principal + Interest)
- `scheduledPayment`:
  - Forward mode: standard amortized payment from principal/rate/term/frequency
  - Reverse mode: user-provided base payment input
- `totalPayment = scheduledPayment + extraPaymentPerPeriod`
- `principalPaid = totalPayment - interest`
- If `principalPaid <= 0`, return typed error (`payment too low / negative amortization`).
- `remainingBalance -= min(principalPaid, remainingBalance)`
- Stop early when `remainingBalance == 0`.

### IO (Interest Only)
- `scheduledPayment = interest` each period
- `totalPayment = scheduledPayment + extraPaymentPerPeriod`
- `principalPaid = max(0, totalPayment - interest)` (effectively the extra repayment)
- `remainingBalance -= min(principalPaid, remainingBalance)`
- Schedule runs `n` periods unless principal reaches 0 early via extra repayments.

## Edge Cases
- `offsetBalance > remainingBalance`:
  - interest becomes `0` for that period.
- `0% rate`:
  - PI forward uses linear principal repayment for scheduled payment.
  - IO scheduled payment is `0`; only extra reduces principal.
- Large extra repayment:
  - supports early payoff and shortens schedule.
- PI negative amortization:
  - typed validation issue when base payment is too low to cover period interest.
- IO with zero extra:
  - principal remains constant through term.

## URL Schema
- Existing:
  - `m` mode (`forward|reverse`)
  - `p` principal
  - `pm` payment
  - `r` annual rate
  - `y` years
  - `f` frequency
- New:
  - `rt` repayment type (`PI|IO`)
  - `ob` offset balance
  - `ep` extra payment per period

Defaults are omitted from URL where possible, preserving shareable-state behavior.

## UI Spec
- Inputs:
  - Repayment mode (`forward|reverse`)
  - Repayment type (`PI|IO`)
  - Principal (forward) or base payment (reverse)
  - Rate, years, frequency
  - Offset balance
  - Extra payment per period
- Help text:
  - Offset explanation
  - Extra repayment explanation
  - IO behavior explanation
  - Reverse+IO not supported note
- Results:
  - Keep summary cards
  - Replace table with one dual-axis chart:
    - Left axis line: remaining balance
    - Right axis bars: interest and principal per period
    - Tooltip: period + balance + interest + principal + total payment

## Non-Goals
- IO for partial term then PI
- Fees, insurance, tax components
- Daily interest precision beyond per-period model

## Definition of Done
- Engine supports offset + extra + PI/IO.
- Reverse mode rejects IO with clear typed issue and localized UI note.
- URL sync supports `rt`, `ob`, `ep`.
- Schedule table removed from UI.
- Dual-axis chart implemented and responsive.
- Home no longer shows simple-interest/interest-rate placeholder entry.
- EN/ZH keys added for new UI and validation copy.
- `pnpm lint`, `pnpm test`, `pnpm build` all pass.
