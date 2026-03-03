import {
  buildLoanSchedule,
  getNumberOfPayments,
  getPeriodicRate,
  validateForwardInput,
} from "./calculateAmortization";
import type {
  LoanRepaymentResult,
  LoanRepaymentReverseInput,
  LoanRepaymentValidationIssue,
} from "./types";

const EPSILON = 1e-12;
const MAX_SEARCH_CENTS = 10_000_000_000_000;

function buildInvalidResult(
  input: Partial<LoanRepaymentReverseInput>,
  validationIssues: LoanRepaymentValidationIssue[],
): LoanRepaymentResult {
  return {
    mode: "reverse",
    isValid: false,
    validationIssues,
    paymentPerPeriod: input.paymentPerPeriod ?? 0,
    scheduledPaymentPerPeriod: input.paymentPerPeriod ?? 0,
    principal: 0,
    repaymentType: input.repaymentType ?? "PI",
    amortizationSchedule: [],
    summary: {
      totalPaid: 0,
      totalInterest: 0,
      numberOfPayments: 0,
    },
  };
}

function validateReverseInput(
  input: LoanRepaymentReverseInput,
): LoanRepaymentValidationIssue[] {
  const issues = validateForwardInput({
    principal: 1,
    annualInterestRatePct: input.annualInterestRatePct,
    termYears: input.termYears,
    frequency: input.frequency,
    offsetBalance: input.offsetBalance,
    extraPaymentPerPeriod: input.extraPaymentPerPeriod,
    repaymentType: input.repaymentType,
  }).filter((issue) => issue.field !== "principal");

  if (!Number.isFinite(input.paymentPerPeriod) || input.paymentPerPeriod <= 0) {
    issues.push({
      field: "paymentPerPeriod",
      code: "INVALID_PAYMENT",
      message: "Payment per period must be greater than zero.",
    });
  }

  if (input.repaymentType === "IO") {
    issues.push({
      field: "repaymentType",
      code: "REVERSE_IO_NOT_SUPPORTED",
      message: "Reverse mode supports PI only.",
    });
  }

  return issues;
}

export function estimatePrincipalFromPayment(
  input: LoanRepaymentReverseInput,
): number {
  const numberOfPayments = getNumberOfPayments(input.termYears, input.frequency);
  const periodicRate = getPeriodicRate(input.annualInterestRatePct, input.frequency);
  const basePayment = input.paymentPerPeriod + input.extraPaymentPerPeriod;

  if (Math.abs(periodicRate) < EPSILON) {
    return basePayment * numberOfPayments;
  }

  return (basePayment * (1 - Math.pow(1 + periodicRate, -numberOfPayments))) / periodicRate;
}

function canAmortizeByTerm(input: LoanRepaymentReverseInput, principal: number): boolean {
  const schedule = buildLoanSchedule({
    mode: "reverse",
    principal,
    annualInterestRatePct: input.annualInterestRatePct,
    termYears: input.termYears,
    frequency: input.frequency,
    offsetBalance: input.offsetBalance,
    extraPaymentPerPeriod: input.extraPaymentPerPeriod,
    repaymentType: "PI",
    scheduledPaymentOverride: input.paymentPerPeriod,
  });

  if (!schedule.isValid) {
    return false;
  }

  const last = schedule.amortizationSchedule[schedule.amortizationSchedule.length - 1];
  return Boolean(last && last.remainingBalance <= 0);
}

function solvePrincipalByBinarySearch(input: LoanRepaymentReverseInput): number {
  let lowCents = 0;
  let highCents = Math.max(
    100,
    Math.round(estimatePrincipalFromPayment(input) * 100),
  );
  highCents = Math.min(highCents, MAX_SEARCH_CENTS);

  while (highCents < MAX_SEARCH_CENTS && canAmortizeByTerm(input, highCents / 100)) {
    highCents *= 2;
    if (highCents > MAX_SEARCH_CENTS) {
      highCents = MAX_SEARCH_CENTS;
      break;
    }
  }

  while (lowCents < highCents) {
    const midCents = Math.floor((lowCents + highCents + 1) / 2);
    if (canAmortizeByTerm(input, midCents / 100)) {
      lowCents = midCents;
    } else {
      highCents = midCents - 1;
    }
  }

  return lowCents / 100;
}

export function solvePrincipalFromPayment(
  input: LoanRepaymentReverseInput,
): LoanRepaymentResult {
  const validationIssues = validateReverseInput(input);
  if (validationIssues.length > 0) {
    return buildInvalidResult(input, validationIssues);
  }

  const principalEstimate = solvePrincipalByBinarySearch(input);

  const schedule = buildLoanSchedule({
    mode: "reverse",
    principal: principalEstimate,
    annualInterestRatePct: input.annualInterestRatePct,
    termYears: input.termYears,
    frequency: input.frequency,
    offsetBalance: input.offsetBalance,
    extraPaymentPerPeriod: input.extraPaymentPerPeriod,
    repaymentType: "PI",
    scheduledPaymentOverride: input.paymentPerPeriod,
  });

  if (!schedule.isValid) {
    return buildInvalidResult(input, schedule.validationIssues);
  }

  return {
    mode: "reverse",
    isValid: true,
    validationIssues: [],
    paymentPerPeriod: Math.round(input.paymentPerPeriod * 100) / 100,
    scheduledPaymentPerPeriod: Math.round(input.paymentPerPeriod * 100) / 100,
    principal: Math.round(principalEstimate * 100) / 100,
    repaymentType: "PI",
    amortizationSchedule: schedule.amortizationSchedule,
    summary: schedule.summary,
  };
}
