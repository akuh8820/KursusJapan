import "./globals.css";
import type { Metadata } from "next";
import { AnalyticsProvider } from "@/lib/analytics/provider";
import { registerServiceWorker } from "@/lib/pwa/register";

export const metadata: Metadata = {
  title: {
    default: "Go Japan — Belajar Bahasa Jepang",
    template: "%s · Go Japan",
  },
  description:
    "Belajar bahasa Jepang JLPT N5–N1: dialog, grammar, kosakata, dan latihan — offline penuh.",
  openGraph: {
    title: "Go Japan — Belajar Bahasa Jepang",
    description:
      "Dengar, lihat, tulis. Kursus JLPT gratis dengan sesi fokus 20 menit + kartu harian.",
    type: "website",
    locale: "id_ID",
    siteName: "Go Japan",
  },
  other: {
    "theme-color": "#b91c1c",
  },
  icons: {
    icon: "/icon-192.png",
    shortcut: "/icon-192.png",
    apple: "/icon-192.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  if (typeof window !== "undefined") {
    registerServiceWorker();
  }
  return (
    <html lang="id" className="h-full antialiased">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#b91c1c" />
      </head>
      <body className="min-h-full flex flex-col">
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  );
}
