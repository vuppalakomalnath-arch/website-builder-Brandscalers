import crypto from 'crypto';
import { CompositionManifest } from '@/lib/schemas/composition-manifest.schema';

export interface FingerprintDimensions {
  variantSequence: string[];
  categorySequence: string[];
  fontPair: string;
  paletteSignature: string;
  density: string;
  radius: string;
}

export function extractDimensions(manifest: CompositionManifest, designDials?: any): FingerprintDimensions {
  const variantSequence: string[] = [];
  const categorySequence: string[] = [];

  manifest.pages.forEach(p => {
    p.componentInstances.forEach(ci => {
      variantSequence.push(`${ci.pieceId}:${ci.variantName}`);
      categorySequence.push(ci.category);
    });
  });

  return {
    variantSequence,
    categorySequence,
    fontPair: designDials?.font || 'figtree',
    paletteSignature: `${designDials?.accent || ''}_${designDials?.bg || ''}_${designDials?.surface || ''}`,
    density: designDials?.density || 'balanced',
    radius: designDials?.radius || 'soft',
  };
}

export function computeCompositionFingerprint(manifest: CompositionManifest, designDials?: any): string {
  const dims = extractDimensions(manifest, designDials);
  const rawString = JSON.stringify(dims);
  return crypto.createHash('sha256').update(rawString).digest('hex');
}

/**
 * Calculates similarity score (0.0 to 1.0) between two composition manifests.
 */
export function calculateSimilarity(m1: CompositionManifest, m2: CompositionManifest): number {
  if (m1.compositionFingerprint === m2.compositionFingerprint) return 1.0;

  let totalPoints = 0;
  let matchedPoints = 0;

  const v1 = m1.pages.flatMap(p => p.componentInstances.map(ci => `${ci.pieceId}:${ci.variantName}`));
  const v2 = m2.pages.flatMap(p => p.componentInstances.map(ci => `${ci.pieceId}:${ci.variantName}`));

  const maxLen = Math.max(v1.length, v2.length);
  if (maxLen > 0) {
    totalPoints += 50;
    let commonVariants = 0;
    v1.forEach((val, idx) => {
      if (v2[idx] === val) commonVariants++;
    });
    matchedPoints += (commonVariants / maxLen) * 50;
  }

  // Design seed
  totalPoints += 50;
  if (m1.compositionSeed === m2.compositionSeed) {
    matchedPoints += 50;
  }

  return totalPoints > 0 ? matchedPoints / totalPoints : 0;
}
