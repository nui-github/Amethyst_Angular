# ShippingNet Assistant — Claude Code Handoff (Angular)

## Project Overview
Web-based AI chatbot สำหรับสร้างใบอนุญาตนำเข้า (RGoods) และจัดการเอกสารศุลกากร  
Built with **Angular 17** · ng-zorro-antd · BizX Design System · IBM Plex Sans Thai

**Target users:** importers/exporters (im/ex) จัดการเอกสารเอง — ไม่ใช่ broker เป็นกลุ่มหลัก

---

## Tech Stack
- **Framework**: Angular 17 (Standalone components, App Router via `app.routes.ts`)
- **Language**: TypeScript (strict mode, `noImplicitAny`, `strictTemplates`)
- **UI Library**: ng-zorro-antd (Ant Design for Angular) — import per-module (e.g. `NzInputModule`)
- **Styling**: SCSS — no Tailwind. BizX colors via CSS custom properties only
- **Icons**: lucide-angular — `import { LucideAngularModule, IconName } from 'lucide-angular'`
- **Font**: IBM Plex Sans Thai — loaded via `<link>` in `index.html`
- **Change Detection**: `ChangeDetectionStrategy.OnPush` on ALL components
- **State**: Angular Signals (`signal()`, `computed()`) — all state in services, never in components

---

## Design System
> Full reference: **[docs/DESIGN.md](./docs/DESIGN.md)**

Key rules:
- BizX colors **only via CSS custom properties** — never hardcode hex in templates
  ```scss
  var(--bizx-blue)    // #0463EF  — CTA, active, links
  var(--bizx-navy)    // #0E1B4D  — headings, primary text
  var(--bizx-teal)    // #0D8F61  — success, confirmed
  var(--bizx-n600)    // #4B5563  — secondary text
  ```
- Inline `style="color: #0463EF"` only for one-offs in component `.ts` inline templates
- IBM Plex Sans Thai — already loaded globally, use `font-family: inherit` in components
- No emoji in UI — use lucide-angular icons or inline SVG

---

## Architecture

### Phase 2: No window.__chat bridge
Every bot message has a `type` field. `ChatAreaComponent` uses `@switch` to render the right Angular component. **No innerHTML for interactive content. All events via `@Output()`.**

Interactive components check **both** `!readOnly` (global) **and** `!msg.isReadOnly` (per-message) before rendering interactive mode. This allows queue session history to show rich card designs but stay non-interactive.

```
ChatMessage.type → @switch in ChatAreaComponent
  'flag-card'          → FlagCardComponent      (emit: flagConfirmed, allConfirmed)
  'choice-card'        → ChoiceCardComponent    (emit: chosen)
  'email-draft'        → EmailDraftComponent    (emit: sent)
  'ocr-progress'       → OcrProgressComponent
  'ocr-results'        → OcrResultsComponent   (editable inline; "ดำเนินการต่อ" triggers hs-analysis)
  'hs-analysis'        → HsAnalysisComponent   (shows fee badge per agency from payment.mock.ts)
  'form'               → FormPanelComponent
  'full-upload'        → FullUploadComponent
  'single-upload'      → SingleUploadComponent
  'spn-list'           → SpnCardComponent       (single-select → selectSpnEntry → SPN flow)
  'spn-connect'        → SpnConnectComponent    (emit: connected)
  'connect'            → ConnectPanelComponent  (emit: connected, legacy)
  'import-license-menu'→ ImportLicenseMenuComponent
  'status-card'        → StatusCardComponent    (isPending=true: รอชำระ / false: สำเร็จ)
  'spn-result'         → SpnResultComponent
  'form-preview'       → FormPreviewComponent   (editable pre-submit data review; "ดำเนินการต่อ" triggers choice-card)
  'missing-fields'     → MissingFieldsComponent (incomplete OCR → fill + optional re-upload)
  'agency-upload'      → AgencyUploadComponent  (per-agency doc slots; upload file OR manual entry per slot)
  'profile-select'     → ProfileSelectComponent (pick/confirm ShippingNet profile; mode: 'select'|'confirm')
  'payment-qr'         → PaymentQrComponent     (QR PromptPay สำหรับกรมที่มีค่าธรรมเนียม)
  'payment-slip'       → PaymentSlipComponent   (อัปโหลด slip หลังชำระ; disabled after upload via msg.isReadOnly)
```

### Services (inject, never constructor)
```ts
ChatService      → src/app/core/services/chat.service.ts
  - queueShipmentId: signal<string|null>  ← set when loading a queue session
  - loadQueueSession(ship)                ← seals existing messages as isReadOnly, loads into chat
QueueService     → src/app/core/services/queue.service.ts
  - open(id) seals ship.messages as isReadOnly=true before setting openId
OcrService       → src/app/core/services/ocr.service.ts
UrlLabelService  → src/app/core/services/url-label.service.ts  ← custom SPN URL names (localStorage)
```

### Path Aliases (tsconfig.json)
```ts
@app/*   → src/app/*
@mock/*  → src/app/core/mock/*
@env/*   → src/environments/*
```

---

## File Structure
```
src/
├── app/
│   ├── core/
│   │   ├── mock/                      ← replace with real API (see docs/API.md)
│   │   │   ├── spn.mock.ts
│   │   │   ├── ocr.mock.ts
│   │   │   ├── queue.mock.ts          ← shipments with realistic chatbot-flow messages
│   │   │   ├── spn-companies.mock.ts
│   │   │   ├── hs-analysis.mock.ts
│   │   │   ├── agency-docs.mock.ts    ← required docs per agency (อย./กษ.) + manualFields
│   │   │   └── payment.mock.ts        ← fee config per agency (requiresFee, amount)
│   │   ├── models/types.ts            ← ALL interfaces + MessageType union
│   │   └── services/
│   │       ├── chat.service.ts        ← all chat state + flow logic + queue session loading
│   │       ├── queue.service.ts       ← queue state; open() seals messages as isReadOnly
│   │       └── ocr.service.ts         ← OCR stages + progress
│   ├── features/
│   │   ├── chat/
│   │   │   ├── chat-page/             ← shell: Sidebar + ChatArea + input bar
│   │   │   │                             shows "กลับไปคิวงาน" banner when chat.queueShipmentId() is set
│   │   │   └── components/
│   │   │       ├── chat-area/         ← @switch renderer; checks !readOnly && !msg.isReadOnly
│   │   │       ├── sidebar/           ← collapsible 224px/48px rail
│   │   │       │                         footer order: SPN badge → ตั้งค่า → Account → BizX logo
│   │   │       ├── flag-card/
│   │   │       ├── choice-card/
│   │   │       ├── spn-result/
│   │   │       ├── spn-card/
│   │   │       ├── spn-connect/
│   │   │       ├── connect/
│   │   │       ├── ocr-progress/
│   │   │       ├── ocr-results/
│   │   │       ├── hs-analysis/       ← shows fee badge per agency (from payment.mock)
│   │   │       ├── form-panel/
│   │   │       ├── full-upload/
│   │   │       ├── single-upload/
│   │   │       ├── email-draft/
│   │   │       ├── status-card/       ← isPending support (amber = รอชำระ, green = สำเร็จ)
│   │   │       ├── import-license-menu/
│   │   │       ├── form-preview/      ← "ดำเนินการต่อ" button uses flat var(--bizx-blue)
│   │   │       ├── missing-fields/
│   │   │       ├── agency-upload/
│   │   │       ├── profile-select/
│   │   │       ├── payment-qr/        ← QR payment card (disabled after paid via isReadOnly)
│   │   │       ├── payment-slip/      ← slip upload (disabled after upload via isReadOnly)
│   │   │       └── typing-indicator/
│   │   ├── queue/
│   │   │   └── queue-page/            ← full-width tracking table + sidebar
│   │   │                                 click row → loadQueueSession() → navigate to /
│   │   ├── settings/
│   │   │   └── settings-page/         ← 2-panel settings; sections: เชื่อมต่อ ShippingNet, ตั้งชื่อ SPN URL
│   │   └── print/
│   │       └── license-print/         ← A4 print page
│   └── shared/
│       ├── pipes/safe-html.pipe.ts
│       └── utils/
│           ├── helpers.ts             ← generateId(), getTime()
│           └── svg-icons.ts           ← inline SVG strings (for [innerHTML] only)
├── environments/
└── styles/
    ├── _variables.scss                ← BizX CSS custom properties
    ├── _ng-zorro-theme.scss           ← Ant Design token overrides
    ├── _chat.scss                     ← .bot-bubble, .user-bubble, .ai-avatar
    └── styles.scss                    ← entry point
```

---

## Chat Flow
> Full flow diagrams and state machine: **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)**

```
ChatService.send(text)
  ├─ 'สร้าง rgoods' + no ref  → !isConnected → spn-connect → showSpnList()
  │     └─ SpnCardComponent: select refs → onRequestPermit(refs) → addToQueue()
  ├─ HTHM ref + 'สร้าง/rgoods'
  │     ├─ !isConnected → setPendingRef(ref) → type:'spn-connect'
  │     └─ isConnected → fetchSPN(ref)
  │           ├─ found → type:'spn-result' + step:'upload'
  │           └─ not found → type:'import-license-menu'
  └─ unknown → fallback + chips

Universal agency+profile order (all paths after hs-analysis): เลือกกรม (dept:) → เลือกโปรไฟล์ → continue
  pendingAfterFlow: 'agency-docs' (invoice) | 'form-preview' (customs) | 'proceed' (SPN)

import-license-menu → 3 choices:
  ├─ chooseCustomsDocs()   → single-upload → OCR → hs-analysis → เลือกกรม → เลือกโปรไฟล์ → form-preview → submit → next-agency
  ├─ chooseInvoiceFirst()  → single-upload(invoice) → OCR → hs-analysis → เลือกกรม → เลือกโปรไฟล์
  │     → agency-upload (per-agency file slots) → OCR → flags → form-preview (editable) → "ดำเนินการต่อ"
  │     → choice-card(submit/edit) → submit → showNextAgencyIfAny()
  │           ├─ remaining agencies? → "ขอใบอนุญาตเพิ่ม / เสร็จสิ้น"
  │           └─ ขอใบอนุญาตเพิ่ม → agency selector → repeat agency flow
  └─ chooseFullUpload()    → full-upload → OCR → hs-analysis → flags → form-preview → submit

After flags confirmed (full-upload path) → form-preview (editable) → "ดำเนินการต่อ" → choice-card(submit/edit) → submit

After flags confirmed (invoice path) → checkMissingAfterFlags:
  ├─ missing required fields? → missing-fields form → fill → showProceedChoice()
  └─ complete → showProceedChoice() directly

onPreviewChoice 'edit' behaviour:
  ├─ isCustomsOnlyUpload === true  → single-upload (ใบขนสินค้าเท่านั้น, ไม่ใช่ full-upload)
  └─ otherwise                    → full-upload (multi-doc, เหมือนเดิม)

SPN path: "ดึงข้อมูลจาก SPN" → spn-list (skip profile picker) → selectSpnEntry → spn-result
  → hs-analysis → เลือกกรม → เลือกโปรไฟล์ (confirm/change) → proceed choice → submit
```

### Payment flow (after ยืนยันส่งกรม)
```
submit() → finalizeSubmit() → status-card (สีเขียว สำเร็จ) immediately

ถ้ากรมมีค่าธรรมเนียม → status-card แสดง feeNote:
  "ค่าธรรมเนียมกรม ฿{amount} จะรวมในบิลรายเดือน"

ไม่มี QR payment หรือ slip upload อีกต่อไป
ค่าธรรมเนียมเก็บผ่านค่าใช้งานระบบรายเดือนแทน

Agency fee config (payment.mock.ts):
  อย.  → ฟรี (LPI ไม่มีค่าธรรมเนียม)
  กษ.  → ฿500 (ค่าตรวจสอบสุขอนามัย)
```

### ChatStep states
`idle` → `upload` / `not_found` → `ocr` → `form` → `preview` → `done`

### Queue Shipment lifecycle
`needs_you` → `submitted`  
`no_permit` = ไม่ต้องขอใบอนุญาต (AI วิเคราะห์ HS Code แล้วผ่านพิธีการปกติ)  
`email_outbox` / `await_customer` ถูกตัดออกจาก flow แล้ว (ไม่ใช้)

### Queue → Chatbot session handoff
```
QueuePage.selectRow(id)
  → chat.loadQueueSession(ship)   ← seals existing messages as isReadOnly=true
  → router.navigate(['/'])        ← opens chatbot page with that session

ChatPage (in queue mode):
  - shows "กลับไปคิวงาน" banner (when chat.queueShipmentId() is set)
  - chat history shows rich card designs (non-interactive, isReadOnly per message)
  - new messages via chat.send() use full ChatService flow normally
  - "กลับไปคิวงาน" calls chat.newChat() + router.navigate(['/queue'])
```

---

## Coding Rules

### Angular patterns
1. **Signals only** — use `signal()` / `computed()` / `effect()`. No `BehaviorSubject` or RxJS state
2. **OnPush everywhere** — `ChangeDetectionStrategy.OnPush` on every component
3. **`(input)` not `(ngModelChange)`** — for signal updates: `(input)="mySignal.set($event.target.value)"`
4. **No `@let`** — Angular 17 doesn't support it. Use class methods or `computed()` instead
5. **`Array.from(new Set([...]))`** not `[...new Set([...])]` — ES target compatibility
6. **Standalone only** — all components are `standalone: true`, no NgModules
7. **`inject()` not constructor injection** — `readonly chat = inject(ChatService)`
8. **No arrow functions in templates** — move filtering/mapping to class methods

### How to add a new message type
1. Add type string to `MessageType` union in `src/app/core/models/types.ts`
2. Add data interface in `types.ts`
3. Create component in `src/app/features/chat/components/`
4. Add `@case` in `chat-area.component.html` using `@if (!readOnly && !msg.isReadOnly)`
5. Wire output events in `ChatAreaComponent`

### How to add a new sidebar item
Add to `mainItems` array in `sidebar.component.ts`

### isReadOnly per message
- Set `msg.isReadOnly = true` to disable a specific card without affecting others
- `ChatAreaComponent` checks `!readOnly && !msg.isReadOnly` for all interactive cases
- `QueueService.open()` automatically seals all existing messages as `isReadOnly: true`
- `autoProceeded: true` on ocr-results data → component auto-sets `proceeded=true` (hides button)

### Sidebar session history
- `ChatService.sessions` signal — stores up to 30 `ChatHistorySession` with `baseRef` + `title`
- `saveCurrentSession()` — saves in-place (no reorder) when `activeSessionId` set; prepends when new
- `promoteActiveSession()` — updates title + moves to top; called on OCR done, flags, form-preview, submit
- `loadSession(id)` — loads without reordering; only reorders after next significant action
- Session title format: `{baseRef} · {statusLabel}` — `baseRef` preserved, status derived from message types

### OCR results & form-preview edit UX (D+A pattern)
- `checkNeeded: true` rows: amber left border + "AI XX%" confidence pill + amber value color
- Every editable row: soft `ocr-edit-chip` icon (always visible 70% opacity, brightens on hover)
- After `proceeded()` / `saved`: all edit affordances hidden
- `flag-card` edit button hidden after `proceeded()`

### Design rules
6. **BizX colors** — `var(--bizx-blue)` in SCSS, `style="color: var(--bizx-blue)"` in templates. Never hardcode hex
7. **ng-zorro imports** — import only the module needed (`NzInputModule`, `NzButtonModule`, etc.)
8. **No Tailwind** — all layout/spacing in component `.scss` files
9. **lucide-angular** — `readonly MyIcon = MyIcon` as class field, bind with `[img]="MyIcon"`

---

## Queue Page Layout
- **List view**: single white card (`border-radius: 18px`) containing:
  1. **Header** — title + date (left), KPI stat cards clickable as filters (right)
  2. **Toolbar** — pill-style tabs + search input (`padding: 16px`)
  3. **Table wrapper** — `nz-table` wrapped in `.qt-table-wrap` (`margin: 16px`, `border-radius: 16px`, border)
  4. **Pagination** — right-aligned, `10 / หน้า` size changer + `< 1 2 >` page buttons; default 10/page, options 10/20/50
  - Columns: ref/customer · สินค้า/HS · AI ประเมิน · ความมั่นใจ (bar) · สถานะ · action button
  - `needs_you` rows have amber left accent bar + amber background tint
  - Table uses `#queueTable` reference + iterates `queueTable.data` (not `filteredQueue()`) to respect client-side pagination
  - `pageSize = signal(10)` / `pageIndex = signal(1)` in component — bound as `[nzPageSize]="pageSize()"` with `(nzPageSizeChange)="pageSize.set($event)"`
- **KPI cards** (3 อัน): รอดำเนินการ (amber) · ไม่ต้องขอใบอนุญาต (gray) · ยื่นกรมแล้ว (green) — clickable to filter
- **Tabs** (4 อัน): ทั้งหมด · รอดำเนินการ · ไม่ต้องขอ · ยื่นแล้ว — pill-style
- **Background**: `#EDEEF4` page bg, `16px` outer padding
- **Detail**: clicking any row opens inline detail panel (right side of same page)
  - Left column: AI assess card (HS Code pill + reason) · AI classify card · Audit trail
  - Right column: Uploaded documents card · Flag alerts · Submission result card (submitted only)
  - Footer: "ไปยืนยันในแชท" (needs_you) / "เสร็จสิ้นแล้ว" (submitted/no_permit)
- **Stage labels** (7 stages): ตรวจรับใบขน → วิเคราะห์ HS → จัดประเภท → แนบเอกสาร → ตรวจ flag → ยืนยันร่าง → ยื่นกรม
- Mock data: 12 shipments in `queue.mock.ts` (enough for 2 pages at 10/page)

---

## Mock → Real API
> Full endpoint contracts: **[docs/API.md](./docs/API.md)**

Edit `src/environments/environment.prod.ts`:
```ts
useMock: false,
apiUrl: 'https://your-api.com',
```

Replace in `src/app/core/mock/`:
- `spn.mock.ts` → `KNOWN_REFS` + `MOCK_FORM_DATA` → `GET /spn/:ref`
- `ocr.mock.ts` → `MOCK_OCR_RESULT` → `POST /ocr` (multipart)
- `hs-analysis.mock.ts` → `analyzeHsCode()` → supports `agencies[]` for multi-agency HS codes
- `agency-docs.mock.ts` → `getAgencyDocs(agency)` → required docs + manualFields per agency
- `payment.mock.ts` → `getAgencyPayment(agency)` → `{ requiresFee, amount }` per agency
- `queue.mock.ts` → `MOCK_QUEUE` → `GET /shipments` + `GET /shipments/:id`
  - `documents[]` → swap `SAMPLE_PDF` url to signed URLs from `GET /shipments/:id/documents`
  - `ShipmentDocument.category`: `'invoice' | 'customs' | 'packing_list' | 'coa' | 'coo' | 'other'`
  - ทุก shipment มี documents อย่างน้อย 1 ไฟล์ (ไฟล์ที่ใช้ OCR วิเคราะห์ HS Code)

---

## Dev Commands
```bash
npm install
ng serve          # → http://localhost:4200
ng build          # TypeScript check + production build
ng lint           # ESLint
```
