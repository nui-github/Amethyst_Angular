# Architecture — ShippingNet Assistant

> **หมายเหตุ**: เอกสารนี้เขียนจาก **Next.js prototype** — business logic, flow diagrams, และ design decisions ยังใช้ได้  
> แต่ implementation details บางส่วน (เช่น `page.tsx`, `window.__chat`, `dangerouslySetInnerHTML`) เป็นของ Next.js  
> Angular implementation ใช้ **Angular Services + Signals** แทน — ดู [../ANGULAR.md](../ANGULAR.md)

> ภาพรวม system design, data flow, และ decision log | สำหรับ API contracts ดู [API.md](./API.md)

---

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Next.js 14)                  │
│                                                         │
│  ┌──────────────┐   ┌──────────────────────────────┐   │
│  │   Sidebar    │   │         Main Panel           │   │
│  │  (nav/queue) │   │                              │   │
│  │              │   │  Chatbot view:               │   │
│  │  needsYou    │   │    ChatArea (readOnly=false)  │   │
│  │  badge       │   │    QuickActionBar            │   │
│  │              │   │    ChatInput                 │   │
│  │              │   │                              │   │
│  │              │   │  Queue view:                 │   │
│  │              │   │    ListView + ShipmentChat   │   │
│  │              │   │    ChatArea (readOnly=true)  │   │
│  └──────────────┘   └──────────────────────────────┘   │
│                                                         │
│  State: page.tsx (single source of truth)               │
└────────────────────────┬────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
   ┌──────▼──────┐              ┌───────▼──────┐
   │  SPN API    │              │   OCR API    │
   │ (ShipNet)   │              │ (Textract/   │
   │             │              │  Vision)     │
   │ GET /spn    │              │ POST /ocr    │
   │ /:ref       │              │ multipart    │
   └─────────────┘              └──────────────┘
```

---

## Component Tree

```
page.tsx  (all state lives here)
├── ChatHeader
├── Sidebar
│   └── CollapsedRail (collapsed mode)
└── Main content
    ├── [chatbot view]
    │   ├── ChatArea (readOnly=false)
    │   │   ├── MessageRow (bot/user bubbles)
    │   │   │   ├── WelcomeMessage
    │   │   │   ├── OcrProgress      ← live animation
    │   │   │   ├── FormPanel        ← OCR form
    │   │   │   ├── FullUploadPanel  ← 4-slot upload
    │   │   │   ├── ConnectPanel     ← ShippingNet login
    │   │   │   └── SPNListPanel     ← SPN multi-select
    │   │   └── TypingIndicator
    │   ├── QuickActionBar
    │   └── ChatInput
    │
    └── [queue view]
        └── QueuePage
            ├── DashboardStrip (stat cards)
            ├── ListView (shipment rows)
            └── ShipmentChatView
                ├── ChatArea (readOnly=true)  ← history
                └── Action bars (per status)
```

---

## State Architecture

**ทุก state อยู่ใน `page.tsx`** — ส่งลงเป็น props ไม่มี global store

```
page.tsx state
│
├── Chat state
│   ├── messages: ChatMessage[]          ← ทุก message ในการสนทนา
│   ├── isTyping: boolean
│   ├── step: ChatStep                   ← idle/upload/ocr/form/preview/done
│   ├── formData: Partial<FormData>      ← ข้อมูลใบอนุญาต (จาก SPN + OCR)
│   ├── formValues: Record<string,string>← ค่าใน FormPanel (user input)
│   └── flowStartMsgIdx: useRef<number>  ← index เริ่มต้น flow ปัจจุบัน
│
├── Connection state
│   ├── isConnected: boolean
│   └── pendingRef: string               ← ref ที่รอ connect ก่อน
│
├── Queue state
│   ├── queue: Shipment[]                ← ทุกรายการขอใบอนุญาต
│   ├── queueOpenId: string | null       ← row ที่เลือกใน ListView
│   └── spnEntries: SPNEntry[]           ← SPN list + inQueue flag
│
├── Flag confirm state
│   ├── confirmedFlagIds: string[]
│   ├── confirmedFlagValues: Record<string,string>
│   ├── pendingFlagValues: useRef
│   └── flagsGen: useRef<number>         ← unique prefix ป้องกัน DOM ID ชน
│
├── UI state
│   ├── sidebarActive: string
│   ├── sidebarCollapsed: boolean
│   ├── showPreview / showConfirm
│   ├── submittedRefNo: string           ← สำหรับหน้าพิมพ์
│   └── emailGen: useRef<number>         ← unique prefix email draft
│
└── OCR state (from useOCRFlow hook)
    ├── ocrProgress: number
    ├── ocrStages: string[]
    └── isOCRing: boolean
```

---

## Data Flow

### 1. Chat → Queue (permit submission)

```
handleSend / chooseXxx()
  └─ setMessages(prev => { markFlowStart(prev); return prev })
       ↓
     [user completes OCR + form + flags]
       ↓
     handleSubmit()
       ├─ generate refNo (RG-2568-XXXXX)
       ├─ slice messages from flowStartMsgIdx
       ├─ buildQueueName(formData)        ← priority chain
       ├─ addToQueue([newShipment])       ← Shipment with messages snapshot
       └─ setStep('done')
```

### 2. Queue → Print

```
user clicks "พิมพ์ใบอนุญาต"
  └─ handleSend('พิมพ์ใบอนุญาต')
       ├─ build printData from formData + submittedRefNo
       ├─ sessionStorage.setItem('__printLicenseData', JSON)
       └─ window.open('/print/license', '_blank')
            └─ print/license/page.tsx reads sessionStorage on mount
                 └─ auto window.print() after 600ms
```

### 3. window.__chat bridge

Bot messages ใช้ `onclick="window.__chat?.xxx()"` เพราะ render ผ่าน `dangerouslySetInnerHTML`

```
page.tsx registers window.__chat = {
  sendQuick, chooseCustomsDocs, chooseInvoiceFirst, chooseDocs,
  confirmFlag, unconfirmFlag, showEmailDraftInChat, emailSent,
  customerConfirmedInChat, confirmSubmitFromChat, goToQueue, ...
}
```

ทุก handler ที่ต้องการ state ต้อง register ผ่าน bridge นี้เท่านั้น

### 4. ChatArea readOnly

```
QueuePage passes:  <ChatArea messages={localMessages} readOnly />

ChatArea readOnly mode:
  ├─ special keys → ReadOnlySpecialCard (static summary)
  ├─ HTML messages → pointer-events: none (visible, not clickable)
  └─ applyConfirmedFlags skipped (no live DOM)
```

---

## Chat Flow State Machine

```
         ┌─────────────────────────────────────────┐
         │                  idle                    │
         └──────┬──────────────────────┬────────────┘
                │                      │
     HTHM ref found            HTHM ref not found
                │                      │
         ┌──────▼──────┐       ┌───────▼──────────┐
         │   upload    │       │   not_found       │
         │ (SPN flow)  │       │ (choose doc type) │
         └──────┬──────┘       └──────┬────────────┘
                │                     │
                └──────────┬──────────┘
                           │
              ┌────────────┼────────────────┐
              │            │                │
      invoice_upload  full_upload      xml_upload
              │            │                │
              └────────────┼────────────────┘
                           │
                    ┌──────▼──────┐
                    │     ocr     │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │    form     │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   preview   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │    done     │ → addToQueue()
                    └─────────────┘
```

---

## Shipment Lifecycle (Queue)

```
[Chat submit]
    │
    ▼
needs_you ──(OCR + flag confirm)──► email_outbox
    │                                    │
    │                              (send email)
    │                                    │
    │                                    ▼
    │                             await_customer
    │                                    │
    │                          (customer confirms)
    │                                    │
    │                                    ▼
    └──────────────────────────────► submitted
    
no_permit = ไม่ต้องขอใบอนุญาต (HPLC, non-controlled goods)
```

---

## Key Design Decisions

### 1. State ทั้งหมดอยู่ใน page.tsx
**ทำไม**: โปรเจคขนาดนี้ไม่จำเป็นต้อง Redux/Zustand — single file state ง่ายกว่า debug, trace ง่าย  
**Trade-off**: page.tsx ใหญ่ (~1,400 lines) แต่ logic ทั้งหมดหาได้จากที่เดียว

### 2. Bot messages เป็น HTML string ไม่ใช่ React component
**ทำไม**: ต้องการ flexibility ในการ compose message แบบ dynamic (flags, cards, buttons) ใน single string  
**Trade-off**: ต้องใช้ SVG helpers แทน Lucide, ต้องใช้ `window.__chat` bridge สำหรับ event handlers  
**Rule**: special keys (`show_form`, `ocr_progress` ฯลฯ) ใช้ React component แทนถ้า UI ซับซ้อน

### 3. flowStartMsgIdx แทน session per-flow
**ทำไม**: user ไม่ต้อง New Chat เพื่อขอใบอนุญาตใบถัดไป — slice messages ตาม index ดีกว่า copy ทั้ง session  
**Trade-off**: index เปลี่ยนทุกครั้งที่ flow ใหม่เริ่ม — ถ้า user เปิดหลาย tab จะ conflict (ยอมรับได้ตอนนี้)

### 4. ChatArea readOnly แทนหน้า Queue แยก
**ทำไม**: ใช้ component เดิม รับประกัน visual consistency, ลด duplication  
**How**: `pointer-events: none` บน HTML content, static card แทน live components

### 5. Mock API อยู่คนละ layer จาก component
**ทำไม**: dev แก้เพียง `src/lib/api/spn.ts` และ `src/lib/api/ocr.ts` — ไม่แตะ component เลย  
**Contract**: ดูรายละเอียดใน [API.md](./API.md)

---

## ข้อจำกัดที่รู้อยู่แล้ว (Known Limitations)

| เรื่อง | สถานะ | แนวทางแก้ |
|---|---|---|
| State หายเมื่อ refresh | Mock only — ยังไม่ persist | localStorage หรือ backend session |
| Multi-tab จะ conflict flowStartMsgIdx | ยอมรับได้ตอนนี้ | Session ID per tab |
| Mobile layout ยังไม่ responsive | Desktop only | Sidebar collapse at 768px |
| Real-time queue update | Poll หรือ manual | WebSocket / SSE |
| File upload ไม่ได้ส่งไป server | Mock | S3 / GCS pre-signed URL |
