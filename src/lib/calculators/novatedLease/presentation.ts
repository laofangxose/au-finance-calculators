import assumptionsConfig from "../../../data/au/novated-lease/assumptions.json";
import type { NovatedLeaseCalculatorOutput } from "./types";

function roundCurrency(value: number): number {
  const factor = 10 ** assumptionsConfig.roundingPrecisionDp;
  return Math.round(value * factor) / factor;
}

export type NovatedLeaseHeadlineMetrics = {
  monthlyOutOfPocket: number;
  totalEffectiveAnnualCost: number;
  residualValue: number;
};

export function getNovatedLeaseHeadlineMetrics(
  result: NovatedLeaseCalculatorOutput,
): NovatedLeaseHeadlineMetrics | null {
  if (!result.ok || !result.packaging || !result.taxComparison || !result.lease) {
    return null;
  }

  const annualOutOfPocket =
    result.packaging.annualPreTaxDeduction + result.packaging.annualPostTaxDeduction;

  return {
    monthlyOutOfPocket: roundCurrency(annualOutOfPocket / 12),
    totalEffectiveAnnualCost: roundCurrency(
      result.packaging.annualPackageCostBeforeEcm - result.taxComparison.taxAndLevySavings,
    ),
    residualValue: result.lease.residualValue,
  };
}
