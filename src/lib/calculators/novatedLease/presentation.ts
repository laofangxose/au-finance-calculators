import type { NovatedLeaseCalculatorInput } from "./types";
import assumptionsConfig from "../../../data/au/novated-lease/assumptions.json";
import lctThresholds from "../../../data/au/lct/thresholds.json";
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

export type BuyOutrightComparison = {
  monthlyEquivalentCost: number;
  totalCashOutlayOverTerm: number;
  novatedMonthlyOutOfPocket: number;
  monthlyDifference: number;
  totalCostDifferenceOverTerm: number;
  opportunityCostRateAssumed: number;
  estimatedLctIncludedInPurchasePrice: number;
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

export function getBuyOutrightComparison(
  input: NovatedLeaseCalculatorInput,
  result: NovatedLeaseCalculatorOutput,
): BuyOutrightComparison | null {
  if (!result.ok || !result.packaging || !result.taxComparison || !result.lease) {
    return null;
  }

  const useFuelEfficientThreshold =
    input.vehicle.vehicleType === "bev" || input.vehicle.vehicleType === "fcev";
  const lctThreshold =
    lctThresholds.thresholdsByFinancialYear[input.taxOptions.incomeTaxYear][
      useFuelEfficientThreshold ? "fuelEfficient" : "other"
    ];
  const estimatedLctIncludedInPurchasePrice =
    input.vehicle.purchasePriceInclGst > lctThreshold
      ? (input.vehicle.purchasePriceInclGst - lctThreshold) *
        (10 / 11) *
        lctThresholds.rate
      : 0;

  const termMonths = input.finance.termMonths;
  const termYears = termMonths / 12;
  const annualRunningCosts =
    input.runningCosts.annualRegistration +
    input.runningCosts.annualInsurance +
    input.runningCosts.annualMaintenance +
    input.runningCosts.annualTyres +
    input.runningCosts.annualFuelOrElectricity +
    input.runningCosts.annualOtherEligibleCarExpenses;

  const opportunityCostRateAssumed = 0;
  const totalCashOutlayOverTerm =
    input.vehicle.purchasePriceInclGst +
    annualRunningCosts * termYears +
    input.finance.establishmentFee;
  const monthlyEquivalentCost = totalCashOutlayOverTerm / termMonths;

  const novatedMonthlyOutOfPocket =
    (result.packaging.annualPreTaxDeduction + result.packaging.annualPostTaxDeduction) / 12;
  const totalCashOutlayPerMonth = totalCashOutlayOverTerm / termMonths;
  const monthlyDifference = novatedMonthlyOutOfPocket - totalCashOutlayPerMonth;
  const totalCostDifferenceOverTerm = monthlyDifference * termMonths;

  return {
    monthlyEquivalentCost: roundCurrency(monthlyEquivalentCost),
    totalCashOutlayOverTerm: roundCurrency(totalCashOutlayOverTerm),
    novatedMonthlyOutOfPocket: roundCurrency(novatedMonthlyOutOfPocket),
    monthlyDifference: roundCurrency(monthlyDifference),
    totalCostDifferenceOverTerm: roundCurrency(totalCostDifferenceOverTerm),
    opportunityCostRateAssumed,
    estimatedLctIncludedInPurchasePrice: roundCurrency(
      estimatedLctIncludedInPurchasePrice,
    ),
  };
}
