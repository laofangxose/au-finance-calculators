import type { ReactNode } from "react";
import styles from "./CalculatorPage.module.css";

type CalculatorPageProps = {
  title: string;
  description: string;
  form: ReactNode;
  results: ReactNode;
};

export function CalculatorPage({
  title,
  description,
  form,
  results,
}: CalculatorPageProps) {
  return (
    <main className={styles.page}>
      <div className={styles.frame}>
        <header className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.description}>{description}</p>
        </header>

        <section className={styles.grid} aria-label="Calculator layout">
          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Inputs</h2>
            {form}
          </div>
          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Results</h2>
            {results}
          </div>
        </section>
      </div>
    </main>
  );
}
