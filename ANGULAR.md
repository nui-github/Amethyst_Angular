# Angular Implementation Guide — ShippingNet Assistant

> Handoff doc for dev team. Read this before touching any component.  
> Architecture decisions are final — follow the patterns shown in `FlagCardComponent` and `ChoiceCardComponent`.

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

## Components to Implement

### ✅ Done
- `ChatAreaComponent` — @switch renderer, readOnly mode
- `FlagCardComponent` — full interactive implementation
- `ChoiceCardComponent` — 2-option card
- `SpnResultComponent` — SPN data display card
- `LicensePrintComponent` — A4 print page
- `TypingIndicatorComponent` — 3-dot bounce

### 🔲 TODO — follow patterns below

---

### `SidebarComponent`
**Path**: `features/chat/components/sidebar/`  
**Pattern**: display component, inject `ChatService` + `QueueService`

```ts
@Input() collapsed = false;
@Output() toggleCollapse = new EventEmitter<void>();
// Reads: chat.sidebarActive(), queue.needsYouCount()
// Calls: chat.setSidebarActive(), chat.newChat()
```

Sections: logo, New Chat button, nav items (Chatbot, คิวงาน+badge, Dashboard), settings footer  
Collapsed state: 48px rail, icon-only with tooltip

---

### `ChatHeaderComponent`
**Path**: `features/chat/components/chat-header/`

```ts
@Input() currentPage: string;
@Input() isConnected: boolean;
@Output() toggleSidebar = new EventEmitter<void>();
@Output() disconnect = new EventEmitter<void>();
```

Contains: sidebar toggle icon, breadcrumb (Netbay Agent › {page}), status pill, bell icon, avatar

---

### `ConnectPanelComponent`
**Path**: `features/chat/components/connect/`  
**MessageType**: `'connect'`

```ts
@Output() connected = new EventEmitter<string>(); // emits pendingRef
```

Shows username + password form (ng-zorro NzFormModule).  
On submit: call mock auth (1200ms delay) → emit `connected` with `chat.pendingRef()`.  
ChatArea wires: `(connected)="chat.onConnected($event)"`

---

### `SpnCardComponent` (SPN multi-select list)
**Path**: `features/chat/components/spn-card/`  
**MessageType**: `'spn-list'`

```ts
@Input() entries: SPNEntry[] = []; // from chat.spnEntries()
@Output() requestPermit = new EventEmitter<string[]>(); // selected refs
```

Table with checkbox per row, 5 rows/page (nz-pagination), "ขอใบอนุญาต" button.  
ChatArea wires: `(requestPermit)="chat.onRequestPermit($event)"`

---

### `OcrProgressComponent`
**Path**: `features/chat/components/ocr-progress/`  
**MessageType**: `'ocr-progress'`

```ts
@Input() progress = 0;     // 0–100
@Input() stages: string[]; // completed stage names
```

Shows 4 stage rows with checkmark when complete + `.ocr-fill` gradient progress bar.

---

### `OcrResultsComponent`
**Path**: `features/chat/components/ocr-results/`  
**MessageType**: `'ocr-results'`

```ts
@Input() data!: OcrResultsData;
```

Display-only card: invoice no, date, quantity, HS code, importer, port, lot no, U no.  
Use `info-card` CSS classes from `_chat.scss`.

---

### `FormPanelComponent`
**Path**: `features/chat/components/form-panel/`  
**MessageType**: `'form'`

Editable form bound to `chat.formData()`. Fields:
- importDate (required, starts empty — nz-date-picker)
- drugRegNo (required, starts empty — nz-input)
- invoiceNo, quantity, importer, port etc. (pre-filled from OCR, editable)

```ts
// On change: call chat.formData.update(...)
// Has "ดูพรีวิว" button → calls chat.onPreviewChoice('preview')
```

---

### `FullUploadComponent`
**Path**: `features/chat/components/full-upload/`  
**MessageType**: `'full-upload'`

4 drag-drop slots: invoice / customs / coa / ulicense.  
nz-upload component per slot.  
"เริ่ม OCR" button → calls `chat.startOCR(files)`.

---

### `EmailDraftComponent`
**Path**: `features/chat/components/email-draft/`  
**MessageType**: `'email-draft'`

```ts
@Input() data!: EmailDraftData;
@Output() sent = new EventEmitter<void>();
```

Editable To / Subject / Body fields.  
Send button disabled until all 3 non-empty.  
On send: emit `sent` → ChatArea calls `chat.onEmailSent(msg.id)`.  
Sent state: show read-only "ส่งแล้ว" label.

---

### `StatusCardComponent`
**Path**: `features/chat/components/status-card/`  
**MessageType**: `'status-card'`

```ts
@Input() data!: StatusCardData;
// { refNo, customsRef, submittedAt }
```

Success card (teal): ref no, temp license no, date, status badge.  
Chips: "ตรวจสอบสถานะ", "สร้างใบใหม่", "พิมพ์ใบอนุญาต"  
Chips call `chat.send(text)` directly.

---

### `ImportLicenseMenuComponent`
**Path**: `features/chat/components/import-license-menu/`  
**MessageType**: `'spn-not-found'`

3-card menu (nz-card):
- "ใบขนสินค้า" → `chat.chooseCustomsDocs()`
- "ใบ Invoice" → `chat.chooseInvoiceFirst()`
- "เอกสารชุดสำหรับการขอใบอนุญาตนำเข้า" → `chat.chooseFullUpload()`

---

### `QueuePageComponent` (full implementation)
**Path**: `features/queue/queue-page/`  
Current stub shows basic list. Full implementation:

```
Layout: flex row
  ListView (300px) — list of Shipment rows
    - search input (nz-input)
    - each row: chatName or customsNo, goods, status badge, agency badge, isNew badge
    - click → queue.open(id)
  ShipmentChatView (flex-1) — shown when openId is set
    - header: customsNo, status badge, 8-step progress bar
    - <app-chat-area [messages]="shipment.messages" [readOnly]="true" />
    - action bars per statusKey (needs_you, email_outbox, await_customer, submitted)
```

ng-zorro components: `nz-badge`, `nz-tag`, `nz-steps` (or custom), `nz-message` for toast.

---

## Mock → Real API

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

See `API.md` (in the Next.js project) for full request/response contracts.

---

## File Structure

```
src/
├── app/
│   ├── core/
│   │   ├── models/types.ts           ← all interfaces
│   │   └── services/
│   │       ├── chat.service.ts       ← all chat state + logic
│   │       ├── queue.service.ts      ← queue state
│   │       └── ocr.service.ts        ← OCR flow
│   ├── features/
│   │   ├── chat/
│   │   │   ├── chat-page/            ← ✅ implemented (shell)
│   │   │   └── components/
│   │   │       ├── chat-area/        ← ✅ @switch renderer
│   │   │       ├── flag-card/        ← ✅ full implementation
│   │   │       ├── choice-card/      ← ✅ implemented
│   │   │       ├── spn-result/       ← ✅ implemented
│   │   │       ├── typing-indicator/ ← ✅ implemented
│   │   │       ├── sidebar/          ← 🔲 TODO
│   │   │       ├── chat-header/      ← 🔲 TODO
│   │   │       ├── connect/          ← 🔲 TODO
│   │   │       ├── spn-card/         ← 🔲 TODO (SPN list)
│   │   │       ├── ocr-progress/     ← 🔲 TODO
│   │   │       ├── ocr-results/      ← 🔲 TODO
│   │   │       ├── form-panel/       ← 🔲 TODO
│   │   │       ├── full-upload/      ← 🔲 TODO
│   │   │       ├── email-draft/      ← 🔲 TODO
│   │   │       ├── status-card/      ← 🔲 TODO
│   │   │       └── import-license-menu/ ← 🔲 TODO
│   │   ├── queue/
│   │   │   └── queue-page/           ← 🔲 TODO (full implementation)
│   │   └── print/
│   │       └── license-print/        ← ✅ implemented
│   └── shared/
│       ├── pipes/safe-html.pipe.ts   ← ✅
│       └── utils/svg-icons.ts        ← ✅ (for [innerHTML] only)
├── mock/
│   ├── queue.mock.ts
│   ├── spn.mock.ts
│   └── ocr.mock.ts
├── styles/
│   ├── _variables.scss   ← BizX CSS custom properties
│   ├── _ng-zorro-theme.scss ← Ant Design token overrides
│   ├── _chat.scss        ← .bot-bubble, .user-bubble, .ai-avatar etc.
│   └── styles.scss       ← entry point
└── environments/
    ├── environment.ts        ← useMock: true
    └── environment.prod.ts   ← useMock: false
```
