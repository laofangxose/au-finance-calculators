import { Suspense } from "react";
import type { Metadata } from "next";
import { LoanRepaymentCalculator } from "@/components/loanRepayment/LoanRepaymentCalculator";

export const metadata: Metadata = {
  title: "Loan Repayment",
};

export default function LoanRepaymentPage() {
  return (
    <Suspense fallback={null}>
      <LoanRepaymentCalculator />
    </Suspense>
  );
}
