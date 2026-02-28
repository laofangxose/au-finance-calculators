import Link from "next/link";
import styles from "./page.module.css";

export default function CalculatorsIndexPage() {
  return (
    <main className={styles.page}>
      <div className={styles.frame}>
        <header className={styles.header}>
          <h1 className={styles.title}>Calculators</h1>
          <p className={styles.copy}>
            Explore currently available calculators.
          </p>
        </header>

        <section className={styles.grid} aria-label="Calculator list">
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
