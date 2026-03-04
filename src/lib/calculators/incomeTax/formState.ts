import type { FinancialYear } from "@/lib/types/financial";
import type {
  IncomeFrequency,
  IncomeTaxCalculatorInput,
  IncomeTaxFormState,
  SalaryInputType,
} from "./types";

export const DEFAULT_INCOME_TAX_FORM_STATE: IncomeTaxFormState = {
  fy: "FY2025-26",
  amount: "120000",
  freq: "annual",
  salaryType: "EXCL_SUPER",
  bonus: "0",
  addIncome: "0",
};

const VALID_YEARS: FinancialYear[] = ["FY2024-25", "FY2025-26", "FY2026-27"];
const VALID_FREQUENCIES: IncomeFrequency[] = [
  "annual",
  "monthly",
  "fortnightly",
  "weekly",
];
const VALID_SALARY_TYPES: SalaryInputType[] = ["EXCL_SUPER", "INCL_SUPER"];

export type IncomeTaxFormErrors = Partial<Record<keyof IncomeTaxFormState, string>>;

export function normalizeIncomeTaxFormState(
  state: IncomeTaxFormState,
): IncomeTaxFormState {
  const fy = VALID_YEARS.includes(state.fy as FinancialYear)
    ? state.fy
    : DEFAULT_INCOME_TAX_FORM_STATE.fy;
  const freq = VALID_FREQUENCIES.includes(state.freq as IncomeFrequency)
    ? state.freq
    : DEFAULT_INCOME_TAX_FORM_STATE.freq;
  const salaryType = VALID_SALARY_TYPES.includes(state.salaryType as SalaryInputType)
    ? state.salaryType
    : DEFAULT_INCOME_TAX_FORM_STATE.salaryType;

  return {
    ...DEFAULT_INCOME_TAX_FORM_STATE,
    ...state,
    fy,
    freq,
    salaryType,
  };
}

export function validateIncomeTaxFormState(
  state: IncomeTaxFormState,
): IncomeTaxFormErrors {
  const errors: IncomeTaxFormErrors = {};
  const amount = Number(state.amount);
  const bonus = Number(state.bonus);
  const addIncome = Number(state.addIncome);

  if (!Number.isFinite(amount) || amount < 0) {
    errors.amount = "incomeTax.errors.amount";
  }
  if (!VALID_YEARS.includes(state.fy as FinancialYear)) {
    errors.fy = "incomeTax.errors.financialYear";
  }
  if (!VALID_FREQUENCIES.includes(state.freq as IncomeFrequency)) {
    errors.freq = "incomeTax.errors.frequency";
  }
  if (!VALID_SALARY_TYPES.includes(state.salaryType as SalaryInputType)) {
    errors.salaryType = "incomeTax.errors.salaryType";
  }
  if (!Number.isFinite(bonus) || bonus < 0) {
    errors.bonus = "incomeTax.errors.bonusPercent";
  }
  if (!Number.isFinite(addIncome) || addIncome < 0) {
    errors.addIncome = "incomeTax.errors.additionalIncome";
  }

  return errors;
}

export function toIncomeTaxInput(state: IncomeTaxFormState): IncomeTaxCalculatorInput {
  return {
    financialYear: state.fy as FinancialYear,
    amount: Number(state.amount),
    frequency: state.freq as IncomeFrequency,
    salaryType: state.salaryType as SalaryInputType,
    bonusPercent: Number(state.bonus),
    additionalIncome: Number(state.addIncome),
  };
}
