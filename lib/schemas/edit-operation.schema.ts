import { z } from 'zod';

export const EditOperationTypeSchema = z.enum([
  'update_content_block',
  'update_design_dial',
  'apply_preset',
  'switch_component_variant',
  'reorder_sections',
  'toggle_section_visibility',
  'add_section',
  'remove_section',
  'update_seo_meta',
  'update_navigation',
]);

export const EditOperationSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  type: EditOperationTypeSchema,
  payload: z.record(z.string(), z.any()),
  timestamp: z.string(),
  reversible: z.boolean().default(true),
  inversePayload: z.record(z.string(), z.any()).optional(),
});

export type EditOperation = z.infer<typeof EditOperationSchema>;
export type EditOperationType = z.infer<typeof EditOperationTypeSchema>;
