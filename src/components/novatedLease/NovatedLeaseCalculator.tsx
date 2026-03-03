"use client";

import Link from "next/link";
import {
  useRef,
  useState,
  type FocusEvent,
} from "react";
import { novatedLeaseGlossary } from "@/content/glossary";
import { CalculatorPage } from "@/components/calculator/CalculatorPage";
import { useI18n } from "@/i18n/I18nProvider";
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

const DATA_SOURCE_LINKS = [
  {
    key: "incomeTaxRates",
    href: "https://www.ato.gov.au/rates/individual-income-tax-rates/",
  },
  {
    key: "medicareLevy",
    href:
      "https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy/what-is-the-medicare-levy",
  },
  {
    key: "fbtStatutory",
    href:
      "https://www.ato.gov.au/businesses-and-organisations/hiring-and-paying-your-workers/fringe-benefits-tax/types-of-fringe-benefits/fbt-on-cars-other-vehicles-parking-and-tolls/cars-and-fbt/taxable-value-of-a-car-fringe-benefit",
  },
  {
    key: "evExemption",
    href:
      "https://www.ato.gov.au/businesses-and-organisations/hiring-and-paying-your-workers/fringe-benefits-tax/types-of-fringe-benefits/fbt-on-cars-other-vehicles-parking-and-tolls/electric-cars-exemption",
  },
  {
    key: "phevTransition",
    href:
      "https://www.ato.gov.au/businesses-and-organisations/hiring-and-paying-your-workers/fringe-benefits-tax/types-of-fringe-benefits/fbt-on-cars-other-vehicles-parking-and-tolls/fbt-on-plug-in-hybrid-electric-vehicles",
  },
  {
    key: "lctThresholds",
    href: "https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/luxury-car-tax/rates-and-thresholds",
  },
];

type FieldErrors = Partial<Record<keyof NovatedLeaseFormState, string>>;

function glossary(term: string) {
  return novatedLeaseGlossary.find((entry) => entry.term === term);
}

function GlossaryTip({ term, label }: { term: string; label?: string }) {
  const { t } = useI18n();
  const entry = glossary(term);
  if (!entry) return null;
  const short = t(`novated.glossary.${term}.short`, { fallback: entry.short });
  const detail = t(`novated.glossary.${term}.detail`, { fallback: entry.detail });
  return (
    <span className={styles.glossaryTip}>
      <button
        type="button"
        className={styles.glossaryAbbr}
        aria-label={`${entry.term}: ${short}`}
      >
        {label ?? term}
      </button>
      <span className={styles.glossaryTooltip} role="tooltip">
        <strong>{entry.term}:</strong> {short} {detail}
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
  const { t } = useI18n();
  const meta = novatedLeaseFieldMeta[name];
  const label = t(`novated.fields.${name}.label`, { fallback: meta.label });
  const description = t(`novated.fields.${name}.description`, {
    fallback: meta.description,
  });
  return (
    <label className={styles.field}>
      <span className={styles.label}>
        {label}
        {meta.unit !== "none" ? ` (${meta.unit})` : ""}
      </span>
      <span className={styles.hint}>{description}</span>
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
  const { t } = useI18n();
  const meta = novatedLeaseFieldMeta[name];
  const label = t(`novated.fields.${name}.label`, { fallback: meta.label });
  const description = t(`novated.fields.${name}.description`, {
    fallback: meta.description,
  });
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <span className={styles.hint}>{description}</span>
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
  const { t } = useI18n();
  const meta = novatedLeaseFieldMeta[name];
  const label = t(`novated.fields.${name}.label`, { fallback: meta.label });
  const description = t(`novated.fields.${name}.description`, {
    fallback: meta.description,
  });
  return (
    <label className={styles.field}>
      <span className={styles.hint}>{description}</span>
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

function differenceLabel(value: number, t: ReturnType<typeof useI18n>["t"]): string {
  if (value < 0) return t("novated.differenceSave");
  if (value > 0) return t("novated.differenceBuyCheaper");
  return t("novated.differenceSimilar");
}

function toFriendlyIssueMessage(
  issue: { code: string; message: string },
  t: ReturnType<typeof useI18n>["t"],
): string {
  const mapped: Record<string, string> = {
    QUOTE_INTEREST_RATE_INFERRED: t("novated.issueQuoteRateFallback"),
    QUOTE_MODEL_VARIANCE_MODERATE: t("novated.issueVarianceModerate"),
    QUOTE_MODEL_VARIANCE_HIGH: t("novated.issueVarianceHigh"),
    HIGH_DEDUCTION_RATIO: t("novated.issueHighDeduction"),
    NEGATIVE_PACKAGED_TAXABLE_INCOME: t("novated.issueNegativeTaxableIncome"),
  };
  return mapped[issue.code] ?? issue.message;
}

export function NovatedLeaseCalculator() {
  const { t } = useI18n();
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
  } | null>(() => {
    if (hasUiErrors) {
      return null;
    }
    const initialResult = calculateNovatedLease(adaptedInput);
    return {
      snapshot: currentSnapshot,
      result: initialResult,
    };
  });

  const hasPendingRecalculation =
    calculatedState !== null && calculatedState.snapshot !== currentSnapshot;

  const runCalculation = () => {
    if (hasUiErrors) {
      return;
    }
    const nextEngineResult = calculateNovatedLease(adaptedInput);
    setCalculatedState({
      snapshot: currentSnapshot,
      result: nextEngineResult,
    });
  };
  const canCalculate =
    !hasUiErrors && (hasPendingRecalculation || calculatedState === null);

  const engineResult = calculatedState?.result ?? null;
  const comparison = engineResult ? getBuyOutrightComparison(engineResult) : null;

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
      title={t("novated.title")}
      description={t("novated.description")}
      inputPanelTitle={t("calculatorPage.inputs")}
      resultsPanelTitle={t("calculatorPage.results")}
      resultsTop={
        <div className={styles.execActionRow}>
          <button
            className={styles.calculateBtnLarge}
            type="button"
            onClick={runCalculation}
            disabled={!canCalculate}
          >
            {t("novated.calculate")}
          </button>
          <p className={styles.muted}>
            {canCalculate
              ? t("novated.statusDirty")
              : hasUiErrors
                ? t("novated.statusFixErrors")
                : t("novated.statusLatest")}
          </p>
        </div>
      }
      disclaimer={
        <div className={styles.disclaimerBlock}>
          <p>{t("novated.disclaimerShort")}</p>
          <p className={styles.disclaimerLinks}>
            <Link href="/terms">{t("footer.terms")}</Link>
            <span> · </span>
            <Link href="/privacy">{t("footer.privacy")}</Link>
          </p>
        </div>
      }
      form={
        <div
          ref={formRef}
          className={styles.stack}
          onFocusCapture={onFormFocusCapture}
          onBlurCapture={onFormBlurCapture}
        >
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t("novated.sectionInputStyle")}</h3>
            <SelectField
              name="im"
              state={normalizedState}
              errors={fieldErrors}
              onChange={onChange}
              options={[
                {
                  value: "quote",
                  label: t("novated.fields.im.optionQuote", {
                    fallback: "Quote mode (recommended)",
                  }),
                },
                {
                  value: "detailed",
                  label: t("novated.fields.im.optionDetailed", {
                    fallback: "Detailed mode (advanced)",
                  }),
                },
              ]}
            />
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t("novated.sectionYourSituation")}</h3>
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
                  { value: "ice", label: t("novated.vehicle.ice", { fallback: "Petrol / Diesel" }) },
                  { value: "hev", label: t("novated.vehicle.hev", { fallback: "Hybrid" }) },
                  { value: "phev", label: t("novated.vehicle.phev", { fallback: "Plug-in Hybrid" }) },
                  { value: "bev", label: t("novated.vehicle.bev", { fallback: "Electric vehicle" }) },
                  { value: "fcev", label: t("novated.vehicle.fcev", { fallback: "Hydrogen vehicle" }) },
                ]}
              />
              <SelectField
                name="tm"
                state={normalizedState}
                errors={fieldErrors}
                onChange={onChange}
                options={[
                  { value: "12", label: t("novated.term.12", { fallback: "12 months" }) },
                  { value: "24", label: t("novated.term.24", { fallback: "24 months" }) },
                  { value: "36", label: t("novated.term.36", { fallback: "36 months" }) },
                  { value: "48", label: t("novated.term.48", { fallback: "48 months" }) },
                  { value: "60", label: t("novated.term.60", { fallback: "60 months" }) },
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
                  { value: "weekly", label: t("novated.pay.weekly", { fallback: "Weekly" }) },
                  {
                    value: "fortnightly",
                    label: t("novated.pay.fortnightly", { fallback: "Fortnightly" }),
                  },
                  { value: "monthly", label: t("novated.pay.monthly", { fallback: "Monthly" }) },
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
                <h3 className={styles.sectionTitle}>{t("novated.sectionRunningCosts")}</h3>
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
                <summary className={styles.detailsTitle}>{t("novated.advancedDetailed")}</summary>
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
                <h3 className={styles.sectionTitle}>{t("novated.sectionQuoteInputs")}</h3>
                <div className={styles.fieldGrid}>
                  <TextField name="qmp" state={normalizedState} errors={fieldErrors} onChange={onChange} type="number" step="0.01" />
                  <TextField name="rat" state={normalizedState} errors={fieldErrors} onChange={onChange} type="number" step="0.01" />
                  <CheckboxField name="irc" state={normalizedState} onChange={onChange} />
                </div>
              </section>
              <details className={styles.detailsBlock}>
                <summary className={styles.detailsTitle}>{t("novated.advancedQuote")}</summary>
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
            {t("novated.quickGlossary")} <GlossaryTip term="FBT" />,{" "}
            <GlossaryTip term="ECM" />, <GlossaryTip term="Residual" />,{" "}
            <GlossaryTip term="PHEV" />.
          </p>
        </div>
      }
      results={
        <div className={styles.summary}>
          {isEditingInputs ? (
            <div className={styles.issueWarning}>
              {t("novated.statusEditing")}
            </div>
          ) : null}
          {!isEditingInputs && hasPendingRecalculation && !hasUiErrors ? (
            <div className={styles.issueWarning}>{t("novated.statusOutdated")}</div>
          ) : null}
          {hasUiErrors ? (
            <div className={styles.issueError}>
              {t("novated.inputAttention")}
            </div>
          ) : null}

          {engineResult && comparison ? (
            <>
              <section className={styles.executiveSection}>
                <h3 className={styles.execTitle}>{t("novated.executiveSummary")}</h3>
                <div className={styles.headlineGrid}>
                  <div className={styles.headlineCard}>
                    <p className={styles.headlineLabel}>{t("novated.novatedMonthlyOutOfPocket")}</p>
                    <p className={styles.headlineValue}>
                      {currencyFormatter.format(comparison.novatedMonthlyOutOfPocket)}
                    </p>
                  </div>
                  <div className={styles.headlineCard}>
                    <p className={styles.headlineLabel}>{t("novated.buyMonthlyEquivalent")}</p>
                    <p className={styles.headlineValue}>
                      {currencyFormatter.format(comparison.monthlyEquivalentCost)}
                    </p>
                  </div>
                  <div className={styles.headlineCard}>
                    <p className={styles.headlineLabel}>{t("novated.novatedTotalTerm")}</p>
                    <p className={styles.headlineValue}>
                      {currencyFormatter.format(comparison.novatedTotalCostOverTerm)}
                    </p>
                  </div>
                  <div className={styles.headlineCard}>
                    <p className={styles.headlineLabel}>{t("novated.totalDifferenceTerm")}</p>
                    <p className={styles.headlineValue}>
                      {currencyFormatter.format(comparison.totalCostDifferenceOverTerm)}
                    </p>
                  </div>
                </div>
                <ul className={styles.explainList}>
                  <li>
                    {t("novated.differenceExplain", {
                      params: {
                        label: differenceLabel(comparison.totalCostDifferenceOverTerm, t),
                      },
                    })}
                  </li>
                  <li>
                    {t("novated.taxSavingsOverTerm", {
                      params: {
                        value: currencyFormatter.format(
                          engineResult.taxComparison?.taxAndLevySavings ?? 0,
                        ),
                      },
                    })}
                  </li>
                  <li>
                    {t("novated.rateApplied", {
                      params: {
                        value: numberFormatter.format(comparison.opportunityCostRateAssumed),
                      },
                    })}
                  </li>
                </ul>
              </section>

              <section className={styles.compareSection}>
                <h3 className={styles.execTitle}>{t("novated.comparisonTitle")}</h3>
                <div className={styles.compareGrid}>
                  <article className={styles.compareCard}>
                    <h4 className={styles.compareTitle}>{t("novated.cardNovated")}</h4>
                    <div className={styles.breakdownList}>
                      <div className={styles.row}>
                        <span>{t("novated.linePreTaxAnnual")}</span>
                        <span className={styles.value}>
                          {currencyFormatter.format(
                            engineResult.packaging?.annualPreTaxDeduction ?? 0,
                          )}
                        </span>
                      </div>
                      <div className={styles.row}>
                        <span>
                          {t("novated.linePostTaxAnnual")} <GlossaryTip term="ECM" />
                        </span>
                        <span className={styles.value}>
                          {currencyFormatter.format(
                            engineResult.packaging?.annualPostTaxDeduction ?? 0,
                          )}
                        </span>
                      </div>
                      <div className={styles.row}>
                        <span>{t("novated.lineTaxSaved")}</span>
                        <span className={styles.value}>
                          {currencyFormatter.format(
                            engineResult.taxComparison?.taxAndLevySavings ?? 0,
                          )}
                        </span>
                      </div>
                      <div className={styles.row}>
                        <span>{t("novated.lineTotalTermInclResidual")}</span>
                        <span className={styles.value}>
                          {currencyFormatter.format(comparison.novatedTotalCostOverTerm)}
                        </span>
                      </div>
                      <div className={styles.row}>
                        <span>{t("novated.lineOpportunityBenefit")}</span>
                        <span className={styles.value}>
                          {currencyFormatter.format(
                            comparison.estimatedForgoneEarningsOverTerm,
                          )}
                        </span>
                      </div>
                    </div>
                  </article>
                  <article className={styles.compareCard}>
                    <h4 className={styles.compareTitle}>{t("novated.cardBuyOutright")}</h4>
                    <div className={styles.breakdownList}>
                      <div className={styles.row}>
                        <span>{t("novated.lineVehiclePrice")}</span>
                        <span className={styles.value}>
                          {currencyFormatter.format(adaptedInput.vehicle.purchasePriceInclGst)}
                        </span>
                      </div>
                      <div className={styles.row}>
                        <span>{t("novated.lineTotalCashOutlay")}</span>
                        <span className={styles.value}>
                          {currencyFormatter.format(comparison.totalCashOutlayOverTerm)}
                        </span>
                      </div>
                      <div className={styles.row}>
                        <span>{t("novated.lineRunningCostsTerm")}</span>
                        <span className={styles.value}>
                          {currencyFormatter.format(comparison.outrightRunningCostsOverTerm)}
                        </span>
                      </div>
                      <div className={styles.row}>
                        <span>{t("novated.lineLctInPrice")}</span>
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

              <details className={styles.detailsBlock}>
                <summary className={styles.detailsTitle}>{t("novated.breakdownTitle")}</summary>
                <div className={styles.detailsContent}>
                  <div className={styles.breakdownList}>
                    <div className={styles.row}>
                      <span>{t("novated.lineAnnualPackageBeforeEcm")}</span>
                      <span className={styles.value}>
                        {currencyFormatter.format(
                          engineResult.packaging?.annualPackageCostBeforeEcm ?? 0,
                        )}
                      </span>
                    </div>
                    <div className={styles.row}>
                      <span>{t("novated.linePeriodicRepayment")}</span>
                      <span className={styles.value}>
                        {currencyFormatter.format(
                          engineResult.lease?.periodicFinanceRepayment ?? 0,
                        )}
                      </span>
                    </div>
                    <div className={styles.row}>
                      <span>{t("novated.lineResidual")}</span>
                      <span className={styles.value}>
                        {currencyFormatter.format(engineResult.lease?.residualValue ?? 0)}
                      </span>
                    </div>
                    <div className={styles.row}>
                      <span>
                        {t("novated.lineFbtGross")} <GlossaryTip term="FBT" />
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
                <summary className={styles.detailsTitle}>{t("novated.assumptionsTitle")}</summary>
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
                <summary className={styles.detailsTitle}>{t("novated.sourcesTitle")}</summary>
                <div className={styles.detailsContent}>
                  <ul className={styles.sourceList}>
                    {DATA_SOURCE_LINKS.map((source) => (
                      <li key={source.href}>
                        <a href={source.href} target="_blank" rel="noreferrer noopener">
                          {t(`novated.sources.${source.key}`)}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </details>

              <details className={styles.detailsBlock}>
                <summary className={styles.detailsTitle}>{t("novated.glossaryTitle")}</summary>
                <div className={styles.detailsContent}>
                  <div className={styles.glossaryList}>
                    {novatedLeaseGlossary.map((entry) => (
                      <div key={entry.term} className={styles.glossaryItem}>
                        <strong>{entry.term}</strong>
                        <p>
                          {t(`novated.glossary.${entry.term}.short`, {
                            fallback: entry.short,
                          })}
                        </p>
                        <p className={styles.muted}>
                          {t(`novated.glossary.${entry.term}.detail`, {
                            fallback: entry.detail,
                          })}
                        </p>
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
                      {toFriendlyIssueMessage(issue, t)}
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
