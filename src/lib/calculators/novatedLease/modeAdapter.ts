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

  const quotedMonthlyAdminFee = parseNumber(state.qmf);
  const monthlyAdminFee = Number.isFinite(quotedMonthlyAdminFee)
    ? quotedMonthlyAdminFee
    : input.finance.monthlyAccountKeepingFee;

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
      quotedAnnualDeductionTotal: input.quoteContext?.quotedAnnualDeductionTotal,
      quotedMonthlyAdminFee: Number.isFinite(monthlyAdminFee)
        ? monthlyAdminFee
        : input.quoteContext?.quotedMonthlyAdminFee,
    },
  };
}
