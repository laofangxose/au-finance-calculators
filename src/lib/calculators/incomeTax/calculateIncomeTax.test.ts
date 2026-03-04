import { describe, expect, it } from "vitest";
import { calculateIncomeTax } from "./calculateIncomeTax";
import { getSuperGuaranteeRate } from "./data";

describe("calculateIncomeTax", () => {
  it("derives package correctly for EXCL_SUPER", () => {
    const result = calculateIncomeTax({
      financialYear: "FY2025-26",
      amount: 100000,
      frequency: "annual",
      salaryType: "EXCL_SUPER",
      bonusPercent: 0,
      additionalIncome: 0,
    });

    expect(result.isValid).toBe(true);
    expect(result.annual.baseSalary).toBe(100000);
    expect(result.annual.employerSuper).toBeCloseTo(12000, 2);
    expect(result.annual.totalPackage).toBeCloseTo(112000, 2);
  });

  it("derives base salary correctly for INCL_SUPER", () => {
    const result = calculateIncomeTax({
      financialYear: "FY2025-26",
      amount: 112000,
      frequency: "annual",
      salaryType: "INCL_SUPER",
      bonusPercent: 0,
      additionalIncome: 0,
    });

    expect(result.isValid).toBe(true);
    expect(result.annual.baseSalary).toBeCloseTo(100000, 2);
    expect(result.annual.employerSuper).toBeCloseTo(12000, 2);
    expect(result.annual.totalPackage).toBeCloseTo(112000, 2);
  });

  it("calculates bracket boundary tax correctly for FY2024-25", () => {
    const atThreshold = calculateIncomeTax({
      financialYear: "FY2024-25",
      amount: 18200,
      frequency: "annual",
      salaryType: "EXCL_SUPER",
      bonusPercent: 0,
      additionalIncome: 0,
    });
    const aboveThreshold = calculateIncomeTax({
      financialYear: "FY2024-25",
      amount: 18201,
      frequency: "annual",
      salaryType: "EXCL_SUPER",
      bonusPercent: 0,
      additionalIncome: 0,
    });

    expect(atThreshold.annual.incomeTax).toBe(0);
    expect(aboveThreshold.annual.incomeTax).toBeCloseTo(0.16, 2);
  });

  it("applies medicare levy from data table", () => {
    const result = calculateIncomeTax({
      financialYear: "FY2024-25",
      amount: 80000,
      frequency: "annual",
      salaryType: "EXCL_SUPER",
      bonusPercent: 0,
      additionalIncome: 0,
    });

    expect(result.annual.medicareLevy).toBeCloseTo(1600, 2);
  });

  it("converts frequency amounts consistently", () => {
    const annual = calculateIncomeTax({
      financialYear: "FY2025-26",
      amount: 52000,
      frequency: "annual",
      salaryType: "EXCL_SUPER",
      bonusPercent: 0,
      additionalIncome: 0,
    });
    const weekly = calculateIncomeTax({
      financialYear: "FY2025-26",
      amount: 1000,
      frequency: "weekly",
      salaryType: "EXCL_SUPER",
      bonusPercent: 0,
      additionalIncome: 0,
    });

    expect(annual.annual.baseSalary).toBeCloseTo(weekly.annual.baseSalary, 2);
  });

  it("loads SG rates by FY from JSON", () => {
    expect(getSuperGuaranteeRate("FY2024-25")).toBe(0.115);
    expect(getSuperGuaranteeRate("FY2025-26")).toBe(0.12);
    expect(getSuperGuaranteeRate("FY2026-27")).toBe(0.12);
  });

  it("returns typed validation issues for invalid input", () => {
    const result = calculateIncomeTax({
      financialYear: "FY2025-26",
      amount: -1,
      frequency: "monthly",
      salaryType: "EXCL_SUPER",
      bonusPercent: 0,
      additionalIncome: 0,
    });

    expect(result.isValid).toBe(false);
    expect(result.validationIssues.some((item) => item.field === "amount")).toBe(true);
  });

  it("includes bonus in taxable income but not in employer super", () => {
    const noBonus = calculateIncomeTax({
      financialYear: "FY2025-26",
      amount: 100000,
      frequency: "annual",
      salaryType: "EXCL_SUPER",
      bonusPercent: 0,
      additionalIncome: 0,
    });
    const withBonus = calculateIncomeTax({
      financialYear: "FY2025-26",
      amount: 100000,
      frequency: "annual",
      salaryType: "EXCL_SUPER",
      bonusPercent: 10,
      additionalIncome: 0,
    });

    expect(withBonus.annual.bonusIncome).toBeCloseTo(10000, 2);
    expect(withBonus.annual.taxableIncome).toBeCloseTo(110000, 2);
    expect(withBonus.annual.employerSuper).toBeCloseTo(noBonus.annual.employerSuper, 2);
    expect(withBonus.annual.totalWithheld).toBeGreaterThan(noBonus.annual.totalWithheld);
  });

  it("adds additional income at selected frequency into annual taxable income", () => {
    const result = calculateIncomeTax({
      financialYear: "FY2025-26",
      amount: 1000,
      frequency: "monthly",
      salaryType: "EXCL_SUPER",
      bonusPercent: 0,
      additionalIncome: 500,
    });

    expect(result.isValid).toBe(true);
    expect(result.annual.additionalIncome).toBeCloseTo(6000, 2);
    expect(result.annual.taxableIncome).toBeCloseTo(18000, 2);
  });

  it("returns validation issue for negative bonus percent", () => {
    const result = calculateIncomeTax({
      financialYear: "FY2025-26",
      amount: 100000,
      frequency: "annual",
      salaryType: "EXCL_SUPER",
      bonusPercent: -1,
      additionalIncome: 0,
    });

    expect(result.isValid).toBe(false);
    expect(result.validationIssues.some((item) => item.field === "bonusPercent")).toBe(true);
  });

  it("returns validation issue for negative additional income", () => {
    const result = calculateIncomeTax({
      financialYear: "FY2025-26",
      amount: 100000,
      frequency: "annual",
      salaryType: "EXCL_SUPER",
      bonusPercent: 0,
      additionalIncome: -1,
    });

    expect(result.isValid).toBe(false);
    expect(result.validationIssues.some((item) => item.field === "additionalIncome")).toBe(
      true,
    );
  });
});
