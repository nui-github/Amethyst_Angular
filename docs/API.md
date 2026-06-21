# API Contracts — ShippingNet Assistant

> แก้เพียง 2 ไฟล์เพื่อ connect real API: `src/lib/api/spn.ts` และ `src/lib/api/ocr.ts`  
> ไม่ต้องแตะ component ใดๆ เลย

---

## สรุป Endpoints ที่ต้องเชื่อม

| # | ชื่อ | File | Method | สิ่งที่ต้องแทน |
|---|---|---|---|---|
| 1 | Fetch SPN | `src/lib/api/spn.ts` | `GET /spn/:ref` | mock KNOWN_REFS + MOCK_FORM_DATA |
| 2 | OCR Documents | `src/lib/api/ocr.ts` | `POST /ocr` | mock MOCK_OCR_FULL |

---

## 1. Fetch SPN — `src/lib/api/spn.ts`

ดึงข้อมูลใบขนสินค้าจาก ShippingNet ด้วย HTHM ref

### Current mock

```ts
// src/lib/api/spn.ts
export async function fetchSPN(ref: string): Promise<SPNResult> {
  await delay(1800)                          // ← ลบออก
  if (!KNOWN_REFS.includes(ref)) return { found: false }  // ← แทนด้วย API
  return { found: true, data: MOCK_FORM_DATA }             // ← แทนด้วย API
}
```

### ต้องแทนด้วย

```ts
export async function fetchSPN(ref: string): Promise<SPNResult> {
  const res = await fetch(`${process.env.SHIPPINGNET_API_URL}/spn/${ref}`, {
    headers: { Authorization: `Bearer ${process.env.SHIPPINGNET_API_KEY}` },
  })
  if (!res.ok) return { found: false }
  const json = await res.json()
  return { found: json.found, data: json.data }
}
```

### Request

```
GET /spn/:ref
Authorization: Bearer <token>

ref: HTHM000000001  (ShippingNet ref number)
```

### Response

```json
{
  "found": true,
  "data": {
    "declarant":       "บริษัท ไทยเทรด จำกัด",
    "importer":        "บริษัท เฮลท์ฟาร์มา จำกัด",
    "port":            "ท่าเรือแหลมฉบัง",
    "declarationDate": "10/06/2568",
    "goodsDesc":       "วัตถุดิบยา (Active Pharmaceutical Ingredient)",
    "hsCode":          "2941.10.00",
    "countryOrigin":   "อินเดีย",
    "quantity":        "250",
    "unit":            "กิโลกรัม",
    "licenseType":     "RGoods",
    "invoiceNo":       "INV-2024-8834",
    "invoiceDate":     "05/06/2568",
    "lotNo":           "LOT-2024-567",
    "uNo":             "U-2568-00123"
  }
}
```

Response เมื่อไม่พบ:
```json
{ "found": false }
```

### TypeScript interface

```ts
// src/lib/types.ts — FormData interface (ต้องตรงกับ response)
interface FormData {
  ref: string
  declarant: string
  importer: string
  port: string
  declarationDate: string
  goodsDesc: string
  hsCode: string
  countryOrigin: string
  quantity: string
  unit: string
  licenseType: string
  invoiceNo: string
  invoiceDate: string
  lotNo: string
  uNo: string
  drugRegNo?: string
  importDate?: string
}
```

---

## 2. OCR Documents — `src/lib/api/ocr.ts`

ส่งไฟล์เอกสารให้ service OCR แล้วรับข้อมูลที่แยกออกมา

### Current mock

```ts
// src/lib/api/ocr.ts
export async function runOCR(_files: { name: string }[]): Promise<OcrResult> {
  await delay(2800)            // ← ลบออก
  return MOCK_OCR_FULL         // ← แทนด้วย API call
}
```

### ต้องแทนด้วย

```ts
export async function runOCR(files: File[]): Promise<OcrResult> {
  const form = new FormData()
  files.forEach(f => form.append('files', f))

  const res = await fetch(`${process.env.OCR_SERVICE_URL}/ocr`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OCR_API_KEY}` },
    body: form,
  })
  if (!res.ok) throw new Error('OCR failed')
  return res.json()
}
```

### Request

```
POST /ocr
Authorization: Bearer <token>
Content-Type: multipart/form-data

files[]: invoice.pdf
files[]: customs.pdf
files[]: coa.pdf       (optional)
files[]: ulicense.pdf  (optional)
```

ชนิดไฟล์ที่รองรับ: `PDF`, `JPG`, `PNG`, `XML`  
ขนาดสูงสุด: 20MB ต่อไฟล์

### Response

```json
{
  "invoiceNo":     "INV-2024-8834",
  "invoiceDate":   "05/06/2568",
  "quantity":      "250",
  "lotNo":         "LOT-2024-567",
  "uNo":           "U-2568-00123",
  "importer":      "บริษัท เฮลท์ฟาร์มา จำกัด",
  "port":          "ท่าเรือแหลมฉบัง",
  "hsCode":        "2941.10.00",
  "countryOrigin": "อินเดีย",
  "invoiceDate":   "05/06/2568"
}
```

Fields ที่ไม่พบใน document จะเป็น `null` หรือ `""` — ระบบจะ mark เป็น missing ในฟอร์ม

### TypeScript interface

```ts
// src/lib/api/ocr.ts — OcrResult type (ต้องตรงกับ response)
type OcrResult = {
  invoiceNo?:     string
  invoiceDate?:   string
  quantity?:      string
  lotNo?:         string
  uNo?:           string
  importer?:      string
  port?:          string
  hsCode?:        string
  countryOrigin?: string
}
```

---

## Mock Data Reference

### MOCK_FORM_DATA (src/lib/mock/spn.ts)

ใช้เมื่อ SPN API ยังไม่พร้อม — trigger ด้วย refs `HTHM000000001`–`HTHM000000005`

```ts
{
  declarant:       'บริษัท ไทยเทรด จำกัด',
  importer:        'บริษัท เฮลท์ฟาร์มา จำกัด',
  port:            'ท่าเรือแหลมฉบัง',
  declarationDate: '10/06/2568',
  goodsDesc:       'วัตถุดิบยา (Active Pharmaceutical Ingredient)',
  hsCode:          '2941.10.00',
  countryOrigin:   'อินเดีย',
  quantity:        '',
  unit:            'กิโลกรัม',
  licenseType:     'RGoods',
  invoiceNo:       '',
  invoiceDate:     '',
  lotNo:           '',
  uNo:             '',
}
```

### MOCK_OCR_FULL (src/lib/mock/ocr.ts)

ใช้เมื่อ OCR service ยังไม่พร้อม

```ts
{
  invoiceNo:     'INV-2024-8834',
  invoiceDate:   '05/06/2568',
  quantity:      '250',
  lotNo:         'LOT-2024-567',
  uNo:           'U-2568-00123',
  importer:      'บริษัท เฮลท์ฟาร์มา จำกัด',
  port:          'ท่าเรือแหลมฉบัง',
  hsCode:        '2941.10.00',
  countryOrigin: 'อินเดีย',
}
```

### MOCK_SPN_LIST (src/lib/mock/spn_list.ts)

SPN list ที่แสดงใน chat เมื่อ user ไม่ระบุ ref — 12 entries (`HTHM000000001`–`HTHM000000012`)  
แทนด้วย `GET /spn/list?page=1&limit=12&sort=date_desc`

---

## ShippingNet Auth — ConnectPanel

ตอนนี้เป็น mock login (กด Connect → รอ 1200ms → สำเร็จ)

ต้องแทนด้วย real auth ใน `src/components/chat/ConnectPanel.tsx`:

```ts
// ConnectPanel.tsx — handleConnect()
const res = await fetch('/api/shippingnet/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password }),
})
if (!res.ok) { setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'); return }
const { token } = await res.json()
// store token → pass to subsequent SPN calls
onConnect()
```

---

## Error Handling Expectations

| กรณี | พฤติกรรมที่คาดหวัง |
|---|---|
| SPN ref ไม่พบ | `{ found: false }` → trigger `spnNotFound()` flow |
| Network timeout | throw Error → แสดง fallback message ใน chat |
| OCR ล้มเหลว | throw Error → botMsg แจ้ง user ลอง upload ใหม่ |
| Auth fail | ConnectPanel แสดง error inline (ไม่ใช่ toast) |
