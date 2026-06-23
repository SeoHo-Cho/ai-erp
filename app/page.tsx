"use client";

import { useState } from "react";
import Uploader from "@/components/Uploader";
import KpiCards from "@/components/KpiCards";
import Charts from "@/components/Charts";
import ReportView from "@/components/ReportView";
import { computeAnalytics } from "@/lib/analytics";
import { exportReportToWord } from "@/lib/exportWord";
import type { Analytics, AiReport, Dataset } from "@/lib/types";

type Phase = "upload" | "ready";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [report, setReport] = useState<AiReport | null>(null);
  const [model, setModel] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [focus, setFocus] = useState("");
  const [counts, setCounts] = useState<Record<string, number>>({});

  function onReady(data: Dataset) {
    const a = computeAnalytics(data);
    setAnalytics(a);
    setCounts({
      products: data.products.length,
      customers: data.customers.length,
      orders: data.orders.length,
      items: data.items.length,
    });
    setPhase("ready");
    generate(a, "");
  }

  async function generate(a: Analytics, focusText: string) {
    setLoading(true);
    setError(undefined);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analytics: a, focus: focusText || undefined }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error + (json.detail ? `\n${json.detail}` : ""));
      } else {
        setReport(json.report);
        setModel(json.model);
      }
    } catch (e) {
      setError("네트워크 오류: " + String(e));
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setPhase("upload");
    setAnalytics(null);
    setReport(null);
    setError(undefined);
    setFocus("");
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 print-area">
      {/* 헤더 */}
      <header className="no-print mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI ERP 경영 분석 보고서</h1>
          <p className="mt-1 text-sm text-slate-500">
            CSV 업로드 → KPI 대시보드 + Gemini AI 경영 보고서 → PDF / Word 다운로드
          </p>
        </div>
        {phase === "ready" && (
          <button
            onClick={reset}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            ↺ 새 데이터 업로드
          </button>
        )}
      </header>

      {phase === "upload" && (
        <div className="mt-10">
          <Uploader onReady={onReady} />
        </div>
      )}

      {phase === "ready" && analytics && (
        <div className="space-y-8">
          {/* 인쇄용 보고서 제목 (화면에서는 숨김) */}
          <div className="hidden print:block">
            <h1 className="text-2xl font-bold">ERP 경영 분석 보고서</h1>
            <p className="text-sm text-slate-500">
              분석기간 {analytics.dateRange.start} ~ {analytics.dateRange.end}
            </p>
          </div>

          {/* 데이터 요약 + 액션 바 */}
          <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-500">
              상품 <b className="text-slate-800">{counts.products?.toLocaleString()}</b> · 고객{" "}
              <b className="text-slate-800">{counts.customers?.toLocaleString()}</b> · 주문{" "}
              <b className="text-slate-800">{counts.orders?.toLocaleString()}</b> · 주문상세{" "}
              <b className="text-slate-800">{counts.items?.toLocaleString()}</b>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => window.print()}
                disabled={!report}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-40"
              >
                ⤓ PDF 저장
              </button>
              <button
                onClick={() => report && analytics && exportReportToWord(report, analytics)}
                disabled={!report}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-40"
              >
                ⤓ Word 다운로드
              </button>
            </div>
          </div>

          {/* 재생성 영역 */}
          <div className="no-print flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <input
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="특정 관점으로 재생성 (예: 휴면고객 재활성화 전략 중심으로)"
              className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
            <button
              onClick={() => analytics && generate(analytics, focus)}
              disabled={loading}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "생성 중…" : "↻ AI 보고서 재생성"}
            </button>
          </div>

          {/* KPI */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-slate-800">핵심 지표 (KPI)</h2>
            <KpiCards a={analytics} />
          </section>

          {/* AI 보고서 */}
          <section className="page-break">
            {loading && !report && (
              <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
                <p className="text-sm text-slate-500">Gemini AI가 경영 보고서를 작성하고 있습니다…</p>
              </div>
            )}
            {error && (
              <div className="whitespace-pre-wrap rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
                보고서 생성 실패: {error}
              </div>
            )}
            {report && <ReportView report={report} a={analytics} model={model} />}
          </section>

          {/* 대시보드 차트 */}
          <section className="page-break">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">대시보드</h2>
            <Charts a={analytics} />
          </section>
        </div>
      )}
    </main>
  );
}
