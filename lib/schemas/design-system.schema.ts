import { z } from 'zod';

export const FontPairKeySchema = z.enum([
  'inter',
  'playfair-inter',
  'cormorant-jost',
  'poppins',
  'dmserif-dmsans',
  'space-inter',
  'fraunces-work',
  'montserrat-open',
  'figtree',
]);

export const DesignDialsSchema = z.object({
  accent: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Must be a valid hex color'),
  ink: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/),
  bg: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/),
  surface: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/),
  footerBg: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/),
  font: FontPairKeySchema.default('figtree'),
  headWeight: z.enum(['400', '500', '600', '700', '800']).default('700'),
  headCase: z.enum(['normal', 'uppercase']).default('normal'),
  radius: z.enum(['sharp', 'soft', 'rounded', 'round']).default('soft'),
  buttons: z.enum(['solid', 'outline', 'pill', 'underline']).default('solid'),
  surface_style: z.enum(['flat', 'outlined', 'raised', 'tinted']).default('outlined'),
  images: z.enum(['follow', 'square', 'arch', 'circle']).default('follow'),
  density: z.enum(['airy', 'balanced', 'dense']).default('balanced'),
  align: z.enum(['center', 'left']).default('center'),
  motion: z.enum(['none', 'reveal', 'lift']).default('none'),
  mode: z.enum(['light', 'dark']).default('light'),
});

export const DesignSystemSchema = z.object({
  schemaVersion: z.literal('2.1'),
  designSystemId: z.string(),
  conceptName: z.string(),
  conceptRationale: z.string(),
  dials: DesignDialsSchema,
  computedTokens: z.record(z.string(), z.string()), // CSS custom properties
  rootAttributes: z.record(z.string(), z.string()), // data-* attributes
  googleFontsUrl: z.string(),
  version: z.number().default(1),
});

export type DesignDials = z.infer<typeof DesignDialsSchema>;
export type DesignSystem = z.infer<typeof DesignSystemSchema>;
export type FontPairKey = z.infer<typeof FontPairKeySchema>;
