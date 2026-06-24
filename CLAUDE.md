# ShippingNet Assistant — Claude Code Handoff (Angular)

## Project Overview
Web-based AI chatbot สำหรับสร้างใบอนุญาตนำเข้า (RGoods) และจัดการเอกสารศุลกากร  
Built with **Angular 17** · ng-zorro-antd · BizX Design System · IBM Plex Sans Thai

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

```
ChatMessage.type → @switch in ChatAreaComponent
  'flag-card'          → FlagCardComponent      (emit: flagConfirmed, allConfirmed)
  'choice-card'        → ChoiceCardComponent    (emit: chosen)
  'email-draft'        → EmailDraftComponent    (emit: sent)
  'ocr-progress'       → OcrProgressComponent
  'ocr-results'        → OcrResultsComponent
  'hs-analysis'        → HsAnalysisComponent
  'form'               → FormPanelComponent
  'full-upload'        → FullUploadComponent
  'single-upload'      → SingleUploadComponent
  'spn-list'           → SpnCardComponent       (single-select → selectSpnEntry → SPN flow)
  'spn-connect'        → SpnConnectComponent    (emit: connected)
  'connect'            → ConnectPanelComponent  (emit: connected, legacy)
  'import-license-menu'→ ImportLicenseMenuComponent
  'status-card'        → StatusCardComponent
  'spn-result'         → SpnResultComponent
  'form-preview'       → FormPreviewComponent   (pre-submit data review table)
  'missing-fields'     → MissingFieldsComponent (incomplete OCR → fill + optional re-upload)
```

### Services (inject, never constructor)
```ts
// All state — inject in components with inject(ChatService)
ChatService      → src/app/core/services/chat.service.ts
QueueService     → src/app/core/services/queue.service.ts
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
│   │   │   ├── queue.mock.ts
│   │   │   ├── spn-companies.mock.ts
│   │   │   └── hs-analysis.mock.ts
│   │   ├── models/types.ts            ← ALL interfaces + MessageType union
│   │   └── services/
│   │       ├── chat.service.ts        ← all chat state + flow logic
│   │       ├── queue.service.ts       ← queue state
│   │       └── ocr.service.ts         ← OCR stages + progress
│   ├── features/
│   │   ├── chat/
│   │   │   ├── chat-page/             ← shell: ChatHeader + Sidebar + router-outlet
│   │   │   └── components/
│   │   │       ├── chat-area/         ← @switch renderer (ChatAreaComponent)
│   │   │       ├── chat-header/       ← top bar
│   │   │       ├── sidebar/           ← collapsible 224px/48px rail
│   │   │       ├── flag-card/         ← flag review interactive card
│   │   │       ├── choice-card/       ← 2-option decision (rich cards or simple cards)
│   │   │       ├── spn-result/        ← SPN data card (inline template)
│   │   │       ├── spn-card/          ← SPN multi-select list + pagination
│   │   │       ├── spn-connect/       ← multi-step ShippingNet login
│   │   │       ├── connect/           ← simple legacy login (type: 'connect')
│   │   │       ├── ocr-progress/      ← 4-stage grid + % counter
│   │   │       ├── ocr-results/       ← OCR data display (inline template)
│   │   │       ├── hs-analysis/       ← AI HS code analysis card
│   │   │       ├── form-panel/        ← editable license form
│   │   │       ├── full-upload/       ← 4-slot document upload
│   │   │       ├── single-upload/     ← single-slot upload (ใบขนสินค้า flow)
│   │   │       ├── email-draft/       ← email composer
│   │   │       ├── status-card/       ← submission success (inline template)
│   │   │       ├── import-license-menu/ ← 3-card doc type selector (inline template)
│   │   │       ├── form-preview/      ← pre-submit data review table (4 sections)
│   │   │       ├── missing-fields/    ← incomplete OCR form + optional re-upload
│   │   │       └── typing-indicator/  ← 3-dot bounce (inline template)
│   │   ├── queue/
│   │   │   └── queue-page/            ← ListView + ShipmentChatView
│   │   ├── settings/
│   │   │   └── settings-page/         ← 2-panel settings (nav sidebar + content); sections: เชื่อมต่อ ShippingNet, ตั้งชื่อ SPN URL
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

import-license-menu → 3 choices:
  ├─ chooseCustomsDocs()   → type:'single-upload' → OCR → flags → choice → preview
  ├─ chooseInvoiceFirst()  → type:'single-upload' (invoice) → OCR → flags → choice → preview
  └─ chooseFullUpload()    → type:'full-upload' → OCR → flags → choice → preview

After flags confirmed → 2-choice (ChoiceCard):
  ├─ 'email'   → type:'email-draft' → onEmailSent() → post-email choice
  └─ 'preview' → type:'choice-card' (submit/edit) → handleSubmit()
```

### ChatStep states
`idle` → `upload` / `not_found` → `ocr` → `form` → `preview` → `done`

### Queue Shipment lifecycle
`needs_you` → `email_outbox` → `await_customer` → `submitted`  
`no_permit` = no license needed

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
4. Add `@case` in `chat-area.component.html`
5. Wire output events in `ChatAreaComponent`

### How to add a new sidebar item
Add to `mainItems` array in `sidebar.component.ts`

### Design rules
6. **BizX colors** — `var(--bizx-blue)` in SCSS, `style="color: var(--bizx-blue)"` in templates. Never hardcode hex
7. **ng-zorro imports** — import only the module needed (`NzInputModule`, `NzButtonModule`, etc.)
8. **No Tailwind** — all layout/spacing in component `.scss` files
9. **lucide-angular** — `readonly MyIcon = MyIcon` as class field, bind with `[img]="MyIcon"`

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

---

## Dev Commands
```bash
npm install
ng serve          # → http://localhost:4200
ng build          # TypeScript check + production build
ng lint           # ESLint
```
