# Novated Lease Domain Specification (M2 Business Modeling)

## 1. Problem Definition

Build a deterministic, frontend-only novated lease calculator for Australian employees that estimates:

- lease repayments (including balloon/residual handling)
- salary packaging cashflow split (pre-tax and post-tax deductions)
- FBT impact (statutory formula method)
- ECM (Employee Contribution Method) effect on FBT
- EV FBT exemption effect (including PHEV transitional caveat)
- net take-home-pay impact relative to no-lease baseline
- comparison against a provider quote even when quote internals are missing

The calculator is an **estimate tool only** and must make all tax/FBT assumptions explicit.

Primary user context for M2:

- users often arrive with a novated lease quote that is commercially vague
- quote documents frequently omit internal interest rate, fee decomposition, or exact tax treatment assumptions
- calculator must support a **quote-first** workflow with explicit inferred assumptions

Scope for this domain model:

- employee-side estimate (not payroll-grade)
- statutory formula method for car fringe benefit (not operating cost method)
- annualized and per-pay-period outputs
- data-driven rules (FY tax brackets, residual table, Medicare levy rate)

Out of scope for this domain model version:

- lender-specific quote replication
- payroll engine integration
- RFBA (reportable fringe benefits amount) effects on HECS/HELP, CCS, etc.
- detailed GST BAS treatment for employers
- operating cost method/logbook modeling

## 1.1 Input Modes Requirement

The model must support exactly two user input modes:

1. **Quote Mode (default)**: typical user enters only what they usually have from a dealer/salary-packaging quote.
2. **Detailed Mode (advanced)**: user enters full lease parameters and tax assumptions.

Both modes must produce the same output contract.

Mode behavior principles:

- no silent assumptions: inferred/defaulted values must be listed in output assumptions
- quote-mode inferred values must carry confidence labels (high/medium/low)
- users can override inferred values where field exists in chosen mode

Decision-tool UX principle:

- default experience must minimize fields and jargon
- advanced controls must be progressively disclosed
- outputs must prioritize “should I do this?” comparisons over technical internals

## 2. Input Parameters (Types + Descriptions)

Implementation target: pure-function input object.

```ts
export type PayFrequency = "weekly" | "fortnightly" | "monthly";
export type InputMode = "detailed" | "quote";

export type FilingProfile = {
  residentForTaxPurposes: true; // MVP assumes Australian resident only
  medicareLevyReductionEligible: boolean; // MVP default false
};

export type VehicleType = "ice" | "hev" | "phev" | "bev" | "fcev";

export type NovatedLeaseVehicleInput = {
  vehicleType: VehicleType;
  purchasePriceInclGst: number; // Drive-away vehicle price incl GST used for residual/base value assumptions
  baseValueForFbt?: number; // Optional override; default derived from purchasePriceInclGst per assumptions
  eligibleForEvFbtExemption: boolean; // User/asserted eligibility after checks
  firstHeldAndUsedDate?: string; // YYYY-MM-DD for transparency; used to assess EV/PHEV rules if provided
  wasPhevExemptBefore2025_04_01?: boolean; // Transitional PHEV support flag
  hasBindingCommitmentPre2025_04_01?: boolean; // Transitional PHEV support flag
};

export type NovatedLeaseFinanceInput = {
  termMonths: 12 | 24 | 36 | 48 | 60;
  annualInterestRatePct: number; // nominal p.a., e.g. 8.5
  paymentsPerYear?: 12 | 26 | 52; // finance payment schedule assumption (default 12)
  establishmentFee: number; // financed unless explicitly excluded by future option
  monthlyAccountKeepingFee: number;
  residualValueOverride?: number; // absolute amount; if absent, use residual table
};

export type NovatedLeaseQuoteInput = {
  quotedMonthlyLeasePayment: number; // monthly quote lease amount used as finance repayment source
  quotedMonthlyAdminFee?: number;
  quotedUpfrontFeesTotal?: number;
};

export type NovatedLeaseRunningCostsInput = {
  annualRegistration: number;
  annualInsurance: number;
  annualMaintenance: number;
  annualTyres: number;
  annualFuelOrElectricity: number;
  annualOtherEligibleCarExpenses: number; // tolls excluded unless business rule added
};

export type NovatedLeaseSalaryInput = {
  grossAnnualSalary: number; // pre-package salary
  payFrequency: PayFrequency;
};

export type NovatedLeaseTaxOptionsInput = {
  incomeTaxYear: "FY2024-25" | "FY2025-26"; // data-table keyed
  includeMedicareLevy: boolean; // default true
  medicareLevyRateOverride?: number; // optional; default from data table
  fbtYearDays?: 365 | 366; // default 365
  daysAvailableForPrivateUseInFbtYear?: number; // default 365 for estimate
  fbtStatutoryRateOverride?: number; // default 0.20
};

export type NovatedLeasePackagingInput = {
  useEcm: boolean; // apply post-tax contributions to reduce FBT taxable value
  evFbtExemptionToggle: boolean; // user toggle to apply exemption if eligible
  includeRunningCostsInPackage: boolean; // if false, only finance component packaged
};

export type NovatedLeaseComparisonInput = {
  opportunityCostRatePct?: number; // optional annual rate for forgone earnings on upfront cash (default 0)
};

export type NovatedLeaseCalculatorInput = {
  inputMode: InputMode;
  vehicle: NovatedLeaseVehicleInput;
  finance?: NovatedLeaseFinanceInput; // required in detailed mode
  quote?: NovatedLeaseQuoteInput; // required in quote mode
  runningCosts: NovatedLeaseRunningCostsInput;
  salary: NovatedLeaseSalaryInput;
  filingProfile: FilingProfile;
  taxOptions: NovatedLeaseTaxOptionsInput;
  packaging: NovatedLeasePackagingInput;
  comparison?: NovatedLeaseComparisonInput;
  quoteContext?: NovatedLeaseQuoteContextInput;
};

export type NovatedLeaseQuoteContextInput = {
  providerName?: string;
  quotedPayPeriodDeductionTotal?: number; // if provided, can be used for back-solving assumptions
  quotedAnnualDeductionTotal?: number;
  quotedResidualValue?: number;
  quotedResidualPct?: number;
  quoteIncludesRunningCosts?: boolean;
  quoteIncludesFuel?: boolean;
  quoteListsInterestRate?: boolean;
  quotedInterestRatePct?: number; // optional if quote discloses it
  quotedUpfrontFeesTotal?: number; // optional aggregate if fee line-items are opaque
  quotedMonthlyAdminFee?: number;
};
```

### Input Notes

- All currency inputs are AUD, GST-inclusive unless explicitly stated otherwise.
- `eligibleForEvFbtExemption` is an explicit input because legal eligibility can depend on facts not inferable from price/type alone.
- `baseValueForFbt` is optional to support future quote-level accuracy; default derivation is defined in assumptions.
- `quoteContext` is optional but recommended when user is comparing against an external quote.
- If quote data is partial, calculation proceeds with assumption fallbacks and warning-level validation issues.
- `inputMode = "detailed"` requires `finance` object and ignores `quote.quotedMonthlyLeasePayment`.
- `inputMode = "quote"` requires `quote.quotedMonthlyLeasePayment` and may omit `finance.annualInterestRatePct`.
- In quote mode, `finance.termMonths` is still required either from `finance.termMonths` or mapped quote metadata.
- `comparison.opportunityCostRatePct` is optional; if not provided, comparison uses `0%` (no opportunity-cost earnings assumed).

## 2.1 User-Facing Mode Definitions (Decision-First)

### Quote Mode (default)

Intended user:

- user has a quote but not full finance internals

Required inputs (minimum set):

- vehicle price (AUD, incl. GST)
- quote monthly lease payment (AUD/month)
- lease term (months)
- gross annual salary
- pay frequency
- annual running costs bundle (single total, with optional expansion)
- vehicle type (Petrol/Diesel, Hybrid, Plug-in Hybrid, Electric, Hydrogen)
- tax year (default to current supported FY)

Optional inputs:

- quote monthly admin fee
- upfront fees from quote
- residual/balloon value from quote
- split running costs into registration/insurance/maintenance/etc.
- opportunity cost rate for cash alternative (advanced comparison assumption)

Validation rules:

- required numeric fields must be finite and >= 0
- quote monthly payment must be > 0
- term must be one of supported terms (12/24/36/48/60)
- salary must be > 0
- if residual is provided, must be >= minimum residual table amount and < vehicle price

### Detailed Mode (advanced)

Intended user:

- user understands finance assumptions and wants fine-grained control

Required inputs:

- all Quote Mode required inputs (except quote monthly payment)
- annual interest rate
- payment frequency for finance schedule (12/26/52)
- establishment fee
- monthly account fee
- explicit running cost components (registration, insurance, maintenance, tyres, energy, other)

Optional inputs:

- FBT base value override
- statutory FBT rate override
- Medicare levy override
- days available for private use override
- residual override
- opportunity cost rate for cash alternative comparison

Validation rules:

- all required detailed numeric fields finite and >= 0
- interest rate >= 0
- FBT statutory override, if supplied, must be in [0, 1]
- days available must be between 0 and FBT year days
- same residual constraints as Quote Mode

## 2.2 UI Schema (User-Friendly Labels)

The UI must render user-facing labels and helper text. Internal keys remain implementation detail.

| Field Key | Label | Helper Text | Unit | Default | Mode |
|---|---|---|---|---|---|
| `inputMode` | Input Style | Choose “Use my quote” or “Enter detailed values”. | none | `quote` | both |
| `vehicle.purchasePriceInclGst` | Vehicle Price | Drive-away price including GST. | AUD | 50,000 | both |
| `quote.quotedMonthlyLeasePayment` | Quote Monthly Lease Payment | Monthly amount from your quote. | AUD/month | empty | quote |
| `finance.termMonths` | Lease Term | Contract length in months. | months | 36 | both |
| `salary.grossAnnualSalary` | Gross Annual Salary | Salary before salary packaging. | AUD/year | 120,000 | both |
| `salary.payFrequency` | Pay Frequency | How often you are paid. | none | fortnightly | both |
| `runningCosts.annualTotal` (UI aggregate) | Annual Running Costs | Total yearly running costs if you only have one number. | AUD/year | 5,800 | quote |
| `runningCosts.annualRegistration` | Registration | Yearly registration amount. | AUD/year | 900 | detailed |
| `runningCosts.annualInsurance` | Insurance | Yearly insurance amount. | AUD/year | 1,400 | detailed |
| `runningCosts.annualMaintenance` | Maintenance | Yearly servicing/maintenance amount. | AUD/year | 800 | detailed |
| `runningCosts.annualTyres` | Tyres | Yearly tyre budget. | AUD/year | 300 | detailed |
| `runningCosts.annualFuelOrElectricity` | Fuel / Charging | Yearly fuel or electricity spend. | AUD/year | 2,200 | detailed |
| `runningCosts.annualOtherEligibleCarExpenses` | Other Car Costs | Other yearly eligible costs. | AUD/year | 200 | detailed |
| `vehicle.vehicleType` | Vehicle Type | Petrol/Diesel, Hybrid, Plug-in Hybrid, Electric, or Hydrogen. | none | Electric vehicle | both |
| `quote.quotedMonthlyAdminFee` | Quote Monthly Admin Fee | Optional monthly admin fee in quote. | AUD/month | empty | quote |
| `quote.quotedUpfrontFeesTotal` | Quote Upfront Fees | Optional upfront fees in quote. | AUD | empty | quote |
| `finance.annualInterestRatePct` | Interest Rate | Annual interest rate (advanced). | % | 8.5 | detailed |
| `finance.paymentsPerYear` | Finance Payments Per Year | Number of repayments used in finance model. | none | 12 | detailed |
| `finance.establishmentFee` | Establishment Fee | Upfront fee added to financed amount. | AUD | 500 | detailed |
| `finance.monthlyAccountKeepingFee` | Monthly Account Fee | Monthly account keeping fee. | AUD/month | 15 | detailed |
| `finance.residualValueOverride` | Residual (Optional Override) | Optional balloon amount override. | AUD | empty | detailed |
| `comparison.opportunityCostRatePct` | Savings Interest Rate (Optional) | Annual rate you could earn if cash stays invested instead of buying outright upfront. | % | 0.0 | both |
| `packaging.includeRunningCostsInPackage` | Include Running Costs | Include yearly running costs in package estimate. | none | true | both |
| `packaging.useEcm` | Use Employee Contribution Method | Advanced option; hidden when not relevant. | none | true | detailed |

Terminology rule:

- UI must use plain language labels (e.g., “Petrol/Diesel” not “ICE”, “Electric vehicle” not “BEV”).
- Technical acronyms can appear in glossary/help only.

## 3.1 Decision-First Output Requirements

For both modes, required outputs in UI order:

### Headline Metrics (always visible)

- Novated monthly out-of-pocket
- Buy outright monthly equivalent cost
- Monthly difference (saves vs costs more)
- Total cost difference over term
- Residual/buyout amount

### Explanation Bullets (always visible)

- one-line statement on whether novated appears cheaper or more expensive
- one-line statement of key driver (tax saving, running costs, or residual impact)
- one-line statement of major assumption (e.g., quote-based payment used, savings interest rate used in buy-out comparison)

### Expandable Breakdown (progressive disclosure)

- lease/payment details
- tax + FBT + ECM details
- running cost details
- assumptions and disclaimer
- data sources

## 3. Output Structure (Strict Interface Definition)

```ts
export type ValidationIssue = {
  code: string;
  field: string;
  message: string;
  severity: "error" | "warning";
};

export type LeaseRepaymentBreakdown = {
  financedAmount: number;
  residualValue: number;
  residualSource: "default_table" | "user_override";
  periodicFinanceRepayment: number; // finance-only repayment excluding running costs
  annualFinanceRepayment: number;
  totalFinanceRepaymentsExcludingResidual: number;
  totalInterestEstimate: number; // finance repayments + residual - financed amount (simplified estimate)
};

export type FbtBreakdown = {
  method: "statutory_formula";
  statutoryRateApplied: number;
  baseValueForFbt: number;
  daysAvailable: number;
  fbtYearDays: number;
  grossTaxableValueBeforeExemptions: number;
  evExemptionApplied: boolean;
  evExemptionReason?: string;
  taxableValueAfterEvExemption: number;
  employeeContributionAppliedForEcm: number; // post-tax contribution counted as E
  taxableValueAfterEcm: number;
  estimatedEmployerFbtTaxableValueFinal: number; // same as taxableValueAfterEcm
};

export type PackagingBreakdown = {
  annualRunningCostsPackaged: number;
  annualFinanceRepaymentsPackaged: number;
  annualPackageCostBeforeEcm: number;
  annualPreTaxDeduction: number;
  annualPostTaxDeduction: number; // ECM amount only in MVP
  perPayPreTaxDeduction: number;
  perPayPostTaxDeduction: number;
  payPeriodsPerYear: number;
};

export type TaxComparisonBreakdown = {
  baselineTaxableIncome: number;
  packagedTaxableIncome: number;
  baselineIncomeTax: number;
  packagedIncomeTax: number;
  baselineMedicareLevy: number;
  packagedMedicareLevy: number;
  taxAndLevySavings: number;
};

export type CashflowSummary = {
  baselineAnnualNetCash: number;
  packagedAnnualNetCashBeforeOutOfPackageCosts: number;
  annualNetBenefitEstimate: number; // packaged net cash - baseline net cash (includes package deductions)
  baselinePerPayNetCash: number;
  packagedPerPayNetCash: number;
  perPayNetBenefitEstimate: number;
};

export type BuyOutrightComparisonBreakdown = {
  basePurchaseAndRunningCostsOverTerm: number;
  opportunityCostRatePctApplied: number;
  estimatedForgoneEarningsOverTerm: number;
  totalCashOutlayOverTermIncludingOpportunityCost: number;
  monthlyEquivalentCostIncludingOpportunityCost: number;
  monthlyDifferenceVsNovated: number; // novatedMonthlyOutOfPocket - buyOutrightMonthlyEquivalent
  totalDifferenceVsNovatedOverTerm: number;
};

export type AppliedAssumption = {
  key: string;
  label: string;
  value: string | number | boolean;
  source?: string;
  confidence?: "high" | "medium" | "low";
  inferred?: boolean;
};

export type InferredParameter = {
  key: string;
  derivedValue: number | string | boolean;
  method:
    | "direct_quote_value"
    | "calculated_from_quote"
    | "default_table"
    | "fallback_default";
  confidence: "high" | "medium" | "low";
  note: string;
};

export type NovatedLeaseCalculatorOutput = {
  ok: boolean;
  validationIssues: ValidationIssue[];
  lease: LeaseRepaymentBreakdown | null;
  fbt: FbtBreakdown | null;
  packaging: PackagingBreakdown | null;
  taxComparison: TaxComparisonBreakdown | null;
  cashflow: CashflowSummary | null;
  buyOutrightComparison?: BuyOutrightComparisonBreakdown | null;
  assumptions: AppliedAssumption[];
  inferredParameters: InferredParameter[];
  modeContext?: {
    inputMode: "detailed" | "quote";
    leaseRepaymentSource: "amortized_finance" | "quoted_monthly_payment";
  };
};
```

### Output Semantics

- `ok = false` when any validation `error` exists. In this case, numeric sections may be `null`.
- `warning` issues do not block calculation.
- Output must include the exact assumptions used (e.g., tax year, Medicare levy rate, statutory rate, residual source).
- Output must include all inferred quote parameters and confidence levels.
- Output shape remains the same across modes; only `modeContext` metadata differs.
- If `comparison.opportunityCostRatePct` is omitted, comparison must apply `0%` and disclose this in `assumptions`.

## 4. Financial Calculation Breakdown

All formulas below must be implemented in pure functions.

### 4.1 Lease Payment Calculation (Finance Component)

#### 4.1.1 Derived Values

- `n = termMonths`
- `paymentsPerYear = finance.paymentsPerYear ?? 12`
- `periods = n / 12 * paymentsPerYear`
- `periodicRate = annualInterestRatePct / 100 / paymentsPerYear`
- `residualValue = residual override OR default residual % * purchasePriceInclGst`
- `financedAmount = purchasePriceInclGst + establishmentFee`

Notes:

- `monthlyAccountKeepingFee` is not part of the PMT formula principal; add it separately to packaged annual costs.
- Future versions may split financed/non-financed upfront costs. MVP keeps a single `establishmentFee` financed for simplicity.

#### 4.1.2 Periodic Finance Repayment (Annuity with Balloon)

If `periodicRate === 0`:

- `periodicFinanceRepayment = (financedAmount - residualValue) / periods`

Else:

- `periodicFinanceRepayment = (periodicRate * (financedAmount - residualValue / (1 + periodicRate)^periods)) / (1 - (1 + periodicRate)^(-periods))`

Annualized finance repayment:

- `annualFinanceRepayment = periodicFinanceRepayment * paymentsPerYear`

Total finance repayments excluding residual:

- `totalFinanceRepaymentsExcludingResidual = periodicFinanceRepayment * periods`

Simplified total interest estimate:

- `totalInterestEstimate = totalFinanceRepaymentsExcludingResidual + residualValue - financedAmount`

### 4.1.4 Quote Mode Lease Payment Handling

When `inputMode = "quote"`:

- lease amortization step is skipped for periodic repayment derivation
- `periodicFinanceRepayment` and `annualFinanceRepayment` are sourced from quote payment:
  - `periodicFinanceRepayment = quotedMonthlyLeasePayment`
  - `annualFinanceRepayment = quotedMonthlyLeasePayment * 12`
- if quote monthly payment is missing/invalid, return validation error and no numeric output

In quote mode:

- amortization-derived fields can still be estimated if enough extra inputs exist, but must be marked inferred
- if not estimable, set relevant derived fields to `0` or inferred approximation and emit warning

### 4.1.3 Quote-Inferred Interest Rate (When Missing)

If quote does not disclose an interest rate but provides enough payment-level information:

- infer rate by solving PMT-with-balloon equation numerically (e.g. bisection/Newton with safe bounds)
- suggested search bounds: `0.0%` to `30.0%` nominal p.a.
- convergence tolerance: payment delta <= `$0.01`

If insufficient information exists for robust solving:

- use fallback assumed rate from a configurable assumption table (e.g. `defaultQuoteInterestRatePct`)
- mark inferred parameter confidence as `low`
- emit warning issue: `QUOTE_INTEREST_RATE_INFERRED`

### 4.2 FBT Calculation (Statutory Formula Method)

MVP uses statutory formula only.

#### 4.2.1 Statutory Taxable Value Formula

ATO statutory formula (car fringe benefit taxable value):

- `taxableValue = (A * B * C / D) - E`

Where:

- `A = baseValueForFbt`
- `B = statutory percentage` (default 20%)
- `C = days available for private use in FBT year`
- `D = days in FBT year (365 or 366)`
- `E = employee contribution (post-tax ECM contribution applied to reduce taxable value)`

MVP estimate defaults:

- `C = 365`
- `D = 365`
- `B = 0.20`

Clamp at zero:

- `grossTaxableValueBeforeExemptions = max(0, A * B * C / D)`
- final taxable values after exemptions/ECM must also be `max(0, ...)`

#### 4.2.2 Base Value for FBT (MVP)

Default rule:

- `baseValueForFbt = vehicle.baseValueForFbt ?? vehicle.purchasePriceInclGst`

This is a simplification. Real-world FBT base value can vary based on inclusions/exclusions and transaction details.

### 4.3 ECM Method (Employee Contribution Method)

Purpose:

- Reduce or eliminate FBT taxable value by applying employee **post-tax** contributions (`E`) against statutory taxable value.

MVP ECM algorithm:

1. Compute taxable value after EV exemption logic (if any).
2. If `useEcm = true`, target post-tax contribution = taxable value after EV exemption.
3. Apply `employeeContributionAppliedForEcm = target`
4. `taxableValueAfterEcm = max(0, taxableValueAfterEvExemption - employeeContributionAppliedForEcm)`

Result:

- In standard ECM mode, FBT taxable value becomes zero (unless future caps/constraints are introduced).

Packaging split rule (MVP):

- `annualPostTaxDeduction = employeeContributionAppliedForEcm`
- Remaining package costs are allocated to `annualPreTaxDeduction`

### 4.4 EV FBT Exemption

If all of the following are true, set FBT taxable value to zero **before ECM**:

- `packaging.evFbtExemptionToggle = true`
- `vehicle.eligibleForEvFbtExemption = true`
- vehicle qualifies under supported rules (see below)

Supported MVP rule handling:

- `bev` and `fcev`: eligible if user indicates eligible.
- `phev`: from **1 April 2025**, generally not eligible unless transitional conditions are met.

PHEV transitional logic (MVP):

- PHEV exemption allowed only if user indicates both:
  - `wasPhevExemptBefore2025_04_01 = true`, and
  - `hasBindingCommitmentPre2025_04_01 = true`

If EV exemption applies:

- `taxableValueAfterEvExemption = 0`
- ECM contribution target becomes `0` (if `useEcm = true`)

### 4.5 Residual Value Handling

Residual is mandatory for lease calculations.

Default residual:

- `residualValue = purchasePriceInclGst * residualPct(termMonths)`

Override behavior:

- If `residualValueOverride` provided, use it **only if** it passes validation:
  - must be >= minimum ATO residual amount for term
  - must be < purchase price (strictly less for sanity)

Output must expose:

- residual amount
- whether default table or override was used

### 4.6 Quote Normalization and Assumption Hierarchy

When provider quote fields are present, normalize into model inputs using this precedence:

1. explicit user-entered calculator values
2. explicit quote values (`quoteContext`)
3. inferred values from quote math
4. domain defaults from data tables

Unknown/opaque quote fees:

- if quote has aggregate fees only, allocate to `establishmentFee` (upfront) and/or `monthlyAccountKeepingFee` (recurring) using default allocation rules
- allocation rules must be configurable and disclosed in assumptions
- emit warning issue: `QUOTE_FEE_DECOMPOSITION_ASSUMED`

Comparison output behavior:

- produce model-estimated package deductions and compare against quoted totals when provided
- expose variance:
  - `quoteVsModelAnnualDifference`
  - `quoteVsModelPerPayDifference`
- classify variance bands:
  - `within_tolerance` (<= 2%)
  - `moderate_gap` (> 2% and <= 8%)
  - `high_gap` (> 8%)

### 4.7 Mode-Specific Flow Summary

Detailed Mode flow:

1. validate detailed-required fields
2. run lease amortization (annuity + residual)
3. run FBT, EV exemption, ECM
4. run tax comparison and cashflow summary

Quote Mode flow:

1. validate quote-required fields (including monthly payment)
2. skip amortization for primary lease payment and use quoted payment as lease payment source
3. run FBT, EV exemption, ECM with same formulas as Detailed Mode
4. run tax comparison and cashflow summary using quote-sourced lease payment

Identical logic across both modes:

- FBT statutory formula
- EV exemption eligibility logic
- ECM logic
- income tax + Medicare levy calculations
- packaging split and cashflow composition structure

### 4.8 Buy Outright Opportunity-Cost Treatment

Purpose:

- reflect the forgone investment/savings earnings when cash is used upfront for outright purchase.

Inputs:

- `comparison.opportunityCostRatePct` (optional, annual percent)
- default if omitted: `0%`

Formulas (MVP comparison model):

- `baseOutrightCostOverTerm = vehiclePrice + (annualRunningCosts * termYears) + upfrontFees`
- `opportunityRate = comparison.opportunityCostRatePct / 100` (or `0` if omitted)
- `estimatedForgoneEarningsOverTerm = vehiclePrice * opportunityRate * termYears` (simple-interest approximation)
- `totalOutrightCostWithOpportunity = baseOutrightCostOverTerm + estimatedForgoneEarningsOverTerm`
- `buyOutrightMonthlyEquivalent = totalOutrightCostWithOpportunity / termMonths`
- `monthlyDifferenceVsNovated = novatedMonthlyOutOfPocket - buyOutrightMonthlyEquivalent`
- `totalDifferenceVsNovatedOverTerm = monthlyDifferenceVsNovated * termMonths`

Current default behavior (explicit):

- if user does not provide a savings interest rate, the calculator assumes `0%`.
- therefore, no opportunity-cost earnings are added in default comparison mode.

## 5. Required Data Tables

All values must be stored in `src/data/**` (not hardcoded in calculation logic).

## 5.1 Resident Tax Brackets (Australia)

Data key: `incomeTaxYear`

```ts
export type TaxBracket = {
  lowerInclusive: number;
  upperInclusive: number | null;
  baseTax: number; // tax payable at lowerInclusive threshold boundary formula base
  marginalRate: number; // decimal, e.g. 0.30
};

export type ResidentTaxTable = {
  year: "FY2024-25" | "FY2025-26";
  brackets: TaxBracket[];
  source: string;
};
```

### Recommended MVP table values (Resident, full-year, tax-free threshold)

As of **2026-02-25**, use (ATO resident rates, 2024-25 and 2025-26 are the same):

- `0 - 18,200`: base `0`, marginal `0`
- `18,201 - 45,000`: base `0`, marginal `0.16` over `18,200`
- `45,001 - 135,000`: base `4,288`, marginal `0.30` over `45,000`
- `135,001 - 190,000`: base `31,288`, marginal `0.37` over `135,000`
- `190,001+`: base `51,638`, marginal `0.45` over `190,000`

Implementation convention:

- Store each bracket with `lowerInclusive` as the threshold reference point used with `baseTax`.
- Tax function uses the first bracket whose range contains income.

## 5.2 ATO Residual Percentages (Minimum Lease Residual / Balloon)

Data key: `termMonths`

```ts
export type ResidualPercentageTable = {
  source: string;
  percentagesByTermMonths: Record<12 | 24 | 36 | 48 | 60, number>;
};
```

### Recommended MVP values

- `12 -> 0.6563`
- `24 -> 0.5625`
- `36 -> 0.4688`
- `48 -> 0.3750`
- `60 -> 0.2813`

Source note:

- These are the standard minimum residual percentages commonly cited from **ATO ID 2002/1004** for car leases (effective life 8 years).
- Because ATO legacy interpretative decisions are not always easily machine-fetchable, implementation must keep this table versioned and source-tagged.

## 5.3 Medicare Levy Assumption

```ts
export type MedicareLevyAssumption = {
  year: "FY2024-25" | "FY2025-26";
  rate: number; // decimal, default 0.02
  appliesByDefault: boolean;
  source: string;
};
```

### Recommended MVP values

- `rate = 0.02` for `FY2024-25`, `FY2025-26`
- `appliesByDefault = true`

MVP simplification:

- ignore Medicare levy low-income thresholds/reductions unless `medicareLevyReductionEligible` is later implemented in detail

## 6. Assumptions and Simplifications

These must be displayed in the UI assumptions section.

1. **Estimate only**: not financial/tax/legal advice.
2. **Resident tax only**: foreign resident and working holiday maker tax tables not modeled.
3. **Income tax offsets ignored**: no LITO, SAPTO, HELP/HECS, MLS, private health effects, deductions, bonuses, super interactions, etc.
4. **Medicare levy simplified**: flat 2% if enabled; no low-income reduction/exemption logic in MVP.
5. **FBT method fixed**: statutory formula method only, default statutory rate 20%.
6. **FBT base value simplified**: defaults to `purchasePriceInclGst` unless user override is supplied.
7. **Full-year availability default**: car available for private use for full FBT year unless user changes days.
8. **ECM simplified**: post-tax contributions target the remaining statutory taxable value exactly (to reduce FBT taxable value to zero).
9. **Lease repayment simplification**: annuity-with-balloon model approximates financier repayments; may differ from provider quotes.
10. **GST treatment simplified**: calculator does not fully model employer GST credits/BAS timing. Inputs are GST-inclusive for user readability.
11. **Running costs annualized**: no seasonality, no actual usage profile modeling.
12. **Residual schedule versioned**: defaults follow ATO ID 2002/1004-based industry schedule and should remain configurable.
13. **Quote opacity handling**: when quote internals are missing, model uses explicit fallback assumptions and labels confidence.
14. **Unknown-interest fallback**: if internal rate cannot be inferred reliably, default assumed rate is used and surfaced as low confidence.
15. **Fee decomposition fallback**: opaque bundled quote fees are allocated using configurable defaults for upfront vs recurring fees.
16. **Variance expected**: quote-vs-model mismatch is normal when provider margins/embedded services are undisclosed.
17. **Buy-out opportunity cost default**: unless user sets a savings interest rate, buy-outright comparison assumes `0%` opportunity-cost earnings.

## 7. Edge Cases

Implementation must handle (and test) at least these:

1. `annualInterestRatePct = 0` (use zero-rate formula branch).
2. Very low non-zero rate (numerical stability).
3. Term = `12` and `60` months.
4. Residual override exactly equal to minimum allowed (valid).
5. Residual override below minimum (error).
6. Negative or non-numeric currency fields (error).
7. Empty required fields in UI -> validation errors, no calculation.
8. `daysAvailableForPrivateUseInFbtYear = 0` -> FBT taxable value should be zero.
9. EV exemption toggle on but vehicle not eligible -> warning and no exemption applied.
10. PHEV after 1 Apr 2025 without transitional flags -> no exemption.
11. ECM on when taxable value already zero (EV exemption or zero days) -> post-tax ECM contribution = zero.
12. High salary and low salary scenarios across different tax brackets.
13. Package cost > gross salary (validation error or warning depending policy; MVP should block negative taxable income).
14. Quote provides only per-pay total deduction but no fee/rate split.
15. Quote residual provided as percentage only.
16. Quote includes unknown bundled services (e.g. maintenance programs) not itemized.
17. Back-solved implied rate is implausibly high/low (trigger warning and fallback).
18. Opportunity-cost rate omitted -> comparison uses 0% and must disclose assumption.
19. Opportunity-cost rate > 0 -> buy-outright monthly equivalent should increase versus 0% baseline.

## 8. Validation Rules

Validation should return structured issues (`error`/`warning`), not throw for normal user-entry mistakes.

### 8.1 Required Fields

Errors if missing/blank:

- `inputMode`
- `vehicle.purchasePriceInclGst`
- `salary.grossAnnualSalary`
- `salary.payFrequency`
- `taxOptions.incomeTaxYear`

Detailed Mode required:

- `finance.termMonths`
- `finance.annualInterestRatePct`
- `finance.establishmentFee`
- `finance.monthlyAccountKeepingFee`

Quote Mode required:

- `quote.quotedMonthlyLeasePayment`
- term source (`finance.termMonths` or equivalent quote metadata mapped into `termMonths`)
- quote payment must be strictly greater than 0

### 8.2 Numeric Constraints

Errors:

- all currency fields must be finite numbers `>= 0`
- `grossAnnualSalary > 0`
- `annualInterestRatePct >= 0` (Detailed Mode)
- `termMonths` must be one of `12|24|36|48|60`
- `paymentsPerYear` must be one of `12|26|52`
- `daysAvailableForPrivateUseInFbtYear` must be between `0` and `fbtYearDays`
- `fbtYearDays` must be `365` or `366`
- `quotedMonthlyLeasePayment > 0` (Quote Mode)
- `comparison.opportunityCostRatePct`, if provided, must be finite and `>= 0`

### 8.3 Residual Validation

Let `minResidual = purchasePriceInclGst * residualPct(termMonths)`.

Errors:

- if override present and `override < minResidual`
- if override present and `override >= purchasePriceInclGst`

Warnings:

- override significantly above minimum (e.g. > 60% for 5-year term) if desired; non-blocking

### 8.4 Salary Packaging Sanity Rules

Errors:

- resulting `packagedTaxableIncome < 0`

Warnings:

- `annualPreTaxDeduction + annualPostTaxDeduction` exceeds a configurable proportion of gross salary (e.g. > 80%)
- EV exemption toggle enabled but eligibility flags incomplete/false
- quote present but missing critical decomposition fields (`QUOTE_PARTIAL_DATA`)
- implied interest rate outside plausible bounds (`QUOTE_IMPLIED_RATE_OUTLIER`)
- quote/model variance above tolerance (`QUOTE_MODEL_VARIANCE_HIGH`)

### 8.5 Mode-Consistency Rules

Errors:

- `inputMode = "detailed"` and `finance` missing
- `inputMode = "quote"` and `quote.quotedMonthlyLeasePayment` missing
- unsupported mixed source where neither amortized repayment nor quote payment can be established

Warnings:

- both detailed repayment inputs and quote monthly payment provided; mode-selected source is used and alternate source ignored
- quote mode with insufficient decomposition fields (e.g., fees unknown) leading to inferred assumptions

## 9. Risk Areas

### 9.1 Regulatory / Tax Rule Changes

- **Income tax brackets** can change by FY; table must be versioned by income year.
- **Medicare levy rules** (rates, thresholds, exemptions) may change.
- **EV FBT exemption rules** may change, especially post-review.
- **PHEV transitional eligibility** is date- and fact-sensitive.
- **FBT statutory formula settings** and interpretation can change.

### 9.2 Incorrect Assumptions (Model Risk)

- Simplified FBT base value may differ from employer/provider calculation.
- Simplified GST treatment can materially change estimated savings.
- ECM handling may differ in payroll implementation timing and GST treatment.
- Financier payment formulas/fees may differ from annuity estimate.
- Running costs and usage assumptions can dominate outcome sensitivity.
- Provider quote margins and fee packaging can be opaque by design.
- Implied-rate back-solving can attribute non-interest margins to "rate", overstating true financing cost.

### 9.3 UX / Data Input Risk

- Users may misclassify EV exemption eligibility.
- Users may enter ex-GST figures while labels assume inc-GST.
- Users may compare annual outputs to per-pay deductions incorrectly without clear labeling.
- Users may assume quote totals are fully finance-related when they include admin/service bundles.

### 9.4 Mitigations Required in Implementation

- Versioned data tables with source metadata and effective dates
- UI assumptions/disclaimer section listing all applied simplifications
- Validation messages that identify ineligible EV/PHEV cases
- Output breakdown with explicit pre-tax vs post-tax split
- Unit tests around tax brackets, residuals, FBT, ECM, EV exemption toggles
- Quote-mode tests for missing-rate and opaque-fee inference behavior
- UI display of inferred values with confidence + override controls

## Recommended Implementation Sequence (for M2 Logic)

1. Validation layer and typed input normalization
2. Data-table accessors (tax brackets, residuals, Medicare levy)
3. Pure tax calculation helpers (income tax + Medicare)
4. Lease finance repayment calculator (annuity + residual)
5. FBT statutory formula calculator
6. EV exemption rule evaluator
7. ECM allocator
8. Packaging and net cashflow summary composer
9. Unit tests across ICE/EV/PHEV and edge cases

## Source Notes (Reference URLs for Data/Rules)

- ATO resident income tax rates (includes 2025-26 resident rates and Medicare levy note): `https://www.ato.gov.au/rates/individual-income-tax-rates/`
- ATO Medicare levy (states levy is 2%): `https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy/what-is-the-medicare-levy`
- ATO car fringe benefit taxable value (statutory formula and variables A/B/C/D/E): `https://www.ato.gov.au/businesses-and-organisations/hiring-and-paying-your-workers/fringe-benefits-tax/types-of-fringe-benefits/fbt-on-cars-other-vehicles-parking-and-tolls/cars-and-fbt/taxable-value-of-a-car-fringe-benefit`
- ATO electric cars exemption (EV FBT exemption): `https://www.ato.gov.au/businesses-and-organisations/hiring-and-paying-your-workers/fringe-benefits-tax/types-of-fringe-benefits/fbt-on-cars-other-vehicles-parking-and-tolls/electric-cars-exemption`
- ATO PHEV FBT exemption transition from 1 April 2025: `https://www.ato.gov.au/businesses-and-organisations/hiring-and-paying-your-workers/fringe-benefits-tax/types-of-fringe-benefits/fbt-on-cars-other-vehicles-parking-and-tolls/fbt-on-plug-in-hybrid-electric-vehicles`
- Residual percentage schedule (industry-standard ATO ID 2002/1004 references; keep table configurable and source-tagged): e.g. NSW Health salary packaging policy cites the same residual table and statutory formula context.
