"use client";

import { CalculatorPage } from "@/components/calculator/CalculatorPage";
import {
  calculateSimpleInterest,
  validateSimpleInterestInput,
  type SimpleInterestInput,
  type SimpleInterestValidationError,
} from "@/lib/calculators/simpleInterest";
import { useQueryState } from "@/lib/urlState/useQueryState";
import {
  SimpleInterestForm,
  type SimpleInterestFormState,
} from "./SimpleInterestForm";
import { SimpleInterestResults } from "./SimpleInterestResults";

const DEFAULT_FORM_STATE: SimpleInterestFormState = {
  principal: "10000",
  annualRatePct: "5",
  termYears: "3",
};

function toNumber(value: string) {
  const trimmed = value.trim();
  if (trimmed === "") {
    return Number.NaN;
  }

  return Number(trimmed);
}

function toCalculatorInput(state: SimpleInterestFormState): SimpleInterestInput {
  return {
    principal: toNumber(state.principal),
    annualRatePct: toNumber(state.annualRatePct),
    termYears: toNumber(state.termYears),
  };
}

function collectInputPresenceErrors(
  state: SimpleInterestFormState,
): SimpleInterestValidationError[] {
  const errors: SimpleInterestValidationError[] = [];

  if (state.principal.trim() === "") {
    errors.push({ field: "principal", message: "Principal is required." });
  }
  if (state.annualRatePct.trim() === "") {
    errors.push({
      field: "annualRatePct",
      message: "Annual rate is required.",
    });
  }
  if (state.termYears.trim() === "") {
    errors.push({ field: "termYears", message: "Term is required." });
  }

  return errors;
}

function mapFieldErrors(errors: SimpleInterestValidationError[]) {
  const fieldErrors: Partial<Record<keyof SimpleInterestFormState, string>> = {};

  for (const error of errors) {
    if (!fieldErrors[error.field]) {
      fieldErrors[error.field] = error.message;
    }
  }

  return fieldErrors;
}

export function SimpleInterestCalculator() {
  const [state, setState] = useQueryState(DEFAULT_FORM_STATE);

  const presenceErrors = collectInputPresenceErrors(state);
  const parsedInput = toCalculatorInput(state);
  const validationErrors =
    presenceErrors.length > 0
      ? presenceErrors
      : validateSimpleInterestInput(parsedInput);

  const result =
    validationErrors.length === 0 ? calculateSimpleInterest(parsedInput) : null;
  const fieldErrors = mapFieldErrors(validationErrors);

  return (
    <CalculatorPage
      title="Simple Interest Calculator (Demo)"
      description="Reusable calculator page framework with query-parameter state sync. Use this as the pattern for future calculators, including novated lease."
      form={
        <SimpleInterestForm
          state={state}
          fieldErrors={fieldErrors}
          onChange={(field, value) =>
            setState((prev) => ({
              ...prev,
              [field]: value,
            }))
          }
        />
      }
      results={<SimpleInterestResults result={result} errors={validationErrors} />}
    />
  );
}
