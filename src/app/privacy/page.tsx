"use client";

import { useI18n } from "@/i18n/I18nProvider";
import styles from "@/components/layout/LegalPage.module.css";

export default function PrivacyPage() {
  const { t } = useI18n();

  return (
    <main className={styles.page}>
      <article className={styles.container}>
        <h1 className={styles.title}>{t("privacy.title")}</h1>
        <p className={styles.meta}>{t("privacy.lastUpdated")}</p>
        <p className={styles.paragraph}>{t("privacy.p1")}</p>
        <p className={styles.paragraph}>{t("privacy.p2")}</p>
        <p className={styles.paragraph}>{t("privacy.p3")}</p>
        <p className={styles.paragraph}>{t("privacy.p4")}</p>
        <p className={styles.paragraph}>{t("privacy.p5")}</p>
      </article>
    </main>
  );
}
