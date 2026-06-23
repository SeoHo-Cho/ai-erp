"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Analytics, NameValue } from "@/lib/types";
import { formatKRW } from "@/lib/analytics";

const COLORS = [
  "#3b6fe0",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#f97316",
  "#14b8a6",
  "#a855f7",
  "#64748b",
];

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="avoid-break rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-slate-800">{title}</h3>
      <div className="h-72 w-full">{children}</div>
    </div>
  );
}

const tip = {
  formatter: (v: number) => formatKRW(Number(v)),
  contentStyle: { borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 },
};

function shorten(s: string, n = 10) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

export default function Charts({ a }: { a: Analytics }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="월별 매출 추이">
        <ResponsiveContainer>
          <AreaChart data={a.monthlyRevenue} margin={{ left: 4, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b6fe0" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#3b6fe0" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => `${Math.round(v / 1e8)}억`} tick={{ fontSize: 11 }} />
            <Tooltip {...tip} />
            <Area
              type="monotone"
              dataKey="value"
              name="매출"
              stroke="#3b6fe0"
              strokeWidth={2}
              fill="url(#rev)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="카테고리별 매출">
        <ResponsiveContainer>
          <BarChart data={a.revenueByCategory} margin={{ left: 4, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10 }}
              interval={0}
              angle={-25}
              textAnchor="end"
              height={60}
              tickFormatter={(v) => shorten(String(v), 6)}
            />
            <YAxis tickFormatter={(v) => `${Math.round(v / 1e8)}억`} tick={{ fontSize: 11 }} />
            <Tooltip {...tip} />
            <Bar dataKey="value" name="매출" radius={[6, 6, 0, 0]}>
              {a.revenueByCategory.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="채널별 매출 비중">
        <PieDonut data={a.revenueByChannel} />
      </ChartCard>

      <ChartCard title="결제수단별 매출 비중">
        <PieDonut data={a.revenueByPayment} />
      </ChartCard>

      <ChartCard title="지역별 매출 (Top)">
        <ResponsiveContainer>
          <BarChart
            data={a.revenueByCity}
            layout="vertical"
            margin={{ left: 24, right: 12, top: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis type="number" tickFormatter={(v) => `${Math.round(v / 1e8)}억`} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={56} />
            <Tooltip {...tip} />
            <Bar dataKey="value" name="매출" radius={[0, 6, 6, 0]} fill="#06b6d4" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="고객등급별 매출 비중">
        <PieDonut data={a.revenueByTier} />
      </ChartCard>

      <ChartCard title="상위 상품 (매출)">
        <RankBars data={a.topProducts} color="#8b5cf6" />
      </ChartCard>

      <ChartCard title="상위 고객 (매출)">
        <RankBars data={a.topCustomers} color="#f59e0b" />
      </ChartCard>
    </div>
  );
}

function PieDonut({ data }: { data: NameValue[] }) {
  return (
    <ResponsiveContainer>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip {...tip} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function RankBars({ data, color }: { data: NameValue[]; color: string }) {
  return (
    <ResponsiveContainer>
      <BarChart data={data} layout="vertical" margin={{ left: 30, right: 12, top: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis type="number" tickFormatter={(v) => `${Math.round(v / 1e8)}억`} tick={{ fontSize: 11 }} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 10 }}
          width={120}
          tickFormatter={(v) => shorten(String(v), 14)}
        />
        <Tooltip {...tip} />
        <Bar dataKey="value" name="매출" radius={[0, 6, 6, 0]} fill={color} />
      </BarChart>
    </ResponsiveContainer>
  );
}
