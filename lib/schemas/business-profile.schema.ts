import { z } from 'zod';

export const AssumptionSchema = z.object({
  id: z.string(),
  field: z.string(),
  value: z.any(),
  confidence: z.number().min(0).max(1), // 0 to 1
  evidence: z.string(),
  riskIfIncorrect: z.enum(['low', 'medium', 'high']),
  requiresConfirmation: z.boolean(),
});

export const OpenQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  reason: z.string(),
  impactDimension: z.enum(['sitemap', 'design', 'conversion', 'content']),
  expectedImpactScore: z.number().min(0).max(1),
  options: z.array(z.string()).optional(),
  resolved: z.boolean().default(false),
  answer: z.string().optional(),
});

export const BusinessProfileSchema = z.object({
  schemaVersion: z.literal('2.1'),
  businessName: z.string().min(1, 'Business name is required'),
  businessCategory: z.string().min(1, 'Business category is required'),
  subcategory: z.string().optional(),
  offerings: z.array(z.string()).default([]),
  primaryGoal: z.string().default('Lead generation and direct inquiry'),
  primaryConversion: z.string().default('contact_form'),
  audience: z.array(z.string()).default(['General consumers']),
  locationOrServiceArea: z.string().optional(),
  brandTone: z.enum([
    'warm-clinic',
    'quiet-luxury',
    'editorial-mono',
    'fresh-green',
    'corporate-navy',
    'warm-restaurant',
    'playful',
    'dark-premium',
  ]).default('warm-clinic'),
  requiredPages: z.array(z.string()).default(['home', 'about', 'services', 'contact']),
  requiredFeatures: z.array(z.string()).default([]),
  confirmedFacts: z.record(z.string(), z.any()).default({}),
  assumptions: z.array(AssumptionSchema).default([]),
  openQuestions: z.array(OpenQuestionSchema).default([]),
  confidenceByField: z.record(z.string(), z.number()).default({}),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type BusinessProfile = z.infer<typeof BusinessProfileSchema>;
export type Assumption = z.infer<typeof AssumptionSchema>;
export type OpenQuestion = z.infer<typeof OpenQuestionSchema>;
