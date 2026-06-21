# ShippingNet Assistant — Design System (BizX)

> Last updated: June 2026 | Version 2.0.0  
> Design system changed from **Amethyst** → **BizX (Business Exchange)**

---

## 🎨 BizX Color Palette

Based on the **Expanded BizX Web App Style Guide** (BizX_ColorGuide.png).

### Primary Blue Shades — Base `#010136`
| Name | Hex | Tailwind Token | Usage |
|------|-----|---------------|-------|
| Navy Light | `#8080A5` | `navy-light` | Sidebar text, muted labels |
| Navy Mid | `#40406A` | `navy-mid` | Sidebar dividers, user avatar gradient |
| **Navy (Base)** | `#010136` | `navy` | Primary text, sidebar bg, headings |
| Navy Dark | `#00001A` | `navy-dark` | Sidebar hover, deep accents |
| Navy Deeper | `#00000D` | `navy-deeper` | Deepest dark (reserved) |

### Secondary Blue Shades — Base `#0463EF`
| Name | Hex | Tailwind Token | Usage |
|------|-----|---------------|-------|
| Blue Light | `#B0D0FF` | `blue-light` | Hover text in sidebar |
| Blue Soft | `#70A0F0` | `blue-soft` | Typing dots, light accents |
| **Blue (Base)** | `#0463EF` | `blue` | Active sidebar item, CTA buttons, links, focus rings |
| Blue Deep | `#034DBA` | `blue-deep` | Button gradient start, darker primary |
| Blue Darker | `#02388C` | `blue-darker` | Deep hover states |

### Accent Green (Teal) Shades — Base `#16EA9E`
| Name | Hex | Tailwind Token | Usage |
|------|-----|---------------|-------|
| Teal Light | `#B0FFF0` | `teal-light` | Very light teal fills |
| Teal Soft | `#70E5C0` | `teal-soft` | Soft teal accents |
| **Teal (Base)** | `#16EA9E` | `teal` | Success confirm buttons, OCR check marks, status dot |
| Teal Mid | `#11BB7F` | `teal-mid` | OCR stage done color, submit button gradient |
| Teal Dark | `#0D8F61` | `teal-dark` | Success text, OCR filled text |

### Neutral Shades (Text, Borders, Backgrounds)
| Name | Hex | Token | Role |
|------|-----|-------|------|
| White | `#FFFFFF` | `neutral-white` | Card bg, message bubbles, input bg |
| `#F9F9F9` | `neutral-50` | Board BG (lightest) |
| `#F0F0F0` | `neutral-100` | App background, card headers, input bg idle |
| `#E0E0E0` | `neutral-200` | Borders, dividers, scrollbar track |
| `#CCCCCC` | `neutral-300` | Dashed borders, placeholder attachments |
| `#999999` | `neutral-500` | Secondary text, timestamps, disabled |
| `#666666` | `neutral-600` | Labels, body secondary text |
| `#333333` | `neutral-800` | Dark body text (fallback) |

### Semantic Color Map
| Intent | Color | Hex |
|--------|-------|-----|
| Primary action | Blue gradient | `#034DBA → #0463EF` |
| Success / Confirm | Teal gradient | `#11BB7F → #16EA9E` |
| Warning | Amber | `rgba(255,165,0,0.12)` bg / `#B45309` text |
| Error | Red | `#C0392B` text |
| Info | Blue soft | `rgba(4,99,239,0.10)` |
| Source: SPN | Blue badge | `rgba(4,99,239,0.10)` / `#0463EF` |
| Source: OCR | Teal badge | `rgba(22,234,158,0.15)` / `#0D8F61` |
| Source: User | Amber badge | `rgba(255,165,0,0.12)` / `#B45309` |

---

## 🔤 Typography

**Font Family:** IBM Plex Sans Thai  
**Google Fonts weights:** 300, 400, 500, 600, 700  
**Fallback chain:** IBM Plex Sans → system-ui → sans-serif

| Role | Size | Weight | Color | Usage |
|------|------|--------|-------|-------|
| App title | 14px | 700 | `#010136` | Header app name |
| Section heading | 13px | 700 | `#010136` | Card headers, modal titles |
| Body / message | 14px | 400 | `#010136` | Chat bubble content |
| Label | 11px | 600 | `#666666` | Form labels, sidebar section titles |
| Caption / meta | 10–11px | 400 | `#999999` | Timestamps, helper text |
| Badge | 10–11px | 700 | varies | Source tags, status badges |
| Sidebar nav | 12px | 600 | `#8080A5` / `#fff` | Nav items |
| Logo text | 12px | 900 | `#fff` | BIZ X wordmark (letter-spacing: wider) |

---

## 📐 Layout

```
┌─────────────────────────────────────────────────────────────┐
│                    ChatHeader (h-14, bg:#fff)               │
│  [BIZ X logo] Title + Subtitle    [status] [bell] [avatar]  │
├──────────────────┬──────────────────────────────────────────┤
│   Sidebar        │                                          │
│   w-56           │         ChatArea (flex-1)                │
│   bg: #010136    │         bg: #F0F0F0  overflow-y-auto     │
│                  │                                          │
│  [BX logo]       │    [AI bubble]  [User bubble]            │
│  Navigation      │    [OCR card]                            │
│  History         │    [Form panel]                          │
│  Settings        │                                          │
│                  │                                          │
├──────────────────┴──────────────────────────────────────────┤
│          ChatInput (bg:#fff, border-top:#E0E0E0)            │
└─────────────────────────────────────────────────────────────┘
```

**Key measurements:**
- Sidebar: `224px` (w-56), dark navy `#010136`
- Header: `56px` (h-14), white with bottom border `#E0E0E0`
- Chat area background: `#F0F0F0` (Board BG)
- Card border-radius: `14–16px`
- Button border-radius: `10–12px`
- Avatar: `32px` (w-8 h-8), `rounded-xl`

---

## 🧩 Components

### Sidebar
- **Background:** `#010136` (Navy base)
- **Logo badge:** gradient `#0463EF → #16EA9E`, `rounded-xl`
- **Active item:** bg `#0463EF`, text white, shadow `0 2px 12px rgba(4,99,239,0.35)`
- **Inactive item:** text `#8080A5`, hover bg `#00001A` + text `#B0D0FF`
- **History item active:** text `#16EA9E`, bg `rgba(22,234,158,0.08)`
- **Section divider:** `#40406A`
- **Scrollbar thumb:** `#8080A5`

### ChatHeader
- **Background:** White `#fff`
- **Bottom border:** `#E0E0E0`
- **Status pill:** bg `rgba(22,234,158,0.10)`, border `rgba(22,234,158,0.35)`, dot `#16EA9E` (pulsing)
- **Avatar:** gradient `#010136 → #0463EF`

### Message Bubbles
| Role | Background | Border | Shadow |
|------|-----------|--------|--------|
| Bot | `#fff` | `1px solid #E0E0E0` | `0 2px 10px rgba(1,1,54,0.06)` |
| User | gradient `#034DBA → #0463EF` | — | `0 4px 14px rgba(4,99,239,0.25)` |

- **Bot corner:** `rounded-2xl rounded-bl-sm`
- **User corner:** `rounded-2xl rounded-br-sm`
- **Bot avatar:** gradient `#010136 → #0463EF`, shadow `0 3px 10px rgba(4,99,239,0.28)`
- **User avatar:** gradient `#40406A → #0463EF`

### Chat Cards
- **Border:** `1px solid #E0E0E0`, `border-radius: 14px`
- **Header:** bg `#F0F0F0`, text `#010136 700`
- **Body:** white, `p-4`
- **Row divider:** `border-bottom: 1px dashed #E0E0E0`

### Buttons
| Variant | Style |
|---------|-------|
| Primary | gradient `#034DBA → #0463EF`, shadow `0 4px 14px rgba(4,99,239,0.28)` |
| Teal/Success | gradient `#11BB7F → #16EA9E`, shadow `0 4px 14px rgba(22,234,158,0.30)`, text `#010136` |
| Secondary | bg `#F0F0F0`, border `#E0E0E0`, text `#666666` |
| Danger | bg `#FFEFEF`, border `#FFCCCC`, text `#C0392B` |

All buttons: `rounded-xl`, `font-bold`, `transition-all`, hover `scale-[1.02]`

### Badges / Source Tags
| Type | Background | Text |
|------|-----------|------|
| SPN | `rgba(4,99,239,0.10)` | `#0463EF` |
| OCR | `rgba(22,234,158,0.15)` | `#0D8F61` |
| User | `rgba(255,165,0,0.12)` | `#B45309` |
| Blue (status/info) | `rgba(4,99,239,0.10)` | `#0463EF` |
| Green (success) | `rgba(22,234,158,0.15)` | `#0D8F61` |
| Amber (warning) | `rgba(255,165,0,0.12)` | `#B45309` |

### Quick Chips
- Default: bg `rgba(4,99,239,0.08)`, border `rgba(4,99,239,0.25)`, text `#0463EF`
- Hover: bg `#0463EF`, text `#fff`, shadow `0 2px 10px rgba(4,99,239,0.25)`
- Shape: `rounded-full`

### Form Fields
| State | Border | Background | Text |
|-------|--------|-----------|------|
| Default | `#CCCCCC` | `#fff` | `#010136` |
| Focus | `#0463EF` + ring `rgba(4,99,239,0.12)` | `#fff` | `#010136` |
| Filled (OCR) | `#16EA9E` | `rgba(22,234,158,0.07)` | `#0D8F61` |
| Filled (SPN) | `#0463EF` | `rgba(4,99,239,0.10)` | `#0463EF` |
| Missing (required) | `#70A0F0` | `rgba(4,99,239,0.04)` | `#010136` |

### OCR Progress Bar
- Track: `#E0E0E0`
- Fill: gradient `#0463EF → #16EA9E` (left to right)
- Height: `8px`, `border-radius: 9999px`

### TypingIndicator
- Avatar: gradient `#010136 → #0463EF`
- Dots: color `#0463EF`, opacity `0.45`, bounce animation

---

## 🎭 Shadows

| Name | Value | Usage |
|------|-------|-------|
| `shadow-bizx` | `0 4px 20px rgba(4,99,239,0.18)` | Primary buttons, send btn |
| `shadow-card` | `0 2px 10px rgba(1,1,54,0.08)` | Cards, bot bubbles |
| `shadow-modal` | `0 20px 60px rgba(1,1,54,0.22)` | Modal dialogs |
| `shadow-teal` | `0 4px 16px rgba(22,234,158,0.25)` | Teal/success buttons |
| `shadow-navy` | `0 4px 16px rgba(1,1,54,0.3)` | Deep navy elements |

---

## ✨ Animations

| Name | Duration | Usage |
|------|----------|-------|
| `pulse-dot` | 2s ease-in-out | Online status indicator |
| `bounce-dot` | 1.2s ease-in-out | Typing indicator (staggered) |
| `slide-up` | 0.25s ease-out | Message appear, modal open |
| `fade-in` | 0.2s ease-out | Modal overlay |
| `spin` | 1s linear | OCR spinner, loading |
| `slideUp` (CSS) | 0.22s ease-out | `.msg-appear` class |

---

## 🖼️ Iconography

**Library:** Lucide React `v0.383.0` — stroke-based outline icons  
**Default stroke-width:** 2 (Lucide default)

| Context | Icons | Size |
|---------|-------|------|
| Sidebar nav | MessageSquareText, LayoutDashboard, FileCheck2, Package, FileText, BarChart2 | 15px |
| History | Clock3 | 12px |
| Settings | Settings | 14px |
| Header | Bell, Activity, User | 16px |
| Send button | Send | 16px |
| Attach | Paperclip | 15px |
| Upload | CloudUpload, Play | 15–20px |
| OCR stages | FileText, Ship, FlaskConical, BadgeCheck | 14px |
| Status | CheckCircle, Loader2 | 14px |
| Modal | X, Send, Edit2, CheckCircle | 13–16px |

---

## 🗂️ File Structure

```
src/
├── app/
│   ├── layout.tsx        ← Root layout, IBM Plex Sans Thai via <link>
│   ├── globals.css       ← Tailwind + BizX CSS variables + utility classes
│   └── page.tsx          ← All state/logic, inline HTML with BizX colors
├── components/
│   ├── chat/
│   │   ├── Sidebar.tsx          ← Navy dark sidebar
│   │   ├── ChatHeader.tsx       ← White header, teal status pill
│   │   ├── ChatArea.tsx         ← Message renderer (F0F0F0 bg)
│   │   ├── ChatInput.tsx        ← Textarea + blue send btn
│   │   ├── TypingIndicator.tsx  ← Navy→blue gradient avatar
│   │   ├── FormPanel.tsx        ← OCR form, teal filled / blue missing
│   │   ├── FullUploadPanel.tsx  ← 4-slot drag-drop, blue gradient btn
│   │   ├── OcrProgress.tsx      ← Blue→teal gradient progress bar
│   │   ├── QuickChips.tsx       ← Blue pill chips, hover fills blue
│   │   └── Modals.tsx           ← PreviewModal + ConfirmModal (teal confirm)
│   └── ui/
│       ├── Badge.tsx            ← Reusable badge component
│       └── Button.tsx           ← Reusable button component
└── lib/
    ├── types.ts          ← TypeScript interfaces
    └── utils.ts          ← Helpers, mock data, KNOWN_REFS
```

---

## 🔄 Version History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | June 2026 | Initial — Amethyst design system (`#8A4FFF` purple) |
| 2.0.0 | June 2026 | **Migrated to BizX** — Navy `#010136`, Blue `#0463EF`, Teal `#16EA9E` |
