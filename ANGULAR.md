# Angular Implementation Guide — ShippingNet Assistant

> Handoff doc for dev team. Read this before touching any component.  
> Architecture decisions are final — follow patterns in `FlagCardComponent` and `ChoiceCardComponent`.

---

## Quick Start

```bash
npm install
ng serve
# → http://localhost:4200
```

---

## Architecture: Phase 2 (no window.__chat)

Every bot message has a `type` field. `ChatAreaComponent` uses `@switch` to render the right component.  
**No innerHTML for interactive content. No window bridge. All events flow via `@Output()`.**

```
ChatMessage.type → @switch in ChatAreaComponent
  'flag-card'    → FlagCardComponent   (emit flagConfirmed, allConfirmed)
  'choice-card'  → ChoiceCardComponent (emit chosen)
  'email-draft'  → EmailDraftComponent (emit sent)
  ...
```

### How to add a new message type

1. Add type to `MessageType` union in `src/app/core/models/types.ts`
2. Add data interface (e.g. `MyNewData`) in `types.ts`
3. Create `MyNewComponent` with `@Input() data!: MyNewData` and relevant `@Output()`
4. Add `@case` in `chat-area.component.html`
5. Handle the output event in `ChatAreaComponent.onChoice()` or add a new handler

---

## Services

### ChatService (`src/app/core/services/chat.service.ts`)
All state and chat logic. Inject with `inject(ChatService)`.

| Signal | Type | Description |
|---|---|---|
| `messages` | `ChatMessage[]` | All messages in current session |
| `isTyping` | `boolean` | Show typing indicator |
| `step` | `ChatStep` | Current flow step |
| `isConnected` | `boolean` | ShippingNet connection state |
| `formData` | `LicenseFormData` | Accumulated form data from SPN + OCR |
| `submittedRefNo` | `string` | Last RG-2568-XXXXX (for print) |
| `sidebarActive` | `'chatbot' \| 'queue'` | Current page |

Key methods:
- `send(text)` — main entry point, routes to correct flow
- `onConnected(ref)` — call from ConnectPanelComponent after auth
- `onRequestPermit(refs[])` — call from SpnCardComponent after selection
- `confirmFlag(msgId, flagId, value)` — called by ChatArea from FlagCard output
- `onAllFlagsConfirmed()` — called by ChatArea from FlagCard output
- `onProceedChoice(value)` — routes 'email' | 'preview'
- `onEmailSent(msgId)` — call from EmailDraftComponent
- `onPostEmailChoice(value)` — routes 'confirmed' | 'edit'
- `onPreviewChoice(value)` — routes 'submit' | 'edit'
- `openPrintPage()` — writes sessionStorage and opens /print/license

### QueueService (`src/app/core/services/queue.service.ts`)
- `queue` signal — all shipments
- `openId` signal — selected shipment in ListView
- `needsYouCount` computed — badge count
- `update(id, patch)`, `add(items)`, `open(id)`, `close()`

### OcrService (`src/app/core/services/ocr.service.ts`)
- `progress`, `stages`, `isOCRing` signals
- `startOCR(files?)` — async, returns OcrResult
- `reset()`

---

## Implementation Status

### ✅ Fully Implemented

| Component | Path | Notes |
|---|---|---|
| `ChatAreaComponent` | `features/chat/components/chat-area/` | @switch renderer, readOnly mode |
| `ChatHeaderComponent` | `features/chat/components/chat-header/` | Sidebar toggle, breadcrumb, status pill |
| `SidebarComponent` | `features/chat/components/sidebar/` | Collapsible 224px/48px rail, SPN badge, BizX logo |
| `FlagCardComponent` | `features/chat/components/flag-card/` | Full interactive, progress tracker |
| `ChoiceCardComponent` | `features/chat/components/choice-card/` | Rich cards (with desc) + simple card (no desc) |
| `SpnResultComponent` | `features/chat/components/spn-result/` | Inline template |
| `SpnCardComponent` | `features/chat/components/spn-card/` | Checkbox multi-select, pagination |
| `SpnConnectComponent` | `features/chat/components/spn-connect/` | Multi-step: company → URL → login → success |
| `ConnectPanelComponent` | `features/chat/components/connect/` | Simple username/password (legacy `'connect'` type) |
| `OcrProgressComponent` | `features/chat/components/ocr-progress/` | 4-stage grid, % counter, pulse dot |
| `OcrResultsComponent` | `features/chat/components/ocr-results/` | Inline template, info-card layout |
| `HsAnalysisComponent` | `features/chat/components/hs-analysis/` | AI HS code analysis card, permit tags |
| `FormPanelComponent` | `features/chat/components/form-panel/` | Editable form, importDate + drugRegNo required |
| `FullUploadComponent` | `features/chat/components/full-upload/` | 4-slot drag-drop (invoice/customs/coa/ulicense) |
| `SingleUploadComponent` | `features/chat/components/single-upload/` | Single-slot upload for ใบขนสินค้า flow |
| `EmailDraftComponent` | `features/chat/components/email-draft/` | To/Subject/Body, send disabled until all filled |
| `StatusCardComponent` | `features/chat/components/status-card/` | Inline template, teal success card + action chips |
| `ImportLicenseMenuComponent` | `features/chat/components/import-license-menu/` | 3-option doc type menu |
| `TypingIndicatorComponent` | `features/chat/components/typing-indicator/` | Inline template, 3-dot bounce |
| `QueuePageComponent` | `features/queue/queue-page/` | ListView + ShipmentChatView, status action bars |
| `LicensePrintComponent` | `features/print/license-print/` | A4 draft, auto window.print() |

### 🔲 Suggested Next Steps

- Replace mock SPN/OCR/queue data with real API calls
- `QueuePageComponent` — complete action bar flows (email_outbox → await_customer → submitted)
- Mobile responsive: collapse sidebar at <768px
- Real-time status updates / notifications

---

## Mock → Real API

> Full API contracts (request/response shapes, endpoints) are in **[docs/API.md](./docs/API.md)**

When ready to connect real APIs, edit `src/environments/environment.prod.ts`:
```ts
useMock: false,
apiUrl: 'https://your-api.com',
```

Then update `ChatService.fetchSPN()` and `OcrService.startOCR()`:
```ts
// fetchSPN — replace mock with:
const res = await this.http.get<SPNResult>(`${environment.spnApiUrl}/${ref}`).toPromise()

// startOCR — replace mock with:
const form = new FormData()
files.forEach(f => form.append('files', f as File))
return this.http.post<OcrResult>(environment.ocrApiUrl, form).toPromise()
```

---

## File Structure

```
src/
├── app/
│   ├── core/
│   │   ├── mock/                      ← mock data (replaces with real API calls)
│   │   │   ├── spn.mock.ts            ← KNOWN_REFS, MOCK_FORM_DATA, MOCK_SPN_LIST
│   │   │   ├── ocr.mock.ts            ← MOCK_OCR_RESULT, OcrResult
│   │   │   ├── queue.mock.ts          ← MOCK_QUEUE, STATUS_META, AGENCY_LABEL
│   │   │   ├── spn-companies.mock.ts  ← MOCK_SPN_COMPANIES
│   │   │   └── hs-analysis.mock.ts    ← analyzeHsCode()
│   │   ├── models/
│   │   │   └── types.ts               ← all interfaces + MessageType union
│   │   └── services/
│   │       ├── chat.service.ts        ← all chat state + logic
│   │       ├── queue.service.ts       ← queue state
│   │       └── ocr.service.ts         ← OCR flow
│   ├── features/
│   │   ├── chat/
│   │   │   ├── chat-page/             ← shell page + QuickActionBar
│   │   │   └── components/
│   │   │       ├── chat-area/         ← @switch renderer
│   │   │       ├── chat-header/       ← top header bar
│   │   │       ├── sidebar/           ← collapsible nav
│   │   │       ├── flag-card/         ← flag review interactive card
│   │   │       ├── choice-card/       ← 2-option decision card
│   │   │       ├── spn-result/        ← SPN data info card (inline template)
│   │   │       ├── spn-card/          ← SPN multi-select list
│   │   │       ├── spn-connect/       ← multi-step ShippingNet login
│   │   │       ├── connect/           ← simple legacy connect form
│   │   │       ├── ocr-progress/      ← OCR stage progress card
│   │   │       ├── ocr-results/       ← OCR data display card (inline template)
│   │   │       ├── hs-analysis/       ← AI HS code analysis card
│   │   │       ├── form-panel/        ← editable license form
│   │   │       ├── full-upload/       ← 4-slot document upload
│   │   │       ├── single-upload/     ← single-slot upload (ใบขนสินค้า flow)
│   │   │       ├── email-draft/       ← editable email composer
│   │   │       ├── status-card/       ← submission success card (inline template)
│   │   │       ├── import-license-menu/ ← 3-card doc type selector (inline template)
│   │   │       └── typing-indicator/  ← 3-dot bounce (inline template)
│   │   ├── queue/
│   │   │   └── queue-page/            ← full queue UI
│   │   └── print/
│   │       └── license-print/         ← A4 print page
│   └── shared/
│       ├── pipes/safe-html.pipe.ts    ← DomSanitizer pipe
│       └── utils/
│           ├── helpers.ts             ← generateId(), getTime()
│           └── svg-icons.ts           ← inline SVG strings (for [innerHTML] only)
├── environments/
│   ├── environment.ts                 ← useMock: true
│   └── environment.prod.ts            ← useMock: false
└── styles/
    ├── _variables.scss                ← BizX CSS custom properties
    ├── _ng-zorro-theme.scss           ← Ant Design token overrides
    ├── _chat.scss                     ← .bot-bubble, .user-bubble, .ai-avatar etc.
    └── styles.scss                    ← entry point (imports all partials)
```

---

## Key Patterns

### Inline template vs separate HTML
Components with simple, self-contained output use inline `template:` in the `@Component` decorator:
`SpnResultComponent`, `OcrResultsComponent`, `StatusCardComponent`, `ImportLicenseMenuComponent`, `TypingIndicatorComponent`, `ConnectPanelComponent`

All others use separate `.html` files.

### Path aliases (tsconfig.json)
```ts
@app/*   → src/app/*
@mock/*  → src/app/core/mock/*
@env/*   → src/environments/*
```

### Angular Signals + OnPush
All components use `ChangeDetectionStrategy.OnPush`.  
State lives in services as `signal()` / `computed()`.  
Use `(input)="signal.set($event.target.value)"` — NOT `(ngModelChange)` — for signal updates in OnPush.

### LucideAngularModule
Import `LucideAngularModule` + individual icons from `lucide-angular`.  
Assign icons to `readonly` class fields, bind with `[img]="iconField"`.

```ts
import { LucideAngularModule, CheckCircle } from 'lucide-angular';
readonly CheckCircle = CheckCircle;
// template: <lucide-icon [img]="CheckCircle" [size]="16" />
```

### BizX Design System
Full reference (colors, typography, spacing, component patterns, do/don't rules) is in **[docs/DESIGN.md](./docs/DESIGN.md)**.

### BizX Colors (quick ref)
Never use Tailwind classes. Use CSS custom properties:
```scss
var(--bizx-blue)   // #0463EF
var(--bizx-navy)   // #0E1B4D
var(--bizx-teal)   // #0D8F61
```
Or inline `style="color: #0463EF"` for one-offs.
