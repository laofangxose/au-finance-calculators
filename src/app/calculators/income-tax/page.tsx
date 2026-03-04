import { Suspense } from "react";
import type { Metadata } from "next";
import { IncomeTaxCalculator } from "@/components/incomeTax/IncomeTaxCalculator";

export const metadata: Metadata = {
  title: "Income Tax",
};

export default function IncomeTaxPage() {
  return (
    <Suspense fallback={null}>
      <IncomeTaxCalculator />
    </Suspense>
  );
}
