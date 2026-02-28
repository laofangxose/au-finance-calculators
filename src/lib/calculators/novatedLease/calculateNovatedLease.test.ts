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

describe("calculateNovatedLease", () => {
  it("returns successful output for a valid baseline scenario", () => {
    const result = calculateNovatedLease(buildBaseInput());
    expect(result.ok).toBe(true);
    expect(result.lease).not.toBeNull();
    expect(result.fbt).not.toBeNull();
    expect(result.packaging).not.toBeNull();
    expect(result.taxComparison).not.toBeNull();
    expect(result.cashflow).not.toBeNull();
  });

  it("handles ICE with ECM by reducing final FBT taxable value to zero", () => {
    const result = calculateNovatedLease(buildBaseInput());
    expect(result.ok).toBe(true);
    expect(result.fbt?.taxableValueAfterEcm).toBe(0);
    expect(result.fbt?.employeeContributionAppliedForEcm).toBeGreaterThan(0);
  });

  it("applies EV exemption for eligible BEV when toggle is on", () => {
    const input = buildBaseInput();
    input.vehicle.vehicleType = "bev";
    input.vehicle.eligibleForEvFbtExemption = true;
    input.packaging.evFbtExemptionToggle = true;
    const result = calculateNovatedLease(input);
    expect(result.fbt?.evExemptionApplied).toBe(true);
    expect(result.fbt?.taxableValueAfterEvExemption).toBe(0);
    expect(result.fbt?.employeeContributionAppliedForEcm).toBe(0);
  });

  it("produces larger tax-and-levy savings at high income than low income", () => {
    const lowIncome = buildBaseInput();
    lowIncome.salary.grossAnnualSalary = 55000;
    const highIncome = buildBaseInput();
    highIncome.salary.grossAnnualSalary = 180000;

    const low = calculateNovatedLease(lowIncome);
    const high = calculateNovatedLease(highIncome);

    expect(high.taxComparison?.taxAndLevySavings ?? 0).toBeGreaterThan(
      low.taxComparison?.taxAndLevySavings ?? 0,
    );
  });

  it("supports zero-interest calculation branch", () => {
    const input = buildBaseInput();
    input.finance.annualInterestRatePct = 0;
    const result = calculateNovatedLease(input);
    expect(result.ok).toBe(true);
    expect(result.lease?.totalInterestEstimate).toBeCloseTo(0, 2);
  });

  it("shows different residual and repayment profile for short vs long term", () => {
    const shortTerm = buildBaseInput();
    shortTerm.finance.termMonths = 12;
    const longTerm = buildBaseInput();
    longTerm.finance.termMonths = 60;

    const shortResult = calculateNovatedLease(shortTerm);
    const longResult = calculateNovatedLease(longTerm);

    expect(shortResult.lease?.residualValue ?? 0).toBeGreaterThan(
      longResult.lease?.residualValue ?? 0,
    );
    expect(shortResult.lease?.annualFinanceRepayment ?? 0).toBeGreaterThan(
      longResult.lease?.annualFinanceRepayment ?? 0,
    );
  });

  it("uses residual table by default and supports valid user override", () => {
    const tableResult = calculateNovatedLease(buildBaseInput());
    expect(tableResult.lease?.residualSource).toBe("default_table");

    const overrideInput = buildBaseInput();
    overrideInput.finance.residualValueOverride = 25000;
    const overrideResult = calculateNovatedLease(overrideInput);
    expect(overrideResult.lease?.residualSource).toBe("user_override");
    expect(overrideResult.lease?.residualValue).toBe(25000);
  });

  it("includes running costs and fees in package totals when enabled", () => {
    const withCosts = buildBaseInput();
    withCosts.packaging.includeRunningCostsInPackage = true;
    const noCosts = buildBaseInput();
    noCosts.packaging.includeRunningCostsInPackage = false;

    const withResult = calculateNovatedLease(withCosts);
    const withoutResult = calculateNovatedLease(noCosts);

    expect(withResult.packaging?.annualPackageCostBeforeEcm ?? 0).toBeGreaterThan(
      withoutResult.packaging?.annualPackageCostBeforeEcm ?? 0,
    );
  });

  it("returns validation errors for negative inputs", () => {
    const input = buildBaseInput();
    input.vehicle.purchasePriceInclGst = -1;
    const result = calculateNovatedLease(input);
    expect(result.ok).toBe(false);
    expect(
      result.validationIssues.some((issue) => issue.severity === "error"),
    ).toBe(true);
  });

  it("returns validation errors for missing required salary", () => {
    const input = buildBaseInput();
    input.salary.grossAnnualSalary = Number.NaN;
    const result = calculateNovatedLease(input);
    expect(result.ok).toBe(false);
    expect(
      result.validationIssues.some(
        (issue) => issue.code === "REQUIRED_NUMBER_INVALID",
      ),
    ).toBe(true);
  });

  it("enforces residual minimum validation on invalid override", () => {
    const input = buildBaseInput();
    input.finance.residualValueOverride = 1000;
    const result = calculateNovatedLease(input);
    expect(result.ok).toBe(false);
    expect(
      result.validationIssues.some(
        (issue) => issue.code === "RESIDUAL_BELOW_MINIMUM",
      ),
    ).toBe(true);
  });

  it("applies rounding policy to currency fields", () => {
    const input = buildBaseInput();
    input.finance.establishmentFee = 500.137;
    input.runningCosts.annualInsurance = 1400.555;
    const result = calculateNovatedLease(input);
    expect(result.ok).toBe(true);
    expect(result.lease?.financedAmount).toBe(50500.14);
    expect(result.packaging?.annualRunningCostsPackaged).toBe(5800.56);
  });

  it("falls back to default quote interest when rate is missing and quote is vague", () => {
    const input = buildBaseInput();
    input.finance.annualInterestRatePct = Number.NaN;
    input.quoteContext = {
      providerName: "Opaque Lease Co",
      quoteIncludesRunningCosts: true,
      quoteIncludesFuel: true,
    };
    const result = calculateNovatedLease(input);
    expect(result.ok).toBe(true);
    expect(
      result.inferredParameters.some(
        (item) => item.key === "finance.annualInterestRatePct",
      ),
    ).toBe(true);
  });

  it("can back-solve implied interest rate from quote totals", () => {
    const source = buildBaseInput();
    const sourceResult = calculateNovatedLease(source);
    const quotedAnnual =
      sourceResult.packaging?.annualPackageCostBeforeEcm ?? Number.NaN;

    const input = buildBaseInput();
    input.finance.annualInterestRatePct = Number.NaN;
    input.quoteContext = {
      quotedAnnualDeductionTotal: quotedAnnual,
      quoteIncludesRunningCosts: true,
      quoteIncludesFuel: true,
    };

    const result = calculateNovatedLease(input);
    expect(result.ok).toBe(true);
    const inferred = result.inferredParameters.find(
      (item) => item.key === "finance.annualInterestRatePct",
    );
    expect(inferred).toBeDefined();
    expect(
      typeof inferred?.derivedValue === "number" ? inferred.derivedValue : 0,
    ).toBeGreaterThan(0);
  });
});
