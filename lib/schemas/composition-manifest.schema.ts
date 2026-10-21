import { z } from 'zod';

export const ComponentInstanceSchema = z.object({
  instanceId: z.string(),
  pieceId: z.string(), // e.g. 'p-opener-hero'
  variantName: z.string(), // e.g. 'split', 'centered', 'with-booking'
  category: z.string(), // e.g. 'opener', 'offer', 'trust', 'action'
  props: z.record(z.string(), z.any()).default({}),
  contentSlotRefs: z.record(z.string(), z.string()).default({}), // maps slot name to ContentBlock id
  responsiveOverrides: z.record(z.string(), z.any()).optional(),
  interactionConfig: z.record(z.string(), z.any()).optional(),
  orderIndex: z.number(),
  isVisible: z.boolean().default(true),
});

export const ManifestPageSchema = z.object({
  slug: z.string(),
  title: z.string(),
  isHome: z.boolean().default(false),
  componentInstances: z.array(ComponentInstanceSchema),
  seo: z.object({
    title: z.string(),
    description: z.string(),
    ogImage: z.string().optional(),
  }),
});

export const CompositionManifestSchema = z.object({
  schemaVersion: z.literal('2.1'),
  projectId: z.string(),
  libraryVersion: z.string().default('2.1.0-292looks'),
  engineVersion: z.string().default('2.1.0'),
  compositionSeed: z.string(),
  designSystemVersion: z.number().default(1),
  pages: z.array(ManifestPageSchema),
  compositionFingerprint: z.string(), // SHA-256 hash of structural dimensions
  similarityScores: z.record(z.string(), z.number()).default({}),
  qualityStatus: z.enum(['pending', 'passed', 'warnings', 'blocked']).default('pending'),
});

export type ComponentInstance = z.infer<typeof ComponentInstanceSchema>;
export type ManifestPage = z.infer<typeof ManifestPageSchema>;
export type CompositionManifest = z.infer<typeof CompositionManifestSchema>;
