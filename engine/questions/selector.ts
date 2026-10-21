import { BusinessProfile, OpenQuestion } from '@/lib/schemas/business-profile.schema';

export function selectAdaptiveQuestions(profile: BusinessProfile): OpenQuestion[] {
  const questions: OpenQuestion[] = [];

  // Check 1: Is conversion goal ambiguous?
  // If conversion is lead generation vs online booking, it significantly impacts the Action piece selection.
  if (!profile.confirmedFacts.conversionMethodSpecified && profile.businessCategory.includes('Healthcare') || profile.businessCategory.includes('Clinic')) {
    questions.push({
      id: 'q-appointment-preference',
      question: 'How should prospective patients book their visits?',
      reason: 'Determines whether to render a multi-step calendar booking stepper or a streamlined callback request form.',
      impactDimension: 'conversion',
      expectedImpactScore: 0.85,
      options: [
        'Direct online appointment booking with time slots',
        'Simple request form for staff callback',
        'WhatsApp / direct telephone inquiry',
      ],
      resolved: false,
    });
  } else if (!profile.confirmedFacts.locationSpecified && (profile.businessCategory.includes('Dining') || profile.businessCategory.includes('Salon'))) {
    questions.push({
      id: 'q-physical-location',
      question: 'Do you operate a physical storefront that visitors will navigate to?',
      reason: 'Influences whether an interactive map, opening hours table, and parking directions should be highlighted on the homepage.',
      impactDimension: 'sitemap',
      expectedImpactScore: 0.78,
      options: [
        'Yes, we welcome walk-ins and local visitors with set opening hours',
        'By appointment only',
        'We operate online / mobile across the region',
      ],
      resolved: false,
    });
  }

  // Sort by expected impact score descending and take the single highest-impact question (max 1)
  questions.sort((a, b) => b.expectedImpactScore - a.expectedImpactScore);
  return questions.slice(0, 1);
}
