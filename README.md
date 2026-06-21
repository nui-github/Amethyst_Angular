# ShippingNet Assistant — Angular App

AI chatbot สำหรับขอใบอนุญาตนำเข้า (RGoods) และจัดการเอกสารศุลกากร  
Built with **Angular 17** · ng-zorro-antd · BizX Design System · IBM Plex Sans Thai

---

## Quick Start

```bash
npm install
ng serve
# → http://localhost:4200
```

**Node version**: 20.x (`nvm use 20`)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Angular 17 (Standalone components, Signals, OnPush) |
| UI Library | ng-zorro-antd (Ant Design for Angular) |
| Language | TypeScript (strict mode) |
| Font | IBM Plex Sans Thai |
| Icons | lucide-angular |
| Styling | SCSS (no Tailwind) + BizX CSS custom properties |

---

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── mock/           ← mock data (replace with real API — see docs/API.md)
│   │   ├── models/         ← all TypeScript interfaces
│   │   └── services/       ← ChatService, QueueService, OcrService
│   ├── features/
│   │   ├── chat/           ← main chat page + all chat components
│   │   ├── queue/          ← queue management page
│   │   └── print/          ← license print page (A4)
│   └── shared/             ← pipes, utils
├── environments/           ← environment.ts / environment.prod.ts
└── styles/                 ← global SCSS, BizX variables, ng-zorro theme overrides
```

---

## Docs

| File | Description |
|------|-------------|
| [`ANGULAR.md`](./ANGULAR.md) | Dev guide — component list, patterns, how to add new message types |
| [`docs/DESIGN.md`](./docs/DESIGN.md) | BizX design system — colors, typography, components |
| [`docs/API.md`](./docs/API.md) | API contracts — endpoints to replace mock data |

---

## Replacing Mock Data with Real APIs

Edit `src/environments/environment.prod.ts`:
```ts
useMock: false,
apiUrl: 'https://your-api.com',
```

Then update the two mock services in `src/app/core/mock/`:
- `spn.mock.ts` → replace `KNOWN_REFS` + `MOCK_FORM_DATA` with `GET /spn/:ref`
- `ocr.mock.ts` → replace `MOCK_OCR_RESULT` with `POST /ocr`

See [`docs/API.md`](./docs/API.md) for full request/response contracts.

---

## Key Patterns

- All state in **Services** (`ChatService`, `QueueService`, `OcrService`) as Angular Signals
- All components use `ChangeDetectionStrategy.OnPush`
- BizX colors via CSS custom properties (`var(--bizx-blue)`) — never hardcoded hex in templates
- No Tailwind — all styles in component `.scss` files
