import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AppHeader } from "@/components/app/AppHeader";
import { Footer } from "@/components/layout/Footer";
import { AppProviders } from "@/components/app/AppProviders";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AU Finance Calculators (beta)",
    template: "%s | AU Finance Calculators (beta)",
  },
  description: "Australia-focused financial calculators with transparent assumptions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AppProviders>
          <AppHeader />
          {children}
          <Footer />
        </AppProviders>
        <Analytics />
      </body>
    </html>
  );
}
