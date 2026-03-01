import { describe, expect, it } from "vitest";
import { calculateNovatedLease } from "./calculateNovatedLease";
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

describe("calculateNovatedLease comparison contract", () => {
  it("returns buyOutrightComparison for valid inputs", () => {
    const result = calculateNovatedLease(buildBaseInput());
    expect(result.ok).toBe(true);
    expect(result.buyOutrightComparison).not.toBeNull();
  });

  it("returns null buyOutrightComparison when validation fails", () => {
    const input = buildBaseInput();
    input.vehicle.purchasePriceInclGst = -1;
    const result = calculateNovatedLease(input);
    expect(result.ok).toBe(false);
    expect(result.buyOutrightComparison).toBeNull();
  });

  it("includes running costs in buy-outright total", () => {
    const input = buildBaseInput();
    input.finance.establishmentFee = 7500;

    const result = calculateNovatedLease(input);
    expect(result.ok).toBe(true);
    const annualRunningCosts =
      input.runningCosts.annualRegistration +
      input.runningCosts.annualInsurance +
      input.runningCosts.annualMaintenance +
      input.runningCosts.annualTyres +
      input.runningCosts.annualFuelOrElectricity +
      input.runningCosts.annualOtherEligibleCarExpenses;
    const expectedRunningCostsOverTerm =
      annualRunningCosts * (input.finance.termMonths / 12);

    expect(result.buyOutrightComparison?.outrightRunningCostsOverTerm).toBe(
      expectedRunningCostsOverTerm,
    );
    expect(result.buyOutrightComparison?.totalCashOutlayOverTerm).toBe(
      input.vehicle.purchasePriceInclGst + expectedRunningCostsOverTerm,
    );
  });

  it("uses requested novated total formula", () => {
    const input = buildBaseInput();
    input.comparison = { opportunityCostRatePct: 5 };
    const result = calculateNovatedLease(input);
    const c = result.buyOutrightComparison;
    expect(c).not.toBeNull();
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

    expect(c?.novatedTotalCostOverTerm ?? 0).toBeCloseTo(expectedTotal, 2);
  });

  it("increases opportunity cost benefit when rate increases", () => {
    const lowRate = buildBaseInput();
    lowRate.comparison = { opportunityCostRatePct: 2 };
    const highRate = buildBaseInput();
    highRate.comparison = { opportunityCostRatePct: 8 };

    const lowResult = calculateNovatedLease(lowRate);
    const highResult = calculateNovatedLease(highRate);

    expect(
      highResult.buyOutrightComparison?.estimatedForgoneEarningsOverTerm ?? 0,
    ).toBeGreaterThan(
      lowResult.buyOutrightComparison?.estimatedForgoneEarningsOverTerm ?? 0,
    );
    expect(highResult.buyOutrightComparison?.novatedTotalCostOverTerm ?? 0).toBeLessThan(
      lowResult.buyOutrightComparison?.novatedTotalCostOverTerm ?? 0,
    );
  });

  it("keeps total difference equal to novated total minus outright total", () => {
    const result = calculateNovatedLease(buildBaseInput());
    const c = result.buyOutrightComparison;
    expect(c).not.toBeNull();
    expect(c?.totalCostDifferenceOverTerm ?? 0).toBeCloseTo(
      (c?.novatedTotalCostOverTerm ?? 0) - (c?.totalCashOutlayOverTerm ?? 0),
      2,
    );
  });

  it("ignores running costs in opportunity-cost benefit calculation", () => {
    const lowRunning = buildBaseInput();
    lowRunning.comparison = { opportunityCostRatePct: 5 };

    const highRunning = buildBaseInput();
    highRunning.comparison = { opportunityCostRatePct: 5 };
    highRunning.runningCosts.annualFuelOrElectricity = 25000;
    highRunning.runningCosts.annualMaintenance = 10000;

    const lowResult = calculateNovatedLease(lowRunning);
    const highResult = calculateNovatedLease(highRunning);

    expect(
      highResult.buyOutrightComparison?.estimatedForgoneEarningsOverTerm,
    ).toBe(lowResult.buyOutrightComparison?.estimatedForgoneEarningsOverTerm);
  });
});
