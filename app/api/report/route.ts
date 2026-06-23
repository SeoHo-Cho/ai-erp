import { NextRequest, NextResponse } from "next/server";
import type { Analytics, AiReport } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// 큰 숫자를 한국어 단위로 (프롬프트 가독성용)
function eok(v: number): string {
  return `${(v / 1e8).toFixed(2)}억원`;
}

function buildPrompt(a: Analytics, focus?: string): string {
  const k = a.kpi;
  const list = (arr: { name: string; value: number }[], unit = "억원") =>
    arr
      .map(
        (x) =>
          `  - ${x.name}: ${
            unit === "억원" ? (x.value / 1e8).toFixed(2) + "억원" : x.value.toLocaleString()
          }`
      )
      .join("\n");

  return `당신은 한국 기업의 ERP 데이터를 분석하는 시니어 경영 컨설턴트입니다.
아래 집계 지표를 바탕으로 경영진(C-level)을 위한 "경영 분석 보고서"를 한국어로 작성하세요.
숫자는 근거에 기반해 해석하고, 추측이 필요한 부분은 "추정"임을 밝히세요. 과장 없이 실무적으로.

[분석 기간] ${a.dateRange.start} ~ ${a.dateRange.end}

[핵심 KPI]
- 유효 매출(취소 제외): ${eok(k.totalRevenue)}
- 전체 주문 금액: ${eok(k.grossRevenueAll)}
- 총 주문 건수: ${k.orderCount.toLocaleString()}건 (유효 ${k.validOrderCount.toLocaleString()} / 취소 ${k.cancelledOrderCount.toLocaleString()})
- 주문 취소율: ${k.cancelRate.toFixed(1)}%
- 평균 주문금액(AOV): ${Math.round(k.avgOrderValue).toLocaleString()}원
- 고객 수: ${k.customerCount.toLocaleString()} (VIP ${k.vipCount} / 휴면 ${k.dormantCount} / 최근12개월 신규 ${k.newCustomers12m})
- 추정 매출총이익: ${eok(k.estGrossProfit)} (매출총이익률 ${k.grossMarginPct.toFixed(1)}%)
- 재고 원가 가치: ${eok(k.inventoryValue)}
- 총 판매 수량: ${k.totalUnitsSold.toLocaleString()}개

[월별 매출 추이]
${list(a.monthlyRevenue)}

[채널별 매출]
${list(a.revenueByChannel)}

[결제수단별 매출]
${list(a.revenueByPayment)}

[카테고리별 매출]
${list(a.revenueByCategory)}

[브랜드별 매출]
${list(a.revenueByBrand)}

[지역별 매출]
${list(a.revenueByCity)}

[고객유형별 매출]
${list(a.revenueByCustomerType)}

[고객등급별 매출]
${list(a.revenueByTier)}

[주문상태 분포]
${list(a.orderStatusBreakdown, "건")}

[상위 상품 (매출)]
${list(a.topProducts)}

[상위 고객 (매출)]
${list(a.topCustomers)}
${focus ? `\n[특별 분석 요청]\n${focus}\n` : ""}
작성 지침:
- executiveSummary: 3~5문장의 경영 요약. 매출 규모/추세/수익성/주요 리스크를 압축.
- highlights: 핵심 성과/지표 5개 내외 (각 한 문장, 숫자 포함).
- sections: 다음 주제를 각각 한 섹션으로 작성 — "매출 및 성장 추세", "수익성 분석", "고객 분석", "상품/카테고리 분석", "채널 및 운영 효율". body는 2~4문장.
- risks: 데이터에서 드러나는 경영 리스크 3~5개.
- recommendations: 실행 가능한 구체적 제언 4~6개 (우선순위 순).`;
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    executiveSummary: { type: "string" },
    highlights: { type: "array", items: { type: "string" } },
    sections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          heading: { type: "string" },
          body: { type: "string" },
        },
        required: ["heading", "body"],
      },
    },
    risks: { type: "array", items: { type: "string" } },
    recommendations: { type: "array", items: { type: "string" } },
  },
  required: [
    "title",
    "executiveSummary",
    "highlights",
    "sections",
    "risks",
    "recommendations",
  ],
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY 환경변수가 설정되지 않았습니다. (Vercel 환경변수 확인)" },
      { status: 500 }
    );
  }

  let body: { analytics?: Analytics; focus?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  const analytics = body.analytics;
  if (!analytics || !analytics.kpi) {
    return NextResponse.json({ error: "분석 데이터(analytics)가 없습니다." }, { status: 400 });
  }

  const prompt = buildPrompt(analytics, body.focus);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.6,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return NextResponse.json(
        { error: `Gemini API 오류 (${resp.status})`, detail: errText.slice(0, 500) },
        { status: 502 }
      );
    }

    const data = await resp.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join("") ||
      "";

    if (!text) {
      return NextResponse.json(
        { error: "Gemini 응답이 비어 있습니다.", detail: JSON.stringify(data).slice(0, 500) },
        { status: 502 }
      );
    }

    let parsed: Omit<AiReport, "generatedAt">;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Gemini 응답 JSON 파싱 실패", detail: text.slice(0, 500) },
        { status: 502 }
      );
    }

    const report: AiReport = {
      ...parsed,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ report, model: MODEL });
  } catch (e) {
    return NextResponse.json(
      { error: "Gemini 호출 중 네트워크 오류", detail: String(e).slice(0, 300) },
      { status: 502 }
    );
  }
}
