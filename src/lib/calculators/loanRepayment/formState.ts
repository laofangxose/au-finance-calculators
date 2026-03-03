import type {
  LoanRepaymentForwardInput,
  LoanRepaymentFrequency,
  LoanRepaymentMode,
  LoanRepaymentReverseInput,
  LoanRepaymentType,
} from "./types";

export type LoanRepaymentFormState = {
  m: string;
  rt: string;
  p: string;
  pm: string;
  r: string;
  y: string;
  f: string;
  ob: string;
  ep: string;
};

export const DEFAULT_LOAN_REPAYMENT_FORM_STATE: LoanRepaymentFormState = {
  m: "forward",
  rt: "PI",
  p: "600000",
  pm: "3500",
  r: "6",
  y: "30",
  f: "monthly",
  ob: "0",
  ep: "0",
};

const VALID_MODES: LoanRepaymentMode[] = ["forward", "reverse"];
const VALID_REPAYMENT_TYPES: LoanRepaymentType[] = ["PI", "IO"];
const VALID_FREQUENCIES: LoanRepaymentFrequency[] = [
  "weekly",
  "fortnightly",
  "monthly",
  "yearly",
];

function parsePositiveNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export function normalizeLoanRepaymentFormState(
  state: LoanRepaymentFormState,
): LoanRepaymentFormState {
  const mode = VALID_MODES.includes(state.m as LoanRepaymentMode)
    ? state.m
    : DEFAULT_LOAN_REPAYMENT_FORM_STATE.m;
  const frequency = VALID_FREQUENCIES.includes(state.f as LoanRepaymentFrequency)
    ? state.f
    : DEFAULT_LOAN_REPAYMENT_FORM_STATE.f;
  const repaymentType = VALID_REPAYMENT_TYPES.includes(state.rt as LoanRepaymentType)
    ? state.rt
    : DEFAULT_LOAN_REPAYMENT_FORM_STATE.rt;
  return {
    ...DEFAULT_LOAN_REPAYMENT_FORM_STATE,
    ...state,
    m: mode,
    f: frequency,
    rt: repaymentType,
  };
}

export type LoanRepaymentFormErrors = Partial<Record<keyof LoanRepaymentFormState, string>>;

export function validateLoanRepaymentFormState(
  state: LoanRepaymentFormState,
): LoanRepaymentFormErrors {
  const errors: LoanRepaymentFormErrors = {};
  const rate = parsePositiveNumber(state.r);
  const years = parsePositiveNumber(state.y);
  const principal = parsePositiveNumber(state.p);
  const payment = parsePositiveNumber(state.pm);
  const offset = parsePositiveNumber(state.ob);
  const extra = parsePositiveNumber(state.ep);

  if (!Number.isFinite(rate) || rate < 0) {
    errors.r = "loanRepayment.validation.rate";
  }
  if (!Number.isFinite(years) || years <= 0) {
    errors.y = "loanRepayment.validation.years";
  }
  if (!Number.isFinite(offset) || offset < 0) {
    errors.ob = "loanRepayment.validation.offsetBalance";
  }
  if (!Number.isFinite(extra) || extra < 0) {
    errors.ep = "loanRepayment.validation.extraPayment";
  }

  if (state.m === "forward") {
    if (!Number.isFinite(principal) || principal <= 0) {
      errors.p = "loanRepayment.validation.principal";
    }
  } else if (!Number.isFinite(payment) || payment <= 0) {
    errors.pm = "loanRepayment.validation.payment";
  }

  return errors;
}

export function toForwardInput(
  state: LoanRepaymentFormState,
): LoanRepaymentForwardInput {
  return {
    principal: Number(state.p),
    annualInterestRatePct: Number(state.r),
    termYears: Number(state.y),
    frequency: state.f as LoanRepaymentFrequency,
    offsetBalance: Number(state.ob),
    extraPaymentPerPeriod: Number(state.ep),
    repaymentType: state.rt as LoanRepaymentType,
  };
}

export function toReverseInput(
  state: LoanRepaymentFormState,
): LoanRepaymentReverseInput {
  return {
    paymentPerPeriod: Number(state.pm),
    annualInterestRatePct: Number(state.r),
    termYears: Number(state.y),
    frequency: state.f as LoanRepaymentFrequency,
    offsetBalance: Number(state.ob),
    extraPaymentPerPeriod: Number(state.ep),
    repaymentType: state.rt as LoanRepaymentType,
  };
}
