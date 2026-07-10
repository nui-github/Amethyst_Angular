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
- **Charts**: ng-apexcharts `1.8.0` (+ `apexcharts` `^3.54`) — pinned to this version because `ng-apexcharts` 2.x requires Angular 20; used on the Usage dashboard only
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
- Primary buttons use a **flat** `var(--bizx-blue)` background, never a gradient — darken slightly on hover (e.g. `#034DBA`) instead of changing opacity. Gradients are reserved for progress-bar fills and chart fills, not buttons
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
  'ocr-results'        → OcrResultsComponent   (editable inline; "ดำเนินการต่อ" triggers item-hs-analysis
                            — when data.customsDeclaration is ABSENT (legacy flat display, see below).
                            When it IS present AND data.declarationGateRequired is true, the footer
                            instead shows "กรอกข้อมูลเพิ่มเติม" — the whole declaration must be completed
                            through the full-screen editor panel (see 'customs-declaration-editor'
                            below) before "ดำเนินการต่อ" appears at all; both buttons then show together
                            so the user can still reopen the editor to adjust something before actually
                            proceeding. declarationGateRequired (chat.service.ts showOCRResults/
                            skipOCRManualOnly) is true only for OCR passes meant to be the FINAL/complete
                            declaration — the customs-only single-upload pass, and the invoice path's
                            2nd (agency-upload, COA/เลข U) pass; the invoice path's 1st pass (invoice
                            doc alone) leaves it false, since a plain commercial invoice can't carry
                            full customs-manifest data yet — that card just shows a plain "ดำเนินการต่อ"
                            like before, no gate.
                            when data.customsDeclaration is present, renders the STRUCTURED display —
                            DocumentControl header fields grouped into 4 sections (ข้อมูลควบคุมเอกสาร/
                            ข้อมูลบริษัทผู้นำเข้า/ข้อมูลการขนส่ง/ผู้แจ้ง — CUSTOMS_DECLARATION_HEADER_SECTIONS,
                            shared/utils/customs-declaration-sections.ts, also used by form-preview's
                            header; each row editable inline, blank fields simply omitted) + a
                            "รายการสินค้า" list of GoodsShipment items, each with a "รายละเอียด" button
                            opening a modal via the shared <app-customs-item-detail> component
                            (features/chat/components/customs-item-detail — also reused by form-preview's
                            item modal): every GoodsShipment field is click-to-edit inline (dangerous-goods
                            info, production/lot, license source, issuing authority — types.ts
                            CustomsDeclarationItem), same edit-chip UX as the header rows; edits emit
                            (itemChange) which the host merges back into its local customsDeclaration.items
                            by itemNumber (ocr-results also pushes straight into chat.formData, matching
                            its header-row onDeclInput; form-preview accumulates into `local` and only
                            pushes on "ดำเนินการต่อ", matching its header rows too) — each host passes
                            [readOnly]="proceeded()"/"saved" so editing locks once that card is confirmed.
                            This structure is meant to already be shaped like
                            the real LPI submission payload; any later upload step (e.g. agency-upload's
                            own OCR pass) merges into the same object via mergeCustomsDeclaration()
                            (shared/utils/helpers.ts) rather than replacing it, so nothing already
                            captured is lost. When customsDeclaration is ABSENT (all historical
                            queue-mock/sessions-mock replay data), falls back to the legacy flat
                            fields + optional lineItems grouped display — kept only for backward compat,
                            do not add new flows using the flat shape. All OCR mocks (ocr.mock.ts,
                            invoice-ocr.mock.ts) share the same 6 items, now expressed via
                            INVOICE_CUSTOMS_ITEMS (invoice-ocr.mock.ts) in the CustomsDeclarationItem shape)
  'hs-analysis'        → HsAnalysisComponent   (legacy — only used by the unreachable chooseFullUpload() path
                            and historical queue-mock/sessions-mock message replay; live flows use item-hs-analysis)
  'item-hs-analysis'   → ItemHsAnalysisComponent (used by ALL live analysis flows — invoice path, SPN path, and
                            customs-declaration upload path; ALL THREE share the exact same dataset from
                            getProductHsAnalysis() in product-hs-analysis.mock.ts — this is intentional so the
                            AI-analysis box always matches the invoice OCR box's item count/content, regardless
                            of which flow led there; per-product HS Code → Smart Tariff → agency, grouped by
                            resulting agency, INCLUDING a "ไม่ต้องขอใบอนุญาต" group (agency: '—') for items
                            AI determines don't need any permit — each group card shows its item list
                            directly + one "ยืนยันกลุ่มนี้ถูกต้อง" button that confirms every item in that
                            group at once; every item shows its own `reason` (why AI chose that HS heading),
                            `dutyRate` (import duty %), and AI confidence — real invoices from users carry no
                            HS Code at all, so there is no invoice-vs-AI comparison, only AI-vs-user; each item
                            has a "แก้ไข" button revealing up to 5 `candidates` (types.ts HsCandidate — HS
                            Code/tariff/description/dutyRate/confidence) for the user to manually re-classify
                            that single item, PLUS a manual-entry field ("หรือพิมพ์ HS Code เอง") — user
                            types a code, "ค้นหา" looks it up via lookupHsCode() (mock/hs-code-db.mock.ts,
                            a stand-in for the real tariff-schedule lookup), shows the matched
                            code/description/duty if found (or "ไม่พบข้อมูล..." if not) with its own
                            "ยืนยันใช้รหัสนี้" button; either path (candidate or manual) immediately updates
                            the row and tags it "แก้ไขแล้ว" via ProductHsAnalysis.manuallyEdited; editing is
                            only available before that item's group is confirmed. Clicking "ยืนยันกลุ่มนี้
                            ถูกต้อง" opens a confirm dialog ("ได้ตรวจสอบ...ครบถ้วนแล้วใช่หรือไม่?") before
                            actually locking the group — cancel closes it with no change, confirm calls
                            confirmGroup(). All groups must be confirmed before "ดำเนินการต่อ")
  'item-measurement'   → ItemMeasurementComponent (shown right after flag-card is fully confirmed, ONLY
                            when formData.selectedItems is non-empty — currently the full-upload and
                            invoice-path agency-docs flows, the two paths that actually reach flags; the
                            customs-declaration and SPN paths go straight from OCR/agency-choice to
                            form-preview without ever showing flags, so they never show this box either.
                            One table row per selected item: ชื่อสินค้า (TH)/ชื่อสินค้า (EN)/พิกัดศุลกากร/
                            Lot No. are read-only, resolved via item.declarationItemNumber → the matching
                            CustomsDeclarationItem in formData.customsDeclaration (falls back to the plain
                            InvoiceLineItem fields if unlinked); Measurement + Meas. Unit are the only
                            inputs — no upstream document captures them — and "ยืนยันข้อมูลครบถ้วน" stays
                            disabled until every row has both filled. Clicking it opens a confirm dialog
                            ("กรุณาตรวจสอบว่า...ถูกต้องแล้ว...ไม่สามารถย้อนกลับมาแก้ไขได้อีก") — cancel
                            keeps the row editable, confirm locks it in. Confirming emits the updated
                            InvoiceLineItem[] (now carrying measurement/measUnit) back to
                            onItemMeasurementConfirmed() (chat.service.ts), which writes data.confirmed =
                            true + the filled items back onto the message itself (so the card is never
                            swapped for a readonly-tag — chat-area always renders it; ItemMeasurementData.
                            confirmed drives ItemMeasurementComponent's own saved/read-only display, so the
                            user can still scroll up and see exactly what they entered) and merges them into
                            formData.selectedItems, continuing the flow (missing-fields check → proceed
                            choice) exactly where onAllFlagsConfirmed() used to go directly. form-preview's
                            per-item modal pre-fills its own Measurement/Meas. Unit fields from
                            item.measurement/measUnit when already set here, so paths that pass through
                            this box are never asked twice; paths that skip it (customs/SPN) still collect
                            Measurement/Meas. Unit inside form-preview's modal as before)
  'form'               → FormPanelComponent
  'full-upload'        → FullUploadComponent
  'single-upload'      → SingleUploadComponent
  'spn-list'           → SpnCardComponent       (single-select → selectSpnEntry → SPN flow)
  'spn-connect'        → SpnConnectComponent    (emit: connected)
  'connect'            → ConnectPanelComponent  (emit: connected, legacy)
  'import-license-menu'→ ImportLicenseMenuComponent
  'status-card'        → StatusCardComponent    (isPending=true: รอชำระ / false: สำเร็จ)
  'spn-result'         → SpnResultComponent
  'form-preview'       → FormPreviewComponent   (editable pre-submit data review; "ดำเนินการต่อ" triggers choice-card;
                            header uses the SAME structured display as ocr-results when
                            data.customsDeclaration is present — CUSTOMS_DECLARATION_HEADER_SECTIONS
                            (shared/utils/customs-declaration-sections.ts), editable inline exactly
                            like ocr-results' decl rows; falls back to the legacy LicenseFormData
                            sections when absent (e.g. SPN path, which never runs OCR so has no
                            customsDeclaration — pulls straight from ShippingNet's own record instead).
                            When data.selectedItems present (every path — see selectAllAgencyItems() /
                            getInvoiceLineItems() below, formData.selectedItems is now set directly with
                            no separate item-selection UI), each item row has a "รายละเอียด" button opening
                            a modal: if the item has a declarationItemNumber (types.ts InvoiceLineItem —
                            FK into customsDeclaration.items, set by mapToInvoiceLineItems() for
                            customs/SPN paths) it renders the full CustomsDeclarationItem via the shared
                            <app-customs-item-detail> component (same one ocr-results uses); otherwise
                            falls back to the basic Invoice/HS/origin/qty/lot/value grid. Either way,
                            only Measurement + Meas. Unit are left editable below it (editableFields in
                            form-preview.component.ts — the only ItemManualDetail fields no upstream
                            document actually captures) the user must fill in and confirm per item;
                            "ดำเนินการต่อ" stays disabled until every selected item is confirmed)
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
  - declarationEditorOpen/declarationEditorMsgId: signals ← drive the global full-screen
    customs-declaration-editor panel (mounted once in ChatPageComponent, `@if (chat.
    declarationEditorOpen())`, NOT nested inside the ocr-results message bubble — needs
    near-fullscreen width). openDeclarationEditor(msgId) / closeDeclarationEditor() /
    saveDeclarationEditor(updated) — save writes into both formData.customsDeclaration and the
    originating message's own data (+ data.declarationComplete = true). Besides the header +
    per-item core-field table, the panel also has two flattened per-item sub-tables — "ข้อมูลการผลิต
    / ล็อต (COA)" (CustomsDeclarationItem.productions[]: Lot No./Mfg./Exp. Date/Qty. come from the
    COA OCR read, only Measurement + Meas. Unit are required user input) and "หน่วยงานที่ออกใบอนุญาต
    (เลข U)" (CustomsDeclarationItem.authorities[]: License Number from OCR + an Agency dropdown,
    not yet required) — each with a "รายการที่" item-picker + add button, and a delete icon per row
QueueService     → src/app/core/services/queue.service.ts
  - open(id) seals ship.messages as isReadOnly=true before setting openId
OcrService       → src/app/core/services/ocr.service.ts
```
> `UrlLabelService` (`url-label.service.ts`) still exists but is currently unused — the "ตั้งชื่อ SPN URL" feature that used it was removed from settings.

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
│   │   │   ├── ocr.mock.ts            ← MOCK_OCR_RESULT (customs/full-upload paths)
│   │   │   ├── invoice-ocr.mock.ts    ← MOCK_INVOICE_OCR_RESULT (invoice-upload path only; mirrors a real
│   │   │   │                            commercial invoice — multi-HS-code/origin line items, shown grouped
│   │   │   │                            in the ocr-results card via OcrResultsData.lineItems)
│   │   │   ├── queue.mock.ts          ← shipments with realistic chatbot-flow messages
│   │   │   ├── spn-companies.mock.ts
│   │   │   ├── hs-analysis.mock.ts    ← analyzeHsCode() — only used by the unreachable chooseFullUpload() path
│   │   │   │                            and historical hs-analysis message replay; NOT used by item-hs-analysis
│   │   │   ├── product-hs-analysis.mock.ts ← getProductHsAnalysis() — the single shared item-hs-analysis
│   │   │   │                            dataset for ALL flows (invoice/SPN/customs); mirrors the invoice-ocr
│   │   │   │                            mock's 6 line items (medical devices/accessories) — 3 → อย. เครื่องมือแพทย์,
│   │   │   │                            2 gamma-sterilized items → ปส. (สำนักงานปรมาณูเพื่อสันติภาพ), so every
│   │   │   │                            flow reaches the 2nd-agency "ขอใบอนุญาตเพิ่ม" (next-agency LPI) step;
│   │   │   │                            1 item → ไม่ต้องขอใบอนุญาต (agency '—', a packaging accessory) to
│   │   │   │                            demo that group in item-hs-analysis; each item also carries reason/
│   │   │   │                            dutyRate/candidates (types.ts HsCandidate) for the per-item edit UI;
│   │   │   │                            also exports mapToInvoiceLineItems() — converts confirmed
│   │   │   │                            item-hs-analysis rows into InvoiceLineItem shape, used directly as
│   │   │   │                            formData.selectedItems for the chosen agency (customs/SPN paths;
│   │   │   │                            see selectAllAgencyItems() in chat.service.ts) — no separate
│   │   │   │                            item-selection UI, the whole confirmed group IS the request
│   │   │   ├── agency-docs.mock.ts    ← required docs per agency (อย./กษ./ปส.) + manualFields
│   │   │   ├── invoice-items.mock.ts  ← invoice line items (getInvoiceLineItems) — invoice path's own
│   │   │   │                            agency-upload step; set directly as formData.selectedItems, no
│   │   │   │                            separate selection UI (customs/SPN use mapToInvoiceLineItems() above).
│   │   │   │                            Also exports INVOICE_ITEMS_DECLARATION — the same 4 items in full
│   │   │   │                            CustomsDeclarationItem shape (itemNumber 101-104, kept out of the
│   │   │   │                            1-6 range used by the shared medical-device dataset since this is a
│   │   │   │                            different shipment/invoice entirely); merged into
│   │   │   │                            formData.customsDeclaration.items in continueAfterOCR()
│   │   │   │                            (chat.service.ts) so form-preview's item modal can show the full
│   │   │   │                            schema for these items too, not just the medical-device ones
│   │   │   └── payment.mock.ts        ← fee config per agency (requiresFee, amount) — อย./กษ./ปส./etc.
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
│   │   │       │                         footer order: SPN badge → Profile (popup menu) → BizX logo
│   │   │       │                         profile popup: ตั้งค่า → ค่าใช้จ่าย → ออกจากระบบ
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
│   │   │   └── settings-page/         ← unified shell with its OWN dedicated sidebar (not app-sidebar)
│   │   │                                 serves both /settings and /billing routes (see Settings Page below)
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

Universal agency+profile order (all paths after item-hs-analysis): เลือกกรม (dept:) → เลือกโปรไฟล์ → continue
  pendingAfterFlow: 'agency-docs' (invoice) | 'form-preview' (customs) | 'proceed' (SPN)

import-license-menu → 2 choices (chooseFullUpload()/full-upload card removed from menu, method still exists unused):
  ├─ chooseCustomsDocs()   → single-upload → OCR → item-hs-analysis (shared getProductHsAnalysis() dataset)
  │                            → เลือกกรม → เลือกโปรไฟล์ → selectAllAgencyItems() sets formData.selectedItems
  │                            to the confirmed item-hs-analysis group for that agency (no separate
  │                            selection UI) → form-preview (shows selected items + per-item detail modal,
  │                            same as invoice path) → submit → next-agency (repeats for each remaining agency)
  └─ chooseInvoiceFirst()  → single-upload(invoice) → OCR
        → item-hs-analysis (จัดกลุ่มสินค้าตามกรมที่ AI แนะนำ; user ยืนยันทีละกลุ่มก่อนไปต่อ)
        → เลือกกรม (จาก union ของกรมที่ต้องขอทุกรายการ) → เลือกโปรไฟล์
        → agency-upload (per-agency file slots) → OCR → formData.selectedItems set to every line item
          on the invoice (getInvoiceLineItems(), no separate selection UI) → flags
        → form-preview (editable, shows selected items table) → "ดำเนินการต่อ"
        → choice-card(submit/edit) → submit → showNextAgencyIfAny()
              ├─ remaining agencies? → "เสร็จสิ้น / ขอใบอนุญาตเพิ่ม"
              ├─ ขอใบอนุญาตเพิ่ม → agency selector → repeat agency flow
              └─ no remaining agencies → completion text + "ตรวจสอบสถานะใบอนุญาต" → permit-status

After flags confirmed (both full-upload and invoice paths — the only two that reach flags) →
  item-measurement (ONLY when formData.selectedItems is non-empty, i.e. the invoice path; skipped
  for full-upload since it has no selectedItems) → user fills Measurement/Meas. Unit per row →
  "ยืนยันข้อมูลครบถ้วน" → onItemMeasurementConfirmed() → afterFlagsConfirmed():

After flags confirmed (full-upload path) → form-preview (editable) → "ดำเนินการต่อ" → choice-card(submit/edit) → submit

After flags confirmed (invoice path) → checkMissingAfterFlags:
  ├─ missing required fields? → missing-fields form → fill → showProceedChoice()
  └─ complete → showProceedChoice() directly

onPreviewChoice 'edit' behaviour:
  ├─ isCustomsOnlyUpload === true  → single-upload (ใบขนสินค้าเท่านั้น, ไม่ใช่ full-upload)
  └─ otherwise                    → full-upload (multi-doc, เหมือนเดิม)

SPN path: "ดึงข้อมูลจาก SPN" → spn-list (skip profile picker) → selectSpnEntry → spn-result
  → item-hs-analysis (shared getProductHsAnalysis() dataset) → เลือกกรม → เลือกโปรไฟล์ (confirm/change)
  → selectAllAgencyItems() sets formData.selectedItems → proceed choice → submit

selectAllAgencyItems() (chat.service.ts, customs + SPN paths — invoice path sets
formData.selectedItems directly from getInvoiceLineItems() in continueAfterOCR() instead):
  filters confirmedProductItems (saved in onItemHsAnalysisConfirmed) down to the just-chosen
  agency and converts them via mapToInvoiceLineItems() (product-hs-analysis.mock.ts) straight
  into formData.selectedItems — there is no user-facing item-selection step anymore; once a
  group is confirmed in item-hs-analysis and its agency chosen, every item in that group IS
  the request.
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
No `no_permit` status exists — a shipment only gets saved into the queue at the point the chat
session reaches profile selection, which only happens once the AI has already determined a permit
IS required (see product-hs-analysis.mock.ts/hs-analysis.mock.ts for the "ไม่ต้องขออนุญาต" outcome,
which ends the chat flow before ever reaching queue-save). So `permitNeeded` is always `true` for
every shipment in `MOCK_QUEUE`.
`email_outbox` / `await_customer` ถูกตัดออกจาก flow แล้ว (ไม่ใช้)

### Queue → Chatbot session handoff
```
QueuePage.selectRow(id)
  → chat.loadQueueSession(ship)   ← seals messages as isReadOnly=true
  → router.navigate(['/'])        ← opens chatbot page with that session

loadQueueSession(ship):
  - statusKey 'submitted'   → all messages sealed read-only (nothing left to do)
  - statusKey 'needs_you'              → all messages sealed EXCEPT the last one, which stays
                                          interactive so the user can continue the flow
                                          (e.g. confirm a flag-card, proceed a form-preview)
  - restoreStateFromMessages() rebuilds the minimal ChatService state (formData,
    currentAgency, ALL_AGENCIES, checkMissingAfterFlags) by scanning the shipment's own
    message history (ocr-results/form-preview data, hs-analysis agency) — this is what lets
    the resumed card's existing handler (onAllFlagsConfirmed, onFormPreviewProceed, etc.)
    act on the right data instead of empty defaults

ChatPage (in queue mode):
  - shows "กลับไปคิวงาน" banner (when chat.queueShipmentId() is set)
  - sealed history shows rich card designs (non-interactive, isReadOnly per message)
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
- **KPI cards** (2 อัน): รอดำเนินการ (amber) · ยื่นกรมแล้ว (green) — clickable to filter
- **Tabs** (3 อัน): ทั้งหมด · รอดำเนินการ · ยื่นแล้ว — pill-style
- **Background**: `#EDEEF4` page bg, `16px` outer padding
- **Detail**: clicking any row opens inline detail panel (right side of same page)
  - Left column: AI assess card (HS Code pill + reason) · AI classify card · Audit trail
  - Right column: Flag alerts · Draft license summary · Item list card (Shipment.items — per-product
    line item from the invoice/customs doc used for this LPI request; each row has a "รายละเอียด"
    button opening a read-only modal split into OCR-derived fields + ItemManualDetail fields captured
    during the request, same field set as the chat's form-preview item modal) · Uploaded documents card
    · Submission result card (submitted only)
  - Footer: "ไปยืนยันในแชท" (needs_you) / "เสร็จสิ้นแล้ว" (submitted)
- **Stage labels** (7 stages): ตรวจรับใบขน → วิเคราะห์ HS → จัดประเภท → แนบเอกสาร → ตรวจ flag → ยืนยันร่าง → ยื่นกรม
- Mock data: 12 shipments in `queue.mock.ts` (enough for 2 pages at 10/page)

---

## Settings Page
`SettingsPageComponent` is a standalone shell — does **not** use the main `app-sidebar`. It has its own
dedicated left nav (`.settings-sidebar`) with a "← กลับ" link back to chat, plus 5 top-level sections:

```
activeSection: 'general' | 'account' | 'privacy' | 'billing' | 'usage'
  - initialized from route data: { section: '...' } (see app.routes.ts)
  - /settings → defaults to 'account'
  - /billing  → defaults to 'usage'

General   → placeholder empty-state (not built yet)
Privacy   → placeholder empty-state (not built yet)

Account   → no sub-tabs (the "เชื่อมต่อ ShippingNet" login sub-tab was removed entirely) — shows
  โปรไฟล์สำหรับส่งกรม directly: list from MOCK_SPN_PROFILES + "สร้างโปรไฟล์ใหม่" inline form
  (URL / Username / Password fields; profile code + display name are derived from the URL's hostname)
  (the old "ตั้งชื่อ SPN URL" sub-tab was also removed earlier — UrlLabelService is unused)

Billing   → sub-tabs (billingTab signal): 'plan' | 'payment' | 'invoice'
  - plan:    CURRENT_PLAN card with usage bar + feature list (subscription.mock.ts)
  - payment: PAYMENT_METHOD card + editable BillingAddress (company-format: tax ID, branch, address)
  - invoice: MOCK_INVOICES table with download button

Usage     → ค่าใช้จ่ายรายเดือน — NOT the same as Billing tab above
  - Summary cards: เดือนนี้ / ใบอนุญาตทั้งหมด / ใบที่มีค่าธรรมเนียม
  - Dashboard (4 ApexCharts cards, built with ng-apexcharts — see Tech Stack):
    แนวโน้มค่าใช้จ่ายรายเดือน (bar) · แนวโน้มการใช้โควต้าใบอนุญาต (bar, %)
    สัดส่วนกรมที่ขอบ่อย (donut) · สินค้าที่ขอใบอนุญาตบ่อยที่สุด (horizontal bar)
    Colors follow BizX theme: blue #0463EF → teal #16EA9E gradients, amber #B45309, purple #7C3AED
  - Below the dashboard: existing accordion list per month (MOCK_USAGE) — kept on purpose, do not remove
  - Each month shows a license-quota tag/bar against `plan.licenseQuota` (licenses sold as transactions per package tier)
```

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
- `ocr.mock.ts` → `MOCK_OCR_RESULT` → `POST /ocr` (multipart); include `customsDeclaration`
  (types.ts `CustomsDeclarationData`) shaped like the real LPI submission payload
  (DocumentControl header + GoodsShipment items) — this drives the ocr-results card's main
  display now, not the legacy flat fields. Leave any field the OCR engine couldn't read
  undefined rather than guessing
- `invoice-ocr.mock.ts` → `MOCK_INVOICE_OCR_RESULT` → same `POST /ocr` endpoint for the invoice-upload path;
  also returns `customsDeclaration` — a commercial invoice won't carry customs-manifest fields
  (vessel/ports/etc.), so expect those to come back blank until an actual customs declaration
  step happens; `lineItems[]` (legacy, OcrLineItem[]) is kept only for the fallback display
- `hs-analysis.mock.ts` → `analyzeHsCode()` → supports `agencies[]` for multi-agency HS codes (legacy path only)
- `product-hs-analysis.mock.ts` → `getProductHsAnalysis()` → per-product HS Code → Smart Tariff → agency lookup;
  shared across invoice/SPN/customs paths, so the real endpoint should return the same per-item breakdown
  regardless of entry flow; response should include `reason`, `dutyRate`, and up to 5 `candidates`
  (alternative HS Code suggestions) per item so item-hs-analysis's per-item edit UI works
- `invoice-items.mock.ts` → `getInvoiceLineItems(invoiceNo)` → invoice path's line items, set directly as
  formData.selectedItems (no separate selection step)
- `agency-docs.mock.ts` → `getAgencyDocs(agency)` → required docs + manualFields per agency
- `payment.mock.ts` → `getAgencyPayment(agency)` → `{ requiresFee, amount }` per agency
- `queue.mock.ts` → `MOCK_QUEUE` → `GET /shipments` + `GET /shipments/:id`
  - `documents[]` → swap `SAMPLE_PDF` url to signed URLs from `GET /shipments/:id/documents`
  - `ShipmentDocument.category`: `'invoice' | 'customs' | 'packing_list' | 'coa' | 'coo' | 'other'`
  - ทุก shipment มี documents อย่างน้อย 1 ไฟล์ (ไฟล์ที่ใช้ OCR วิเคราะห์ HS Code)
- `usage.mock.ts` → `MOCK_USAGE` → `GET /usage/months` (used by Settings → Usage tab dashboard + accordion)
- `subscription.mock.ts` → `CURRENT_PLAN` / `PAYMENT_METHOD` / `BILLING_ADDRESS` / `MOCK_INVOICES`
  → `GET /subscription/plan` + `GET /subscription/payment-method` + `GET /subscription/invoices`
  (used by Settings → Billing tab)

---

## Dev Commands
```bash
npm install
ng serve          # → http://localhost:4200
ng build          # TypeScript check + production build
ng lint           # ESLint
```
