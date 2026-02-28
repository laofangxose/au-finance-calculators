import assumptionsConfig from "../../../data/au/novated-lease/assumptions.json";
import fbtConfig from "../../../data/au/fbt/config.json";
import medicareFy202425 from "../../../data/au/medicare-levy/FY2024-25.json";
import medicareFy202526 from "../../../data/au/medicare-levy/FY2025-26.json";
import medicareFy202627 from "../../../data/au/medicare-levy/FY2026-27.json";
import residualConfig from "../../../data/au/residuals/ato-car-lease-residuals.json";
import taxFy202425 from "../../../data/au/tax/brackets/FY2024-25.json";
import taxFy202526 from "../../../data/au/tax/brackets/FY2025-26.json";
import taxFy202627 from "../../../data/au/tax/brackets/FY2026-27.json";
import lctThresholds from "../../../data/au/lct/thresholds.json";
import type {
  AppliedAssumption,
  BuyOutrightComparisonBreakdown,
  FbtBreakdown,
  InferredParameter,
  LeaseRepaymentBreakdown,
  NovatedLeaseCalculatorInput,
  NovatedLeaseCalculatorOutput,
  TaxComparisonBreakdown,
  ValidationIssue,
} from "./types";

type TaxTable = typeof taxFy202425;
type MedicareTable = typeof medicareFy202425;

const taxTablesByYear: Record<string, TaxTable> = {
  "FY2024-25": taxFy202425,
  "FY2025-26": taxFy202526,
  "FY2026-27": taxFy202627,
};

const medicareByYear: Record<string, MedicareTable> = {
  "FY2024-25": medicareFy202425,
  "FY2025-26": medicareFy202526,
  "FY2026-27": medicareFy202627,
};

function roundToDp(value: number, dp: number): number {
  const factor = 10 ** dp;
  return Math.round(value * factor) / factor;
}

function roundCurrency(value: number): number {
  return roundToDp(value, assumptionsConfig.roundingPrecisionDp);
}

function valueIsFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function payPeriodsForFrequency(frequency: NovatedLeaseCalculatorInput["salary"]["payFrequency"]): number {
  if (frequency === "weekly") return 52;
  if (frequency === "fortnightly") return 26;
  return 12;
}

function computePeriodicRepayment(
  financedAmount: number,
  residualValue: number,
  periodicRate: number,
  periods: number,
): number {
  if (periodicRate === 0) {
    return (financedAmount - residualValue) / periods;
  }

  const numerator =
    periodicRate *
    (financedAmount - residualValue / (1 + periodicRate) ** periods);
  const denominator = 1 - (1 + periodicRate) ** -periods;
  return numerator / denominator;
}

function computeIncomeTax(income: number, table: TaxTable): number {
  const bracket =
    table.brackets.find((item) => {
      if (item.upperThreshold === null) return income >= item.threshold;
      return income >= item.threshold && income <= item.upperThreshold;
    }) ?? table.brackets[table.brackets.length - 1];

  const thresholdFloor = bracket.threshold === 0 ? 0 : bracket.threshold - 1;
  return Math.max(0, bracket.baseTax + (income - thresholdFloor) * bracket.marginalRate);
}

function inferInterestRateFromQuote(params: {
  financedAmount: number;
  residualValue: number;
  termMonths: number;
  paymentsPerYear: number;
  targetAnnualFinanceRepayment: number;
}): number | null {
  const periods = (params.termMonths / 12) * params.paymentsPerYear;
  if (periods <= 0) return null;

  const targetPeriodic = params.targetAnnualFinanceRepayment / params.paymentsPerYear;
  if (!Number.isFinite(targetPeriodic) || targetPeriodic <= 0) return null;

  let low = 0;
  let high = 0.3;
  let bestRate = assumptionsConfig.defaultQuoteInterestRatePct / 100;
  let bestDelta = Number.POSITIVE_INFINITY;

  for (let i = 0; i < 100; i += 1) {
    const mid = (low + high) / 2;
    const periodicRate = mid / params.paymentsPerYear;
    const estimated = computePeriodicRepayment(
      params.financedAmount,
      params.residualValue,
      periodicRate,
      periods,
    );
    const delta = estimated - targetPeriodic;
    const absDelta = Math.abs(delta);

    if (absDelta < bestDelta) {
      bestDelta = absDelta;
      bestRate = mid;
    }

    if (absDelta <= 0.01) {
      break;
    }

    if (delta < 0) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return bestRate * 100;
}

function isEvFbtExempt(input: NovatedLeaseCalculatorInput): {
  applied: boolean;
  reason?: string;
} {
  const { vehicle } = input;
  const lctFuelEfficientThreshold =
    lctThresholds.thresholdsByFinancialYear[input.taxOptions.incomeTaxYear]
      .fuelEfficient;
  const isBelowFuelEfficientLctThreshold =
    vehicle.purchasePriceInclGst <= lctFuelEfficientThreshold;

  if (vehicle.vehicleType === "bev" || vehicle.vehicleType === "fcev") {
    if (!isBelowFuelEfficientLctThreshold) {
      return {
        applied: false,
        reason:
          "EV purchase price is above the fuel-efficient LCT threshold, so exemption does not apply.",
      };
    }
    return {
      applied: true,
      reason: "Auto-applied for eligible BEV/FCEV under LCT threshold.",
    };
  }

  if (vehicle.vehicleType === "phev") {
    if (!isBelowFuelEfficientLctThreshold) {
      return {
        applied: false,
        reason:
          "PHEV purchase price is above the fuel-efficient LCT threshold, so exemption does not apply.",
      };
    }
    if (
      vehicle.wasPhevExemptBefore2025_04_01 &&
      vehicle.hasBindingCommitmentPre2025_04_01
    ) {
      return {
        applied: true,
        reason: "PHEV transitional conditions were marked as met.",
      };
    }
    return {
      applied: false,
      reason: "PHEV exemption requires transitional conditions after 2025-04-01.",
    };
  }

  return { applied: false };
}

function errorIssues(issues: ValidationIssue[]): ValidationIssue[] {
  return issues.filter((issue) => issue.severity === "error");
}

function computeBuyOutrightComparison(params: {
  input: NovatedLeaseCalculatorInput;
  lease: LeaseRepaymentBreakdown;
  taxComparison: TaxComparisonBreakdown;
}): BuyOutrightComparisonBreakdown {
  const { input, lease, taxComparison } = params;
  const termMonths = input.finance.termMonths;
  const termYears = termMonths / 12;
  const useFuelEfficientThreshold =
    input.vehicle.vehicleType === "bev" || input.vehicle.vehicleType === "fcev";
  const lctThreshold =
    lctThresholds.thresholdsByFinancialYear[input.taxOptions.incomeTaxYear][
      useFuelEfficientThreshold ? "fuelEfficient" : "other"
    ];
  const estimatedLctIncludedInPurchasePrice =
    input.vehicle.purchasePriceInclGst > lctThreshold
      ? (input.vehicle.purchasePriceInclGst - lctThreshold) *
        (10 / 11) *
        lctThresholds.rate
      : 0;

  const opportunityCostRateRaw = input.comparison?.opportunityCostRatePct;
  const opportunityCostRateAssumed =
    typeof opportunityCostRateRaw === "number" &&
    Number.isFinite(opportunityCostRateRaw) &&
    opportunityCostRateRaw >= 0
      ? opportunityCostRateRaw
      : 0;
  const estimatedForgoneEarningsOverTerm =
    input.vehicle.purchasePriceInclGst *
    (opportunityCostRateAssumed / 100) *
    termYears;

  // Requested decision model:
  // outright total = car price only
  const totalCashOutlayOverTerm = input.vehicle.purchasePriceInclGst;
  const monthlyEquivalentCost = totalCashOutlayOverTerm / termMonths;

  // novated total = repayments - tax savings + residual - opportunity cost
  const novatedTotalCostOverTerm =
    lease.totalFinanceRepaymentsExcludingResidual -
    taxComparison.taxAndLevySavings +
    lease.residualValue -
    estimatedForgoneEarningsOverTerm;
  const novatedMonthlyOutOfPocket = novatedTotalCostOverTerm / termMonths;

  return {
    monthlyEquivalentCost: roundCurrency(monthlyEquivalentCost),
    totalCashOutlayOverTerm: roundCurrency(totalCashOutlayOverTerm),
    novatedMonthlyOutOfPocket: roundCurrency(novatedMonthlyOutOfPocket),
    novatedTotalCostOverTerm: roundCurrency(novatedTotalCostOverTerm),
    monthlyDifference: roundCurrency(
      novatedMonthlyOutOfPocket - monthlyEquivalentCost,
    ),
    totalCostDifferenceOverTerm: roundCurrency(
      novatedTotalCostOverTerm - totalCashOutlayOverTerm,
    ),
    opportunityCostRateAssumed: roundCurrency(opportunityCostRateAssumed),
    estimatedForgoneEarningsOverTerm: roundCurrency(
      estimatedForgoneEarningsOverTerm,
    ),
    estimatedLctIncludedInPurchasePrice: roundCurrency(
      estimatedLctIncludedInPurchasePrice,
    ),
  };
}

export function calculateNovatedLease(
  input: NovatedLeaseCalculatorInput,
): NovatedLeaseCalculatorOutput {
  const issues: ValidationIssue[] = [];
  const inferredParameters: InferredParameter[] = [];
  const assumptions: AppliedAssumption[] = [
    {
      key: "rounding",
      label: "Currency rounding precision",
      value: assumptionsConfig.roundingPrecisionDp,
      source: assumptionsConfig.source,
    },
    {
      key: "fbt_method",
      label: "FBT method",
      value: fbtConfig.method,
      source: fbtConfig.source,
    },
  ];

  const taxTable = taxTablesByYear[input.taxOptions.incomeTaxYear];
  const medicareTable = medicareByYear[input.taxOptions.incomeTaxYear];

  if (!taxTable) {
    issues.push({
      code: "TAX_YEAR_UNSUPPORTED",
      field: "taxOptions.incomeTaxYear",
      message: "Income tax year is unsupported.",
      severity: "error",
    });
  }

  if (!medicareTable) {
    issues.push({
      code: "MEDICARE_YEAR_UNSUPPORTED",
      field: "taxOptions.incomeTaxYear",
      message: "Medicare levy year is unsupported.",
      severity: "error",
    });
  }

  const requiredNumericFields: Array<{ value: unknown; field: string }> = [
    { value: input.vehicle.purchasePriceInclGst, field: "vehicle.purchasePriceInclGst" },
    { value: input.finance.termMonths, field: "finance.termMonths" },
    { value: input.finance.establishmentFee, field: "finance.establishmentFee" },
    {
      value: input.finance.monthlyAccountKeepingFee,
      field: "finance.monthlyAccountKeepingFee",
    },
    { value: input.salary.grossAnnualSalary, field: "salary.grossAnnualSalary" },
    {
      value: input.runningCosts.annualRegistration,
      field: "runningCosts.annualRegistration",
    },
    { value: input.runningCosts.annualInsurance, field: "runningCosts.annualInsurance" },
    {
      value: input.runningCosts.annualMaintenance,
      field: "runningCosts.annualMaintenance",
    },
    { value: input.runningCosts.annualTyres, field: "runningCosts.annualTyres" },
    {
      value: input.runningCosts.annualFuelOrElectricity,
      field: "runningCosts.annualFuelOrElectricity",
    },
    {
      value: input.runningCosts.annualOtherEligibleCarExpenses,
      field: "runningCosts.annualOtherEligibleCarExpenses",
    },
  ];

  for (const item of requiredNumericFields) {
    if (!valueIsFiniteNumber(item.value)) {
      issues.push({
        code: "REQUIRED_NUMBER_INVALID",
        field: item.field,
        message: `${item.field} must be a finite number.`,
        severity: "error",
      });
    }
  }

  if (valueIsFiniteNumber(input.vehicle.purchasePriceInclGst) && input.vehicle.purchasePriceInclGst < 0) {
    issues.push({
      code: "NEGATIVE_VALUE",
      field: "vehicle.purchasePriceInclGst",
      message: "Purchase price cannot be negative.",
      severity: "error",
    });
  }

  if (valueIsFiniteNumber(input.salary.grossAnnualSalary) && input.salary.grossAnnualSalary <= 0) {
    issues.push({
      code: "NON_POSITIVE_SALARY",
      field: "salary.grossAnnualSalary",
      message: "Gross annual salary must be greater than zero.",
      severity: "error",
    });
  }

  if (![12, 24, 36, 48, 60].includes(input.finance.termMonths)) {
    issues.push({
      code: "INVALID_TERM",
      field: "finance.termMonths",
      message: "Term months must be one of 12, 24, 36, 48, or 60.",
      severity: "error",
    });
  }

  const paymentsPerYear =
    input.finance.paymentsPerYear ?? assumptionsConfig.defaultFinancePaymentsPerYear;
  if (![12, 26, 52].includes(paymentsPerYear)) {
    issues.push({
      code: "INVALID_PAYMENTS_PER_YEAR",
      field: "finance.paymentsPerYear",
      message: "Payments per year must be one of 12, 26, or 52.",
      severity: "error",
    });
  }

  const leaseYears = String(input.finance.termMonths / 12) as "1" | "2" | "3" | "4" | "5";
  const defaultResidualPct = residualConfig.residualPercentByLeaseYear[leaseYears];
  if (!valueIsFiniteNumber(defaultResidualPct)) {
    issues.push({
      code: "RESIDUAL_TABLE_MISSING",
      field: "finance.termMonths",
      message: "No residual percentage found for term.",
      severity: "error",
    });
  }

  const minResidual = valueIsFiniteNumber(defaultResidualPct)
    ? input.vehicle.purchasePriceInclGst * defaultResidualPct
    : Number.NaN;
  let residualValue = minResidual;
  let residualSource: LeaseRepaymentBreakdown["residualSource"] = "default_table";

  if (valueIsFiniteNumber(input.finance.residualValueOverride)) {
    residualValue = input.finance.residualValueOverride;
    residualSource = "user_override";

    if (valueIsFiniteNumber(minResidual) && residualValue < minResidual) {
      issues.push({
        code: "RESIDUAL_BELOW_MINIMUM",
        field: "finance.residualValueOverride",
        message: "Residual override is below minimum table amount for term.",
        severity: "error",
      });
    }

    if (valueIsFiniteNumber(input.vehicle.purchasePriceInclGst) && residualValue >= input.vehicle.purchasePriceInclGst) {
      issues.push({
        code: "RESIDUAL_TOO_HIGH",
        field: "finance.residualValueOverride",
        message: "Residual override must be less than purchase price.",
        severity: "error",
      });
    }
  }

  let annualInterestRatePct = input.finance.annualInterestRatePct;
  if (!valueIsFiniteNumber(annualInterestRatePct) || annualInterestRatePct < 0) {
    const quoteRate = input.quoteContext?.quotedInterestRatePct;
    if (valueIsFiniteNumber(quoteRate) && quoteRate >= 0) {
      annualInterestRatePct = quoteRate;
      inferredParameters.push({
        key: "finance.annualInterestRatePct",
        derivedValue: roundCurrency(annualInterestRatePct),
        method: "direct_quote_value",
        confidence: "high",
        note: "Using quote-provided interest rate.",
      });
      assumptions.push({
        key: "interest_rate_source",
        label: "Interest rate source",
        value: "quote",
        inferred: true,
        confidence: "high",
      });
    } else {
      const quotedAnnualDeduction =
        input.quoteContext?.quotedAnnualDeductionTotal ??
        (valueIsFiniteNumber(input.quoteContext?.quotedPayPeriodDeductionTotal)
          ? input.quoteContext.quotedPayPeriodDeductionTotal *
            payPeriodsForFrequency(input.salary.payFrequency)
          : undefined);

      if (valueIsFiniteNumber(quotedAnnualDeduction) && quotedAnnualDeduction > 0) {
        const annualRunningCosts =
          input.runningCosts.annualRegistration +
          input.runningCosts.annualInsurance +
          input.runningCosts.annualMaintenance +
          input.runningCosts.annualTyres +
          input.runningCosts.annualFuelOrElectricity +
          input.runningCosts.annualOtherEligibleCarExpenses;
        const annualAdminFee =
          (input.quoteContext?.quotedMonthlyAdminFee ??
            input.finance.monthlyAccountKeepingFee) * 12;
        const annualFinanceTarget =
          quotedAnnualDeduction -
          (input.packaging.includeRunningCostsInPackage ? annualRunningCosts : 0) -
          annualAdminFee;

        const inferred = inferInterestRateFromQuote({
          financedAmount: input.vehicle.purchasePriceInclGst + input.finance.establishmentFee,
          residualValue,
          termMonths: input.finance.termMonths,
          paymentsPerYear,
          targetAnnualFinanceRepayment: annualFinanceTarget,
        });

        if (valueIsFiniteNumber(inferred)) {
          annualInterestRatePct = inferred;
          inferredParameters.push({
            key: "finance.annualInterestRatePct",
            derivedValue: roundCurrency(annualInterestRatePct),
            method: "calculated_from_quote",
            confidence: "medium",
            note: "Back-solved from quote totals using annuity-with-balloon model.",
          });
          assumptions.push({
            key: "interest_rate_source",
            label: "Interest rate source",
            value: "quote_back_solved",
            inferred: true,
            confidence: "medium",
          });
        }
      }

      if (!valueIsFiniteNumber(annualInterestRatePct) || annualInterestRatePct < 0) {
        annualInterestRatePct = assumptionsConfig.defaultQuoteInterestRatePct;
        issues.push({
          code: "QUOTE_INTEREST_RATE_INFERRED",
          field: "finance.annualInterestRatePct",
          message:
            "Interest rate was not supplied. Applied fallback quote interest assumption.",
          severity: "warning",
        });
        inferredParameters.push({
          key: "finance.annualInterestRatePct",
          derivedValue: annualInterestRatePct,
          method: "fallback_default",
          confidence: "low",
          note: "No reliable quote rate available.",
        });
        assumptions.push({
          key: "default_quote_interest_rate_pct",
          label: "Fallback quote interest rate",
          value: annualInterestRatePct,
          source: assumptionsConfig.source,
          inferred: true,
          confidence: "low",
        });
      }
    }
  }

  if (annualInterestRatePct < 0) {
    issues.push({
      code: "NEGATIVE_INTEREST_RATE",
      field: "finance.annualInterestRatePct",
      message: "Interest rate cannot be negative.",
      severity: "error",
    });
  }

  const fbtYearDays = input.taxOptions.fbtYearDays ?? fbtConfig.defaultFbtYearDays;
  if (![365, 366].includes(fbtYearDays)) {
    issues.push({
      code: "INVALID_FBT_YEAR_DAYS",
      field: "taxOptions.fbtYearDays",
      message: "FBT year days must be 365 or 366.",
      severity: "error",
    });
  }

  const daysAvailable =
    input.taxOptions.daysAvailableForPrivateUseInFbtYear ?? fbtYearDays;
  if (daysAvailable < 0 || daysAvailable > fbtYearDays) {
    issues.push({
      code: "INVALID_DAYS_AVAILABLE",
      field: "taxOptions.daysAvailableForPrivateUseInFbtYear",
      message: "Days available must be within 0..fbtYearDays.",
      severity: "error",
    });
  }

  const fbtStatutoryRate =
    input.taxOptions.fbtStatutoryRateOverride ?? fbtConfig.statutoryRate;
  if (fbtStatutoryRate < 0 || fbtStatutoryRate > 1) {
    issues.push({
      code: "INVALID_FBT_RATE",
      field: "taxOptions.fbtStatutoryRateOverride",
      message: "FBT statutory rate must be between 0 and 1.",
      severity: "error",
    });
  }

  if (errorIssues(issues).length > 0) {
    return {
      ok: false,
      validationIssues: issues,
      lease: null,
      fbt: null,
      packaging: null,
      taxComparison: null,
      cashflow: null,
      buyOutrightComparison: null,
      assumptions,
      inferredParameters,
    };
  }

  const financedAmount = input.vehicle.purchasePriceInclGst + input.finance.establishmentFee;
  const termYears = input.finance.termMonths / 12;
  const periods = termYears * paymentsPerYear;
  const periodicRate = annualInterestRatePct / 100 / paymentsPerYear;
  const periodicFinanceRepayment = computePeriodicRepayment(
    financedAmount,
    residualValue,
    periodicRate,
    periods,
  );
  const annualFinanceRepayment = periodicFinanceRepayment * paymentsPerYear;
  const totalFinanceRepaymentsExcludingResidual = periodicFinanceRepayment * periods;
  const totalInterestEstimate =
    totalFinanceRepaymentsExcludingResidual + residualValue - financedAmount;

  const lease: LeaseRepaymentBreakdown = {
    financedAmount: roundCurrency(financedAmount),
    residualValue: roundCurrency(residualValue),
    residualSource,
    periodicFinanceRepayment: roundCurrency(periodicFinanceRepayment),
    annualFinanceRepayment: roundCurrency(annualFinanceRepayment),
    totalFinanceRepaymentsExcludingResidual: roundCurrency(
      totalFinanceRepaymentsExcludingResidual,
    ),
    totalInterestEstimate: roundCurrency(totalInterestEstimate),
  };

  const baseValueForFbt =
    input.vehicle.baseValueForFbt ?? input.vehicle.purchasePriceInclGst;
  const grossTaxableValueBeforeExemptions = Math.max(
    0,
    (baseValueForFbt * fbtStatutoryRate * daysAvailable) / fbtYearDays,
  );
  const evStatus = isEvFbtExempt(input);
  const taxableValueAfterEvExemption = evStatus.applied
    ? 0
    : grossTaxableValueBeforeExemptions;
  const employeeContributionAppliedForEcm = input.packaging.useEcm
    ? taxableValueAfterEvExemption
    : 0;
  const taxableValueAfterEcm = Math.max(
    0,
    taxableValueAfterEvExemption - employeeContributionAppliedForEcm,
  );

  const fbt: FbtBreakdown = {
    method: "statutory_formula",
    statutoryRateApplied: roundToDp(fbtStatutoryRate, 6),
    baseValueForFbt: roundCurrency(baseValueForFbt),
    daysAvailable,
    fbtYearDays,
    grossTaxableValueBeforeExemptions: roundCurrency(grossTaxableValueBeforeExemptions),
    evExemptionApplied: evStatus.applied,
    evExemptionReason: evStatus.reason,
    taxableValueAfterEvExemption: roundCurrency(taxableValueAfterEvExemption),
    employeeContributionAppliedForEcm: roundCurrency(employeeContributionAppliedForEcm),
    taxableValueAfterEcm: roundCurrency(taxableValueAfterEcm),
    estimatedEmployerFbtTaxableValueFinal: roundCurrency(taxableValueAfterEcm),
  };

  const annualRunningCostsPackaged = input.packaging.includeRunningCostsInPackage
    ? input.runningCosts.annualRegistration +
      input.runningCosts.annualInsurance +
      input.runningCosts.annualMaintenance +
      input.runningCosts.annualTyres +
      input.runningCosts.annualFuelOrElectricity +
      input.runningCosts.annualOtherEligibleCarExpenses
    : 0;
  const annualFinanceRepaymentsPackaged =
    annualFinanceRepayment + input.finance.monthlyAccountKeepingFee * 12;
  const annualPackageCostBeforeEcm =
    annualRunningCostsPackaged + annualFinanceRepaymentsPackaged;
  const annualPostTaxDeduction = employeeContributionAppliedForEcm;
  const annualPreTaxDeduction = Math.max(
    0,
    annualPackageCostBeforeEcm - annualPostTaxDeduction,
  );

  const packagedTaxableIncome = input.salary.grossAnnualSalary - annualPreTaxDeduction;
  if (packagedTaxableIncome < 0) {
    issues.push({
      code: "NEGATIVE_PACKAGED_TAXABLE_INCOME",
      field: "salary.grossAnnualSalary",
      message: "Packaged taxable income cannot be negative.",
      severity: "error",
    });
  }

  const totalAnnualDeductions = annualPreTaxDeduction + annualPostTaxDeduction;
  if (
    totalAnnualDeductions >
    input.salary.grossAnnualSalary * assumptionsConfig.highDeductionWarningRatioOfSalary
  ) {
    issues.push({
      code: "HIGH_DEDUCTION_RATIO",
      field: "packaging",
      message: "Total annual deductions are high relative to salary.",
      severity: "warning",
    });
  }

  if (errorIssues(issues).length > 0) {
    return {
      ok: false,
      validationIssues: issues,
      lease: null,
      fbt: null,
      packaging: null,
      taxComparison: null,
      cashflow: null,
      buyOutrightComparison: null,
      assumptions,
      inferredParameters,
    };
  }

  const medicareRate =
    input.taxOptions.medicareLevyRateOverride ?? medicareTable.levyRate;

  const baselineIncomeTax = computeIncomeTax(input.salary.grossAnnualSalary, taxTable);
  const packagedIncomeTax = computeIncomeTax(packagedTaxableIncome, taxTable);
  const baselineMedicareLevy = input.taxOptions.includeMedicareLevy
    ? input.salary.grossAnnualSalary * medicareRate
    : 0;
  const packagedMedicareLevy = input.taxOptions.includeMedicareLevy
    ? packagedTaxableIncome * medicareRate
    : 0;

  const taxComparison: TaxComparisonBreakdown = {
    baselineTaxableIncome: roundCurrency(input.salary.grossAnnualSalary),
    packagedTaxableIncome: roundCurrency(packagedTaxableIncome),
    baselineIncomeTax: roundCurrency(baselineIncomeTax),
    packagedIncomeTax: roundCurrency(packagedIncomeTax),
    baselineMedicareLevy: roundCurrency(baselineMedicareLevy),
    packagedMedicareLevy: roundCurrency(packagedMedicareLevy),
    taxAndLevySavings: roundCurrency(
      baselineIncomeTax +
        baselineMedicareLevy -
        (packagedIncomeTax + packagedMedicareLevy),
    ),
  };

  const payPeriodsPerYear = payPeriodsForFrequency(input.salary.payFrequency);
  const packaging = {
    annualRunningCostsPackaged: roundCurrency(annualRunningCostsPackaged),
    annualFinanceRepaymentsPackaged: roundCurrency(annualFinanceRepaymentsPackaged),
    annualPackageCostBeforeEcm: roundCurrency(annualPackageCostBeforeEcm),
    annualPreTaxDeduction: roundCurrency(annualPreTaxDeduction),
    annualPostTaxDeduction: roundCurrency(annualPostTaxDeduction),
    perPayPreTaxDeduction: roundCurrency(annualPreTaxDeduction / payPeriodsPerYear),
    perPayPostTaxDeduction: roundCurrency(annualPostTaxDeduction / payPeriodsPerYear),
    payPeriodsPerYear,
  };

  const baselineAnnualNetCash =
    input.salary.grossAnnualSalary - baselineIncomeTax - baselineMedicareLevy;
  const packagedAnnualNetCashBeforeOutOfPackageCosts =
    input.salary.grossAnnualSalary -
    annualPreTaxDeduction -
    annualPostTaxDeduction -
    packagedIncomeTax -
    packagedMedicareLevy;
  const annualNetBenefitEstimate =
    packagedAnnualNetCashBeforeOutOfPackageCosts - baselineAnnualNetCash;

  const cashflow = {
    baselineAnnualNetCash: roundCurrency(baselineAnnualNetCash),
    packagedAnnualNetCashBeforeOutOfPackageCosts: roundCurrency(
      packagedAnnualNetCashBeforeOutOfPackageCosts,
    ),
    annualNetBenefitEstimate: roundCurrency(annualNetBenefitEstimate),
    baselinePerPayNetCash: roundCurrency(baselineAnnualNetCash / payPeriodsPerYear),
    packagedPerPayNetCash: roundCurrency(
      packagedAnnualNetCashBeforeOutOfPackageCosts / payPeriodsPerYear,
    ),
    perPayNetBenefitEstimate: roundCurrency(
      annualNetBenefitEstimate / payPeriodsPerYear,
    ),
  };

  const buyOutrightComparison = computeBuyOutrightComparison({
    input,
    lease,
    taxComparison,
  });

  const quotedAnnual = input.quoteContext?.quotedAnnualDeductionTotal;
  if (valueIsFiniteNumber(quotedAnnual)) {
    const diff = Math.abs(annualPackageCostBeforeEcm - quotedAnnual);
    const ratio = quotedAnnual === 0 ? 0 : diff / quotedAnnual;
    if (ratio > assumptionsConfig.quoteModelVarianceModerateRatio) {
      issues.push({
        code: "QUOTE_MODEL_VARIANCE_HIGH",
        field: "quoteContext.quotedAnnualDeductionTotal",
        message: "Quote/model variance is above high tolerance.",
        severity: "warning",
      });
    } else if (ratio > assumptionsConfig.quoteModelVarianceToleranceRatio) {
      issues.push({
        code: "QUOTE_MODEL_VARIANCE_MODERATE",
        field: "quoteContext.quotedAnnualDeductionTotal",
        message: "Quote/model variance is above tolerance.",
        severity: "warning",
      });
    }
  }

  assumptions.push(
    {
      key: "income_tax_year",
      label: "Income tax year",
      value: input.taxOptions.incomeTaxYear,
      source: taxTable.source,
    },
    {
      key: "medicare_rate",
      label: "Medicare levy rate",
      value: medicareRate,
      source: medicareTable.source,
    },
    {
      key: "fbt_statuatory_rate",
      label: "FBT statutory rate",
      value: fbtStatutoryRate,
      source: fbtConfig.source,
    },
    {
      key: "residual_source",
      label: "Residual source",
      value: residualSource,
      source: residualConfig.source,
    },
  );

  return {
    ok: true,
    validationIssues: issues,
    lease,
    fbt,
    packaging,
    taxComparison,
    cashflow,
    buyOutrightComparison,
    assumptions,
    inferredParameters,
  };
}
