import type { Metadata } from "next";
import { Noto_Sans_JP, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AlertTriangle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "みらいのわかやま県議会 | 和歌山県議会を可視化するポータル",
  description:
    "和歌山県議会の日程・予算審議・議員情報を、誰もが分かりやすく追える可視化ポータル（プロトタイプ）。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${notoSansJP.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-wakayama-ivory">
        <SiteHeader />
        <div
          role="alert"
          className="bg-amber-100 border-y-2 border-amber-400 text-amber-900"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-2.5 flex items-start sm:items-center gap-2 text-xs sm:text-sm">
            <AlertTriangle
              size={18}
              className="shrink-0 mt-0.5 sm:mt-0 text-amber-700"
            />
            <p className="leading-relaxed">
              <span className="font-bold">⚠️ ダミーデータ注意：</span>
              本サイトは<strong>シビックテックのプロトタイプ</strong>です。掲載情報は<strong>すべてダミーデータ</strong>であり、
              <strong>和歌山県・県議会・議員個人とは一切関係ありません。</strong>
            </p>
          </div>
        </div>
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
