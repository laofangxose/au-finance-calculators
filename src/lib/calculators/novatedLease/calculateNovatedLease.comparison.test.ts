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

  it("uses car price only for buy-outright total", () => {
    const input = buildBaseInput();
    input.finance.establishmentFee = 7500;

    const result = calculateNovatedLease(input);
    expect(result.ok).toBe(true);
    expect(result.buyOutrightComparison?.totalCashOutlayOverTerm).toBe(
      input.vehicle.purchasePriceInclGst,
    );
  });

  it("uses requested novated total formula", () => {
    const input = buildBaseInput();
    input.comparison = { opportunityCostRatePct: 5 };
    const result = calculateNovatedLease(input);
    const c = result.buyOutrightComparison;
    expect(c).not.toBeNull();
    const termYears = input.finance.termMonths / 12;
    const opportunityCost =
      input.vehicle.purchasePriceInclGst *
      ((input.comparison?.opportunityCostRatePct ?? 0) / 100) *
      termYears;
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
});
