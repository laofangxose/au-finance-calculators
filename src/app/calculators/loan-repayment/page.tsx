import { Suspense } from "react";
import { LoanRepaymentCalculator } from "@/components/loanRepayment/LoanRepaymentCalculator";

export default function LoanRepaymentPage() {
  return (
    <Suspense fallback={null}>
      <LoanRepaymentCalculator />
    </Suspense>
  );
}
