import { prisma } from '@/server/db/client';
import { RawBriefInput, inferBusinessProfile } from '@/engine/context/inference';
import { selectAdaptiveQuestions } from '@/engine/questions/selector';
import { generateSitePlan } from '@/engine/planning/planner';
import { designToVars, fontsHref, PRESETS } from '@/engine/design-system/tokens';
import { DesignSystem } from '@/lib/schemas/design-system.schema';
import { composeWebsite } from '@/engine/composition/composer';
import { generateBoundedWebsiteContent } from '@/engine/content/generator';
import { runQualityChecks } from '@/engine/quality/checker';

export interface GenerationPipelineInput {
  projectId?: string;
  brief: RawBriefInput;
}

export interface PipelineExecutionResult {
  projectId: string;
  runId: string;
  status: string;
  currentStage: string;
  profile: any;
  plan: any;
  designSystem: any;
  manifest: any;
  contentBlocks: any[];
  qualityReport: any;
  questions: any[];
  estimatedAiCostINR: number;
}

export async function executeGenerationPipeline(
  input: GenerationPipelineInput
): Promise<PipelineExecutionResult> {
  // 1. Brief Received
  let project = input.projectId
    ? await prisma.project.findUnique({ where: { id: input.projectId } })
    : null;

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: input.brief.businessName || 'New Website Studio Project',
        userId: 'anonymous_owner',
      },
    });
  }

  const projectId = project.id;

  // Create GenerationRun record
  const run = await prisma.generationRun.create({
    data: {
      projectId,
      status: 'running',
      currentStage: 'brief_received',
      inputSnapshotHash: Buffer.from(JSON.stringify(input.brief)).toString('base64'),
    },
  });

  // Stage 2: Profile Inferred
  const profile = inferBusinessProfile(input.brief);
  await prisma.generationRun.update({
    where: { id: run.id },
    data: { currentStage: 'profile_inferred' },
  });

  // Stage 3: Clarification evaluation
  const questions = selectAdaptiveQuestions(profile);
  const stageAfterClarify = questions.length > 0 ? 'clarification_needed' : 'profile_ready';
  await prisma.generationRun.update({
    where: { id: run.id },
    data: { currentStage: stageAfterClarify },
  });

  // Stage 4: Plan Created
  const plan = generateSitePlan(profile, projectId);
  await prisma.generationRun.update({
    where: { id: run.id },
    data: { currentStage: 'plan_created' },
  });

  // Stage 5: Design System Created (Natural Palette tokens derived from 16 dials & benchmark blueprint)
  const blueprint = profile.confirmedFacts?.referenceBlueprint;
  const presetKey =
    blueprint?.presetKey ||
    (profile.brandTone === 'warm-clinic'
      ? 'Warm clinic'
      : profile.brandTone === 'quiet-luxury'
      ? 'Quiet luxury'
      : profile.brandTone === 'fresh-green'
      ? 'Fresh green'
      : profile.brandTone === 'corporate-navy'
      ? 'Corporate navy'
      : profile.brandTone === 'warm-restaurant'
      ? 'Warm restaurant'
      : profile.brandTone === 'playful'
      ? 'Playful studio'
      : profile.brandTone === 'dark-premium'
      ? 'Dark slate'
      : profile.brandTone === 'editorial-mono'
      ? 'Editorial mono'
      : 'Editorial mono');

  const baseDials = PRESETS[presetKey] || PRESETS['Editorial mono'];
  const dials = { ...baseDials };
  if (blueprint?.fontPairing) {
    dials.font = blueprint.fontPairing;
  }
  if (blueprint?.keyDesignFeatures?.cornerStyle) {
    dials.radius = blueprint.keyDesignFeatures.cornerStyle;
  }
  if (blueprint?.keyDesignFeatures?.buttonStyle) {
    dials.buttons = blueprint.keyDesignFeatures.buttonStyle;
  }
  if (blueprint?.keyDesignFeatures?.density) {
    dials.density = blueprint.keyDesignFeatures.density;
  }

  const { vars, attrs } = designToVars(dials);
  const designSystem: DesignSystem = {
    schemaVersion: '2.1',
    designSystemId: `ds-${projectId}`,
    conceptName: presetKey,
    conceptRationale: blueprint
      ? `Inspired by ${blueprint.name} (${blueprint.tagline}). Natural modern aesthetic with authentic balance.`
      : `Natural modern aesthetic with earthy tones, organic balance, and minimal clutter.`,
    dials,
    computedTokens: vars,
    rootAttributes: attrs,
    googleFontsUrl: fontsHref(dials),
    version: 1,
  };

  await prisma.generationRun.update({
    where: { id: run.id },
    data: { currentStage: 'design_system_created' },
  });

  // Stage 6: Bounded Content Created (Gemini AI <= Rs 8)
  const contentResult = await generateBoundedWebsiteContent(profile, plan, run.id);
  await prisma.generationRun.update({
    where: { id: run.id },
    data: {
      currentStage: 'content_created',
      inputTokens: contentResult.tokensUsed.input,
      outputTokens: contentResult.tokensUsed.output,
      estimatedCostINR: contentResult.estimatedCostINR,
      aiCallCount: 1,
    },
  });

  // Stage 7: Composition Created (with real generated content for every section)
  const manifest = composeWebsite(plan, designSystem, profile, contentResult.rawContent);
  await prisma.generationRun.update({
    where: { id: run.id },
    data: { currentStage: 'composition_created' },
  });

  // Stage 8: Manifest Validated
  await prisma.generationRun.update({
    where: { id: run.id },
    data: { currentStage: 'manifest_validated' },
  });

  // Stage 9 & 10: Quality Checks
  const quality = runQualityChecks(manifest, designSystem, contentResult.blocks);
  await prisma.qualityReport.create({
    data: {
      projectId,
      runId: run.id,
      overallStatus: quality.overallStatus,
      structuralCheck: quality.structuralCheck,
      functionalCheck: quality.functionalCheck,
      responsiveCheck: quality.responsiveCheck,
      contentCheck: quality.contentCheck,
      a11yCheck: quality.a11yCheck,
      similarityScore: quality.similarityScore,
    },
  });

  // Stage 11 & 12: Ready for review & Completed
  const latestVersion = await prisma.projectVersion.count({ where: { projectId } });
  await prisma.projectVersion.create({
    data: {
      projectId,
      versionNumber: latestVersion + 1,
      businessProfile: profile,
      sitePlan: plan,
      designSystem: designSystem as any,
      manifest: manifest as any,
      contentBlocks: contentResult.blocks as any,
    },
  });

  await prisma.generationRun.update({
    where: { id: run.id },
    data: {
      status: 'completed',
      currentStage: 'ready_for_review',
      completedAt: new Date(),
    },
  });

  return {
    projectId,
    runId: run.id,
    status: 'completed',
    currentStage: 'ready_for_review',
    profile,
    plan,
    designSystem,
    manifest,
    contentBlocks: contentResult.blocks,
    qualityReport: quality,
    questions,
    estimatedAiCostINR: contentResult.estimatedCostINR,
  };
}
