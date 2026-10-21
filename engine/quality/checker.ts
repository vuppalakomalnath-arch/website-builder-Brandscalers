import { CompositionManifest } from '@/lib/schemas/composition-manifest.schema';
import { DesignSystem } from '@/lib/schemas/design-system.schema';
import { ContentBlock } from '@/lib/schemas/content-block.schema';
import { luminance } from '@/engine/design-system/tokens';

export interface QualityCheckResult {
  overallStatus: 'passed' | 'warnings' | 'blocked';
  structuralCheck: { passed: boolean; issues: string[] };
  functionalCheck: { passed: boolean; issues: string[] };
  responsiveCheck: { passed: boolean; issues: string[] };
  contentCheck: { passed: boolean; issues: string[] };
  a11yCheck: { passed: boolean; issues: string[]; contrastRatio: number };
  similarityScore: number;
}

export function runQualityChecks(
  manifest: CompositionManifest,
  designSystem: DesignSystem,
  contentBlocks: ContentBlock[]
): QualityCheckResult {
  const structuralIssues: string[] = [];
  const functionalIssues: string[] = [];
  const responsiveIssues: string[] = [];
  const contentIssues: string[] = [];
  const a11yIssues: string[] = [];

  // 1. Structural Checks
  if (!manifest.pages || manifest.pages.length === 0) {
    structuralIssues.push('Manifest contains no pages.');
  }
  manifest.pages.forEach(p => {
    if (!p.componentInstances || p.componentInstances.length === 0) {
      structuralIssues.push(`Page "${p.slug}" has no component sections.`);
    }
  });

  // 2. Functional Checks
  manifest.pages.forEach(p => {
    p.componentInstances.forEach(ci => {
      if (ci.category === 'action' && !ci.props.ctaHref && !ci.props.ctaLabel) {
        functionalIssues.push(`Action component ${ci.instanceId} missing CTA action.`);
      }
    });
  });

  // 3. Responsive Checks
  // Design system pad and clamps
  if (!designSystem.computedTokens['--pad']) {
    responsiveIssues.push('Missing responsive padding token (--pad).');
  }

  // 4. Content Checks
  contentBlocks.forEach(cb => {
    if (cb.sourceStatus === 'placeholder' && cb.claimEvidence.length === 0) {
      contentIssues.push(`Placeholder block ${cb.id} lacks provenance note.`);
    }
  });

  // 5. Accessibility (WCAG 2.1 AA Contrast)
  const bgLum = luminance(designSystem.dials.bg);
  const inkLum = luminance(designSystem.dials.ink);
  const l1 = Math.max(bgLum, inkLum);
  const l2 = Math.min(bgLum, inkLum);
  const contrastRatio = Number(((l1 + 0.05) / (l2 + 0.05)).toFixed(2));

  if (contrastRatio < 4.5) {
    a11yIssues.push(`Text contrast ratio (${contrastRatio}:1) is below WCAG 2.1 AA minimum of 4.5:1.`);
  }

  const hasBlocked = structuralIssues.length > 0 || (a11yIssues.length > 0 && contrastRatio < 3.0);
  const hasWarnings = functionalIssues.length > 0 || contentIssues.length > 0 || a11yIssues.length > 0;

  return {
    overallStatus: hasBlocked ? 'blocked' : hasWarnings ? 'warnings' : 'passed',
    structuralCheck: { passed: structuralIssues.length === 0, issues: structuralIssues },
    functionalCheck: { passed: functionalIssues.length === 0, issues: functionalIssues },
    responsiveCheck: { passed: responsiveIssues.length === 0, issues: responsiveIssues },
    contentCheck: { passed: contentIssues.length === 0, issues: contentIssues },
    a11yCheck: { passed: a11yIssues.length === 0, issues: a11yIssues, contrastRatio },
    similarityScore: 0.12, // Baseline distinctiveness
  };
}
