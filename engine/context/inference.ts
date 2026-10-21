import { BusinessProfile } from '@/lib/schemas/business-profile.schema';
import { BUSINESS_TAXONOMY, CategoryGuidance } from './taxonomy';

export interface RawBriefInput {
  businessName: string;
  businessCategory: string;
  offeringsAndGoals: string;
  websiteOrDemoUrl?: string;
  referenceUrl?: string;
}

export function inferBusinessProfile(input: RawBriefInput): BusinessProfile {
  const name = input.businessName.trim();
  const rawCat = (input.businessCategory || '').toLowerCase();
  const text = (input.offeringsAndGoals || '').toLowerCase();
  const combined = `${rawCat} ${text}`;

  // Smart Category Matching Priority
  let matchedKey = 'general';

  // 1. E-Commerce / D2C / Retail / Online Shop / Products / D2D
  if (
    rawCat.includes('d2c') ||
    rawCat.includes('d2d') ||
    rawCat.includes('b2c') ||
    rawCat.includes('retail') ||
    rawCat.includes('ecom') ||
    rawCat.includes('commerce') ||
    rawCat.includes('shop') ||
    rawCat.includes('store') ||
    rawCat.includes('product') ||
    rawCat.includes('cloth') ||
    rawCat.includes('fashion') ||
    rawCat.includes('apparel') ||
    rawCat.includes('merch') ||
    rawCat.includes('goods') ||
    rawCat.includes('cosmetic') ||
    text.includes('cart') ||
    text.includes('checkout') ||
    text.includes('online store') ||
    text.includes('ecommerce') ||
    text.includes('e-commerce') ||
    text.includes('sell products') ||
    text.includes('buy online')
  ) {
    matchedKey = 'd2c';
  }
  // 2. Healthcare & Clinic (Requires explicit medical/dental/clinical terms)
  else if (
    rawCat.includes('clinic') ||
    rawCat.includes('dental') ||
    rawCat.includes('dentist') ||
    rawCat.includes('doctor') ||
    rawCat.includes('hospital') ||
    rawCat.includes('medical') ||
    rawCat.includes('physio') ||
    rawCat.includes('psychol') ||
    rawCat.includes('patient') ||
    rawCat.includes('healthcare') ||
    (rawCat.includes('health') && !rawCat.includes('snack') && !rawCat.includes('food')) ||
    text.includes('patient care') ||
    text.includes('dental treatment') ||
    text.includes('clinic visit')
  ) {
    matchedKey = 'clinic';
  }
  // 3. Restaurant & Dining & Hospitality
  else if (
    rawCat.includes('restaur') ||
    rawCat.includes('food') ||
    rawCat.includes('cafe') ||
    rawCat.includes('dining') ||
    rawCat.includes('bistro') ||
    rawCat.includes('bakery') ||
    rawCat.includes('pizza') ||
    rawCat.includes('coffee') ||
    text.includes('menu') ||
    text.includes('reservation') ||
    text.includes('dish') ||
    text.includes('table')
  ) {
    matchedKey = 'restaurant';
  }
  // 4. Real Estate & Properties
  else if (
    rawCat.includes('real estate') ||
    rawCat.includes('propert') ||
    rawCat.includes('realty') ||
    rawCat.includes('broker') ||
    text.includes('floor plan') ||
    text.includes('listing') ||
    text.includes('apartment')
  ) {
    matchedKey = 'realestate';
  }
  // 5. Fitness & Movement Studio
  else if (
    rawCat.includes('fitness') ||
    rawCat.includes('gym') ||
    rawCat.includes('yoga') ||
    rawCat.includes('pilates') ||
    rawCat.includes('workout') ||
    text.includes('class schedule') ||
    text.includes('membership')
  ) {
    matchedKey = 'fitness';
  }
  // 6. Creative Studio & Agency
  else if (
    rawCat.includes('agency') ||
    rawCat.includes('studio') ||
    rawCat.includes('design') ||
    rawCat.includes('creative') ||
    rawCat.includes('branding') ||
    text.includes('portfolio') ||
    text.includes('case studies')
  ) {
    matchedKey = 'agency';
  }
  // 7. Consulting & Professional Services
  else if (
    rawCat.includes('consult') ||
    rawCat.includes('advis') ||
    rawCat.includes('law') ||
    rawCat.includes('legal') ||
    rawCat.includes('financ') ||
    rawCat.includes('accounting') ||
    rawCat.includes('corporate')
  ) {
    matchedKey = 'consulting';
  }

  const guidance: CategoryGuidance = BUSINESS_TAXONOMY[matchedKey] || BUSINESS_TAXONOMY.general;

  // Extract offerings from natural language text
  const extractedOfferings: string[] = [];
  const parts = input.offeringsAndGoals
    .split(/[,;\n\.]| and | including /i)
    .map((s) => s.trim())
    .filter((s) => s.length >= 3 && s.length <= 70);

  if (parts.length > 0) {
    parts.slice(0, 5).forEach((p) => {
      // Clean leading verbs or filler words
      const cleaned = p.replace(/^(we offer|we provide|we sell|our services include|our products include|such as|for example)\s+/i, '');
      if (cleaned.length > 3) extractedOfferings.push(cleaned.charAt(0).toUpperCase() + cleaned.slice(1));
    });
  }

  if (extractedOfferings.length === 0) {
    extractedOfferings.push(...guidance.subcategories.slice(0, 3));
  }

  // Derive primary goal and conversion
  let primaryGoal = `Showcase ${guidance.category} and drive customer engagement`;
  if (matchedKey === 'd2c') {
    primaryGoal = 'Showcase collections, build brand trust, and drive direct online product purchases';
  } else if (matchedKey === 'clinic') {
    primaryGoal = 'Provide clear healthcare information and schedule patient consultations';
  } else if (matchedKey === 'restaurant') {
    primaryGoal = 'Highlight menu offerings, culinary story, and drive table reservations';
  } else if (matchedKey === 'agency' || matchedKey === 'consulting') {
    primaryGoal = 'Demonstrate proven expertise and generate high-value client inquiries';
  }

  // Derive dynamic brand tone based on category and style keywords
  let selectedTone = guidance.recommendedTone;
  if (
    text.includes('luxury') ||
    text.includes('premium') ||
    text.includes('minimalist') ||
    text.includes('couture') ||
    text.includes('jewelry') ||
    text.includes('high-end') ||
    text.includes('architect')
  ) {
    selectedTone = 'quiet-luxury';
  } else if (
    text.includes('restaurant') ||
    text.includes('cafe') ||
    text.includes('dining') ||
    text.includes('bistro') ||
    text.includes('bakery') ||
    text.includes('coffee') ||
    text.includes('food') ||
    text.includes('eatery')
  ) {
    selectedTone = 'warm-restaurant';
  } else if (
    text.includes('dark') ||
    text.includes('night') ||
    text.includes('black') ||
    text.includes('slate') ||
    text.includes('obsidian') ||
    text.includes('cocktail') ||
    text.includes('lounge')
  ) {
    selectedTone = 'dark-premium';
  } else if (
    text.includes('tech') ||
    text.includes('software') ||
    text.includes('studio') ||
    text.includes('creative') ||
    text.includes('agency') ||
    text.includes('branding')
  ) {
    selectedTone = 'playful';
  } else if (
    text.includes('corporate') ||
    text.includes('consult') ||
    text.includes('legal') ||
    text.includes('law') ||
    text.includes('finance') ||
    text.includes('advisory')
  ) {
    selectedTone = 'corporate-navy';
  } else if (
    text.includes('eco') ||
    text.includes('organic') ||
    text.includes('green') ||
    text.includes('nature') ||
    text.includes('botanical') ||
    text.includes('sustainable') ||
    text.includes('fitness') ||
    text.includes('yoga')
  ) {
    selectedTone = 'fresh-green';
  } else if (
    text.includes('dental') ||
    text.includes('clinic') ||
    text.includes('doctor') ||
    text.includes('medical') ||
    text.includes('physio')
  ) {
    selectedTone = 'warm-clinic';
  }

  const assumptions = [
    {
      id: 'assump-tone',
      field: 'brandTone',
      value: selectedTone,
      confidence: 0.92,
      evidence: `Derived from ${guidance.category} and stylistic brief cues`,
      riskIfIncorrect: 'low' as const,
      requiresConfirmation: false,
    },
    {
      id: 'assump-conversion',
      field: 'primaryConversion',
      value: guidance.primaryConversion,
      confidence: 0.9,
      evidence: `Standard customer conversion action for ${guidance.category}`,
      riskIfIncorrect: 'medium' as const,
      requiresConfirmation: false,
    },
  ];

  const now = new Date().toISOString();

  return {
    schemaVersion: '2.1',
    businessName: name,
    businessCategory: guidance.category,
    subcategory: guidance.subcategories[0] || 'General',
    offerings: extractedOfferings,
    primaryGoal,
    primaryConversion: guidance.primaryConversion,
    audience: guidance.audienceArchetypes,
    brandTone: selectedTone as any,
    requiredPages: guidance.defaultPages,
    requiredFeatures: guidance.essentialPieces,
    confirmedFacts: {
      businessName: name,
      providedCategory: input.businessCategory,
      briefSummary: input.offeringsAndGoals,
      websiteOrDemoUrl: input.websiteOrDemoUrl || null,
      referenceUrl: input.referenceUrl || null,
    },
    assumptions,
    openQuestions: [],
    confidenceByField: {
      businessName: 1.0,
      businessCategory: 0.95,
      offerings: 0.9,
      primaryGoal: 0.92,
      brandTone: 0.94,
    },
    createdAt: now,
    updatedAt: now,
  };
}
