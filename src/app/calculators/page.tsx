import Link from "next/link";
import styles from "./page.module.css";

export default function CalculatorsIndexPage() {
  return (
    <main className={styles.page}>
      <div className={styles.frame}>
        <header className={styles.header}>
          <h1 className={styles.title}>Calculators</h1>
          <p className={styles.copy}>
            Shared route structure for calculator pages. Demo calculator is live;
            novated lease will plug into the same pattern later.
          </p>
        </header>

        <section className={styles.grid} aria-label="Calculator list">
          <article className={styles.card}>
            <h2 className={styles.name}>Simple Interest (Demo)</h2>
            <p className={styles.desc}>
              Demonstrates reusable page layout, query-param sync, pure logic,
              and tests.
            </p>
            <Link className={styles.link} href="/calculators/simple-interest">
              Open Calculator
            </Link>
          </article>

          <article className={styles.card}>
            <h2 className={styles.name}>Novated Lease</h2>
            <p className={styles.desc}>
              Estimate-focused novated lease calculator with shareable URL state
              and full assumptions breakdown.
            </p>
            <Link className={styles.link} href="/calculators/novated-lease">
              Open Calculator
            </Link>
          </article>
        </section>
      </div>
    </main>
  );
}
