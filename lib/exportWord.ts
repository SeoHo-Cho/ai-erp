import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { saveAs } from "file-saver";
import type { Analytics, AiReport } from "./types";
import { formatKRW, formatPct, formatWon } from "./analytics";

function kpiRows(a: Analytics): [string, string][] {
  const k = a.kpi;
  return [
    ["유효 매출(취소 제외)", formatKRW(k.totalRevenue)],
    ["전체 주문 금액", formatKRW(k.grossRevenueAll)],
    ["추정 매출총이익", `${formatKRW(k.estGrossProfit)} (${formatPct(k.grossMarginPct)})`],
    ["총 주문 / 유효 / 취소", `${k.orderCount} / ${k.validOrderCount} / ${k.cancelledOrderCount}건`],
    ["주문 취소율", formatPct(k.cancelRate)],
    ["평균 주문금액(AOV)", formatWon(k.avgOrderValue)],
    ["고객 수", `${k.customerCount.toLocaleString()}명`],
    ["VIP / 휴면 고객", `${k.vipCount} / ${k.dormantCount}명`],
    ["최근 12개월 신규 고객", `${k.newCustomers12m.toLocaleString()}명`],
    ["재고 원가 가치", formatKRW(k.inventoryValue)],
    ["총 판매 수량", `${k.totalUnitsSold.toLocaleString()}개`],
  ];
}

function bullet(text: string) {
  return new Paragraph({ text, bullet: { level: 0 } });
}

export async function exportReportToWord(report: AiReport, a: Analytics) {
  const generated = new Date(report.generatedAt).toLocaleString("ko-KR");

  const kpiTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: kpiRows(a).map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 45, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
            }),
            new TableCell({
              width: { size: 55, type: WidthType.PERCENTAGE },
              children: [new Paragraph(value)],
            }),
          ],
        })
    ),
  });

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      text: report.title || "ERP 경영 분석 보고서",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `분석기간 ${a.dateRange.start} ~ ${a.dateRange.end}  |  생성일시 ${generated}`,
          color: "888888",
          size: 18,
        }),
      ],
    }),
    new Paragraph({ text: "경영 요약", heading: HeadingLevel.HEADING_1 }),
    new Paragraph(report.executiveSummary),
    new Paragraph({ text: "핵심 지표 (KPI)", heading: HeadingLevel.HEADING_1 }),
    kpiTable,
    new Paragraph({ text: "" }),
    new Paragraph({ text: "주요 하이라이트", heading: HeadingLevel.HEADING_1 }),
    ...report.highlights.map(bullet),
  ];

  for (const s of report.sections) {
    children.push(new Paragraph({ text: s.heading, heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph(s.body));
  }

  children.push(new Paragraph({ text: "리스크 요인", heading: HeadingLevel.HEADING_1 }));
  report.risks.forEach((r) => children.push(bullet(r)));

  children.push(new Paragraph({ text: "실행 제언", heading: HeadingLevel.HEADING_1 }));
  report.recommendations.forEach((r) => children.push(bullet(r)));

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Malgun Gothic", size: 22 } },
      },
    },
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  const date = report.generatedAt.slice(0, 10);
  saveAs(blob, `ERP_경영분석보고서_${date}.docx`);
}
