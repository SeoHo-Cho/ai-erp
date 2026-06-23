"use client";

import type { Analytics } from "@/lib/types";
import { formatKRW, formatPct, formatWon } from "@/lib/analytics";

function Card({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="avoid-break rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className={`mt-2 text-2xl font-bold ${accent || "text-slate-900"}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

export default function KpiCards({ a }: { a: Analytics }) {
  const k = a.kpi;
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card
        label="유효 매출 (취소 제외)"
        value={formatKRW(k.totalRevenue)}
        sub={`전체 주문금액 ${formatKRW(k.grossRevenueAll)}`}
        accent="text-brand-700"
      />
      <Card
        label="추정 매출총이익"
        value={formatKRW(k.estGrossProfit)}
        sub={`매출총이익률 ${formatPct(k.grossMarginPct)}`}
        accent="text-emerald-600"
      />
      <Card
        label="평균 주문금액 (AOV)"
        value={formatWon(k.avgOrderValue)}
        sub={`유효 주문 ${k.validOrderCount.toLocaleString()}건`}
      />
      <Card
        label="주문 취소율"
        value={formatPct(k.cancelRate)}
        sub={`취소 ${k.cancelledOrderCount.toLocaleString()} / 총 ${k.orderCount.toLocaleString()}건`}
        accent={k.cancelRate > 15 ? "text-rose-600" : "text-slate-900"}
      />
      <Card
        label="고객 수"
        value={`${k.customerCount.toLocaleString()}명`}
        sub={`최근 12개월 신규 ${k.newCustomers12m.toLocaleString()}명`}
      />
      <Card
        label="VIP 고객"
        value={`${k.vipCount.toLocaleString()}명`}
        sub={`전체의 ${formatPct(k.customerCount ? (k.vipCount / k.customerCount) * 100 : 0)}`}
        accent="text-amber-600"
      />
      <Card
        label="휴면 고객"
        value={`${k.dormantCount.toLocaleString()}명`}
        sub={`전체의 ${formatPct(k.customerCount ? (k.dormantCount / k.customerCount) * 100 : 0)}`}
        accent={k.dormantCount > k.customerCount * 0.2 ? "text-rose-600" : "text-slate-900"}
      />
      <Card
        label="재고 원가 가치"
        value={formatKRW(k.inventoryValue)}
        sub={`총 판매수량 ${k.totalUnitsSold.toLocaleString()}개`}
      />
    </div>
  );
}
