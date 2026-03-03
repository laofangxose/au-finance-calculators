"use client";

import { useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalculatorPage } from "@/components/calculator/CalculatorPage";
import { useI18n } from "@/i18n/I18nProvider";
import {
  calculateAmortization,
  DEFAULT_LOAN_REPAYMENT_FORM_STATE,
  normalizeLoanRepaymentFormState,
  paymentsPerYear,
  solvePrincipalFromPayment,
  toForwardInput,
  toReverseInput,
  validateLoanRepaymentFormState,
  type LoanRepaymentFrequency,
  type LoanRepaymentFormState,
} from "@/lib/calculators/loanRepayment";
import { useQueryState } from "@/lib/urlState/useQueryState";
import styles from "./LoanRepaymentCalculator.module.css";

function downsampleSchedule<T>(items: T[], maxPoints: number): T[] {
  if (items.length <= maxPoints) return items;
  const step = Math.ceil(items.length / maxPoints);
  const sampled: T[] = [];
  for (let index = 0; index < items.length; index += step) {
    sampled.push(items[index]);
  }
  const last = items[items.length - 1];
  if (sampled[sampled.length - 1] !== last) sampled.push(last);
  return sampled;
}

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
};

function Field({ label, hint, error, children }: FieldProps) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {hint ? <span className={styles.hint}>{hint}</span> : null}
      {children}
      {error ? <span className={styles.error}>{error}</span> : null}
    </label>
  );
}

export function LoanRepaymentCalculator() {
  const { locale, t } = useI18n();
  const [state, setState] = useQueryState(DEFAULT_LOAN_REPAYMENT_FORM_STATE);
  const normalizedState = normalizeLoanRepaymentFormState(state);
  const fieldErrors = validateLoanRepaymentFormState(normalizedState);
  const hasErrors = Object.keys(fieldErrors).length > 0;

  const result = hasErrors
    ? null
    : normalizedState.m === "forward"
      ? calculateAmortization(toForwardInput(normalizedState))
      : solvePrincipalFromPayment(toReverseInput(normalizedState));

  const errorIssues = result?.validationIssues ?? [];
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-AU", {
        style: "currency",
        currency: "AUD",
        maximumFractionDigits: 2,
      }),
    [locale],
  );
  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-AU", {
        maximumFractionDigits: 2,
      }),
    [locale],
  );

  const frequency = normalizedState.f as LoanRepaymentFrequency;
  const periodsPerYear = paymentsPerYear(frequency);
  const useMonthAxis = frequency === "monthly";
  const chartData = downsampleSchedule(result?.amortizationSchedule ?? [], 240).map(
    (row) => {
      const elapsedYears = row.periodIndex / periodsPerYear;
      return {
        ...row,
        elapsedYears,
        elapsedMonths: elapsedYears * 12,
      };
    },
  );

  const onChange = (name: keyof LoanRepaymentFormState, value: string) => {
    setState((prev) => {
      const next = normalizeLoanRepaymentFormState({
        ...prev,
        [name]: value,
      });
      if (name === "m" && value === "reverse" && next.rt === "IO") {
        next.rt = "PI";
      }
      return next;
    });
  };

  const formatWhole = (value: unknown) =>
    Number.isFinite(Number(value)) ? String(Math.round(Number(value))) : "0";

  return (
    <CalculatorPage
      title={t("loanRepayment.pageTitle")}
      description={t("loanRepayment.description")}
      inputPanelTitle={t("calculatorPage.inputs")}
      resultsPanelTitle={t("calculatorPage.results")}
      form={
        <div className={styles.stack}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t("loanRepayment.mode.title")}</h3>
            <div className={styles.modeRow}>
              <button
                type="button"
                className={`${styles.modeButton} ${normalizedState.m === "forward" ? styles.modeButtonActive : ""}`}
                onClick={() => onChange("m", "forward")}
              >
                {t("loanRepayment.mode.forward")}
              </button>
              <button
                type="button"
                className={`${styles.modeButton} ${normalizedState.m === "reverse" ? styles.modeButtonActive : ""}`}
                onClick={() => onChange("m", "reverse")}
              >
                {t("loanRepayment.mode.reverse")}
              </button>
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t("loanRepayment.fields.repaymentType.label")}</h3>
            <div className={styles.modeRow}>
              <button
                type="button"
                className={`${styles.modeButton} ${normalizedState.rt === "PI" ? styles.modeButtonActive : ""}`}
                onClick={() => onChange("rt", "PI")}
              >
                {t("loanRepayment.repaymentType.pi")}
              </button>
              <button
                type="button"
                className={`${styles.modeButton} ${normalizedState.rt === "IO" ? styles.modeButtonActive : ""}`}
                onClick={() => onChange("rt", "IO")}
                disabled={normalizedState.m === "reverse"}
              >
                {t("loanRepayment.repaymentType.io")}
              </button>
            </div>
            <p className={styles.hint}>{t("loanRepayment.help.io")}</p>
            {normalizedState.m === "reverse" ? (
              <p className={styles.issue}>{t("loanRepayment.note.reverseIoNotSupported")}</p>
            ) : null}
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t("loanRepayment.inputs.title")}</h3>
            <div className={styles.grid}>
              {normalizedState.m === "forward" ? (
                <Field
                  label={t("loanRepayment.fields.principal.label")}
                  hint={t("loanRepayment.fields.principal.hint")}
                  error={fieldErrors.p ? t(fieldErrors.p) : undefined}
                >
                  <input
                    className={styles.input}
                    type="number"
                    step="0.01"
                    value={normalizedState.p}
                    onChange={(event) => onChange("p", event.target.value)}
                    aria-invalid={Boolean(fieldErrors.p)}
                  />
                </Field>
              ) : (
                <Field
                  label={t("loanRepayment.fields.payment.label")}
                  hint={t("loanRepayment.fields.payment.hint")}
                  error={fieldErrors.pm ? t(fieldErrors.pm) : undefined}
                >
                  <input
                    className={styles.input}
                    type="number"
                    step="0.01"
                    value={normalizedState.pm}
                    onChange={(event) => onChange("pm", event.target.value)}
                    aria-invalid={Boolean(fieldErrors.pm)}
                  />
                </Field>
              )}

              <Field
                label={t("loanRepayment.fields.rate.label")}
                hint={t("loanRepayment.fields.rate.hint")}
                error={fieldErrors.r ? t(fieldErrors.r) : undefined}
              >
                <input
                  className={styles.input}
                  type="number"
                  step="0.01"
                  value={normalizedState.r}
                  onChange={(event) => onChange("r", event.target.value)}
                  aria-invalid={Boolean(fieldErrors.r)}
                />
              </Field>

              <Field
                label={t("loanRepayment.fields.years.label")}
                hint={t("loanRepayment.fields.years.hint")}
                error={fieldErrors.y ? t(fieldErrors.y) : undefined}
              >
                <input
                  className={styles.input}
                  type="number"
                  step="1"
                  min="1"
                  value={normalizedState.y}
                  onChange={(event) => onChange("y", event.target.value)}
                  aria-invalid={Boolean(fieldErrors.y)}
                />
              </Field>

              <Field
                label={t("loanRepayment.fields.frequency.label")}
                hint={t("loanRepayment.fields.frequency.hint")}
              >
                <select
                  className={styles.select}
                  value={normalizedState.f}
                  onChange={(event) => onChange("f", event.target.value)}
                >
                  <option value="weekly">{t("loanRepayment.frequency.weekly")}</option>
                  <option value="fortnightly">{t("loanRepayment.frequency.fortnightly")}</option>
                  <option value="monthly">{t("loanRepayment.frequency.monthly")}</option>
                  <option value="yearly">{t("loanRepayment.frequency.yearly")}</option>
                </select>
              </Field>

              <Field
                label={t("loanRepayment.fields.offsetBalance.label")}
                hint={t("loanRepayment.help.offset")}
                error={fieldErrors.ob ? t(fieldErrors.ob) : undefined}
              >
                <input
                  className={styles.input}
                  type="number"
                  step="0.01"
                  min="0"
                  value={normalizedState.ob}
                  onChange={(event) => onChange("ob", event.target.value)}
                  aria-invalid={Boolean(fieldErrors.ob)}
                />
              </Field>

              <Field
                label={t("loanRepayment.fields.extraPayment.label")}
                hint={t("loanRepayment.help.extraPayment")}
                error={fieldErrors.ep ? t(fieldErrors.ep) : undefined}
              >
                <input
                  className={styles.input}
                  type="number"
                  step="0.01"
                  min="0"
                  value={normalizedState.ep}
                  onChange={(event) => onChange("ep", event.target.value)}
                  aria-invalid={Boolean(fieldErrors.ep)}
                />
              </Field>
            </div>
          </section>
        </div>
      }
      results={
        <div className={styles.stack}>
          {hasErrors ? (
            <div className={styles.issue}>{t("loanRepayment.validation.fixInputs")}</div>
          ) : null}

          {errorIssues.map((issue) => (
            <div key={`${issue.field}-${issue.code}`} className={styles.issue}>
              {issue.code === "PAYMENT_TOO_LOW_NEGATIVE_AMORTIZATION"
                ? t("loanRepayment.validation.paymentTooLow")
                : issue.code === "REVERSE_IO_NOT_SUPPORTED"
                  ? t("loanRepayment.note.reverseIoNotSupported")
                  : issue.message}
            </div>
          ))}

          {result ? (
            <>
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>{t("loanRepayment.outputs.title")}</h3>
                <div className={styles.summaryGrid}>
                  <article className={styles.summaryCard}>
                    <p className={styles.summaryLabel}>
                      {result.mode === "forward"
                        ? t("loanRepayment.outputs.paymentPerPeriod")
                        : t("loanRepayment.outputs.borrowingCapacity")}
                    </p>
                    <p className={styles.summaryValue}>
                      {currencyFormatter.format(
                        result.mode === "forward"
                          ? result.paymentPerPeriod
                          : result.principal,
                      )}
                    </p>
                  </article>
                  <article className={styles.summaryCard}>
                    <p className={styles.summaryLabel}>{t("loanRepayment.outputs.totalPaid")}</p>
                    <p className={styles.summaryValue}>
                      {currencyFormatter.format(result.summary.totalPaid)}
                    </p>
                  </article>
                  <article className={styles.summaryCard}>
                    <p className={styles.summaryLabel}>
                      {t("loanRepayment.outputs.totalInterest")}
                    </p>
                    <p className={styles.summaryValue}>
                      {currencyFormatter.format(result.summary.totalInterest)}
                    </p>
                  </article>
                  <article className={styles.summaryCard}>
                    <p className={styles.summaryLabel}>{t("loanRepayment.outputs.payments")}</p>
                    <p className={styles.summaryValue}>
                      {numberFormatter.format(result.amortizationSchedule.length)}
                    </p>
                  </article>
                </div>
              </section>

              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>{t("loanRepayment.chart.title")}</h3>
                <div className={styles.chartWrap}>
                  <ResponsiveContainer width="100%" height={320}>
                    <ComposedChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis
                        dataKey={useMonthAxis ? "elapsedMonths" : "elapsedYears"}
                        tick={{ fill: "var(--muted)", fontSize: 12 }}
                        tickFormatter={(value: number) => formatWhole(value)}
                      />
                      <YAxis
                        yAxisId="balance"
                        tick={{ fill: "var(--muted)", fontSize: 12 }}
                        tickFormatter={(value: number) => numberFormatter.format(value)}
                      />
                      <YAxis
                        yAxisId="cashflow"
                        orientation="right"
                        tick={{ fill: "var(--muted)", fontSize: 12 }}
                        tickFormatter={(value: number) => numberFormatter.format(value)}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload || payload.length === 0) return null;
                          const row = payload[0]?.payload;
                          if (!row) return null;
                          const periodLabel = useMonthAxis
                            ? `${t("loanRepayment.chart.elapsedMonths")} ${formatWhole(label)}`
                            : `${t("loanRepayment.chart.elapsedYears")} ${formatWhole(label)}`;
                          return (
                            <div className={styles.tooltip}>
                              <p className={styles.tooltipTitle}>{periodLabel}</p>
                              <p>{`${t("loanRepayment.chart.balance")}: ${currencyFormatter.format(Number(row.remainingBalance ?? 0))}`}</p>
                              <p>{`${t("loanRepayment.chart.interest")}: ${currencyFormatter.format(Number(row.interest ?? 0))}`}</p>
                              <p>{`${t("loanRepayment.chart.principal")}: ${currencyFormatter.format(Number(row.principal ?? 0))}`}</p>
                              <p>{`${t("loanRepayment.chart.totalPayment")}: ${currencyFormatter.format(Number(row.payment ?? 0))}`}</p>
                            </div>
                          );
                        }}
                        cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
                      />
                      <Legend />
                      <Line
                        yAxisId="balance"
                        type="monotone"
                        dataKey="remainingBalance"
                        stroke="var(--accent)"
                        strokeWidth={2}
                        dot={false}
                        name={t("loanRepayment.chart.balance")}
                      />
                      <Bar
                        yAxisId="cashflow"
                        dataKey="interest"
                        fill="#d97706"
                        name={t("loanRepayment.chart.interest")}
                      />
                      <Bar
                        yAxisId="cashflow"
                        dataKey="principal"
                        fill="#2563eb"
                        name={t("loanRepayment.chart.principal")}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </>
          ) : null}
        </div>
      }
    />
  );
}
