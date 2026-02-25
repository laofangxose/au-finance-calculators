export type SimpleInterestInput = {
  principal: number;
  annualRatePct: number;
  termYears: number;
};

export type SimpleInterestValidationError = {
  field: keyof SimpleInterestInput;
  message: string;
};

export type SimpleInterestResult = {
  principal: number;
  annualRatePct: number;
  termYears: number;
  interest: number;
  totalAmount: number;
};

export function validateSimpleInterestInput(
  input: SimpleInterestInput,
): SimpleInterestValidationError[] {
  const errors: SimpleInterestValidationError[] = [];

  if (!Number.isFinite(input.principal)) {
    errors.push({ field: "principal", message: "Principal must be a number." });
  } else if (input.principal < 0) {
    errors.push({
      field: "principal",
      message: "Principal cannot be negative.",
    });
  }

  if (!Number.isFinite(input.annualRatePct)) {
    errors.push({
      field: "annualRatePct",
      message: "Annual rate must be a number.",
    });
  } else if (input.annualRatePct < 0) {
    errors.push({
      field: "annualRatePct",
      message: "Annual rate cannot be negative.",
    });
  }

  if (!Number.isFinite(input.termYears)) {
    errors.push({ field: "termYears", message: "Term must be a number." });
  } else if (input.termYears < 0) {
    errors.push({ field: "termYears", message: "Term cannot be negative." });
  }

  return errors;
}

export function calculateSimpleInterest(
  input: SimpleInterestInput,
): SimpleInterestResult {
  const errors = validateSimpleInterestInput(input);

  if (errors.length > 0) {
    throw new Error(errors.map((error) => error.message).join(" "));
  }

  const interest =
    input.principal * (input.annualRatePct / 100) * input.termYears;
  const totalAmount = input.principal + interest;

  return {
    ...input,
    interest,
    totalAmount,
  };
}
