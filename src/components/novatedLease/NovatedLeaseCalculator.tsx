"use client";

import { CalculatorPage } from "@/components/calculator/CalculatorPage";
import {
  DEFAULT_NOVATED_LEASE_FORM_STATE,
  NOVATED_LEASE_QUERY_PARAM_MAP,
  calculateNovatedLease,
  getNovatedLeaseHeadlineMetrics,
  mapEngineIssuesToFieldErrors,
  normalizeNovatedLeaseFormState,
  toNovatedLeaseInput,
  validateNovatedLeaseFormState,
  type NovatedLeaseFormState,
} from "@/lib/calculators/novatedLease";
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

type TextFieldProps = {
  name: keyof NovatedLeaseFormState;
  label: string;
  hint?: string;
  state: NovatedLeaseFormState;
  errors: FieldErrors;
  onChange: (name: keyof NovatedLeaseFormState, value: string) => void;
  type?: "text" | "number" | "date";
  step?: string;
};

function TextField({
  name,
  label,
  hint,
  state,
  errors,
  onChange,
  type = "text",
  step,
}: TextFieldProps) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {hint ? <span className={styles.hint}>{hint}</span> : null}
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
  label: string;
  hint?: string;
  state: NovatedLeaseFormState;
  errors: FieldErrors;
  onChange: (name: keyof NovatedLeaseFormState, value: string) => void;
  options: Array<{ value: string; label: string }>;
};

function SelectField({
  name,
  label,
  hint,
  state,
  errors,
  onChange,
  options,
}: SelectFieldProps) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {hint ? <span className={styles.hint}>{hint}</span> : null}
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
  label: string;
  hint?: string;
  state: NovatedLeaseFormState;
  onChange: (name: keyof NovatedLeaseFormState, value: string) => void;
};

function CheckboxField({
  name,
  label,
  hint,
  state,
  onChange,
}: CheckboxFieldProps) {
  return (
    <label className={styles.field}>
      {hint ? <span className={styles.hint}>{hint}</span> : null}
      <span className={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={state[name] === "1"}
          onChange={(event) => onChange(name, event.target.checked ? "1" : "0")}
        />
        <span className={styles.checkboxLabel}>{label}</span>
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
  const headline = engineResult ? getNovatedLeaseHeadlineMetrics(engineResult) : null;

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
      description="Estimate only. Uses pure M2a engine output with data-driven AU tax/FBT/residual rules."
      form={
        <div className={styles.stack}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Salary & Tax Assumptions</h3>
            <div className={styles.fieldGrid}>
              <TextField
                name="s"
                label="salary.grossAnnualSalary (AUD/year)"
                hint="Gross annual salary before packaging."
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="0.01"
              />
              <SelectField
                name="pf"
                label="salary.payFrequency"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                options={[
                  { value: "weekly", label: "weekly" },
                  { value: "fortnightly", label: "fortnightly" },
                  { value: "monthly", label: "monthly" },
                ]}
              />
              <SelectField
                name="fy"
                label="taxOptions.incomeTaxYear"
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
                name="mlr"
                label="taxOptions.medicareLevyRateOverride"
                hint="Optional decimal override, e.g. 0.02."
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="0.0001"
              />
              <TextField
                name="fyd"
                label="taxOptions.fbtYearDays"
                hint="Must be 365 or 366."
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="1"
              />
              <TextField
                name="dav"
                label="taxOptions.daysAvailableForPrivateUseInFbtYear"
                hint="0 to fbtYearDays."
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="1"
              />
              <TextField
                name="fsr"
                label="taxOptions.fbtStatutoryRateOverride"
                hint="Optional decimal in range 0..1."
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="0.0001"
              />
            </div>
            <div className={styles.fieldGrid}>
              <CheckboxField
                name="ml"
                label="taxOptions.includeMedicareLevy"
                state={normalizedState}
                onChange={onChange}
              />
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Vehicle & Lease Terms</h3>
            <div className={styles.fieldGrid}>
              <SelectField
                name="vt"
                label="vehicle.vehicleType"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                options={[
                  { value: "ice", label: "ice" },
                  { value: "hev", label: "hev" },
                  { value: "phev", label: "phev" },
                  { value: "bev", label: "bev" },
                  { value: "fcev", label: "fcev" },
                ]}
              />
              <TextField
                name="pp"
                label="vehicle.purchasePriceInclGst (AUD)"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="0.01"
              />
              <TextField
                name="bv"
                label="vehicle.baseValueForFbt (AUD, optional)"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="0.01"
              />
              <TextField
                name="fhud"
                label="vehicle.firstHeldAndUsedDate (optional)"
                hint="YYYY-MM-DD"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="date"
              />
              <SelectField
                name="tm"
                label="finance.termMonths"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                options={[
                  { value: "12", label: "12" },
                  { value: "24", label: "24" },
                  { value: "36", label: "36" },
                  { value: "48", label: "48" },
                  { value: "60", label: "60" },
                ]}
              />
              <TextField
                name="ir"
                label="finance.annualInterestRatePct"
                hint="Nominal p.a. percent."
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="0.01"
              />
              <SelectField
                name="ppy"
                label="finance.paymentsPerYear"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                options={[
                  { value: "12", label: "12" },
                  { value: "26", label: "26" },
                  { value: "52", label: "52" },
                ]}
              />
              <TextField
                name="ef"
                label="finance.establishmentFee (AUD)"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="0.01"
              />
              <TextField
                name="maf"
                label="finance.monthlyAccountKeepingFee (AUD/month)"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="0.01"
              />
              <TextField
                name="rvo"
                label="finance.residualValueOverride (AUD, optional)"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="0.01"
              />
            </div>
            <div className={styles.fieldGrid}>
              <CheckboxField
                name="eve"
                label="vehicle.eligibleForEvFbtExemption"
                state={normalizedState}
                onChange={onChange}
              />
              <CheckboxField
                name="phex"
                label="vehicle.wasPhevExemptBefore2025_04_01"
                state={normalizedState}
                onChange={onChange}
              />
              <CheckboxField
                name="phbc"
                label="vehicle.hasBindingCommitmentPre2025_04_01"
                state={normalizedState}
                onChange={onChange}
              />
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Running Costs / Included Expenses</h3>
            <div className={styles.fieldGrid}>
              <TextField
                name="rr"
                label="runningCosts.annualRegistration (AUD/year)"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="0.01"
              />
              <TextField
                name="ri"
                label="runningCosts.annualInsurance (AUD/year)"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="0.01"
              />
              <TextField
                name="rm"
                label="runningCosts.annualMaintenance (AUD/year)"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="0.01"
              />
              <TextField
                name="rt"
                label="runningCosts.annualTyres (AUD/year)"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="0.01"
              />
              <TextField
                name="rf"
                label="runningCosts.annualFuelOrElectricity (AUD/year)"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="0.01"
              />
              <TextField
                name="ro"
                label="runningCosts.annualOtherEligibleCarExpenses (AUD/year)"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="0.01"
              />
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Options</h3>
            <div className={styles.fieldGrid}>
              <CheckboxField
                name="ue"
                label="packaging.useEcm"
                state={normalizedState}
                onChange={onChange}
              />
              <CheckboxField
                name="evt"
                label="packaging.evFbtExemptionToggle"
                state={normalizedState}
                onChange={onChange}
              />
              <CheckboxField
                name="irc"
                label="packaging.includeRunningCostsInPackage"
                state={normalizedState}
                onChange={onChange}
              />
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Quote Context (Optional)</h3>
            <div className={styles.fieldGrid}>
              <TextField
                name="qn"
                label="quoteContext.providerName"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
              />
              <TextField
                name="qpp"
                label="quoteContext.quotedPayPeriodDeductionTotal (AUD)"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="0.01"
              />
              <TextField
                name="qad"
                label="quoteContext.quotedAnnualDeductionTotal (AUD)"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="0.01"
              />
              <TextField
                name="qrv"
                label="quoteContext.quotedResidualValue (AUD)"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="0.01"
              />
              <TextField
                name="qrp"
                label="quoteContext.quotedResidualPct (decimal)"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="0.0001"
              />
              <TextField
                name="qri"
                label="quoteContext.quotedInterestRatePct"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="0.01"
              />
              <TextField
                name="quf"
                label="quoteContext.quotedUpfrontFeesTotal (AUD)"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="0.01"
              />
              <TextField
                name="qmf"
                label="quoteContext.quotedMonthlyAdminFee (AUD/month)"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                type="number"
                step="0.01"
              />
            </div>
            <div className={styles.fieldGrid}>
              <CheckboxField
                name="qir"
                label="quoteContext.quoteListsInterestRate"
                state={normalizedState}
                onChange={onChange}
              />
              <CheckboxField
                name="qrw"
                label="quoteContext.quoteIncludesRunningCosts"
                state={normalizedState}
                onChange={onChange}
              />
              <CheckboxField
                name="qfu"
                label="quoteContext.quoteIncludesFuel"
                state={normalizedState}
                onChange={onChange}
              />
            </div>
          </section>

          <p className={styles.muted}>
            Shareable URL sync is enabled. Editing inputs updates the query
            string and reloading restores the scenario.
          </p>
          <div className={styles.mapping}>
            <span>Query param mapping (stable short keys):</span>
            {Object.entries(NOVATED_LEASE_QUERY_PARAM_MAP).map(([key, path]) => (
              <span key={key}>
                {key} = {path}
              </span>
            ))}
          </div>
        </div>
      }
      results={
        <div className={styles.summary}>
          {hasUiErrors ? (
            <div className={styles.issueError}>
              Inputs are invalid. Fix inline field errors to view calculated
              results.
            </div>
          ) : null}

          {!hasUiErrors && engineResult && headline ? (
            <>
              <div className={styles.headlineGrid}>
                <div className={styles.headlineCard}>
                  <p className={styles.headlineLabel}>Monthly Out-of-Pocket</p>
                  <p className={styles.headlineValue}>
                    {currencyFormatter.format(headline.monthlyOutOfPocket)}
                  </p>
                </div>
                <div className={styles.headlineCard}>
                  <p className={styles.headlineLabel}>Total Effective Cost (Annual)</p>
                  <p className={styles.headlineValue}>
                    {currencyFormatter.format(headline.totalEffectiveAnnualCost)}
                  </p>
                </div>
                <div className={styles.headlineCard}>
                  <p className={styles.headlineLabel}>Residual Value</p>
                  <p className={styles.headlineValue}>
                    {currencyFormatter.format(headline.residualValue)}
                  </p>
                </div>
              </div>

              <div className={styles.subSection}>
                <h3 className={styles.subTitle}>Packaging Breakdown</h3>
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
                    <span>Post-tax ECM deduction (annual)</span>
                    <span className={styles.value}>
                      {currencyFormatter.format(
                        engineResult.packaging?.annualPostTaxDeduction ?? 0,
                      )}
                    </span>
                  </div>
                  <div className={styles.row}>
                    <span>Running costs packaged (annual)</span>
                    <span className={styles.value}>
                      {currencyFormatter.format(
                        engineResult.packaging?.annualRunningCostsPackaged ?? 0,
                      )}
                    </span>
                  </div>
                  <div className={styles.row}>
                    <span>Finance + recurring fees (annual)</span>
                    <span className={styles.value}>
                      {currencyFormatter.format(
                        engineResult.packaging?.annualFinanceRepaymentsPackaged ?? 0,
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
              </div>

              <div className={styles.subSection}>
                <h3 className={styles.subTitle}>Lease + FBT Details</h3>
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

              <div className={styles.subSection}>
                <h3 className={styles.subTitle}>Assumptions & Disclaimer</h3>
                <p className={styles.muted}>
                  Estimates only. This calculator is not financial, tax, or legal
                  advice. Validate assumptions with your adviser and quote provider.
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
            </>
          ) : null}
        </div>
      }
    />
  );
}
