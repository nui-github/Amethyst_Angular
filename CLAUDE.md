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

After flags confirmed (full-upload path) → 2-choice (ChoiceCard):
  ├─ 'email'   → type:'email-draft' → onEmailSent() → post-email choice
  └─ 'preview' → form-preview (editable) → "ดำเนินการต่อ" → choice-card(submit/edit) → submit

SPN path: "ดึงข้อมูลจาก SPN" → spn-list (skip profile picker) → selectSpnEntry → spn-result
  → hs-analysis → เลือกกรม → เลือกโปรไฟล์ (confirm/change) → proceed choice → submit
```

### Payment flow (after ยืนยันส่งกรม)
```
submit()
  ├─ getAgencyPayment(agency).requiresFee === true
  │     → status-card (isPending=true, สีเหลือง "รอชำระค่าธรรมเนียม")
  │     → payment-qr  (QR + expiry; กด "ชำระเงินแล้ว" → marks isReadOnly=true)
  │     → payment-slip (อัปโหลด slip; กด "ยืนยัน" → marks isReadOnly=true)
  │     → finalizeSubmit() → status-card (isPending=false, สีเขียว สำเร็จ)
  └─ requiresFee === false
        → finalizeSubmit() → status-card (สีเขียว) immediately

Agency fee config (payment.mock.ts):
  อย.  → ฟรี (LPI ไม่มีค่าธรรมเนียม)
  กษ.  → ฿500 (ค่าตรวจสอบสุขอนามัย)
```

### ChatStep states
`idle` → `upload` / `not_found` → `ocr` → `form` → `preview` → `done`

### Queue Shipment lifecycle
`needs_you` → `email_outbox` → `await_customer` → `submitted`  
`no_permit` = no license needed

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
- Used for: payment-qr after paid, payment-slip after uploaded, all history in queue sessions

### Design rules
6. **BizX colors** — `var(--bizx-blue)` in SCSS, `style="color: var(--bizx-blue)"` in templates. Never hardcode hex
7. **ng-zorro imports** — import only the module needed (`NzInputModule`, `NzButtonModule`, etc.)
8. **No Tailwind** — all layout/spacing in component `.scss` files
9. **lucide-angular** — `readonly MyIcon = MyIcon` as class field, bind with `[img]="MyIcon"`

---

## Queue Page Layout
- **List view**: full-width table with stat cards, tabs (ทั้งหมด/ต้องดำเนินการ/รอลูกค้า/ยื่นแล้ว), search
  - Columns: ref/customer · สินค้า/HS · AI ประเมิน · ความมั่นใจ (bar) · สถานะ · action button
  - `needs_you` rows have amber urgency bar on left edge
- **Card wrapper**: 16px outer padding, border-radius 16px white card, `background: #EDEEF2` page bg
- **Detail**: clicking any row → `loadQueueSession()` → navigate to `/` (chatbot page)
- Step 7 "แจ้งลูกค้า" only shown when `ship.email.to` is set (email flow was triggered)

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

---

## Dev Commands
```bash
npm install
ng serve          # → http://localhost:4200
ng build          # TypeScript check + production build
ng lint           # ESLint
```
