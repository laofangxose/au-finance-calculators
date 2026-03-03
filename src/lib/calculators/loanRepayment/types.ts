export type LoanRepaymentMode = "forward" | "reverse";

export type LoanRepaymentFrequency =
  | "weekly"
  | "fortnightly"
  | "monthly"
  | "yearly";
export type LoanRepaymentType = "PI" | "IO";

export type LoanRepaymentField =
  | "principal"
  | "paymentPerPeriod"
  | "annualInterestRatePct"
  | "termYears"
  | "frequency"
  | "offsetBalance"
  | "extraPaymentPerPeriod"
  | "repaymentType";

export type LoanRepaymentValidationIssue = {
  field: LoanRepaymentField;
  code: string;
  message: string;
};

export type LoanRepaymentBaseInput = {
  annualInterestRatePct: number;
  termYears: number;
  frequency: LoanRepaymentFrequency;
  offsetBalance: number;
  extraPaymentPerPeriod: number;
  repaymentType: LoanRepaymentType;
};

export type LoanRepaymentForwardInput = LoanRepaymentBaseInput & {
  principal: number;
};

export type LoanRepaymentReverseInput = LoanRepaymentBaseInput & {
  paymentPerPeriod: number;
};

export type LoanAmortizationRow = {
  periodIndex: number;
  scheduledPayment: number;
  payment: number;
  interest: number;
  principal: number;
  remainingBalance: number;
  totalInterestToDate: number;
  effectiveBalanceForInterest: number;
};

export type LoanRepaymentSummary = {
  totalPaid: number;
  totalInterest: number;
  numberOfPayments: number;
};

export type LoanRepaymentResult = {
  mode: LoanRepaymentMode;
  isValid: boolean;
  validationIssues: LoanRepaymentValidationIssue[];
  paymentPerPeriod: number;
  scheduledPaymentPerPeriod: number;
  principal: number;
  repaymentType: LoanRepaymentType;
  amortizationSchedule: LoanAmortizationRow[];
  summary: LoanRepaymentSummary;
};
