import type { FinancialYear } from "@/lib/types/financial";

export type IncomeFrequency = "annual" | "monthly" | "fortnightly" | "weekly";
export type SalaryInputType = "EXCL_SUPER" | "INCL_SUPER";

export type IncomeTaxCalculatorInput = {
  financialYear: FinancialYear;
  amount: number;
  frequency: IncomeFrequency;
  salaryType: SalaryInputType;
  bonusPercent: number;
  additionalIncome: number;
  sgRateOverride?: number;
};

export type IncomeTaxField =
  | "financialYear"
  | "amount"
  | "frequency"
  | "salaryType"
  | "bonusPercent"
  | "additionalIncome"
  | "sgRateOverride";

export type IncomeTaxValidationIssue = {
  field: IncomeTaxField;
  code: string;
  message: string;
};

export type IncomeTaxBreakdown = {
  baseSalary: number;
  bonusIncome: number;
  additionalIncome: number;
  taxableIncome: number;
  employerSuper: number;
  totalPackage: number;
  incomeTax: number;
  medicareLevy: number;
  totalWithheld: number;
  netIncome: number;
};

export type IncomeTaxCalculatorOutput = {
  isValid: boolean;
  validationIssues: IncomeTaxValidationIssue[];
  financialYear: FinancialYear;
  sgRate: number;
  salaryType: SalaryInputType;
  annual: IncomeTaxBreakdown;
  selectedFrequency: IncomeFrequency;
  selected: IncomeTaxBreakdown;
  byFrequency: Record<IncomeFrequency, IncomeTaxBreakdown>;
  effectiveTaxRate: number;
  averageWithholdingRate: number;
};

export type IncomeTaxFormState = {
  fy: string;
  amount: string;
  freq: string;
  salaryType: string;
  bonus: string;
  addIncome: string;
};
