"use client";

import { useI18n } from "@/i18n/I18nProvider";
import styles from "@/components/layout/LegalPage.module.css";

export default function TermsPage() {
  const { t } = useI18n();

  return (
    <main className={styles.page}>
      <article className={styles.container}>
        <h1 className={styles.title}>{t("terms.title")}</h1>
        <p className={styles.meta}>{t("terms.lastUpdated")}</p>
        <p className={styles.paragraph}>{t("terms.p1")}</p>
        <p className={styles.paragraph}>{t("terms.p2")}</p>
        <p className={styles.paragraph}>{t("terms.p3")}</p>
        <p className={styles.paragraph}>{t("terms.p4")}</p>
        <p className={styles.paragraph}>{t("terms.p5")}</p>
      </article>
    </main>
  );
}
