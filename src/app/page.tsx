"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import styles from "./page.module.css";

export default function HomePage() {
  const { t } = useI18n();

  return (
    <main className={styles.page}>
      <section className={styles.frame}>
        <header>
          <h1 className={styles.title}>{t("home.title")}</h1>
          <p className={styles.copy}>{t("home.subtitle")}</p>
          <p className={styles.copy}>{t("home.disclaimer")}</p>
          <p className={styles.feedbackLine}>
            {t("home.feedbackPrompt")}{" "}
            <a
              className={styles.feedbackLink}
              href="mailto:au.finance.tools@gmail.com?subject=AU Finance Calculators Feedback"
            >
              {t("home.feedbackAction")}
            </a>
          </p>
        </header>

        <div className={styles.grid}>
          <article className={styles.card}>
            <div className={styles.badgeRow}>
              <h2 className={styles.cardTitle}>{t("home.card.loanRepayment.title")}</h2>
            </div>
            <p className={styles.copy}>{t("home.card.loanRepayment.description")}</p>
            <div className={styles.actions}>
              <Link className={styles.primary} href="/calculators/loan-repayment">
                {t("home.openCalculator")}
              </Link>
            </div>
          </article>

          <article className={styles.card}>
            <div className={styles.badgeRow}>
              <h2 className={styles.cardTitle}>{t("home.novatedTitle")}</h2>
            </div>
            <p className={styles.copy}>{t("home.novatedDesc")}</p>
            <div className={styles.actions}>
              <Link className={styles.primary} href="/novated-lease">
                {t("home.openCalculator")}
              </Link>
            </div>
          </article>

          <article className={styles.card}>
            <div className={styles.badgeRow}>
              <h2 className={styles.cardTitle}>{t("home.card.incomeTax.title")}</h2>
            </div>
            <p className={styles.copy}>{t("home.card.incomeTax.description")}</p>
            <div className={styles.actions}>
              <Link className={styles.primary} href="/calculators/income-tax">
                {t("home.openCalculator")}
              </Link>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
