import { DesignDials, FontPairKey } from '@/lib/schemas/design-system.schema';

export interface FontPairConfig {
  head: string;
  body: string;
  label: string;
}

export const FONT_PAIRS: Record<FontPairKey, FontPairConfig> = {
  inter: { head: 'Inter', body: 'Inter', label: 'Clean sans (Inter)' },
  'playfair-inter': { head: 'Playfair Display', body: 'Inter', label: 'Classic serif + sans' },
  'cormorant-jost': { head: 'Cormorant Garamond', body: 'Jost', label: 'Quiet luxury (Cormorant)' },
  poppins: { head: 'Poppins', body: 'Poppins', label: 'Friendly rounded (Poppins)' },
  'dmserif-dmsans': { head: 'DM Serif Display', body: 'DM Sans', label: 'Organic editorial (DM Serif)' },
  'space-inter': { head: 'Space Grotesk', body: 'Inter', label: 'Tech & studio (Space Grotesk)' },
  'fraunces-work': { head: 'Fraunces', body: 'Work Sans', label: 'Warm heritage & craft (Fraunces)' },
  'montserrat-open': { head: 'Montserrat', body: 'Open Sans', label: 'Corporate & structured (Montserrat)' },
  figtree: { head: 'Figtree', body: 'Figtree', label: 'Modern natural clinic (Figtree)' },
};

export const RADIUS_MAP: Record<string, string> = {
  sharp: '0px',
  soft: '8px',
  rounded: '16px',
  round: '24px',
};

export const RADIUS_SM_MAP: Record<string, string> = {
  sharp: '0px',
  soft: '4px',
  rounded: '8px',
  round: '12px',
};

export const PAD_MAP: Record<string, string> = {
  airy: '96px',
  balanced: '64px',
  dense: '40px',
};

// 8 Curated Presets based on minimal, organic, natural palettes (no bold/loud gradients)
export const PRESETS: Record<string, DesignDials> = {
  'Warm clinic': {
    accent: '#8c593b', // Warm natural terracotta
    ink: '#1f1e1d',    // Deep slate charcoal
    bg: '#fbfbf9',     // Soft bone white
    surface: '#f5f3ee',// Subtle limestone
    footerBg: '#2a2420',
    font: 'figtree',
    headWeight: '700',
    headCase: 'normal',
    radius: 'soft',
    buttons: 'solid',
    surface_style: 'outlined',
    images: 'follow',
    density: 'balanced',
    align: 'center',
    motion: 'none',
    mode: 'light',
  },
  'Quiet luxury': {
    accent: '#6e5446', // Muted raw umber
    ink: '#1a1918',
    bg: '#fdfcfb',
    surface: '#f6f4f1',
    footerBg: '#26211e',
    font: 'cormorant-jost',
    headWeight: '500',
    headCase: 'normal',
    radius: 'sharp',
    buttons: 'outline',
    surface_style: 'flat',
    images: 'square',
    density: 'airy',
    align: 'center',
    motion: 'none',
    mode: 'light',
  },
  'Editorial mono': {
    accent: '#2b2c2e', // Deep graphite
    ink: '#161718',
    bg: '#ffffff',
    surface: '#f7f7f6',
    footerBg: '#161718',
    font: 'inter',
    headWeight: '500',
    headCase: 'normal',
    radius: 'sharp',
    buttons: 'solid',
    surface_style: 'flat',
    images: 'square',
    density: 'balanced',
    align: 'left',
    motion: 'none',
    mode: 'light',
  },
  'Fresh green': {
    accent: '#2f6848', // Organic deep forest / sage
    ink: '#16231a',
    bg: '#fcfdfb',
    surface: '#f1f6f2',
    footerBg: '#14281b',
    font: 'poppins',
    headWeight: '600',
    headCase: 'normal',
    radius: 'rounded',
    buttons: 'pill',
    surface_style: 'tinted',
    images: 'follow',
    density: 'balanced',
    align: 'center',
    motion: 'none',
    mode: 'light',
  },
  'Corporate navy': {
    accent: '#2a4365', // Muted slate navy
    ink: '#141c2b',
    bg: '#ffffff',
    surface: '#f3f6fa',
    footerBg: '#0f1726',
    font: 'montserrat-open',
    headWeight: '600',
    headCase: 'normal',
    radius: 'soft',
    buttons: 'solid',
    surface_style: 'raised',
    images: 'follow',
    density: 'balanced',
    align: 'left',
    motion: 'none',
    mode: 'light',
  },
  'Warm restaurant': {
    accent: '#94442a', // Rust earthenware
    ink: '#221915',
    bg: '#fbf7f2',
    surface: '#f3ece2',
    footerBg: '#221915',
    font: 'dmserif-dmsans',
    headWeight: '600',
    headCase: 'normal',
    radius: 'soft',
    buttons: 'outline',
    surface_style: 'flat',
    images: 'follow',
    density: 'airy',
    align: 'center',
    motion: 'none',
    mode: 'light',
  },
  'Playful studio': {
    accent: '#5a4fcf', // Muted iris
    ink: '#1c1b26',
    bg: '#fdfcf9',
    surface: '#f4f1fa',
    footerBg: '#1c1b26',
    font: 'poppins',
    headWeight: '700',
    headCase: 'normal',
    radius: 'rounded',
    buttons: 'pill',
    surface_style: 'raised',
    images: 'arch',
    density: 'balanced',
    align: 'center',
    motion: 'lift',
    mode: 'light',
  },
  'Dark slate': {
    accent: '#c99a5b', // Warm muted brass/gold
    ink: '#f1efe9',
    bg: '#121316',     // Deep obsidian slate
    surface: '#1c1d22',
    footerBg: '#0b0b0d',
    font: 'playfair-inter',
    headWeight: '500',
    headCase: 'normal',
    radius: 'sharp',
    buttons: 'outline',
    surface_style: 'outlined',
    images: 'square',
    density: 'airy',
    align: 'left',
    motion: 'none',
    mode: 'dark',
  },
};

export function luminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return 1;
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function resolvePalette(d: DesignDials): { bg: string; ink: string; surface: string; footerBg: string } {
  const lum = luminance(d.bg);
  if (d.mode === 'dark' && lum > 0.4) {
    return { bg: '#121316', ink: '#eceae4', surface: '#1b1c20', footerBg: '#090a0c' };
  }
  if (d.mode !== 'dark' && lum < 0.18) {
    return { bg: '#ffffff', ink: '#1c1d1f', surface: '#f5f4f0', footerBg: '#18191b' };
  }
  return { bg: d.bg, ink: d.ink, surface: d.surface, footerBg: d.footerBg };
}

export function designToVars(d: DesignDials): { vars: Record<string, string>; attrs: Record<string, string> } {
  const f = FONT_PAIRS[d.font] || FONT_PAIRS.figtree;
  const dark = d.mode === 'dark';
  const p = resolvePalette(d);

  const vars: Record<string, string> = {
    '--accent': d.accent,
    '--ink': p.ink,
    '--bg': p.bg,
    '--surface': p.surface,
    '--footer-bg': p.footerBg,
    '--accent-ink': luminance(d.accent) > 0.42 ? '#111111' : '#ffffff',
    '--accent-fg': dark
      ? `color-mix(in srgb, ${d.accent} 65%, #ffffff)`
      : `color-mix(in srgb, ${d.accent} 80%, ${p.ink})`,
    '--footer-ink': luminance(p.footerBg) < 0.4 ? '#f5f3ee' : '#1c1d1f',
    '--muted': `color-mix(in srgb, ${p.ink} 64%, ${p.bg})`,
    '--line': `color-mix(in srgb, ${p.ink} 12%, transparent)`,
    '--r': RADIUS_MAP[d.radius] || RADIUS_MAP.soft,
    '--r-sm': RADIUS_SM_MAP[d.radius] || RADIUS_SM_MAP.soft,
    '--pad': PAD_MAP[d.density] || PAD_MAP.balanced,
    '--hf': `'${f.head}', Georgia, serif`,
    '--bf': `'${f.body}', system-ui, -apple-system, sans-serif`,
    '--hw': d.headWeight,
  };

  const attrs: Record<string, string> = {
    'data-buttons': d.buttons,
    'data-cards': d.surface_style,
    'data-images': d.images,
    'data-density': d.density,
    'data-align': d.align,
    'data-motion': d.motion,
    'data-case': d.headCase,
    'data-mode': d.mode,
  };

  return { vars, attrs };
}

export function fontsHref(d: DesignDials): string {
  const f = FONT_PAIRS[d.font] || FONT_PAIRS.figtree;
  const fams = [...new Set([f.head, f.body])]
    .map((n) => `family=${n.replace(/ /g, '+')}:wght@400;500;600;700;800`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${fams}&display=swap`;
}
