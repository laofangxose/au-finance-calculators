import type {
  SimpleInterestResult,
  SimpleInterestValidationError,
} from "@/lib/calculators/simpleInterest";
import styles from "./SimpleInterestCalculator.module.css";

type SimpleInterestResultsProps = {
  result: SimpleInterestResult | null;
  errors: SimpleInterestValidationError[];
};

const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 2,
});

export function SimpleInterestResults({
  result,
  errors,
}: SimpleInterestResultsProps) {
  if (errors.length > 0) {
    return (
      <div className={styles.stack}>
        <p className={styles.meta}>Fix the inputs to calculate a result.</p>
        <ul className={styles.errorList}>
          {errors.map((error, index) => (
            <li key={`${error.field}-${index}`}>{error.message}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (!result) {
    return <p className={styles.meta}>Enter values to calculate.</p>;
  }

  return (
    <div className={styles.summary}>
      <div className={styles.row}>
        <span>Principal</span>
        <span className={styles.value}>
          {currencyFormatter.format(result.principal)}
        </span>
      </div>
      <div className={styles.row}>
        <span>Simple Interest</span>
        <span className={styles.value}>
          {currencyFormatter.format(result.interest)}
        </span>
      </div>
      <div className={styles.row}>
        <span>Total Amount</span>
        <span className={styles.value}>
          {currencyFormatter.format(result.totalAmount)}
        </span>
      </div>
      <p className={styles.meta}>
        Estimate only. Demo uses simple interest (non-compounding): P x r x t.
      </p>
    </div>
  );
}
