# AI ERP 경영 분석 보고서

ERP CSV(상품·고객·주문·주문상세) 4종을 업로드하면 **KPI 대시보드**와 **Gemini AI 경영 보고서**를 생성하고, **PDF / Word**로 다운로드하거나 **재생성**할 수 있는 Next.js 앱입니다.

## 기능
- CSV 4개(상품·고객·주문·주문상세) **모두 업로드**해야 분석 시작
- 브라우저에서 KPI·집계 계산 → **집계본만** 서버로 전송 → Gemini가 보고서 작성 (원본 데이터는 외부로 나가지 않음)
- KPI 카드: 유효매출/취소율/AOV/매출총이익/고객(VIP·휴면)/재고가치 등
- 대시보드: 월별 매출 추이, 카테고리/채널/결제수단/지역/등급별, 상위 상품·고객
- AI 보고서: 경영요약 · 하이라이트 · 섹션별 분석 · 리스크 · 실행 제언
- **PDF 저장**(브라우저 인쇄) / **Word(.docx) 다운로드**
- 관점을 지정해 **AI 보고서 재생성** (예: "휴면고객 재활성화 중심")

## 로컬 실행
```bash
npm install
cp .env.local.example .env.local   # GEMINI_API_KEY 입력
npm run dev                          # http://localhost:3000
```

## 환경변수
| 이름 | 설명 |
|------|------|
| `GEMINI_API_KEY` | (필수) Google Gemini API 키 |
| `GEMINI_MODEL` | (선택) 기본값 `gemini-2.5-flash` |

## Vercel 배포
1. 이 디렉토리를 Git 저장소로 푸시 후 Vercel에 Import (프레임워크 자동감지: Next.js)
2. Project Settings → **Environment Variables**에 `GEMINI_API_KEY` 등록 (이미 등록되어 있다면 그대로 사용)
3. Deploy. 키는 서버 라우트(`app/api/report`)에서만 사용되어 브라우저에 노출되지 않습니다.

## 데이터 형식
- `products.csv`: product_id, product_name, category, brand, unit_cost_krw, unit_price_krw, stock_qty, status
- `customers.csv`: customer_id, customer_name, customer_type, city, phone, email, join_date, tier
- `sales_orders.csv`: order_no, customer_id, order_date, status, channel, payment_method, total_amount_krw
- `sales_order_items.csv`: order_item_id, order_no, product_id, qty, unit_price_krw, discount_pct, amount_krw

> 매출 KPI는 상태에 "취소"가 포함된 주문을 제외하고 계산합니다.
