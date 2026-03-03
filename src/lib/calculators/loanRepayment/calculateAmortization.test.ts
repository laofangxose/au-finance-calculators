import { describe, expect, it } from "vitest";
import { calculateAmortization } from "./calculateAmortization";

describe("calculateAmortization", () => {
  it("keeps PI baseline close to known value", () => {
    const result = calculateAmortization({
      principal: 600000,
      annualInterestRatePct: 6,
      termYears: 30,
      frequency: "monthly",
      offsetBalance: 0,
      extraPaymentPerPeriod: 0,
      repaymentType: "PI",
    });

    expect(result.isValid).toBe(true);
    expect(result.scheduledPaymentPerPeriod).toBeCloseTo(3597.3, 1);
    expect(result.amortizationSchedule).toHaveLength(360);
  });

  it("offset reduces total interest for PI", () => {
    const noOffset = calculateAmortization({
      principal: 500000,
      annualInterestRatePct: 6.2,
      termYears: 25,
      frequency: "monthly",
      offsetBalance: 0,
      extraPaymentPerPeriod: 0,
      repaymentType: "PI",
    });
    const withOffset = calculateAmortization({
      principal: 500000,
      annualInterestRatePct: 6.2,
      termYears: 25,
      frequency: "monthly",
      offsetBalance: 50000,
      extraPaymentPerPeriod: 0,
      repaymentType: "PI",
    });

    expect(withOffset.summary.totalInterest).toBeLessThan(noOffset.summary.totalInterest);
  });

  it("extra payment shortens PI loan term", () => {
    const baseline = calculateAmortization({
      principal: 420000,
      annualInterestRatePct: 5.5,
      termYears: 30,
      frequency: "monthly",
      offsetBalance: 0,
      extraPaymentPerPeriod: 0,
      repaymentType: "PI",
    });
    const withExtra = calculateAmortization({
      principal: 420000,
      annualInterestRatePct: 5.5,
      termYears: 30,
      frequency: "monthly",
      offsetBalance: 0,
      extraPaymentPerPeriod: 350,
      repaymentType: "PI",
    });

    expect(withExtra.amortizationSchedule.length).toBeLessThan(
      baseline.amortizationSchedule.length,
    );
  });

  it("IO scheduled payment equals interest when extra is zero", () => {
    const result = calculateAmortization({
      principal: 300000,
      annualInterestRatePct: 6,
      termYears: 2,
      frequency: "monthly",
      offsetBalance: 0,
      extraPaymentPerPeriod: 0,
      repaymentType: "IO",
    });

    expect(result.isValid).toBe(true);
    expect(result.amortizationSchedule[0]?.scheduledPayment).toBeCloseTo(
      result.amortizationSchedule[0]?.interest ?? 0,
      2,
    );
    expect(result.amortizationSchedule.at(-1)?.remainingBalance).toBeCloseTo(300000, 2);
  });

  it("IO with extra reduces balance and interest over time", () => {
    const result = calculateAmortization({
      principal: 300000,
      annualInterestRatePct: 6,
      termYears: 5,
      frequency: "monthly",
      offsetBalance: 0,
      extraPaymentPerPeriod: 1000,
      repaymentType: "IO",
    });

    const first = result.amortizationSchedule[0];
    const last = result.amortizationSchedule.at(-1);
    expect(first).toBeDefined();
    expect(last).toBeDefined();
    expect((last?.remainingBalance ?? 0) < (first?.remainingBalance ?? 0)).toBe(true);
    expect((last?.interest ?? 0) < (first?.interest ?? 0)).toBe(true);
  });

  it("sets interest to zero when offset exceeds balance", () => {
    const result = calculateAmortization({
      principal: 100000,
      annualInterestRatePct: 7,
      termYears: 1,
      frequency: "monthly",
      offsetBalance: 200000,
      extraPaymentPerPeriod: 0,
      repaymentType: "PI",
    });

    expect(result.amortizationSchedule[0]?.interest).toBe(0);
  });

  it("handles zero-rate for PI and IO", () => {
    const pi = calculateAmortization({
      principal: 120000,
      annualInterestRatePct: 0,
      termYears: 10,
      frequency: "monthly",
      offsetBalance: 0,
      extraPaymentPerPeriod: 0,
      repaymentType: "PI",
    });
    const io = calculateAmortization({
      principal: 120000,
      annualInterestRatePct: 0,
      termYears: 10,
      frequency: "monthly",
      offsetBalance: 0,
      extraPaymentPerPeriod: 0,
      repaymentType: "IO",
    });

    expect(pi.isValid).toBe(true);
    expect(pi.summary.totalInterest).toBe(0);
    expect(io.isValid).toBe(true);
    expect(io.summary.totalInterest).toBe(0);
    expect(io.amortizationSchedule[0]?.scheduledPayment).toBe(0);
  });
});
