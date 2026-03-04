import type { FinancialYear, ResidentTaxBracketsTable } from "@/lib/types/financial";
import {
  getMedicareTable,
  getSuperGuaranteeRate,
  getTaxTable,
} from "./data";
import type {
  IncomeFrequency,
  IncomeTaxBreakdown,
  IncomeTaxCalculatorInput,
  IncomeTaxCalculatorOutput,
  IncomeTaxValidationIssue,
} from "./types";

function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

function periodsPerYear(frequency: IncomeFrequency): number {
  if (frequency === "weekly") return 52;
  if (frequency === "fortnightly") return 26;
  if (frequency === "monthly") return 12;
  return 1;
}

function toAnnual(value: number, frequency: IncomeFrequency): number {
  return value * periodsPerYear(frequency);
}

function fromAnnual(value: number, frequency: IncomeFrequency): number {
  return value / periodsPerYear(frequency);
}

function computeIncomeTaxAnnual(
  annualTaxableIncome: number,
  taxTable: ResidentTaxBracketsTable,
): number {
  const bracket =
    taxTable.brackets.find((item) => {
      if (item.upperThreshold === null) return annualTaxableIncome >= item.threshold;
      return annualTaxableIncome >= item.threshold && annualTaxableIncome <= item.upperThreshold;
    }) ?? taxTable.brackets[taxTable.brackets.length - 1];

  const thresholdFloor = bracket.threshold === 0 ? 0 : bracket.threshold - 1;
  return Math.max(
    0,
    bracket.baseTax + (annualTaxableIncome - thresholdFloor) * bracket.marginalRate,
  );
}

function invalidResult(params: {
  financialYear: FinancialYear;
  salaryType: IncomeTaxCalculatorInput["salaryType"];
  frequency: IncomeFrequency;
  sgRate: number;
  issues: IncomeTaxValidationIssue[];
}): IncomeTaxCalculatorOutput {
  const zero: IncomeTaxBreakdown = {
    baseSalary: 0,
    bonusIncome: 0,
    additionalIncome: 0,
    taxableIncome: 0,
    employerSuper: 0,
    totalPackage: 0,
    incomeTax: 0,
    medicareLevy: 0,
    totalWithheld: 0,
    netIncome: 0,
  };
  return {
    isValid: false,
    validationIssues: params.issues,
    financialYear: params.financialYear,
    sgRate: params.sgRate,
    salaryType: params.salaryType,
    annual: zero,
    selectedFrequency: params.frequency,
    selected: zero,
    byFrequency: {
      annual: zero,
      monthly: zero,
      fortnightly: zero,
      weekly: zero,
    },
    effectiveTaxRate: 0,
    averageWithholdingRate: 0,
  };
}

function toBreakdownByFrequency(
  annual: IncomeTaxBreakdown,
): Record<IncomeFrequency, IncomeTaxBreakdown> {
  const frequencies: IncomeFrequency[] = ["annual", "monthly", "fortnightly", "weekly"];
  const result = {} as Record<IncomeFrequency, IncomeTaxBreakdown>;
  for (const frequency of frequencies) {
    result[frequency] = {
      baseSalary: roundToCents(fromAnnual(annual.baseSalary, frequency)),
      bonusIncome: roundToCents(fromAnnual(annual.bonusIncome, frequency)),
      additionalIncome: roundToCents(fromAnnual(annual.additionalIncome, frequency)),
      taxableIncome: roundToCents(fromAnnual(annual.taxableIncome, frequency)),
      employerSuper: roundToCents(fromAnnual(annual.employerSuper, frequency)),
      totalPackage: roundToCents(fromAnnual(annual.totalPackage, frequency)),
      incomeTax: roundToCents(fromAnnual(annual.incomeTax, frequency)),
      medicareLevy: roundToCents(fromAnnual(annual.medicareLevy, frequency)),
      totalWithheld: roundToCents(fromAnnual(annual.totalWithheld, frequency)),
      netIncome: roundToCents(fromAnnual(annual.netIncome, frequency)),
    };
  }
  return result;
}

export function calculateIncomeTax(
  input: IncomeTaxCalculatorInput,
): IncomeTaxCalculatorOutput {
  const issues: IncomeTaxValidationIssue[] = [];
  const taxTable = getTaxTable(input.financialYear);
  const medicareTable = getMedicareTable(input.financialYear);
  const defaultSgRate = getSuperGuaranteeRate(input.financialYear);
  const sgRate = input.sgRateOverride ?? defaultSgRate ?? 0;

  if (!taxTable) {
    issues.push({
      field: "financialYear",
      code: "UNSUPPORTED_FINANCIAL_YEAR",
      message: "Unsupported financial year.",
    });
  }
  if (!medicareTable) {
    issues.push({
      field: "financialYear",
      code: "MISSING_MEDICARE_TABLE",
      message: "Medicare levy table not found for selected financial year.",
    });
  }
  if (defaultSgRate === null && input.sgRateOverride === undefined) {
    issues.push({
      field: "financialYear",
      code: "MISSING_SG_RATE",
      message: "Super Guarantee rate is unavailable for selected financial year.",
    });
  }
  if (!Number.isFinite(input.amount) || input.amount < 0) {
    issues.push({
      field: "amount",
      code: "INVALID_AMOUNT",
      message: "Amount must be zero or greater.",
    });
  }
  if (!Number.isFinite(input.bonusPercent) || input.bonusPercent < 0) {
    issues.push({
      field: "bonusPercent",
      code: "INVALID_BONUS_PERCENT",
      message: "Bonus percent must be zero or greater.",
    });
  }
  if (!Number.isFinite(input.additionalIncome) || input.additionalIncome < 0) {
    issues.push({
      field: "additionalIncome",
      code: "INVALID_ADDITIONAL_INCOME",
      message: "Additional income must be zero or greater.",
    });
  }
  if (!Number.isFinite(sgRate) || sgRate < 0 || sgRate > 1) {
    issues.push({
      field: "sgRateOverride",
      code: "INVALID_SG_RATE",
      message: "Super Guarantee rate must be between 0 and 1.",
    });
  }

  if (issues.length > 0 || !taxTable || !medicareTable) {
    return invalidResult({
      financialYear: input.financialYear,
      salaryType: input.salaryType,
      frequency: input.frequency,
      sgRate,
      issues,
    });
  }

  const annualEnteredAmount = toAnnual(input.amount, input.frequency);
  const annualBaseSalary =
    input.salaryType === "EXCL_SUPER"
      ? annualEnteredAmount
      : annualEnteredAmount / (1 + sgRate);
  const annualEmployerSuper =
    input.salaryType === "EXCL_SUPER"
      ? annualBaseSalary * sgRate
      : annualEnteredAmount - annualBaseSalary;
  const annualTotalPackage = annualBaseSalary + annualEmployerSuper;
  const annualBonusIncome = annualBaseSalary * (input.bonusPercent / 100);
  const annualAdditionalIncome = toAnnual(input.additionalIncome, input.frequency);
  const annualTaxableIncome = annualBaseSalary + annualBonusIncome + annualAdditionalIncome;
  const annualIncomeTax = computeIncomeTaxAnnual(annualTaxableIncome, taxTable);
  const annualMedicareLevy = annualTaxableIncome * medicareTable.levyRate;
  const annualTotalWithheld = annualIncomeTax + annualMedicareLevy;
  const annualNetIncome = annualTaxableIncome - annualTotalWithheld;

  const annual: IncomeTaxBreakdown = {
    baseSalary: roundToCents(annualBaseSalary),
    bonusIncome: roundToCents(annualBonusIncome),
    additionalIncome: roundToCents(annualAdditionalIncome),
    taxableIncome: roundToCents(annualTaxableIncome),
    employerSuper: roundToCents(annualEmployerSuper),
    totalPackage: roundToCents(annualTotalPackage),
    incomeTax: roundToCents(annualIncomeTax),
    medicareLevy: roundToCents(annualMedicareLevy),
    totalWithheld: roundToCents(annualTotalWithheld),
    netIncome: roundToCents(annualNetIncome),
  };

  const byFrequency = toBreakdownByFrequency(annual);
  const selected = byFrequency[input.frequency];
  const effectiveTaxRate =
    annual.taxableIncome === 0 ? 0 : annual.incomeTax / annual.taxableIncome;
  const averageWithholdingRate =
    annual.taxableIncome === 0 ? 0 : annual.totalWithheld / annual.taxableIncome;

  return {
    isValid: true,
    validationIssues: [],
    financialYear: input.financialYear,
    sgRate: roundToCents(sgRate * 100) / 100,
    salaryType: input.salaryType,
    annual,
    selectedFrequency: input.frequency,
    selected,
    byFrequency,
    effectiveTaxRate: roundToCents(effectiveTaxRate),
    averageWithholdingRate: roundToCents(averageWithholdingRate),
  };
}
