import type { NovatedLeaseFormState } from "@/lib/calculators/novatedLease";

export type FieldUnit =
  | "AUD"
  | "AUD/year"
  | "AUD/month"
  | "%"
  | "days"
  | "months"
  | "date"
  | "none";

export type FieldMeta = {
  label: string;
  description: string;
  unit: FieldUnit;
  formatRule: string;
  validationMessage: string;
};

export const novatedLeaseFieldMeta: Record<keyof NovatedLeaseFormState, FieldMeta> = {
  s: {
    label: "Gross Annual Salary",
    description: "Your pre-package salary before deductions.",
    unit: "AUD/year",
    formatRule: "Number >= 0",
    validationMessage: "Enter salary greater than 0.",
  },
  pf: {
    label: "Pay Frequency",
    description: "How often you are paid.",
    unit: "none",
    formatRule: "One of weekly, fortnightly, monthly",
    validationMessage: "Select a pay frequency.",
  },
  fy: {
    label: "Income Tax Year",
    description: "Tax bracket table version used for estimates.",
    unit: "none",
    formatRule: "One of supported financial years",
    validationMessage: "Select a valid tax year.",
  },
  ml: {
    label: "Include Medicare Levy",
    description: "Apply base Medicare levy estimate.",
    unit: "none",
    formatRule: "Boolean",
    validationMessage: "Select Medicare levy preference.",
  },
  mlr: {
    label: "Medicare Levy Override",
    description: "Optional decimal override (e.g. 0.02).",
    unit: "%",
    formatRule: "Optional number >= 0",
    validationMessage: "Must be a non-negative number.",
  },
  fyd: {
    label: "FBT Year Days",
    description: "Total days in FBT year.",
    unit: "days",
    formatRule: "365 or 366",
    validationMessage: "Enter 365 or 366.",
  },
  dav: {
    label: "Days Available for Private Use",
    description: "Days vehicle was available in FBT year.",
    unit: "days",
    formatRule: "0 to FBT year days",
    validationMessage: "Must be between 0 and FBT year days.",
  },
  fsr: {
    label: "FBT Statutory Rate Override",
    description: "Optional decimal (0 to 1).",
    unit: "%",
    formatRule: "Optional number in range 0..1",
    validationMessage: "Must be between 0 and 1.",
  },
  vt: {
    label: "Vehicle Type",
    description: "Fuel/technology category of the vehicle.",
    unit: "none",
    formatRule: "One of ICE, HEV, PHEV, BEV, FCEV",
    validationMessage: "Select a vehicle type.",
  },
  pp: {
    label: "Vehicle Purchase Price (incl. GST)",
    description: "Drive-away estimate including GST.",
    unit: "AUD",
    formatRule: "Number >= 0",
    validationMessage: "Enter a non-negative purchase price.",
  },
  bv: {
    label: "FBT Base Value (optional)",
    description: "Optional override for FBT base value.",
    unit: "AUD",
    formatRule: "Optional number >= 0",
    validationMessage: "Must be a non-negative number.",
  },
  eve: {
    label: "Vehicle Eligible for EV FBT Exemption",
    description: "Set true only if eligibility conditions are met.",
    unit: "none",
    formatRule: "Boolean",
    validationMessage: "Set eligibility status.",
  },
  fhud: {
    label: "First Held and Used Date (optional)",
    description: "Used for transitional EV/PHEV checks.",
    unit: "date",
    formatRule: "YYYY-MM-DD",
    validationMessage: "Enter a valid date.",
  },
  phex: {
    label: "PHEV Exempt Before 1 Apr 2025",
    description: "Transitional condition for PHEV.",
    unit: "none",
    formatRule: "Boolean",
    validationMessage: "Set true/false.",
  },
  phbc: {
    label: "Binding Commitment Before 1 Apr 2025",
    description: "Second transitional condition for PHEV.",
    unit: "none",
    formatRule: "Boolean",
    validationMessage: "Set true/false.",
  },
  tm: {
    label: "Lease Term",
    description: "Contract length in months.",
    unit: "months",
    formatRule: "12, 24, 36, 48, or 60",
    validationMessage: "Choose a supported term.",
  },
  ir: {
    label: "Interest Rate",
    description: "Nominal annual rate used for lease estimate.",
    unit: "%",
    formatRule: "Number >= 0",
    validationMessage: "Enter a non-negative interest rate.",
  },
  ppy: {
    label: "Payments Per Year",
    description: "Finance payment frequency used in repayment model.",
    unit: "none",
    formatRule: "12, 26, or 52",
    validationMessage: "Select 12, 26, or 52.",
  },
  ef: {
    label: "Establishment Fee",
    description: "Upfront fee included in financed amount in this model.",
    unit: "AUD",
    formatRule: "Number >= 0",
    validationMessage: "Enter a non-negative fee.",
  },
  maf: {
    label: "Monthly Account Keeping Fee",
    description: "Recurring lease administration fee.",
    unit: "AUD/month",
    formatRule: "Number >= 0",
    validationMessage: "Enter a non-negative monthly fee.",
  },
  rvo: {
    label: "Residual Value Override (optional)",
    description: "Optional balloon amount override (must pass minimum checks).",
    unit: "AUD",
    formatRule: "Optional number >= minimum residual and < purchase price",
    validationMessage: "Must satisfy residual constraints.",
  },
  rr: {
    label: "Registration",
    description: "Annual registration cost.",
    unit: "AUD/year",
    formatRule: "Number >= 0",
    validationMessage: "Enter non-negative annual registration.",
  },
  ri: {
    label: "Insurance",
    description: "Annual insurance cost.",
    unit: "AUD/year",
    formatRule: "Number >= 0",
    validationMessage: "Enter non-negative annual insurance.",
  },
  rm: {
    label: "Maintenance",
    description: "Annual servicing/maintenance estimate.",
    unit: "AUD/year",
    formatRule: "Number >= 0",
    validationMessage: "Enter non-negative annual maintenance.",
  },
  rt: {
    label: "Tyres",
    description: "Annual tyre budget.",
    unit: "AUD/year",
    formatRule: "Number >= 0",
    validationMessage: "Enter non-negative annual tyres.",
  },
  rf: {
    label: "Fuel or Electricity",
    description: "Annual energy/fuel spend.",
    unit: "AUD/year",
    formatRule: "Number >= 0",
    validationMessage: "Enter non-negative annual fuel/electricity.",
  },
  ro: {
    label: "Other Eligible Car Expenses",
    description: "Other annual eligible costs in package.",
    unit: "AUD/year",
    formatRule: "Number >= 0",
    validationMessage: "Enter non-negative annual other costs.",
  },
  ue: {
    label: "Use ECM",
    description: "Apply Employee Contribution Method to reduce FBT taxable value.",
    unit: "none",
    formatRule: "Boolean",
    validationMessage: "Set true/false.",
  },
  evt: {
    label: "Apply EV FBT Exemption Toggle",
    description: "Apply EV exemption only if eligibility conditions are true.",
    unit: "none",
    formatRule: "Boolean",
    validationMessage: "Set true/false.",
  },
  irc: {
    label: "Include Running Costs in Package",
    description: "Whether annual running costs are packaged with lease.",
    unit: "none",
    formatRule: "Boolean",
    validationMessage: "Set true/false.",
  },
  qn: {
    label: "Quote Provider Name",
    description: "Optional provider reference for quote-first analysis.",
    unit: "none",
    formatRule: "Text",
    validationMessage: "Optional text.",
  },
  qpp: {
    label: "Quoted Per-Pay Deduction",
    description: "Total deduction quoted per pay cycle.",
    unit: "AUD",
    formatRule: "Optional number >= 0",
    validationMessage: "Must be non-negative.",
  },
  qad: {
    label: "Quoted Annual Deduction",
    description: "Total quoted annual deduction.",
    unit: "AUD",
    formatRule: "Optional number >= 0",
    validationMessage: "Must be non-negative.",
  },
  qrv: {
    label: "Quoted Residual Value",
    description: "Residual value shown in quote, if provided.",
    unit: "AUD",
    formatRule: "Optional number >= 0",
    validationMessage: "Must be non-negative.",
  },
  qrp: {
    label: "Quoted Residual Percentage",
    description: "Residual percentage in decimal form (optional).",
    unit: "%",
    formatRule: "Optional number >= 0",
    validationMessage: "Must be non-negative.",
  },
  qir: {
    label: "Quote Lists Interest Rate",
    description: "Whether quote explicitly discloses a rate.",
    unit: "none",
    formatRule: "Boolean",
    validationMessage: "Set true/false.",
  },
  qri: {
    label: "Quoted Interest Rate",
    description: "Interest rate from provider quote (if shown).",
    unit: "%",
    formatRule: "Optional number >= 0",
    validationMessage: "Must be non-negative.",
  },
  quf: {
    label: "Quoted Upfront Fees",
    description: "Aggregate upfront fees from quote (optional).",
    unit: "AUD",
    formatRule: "Optional number >= 0",
    validationMessage: "Must be non-negative.",
  },
  qmf: {
    label: "Quoted Monthly Admin Fee",
    description: "Monthly quote admin fee (optional).",
    unit: "AUD/month",
    formatRule: "Optional number >= 0",
    validationMessage: "Must be non-negative.",
  },
  qrw: {
    label: "Quote Includes Running Costs",
    description: "Whether quote totals include running costs.",
    unit: "none",
    formatRule: "Boolean",
    validationMessage: "Set true/false.",
  },
  qfu: {
    label: "Quote Includes Fuel",
    description: "Whether quote totals include fuel/electricity.",
    unit: "none",
    formatRule: "Boolean",
    validationMessage: "Set true/false.",
  },
};
