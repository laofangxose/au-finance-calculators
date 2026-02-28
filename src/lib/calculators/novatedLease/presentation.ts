import type {
  BuyOutrightComparisonBreakdown,
  NovatedLeaseCalculatorOutput,
} from "./types";

export type NovatedLeaseHeadlineMetrics = {
  monthlyOutOfPocket: number;
  totalEffectiveAnnualCost: number;
  residualValue: number;
};

export type BuyOutrightComparison = BuyOutrightComparisonBreakdown;

export function getNovatedLeaseHeadlineMetrics(
  result: NovatedLeaseCalculatorOutput,
): NovatedLeaseHeadlineMetrics | null {
  if (!result.ok || !result.buyOutrightComparison || !result.lease) {
    return null;
  }

  return {
    monthlyOutOfPocket: result.buyOutrightComparison.novatedMonthlyOutOfPocket,
    totalEffectiveAnnualCost:
      result.buyOutrightComparison.novatedMonthlyOutOfPocket * 12,
    residualValue: result.lease.residualValue,
  };
}

export function getBuyOutrightComparison(
  result: NovatedLeaseCalculatorOutput,
): BuyOutrightComparison | null {
  if (!result.ok) {
    return null;
  }
  return result.buyOutrightComparison;
}
