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
        </header>

        <div className={styles.grid}>
          <article className={styles.card}>
            <div className={styles.badgeRow}>
              <h2 className={styles.cardTitle}>{t("home.novatedTitle")}</h2>
              <span className={`${styles.badge} ${styles.activeBadge}`}>
                {t("home.activeBadge")}
              </span>
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
              <h2 className={styles.cardTitle}>{t("home.interestTitle")}</h2>
              <span className={styles.badge}>{t("home.comingSoonBadge")}</span>
            </div>
            <p className={styles.copy}>{t("home.interestDesc")}</p>
            <div className={styles.actions}>
              <button className={styles.disabled} type="button" disabled title={t("home.comingSoonBadge")}>
                {t("home.comingSoonAction")}
              </button>
            </div>
          </article>

          <article className={styles.card}>
            <div className={styles.badgeRow}>
              <h2 className={styles.cardTitle}>{t("home.taxTitle")}</h2>
              <span className={styles.badge}>{t("home.comingSoonBadge")}</span>
            </div>
            <p className={styles.copy}>{t("home.taxDesc")}</p>
            <div className={styles.actions}>
              <button className={styles.disabled} type="button" disabled title={t("home.comingSoonBadge")}>
                {t("home.comingSoonAction")}
              </button>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
