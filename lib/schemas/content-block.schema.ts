import { z } from 'zod';

export const ContentBlockSchema = z.object({
  id: z.string(),
  type: z.enum(['headline', 'subheadline', 'body', 'badge', 'cta_label', 'list_item', 'testimonial', 'faq_item', 'feature_card', 'contact_info']),
  purpose: z.string(),
  content: z.string(),
  ctaDestination: z.string().optional(),
  assetRefs: z.array(z.string()).default([]),
  sourceStatus: z.enum([
    'customer_confirmed',
    'generated',
    'placeholder',
    'needs_review'
  ]).default('generated'),
  claimEvidence: z.array(z.string()).default([]),
  locale: z.string().default('en'),
  updatedAt: z.string(),
});

export type ContentBlock = z.infer<typeof ContentBlockSchema>;
