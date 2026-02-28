import type { NovatedLeaseCalculatorInput } from "./types";
import type { NovatedLeaseFormState } from "./formState";

function parseNumber(value: string): number {
  if (value.trim() === "") {
    return Number.NaN;
  }
  return Number(value);
}

export function applyInputModeAdapter(
  state: NovatedLeaseFormState,
  input: NovatedLeaseCalculatorInput,
): NovatedLeaseCalculatorInput {
  if (state.im !== "quote") {
    return input;
  }

  const quotedMonthlyLeasePayment = parseNumber(state.qmp);
  const quotedMonthlyAdminFee = parseNumber(state.qmf);
  const annualRunningCosts =
    input.runningCosts.annualRegistration +
    input.runningCosts.annualInsurance +
    input.runningCosts.annualMaintenance +
    input.runningCosts.annualTyres +
    input.runningCosts.annualFuelOrElectricity +
    input.runningCosts.annualOtherEligibleCarExpenses;

  const monthlyAdminFee = Number.isFinite(quotedMonthlyAdminFee)
    ? quotedMonthlyAdminFee
    : input.finance.monthlyAccountKeepingFee;
  const quotedAnnualDeductionTotal =
    quotedMonthlyLeasePayment * 12 +
    monthlyAdminFee * 12 +
    (input.packaging.includeRunningCostsInPackage ? annualRunningCosts : 0);

  return {
    ...input,
    finance: {
      ...input.finance,
      annualInterestRatePct: Number.NaN,
      monthlyAccountKeepingFee: monthlyAdminFee,
    },
    quoteContext: {
      ...input.quoteContext,
      quoteListsInterestRate: false,
      quotedPayPeriodDeductionTotal: undefined,
      quotedAnnualDeductionTotal: Number.isFinite(quotedAnnualDeductionTotal)
        ? quotedAnnualDeductionTotal
        : input.quoteContext?.quotedAnnualDeductionTotal,
      quotedMonthlyAdminFee: Number.isFinite(monthlyAdminFee)
        ? monthlyAdminFee
        : input.quoteContext?.quotedMonthlyAdminFee,
    },
  };
}
