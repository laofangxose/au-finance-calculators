"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import en from "@/i18n/locales/en.json";
import zh from "@/i18n/locales/zh.json";
import { preserveWhitelistedTerms } from "@/i18n/termWhitelist";

type Locale = "en" | "zh";
type Dict = Record<string, unknown>;
type Params = Record<string, string | number>;

type TranslateOptions = {
  fallback?: string;
  params?: Params;
};

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, options?: TranslateOptions) => string;
};

const LANGUAGE_STORAGE_KEY = "lang";
const DICTS: Record<Locale, Dict> = { en, zh };

const I18nContext = createContext<I18nContextValue | null>(null);

function resolveKey(dict: Dict, key: string): unknown {
  return key.split(".").reduce<unknown>((value, segment) => {
    if (!value || typeof value !== "object" || !(segment in value)) {
      return undefined;
    }
    return (value as Dict)[segment];
  }, dict);
}

function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_match, key: string) => {
    const value = params[key];
    return value === undefined ? `{${key}}` : String(value);
  });
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored === "en" || stored === "zh") {
        return stored;
      }
    }
    return "en";
  });

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh" : "en";
  }, [locale]);

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLocale);
  };

  const t = (key: string, options?: TranslateOptions): string => {
    const active = resolveKey(DICTS[locale], key);
    const fallbackFromEn = resolveKey(DICTS.en, key);
    const raw =
      typeof active === "string"
        ? active
        : typeof fallbackFromEn === "string"
          ? fallbackFromEn
          : options?.fallback ?? key;
    const interpolated = interpolate(raw, options?.params);
    return preserveWhitelistedTerms(interpolated);
  };
  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider.");
  }
  return context;
}

export type { Locale, TranslateOptions };
