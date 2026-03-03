import { Suspense } from "react";
import { NovatedLeaseCalculator } from "@/components/novatedLease/NovatedLeaseCalculator";

export default function NovatedLeasePage() {
  return (
    <Suspense fallback={null}>
      <NovatedLeaseCalculator />
    </Suspense>
  );
}
