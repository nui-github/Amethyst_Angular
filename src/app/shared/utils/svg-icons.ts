// SVG string helpers — used only inside [innerHTML] bindings
// For regular Angular templates, use lucide-angular <lucide-icon> instead.

const ic = (path: string, size = 16, color = 'currentColor') =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
    stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
    style="display:inline-block;vertical-align:middle">${path}</svg>`;

export const icCheck      = (c = '#0D8F61', s = 16) => ic('<path d="M20 6 9 17l-5-5"/>', s, c);
export const icX          = (c = '#C0392B', s = 16) => ic('<path d="M18 6 6 18M6 6l12 12"/>', s, c);
export const icWarn       = (c = '#B45309', s = 16) => ic('<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>', s, c);
export const icFile       = (c = '#1565C0', s = 16) => ic('<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>', s, c);
export const icSearch     = (c = '#0463EF', s = 16) => ic('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>', s, c);
export const icUpload     = (c = '#0463EF', s = 32) => ic('<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>', s, c);
