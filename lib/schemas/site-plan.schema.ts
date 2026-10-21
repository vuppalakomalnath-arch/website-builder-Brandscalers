import { z } from 'zod';

export const SectionPlanSchema = z.object({
  id: z.string(),
  pieceId: z.string(), // matches p-opener-hero, p-offer-services-grid, etc.
  category: z.string(),
  preferredVariant: z.string().optional(),
  purpose: z.string(),
  contentObjective: z.string(),
  ctaDestination: z.string().optional(),
  responsiveNotes: z.string().optional(),
});

export const PagePlanSchema = z.object({
  slug: z.string(),
  title: z.string(),
  pagePurpose: z.string(),
  audienceIntent: z.string(),
  sections: z.array(SectionPlanSchema),
  ctaDestinations: z.array(z.string()).default([]),
  seoMeta: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

export const VisitorJourneyStepSchema = z.object({
  stage: z.string(), // Awareness, Consideration, Decision, Action
  visitorGoal: z.string(),
  addressedByPage: z.string(),
  addressedBySection: z.string(),
  callToAction: z.string(),
});

export const SitePlanSchema = z.object({
  schemaVersion: z.literal('2.1'),
  projectId: z.string(),
  goalSummary: z.string(),
  sitemap: z.array(z.string()), // ['home', 'about', 'services', 'contact']
  navigation: z.array(z.object({
    label: z.string(),
    targetPage: z.string(),
  })),
  visitorJourneys: z.array(VisitorJourneyStepSchema),
  pagePlans: z.array(PagePlanSchema),
  featurePlan: z.array(z.string()),
  designBrief: z.string(),
  missingAssets: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  assumptions: z.array(z.string()).default([]),
  planVersion: z.number().default(1),
});

export type SitePlan = z.infer<typeof SitePlanSchema>;
export type PagePlan = z.infer<typeof PagePlanSchema>;
export type SectionPlan = z.infer<typeof SectionPlanSchema>;
export type VisitorJourneyStep = z.infer<typeof VisitorJourneyStepSchema>;
