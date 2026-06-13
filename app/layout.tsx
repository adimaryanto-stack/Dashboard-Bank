import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dashboard Bank — Portal Penyaluran Anggaran Pendidikan",
  description: "Sistem monitoring transfer dan pencairan dana APBN Pendidikan ke rekening sekolah penerima melalui Bank DaVinci",
  keywords: ["bank", "transfer", "anggaran", "pendidikan", "APBN", "rekening sekolah", "pencairan dana"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
