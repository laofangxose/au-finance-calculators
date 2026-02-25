import { Suspense } from "react";
import { SimpleInterestCalculator } from "@/components/simpleInterest/SimpleInterestCalculator";

export default function SimpleInterestPage() {
  return (
    <Suspense fallback={null}>
      <SimpleInterestCalculator />
    </Suspense>
  );
}
