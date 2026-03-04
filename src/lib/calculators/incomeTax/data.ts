import medicareFy202425 from "../../../data/au/medicare-levy/FY2024-25.json";
import medicareFy202526 from "../../../data/au/medicare-levy/FY2025-26.json";
import medicareFy202627 from "../../../data/au/medicare-levy/FY2026-27.json";
import sgRates from "../../../data/au/super/sg-rates.json";
import taxFy202425 from "../../../data/au/tax/brackets/FY2024-25.json";
import taxFy202526 from "../../../data/au/tax/brackets/FY2025-26.json";
import taxFy202627 from "../../../data/au/tax/brackets/FY2026-27.json";
import type {
  FinancialYear,
  MedicareLevyTable,
  ResidentTaxBracketsTable,
} from "../../types/financial";

const taxTables: Record<FinancialYear, ResidentTaxBracketsTable> = {
  "FY2024-25": taxFy202425 as ResidentTaxBracketsTable,
  "FY2025-26": taxFy202526 as ResidentTaxBracketsTable,
  "FY2026-27": taxFy202627 as ResidentTaxBracketsTable,
};

const medicareTables: Record<FinancialYear, MedicareLevyTable> = {
  "FY2024-25": medicareFy202425 as MedicareLevyTable,
  "FY2025-26": medicareFy202526 as MedicareLevyTable,
  "FY2026-27": medicareFy202627 as MedicareLevyTable,
};

export const supportedFinancialYears = Object.keys(taxTables) as FinancialYear[];

export function getTaxTable(financialYear: FinancialYear) {
  return taxTables[financialYear] ?? null;
}

export function getMedicareTable(financialYear: FinancialYear) {
  return medicareTables[financialYear] ?? null;
}

export function getSuperGuaranteeRate(financialYear: FinancialYear): number | null {
  const rates = sgRates.ratesByFinancialYear as Record<string, number>;
  const value = rates[financialYear];
  return typeof value === "number" ? value : null;
}
