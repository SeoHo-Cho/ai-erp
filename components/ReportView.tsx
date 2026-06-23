"use client";

import type { AiReport, Analytics } from "@/lib/types";

export default function ReportView({
  report,
  a,
  model,
}: {
  report: AiReport;
  a: Analytics;
  model?: string;
}) {
  const generated = new Date(report.generatedAt).toLocaleString("ko-KR");
  return (
    <div className="avoid-break rounded-2xl border border-slate-100 bg-white p-7 shadow-sm">
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
            Gemini AI 생성
          </span>
          {model && <span className="text-xs text-slate-400">{model}</span>}
        </div>
        <h2 className="mt-3 text-2xl font-bold text-slate-900">
          {report.title || "ERP 경영 분석 보고서"}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          분석기간 {a.dateRange.start} ~ {a.dateRange.end} · 생성 {generated}
        </p>
      </div>

      <Section title="경영 요약">
        <p className="leading-relaxed text-slate-700">{report.executiveSummary}</p>
      </Section>

      {report.highlights?.length > 0 && (
        <Section title="주요 하이라이트">
          <ul className="grid gap-2 sm:grid-cols-2">
            {report.highlights.map((h, i) => (
              <li
                key={i}
                className="rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700"
              >
                {h}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {report.sections?.map((s, i) => (
        <Section key={i} title={s.heading}>
          <p className="leading-relaxed text-slate-700">{s.body}</p>
        </Section>
      ))}

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {report.risks?.length > 0 && (
          <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-5">
            <h3 className="mb-2 font-semibold text-rose-700">⚠ 리스크 요인</h3>
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700">
              {report.risks.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}
        {report.recommendations?.length > 0 && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-5">
            <h3 className="mb-2 font-semibold text-emerald-700">✓ 실행 제언</h3>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-700">
              {report.recommendations.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="mb-2 text-lg font-semibold text-slate-800">{title}</h3>
      {children}
    </div>
  );
}
