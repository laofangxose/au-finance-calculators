import { calculateIncomeTax } from "./calculateIncomeTax";
import type { IncomeTaxCalculatorInput, IncomeTaxCalculatorOutput } from "./types";

export type NetToGrossInput = Omit<IncomeTaxCalculatorInput, "amount"> & {
  targetNetAmount: number;
};

export function solveGrossFromNet(input: NetToGrossInput): IncomeTaxCalculatorOutput {
  let low = 0;
  let high = Math.max(1, input.targetNetAmount * 3);

  for (let i = 0; i < 120; i += 1) {
    const midpoint = (low + high) / 2;
    const result = calculateIncomeTax({
      ...input,
      amount: midpoint,
    });

    if (!result.isValid) {
      return result;
    }

    const diff = result.selected.netIncome - input.targetNetAmount;
    if (Math.abs(diff) < 0.01) {
      return result;
    }

    if (diff < 0) {
      low = midpoint;
    } else {
      high = midpoint;
    }
  }

  return calculateIncomeTax({
    ...input,
    amount: (low + high) / 2,
  });
}
