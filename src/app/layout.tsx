import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ReCaptchaProvider from "@/components/ReCaptchaProvider";

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
    default: "電子決算公告ドットコム｜電子公告による決算公告の掲載サービス",
    template: "%s｜電子決算公告ドットコム",
  },
  description:
    "電子決算公告ドットコムは、会社法に基づく決算公告を電子公告として掲載できるサービスです。年間3,960円から、簡単な手続きで電子決算公告を公開できます。",
  metadataBase: new URL("https://denshi-kessan-koukoku.com"),
  openGraph: {
    title: "電子決算公告ドットコム｜電子公告による決算公告の掲載サービス",
    description:
      "会社法に基づく決算公告を電子公告として掲載できるサービスです。年間3,960円から、簡単な手続きで電子決算公告を公開できます。",
    url: "https://denshi-kessan-koukoku.com",
    siteName: "電子決算公告ドットコム",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "電子決算公告ドットコム",
    description:
      "会社法に基づく決算公告を電子公告として掲載。年間3,960円から。",
  },
  alternates: {
    canonical: "https://denshi-kessan-koukoku.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReCaptchaProvider>{children}</ReCaptchaProvider>
      </body>
    </html>
  );
}
