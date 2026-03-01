import { describe, expect, it } from "vitest";
import { calculateNovatedLease } from "./calculateNovatedLease";
import { getBuyOutrightComparison } from "./presentation";
import type { NovatedLeaseCalculatorInput } from "./types";

function buildBaseInput(): NovatedLeaseCalculatorInput {
  return {
    vehicle: {
      vehicleType: "ice",
      purchasePriceInclGst: 50000,
      eligibleForEvFbtExemption: false,
    },
    finance: {
      termMonths: 36,
      annualInterestRatePct: 8.5,
      paymentsPerYear: 12,
      establishmentFee: 500,
      monthlyAccountKeepingFee: 15,
    },
    runningCosts: {
      annualRegistration: 900,
      annualInsurance: 1400,
      annualMaintenance: 800,
      annualTyres: 300,
      annualFuelOrElectricity: 2200,
      annualOtherEligibleCarExpenses: 200,
    },
    salary: {
      grossAnnualSalary: 120000,
      payFrequency: "fortnightly",
    },
    filingProfile: {
      residentForTaxPurposes: true,
      medicareLevyReductionEligible: false,
    },
    taxOptions: {
      incomeTaxYear: "FY2025-26",
      includeMedicareLevy: true,
    },
    packaging: {
      useEcm: true,
      evFbtExemptionToggle: false,
      includeRunningCostsInPackage: true,
    },
  };
}

function computeCompoundedOpportunityBenefitForTest(params: {
  principal: number;
  annualRatePct: number;
  paymentsPerYear: number;
  periods: number;
  periodicRepayment: number;
}): number {
  if (
    params.principal <= 0 ||
    params.annualRatePct <= 0 ||
    params.paymentsPerYear <= 0 ||
    params.periods <= 0
  ) {
    return 0;
  }

  const periodicRate = params.annualRatePct / 100 / params.paymentsPerYear;
  let balance = params.principal;
  let accruedInterest = 0;

  for (let i = 0; i < params.periods; i += 1) {
    const interest = balance * periodicRate;
    balance += interest;
    accruedInterest += interest;
    balance -= params.periodicRepayment;
    if (balance <= 0) {
      break;
    }
  }

  return Math.max(0, accruedInterest);
}

describe("getBuyOutrightComparison", () => {
  it("defaults opportunity-cost rate to 0%", () => {
    const input = buildBaseInput();
    const result = calculateNovatedLease(input);
    const comparison = getBuyOutrightComparison(result);

    expect(comparison).not.toBeNull();
    expect(comparison?.opportunityCostRateAssumed).toBe(0);
    expect(comparison?.estimatedForgoneEarningsOverTerm).toBe(0);
  });

  it("includes forgone earnings when opportunity-cost rate is provided", () => {
    const baseInput = buildBaseInput();
    const baseResult = calculateNovatedLease(baseInput);
    const baseComparison = getBuyOutrightComparison(baseResult);

    const withOpportunity = buildBaseInput();
    withOpportunity.comparison = { opportunityCostRatePct: 5 };
    const withOpportunityResult = calculateNovatedLease(withOpportunity);
    const withOpportunityComparison = getBuyOutrightComparison(withOpportunityResult);
    const paymentsPerYear = withOpportunity.finance.paymentsPerYear ?? 12;
    const periods = Math.max(
      1,
      Math.round((withOpportunity.finance.termMonths / 12) * paymentsPerYear),
    );
    const periodicRepayment =
      (withOpportunityResult.lease?.totalFinanceRepaymentsExcludingResidual ?? 0) /
      periods;
    const expectedCompoundedBenefit = computeCompoundedOpportunityBenefitForTest({
      principal: withOpportunity.vehicle.purchasePriceInclGst,
      annualRatePct: withOpportunity.comparison?.opportunityCostRatePct ?? 0,
      paymentsPerYear,
      periods,
      periodicRepayment,
    });

    expect(withOpportunityComparison).not.toBeNull();
    expect(withOpportunityComparison?.opportunityCostRateAssumed).toBe(5);
    expect(withOpportunityComparison?.estimatedForgoneEarningsOverTerm).toBeCloseTo(
      expectedCompoundedBenefit,
      2,
    );
    expect(withOpportunityComparison?.novatedTotalCostOverTerm ?? 0).toBeLessThan(
      baseComparison?.novatedTotalCostOverTerm ?? 0,
    );
  });

  it("uses requested novated formula: repayments - tax savings + residual - opportunity cost", () => {
    const input = buildBaseInput();
    input.comparison = { opportunityCostRatePct: 5 };
    const result = calculateNovatedLease(input);
    const comparison = getBuyOutrightComparison(result);

    const paymentsPerYear = input.finance.paymentsPerYear ?? 12;
    const periods = Math.max(
      1,
      Math.round((input.finance.termMonths / 12) * paymentsPerYear),
    );
    const periodicRepayment =
      (result.lease?.totalFinanceRepaymentsExcludingResidual ?? 0) / periods;
    const opportunityCost = computeCompoundedOpportunityBenefitForTest({
      principal: input.vehicle.purchasePriceInclGst,
      annualRatePct: input.comparison?.opportunityCostRatePct ?? 0,
      paymentsPerYear,
      periods,
      periodicRepayment,
    });
    const expectedTotal =
      (result.lease?.totalFinanceRepaymentsExcludingResidual ?? 0) -
      (result.taxComparison?.taxAndLevySavings ?? 0) +
      (result.lease?.residualValue ?? 0) -
      opportunityCost;

    expect(comparison).not.toBeNull();
    expect(comparison?.novatedTotalCostOverTerm).toBeCloseTo(expectedTotal, 2);
  });

  it("includes residual value in novated total cost over term", () => {
    const input = buildBaseInput();
    const result = calculateNovatedLease(input);
    const comparison = getBuyOutrightComparison(result);

    const expectedTotal =
      (result.lease?.totalFinanceRepaymentsExcludingResidual ?? 0) -
      (result.taxComparison?.taxAndLevySavings ?? 0) +
      (result.lease?.residualValue ?? 0);

    expect(comparison).not.toBeNull();
    expect(comparison?.novatedTotalCostOverTerm).toBeCloseTo(expectedTotal, 2);
  });

  it("includes running costs in buy-outright total", () => {
    const input = buildBaseInput();
    input.finance.establishmentFee = 12345;
    input.runningCosts.annualFuelOrElectricity = 99999;

    const result = calculateNovatedLease(input);
    const comparison = getBuyOutrightComparison(result);
    const annualRunningCosts =
      input.runningCosts.annualRegistration +
      input.runningCosts.annualInsurance +
      input.runningCosts.annualMaintenance +
      input.runningCosts.annualTyres +
      input.runningCosts.annualFuelOrElectricity +
      input.runningCosts.annualOtherEligibleCarExpenses;
    const expectedOutrightTotal =
      input.vehicle.purchasePriceInclGst +
      annualRunningCosts * (input.finance.termMonths / 12);

    expect(comparison).not.toBeNull();
    expect(comparison?.totalCashOutlayOverTerm).toBeCloseTo(expectedOutrightTotal, 2);
  });
});
