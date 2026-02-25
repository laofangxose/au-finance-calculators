import styles from "./SimpleInterestCalculator.module.css";

export type SimpleInterestFormState = {
  principal: string;
  annualRatePct: string;
  termYears: string;
};

type SimpleInterestFormProps = {
  state: SimpleInterestFormState;
  fieldErrors: Partial<Record<keyof SimpleInterestFormState, string>>;
  onChange: (field: keyof SimpleInterestFormState, value: string) => void;
};

export function SimpleInterestForm({
  state,
  fieldErrors,
  onChange,
}: SimpleInterestFormProps) {
  return (
    <div className={styles.stack}>
      <label className={styles.field}>
        <span className={styles.label}>Principal ($)</span>
        <span className={styles.hint}>Starting amount</span>
        <input
          className={styles.input}
          inputMode="decimal"
          value={state.principal}
          onChange={(event) => onChange("principal", event.target.value)}
          aria-invalid={Boolean(fieldErrors.principal)}
        />
        {fieldErrors.principal ? (
          <span className={styles.errorText}>{fieldErrors.principal}</span>
        ) : null}
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Annual Rate (%)</span>
        <span className={styles.hint}>Simple annual interest rate</span>
        <input
          className={styles.input}
          inputMode="decimal"
          value={state.annualRatePct}
          onChange={(event) => onChange("annualRatePct", event.target.value)}
          aria-invalid={Boolean(fieldErrors.annualRatePct)}
        />
        {fieldErrors.annualRatePct ? (
          <span className={styles.errorText}>{fieldErrors.annualRatePct}</span>
        ) : null}
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Term (Years)</span>
        <span className={styles.hint}>Supports decimals (e.g. 1.5)</span>
        <input
          className={styles.input}
          inputMode="decimal"
          value={state.termYears}
          onChange={(event) => onChange("termYears", event.target.value)}
          aria-invalid={Boolean(fieldErrors.termYears)}
        />
        {fieldErrors.termYears ? (
          <span className={styles.errorText}>{fieldErrors.termYears}</span>
        ) : null}
      </label>
    </div>
  );
}
