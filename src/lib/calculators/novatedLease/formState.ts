import residualConfig from "../../../data/au/residuals/ato-car-lease-residuals.json";
import type {
  NovatedLeaseCalculatorInput,
  ValidationIssue,
} from "./types";

export type NovatedLeaseFormState = {
  s: string;
  pf: string;
  fy: string;
  ml: string;
  mlr: string;
  fyd: string;
  dav: string;
  fsr: string;
  vt: string;
  pp: string;
  bv: string;
  eve: string;
  fhud: string;
  phex: string;
  phbc: string;
  tm: string;
  ir: string;
  ppy: string;
  ef: string;
  maf: string;
  rvo: string;
  rr: string;
  ri: string;
  rm: string;
  rt: string;
  rf: string;
  ro: string;
  ue: string;
  evt: string;
  irc: string;
  qn: string;
  qpp: string;
  qad: string;
  qrv: string;
  qrp: string;
  qir: string;
  qri: string;
  quf: string;
  qmf: string;
  qrw: string;
  qfu: string;
};

export const NOVATED_LEASE_QUERY_PARAM_MAP = {
  s: "salary.grossAnnualSalary",
  pf: "salary.payFrequency",
  fy: "taxOptions.incomeTaxYear",
  ml: "taxOptions.includeMedicareLevy",
  mlr: "taxOptions.medicareLevyRateOverride",
  fyd: "taxOptions.fbtYearDays",
  dav: "taxOptions.daysAvailableForPrivateUseInFbtYear",
  fsr: "taxOptions.fbtStatutoryRateOverride",
  vt: "vehicle.vehicleType",
  pp: "vehicle.purchasePriceInclGst",
  bv: "vehicle.baseValueForFbt",
  eve: "vehicle.eligibleForEvFbtExemption",
  fhud: "vehicle.firstHeldAndUsedDate",
  phex: "vehicle.wasPhevExemptBefore2025_04_01",
  phbc: "vehicle.hasBindingCommitmentPre2025_04_01",
  tm: "finance.termMonths",
  ir: "finance.annualInterestRatePct",
  ppy: "finance.paymentsPerYear",
  ef: "finance.establishmentFee",
  maf: "finance.monthlyAccountKeepingFee",
  rvo: "finance.residualValueOverride",
  rr: "runningCosts.annualRegistration",
  ri: "runningCosts.annualInsurance",
  rm: "runningCosts.annualMaintenance",
  rt: "runningCosts.annualTyres",
  rf: "runningCosts.annualFuelOrElectricity",
  ro: "runningCosts.annualOtherEligibleCarExpenses",
  ue: "packaging.useEcm",
  evt: "packaging.evFbtExemptionToggle",
  irc: "packaging.includeRunningCostsInPackage",
  qn: "quoteContext.providerName",
  qpp: "quoteContext.quotedPayPeriodDeductionTotal",
  qad: "quoteContext.quotedAnnualDeductionTotal",
  qrv: "quoteContext.quotedResidualValue",
  qrp: "quoteContext.quotedResidualPct",
  qir: "quoteContext.quoteListsInterestRate",
  qri: "quoteContext.quotedInterestRatePct",
  quf: "quoteContext.quotedUpfrontFeesTotal",
  qmf: "quoteContext.quotedMonthlyAdminFee",
  qrw: "quoteContext.quoteIncludesRunningCosts",
  qfu: "quoteContext.quoteIncludesFuel",
} as const;

export const DEFAULT_NOVATED_LEASE_FORM_STATE: NovatedLeaseFormState = {
  s: "120000",
  pf: "fortnightly",
  fy: "FY2025-26",
  ml: "1",
  mlr: "",
  fyd: "365",
  dav: "365",
  fsr: "",
  vt: "bev",
  pp: "50000",
  bv: "",
  eve: "0",
  fhud: "",
  phex: "0",
  phbc: "0",
  tm: "36",
  ir: "8.5",
  ppy: "12",
  ef: "500",
  maf: "15",
  rvo: "",
  rr: "900",
  ri: "1400",
  rm: "800",
  rt: "300",
  rf: "2200",
  ro: "200",
  ue: "1",
  evt: "0",
  irc: "1",
  qn: "",
  qpp: "",
  qad: "",
  qrv: "",
  qrp: "",
  qir: "0",
  qri: "",
  quf: "",
  qmf: "",
  qrw: "1",
  qfu: "1",
};

function parseBoolean(value: string): boolean {
  return value === "1";
}

function parseNumber(value: string): number {
  if (value.trim() === "") {
    return Number.NaN;
  }
  return Number(value);
}

function parseOptionalNumber(value: string): number | undefined {
  if (value.trim() === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function normalizeToBoolString(value: string): string {
  return value === "1" ? "1" : "0";
}

export function normalizeNovatedLeaseFormState(
  partial: NovatedLeaseFormState,
): NovatedLeaseFormState {
  return {
    ...partial,
    ml: normalizeToBoolString(partial.ml),
    eve: normalizeToBoolString(partial.eve),
    phex: normalizeToBoolString(partial.phex),
    phbc: normalizeToBoolString(partial.phbc),
    ue: normalizeToBoolString(partial.ue),
    evt: normalizeToBoolString(partial.evt),
    irc: normalizeToBoolString(partial.irc),
    qir: normalizeToBoolString(partial.qir),
    qrw: normalizeToBoolString(partial.qrw),
    qfu: normalizeToBoolString(partial.qfu),
  };
}

export function toNovatedLeaseInput(
  state: NovatedLeaseFormState,
): NovatedLeaseCalculatorInput {
  return {
    vehicle: {
      vehicleType: state.vt as NovatedLeaseCalculatorInput["vehicle"]["vehicleType"],
      purchasePriceInclGst: parseNumber(state.pp),
      baseValueForFbt: parseOptionalNumber(state.bv),
      eligibleForEvFbtExemption: parseBoolean(state.eve),
      firstHeldAndUsedDate: state.fhud.trim() === "" ? undefined : state.fhud,
      wasPhevExemptBefore2025_04_01: parseBoolean(state.phex),
      hasBindingCommitmentPre2025_04_01: parseBoolean(state.phbc),
    },
    finance: {
      termMonths: parseNumber(state.tm) as 12 | 24 | 36 | 48 | 60,
      annualInterestRatePct: parseNumber(state.ir),
      paymentsPerYear: parseNumber(state.ppy) as 12 | 26 | 52,
      establishmentFee: parseNumber(state.ef),
      monthlyAccountKeepingFee: parseNumber(state.maf),
      residualValueOverride: parseOptionalNumber(state.rvo),
    },
    runningCosts: {
      annualRegistration: parseNumber(state.rr),
      annualInsurance: parseNumber(state.ri),
      annualMaintenance: parseNumber(state.rm),
      annualTyres: parseNumber(state.rt),
      annualFuelOrElectricity: parseNumber(state.rf),
      annualOtherEligibleCarExpenses: parseNumber(state.ro),
    },
    salary: {
      grossAnnualSalary: parseNumber(state.s),
      payFrequency: state.pf as NovatedLeaseCalculatorInput["salary"]["payFrequency"],
    },
    filingProfile: {
      residentForTaxPurposes: true,
      medicareLevyReductionEligible: false,
    },
    taxOptions: {
      incomeTaxYear: state.fy as NovatedLeaseCalculatorInput["taxOptions"]["incomeTaxYear"],
      includeMedicareLevy: parseBoolean(state.ml),
      medicareLevyRateOverride: parseOptionalNumber(state.mlr),
      fbtYearDays: parseNumber(state.fyd) as 365 | 366,
      daysAvailableForPrivateUseInFbtYear: parseNumber(state.dav),
      fbtStatutoryRateOverride: parseOptionalNumber(state.fsr),
    },
    packaging: {
      useEcm: parseBoolean(state.ue),
      evFbtExemptionToggle: parseBoolean(state.evt),
      includeRunningCostsInPackage: parseBoolean(state.irc),
    },
    quoteContext:
      state.qn.trim() === "" &&
      state.qpp.trim() === "" &&
      state.qad.trim() === "" &&
      state.qrv.trim() === "" &&
      state.qrp.trim() === "" &&
      state.qri.trim() === "" &&
      state.quf.trim() === "" &&
      state.qmf.trim() === ""
        ? undefined
        : {
            providerName: state.qn.trim() === "" ? undefined : state.qn,
            quotedPayPeriodDeductionTotal: parseOptionalNumber(state.qpp),
            quotedAnnualDeductionTotal: parseOptionalNumber(state.qad),
            quotedResidualValue: parseOptionalNumber(state.qrv),
            quotedResidualPct: parseOptionalNumber(state.qrp),
            quoteIncludesRunningCosts: parseBoolean(state.qrw),
            quoteIncludesFuel: parseBoolean(state.qfu),
            quoteListsInterestRate: parseBoolean(state.qir),
            quotedInterestRatePct: parseOptionalNumber(state.qri),
            quotedUpfrontFeesTotal: parseOptionalNumber(state.quf),
            quotedMonthlyAdminFee: parseOptionalNumber(state.qmf),
          },
  };
}

function isFiniteNonNegative(value: string): boolean {
  const n = parseNumber(value);
  return Number.isFinite(n) && n >= 0;
}

function isFiniteValue(value: string): boolean {
  const n = parseNumber(value);
  return Number.isFinite(n);
}

function applyFirstError(
  errors: Partial<Record<keyof NovatedLeaseFormState, string>>,
  key: keyof NovatedLeaseFormState,
  message: string,
) {
  if (!errors[key]) {
    errors[key] = message;
  }
}

export function validateNovatedLeaseFormState(
  state: NovatedLeaseFormState,
): Partial<Record<keyof NovatedLeaseFormState, string>> {
  const errors: Partial<Record<keyof NovatedLeaseFormState, string>> = {};

  if (!isFiniteValue(state.s) || parseNumber(state.s) <= 0) {
    applyFirstError(errors, "s", "Gross annual salary must be greater than 0.");
  }
  if (!["weekly", "fortnightly", "monthly"].includes(state.pf)) {
    applyFirstError(errors, "pf", "Pay frequency is required.");
  }
  if (!["FY2024-25", "FY2025-26", "FY2026-27"].includes(state.fy)) {
    applyFirstError(errors, "fy", "Income tax year is required.");
  }

  if (!isFiniteNonNegative(state.pp)) {
    applyFirstError(errors, "pp", "Purchase price must be a non-negative number.");
  }
  if (state.bv.trim() !== "" && !isFiniteNonNegative(state.bv)) {
    applyFirstError(errors, "bv", "FBT base value must be a non-negative number.");
  }
  if (!["ice", "hev", "phev", "bev", "fcev"].includes(state.vt)) {
    applyFirstError(errors, "vt", "Vehicle type is required.");
  }

  if (!["12", "24", "36", "48", "60"].includes(state.tm)) {
    applyFirstError(errors, "tm", "Term months must be one of 12, 24, 36, 48, 60.");
  }
  if (!isFiniteNonNegative(state.ir)) {
    applyFirstError(errors, "ir", "Annual interest rate must be a non-negative number.");
  }
  if (!["12", "26", "52"].includes(state.ppy)) {
    applyFirstError(errors, "ppy", "Payments per year must be one of 12, 26, 52.");
  }
  if (!isFiniteNonNegative(state.ef)) {
    applyFirstError(errors, "ef", "Establishment fee must be a non-negative number.");
  }
  if (!isFiniteNonNegative(state.maf)) {
    applyFirstError(
      errors,
      "maf",
      "Monthly account-keeping fee must be a non-negative number.",
    );
  }

  if (!isFiniteNonNegative(state.rr)) {
    applyFirstError(errors, "rr", "Registration must be a non-negative number.");
  }
  if (!isFiniteNonNegative(state.ri)) {
    applyFirstError(errors, "ri", "Insurance must be a non-negative number.");
  }
  if (!isFiniteNonNegative(state.rm)) {
    applyFirstError(errors, "rm", "Maintenance must be a non-negative number.");
  }
  if (!isFiniteNonNegative(state.rt)) {
    applyFirstError(errors, "rt", "Tyres must be a non-negative number.");
  }
  if (!isFiniteNonNegative(state.rf)) {
    applyFirstError(errors, "rf", "Fuel/electricity must be a non-negative number.");
  }
  if (!isFiniteNonNegative(state.ro)) {
    applyFirstError(errors, "ro", "Other expenses must be a non-negative number.");
  }

  if (!["365", "366"].includes(state.fyd)) {
    applyFirstError(errors, "fyd", "FBT year days must be 365 or 366.");
  }
  if (!isFiniteNonNegative(state.dav)) {
    applyFirstError(errors, "dav", "Days available must be non-negative.");
  } else if (
    isFiniteValue(state.fyd) &&
    parseNumber(state.dav) > parseNumber(state.fyd)
  ) {
    applyFirstError(errors, "dav", "Days available must be <= FBT year days.");
  }
  if (state.mlr.trim() !== "" && !isFiniteNonNegative(state.mlr)) {
    applyFirstError(errors, "mlr", "Medicare levy override must be non-negative.");
  }
  if (state.fsr.trim() !== "") {
    const n = parseNumber(state.fsr);
    if (!Number.isFinite(n) || n < 0 || n > 1) {
      applyFirstError(errors, "fsr", "FBT statutory rate must be within 0..1.");
    }
  }

  if (state.rvo.trim() !== "") {
    const residual = parseNumber(state.rvo);
    const purchasePrice = parseNumber(state.pp);
    if (!Number.isFinite(residual) || residual < 0) {
      applyFirstError(errors, "rvo", "Residual override must be non-negative.");
    } else if (Number.isFinite(purchasePrice) && residual >= purchasePrice) {
      applyFirstError(errors, "rvo", "Residual override must be less than purchase price.");
    } else if (
      Number.isFinite(purchasePrice) &&
      ["12", "24", "36", "48", "60"].includes(state.tm)
    ) {
      const residualPct =
        residualConfig.residualPercentByLeaseYear[String(
          Number(state.tm) / 12,
        ) as "1" | "2" | "3" | "4" | "5"];
      const minimum = purchasePrice * residualPct;
      if (residual < minimum) {
        applyFirstError(
          errors,
          "rvo",
          "Residual override is below the minimum table amount for this term.",
        );
      }
    }
  }

  const optionalNumericFields: Array<keyof NovatedLeaseFormState> = [
    "qpp",
    "qad",
    "qrv",
    "qrp",
    "qri",
    "quf",
    "qmf",
  ];
  for (const key of optionalNumericFields) {
    if (state[key].trim() !== "" && !isFiniteNonNegative(state[key])) {
      applyFirstError(errors, key, "Value must be a non-negative number.");
    }
  }

  return errors;
}

const fieldToQueryKey: Partial<Record<string, keyof NovatedLeaseFormState>> = {
  "salary.grossAnnualSalary": "s",
  "salary.payFrequency": "pf",
  "taxOptions.incomeTaxYear": "fy",
  "taxOptions.medicareLevyRateOverride": "mlr",
  "taxOptions.fbtYearDays": "fyd",
  "taxOptions.daysAvailableForPrivateUseInFbtYear": "dav",
  "taxOptions.fbtStatutoryRateOverride": "fsr",
  "vehicle.vehicleType": "vt",
  "vehicle.purchasePriceInclGst": "pp",
  "vehicle.baseValueForFbt": "bv",
  "finance.termMonths": "tm",
  "finance.annualInterestRatePct": "ir",
  "finance.paymentsPerYear": "ppy",
  "finance.establishmentFee": "ef",
  "finance.monthlyAccountKeepingFee": "maf",
  "finance.residualValueOverride": "rvo",
  "runningCosts.annualRegistration": "rr",
  "runningCosts.annualInsurance": "ri",
  "runningCosts.annualMaintenance": "rm",
  "runningCosts.annualTyres": "rt",
  "runningCosts.annualFuelOrElectricity": "rf",
  "runningCosts.annualOtherEligibleCarExpenses": "ro",
};

export function mapEngineIssuesToFieldErrors(
  issues: ValidationIssue[],
): Partial<Record<keyof NovatedLeaseFormState, string>> {
  const errors: Partial<Record<keyof NovatedLeaseFormState, string>> = {};
  for (const issue of issues) {
    const queryKey = fieldToQueryKey[issue.field];
    if (queryKey && !errors[queryKey] && issue.severity === "error") {
      errors[queryKey] = issue.message;
    }
  }
  return errors;
}
