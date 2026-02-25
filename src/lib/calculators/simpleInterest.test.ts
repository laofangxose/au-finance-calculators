import { describe, expect, it } from "vitest";
import {
  calculateSimpleInterest,
  validateSimpleInterestInput,
} from "./simpleInterest";

describe("validateSimpleInterestInput", () => {
  it("returns no errors for valid inputs", () => {
    expect(
      validateSimpleInterestInput({
        principal: 10000,
        annualRatePct: 5,
        termYears: 2,
      }),
    ).toEqual([]);
  });

  it("rejects negative principal", () => {
    expect(
      validateSimpleInterestInput({
        principal: -1,
        annualRatePct: 5,
        termYears: 2,
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "principal" }),
      ]),
    );
  });

  it("rejects negative annual rate", () => {
    expect(
      validateSimpleInterestInput({
        principal: 1000,
        annualRatePct: -0.25,
        termYears: 1,
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "annualRatePct" }),
      ]),
    );
  });
});

describe("calculateSimpleInterest", () => {
  it("calculates interest and total for a standard case", () => {
    expect(
      calculateSimpleInterest({
        principal: 10000,
        annualRatePct: 5,
        termYears: 3,
      }),
    ).toMatchObject({
      interest: 1500,
      totalAmount: 11500,
    });
  });

  it("returns zero interest when rate is zero", () => {
    expect(
      calculateSimpleInterest({
        principal: 2500,
        annualRatePct: 0,
        termYears: 4,
      }),
    ).toMatchObject({
      interest: 0,
      totalAmount: 2500,
    });
  });

  it("supports decimal values", () => {
    const result = calculateSimpleInterest({
      principal: 1234.56,
      annualRatePct: 3.5,
      termYears: 1.5,
    });

    expect(result.interest).toBeCloseTo(64.8144, 6);
    expect(result.totalAmount).toBeCloseTo(1299.3744, 6);
  });

  it("throws for invalid inputs", () => {
    expect(() =>
      calculateSimpleInterest({
        principal: 100,
        annualRatePct: -1,
        termYears: 1,
      }),
    ).toThrow();
  });
});
