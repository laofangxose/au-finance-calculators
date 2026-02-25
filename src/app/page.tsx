import Link from "next/link";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>M1 Demo</p>
        <h1 className={styles.title}>AU Finance Calculators</h1>
        <p className={styles.copy}>
          Calculator framework prototype with query-param state sync and a
          simple-interest demo calculator.
        </p>
        <div className={styles.actions}>
          <Link className={styles.primary} href="/calculators/simple-interest">
            Open Demo Calculator
          </Link>
          <Link className={styles.secondary} href="/calculators">
            View Calculators
          </Link>
        </div>
      </section>
    </main>
  );
}
