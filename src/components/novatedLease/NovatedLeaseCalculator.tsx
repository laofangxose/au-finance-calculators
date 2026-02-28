"use client";

import { novatedLeaseGlossary } from "@/content/glossary";
import { CalculatorPage } from "@/components/calculator/CalculatorPage";
import {
  DEFAULT_NOVATED_LEASE_FORM_STATE,
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

function termTip(term: string): string {
  const match = novatedLeaseGlossary.find((entry) => entry.term === term);
  return match ? `${match.short} ${match.detail}` : term;
}

type TextFieldProps = {
  name: keyof NovatedLeaseFormState;
  state: NovatedLeaseFormState;
  errors: FieldErrors;
  onChange: (name: keyof NovatedLeaseFormState, value: string) => void;
  type?: "text" | "number" | "date";
  step?: string;
  placeholder?: string;
};

function TextField({
  name,
  state,
  errors,
  onChange,
  type = "text",
  step,
  placeholder,
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
        placeholder={placeholder}
        value={state[name]}
        onChange={(event) => onChange(name, event.target.value)}
        aria-invalid={Boolean(errors[name])}
      />
      <span className={styles.metaRule}>Format: {meta.formatRule}</span>
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
      <span className={styles.metaRule}>Format: {meta.formatRule}</span>
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
  if (value < 0) return "Novated saves";
  if (value > 0) return "Novated costs more";
  return "No difference";
}

export function NovatedLeaseCalculator() {
  const [state, setState] = useQueryState(DEFAULT_NOVATED_LEASE_FORM_STATE);
  const normalizedState = normalizeNovatedLeaseFormState(state);
  const uiFieldErrors = validateNovatedLeaseFormState(normalizedState);
  const hasUiErrors = Object.keys(uiFieldErrors).length > 0;

  const input = toNovatedLeaseInput(normalizedState);
  const engineResult = hasUiErrors ? null : calculateNovatedLease(input);
  const engineFieldErrors = engineResult
    ? mapEngineIssuesToFieldErrors(engineResult.validationIssues)
    : {};
  const fieldErrors = mergeFieldErrors(uiFieldErrors, engineFieldErrors);
  const comparison = engineResult ? getBuyOutrightComparison(input, engineResult) : null;
  const isEcmRelevant = !(engineResult?.fbt?.evExemptionApplied ?? false);

  const onChange = (name: keyof NovatedLeaseFormState, value: string) => {
    setState((prev) =>
      normalizeNovatedLeaseFormState({
        ...prev,
        [name]: value,
      }),
    );
  };

  const issues = engineResult?.validationIssues ?? [];
  const assumptions = engineResult?.assumptions ?? [];

  return (
    <CalculatorPage
      title="Novated Lease Calculator"
      description="Estimate your novated lease outcomes and compare against buying outright with a shareable URL scenario."
      form={
        <div className={styles.stack}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Salary & Tax Assumptions</h3>
            <div className={styles.fieldGrid}>
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
              <CheckboxField name="ml" state={normalizedState} onChange={onChange} />
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Vehicle & Lease Terms</h3>
            <div className={styles.fieldGrid}>
              <SelectField
                name="vt"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                options={[
                  { value: "ice", label: "ICE" },
                  { value: "hev", label: "HEV" },
                  { value: "phev", label: "PHEV" },
                  { value: "bev", label: "BEV" },
                  { value: "fcev", label: "FCEV" },
                ]}
              />
              <TextField
                name="pp"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="0.01"
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
                name="ir"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="0.01"
              />
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
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Running Costs</h3>
            <div className={styles.fieldGrid}>
              <TextField
                name="rr"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="0.01"
              />
              <TextField
                name="ri"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="0.01"
              />
              <TextField
                name="rm"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="0.01"
              />
              <TextField
                name="rt"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="0.01"
              />
              <TextField
                name="rf"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="0.01"
              />
              <TextField
                name="ro"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="0.01"
              />
            </div>
          </section>

          <details className={styles.detailsBlock}>
            <summary className={styles.detailsTitle}>Advanced Options</summary>
            <div className={styles.detailsContent}>
              <div className={styles.fieldGrid}>
                <TextField
                  name="ef"
                  state={normalizedState}
                  errors={fieldErrors}
                  onChange={onChange}
                  type="number"
                  step="0.01"
                />
                <TextField
                  name="maf"
                  state={normalizedState}
                  errors={fieldErrors}
                  onChange={onChange}
                  type="number"
                  step="0.01"
                />
                <TextField
                  name="rvo"
                  state={normalizedState}
                  errors={fieldErrors}
                  onChange={onChange}
                  type="number"
                  step="0.01"
                />
                <TextField
                  name="bv"
                  state={normalizedState}
                  errors={fieldErrors}
                  onChange={onChange}
                  type="number"
                  step="0.01"
                />
                <TextField
                  name="fhud"
                  state={normalizedState}
                  errors={fieldErrors}
                  onChange={onChange}
                  type="date"
                />
                <TextField
                  name="mlr"
                  state={normalizedState}
                  errors={fieldErrors}
                  onChange={onChange}
                  type="number"
                  step="0.0001"
                />
                <TextField
                  name="fyd"
                  state={normalizedState}
                  errors={fieldErrors}
                  onChange={onChange}
                  type="number"
                  step="1"
                />
                <TextField
                  name="dav"
                  state={normalizedState}
                  errors={fieldErrors}
                  onChange={onChange}
                  type="number"
                  step="1"
                />
                <TextField
                  name="fsr"
                  state={normalizedState}
                  errors={fieldErrors}
                  onChange={onChange}
                  type="number"
                  step="0.0001"
                />
              </div>
              <div className={styles.fieldGrid}>
                {isEcmRelevant ? (
                  <CheckboxField name="ue" state={normalizedState} onChange={onChange} />
                ) : (
                  <p className={styles.muted}>
                    ECM is hidden because FBT exemption is active for this scenario.
                  </p>
                )}
                <CheckboxField name="evt" state={normalizedState} onChange={onChange} />
                <CheckboxField name="irc" state={normalizedState} onChange={onChange} />
                <CheckboxField name="eve" state={normalizedState} onChange={onChange} />
                <CheckboxField name="phex" state={normalizedState} onChange={onChange} />
                <CheckboxField name="phbc" state={normalizedState} onChange={onChange} />
              </div>
            </div>
          </details>

          <details className={styles.detailsBlock}>
            <summary className={styles.detailsTitle}>Quote Inputs (Optional)</summary>
            <div className={styles.detailsContent}>
              <div className={styles.fieldGrid}>
                <TextField name="qn" state={normalizedState} errors={fieldErrors} onChange={onChange} />
                <TextField name="qpp" state={normalizedState} errors={fieldErrors} onChange={onChange} type="number" step="0.01" />
                <TextField name="qad" state={normalizedState} errors={fieldErrors} onChange={onChange} type="number" step="0.01" />
                <TextField name="qrv" state={normalizedState} errors={fieldErrors} onChange={onChange} type="number" step="0.01" />
                <TextField name="qrp" state={normalizedState} errors={fieldErrors} onChange={onChange} type="number" step="0.0001" />
                <TextField name="qri" state={normalizedState} errors={fieldErrors} onChange={onChange} type="number" step="0.01" />
                <TextField name="quf" state={normalizedState} errors={fieldErrors} onChange={onChange} type="number" step="0.01" />
                <TextField name="qmf" state={normalizedState} errors={fieldErrors} onChange={onChange} type="number" step="0.01" />
              </div>
              <div className={styles.fieldGrid}>
                <CheckboxField name="qir" state={normalizedState} onChange={onChange} />
                <CheckboxField name="qrw" state={normalizedState} onChange={onChange} />
                <CheckboxField name="qfu" state={normalizedState} onChange={onChange} />
              </div>
            </div>
          </details>

          <button className={styles.calculateBtn} type="button" disabled={hasUiErrors}>
            Calculate (updates automatically)
          </button>
          <p className={styles.muted}>
            Shareable link enabled: URL updates as you edit and restores state on refresh.
          </p>
        </div>
      }
      results={
        <div className={styles.summary}>
          {hasUiErrors ? (
            <div className={styles.issueError}>
              Inputs are invalid. Fix inline field errors to calculate results.
            </div>
          ) : null}

          {!hasUiErrors && engineResult && comparison ? (
            <>
              <section className={styles.executiveSection}>
                <h3 className={styles.execTitle}>Executive Summary</h3>
                <div className={styles.badgeRow}>
                  {engineResult.fbt?.evExemptionApplied ? (
                    <span className={styles.badgeSuccess}>
                      FBT Exempted (EV conditions met)
                    </span>
                  ) : (
                    <span className={styles.badgeNeutral}>FBT Not Exempted</span>
                  )}
                  {engineResult.fbt?.evExemptionReason ? (
                    <span className={styles.badgeHint}>
                      {engineResult.fbt.evExemptionReason}
                    </span>
                  ) : null}
                </div>
                <div className={styles.headlineGrid}>
                  <div className={styles.headlineCard}>
                    <p className={styles.headlineLabel}>Novated Monthly Out-of-Pocket</p>
                    <p className={styles.headlineValue}>
                      {currencyFormatter.format(comparison.novatedMonthlyOutOfPocket)}
                    </p>
                  </div>
                  <div className={styles.headlineCard}>
                    <p className={styles.headlineLabel}>Buy Outright Monthly Equivalent</p>
                    <p className={styles.headlineValue}>
                      {currencyFormatter.format(comparison.monthlyEquivalentCost)}
                    </p>
                  </div>
                  <div className={styles.headlineCard}>
                    <p className={styles.headlineLabel}>
                      Difference ({differenceLabel(comparison.monthlyDifference)})
                    </p>
                    <p className={styles.headlineValue}>
                      {currencyFormatter.format(Math.abs(comparison.monthlyDifference))}
                    </p>
                  </div>
                  <div className={styles.headlineCard}>
                    <p className={styles.headlineLabel}>Term Cost Difference</p>
                    <p className={styles.headlineValue}>
                      {currencyFormatter.format(comparison.totalCostDifferenceOverTerm)}
                    </p>
                  </div>
                  <div className={styles.headlineCard}>
                    <p className={styles.headlineLabel}>Residual / Buyout Amount</p>
                    <p className={styles.headlineValue}>
                      {currencyFormatter.format(engineResult.lease?.residualValue ?? 0)}
                    </p>
                  </div>
                </div>
              </section>

              <section className={styles.compareSection}>
                <h3 className={styles.execTitle}>Comparison</h3>
                <div className={styles.compareGrid}>
                  <article className={styles.compareCard}>
                    <h4 className={styles.compareTitle}>Novated Lease</h4>
                    <div className={styles.breakdownList}>
                      <div className={styles.row}>
                        <span>Annual package cost</span>
                        <span className={styles.value}>
                          {currencyFormatter.format(
                            engineResult.packaging?.annualPackageCostBeforeEcm ?? 0,
                          )}
                        </span>
                      </div>
                      <div className={styles.row}>
                        <span>Pre-tax deduction (annual)</span>
                        <span className={styles.value}>
                          {currencyFormatter.format(
                            engineResult.packaging?.annualPreTaxDeduction ?? 0,
                          )}
                        </span>
                      </div>
                      {isEcmRelevant ? (
                        <div className={styles.row}>
                          <span>Post-tax ECM (annual)</span>
                          <span className={styles.value}>
                            {currencyFormatter.format(
                              engineResult.packaging?.annualPostTaxDeduction ?? 0,
                            )}
                          </span>
                        </div>
                      ) : null}
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
                    <h4 className={styles.compareTitle}>Buy Outright (Cash)</h4>
                    <div className={styles.breakdownList}>
                      <div className={styles.row}>
                        <span>Vehicle purchase price</span>
                        <span className={styles.value}>
                          {currencyFormatter.format(input.vehicle.purchasePriceInclGst)}
                        </span>
                      </div>
                      <div className={styles.row}>
                        <span>Running costs over term</span>
                        <span className={styles.value}>
                          {currencyFormatter.format(
                            comparison.totalCashOutlayOverTerm -
                              input.vehicle.purchasePriceInclGst -
                              input.finance.establishmentFee,
                          )}
                        </span>
                      </div>
                      <div className={styles.row}>
                        <span>Upfront fees</span>
                        <span className={styles.value}>
                          {currencyFormatter.format(input.finance.establishmentFee)}
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
                      <div className={styles.row}>
                        <span>Total cash outlay (term)</span>
                        <span className={styles.value}>
                          {currencyFormatter.format(comparison.totalCashOutlayOverTerm)}
                        </span>
                      </div>
                    </div>
                  </article>
                </div>
              </section>

              <details className={styles.detailsBlock} open>
                <summary className={styles.detailsTitle}>Details: Cost Breakdown</summary>
                <div className={styles.detailsContent}>
                  <div className={styles.breakdownList}>
                    <div className={styles.row}>
                      <span>Periodic finance repayment</span>
                      <span className={styles.value}>
                        {currencyFormatter.format(
                          engineResult.lease?.periodicFinanceRepayment ?? 0,
                        )}
                      </span>
                    </div>
                    <div className={styles.row}>
                      <span>Annual finance repayment</span>
                      <span className={styles.value}>
                        {currencyFormatter.format(
                          engineResult.lease?.annualFinanceRepayment ?? 0,
                        )}
                      </span>
                    </div>
                    <div className={styles.row}>
                      <span>Gross FBT taxable value</span>
                      <span className={styles.value}>
                        {currencyFormatter.format(
                          engineResult.fbt?.grossTaxableValueBeforeExemptions ?? 0,
                        )}
                      </span>
                    </div>
                    <div className={styles.row}>
                      <span>Taxable value after ECM</span>
                      <span className={styles.value}>
                        {currencyFormatter.format(
                          engineResult.fbt?.taxableValueAfterEcm ?? 0,
                        )}
                      </span>
                    </div>
                    <div className={styles.row}>
                      <span>Per-pay net benefit estimate</span>
                      <span className={styles.value}>
                        {currencyFormatter.format(
                          engineResult.cashflow?.perPayNetBenefitEstimate ?? 0,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </details>

              <details className={styles.detailsBlock}>
                <summary className={styles.detailsTitle}>Details: Assumptions & Disclaimer</summary>
                <div className={styles.detailsContent}>
                  <p className={styles.muted}>
                    Estimates only. Not financial, tax, or legal advice. Buy outright
                    comparison assumes opportunity cost rate of{" "}
                    {numberFormatter.format(comparison.opportunityCostRateAssumed)}%.
                    LCT is treated as an estimated component already included in
                    purchase price when threshold is exceeded.
                  </p>
                  <div className={styles.breakdownList}>
                    {assumptions.map((assumption) => (
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
                <summary className={styles.detailsTitle}>Details: Data Sources</summary>
                <div className={styles.detailsContent}>
                  <ul className={styles.sourceList}>
                    <li>
                      <a href="https://www.ato.gov.au/rates/individual-income-tax-rates/" target="_blank" rel="noreferrer">
                        ATO individual income tax rates
                      </a>
                    </li>
                    <li>
                      <a href="https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy/what-is-the-medicare-levy" target="_blank" rel="noreferrer">
                        ATO Medicare levy
                      </a>
                    </li>
                    <li>
                      <a href="https://www.ato.gov.au/businesses-and-organisations/hiring-and-paying-your-workers/fringe-benefits-tax/types-of-fringe-benefits/fbt-on-cars-other-vehicles-parking-and-tolls/cars-and-fbt/taxable-value-of-a-car-fringe-benefit" target="_blank" rel="noreferrer">
                        ATO FBT car taxable value guidance
                      </a>
                    </li>
                  </ul>
                </div>
              </details>

              <details className={styles.detailsBlock}>
                <summary className={styles.detailsTitle}>Glossary</summary>
                <div className={styles.detailsContent}>
                  <p className={styles.muted}>
                    Hover terms like <abbr title={termTip("FBT")}>FBT</abbr>,{" "}
                    <abbr title={termTip("ECM")}>ECM</abbr>,{" "}
                    <abbr title={termTip("Residual")}>Residual</abbr>, and{" "}
                    <abbr title={termTip("BEV")}>BEV</abbr> for quick definitions.
                  </p>
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
                      <strong>{issue.code}</strong>: {issue.message}
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
