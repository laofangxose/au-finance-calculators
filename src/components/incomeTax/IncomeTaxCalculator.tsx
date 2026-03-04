"use client";

import Link from "next/link";
import { CalculatorPage } from "@/components/calculator/CalculatorPage";
import { useI18n } from "@/i18n/I18nProvider";
import {
  calculateIncomeTax,
  DEFAULT_INCOME_TAX_FORM_STATE,
  normalizeIncomeTaxFormState,
  supportedFinancialYears,
  toIncomeTaxInput,
  validateIncomeTaxFormState,
  type IncomeFrequency,
  type IncomeTaxFormState,
} from "@/lib/calculators/incomeTax";
import { useQueryState } from "@/lib/urlState/useQueryState";
import styles from "./IncomeTaxCalculator.module.css";

const frequencyOrder: IncomeFrequency[] = [
  "annual",
  "monthly",
  "fortnightly",
  "weekly",
];

const breakdownMetrics: Array<{
  key:
    | "taxableIncome"
    | "baseSalary"
    | "bonusIncome"
    | "additionalIncome"
    | "employerSuper"
    | "totalPackage"
    | "incomeTax"
    | "medicareLevy"
    | "totalWithheld"
    | "netIncome";
  tone: "default" | "warning" | "primary";
}> = [
  { key: "netIncome", tone: "primary" },
  { key: "taxableIncome", tone: "default" },
  { key: "baseSalary", tone: "default" },
  { key: "bonusIncome", tone: "default" },
  { key: "additionalIncome", tone: "default" },
  { key: "employerSuper", tone: "default" },
  { key: "totalPackage", tone: "default" },
  { key: "incomeTax", tone: "warning" },
  { key: "medicareLevy", tone: "warning" },
  { key: "totalWithheld", tone: "warning" },
];

type FieldProps = {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
};

function Field({ label, error, className, children }: FieldProps) {
  return (
    <label className={className ? `${styles.field} ${className}` : styles.field}>
      <span className={styles.label}>{label}</span>
      {children}
      {error ? <span className={styles.error}>{error}</span> : null}
    </label>
  );
}

export function IncomeTaxCalculator() {
  const { locale, t } = useI18n();
  const [state, setState] = useQueryState(DEFAULT_INCOME_TAX_FORM_STATE);
  const normalized = normalizeIncomeTaxFormState(state);
  const formErrors = validateIncomeTaxFormState(normalized);
  const hasErrors = Object.keys(formErrors).length > 0;
  const result = hasErrors ? null : calculateIncomeTax(toIncomeTaxInput(normalized));

  const currencyFormatter = new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 2,
  });
  const percentFormatter = new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-AU", {
    style: "percent",
    maximumFractionDigits: 2,
  });

  const onChange = (name: keyof IncomeTaxFormState, value: string) => {
    setState((prev) =>
      normalizeIncomeTaxFormState({
        ...prev,
        [name]: value,
      }),
    );
  };

  return (
    <CalculatorPage
      title={t("incomeTax.title")}
      description={t("incomeTax.subtitle")}
      feedback={
        <p>
          {t("feedback.prompt")}{" "}
          <Link href="mailto:au.finance.tools@gmail.com?subject=AU Finance Calculators Feedback">
            {t("feedback.action")}
          </Link>
        </p>
      }
      inputPanelTitle={t("calculatorPage.inputs")}
      resultsPanelTitle={t("calculatorPage.results")}
      layoutVariant="stacked"
      form={
        <div className={styles.stack}>
          <div className={styles.dropdownRow}>
            <Field
              className={styles.compactField}
              label={t("incomeTax.inputs.financialYear")}
              error={formErrors.fy ? t(formErrors.fy) : undefined}
            >
              <select
                className={styles.select}
                value={normalized.fy}
                onChange={(event) => onChange("fy", event.target.value)}
              >
                {supportedFinancialYears.map((fy) => (
                  <option key={fy} value={fy}>
                    {fy}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              className={styles.compactField}
              label={t("incomeTax.inputs.salaryType")}
              error={formErrors.salaryType ? t(formErrors.salaryType) : undefined}
            >
              <select
                className={styles.select}
                value={normalized.salaryType}
                onChange={(event) => onChange("salaryType", event.target.value)}
              >
                <option value="EXCL_SUPER">{t("incomeTax.inputs.salaryTypeExcl")}</option>
                <option value="INCL_SUPER">{t("incomeTax.inputs.salaryTypeIncl")}</option>
              </select>
            </Field>

            <Field
              className={styles.compactField}
              label={t("incomeTax.inputs.frequency")}
              error={formErrors.freq ? t(formErrors.freq) : undefined}
            >
              <select
                className={styles.select}
                value={normalized.freq}
                onChange={(event) => onChange("freq", event.target.value)}
              >
                <option value="annual">{t("incomeTax.frequency.annual")}</option>
                <option value="monthly">{t("incomeTax.frequency.monthly")}</option>
                <option value="fortnightly">{t("incomeTax.frequency.fortnightly")}</option>
                <option value="weekly">{t("incomeTax.frequency.weekly")}</option>
              </select>
            </Field>
          </div>

          <Field
            label={t("incomeTax.inputs.amount")}
            error={formErrors.amount ? t(formErrors.amount) : undefined}
          >
            <input
              className={styles.input}
              type="number"
              step="0.01"
              min="0"
              value={normalized.amount}
              onChange={(event) => onChange("amount", event.target.value)}
            />
          </Field>

          <Field
            label={t("incomeTax.inputs.bonusPercent")}
            error={formErrors.bonus ? t(formErrors.bonus) : undefined}
          >
            <input
              className={styles.input}
              type="number"
              step="0.01"
              min="0"
              value={normalized.bonus}
              onChange={(event) => onChange("bonus", event.target.value)}
            />
          </Field>

          <Field
            label={t("incomeTax.inputs.additionalIncome")}
            error={formErrors.addIncome ? t(formErrors.addIncome) : undefined}
          >
            <input
              className={styles.input}
              type="number"
              step="0.01"
              min="0"
              value={normalized.addIncome}
              onChange={(event) => onChange("addIncome", event.target.value)}
            />
          </Field>
        </div>
      }
      disclaimer={
        <div className={styles.disclaimer}>
          <p>{t("incomeTax.disclaimer.general")}</p>
          <ul>
            <li>{t("incomeTax.disclaimer.exclusion1")}</li>
            <li>{t("incomeTax.disclaimer.exclusion2")}</li>
            <li>{t("incomeTax.disclaimer.exclusion3")}</li>
            <li>{t("incomeTax.disclaimer.exclusion4")}</li>
          </ul>
        </div>
      }
      results={
        <div className={styles.stack}>
          {hasErrors ? (
            <div className={styles.errorCard}>{t("incomeTax.errors.fixInputs")}</div>
          ) : null}
          {result && !result.isValid ? (
            <div className={styles.errorCard}>
              {result.validationIssues.map((issue) => (
                <p key={`${issue.field}-${issue.code}`}>{issue.message}</p>
              ))}
            </div>
          ) : null}

          {result && result.isValid ? (
            <>
              <section className={styles.summary}>
                <article className={`${styles.summaryCard} ${styles.summaryCardPrimary}`}>
                  <p className={styles.summaryLabel}>{t("incomeTax.labels.netIncome")}</p>
                  <p className={styles.summaryValue}>
                    {currencyFormatter.format(result.annual.netIncome)}
                  </p>
                </article>
                <article className={styles.summaryCard}>
                  <p className={styles.summaryLabel}>{t("incomeTax.labels.baseSalary")}</p>
                  <p className={styles.summaryValue}>
                    {currencyFormatter.format(result.annual.baseSalary)}
                  </p>
                </article>
                <article className={`${styles.summaryCard} ${styles.summaryCardWarning}`}>
                  <p className={styles.summaryLabel}>{t("incomeTax.labels.totalWithheld")}</p>
                  <p className={styles.summaryValue}>
                    {currencyFormatter.format(result.annual.totalWithheld)}
                  </p>
                </article>
                <article className={styles.summaryCard}>
                  <p className={styles.summaryLabel}>{t("incomeTax.labels.employerSuper")}</p>
                  <p className={styles.summaryValue}>
                    {currencyFormatter.format(result.annual.employerSuper)}
                  </p>
                </article>
                <article className={styles.summaryCard}>
                  <p className={styles.summaryLabel}>{t("incomeTax.labels.totalPackage")}</p>
                  <p className={styles.summaryValue}>
                    {currencyFormatter.format(result.annual.totalPackage)}
                  </p>
                </article>
                <article className={styles.summaryCard}>
                  <p className={styles.summaryLabel}>{t("incomeTax.outputs.summary.effectiveRate")}</p>
                  <p className={styles.summaryValue}>
                    {percentFormatter.format(result.effectiveTaxRate)}
                  </p>
                </article>
              </section>

              <section className={styles.breakdown}>
                <h3 className={styles.sectionTitle}>{t("incomeTax.outputs.breakdown.title")}</h3>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>{t("incomeTax.outputs.breakdown.metric")}</th>
                        {frequencyOrder.map((frequency) => (
                          <th key={frequency}>{t(`incomeTax.frequency.${frequency}`)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {breakdownMetrics.map((metric) => (
                        <tr
                          key={metric.key}
                          className={
                            metric.tone === "primary"
                              ? styles.rowPrimary
                              : metric.tone === "warning"
                                ? styles.rowWarning
                                : undefined
                          }
                        >
                          <td>{t(`incomeTax.labels.${metric.key}`)}</td>
                          {frequencyOrder.map((frequency) => (
                            <td key={`${metric.key}-${frequency}`}>
                              {currencyFormatter.format(
                                result.byFrequency[frequency][
                                  metric.key as keyof (typeof result.byFrequency)[typeof frequency]
                                ] as number,
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : null}
        </div>
      }
    />
  );
}
