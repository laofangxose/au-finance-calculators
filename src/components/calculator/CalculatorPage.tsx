import type { ReactNode } from "react";
import styles from "./CalculatorPage.module.css";

type CalculatorPageProps = {
  title: string;
  description: string;
  headerAction?: ReactNode;
  resultsTop?: ReactNode;
  disclaimer?: ReactNode;
  form: ReactNode;
  results: ReactNode;
};

export function CalculatorPage({
  title,
  description,
  headerAction,
  resultsTop,
  disclaimer,
  form,
  results,
}: CalculatorPageProps) {
  return (
    <main className={styles.page}>
      <div className={styles.frame}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <h1 className={styles.title}>{title}</h1>
            {headerAction ? (
              <div className={styles.headerAction}>{headerAction}</div>
            ) : null}
          </div>
          <p className={styles.description}>{description}</p>
        </header>

        <section className={styles.grid} aria-label="Calculator layout">
          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Inputs</h2>
            {form}
          </div>
          <div className={styles.resultsColumn}>
            {resultsTop ? (
              <div className={styles.resultsTop}>{resultsTop}</div>
            ) : null}
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Results</h2>
              {results}
            </div>
          </div>
        </section>
        {disclaimer ? <section className={styles.disclaimer}>{disclaimer}</section> : null}
      </div>
    </main>
  );
}
