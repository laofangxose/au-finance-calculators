"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
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

function buildIntegerTicks(maxValue: number, targetTicks = 8): number[] {
  const safeMax = Math.max(1, Math.ceil(maxValue));
  const step = Math.max(1, Math.ceil(safeMax / Math.max(2, targetTicks - 1)));
  const ticks: number[] = [];
  for (let value = 0; value <= safeMax; value += step) {
    ticks.push(value);
  }
  if (ticks[ticks.length - 1] !== safeMax) {
    ticks.push(safeMax);
  }
  return ticks;
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
  const formRef = useRef<HTMLDivElement | null>(null);
  const lastTrackedSnapshotRef = useRef<string>("");
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
  const termYearsValue = Number(normalizedState.y);
  const useMonthAxis =
    frequency !== "yearly" && Number.isFinite(termYearsValue) && termYearsValue < 5;
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
  const chartKey = `${normalizedState.m}-${normalizedState.rt}-${normalizedState.f}-${chartData.length}`;
  const xMax =
    chartData.length > 0
      ? Number(
          chartData[chartData.length - 1][
            useMonthAxis ? "elapsedMonths" : "elapsedYears"
          ] ?? 0,
        )
      : 1;
  const xTicks = buildIntegerTicks(xMax);
  const interactionSnapshot = `${normalizedState.m}|${normalizedState.rt}|${normalizedState.f}|${normalizedState.ob}|${normalizedState.ep}|${normalizedState.p}|${normalizedState.pm}|${normalizedState.r}|${normalizedState.y}`;

  useEffect(() => {
    track("calculator_view", { calculator: "loan" });
  }, []);

  const emitLoanCalculate = () => {
    track("loan_calculate", {
      repaymentType: normalizedState.rt,
      frequency: normalizedState.f,
      hasOffset: Number(normalizedState.ob) > 0,
      hasExtraPayment: Number(normalizedState.ep) > 0,
    });
    lastTrackedSnapshotRef.current = interactionSnapshot;
  };

  const onFormBlurCapture = () => {
    if (typeof window === "undefined") return;
    window.requestAnimationFrame(() => {
      const active = document.activeElement;
      const insideForm = Boolean(formRef.current && active && formRef.current.contains(active));
      if (!insideForm && !hasErrors && interactionSnapshot !== lastTrackedSnapshotRef.current) {
        emitLoanCalculate();
      }
    });
  };

  return (
    <CalculatorPage
      title={t("loanRepayment.pageTitle")}
      description={t("loanRepayment.description")}
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
      gridVariant="resultsWide"
      disclaimer={
        <div className={styles.disclaimer}>
          <p>{t("loanRepayment.disclaimer.general")}</p>
          <ul>
            <li>{t("loanRepayment.disclaimer.exclusion1")}</li>
            <li>{t("loanRepayment.disclaimer.exclusion2")}</li>
            <li>{t("loanRepayment.disclaimer.exclusion3")}</li>
            <li>{t("loanRepayment.disclaimer.exclusion4")}</li>
          </ul>
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
          onBlurCapture={onFormBlurCapture}
        >
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t("loanRepayment.mode.title")}</h3>
            <Field label={t("loanRepayment.mode.title")}>
              <select
                className={styles.select}
                value={normalizedState.m}
                onChange={(event) => onChange("m", event.target.value)}
              >
                <option value="forward">{t("loanRepayment.mode.forward")}</option>
                <option value="reverse">{t("loanRepayment.mode.reverse")}</option>
              </select>
            </Field>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t("loanRepayment.fields.repaymentType.label")}</h3>
            <Field label={t("loanRepayment.fields.repaymentType.label")}>
              <select
                className={styles.select}
                value={normalizedState.rt}
                onChange={(event) => onChange("rt", event.target.value)}
                title={
                  normalizedState.m === "reverse"
                    ? t("loanRepayment.note.reverseIoNotSupported")
                    : undefined
                }
              >
                <option value="PI">{t("loanRepayment.repaymentType.pi")}</option>
                <option value="IO" disabled={normalizedState.m === "reverse"}>
                  {t("loanRepayment.repaymentType.io")}
                </option>
              </select>
            </Field>
            <p className={styles.hint}>{t("loanRepayment.help.io")}</p>
            {normalizedState.m === "reverse" && normalizedState.rt === "IO" ? (
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
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      key={chartKey}
                      data={chartData}
                      margin={{ top: 44, right: 48, left: 48, bottom: 44 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis
                        type="number"
                        dataKey={useMonthAxis ? "elapsedMonths" : "elapsedYears"}
                        domain={[0, Math.max(1, Math.ceil(xMax))]}
                        ticks={xTicks}
                        allowDecimals={false}
                        label={{
                          value: useMonthAxis
                            ? t("loanRepayment.chart.axisXMonths")
                            : t("loanRepayment.chart.axisXYears"),
                          position: "bottom",
                          offset: 14,
                          fill: "var(--muted)",
                        }}
                        tick={{ fill: "var(--muted)", fontSize: 12 }}
                        tickFormatter={(value: number) => formatWhole(value)}
                      />
                      <YAxis
                        yAxisId="balance"
                        label={{
                          value: t("loanRepayment.chart.axisYBalance"),
                          angle: -90,
                          position: "left",
                          offset: 8,
                          fill: "var(--muted)",
                        }}
                        tick={{ fill: "var(--muted)", fontSize: 12 }}
                        tickFormatter={(value: number) => numberFormatter.format(value)}
                      />
                      <YAxis
                        yAxisId="cashflow"
                        orientation="right"
                        label={{
                          value: t("loanRepayment.chart.axisYCashflow"),
                          angle: 90,
                          position: "right",
                          offset: 8,
                          fill: "var(--muted)",
                        }}
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
                      <Legend
                        verticalAlign="top"
                        align="center"
                        wrapperStyle={{ top: 6 }}
                      />
                      <Line
                        yAxisId="balance"
                        type="monotone"
                        dataKey="remainingBalance"
                        stroke="var(--accent)"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                        name={t("loanRepayment.chart.balance")}
                      />
                      <Bar
                        yAxisId="cashflow"
                        dataKey="interest"
                        stackId="payment"
                        fill="#d97706"
                        isAnimationActive={false}
                        name={t("loanRepayment.chart.interest")}
                      />
                      <Bar
                        yAxisId="cashflow"
                        dataKey="principal"
                        stackId="payment"
                        fill="#2563eb"
                        isAnimationActive={false}
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
