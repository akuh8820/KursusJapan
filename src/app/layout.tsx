import "./globals.css";
import type { Metadata } from "next";
import { AnalyticsProvider } from "@/lib/analytics/provider";

export const metadata: Metadata = {
  title: {
    default: "Fasih — Belajar Bahasa Jepang 20 Menit Sehari",
    template: "%s · Fasih",
  },
  description:
    "Kursus bahasa Jepang standar JLPT gratis: dengar, lihat, tulis — cukup 20 menit sehari. Mulai dari nol sampai siap hidup di Jepang.",
  openGraph: {
    title: "Fasih — Belajar Bahasa Jepang 20 Menit Sehari",
    description:
      "Dengar, lihat, tulis. Kursus JLPT N5 gratis dengan sesi fokus 20 menit + kartu harian.",
    type: "website",
    locale: "id_ID",
    siteName: "Fasih",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  );
}
