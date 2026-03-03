"use client";

import type { ReactNode } from "react";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>{children}</I18nProvider>
    </ThemeProvider>
  );
}
