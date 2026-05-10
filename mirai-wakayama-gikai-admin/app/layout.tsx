import type { Metadata } from "next";
import { Lexend_Giga, Zen_Maru_Gothic } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

const lexendGiga = Lexend_Giga({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
});

const zenMaru = Zen_Maru_Gothic({
  variable: "--font-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "政務活動費 管理ツール | みらいの会",
  description: "政務活動費書類の編集・印刷ポータル（限定公開）",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${lexendGiga.variable} ${zenMaru.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
