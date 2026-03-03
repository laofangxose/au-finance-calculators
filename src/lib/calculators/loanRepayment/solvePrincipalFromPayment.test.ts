import { describe, expect, it } from "vitest";
import { buildLoanSchedule } from "./calculateAmortization";
import { solvePrincipalFromPayment } from "./solvePrincipalFromPayment";

describe("solvePrincipalFromPayment", () => {
  it("reverse PI estimates principal from payment", () => {
    const reverse = solvePrincipalFromPayment({
      paymentPerPeriod: 3597.3,
      annualInterestRatePct: 6,
      termYears: 30,
      frequency: "monthly",
      offsetBalance: 0,
      extraPaymentPerPeriod: 0,
      repaymentType: "PI",
    });

    expect(reverse.isValid).toBe(true);
    expect(reverse.principal).toBeCloseTo(600000, -1);
    expect(reverse.summary.numberOfPayments).toBe(360);
  });

  it("reverse PI responds to offset by allowing higher principal", () => {
    const noOffset = solvePrincipalFromPayment({
      paymentPerPeriod: 3000,
      annualInterestRatePct: 6,
      termYears: 25,
      frequency: "monthly",
      offsetBalance: 0,
      extraPaymentPerPeriod: 0,
      repaymentType: "PI",
    });
    const withOffset = solvePrincipalFromPayment({
      paymentPerPeriod: 3000,
      annualInterestRatePct: 6,
      termYears: 25,
      frequency: "monthly",
      offsetBalance: 50000,
      extraPaymentPerPeriod: 0,
      repaymentType: "PI",
    });

    expect(withOffset.isValid).toBe(true);
    expect(withOffset.principal).toBeGreaterThan(noOffset.principal);
  });

  it("reverse PI rejects IO repayment type", () => {
    const reverse = solvePrincipalFromPayment({
      paymentPerPeriod: 3000,
      annualInterestRatePct: 6,
      termYears: 30,
      frequency: "monthly",
      offsetBalance: 0,
      extraPaymentPerPeriod: 0,
      repaymentType: "IO",
    });

    expect(reverse.isValid).toBe(false);
    expect(reverse.validationIssues.some((x) => x.code === "REVERSE_IO_NOT_SUPPORTED")).toBe(
      true,
    );
  });

  it("returns negative amortization validation when payment is too low", () => {
    const simulated = buildLoanSchedule({
      mode: "reverse",
      principal: 100000,
      scheduledPaymentOverride: 1,
      annualInterestRatePct: 10,
      termYears: 30,
      frequency: "monthly",
      offsetBalance: 0,
      extraPaymentPerPeriod: 0,
      repaymentType: "PI",
    });

    expect(simulated.isValid).toBe(false);
    expect(
      simulated.validationIssues.some((x) => x.code === "PAYMENT_TOO_LOW_NEGATIVE_AMORTIZATION"),
    ).toBe(true);
  });
});
