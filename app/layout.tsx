import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI ERP 경영 분석 보고서",
  description: "ERP 데이터 기반 KPI 대시보드 및 Gemini AI 경영 보고서 생성",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased">
        {children}
      </body>
    </html>
  );
}
