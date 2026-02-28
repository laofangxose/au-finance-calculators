export type PayFrequency = "weekly" | "fortnightly" | "monthly";

export type FilingProfile = {
  residentForTaxPurposes: true;
  medicareLevyReductionEligible: boolean;
};

export type VehicleType = "ice" | "hev" | "phev" | "bev" | "fcev";

export type NovatedLeaseVehicleInput = {
  vehicleType: VehicleType;
  purchasePriceInclGst: number;
  baseValueForFbt?: number;
  eligibleForEvFbtExemption: boolean;
  firstHeldAndUsedDate?: string;
  wasPhevExemptBefore2025_04_01?: boolean;
  hasBindingCommitmentPre2025_04_01?: boolean;
};

export type NovatedLeaseFinanceInput = {
  termMonths: 12 | 24 | 36 | 48 | 60;
  annualInterestRatePct: number;
  paymentsPerYear?: 12 | 26 | 52;
  establishmentFee: number;
  monthlyAccountKeepingFee: number;
  residualValueOverride?: number;
};

export type NovatedLeaseRunningCostsInput = {
  annualRegistration: number;
  annualInsurance: number;
  annualMaintenance: number;
  annualTyres: number;
  annualFuelOrElectricity: number;
  annualOtherEligibleCarExpenses: number;
};

export type NovatedLeaseSalaryInput = {
  grossAnnualSalary: number;
  payFrequency: PayFrequency;
};

export type NovatedLeaseTaxOptionsInput = {
  incomeTaxYear: "FY2024-25" | "FY2025-26" | "FY2026-27";
  includeMedicareLevy: boolean;
  medicareLevyRateOverride?: number;
  fbtYearDays?: 365 | 366;
  daysAvailableForPrivateUseInFbtYear?: number;
  fbtStatutoryRateOverride?: number;
};

export type NovatedLeasePackagingInput = {
  useEcm: boolean;
  evFbtExemptionToggle: boolean;
  includeRunningCostsInPackage: boolean;
};

export type NovatedLeaseComparisonInput = {
  opportunityCostRatePct?: number;
};

export type NovatedLeaseQuoteContextInput = {
  providerName?: string;
  quotedPayPeriodDeductionTotal?: number;
  quotedAnnualDeductionTotal?: number;
  quotedResidualValue?: number;
  quotedResidualPct?: number;
  quoteIncludesRunningCosts?: boolean;
  quoteIncludesFuel?: boolean;
  quoteListsInterestRate?: boolean;
  quotedInterestRatePct?: number;
  quotedUpfrontFeesTotal?: number;
  quotedMonthlyAdminFee?: number;
};

export type NovatedLeaseCalculatorInput = {
  vehicle: NovatedLeaseVehicleInput;
  finance: NovatedLeaseFinanceInput;
  runningCosts: NovatedLeaseRunningCostsInput;
  salary: NovatedLeaseSalaryInput;
  filingProfile: FilingProfile;
  taxOptions: NovatedLeaseTaxOptionsInput;
  packaging: NovatedLeasePackagingInput;
  comparison?: NovatedLeaseComparisonInput;
  quoteContext?: NovatedLeaseQuoteContextInput;
};

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
  periodicFinanceRepayment: number;
  annualFinanceRepayment: number;
  totalFinanceRepaymentsExcludingResidual: number;
  totalInterestEstimate: number;
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
  employeeContributionAppliedForEcm: number;
  taxableValueAfterEcm: number;
  estimatedEmployerFbtTaxableValueFinal: number;
};

export type PackagingBreakdown = {
  annualRunningCostsPackaged: number;
  annualFinanceRepaymentsPackaged: number;
  annualPackageCostBeforeEcm: number;
  annualPreTaxDeduction: number;
  annualPostTaxDeduction: number;
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
  annualNetBenefitEstimate: number;
  baselinePerPayNetCash: number;
  packagedPerPayNetCash: number;
  perPayNetBenefitEstimate: number;
};

export type BuyOutrightComparisonBreakdown = {
  monthlyEquivalentCost: number;
  totalCashOutlayOverTerm: number;
  novatedMonthlyOutOfPocket: number;
  novatedTotalCostOverTerm: number;
  monthlyDifference: number;
  totalCostDifferenceOverTerm: number;
  opportunityCostRateAssumed: number;
  estimatedForgoneEarningsOverTerm: number;
  estimatedLctIncludedInPurchasePrice: number;
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
  buyOutrightComparison: BuyOutrightComparisonBreakdown | null;
  assumptions: AppliedAssumption[];
  inferredParameters: InferredParameter[];
};
