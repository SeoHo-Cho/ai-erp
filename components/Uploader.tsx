"use client";

import { useRef, useState } from "react";
import {
  UPLOAD_SLOTS,
  parseCsv,
  normalizeCustomers,
  normalizeProducts,
  normalizeOrders,
  normalizeItems,
} from "@/lib/csv";
import type { Dataset, DatasetKey } from "@/lib/types";

interface SlotState {
  fileName: string;
  rowCount: number;
  error?: string;
}

const EMPTY: Dataset = { customers: [], products: [], orders: [], items: [] };

export default function Uploader({
  onReady,
}: {
  onReady: (data: Dataset) => void;
}) {
  const [slots, setSlots] = useState<Partial<Record<DatasetKey, SlotState>>>({});
  const dataRef = useRef<Dataset>({ ...EMPTY });

  async function handleFile(key: DatasetKey, file: File) {
    const slot = UPLOAD_SLOTS.find((s) => s.key === key)!;
    try {
      const res = await parseCsv(file, slot.requiredColumns);
      if (res.missingColumns.length) {
        setSlots((p) => ({
          ...p,
          [key]: {
            fileName: file.name,
            rowCount: 0,
            error: `필수 컬럼 누락: ${res.missingColumns.join(", ")}`,
          },
        }));
        return;
      }
      const rows = res.rows as Record<string, unknown>[];
      if (key === "customers") dataRef.current.customers = normalizeCustomers(rows);
      if (key === "products") dataRef.current.products = normalizeProducts(rows);
      if (key === "orders") dataRef.current.orders = normalizeOrders(rows);
      if (key === "items") dataRef.current.items = normalizeItems(rows);

      setSlots((p) => ({
        ...p,
        [key]: { fileName: file.name, rowCount: rows.length },
      }));
    } catch (e) {
      setSlots((p) => ({
        ...p,
        [key]: { fileName: file.name, rowCount: 0, error: "파싱 실패: " + String(e) },
      }));
    }
  }

  const allReady =
    UPLOAD_SLOTS.every((s) => slots[s.key] && !slots[s.key]!.error && slots[s.key]!.rowCount > 0);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="grid gap-4 sm:grid-cols-2">
        {UPLOAD_SLOTS.map((slot) => {
          const st = slots[slot.key];
          const ok = st && !st.error && st.rowCount > 0;
          return (
            <SlotCard
              key={slot.key}
              label={slot.label}
              hint={slot.fileHint}
              state={st}
              ok={!!ok}
              onPick={(f) => handleFile(slot.key, f)}
            />
          );
        })}
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <p className="text-sm text-slate-500">
          상품 · 고객 · 주문 · 주문상세 <b>4개 파일을 모두</b> 업로드하면 보고서를 생성할 수 있습니다.
        </p>
        <button
          disabled={!allReady}
          onClick={() => onReady({ ...dataRef.current })}
          className={`rounded-xl px-8 py-3 text-base font-semibold text-white transition ${
            allReady
              ? "bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-600/20"
              : "cursor-not-allowed bg-slate-300"
          }`}
        >
          분석 시작 →
        </button>
      </div>
    </div>
  );
}

function SlotCard({
  label,
  hint,
  state,
  ok,
  onPick,
}: {
  label: string;
  hint: string;
  state?: SlotState;
  ok: boolean;
  onPick: (f: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onPick(f);
      }}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer rounded-2xl border-2 border-dashed bg-white p-5 transition ${
        ok
          ? "border-emerald-400 bg-emerald-50/40"
          : state?.error
          ? "border-rose-300 bg-rose-50/40"
          : drag
          ? "border-brand-500 bg-brand-50"
          : "border-slate-200 hover:border-brand-400"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
        }}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
              ok ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
            }`}
          >
            {ok ? "✓" : "+"}
          </span>
          <span className="text-lg font-semibold text-slate-800">{label}</span>
        </div>
        <code className="text-xs text-slate-400">{hint}</code>
      </div>
      <div className="mt-3 text-sm">
        {state?.error ? (
          <span className="text-rose-600">{state.error}</span>
        ) : state ? (
          <span className="text-slate-600">
            {state.fileName} · <b>{state.rowCount.toLocaleString()}</b>행
          </span>
        ) : (
          <span className="text-slate-400">클릭 또는 드래그해서 CSV 업로드</span>
        )}
      </div>
    </div>
  );
}
