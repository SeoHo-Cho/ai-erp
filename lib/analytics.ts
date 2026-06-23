import type {
  Analytics,
  Dataset,
  NameValue,
  SalesOrder,
} from "./types";

const CANCELLED = "취소";

function isCancelled(o: SalesOrder): boolean {
  return o.status.includes(CANCELLED);
}

function topN(map: Map<string, number>, n: number): NameValue[] {
  return [...map.entries()]
    .map(([name, value]) => ({ name: name || "(미지정)", value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
}

function add(map: Map<string, number>, key: string, v: number) {
  map.set(key, (map.get(key) || 0) + v);
}

export function computeAnalytics(data: Dataset): Analytics {
  const { customers, products, orders, items } = data;

  const productById = new Map(products.map((p) => [p.product_id, p]));
  const customerById = new Map(customers.map((c) => [c.customer_id, c]));
  const orderByNo = new Map(orders.map((o) => [o.order_no, o]));

  const validOrders = orders.filter((o) => !isCancelled(o));
  const cancelledOrders = orders.filter(isCancelled);
  const validOrderNos = new Set(validOrders.map((o) => o.order_no));

  // --- 주문 기반 집계 ---
  const totalRevenue = validOrders.reduce((s, o) => s + o.total_amount_krw, 0);
  const grossRevenueAll = orders.reduce((s, o) => s + o.total_amount_krw, 0);

  const byChannel = new Map<string, number>();
  const byPayment = new Map<string, number>();
  const byMonth = new Map<string, number>();
  const byCity = new Map<string, number>();
  const byCustomerType = new Map<string, number>();
  const byTier = new Map<string, number>();
  const byCustomer = new Map<string, number>();
  const statusCount = new Map<string, number>();

  let minDate = "";
  let maxDate = "";

  for (const o of orders) {
    add(statusCount, o.status || "(미지정)", 1);
    if (o.order_date) {
      if (!minDate || o.order_date < minDate) minDate = o.order_date;
      if (!maxDate || o.order_date > maxDate) maxDate = o.order_date;
    }
    if (isCancelled(o)) continue;
    add(byChannel, o.channel, o.total_amount_krw);
    add(byPayment, o.payment_method, o.total_amount_krw);
    const month = o.order_date.slice(0, 7); // YYYY-MM
    if (month) add(byMonth, month, o.total_amount_krw);

    const cust = customerById.get(o.customer_id);
    if (cust) {
      add(byCity, cust.city, o.total_amount_krw);
      add(byCustomerType, cust.customer_type, o.total_amount_krw);
      add(byTier, cust.tier, o.total_amount_krw);
      add(byCustomer, cust.customer_name || cust.customer_id, o.total_amount_krw);
    } else {
      add(byCustomer, o.customer_id, o.total_amount_krw);
    }
  }

  // --- 주문상세(품목) 기반 집계: 카테고리/브랜드/상품, 매출총이익 ---
  const byCategory = new Map<string, number>();
  const byBrand = new Map<string, number>();
  const byProduct = new Map<string, number>();
  let estGrossProfit = 0;
  let totalUnitsSold = 0;

  for (const it of items) {
    // 취소 주문의 품목은 매출에서 제외
    if (!validOrderNos.has(it.order_no)) continue;
    const p = productById.get(it.product_id);
    totalUnitsSold += it.qty;
    if (p) {
      add(byCategory, p.category, it.amount_krw);
      add(byBrand, p.brand, it.amount_krw);
      add(byProduct, p.product_name, it.amount_krw);
      estGrossProfit += it.amount_krw - p.unit_cost_krw * it.qty;
    } else {
      add(byCategory, "(미지정)", it.amount_krw);
      add(byProduct, it.product_id, it.amount_krw);
    }
  }

  const itemsRevenue = [...byCategory.values()].reduce((s, v) => s + v, 0);
  const grossMarginPct = itemsRevenue > 0 ? (estGrossProfit / itemsRevenue) * 100 : 0;
  const inventoryValue = products.reduce(
    (s, p) => s + p.unit_cost_krw * p.stock_qty,
    0
  );

  // --- 고객 KPI ---
  const vipCount = customers.filter((c) => c.tier.includes("VIP")).length;
  const dormantCount = customers.filter((c) => c.tier.includes("휴면")).length;
  // 최근 12개월 신규 고객 (데이터 최신일 기준)
  let newCustomers12m = 0;
  if (maxDate) {
    const cutoff = new Date(maxDate);
    cutoff.setFullYear(cutoff.getFullYear() - 1);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    newCustomers12m = customers.filter(
      (c) => c.join_date && c.join_date >= cutoffStr
    ).length;
  }

  const monthlyRevenue = [...byMonth.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    kpi: {
      totalRevenue,
      grossRevenueAll,
      orderCount: orders.length,
      validOrderCount: validOrders.length,
      cancelledOrderCount: cancelledOrders.length,
      cancelRate: orders.length ? (cancelledOrders.length / orders.length) * 100 : 0,
      avgOrderValue: validOrders.length ? totalRevenue / validOrders.length : 0,
      customerCount: customers.length,
      vipCount,
      dormantCount,
      newCustomers12m,
      estGrossProfit,
      grossMarginPct,
      inventoryValue,
      totalUnitsSold,
    },
    monthlyRevenue,
    revenueByChannel: topN(byChannel, 10),
    revenueByPayment: topN(byPayment, 10),
    revenueByCategory: topN(byCategory, 12),
    revenueByBrand: topN(byBrand, 10),
    revenueByCity: topN(byCity, 12),
    revenueByCustomerType: topN(byCustomerType, 10),
    revenueByTier: topN(byTier, 10),
    topProducts: topN(byProduct, 10),
    topCustomers: topN(byCustomer, 10),
    orderStatusBreakdown: topN(statusCount, 10),
    dateRange: { start: minDate, end: maxDate },
  };
}

// 통화/숫자 포맷
export function formatKRW(v: number): string {
  if (Math.abs(v) >= 1e8) return `${(v / 1e8).toFixed(1)}억원`;
  if (Math.abs(v) >= 1e4) return `${Math.round(v / 1e4).toLocaleString()}만원`;
  return `${Math.round(v).toLocaleString()}원`;
}

export function formatWon(v: number): string {
  return `${Math.round(v).toLocaleString()}원`;
}

export function formatPct(v: number): string {
  return `${v.toFixed(1)}%`;
}
