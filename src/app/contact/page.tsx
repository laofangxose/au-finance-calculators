"use client";

import { useI18n } from "@/i18n/I18nProvider";
import styles from "@/components/layout/LegalPage.module.css";

const FEEDBACK_EMAIL = "au.finance.tools@gmail.com";
const FEEDBACK_MAILTO =
  "mailto:au.finance.tools@gmail.com?subject=AU Finance Calculators Feedback";

export default function ContactPage() {
  const { t } = useI18n();

  return (
    <main className={styles.page}>
      <article className={styles.container}>
        <h1 className={styles.title}>{t("contact.title")}</h1>

        <h2 className={styles.subheading}>{t("contact.emailLabel")}</h2>
        <p className={styles.paragraph}>
          <a className={styles.link} href={FEEDBACK_MAILTO}>
            {t("contact.emailValue", { fallback: FEEDBACK_EMAIL })}
          </a>
        </p>

        <h2 className={styles.subheading}>{t("contact.instructionsTitle")}</h2>
        <ul className={styles.list}>
          <li>{t("contact.i1")}</li>
          <li>{t("contact.i2")}</li>
          <li>{t("contact.i3")}</li>
        </ul>
      </article>
    </main>
  );
}
