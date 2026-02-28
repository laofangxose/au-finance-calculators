"use client";

import {
  useRef,
  useState,
  type FocusEvent,
} from "react";
import { novatedLeaseGlossary } from "@/content/glossary";
import { CalculatorPage } from "@/components/calculator/CalculatorPage";
import {
  DEFAULT_NOVATED_LEASE_FORM_STATE,
  applyInputModeAdapter,
  calculateNovatedLease,
  getBuyOutrightComparison,
  mapEngineIssuesToFieldErrors,
  normalizeNovatedLeaseFormState,
  toNovatedLeaseInput,
  validateNovatedLeaseFormState,
  type NovatedLeaseFormState,
} from "@/lib/calculators/novatedLease";
import { novatedLeaseFieldMeta } from "@/lib/ui/fieldMeta/novatedLease";
import { useQueryState } from "@/lib/urlState/useQueryState";
import styles from "./NovatedLeaseCalculator.module.css";

const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-AU", {
  maximumFractionDigits: 2,
});

type FieldErrors = Partial<Record<keyof NovatedLeaseFormState, string>>;

function glossary(term: string) {
  return novatedLeaseGlossary.find((entry) => entry.term === term);
}

function GlossaryTip({ term, label }: { term: string; label?: string }) {
  const entry = glossary(term);
  if (!entry) return null;
  return (
    <span className={styles.glossaryTip}>
      <button
        type="button"
        className={styles.glossaryAbbr}
        aria-label={`${entry.term}: ${entry.short}`}
      >
        {label ?? term}
      </button>
      <span className={styles.glossaryTooltip} role="tooltip">
        <strong>{entry.term}:</strong> {entry.short} {entry.detail}
      </span>
    </span>
  );
}

type TextFieldProps = {
  name: keyof NovatedLeaseFormState;
  state: NovatedLeaseFormState;
  errors: FieldErrors;
  onChange: (name: keyof NovatedLeaseFormState, value: string) => void;
  type?: "text" | "number" | "date";
  step?: string;
};

function TextField({
  name,
  state,
  errors,
  onChange,
  type = "text",
  step,
}: TextFieldProps) {
  const meta = novatedLeaseFieldMeta[name];
  return (
    <label className={styles.field}>
      <span className={styles.label}>
        {meta.label}
        {meta.unit !== "none" ? ` (${meta.unit})` : ""}
      </span>
      <span className={styles.hint}>{meta.description}</span>
      <input
        className={styles.input}
        type={type}
        step={step}
        value={state[name]}
        onChange={(event) => onChange(name, event.target.value)}
        aria-invalid={Boolean(errors[name])}
      />
      {errors[name] ? <span className={styles.errorText}>{errors[name]}</span> : null}
    </label>
  );
}

type SelectFieldProps = {
  name: keyof NovatedLeaseFormState;
  state: NovatedLeaseFormState;
  errors: FieldErrors;
  onChange: (name: keyof NovatedLeaseFormState, value: string) => void;
  options: Array<{ value: string; label: string }>;
};

function SelectField({
  name,
  state,
  errors,
  onChange,
  options,
}: SelectFieldProps) {
  const meta = novatedLeaseFieldMeta[name];
  return (
    <label className={styles.field}>
      <span className={styles.label}>{meta.label}</span>
      <span className={styles.hint}>{meta.description}</span>
      <select
        className={styles.select}
        value={state[name]}
        onChange={(event) => onChange(name, event.target.value)}
        aria-invalid={Boolean(errors[name])}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {errors[name] ? <span className={styles.errorText}>{errors[name]}</span> : null}
    </label>
  );
}

type CheckboxFieldProps = {
  name: keyof NovatedLeaseFormState;
  state: NovatedLeaseFormState;
  onChange: (name: keyof NovatedLeaseFormState, value: string) => void;
};

function CheckboxField({ name, state, onChange }: CheckboxFieldProps) {
  const meta = novatedLeaseFieldMeta[name];
  return (
    <label className={styles.field}>
      <span className={styles.hint}>{meta.description}</span>
      <span className={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={state[name] === "1"}
          onChange={(event) => onChange(name, event.target.checked ? "1" : "0")}
        />
        <span className={styles.checkboxLabel}>{meta.label}</span>
      </span>
    </label>
  );
}

function mergeFieldErrors(primary: FieldErrors, secondary: FieldErrors): FieldErrors {
  const merged: FieldErrors = { ...primary };
  const keys = Object.keys(secondary) as Array<keyof NovatedLeaseFormState>;
  for (const key of keys) {
    if (!merged[key] && secondary[key]) {
      merged[key] = secondary[key];
    }
  }
  return merged;
}

function differenceLabel(value: number): string {
  if (value < 0) return "You save with novated lease";
  if (value > 0) return "Buy outright is cheaper";
  return "Costs are similar";
}

function toFriendlyIssueMessage(issue: { code: string; message: string }): string {
  const mapped: Record<string, string> = {
    QUOTE_INTEREST_RATE_INFERRED:
      "Your quote does not show an interest rate. We used a typical default rate to estimate your results. For a more accurate result, enter the quote's interest rate in Advanced options.",
    QUOTE_MODEL_VARIANCE_MODERATE:
      "Your quote and this estimate are somewhat different. This is common when quote fees and assumptions differ.",
    QUOTE_MODEL_VARIANCE_HIGH:
      "Your quote and this estimate are quite different. Check included fees and assumptions for a closer comparison.",
    HIGH_DEDUCTION_RATIO:
      "The deductions look high compared with salary. Please review your inputs and assumptions.",
    NEGATIVE_PACKAGED_TAXABLE_INCOME:
      "These inputs would reduce taxable income below zero. Please adjust salary or package amounts.",
  };
  return mapped[issue.code] ?? issue.message;
}

export function NovatedLeaseCalculator() {
  const formRef = useRef<HTMLDivElement | null>(null);
  const [isEditingInputs, setIsEditingInputs] = useState(false);
  const [state, setState] = useQueryState(DEFAULT_NOVATED_LEASE_FORM_STATE);
  const normalizedState = normalizeNovatedLeaseFormState(state);
  const uiFieldErrors = validateNovatedLeaseFormState(normalizedState);
  const hasUiErrors = Object.keys(uiFieldErrors).length > 0;

  const baseInput = toNovatedLeaseInput(normalizedState);
  const adaptedInput = applyInputModeAdapter(normalizedState, baseInput);
  const currentSnapshot = JSON.stringify(normalizedState);
  const [calculatedState, setCalculatedState] = useState<{
    snapshot: string;
    result: ReturnType<typeof calculateNovatedLease>;
    comparison: ReturnType<typeof getBuyOutrightComparison>;
  } | null>(() => {
    if (hasUiErrors) {
      return null;
    }
    const initialResult = calculateNovatedLease(adaptedInput);
    return {
      snapshot: currentSnapshot,
      result: initialResult,
      comparison: getBuyOutrightComparison(adaptedInput, initialResult),
    };
  });

  const hasPendingRecalculation =
    calculatedState !== null && calculatedState.snapshot !== currentSnapshot;

  const runCalculation = () => {
    if (hasUiErrors) {
      return;
    }
    const nextEngineResult = calculateNovatedLease(adaptedInput);
    const nextComparison = getBuyOutrightComparison(adaptedInput, nextEngineResult);
    setCalculatedState({
      snapshot: currentSnapshot,
      result: nextEngineResult,
      comparison: nextComparison,
    });
  };
  const canCalculate =
    !hasUiErrors && (hasPendingRecalculation || calculatedState === null);

  const engineResult = calculatedState?.result ?? null;
  const comparison = calculatedState?.comparison ?? null;

  const engineFieldErrors =
    engineResult && !hasPendingRecalculation
      ? mapEngineIssuesToFieldErrors(engineResult.validationIssues)
      : {};
  const fieldErrors = mergeFieldErrors(uiFieldErrors, engineFieldErrors);

  const mode = normalizedState.im;
  const isDetailed = mode === "detailed";

  const onChange = (name: keyof NovatedLeaseFormState, value: string) => {
    setState((prev) =>
      normalizeNovatedLeaseFormState({
        ...prev,
        [name]: value,
      }),
    );
  };

  const onFormFocusCapture = (event: FocusEvent<HTMLDivElement>) => {
    const target = event.target;
    if (
      target instanceof HTMLElement &&
      (target.tagName === "INPUT" ||
        target.tagName === "SELECT" ||
        target.tagName === "TEXTAREA")
    ) {
      setIsEditingInputs(true);
    }
  };

  const onFormBlurCapture = () => {
    if (typeof window === "undefined") {
      return;
    }
    window.requestAnimationFrame(() => {
      const active = document.activeElement;
      const isStillInside = Boolean(
        formRef.current && active && formRef.current.contains(active),
      );
      if (!isStillInside) {
        setIsEditingInputs(false);
      }
    });
  };

  const issues =
    engineResult && !hasPendingRecalculation ? engineResult.validationIssues : [];

  return (
    <CalculatorPage
      title="Novated Lease Calculator"
      description="Use Quote mode for a quick decision. Use Detailed mode for advanced assumptions."
      resultsTop={
        <div className={styles.execActionRow}>
          <button
            className={styles.calculateBtnLarge}
            type="button"
            onClick={runCalculation}
            disabled={!canCalculate}
          >
            Calculate
          </button>
          <p className={styles.muted}>
            {canCalculate
              ? "Inputs changed. Click Calculate."
              : hasUiErrors
                ? "Fix input errors to calculate."
                : "Results are up to date."}
          </p>
        </div>
      }
      disclaimer={
        <p>
          The information on this website is provided for general informational
          purposes only and does not constitute financial, taxation, legal, or
          other professional advice. Calculations are estimates based on user
          inputs and model assumptions, may not reflect your personal
          circumstances, and should not be relied upon as the sole basis for
          any decision. You should obtain independent professional advice before
          acting. To the maximum extent permitted by applicable law, the
          website owner, developer, and contributors disclaim all liability for
          any loss, damage, cost, or claim arising from or connected with use
          of, or reliance on, this website or its outputs.
        </p>
      }
      form={
        <div
          ref={formRef}
          className={styles.stack}
          onFocusCapture={onFormFocusCapture}
          onBlurCapture={onFormBlurCapture}
        >
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Input Style</h3>
            <SelectField
              name="im"
              state={normalizedState}
              errors={fieldErrors}
              onChange={onChange}
              options={[
                { value: "quote", label: "Quote mode (recommended)" },
                { value: "detailed", label: "Detailed mode (advanced)" },
              ]}
            />
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Your Situation</h3>
            <div className={styles.fieldGrid}>
              <TextField
                name="pp"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="0.01"
              />
              <SelectField
                name="vt"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                options={[
                  { value: "ice", label: "Petrol / Diesel" },
                  { value: "hev", label: "Hybrid" },
                  { value: "phev", label: "Plug-in Hybrid" },
                  { value: "bev", label: "Electric vehicle" },
                  { value: "fcev", label: "Hydrogen vehicle" },
                ]}
              />
              <SelectField
                name="tm"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                options={[
                  { value: "12", label: "12 months" },
                  { value: "24", label: "24 months" },
                  { value: "36", label: "36 months" },
                  { value: "48", label: "48 months" },
                  { value: "60", label: "60 months" },
                ]}
              />
              <TextField
                name="s"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="0.01"
              />
              <SelectField
                name="pf"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                options={[
                  { value: "weekly", label: "Weekly" },
                  { value: "fortnightly", label: "Fortnightly" },
                  { value: "monthly", label: "Monthly" },
                ]}
              />
              <SelectField
                name="fy"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                options={[
                  { value: "FY2024-25", label: "FY2024-25" },
                  { value: "FY2025-26", label: "FY2025-26" },
                  { value: "FY2026-27", label: "FY2026-27" },
                ]}
              />
              <TextField
                name="ocr"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="0.01"
              />
            </div>
          </section>

          {isDetailed ? (
            <>
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Running Costs</h3>
                <div className={styles.fieldGrid}>
                  <TextField name="rr" state={normalizedState} errors={fieldErrors} onChange={onChange} type="number" step="0.01" />
                  <TextField name="ri" state={normalizedState} errors={fieldErrors} onChange={onChange} type="number" step="0.01" />
                  <TextField name="rm" state={normalizedState} errors={fieldErrors} onChange={onChange} type="number" step="0.01" />
                  <TextField name="rt" state={normalizedState} errors={fieldErrors} onChange={onChange} type="number" step="0.01" />
                  <TextField name="rf" state={normalizedState} errors={fieldErrors} onChange={onChange} type="number" step="0.01" />
                  <TextField name="ro" state={normalizedState} errors={fieldErrors} onChange={onChange} type="number" step="0.01" />
                </div>
              </section>
              <details className={styles.detailsBlock}>
                <summary className={styles.detailsTitle}>Advanced (Detailed mode)</summary>
                <div className={styles.detailsContent}>
                  <div className={styles.fieldGrid}>
                    <TextField name="ir" state={normalizedState} errors={fieldErrors} onChange={onChange} type="number" step="0.01" />
                    <SelectField
                      name="ppy"
                      state={normalizedState}
                      errors={fieldErrors}
                      onChange={onChange}
                      options={[
                        { value: "12", label: "12" },
                        { value: "26", label: "26" },
                        { value: "52", label: "52" },
                      ]}
                    />
                    <TextField name="ef" state={normalizedState} errors={fieldErrors} onChange={onChange} type="number" step="0.01" />
                    <TextField name="maf" state={normalizedState} errors={fieldErrors} onChange={onChange} type="number" step="0.01" />
                    <TextField name="rvo" state={normalizedState} errors={fieldErrors} onChange={onChange} type="number" step="0.01" />
                    <TextField name="bv" state={normalizedState} errors={fieldErrors} onChange={onChange} type="number" step="0.01" />
                    <TextField name="mlr" state={normalizedState} errors={fieldErrors} onChange={onChange} type="number" step="0.0001" />
                    <TextField name="fyd" state={normalizedState} errors={fieldErrors} onChange={onChange} type="number" step="1" />
                    <TextField name="dav" state={normalizedState} errors={fieldErrors} onChange={onChange} type="number" step="1" />
                    <TextField name="fsr" state={normalizedState} errors={fieldErrors} onChange={onChange} type="number" step="0.0001" />
                    <TextField name="fhud" state={normalizedState} errors={fieldErrors} onChange={onChange} type="date" />
                  </div>
                  <div className={styles.fieldGrid}>
                    <CheckboxField name="ml" state={normalizedState} onChange={onChange} />
                    <CheckboxField name="irc" state={normalizedState} onChange={onChange} />
                    <CheckboxField name="ue" state={normalizedState} onChange={onChange} />
                    <CheckboxField name="phex" state={normalizedState} onChange={onChange} />
                    <CheckboxField name="phbc" state={normalizedState} onChange={onChange} />
                  </div>
                </div>
              </details>
            </>
          ) : (
            <>
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Quote Inputs</h3>
                <div className={styles.fieldGrid}>
                  <TextField name="qmp" state={normalizedState} errors={fieldErrors} onChange={onChange} type="number" step="0.01" />
                  <TextField name="rat" state={normalizedState} errors={fieldErrors} onChange={onChange} type="number" step="0.01" />
                  <CheckboxField name="irc" state={normalizedState} onChange={onChange} />
                </div>
              </section>
              <details className={styles.detailsBlock}>
                <summary className={styles.detailsTitle}>Advanced (Quote mode optional)</summary>
                <div className={styles.detailsContent}>
                  <div className={styles.fieldGrid}>
                    <TextField name="qn" state={normalizedState} errors={fieldErrors} onChange={onChange} />
                    <TextField name="qmf" state={normalizedState} errors={fieldErrors} onChange={onChange} type="number" step="0.01" />
                    <TextField name="quf" state={normalizedState} errors={fieldErrors} onChange={onChange} type="number" step="0.01" />
                    <TextField name="qrv" state={normalizedState} errors={fieldErrors} onChange={onChange} type="number" step="0.01" />
                  </div>
                </div>
              </details>
            </>
          )}

          <p className={styles.muted}>
            Hover or focus for definitions: <GlossaryTip term="FBT" />,{" "}
            <GlossaryTip term="ECM" />, <GlossaryTip term="Residual" />,{" "}
            <GlossaryTip term="PHEV" />.
          </p>
        </div>
      }
      results={
        <div className={styles.summary}>
          {isEditingInputs ? (
            <div className={styles.issueWarning}>
              Results are out of date while you edit inputs.
            </div>
          ) : null}
          {!isEditingInputs && hasPendingRecalculation && !hasUiErrors ? (
            <div className={styles.issueWarning}>Results are out of date.</div>
          ) : null}
          {hasUiErrors ? (
            <div className={styles.issueError}>
              Some inputs need attention before results can be shown.
            </div>
          ) : null}

          {engineResult && comparison ? (
            <>
              <section className={styles.executiveSection}>
                <h3 className={styles.execTitle}>Executive Summary</h3>
                <div className={styles.headlineGrid}>
                  <div className={styles.headlineCard}>
                    <p className={styles.headlineLabel}>Novated monthly out-of-pocket</p>
                    <p className={styles.headlineValue}>
                      {currencyFormatter.format(comparison.novatedMonthlyOutOfPocket)}
                    </p>
                  </div>
                  <div className={styles.headlineCard}>
                    <p className={styles.headlineLabel}>Buy outright monthly equivalent</p>
                    <p className={styles.headlineValue}>
                      {currencyFormatter.format(comparison.monthlyEquivalentCost)}
                    </p>
                  </div>
                  <div className={styles.headlineCard}>
                    <p className={styles.headlineLabel}>Monthly difference</p>
                    <p className={styles.headlineValue}>
                      {currencyFormatter.format(comparison.monthlyDifference)}
                    </p>
                  </div>
                  <div className={styles.headlineCard}>
                    <p className={styles.headlineLabel}>Total term difference</p>
                    <p className={styles.headlineValue}>
                      {currencyFormatter.format(comparison.totalCostDifferenceOverTerm)}
                    </p>
                  </div>
                </div>
                <ul className={styles.explainList}>
                  <li>{differenceLabel(comparison.monthlyDifference)} based on current assumptions.</li>
                  <li>
                    Tax effect this year:{" "}
                    {currencyFormatter.format(engineResult.taxComparison?.taxAndLevySavings ?? 0)}.
                  </li>
                  <li>
                    Buy-out comparison assumes opportunity cost rate{" "}
                    {numberFormatter.format(comparison.opportunityCostRateAssumed)}%.
                  </li>
                </ul>
              </section>

              <section className={styles.compareSection}>
                <h3 className={styles.execTitle}>Novated vs Buy Outright</h3>
                <div className={styles.compareGrid}>
                  <article className={styles.compareCard}>
                    <h4 className={styles.compareTitle}>Novated</h4>
                    <div className={styles.breakdownList}>
                      <div className={styles.row}>
                        <span>Pre-tax deduction (annual)</span>
                        <span className={styles.value}>
                          {currencyFormatter.format(
                            engineResult.packaging?.annualPreTaxDeduction ?? 0,
                          )}
                        </span>
                      </div>
                      <div className={styles.row}>
                        <span>
                          Post-tax contribution (annual) <GlossaryTip term="ECM" />
                        </span>
                        <span className={styles.value}>
                          {currencyFormatter.format(
                            engineResult.packaging?.annualPostTaxDeduction ?? 0,
                          )}
                        </span>
                      </div>
                      <div className={styles.row}>
                        <span>Tax and levy saved</span>
                        <span className={styles.value}>
                          {currencyFormatter.format(
                            engineResult.taxComparison?.taxAndLevySavings ?? 0,
                          )}
                        </span>
                      </div>
                    </div>
                  </article>
                  <article className={styles.compareCard}>
                    <h4 className={styles.compareTitle}>Buy Outright</h4>
                    <div className={styles.breakdownList}>
                      <div className={styles.row}>
                        <span>Vehicle price</span>
                        <span className={styles.value}>
                          {currencyFormatter.format(adaptedInput.vehicle.purchasePriceInclGst)}
                        </span>
                      </div>
                      <div className={styles.row}>
                        <span>Total cash outlay (term)</span>
                        <span className={styles.value}>
                          {currencyFormatter.format(comparison.totalCashOutlayOverTerm)}
                        </span>
                      </div>
                      <div className={styles.row}>
                        <span>Forgone savings interest (term)</span>
                        <span className={styles.value}>
                          {currencyFormatter.format(
                            comparison.estimatedForgoneEarningsOverTerm,
                          )}
                        </span>
                      </div>
                      <div className={styles.row}>
                        <span>Estimated LCT in price</span>
                        <span className={styles.value}>
                          {currencyFormatter.format(
                            comparison.estimatedLctIncludedInPurchasePrice,
                          )}
                        </span>
                      </div>
                    </div>
                  </article>
                </div>
              </section>

              <details className={styles.detailsBlock} open>
                <summary className={styles.detailsTitle}>Expandable breakdown</summary>
                <div className={styles.detailsContent}>
                  <div className={styles.breakdownList}>
                    <div className={styles.row}>
                      <span>Annual package cost before ECM</span>
                      <span className={styles.value}>
                        {currencyFormatter.format(
                          engineResult.packaging?.annualPackageCostBeforeEcm ?? 0,
                        )}
                      </span>
                    </div>
                    <div className={styles.row}>
                      <span>Periodic lease repayment</span>
                      <span className={styles.value}>
                        {currencyFormatter.format(
                          engineResult.lease?.periodicFinanceRepayment ?? 0,
                        )}
                      </span>
                    </div>
                    <div className={styles.row}>
                      <span>Residual / balloon</span>
                      <span className={styles.value}>
                        {currencyFormatter.format(engineResult.lease?.residualValue ?? 0)}
                      </span>
                    </div>
                    <div className={styles.row}>
                      <span>
                        FBT taxable value (gross) <GlossaryTip term="FBT" />
                      </span>
                      <span className={styles.value}>
                        {currencyFormatter.format(
                          engineResult.fbt?.grossTaxableValueBeforeExemptions ?? 0,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </details>

              <details className={styles.detailsBlock}>
                <summary className={styles.detailsTitle}>Assumptions</summary>
                <div className={styles.detailsContent}>
                  <div className={styles.breakdownList}>
                    {engineResult.assumptions.map((assumption) => (
                      <div className={styles.row} key={assumption.key}>
                        <span>{assumption.label}</span>
                        <span className={styles.value}>
                          {typeof assumption.value === "number"
                            ? numberFormatter.format(assumption.value)
                            : String(assumption.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </details>

              <details className={styles.detailsBlock}>
                <summary className={styles.detailsTitle}>Data sources</summary>
                <div className={styles.detailsContent}>
                  <ul className={styles.sourceList}>
                    <li>ATO individual income tax rates</li>
                    <li>ATO Medicare levy</li>
                    <li>ATO FBT car taxable value guidance</li>
                    <li>ATO LCT thresholds</li>
                  </ul>
                </div>
              </details>

              <details className={styles.detailsBlock}>
                <summary className={styles.detailsTitle}>Glossary</summary>
                <div className={styles.detailsContent}>
                  <div className={styles.glossaryList}>
                    {novatedLeaseGlossary.map((entry) => (
                      <div key={entry.term} className={styles.glossaryItem}>
                        <strong>{entry.term}</strong>
                        <p>{entry.short}</p>
                        <p className={styles.muted}>{entry.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </details>

              {issues.length > 0 ? (
                <div className={styles.issues}>
                  {issues.map((issue, index) => (
                    <div
                      key={`${issue.code}-${index}`}
                      className={
                        issue.severity === "error"
                          ? styles.issueError
                          : styles.issueWarning
                      }
                    >
                      {toFriendlyIssueMessage(issue)}
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      }
    />
  );
}
