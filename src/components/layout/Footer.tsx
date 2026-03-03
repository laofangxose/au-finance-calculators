"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import styles from "./Footer.module.css";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.copy}>{t("footer.copyright")}</p>
        <nav className={styles.nav} aria-label={t("footer.navLabel")}>
          <Link className={styles.link} href="/about">
            {t("footer.about")}
          </Link>
          <span className={styles.dot}>·</span>
          <Link className={styles.link} href="/privacy">
            {t("footer.privacy")}
          </Link>
          <span className={styles.dot}>·</span>
          <Link className={styles.link} href="/terms">
            {t("footer.terms")}
          </Link>
          <span className={styles.dot}>·</span>
          <Link className={styles.link} href="/contact">
            {t("footer.contact")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
