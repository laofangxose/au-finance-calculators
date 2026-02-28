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

describe("getBuyOutrightComparison", () => {
  it("defaults opportunity-cost rate to 0%", () => {
    const input = buildBaseInput();
    const result = calculateNovatedLease(input);
    const comparison = getBuyOutrightComparison(input, result);

    expect(comparison).not.toBeNull();
    expect(comparison?.opportunityCostRateAssumed).toBe(0);
    expect(comparison?.estimatedForgoneEarningsOverTerm).toBe(0);
  });

  it("includes forgone earnings when opportunity-cost rate is provided", () => {
    const baseInput = buildBaseInput();
    const baseResult = calculateNovatedLease(baseInput);
    const baseComparison = getBuyOutrightComparison(baseInput, baseResult);

    const withOpportunity = buildBaseInput();
    withOpportunity.comparison = { opportunityCostRatePct: 5 };
    const withOpportunityResult = calculateNovatedLease(withOpportunity);
    const withOpportunityComparison = getBuyOutrightComparison(
      withOpportunity,
      withOpportunityResult,
    );

    expect(withOpportunityComparison).not.toBeNull();
    expect(withOpportunityComparison?.opportunityCostRateAssumed).toBe(5);
    expect(withOpportunityComparison?.estimatedForgoneEarningsOverTerm).toBe(7500);
    expect(withOpportunityComparison?.monthlyEquivalentCost ?? 0).toBeGreaterThan(
      baseComparison?.monthlyEquivalentCost ?? 0,
    );
  });
});
