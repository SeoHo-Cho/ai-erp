import Papa from "papaparse";
import type {
  Customer,
  Product,
  SalesOrder,
  SalesOrderItem,
  UploadSlot,
} from "./types";

export const UPLOAD_SLOTS: UploadSlot[] = [
  {
    key: "products",
    label: "상품",
    fileHint: "products.csv",
    requiredColumns: ["product_id", "product_name", "category", "unit_price_krw"],
  },
  {
    key: "customers",
    label: "고객",
    fileHint: "customers.csv",
    requiredColumns: ["customer_id", "customer_name", "tier"],
  },
  {
    key: "orders",
    label: "주문",
    fileHint: "sales_orders.csv",
    requiredColumns: ["order_no", "customer_id", "order_date", "total_amount_krw"],
  },
  {
    key: "items",
    label: "주문상세",
    fileHint: "sales_order_items.csv",
    requiredColumns: ["order_item_id", "order_no", "product_id", "qty", "amount_krw"],
  },
];

function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (v == null) return 0;
  const n = Number(String(v).replace(/[, ]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function str(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

export interface ParseResult<T> {
  rows: T[];
  fields: string[];
  missingColumns: string[];
}

export function parseCsv<T = Record<string, unknown>>(
  file: File,
  requiredColumns: string[] = []
): Promise<ParseResult<T>> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      // 일부 CSV는 \r\r\n 줄바꿈이라 공백 전용 행이 생김 → greedy로 제거
      skipEmptyLines: "greedy",
      // BOM 및 헤더 공백 제거
      transformHeader: (h) => h.replace(/^﻿/, "").trim(),
      complete: (res) => {
        const fields = (res.meta.fields || []).map((f) => f.trim());
        const missingColumns = requiredColumns.filter((c) => !fields.includes(c));
        resolve({ rows: res.data as unknown as T[], fields, missingColumns });
      },
      error: (err) => reject(err),
    });
  });
}

export function normalizeCustomers(rows: Record<string, unknown>[]): Customer[] {
  return rows.map((r) => ({
    customer_id: str(r.customer_id),
    customer_name: str(r.customer_name),
    customer_type: str(r.customer_type),
    city: str(r.city),
    phone: str(r.phone),
    email: str(r.email),
    join_date: str(r.join_date),
    tier: str(r.tier),
  }));
}

export function normalizeProducts(rows: Record<string, unknown>[]): Product[] {
  return rows.map((r) => ({
    product_id: str(r.product_id),
    product_name: str(r.product_name),
    category: str(r.category),
    brand: str(r.brand),
    unit_cost_krw: num(r.unit_cost_krw),
    unit_price_krw: num(r.unit_price_krw),
    stock_qty: num(r.stock_qty),
    status: str(r.status),
  }));
}

export function normalizeOrders(rows: Record<string, unknown>[]): SalesOrder[] {
  return rows.map((r) => ({
    order_no: str(r.order_no),
    customer_id: str(r.customer_id),
    order_date: str(r.order_date),
    status: str(r.status),
    channel: str(r.channel),
    payment_method: str(r.payment_method),
    total_amount_krw: num(r.total_amount_krw),
  }));
}

export function normalizeItems(rows: Record<string, unknown>[]): SalesOrderItem[] {
  return rows.map((r) => ({
    order_item_id: str(r.order_item_id),
    order_no: str(r.order_no),
    product_id: str(r.product_id),
    qty: num(r.qty),
    unit_price_krw: num(r.unit_price_krw),
    discount_pct: num(r.discount_pct),
    amount_krw: num(r.amount_krw),
  }));
}
