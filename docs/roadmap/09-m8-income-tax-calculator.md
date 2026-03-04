# M8: Income Tax Calculator (With Superannuation)

## Goal
Add an Australian Income Tax calculator that supports salary entered:
- `Salary (excl. super)`
- `Total package (incl. super)`

and outputs tax, Medicare levy, net income, employer super, and package totals across pay frequencies.

## Scope
- New route: `/calculators/income-tax`
- New pure engine: `src/lib/calculators/incomeTax/**`
- New AU super SG JSON data source
- URL shareable state for main inputs
- EN/ZH localized UI and copy

## Inputs (UX)
- Financial year (`FY2024-25`, `FY2025-26`, `FY2026-27`)
- Amount
- Amount frequency (`annual`, `monthly`, `fortnightly`, `weekly`)
- Salary input type:
  - `EXCL_SUPER` (base salary)
  - `INCL_SUPER` (total package)
- SG rate override (optional, advanced) is **not** included in this milestone

## Outputs (UX)
- Summary (annual):
  - Base salary (excl. super)
  - Net income
  - Total withheld (`income tax + Medicare levy`)
  - Employer super
  - Total package
- Detailed breakdown for `annual/monthly/fortnightly/weekly`:
  - base salary
  - employer super
  - total package
  - income tax
  - Medicare levy
  - total withheld
  - net income

## Data Sources
- Tax brackets:
  - `src/data/au/tax/brackets/FY2024-25.json`
  - `src/data/au/tax/brackets/FY2025-26.json`
  - `src/data/au/tax/brackets/FY2026-27.json`
- Medicare levy:
  - `src/data/au/medicare-levy/FY2024-25.json`
  - `src/data/au/medicare-levy/FY2025-26.json`
  - `src/data/au/medicare-levy/FY2026-27.json`
- New SG rates:
  - `src/data/au/super/sg-rates.json`

## URL Schema
- `fy`: financial year
- `amount`: entered amount
- `freq`: entered amount frequency
- `salaryType`: `EXCL_SUPER | INCL_SUPER`

## Math Spec (Pure Engine)

### Frequency
- Payments/year:
  - annual `1`
  - monthly `12`
  - fortnightly `26`
  - weekly `52`

### Salary type conversion
- `EXCL_SUPER`
  - `baseGross = enteredAnnual`
  - `employerSuper = baseGross * sgRate`
  - `totalPackage = baseGross + employerSuper`
- `INCL_SUPER`
  - `totalPackage = enteredAnnual`
  - `baseGross = totalPackage / (1 + sgRate)`
  - `employerSuper = totalPackage - baseGross`

### Tax and levy base
- Compute income tax and Medicare levy on `baseGross` only.
- Employer super is not part of taxable income in this calculator.

### Income tax formula
- Bracket lookup by annual taxable income.
- Tax per bracket:
  - `tax = baseTax + (income - (threshold == 0 ? 0 : threshold - 1)) * marginalRate`
- Uses bracket data from selected FY JSON.

### Medicare levy formula
- `medicareLevy = baseGross * levyRate` from FY JSON.

### Withheld and net
- `totalWithheld = incomeTax + medicareLevy`
- `netIncome = baseGross - totalWithheld`

## Reverse Mode Decision
- Net-to-gross reverse solve is **not implemented in M8**.
- Rationale: avoid confusion between simplified withholding model and real payroll adjustments in first release.
- Non-goal retained for later milestone.

## Risks
- Rounding differences between annual and per-period views.
- User confusion between incl/excl super semantics.
- Future FY data updates required for tax, levy, and SG.
- Simplified Medicare model excludes low-income reduction.

## Definition of Done
- Pure engine and tests for income tax + super.
- New SG JSON data and FY lookup.
- `/calculators/income-tax` UI implemented with URL sync.
- Home selector shows Income Tax as available.
- EN/ZH text complete for income tax UI.
- `pnpm lint`, `pnpm test`, `pnpm build` pass.
