import Link from "next/link";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>Novated Lease Calculator</h1>
        <p className={styles.copy}>
          Estimate your potential novated lease impact with shareable inputs and
          transparent assumptions.
        </p>
        <p className={styles.copy}>
          Estimates only. This tool is general information and not financial,
          tax, or legal advice.
        </p>
        <div className={styles.actions}>
          <Link className={styles.primary} href="/calculators/novated-lease">
            Start Calculator
          </Link>
          <Link className={styles.secondary} href="/calculators">
            View Calculators
          </Link>
        </div>
      </section>
    </main>
  );
}
