"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { useTheme, type ThemeMode } from "@/lib/theme/ThemeProvider";
import styles from "./AppHeader.module.css";

export function AppHeader() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useI18n();
  const { mode, setMode } = useTheme();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <span>{t("app.name")}</span>
          <span className={styles.beta}>{t("app.beta")}</span>
        </Link>

        <nav className={styles.nav} aria-label={t("nav.calculators")}>
          <Link
            href="/"
            className={`${styles.navLink} ${pathname === "/" ? styles.navLinkActive : ""}`}
          >
            {t("nav.home")}
          </Link>
          <Link
            href="/novated-lease"
            className={`${styles.navLink} ${
              pathname === "/novated-lease" ? styles.navLinkActive : ""
            }`}
          >
            {t("nav.novatedLease")}
          </Link>
        </nav>

        <div className={styles.controls}>
          <label htmlFor="language-select" className={styles.srOnly}>
            {t("controls.language")}
          </label>
          <select
            id="language-select"
            className={styles.select}
            value={locale}
            onChange={(event) => setLocale(event.target.value as "en" | "zh")}
          >
            <option value="en">{t("controls.langEnglish")}</option>
            <option value="zh">{t("controls.langChinese")}</option>
          </select>

          <label htmlFor="theme-select" className={styles.srOnly}>
            {t("controls.theme")}
          </label>
          <select
            id="theme-select"
            className={styles.select}
            value={mode}
            onChange={(event) => setMode(event.target.value as ThemeMode)}
          >
            <option value="system">{t("controls.themeSystem")}</option>
            <option value="light">{t("controls.themeLight")}</option>
            <option value="dark">{t("controls.themeDark")}</option>
          </select>
        </div>
      </div>
    </header>
  );
}
