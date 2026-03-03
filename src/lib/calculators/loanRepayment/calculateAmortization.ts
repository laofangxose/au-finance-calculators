import type {
  LoanAmortizationRow,
  LoanRepaymentBaseInput,
  LoanRepaymentForwardInput,
  LoanRepaymentMode,
  LoanRepaymentResult,
  LoanRepaymentValidationIssue,
} from "./types";

const EPSILON = 1e-12;

function toMoney(cents: number): number {
  return cents / 100;
}

function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function paymentsPerYear(frequency: LoanRepaymentBaseInput["frequency"]): number {
  switch (frequency) {
    case "weekly":
      return 52;
    case "fortnightly":
      return 26;
    case "monthly":
      return 12;
    case "yearly":
      return 1;
    default:
      return 12;
  }
}

export function getNumberOfPayments(
  termYears: number,
  frequency: LoanRepaymentBaseInput["frequency"],
): number {
  const count = Math.round(termYears * paymentsPerYear(frequency));
  return Math.max(1, count);
}

export function getPeriodicRate(
  annualInterestRatePct: number,
  frequency: LoanRepaymentBaseInput["frequency"],
): number {
  return annualInterestRatePct / 100 / paymentsPerYear(frequency);
}

export function getForwardScheduledPaymentPerPeriod(
  principal: number,
  annualInterestRatePct: number,
  termYears: number,
  frequency: LoanRepaymentBaseInput["frequency"],
): number {
  const numberOfPayments = getNumberOfPayments(termYears, frequency);
  const periodicRate = getPeriodicRate(annualInterestRatePct, frequency);
  if (Math.abs(periodicRate) < EPSILON) {
    return principal / numberOfPayments;
  }
  const denominator = 1 - Math.pow(1 + periodicRate, -numberOfPayments);
  return (principal * periodicRate) / denominator;
}

type ScheduleBuildInput = {
  mode: LoanRepaymentMode;
  principal: number;
  annualInterestRatePct: number;
  termYears: number;
  frequency: LoanRepaymentBaseInput["frequency"];
  offsetBalance: number;
  extraPaymentPerPeriod: number;
  repaymentType: LoanRepaymentBaseInput["repaymentType"];
  scheduledPaymentOverride?: number;
};

type ScheduleBuildResult = {
  isValid: boolean;
  validationIssues: LoanRepaymentValidationIssue[];
  principal: number;
  paymentPerPeriod: number;
  scheduledPaymentPerPeriod: number;
  repaymentType: LoanRepaymentBaseInput["repaymentType"];
  amortizationSchedule: LoanAmortizationRow[];
  summary: {
    totalPaid: number;
    totalInterest: number;
    numberOfPayments: number;
  };
};

function buildInvalidResult(
  mode: LoanRepaymentMode,
  partialInput: Partial<LoanRepaymentForwardInput>,
  validationIssues: LoanRepaymentValidationIssue[],
): LoanRepaymentResult {
  return {
    mode,
    isValid: false,
    validationIssues,
    paymentPerPeriod: partialInput.extraPaymentPerPeriod ?? 0,
    scheduledPaymentPerPeriod: 0,
    principal: partialInput.principal ?? 0,
    repaymentType: partialInput.repaymentType ?? "PI",
    amortizationSchedule: [],
    summary: {
      totalPaid: 0,
      totalInterest: 0,
      numberOfPayments: 0,
    },
  };
}

export function validateForwardInput(
  input: LoanRepaymentForwardInput,
): LoanRepaymentValidationIssue[] {
  const issues: LoanRepaymentValidationIssue[] = [];

  if (!Number.isFinite(input.principal) || input.principal <= 0) {
    issues.push({
      field: "principal",
      code: "INVALID_PRINCIPAL",
      message: "Principal must be greater than zero.",
    });
  }
  if (
    !Number.isFinite(input.annualInterestRatePct) ||
    input.annualInterestRatePct < 0
  ) {
    issues.push({
      field: "annualInterestRatePct",
      code: "INVALID_RATE",
      message: "Annual interest rate must be zero or greater.",
    });
  }
  if (!Number.isFinite(input.termYears) || input.termYears <= 0) {
    issues.push({
      field: "termYears",
      code: "INVALID_TERM",
      message: "Term years must be greater than zero.",
    });
  }
  if (!Number.isFinite(input.offsetBalance) || input.offsetBalance < 0) {
    issues.push({
      field: "offsetBalance",
      code: "INVALID_OFFSET",
      message: "Offset balance must be zero or greater.",
    });
  }
  if (
    !Number.isFinite(input.extraPaymentPerPeriod) ||
    input.extraPaymentPerPeriod < 0
  ) {
    issues.push({
      field: "extraPaymentPerPeriod",
      code: "INVALID_EXTRA_PAYMENT",
      message: "Extra payment must be zero or greater.",
    });
  }
  if (input.repaymentType !== "PI" && input.repaymentType !== "IO") {
    issues.push({
      field: "repaymentType",
      code: "INVALID_REPAYMENT_TYPE",
      message: "Repayment type must be PI or IO.",
    });
  }

  return issues;
}

export function buildLoanSchedule(input: ScheduleBuildInput): ScheduleBuildResult {
  const numberOfPayments = getNumberOfPayments(input.termYears, input.frequency);
  const periodicRate = getPeriodicRate(input.annualInterestRatePct, input.frequency);

  let remainingBalanceCents = toCents(input.principal);
  const offsetCents = toCents(input.offsetBalance);
  const extraCents = toCents(input.extraPaymentPerPeriod);

  const amortizedScheduledPaymentCents =
    input.repaymentType === "PI"
      ? toCents(
          input.scheduledPaymentOverride ??
            getForwardScheduledPaymentPerPeriod(
              input.principal,
              input.annualInterestRatePct,
              input.termYears,
              input.frequency,
            ),
        )
      : 0;

  let totalPaidCents = 0;
  let totalInterestCents = 0;
  const rows: LoanAmortizationRow[] = [];
  const validationIssues: LoanRepaymentValidationIssue[] = [];

  for (let periodIndex = 1; periodIndex <= numberOfPayments; periodIndex += 1) {
    if (remainingBalanceCents <= 0) {
      break;
    }

    const effectiveBalanceCentsForInterest = Math.max(
      0,
      remainingBalanceCents - offsetCents,
    );
    const interestCents =
      Math.abs(periodicRate) < EPSILON
        ? 0
        : Math.round(effectiveBalanceCentsForInterest * periodicRate);

    const scheduledPaymentCents =
      input.repaymentType === "PI" ? amortizedScheduledPaymentCents : interestCents;
    let totalPaymentCents = scheduledPaymentCents + extraCents;
    let principalPaidCents = totalPaymentCents - interestCents;

    if (input.repaymentType === "PI" && principalPaidCents <= 0) {
      validationIssues.push({
        field: "paymentPerPeriod",
        code: "PAYMENT_TOO_LOW_NEGATIVE_AMORTIZATION",
        message:
          "Payment is too low to cover interest. Increase payment or reduce balance.",
      });
      return {
        isValid: false,
        validationIssues,
        principal: input.principal,
        paymentPerPeriod: toMoney(totalPaymentCents),
        scheduledPaymentPerPeriod: toMoney(scheduledPaymentCents),
        repaymentType: input.repaymentType,
        amortizationSchedule: rows,
        summary: {
          totalPaid: toMoney(totalPaidCents),
          totalInterest: toMoney(totalInterestCents),
          numberOfPayments: numberOfPayments,
        },
      };
    }

    if (input.repaymentType === "IO") {
      principalPaidCents = Math.max(0, principalPaidCents);
    }

    if (principalPaidCents > remainingBalanceCents) {
      principalPaidCents = remainingBalanceCents;
      totalPaymentCents = interestCents + principalPaidCents;
    }

    remainingBalanceCents = Math.max(0, remainingBalanceCents - principalPaidCents);
    totalPaidCents += totalPaymentCents;
    totalInterestCents += interestCents;

    rows.push({
      periodIndex,
      scheduledPayment: toMoney(scheduledPaymentCents),
      payment: toMoney(totalPaymentCents),
      interest: toMoney(interestCents),
      principal: toMoney(principalPaidCents),
      remainingBalance: toMoney(remainingBalanceCents),
      totalInterestToDate: toMoney(totalInterestCents),
      effectiveBalanceForInterest: toMoney(effectiveBalanceCentsForInterest),
    });
  }

  const firstRow = rows[0];
  return {
    isValid: true,
    validationIssues: [],
    principal: Math.round(input.principal * 100) / 100,
    paymentPerPeriod: firstRow?.payment ?? 0,
    scheduledPaymentPerPeriod: firstRow?.scheduledPayment ?? 0,
    repaymentType: input.repaymentType,
    amortizationSchedule: rows,
    summary: {
      totalPaid: toMoney(totalPaidCents),
      totalInterest: toMoney(totalInterestCents),
      numberOfPayments: numberOfPayments,
    },
  };
}

export function calculateAmortization(
  input: LoanRepaymentForwardInput,
): LoanRepaymentResult {
  const validationIssues = validateForwardInput(input);
  if (validationIssues.length > 0) {
    return buildInvalidResult("forward", input, validationIssues);
  }

  const schedule = buildLoanSchedule({
    mode: "forward",
    principal: input.principal,
    annualInterestRatePct: input.annualInterestRatePct,
    termYears: input.termYears,
    frequency: input.frequency,
    offsetBalance: input.offsetBalance,
    extraPaymentPerPeriod: input.extraPaymentPerPeriod,
    repaymentType: input.repaymentType,
  });

  return {
    mode: "forward",
    isValid: schedule.isValid,
    validationIssues: schedule.validationIssues,
    paymentPerPeriod: schedule.paymentPerPeriod,
    scheduledPaymentPerPeriod: schedule.scheduledPaymentPerPeriod,
    principal: schedule.principal,
    repaymentType: schedule.repaymentType,
    amortizationSchedule: schedule.amortizationSchedule,
    summary: schedule.summary,
  };
}
