"use client";

import { useI18n } from "@/i18n/I18nProvider";
import styles from "@/components/layout/LegalPage.module.css";

export default function AboutPage() {
  const { t } = useI18n();

  return (
    <main className={styles.page}>
      <article className={styles.container}>
        <h1 className={styles.title}>{t("about.title")}</h1>
        <p className={styles.paragraph}>{t("about.paragraph1")}</p>
        <p className={styles.paragraph}>{t("about.paragraph2")}</p>
        <p className={styles.paragraph}>{t("about.paragraph3")}</p>
        <p className={styles.paragraph}>{t("about.paragraph4")}</p>
      </article>
    </main>
  );
}
