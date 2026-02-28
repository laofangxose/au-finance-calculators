export type FinancialYear = "FY2024-25" | "FY2025-26" | "FY2026-27";

export type TaxBracketRow = {
  threshold: number;
  upperThreshold: number | null;
  baseTax: number;
  marginalRate: number;
};

export type ResidentTaxBracketsTable = {
  financialYear: FinancialYear;
  resident: true;
  currency: "AUD";
  brackets: TaxBracketRow[];
  source: string;
};

export type MedicareLevyTable = {
  financialYear: FinancialYear;
  levyRate: number;
  appliesByDefault: boolean;
  lowIncomeReductionModelled: boolean;
  source: string;
};

export type ResidualValueTable = {
  name: string;
  effectiveLifeYears: number;
  residualPercentByLeaseYear: Record<"1" | "2" | "3" | "4" | "5", number>;
  source: string;
};

export type FbtConfigTable = {
  method: "statutory_formula";
  statutoryRate: number;
  defaultFbtYearDays: 365 | 366;
  evExemption: {
    enabled: boolean;
    phevGeneralExemptionEndedOn: string;
    requiresTransitionalEligibility: boolean;
  };
  source: string;
};
