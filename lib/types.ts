// ERP 원본 데이터 행 타입

export interface Customer {
  customer_id: string;
  customer_name: string;
  customer_type: string; // 개인 / 대리점 ...
  city: string;
  phone: string;
  email: string;
  join_date: string;
  tier: string; // VIP / 일반 / 휴면 ...
}

export interface Product {
  product_id: string;
  product_name: string;
  category: string;
  brand: string;
  unit_cost_krw: number;
  unit_price_krw: number;
  stock_qty: number;
  status: string;
}

export interface SalesOrder {
  order_no: string;
  customer_id: string;
  order_date: string;
  status: string; // 완료 / 배송중 / 취소 ...
  channel: string;
  payment_method: string;
  total_amount_krw: number;
}

export interface SalesOrderItem {
  order_item_id: string;
  order_no: string;
  product_id: string;
  qty: number;
  unit_price_krw: number;
  discount_pct: number;
  amount_krw: number;
}

export interface Dataset {
  customers: Customer[];
  products: Product[];
  orders: SalesOrder[];
  items: SalesOrderItem[];
}

export type DatasetKey = "customers" | "products" | "orders" | "items";

// 업로드 슬롯 정의
export interface UploadSlot {
  key: DatasetKey;
  label: string;
  fileHint: string;
  requiredColumns: string[];
}

// ---- 분석 결과 ----

export interface NameValue {
  name: string;
  value: number;
}

export interface KpiSummary {
  totalRevenue: number; // 유효(취소 제외) 매출
  grossRevenueAll: number; // 전체 주문 금액
  orderCount: number;
  validOrderCount: number;
  cancelledOrderCount: number;
  cancelRate: number; // %
  avgOrderValue: number;
  customerCount: number;
  vipCount: number;
  dormantCount: number;
  newCustomers12m: number;
  estGrossProfit: number; // 추정 매출총이익
  grossMarginPct: number;
  inventoryValue: number; // 재고 원가 가치
  totalUnitsSold: number;
}

export interface Analytics {
  kpi: KpiSummary;
  monthlyRevenue: NameValue[]; // 월별 매출 추이
  revenueByChannel: NameValue[];
  revenueByPayment: NameValue[];
  revenueByCategory: NameValue[];
  revenueByBrand: NameValue[];
  revenueByCity: NameValue[];
  revenueByCustomerType: NameValue[];
  revenueByTier: NameValue[];
  topProducts: NameValue[];
  topCustomers: NameValue[];
  orderStatusBreakdown: NameValue[];
  dateRange: { start: string; end: string };
}

// AI 보고서 구조
export interface AiReport {
  title: string;
  executiveSummary: string;
  highlights: string[];
  sections: { heading: string; body: string }[];
  risks: string[];
  recommendations: string[];
  generatedAt: string;
}
