/**
 * Benchmark Reference Websites Catalog & Blueprints
 * 
 * Provides curated reference websites for different business categories.
 * When a user selects a reference (or hasn't provided one), these blueprints
 * define what made that benchmark work: design library styles, component placement,
 * typography, and conversion flow.
 */

export interface BenchmarkWebsite {
  id: string;
  name: string;
  category: string;
  url: string;
  tagline: string;
  aestheticTone: string;
  presetKey: string;
  fontPairing: string;
  whyItWorks: string[];
  keyDesignFeatures: {
    palette: string;
    cornerStyle: string;
    buttonStyle: string;
    heroVariant: string;
    density: string;
  };
  componentPlacementOrder: string[];
  variantOverrides: Record<string, string>;
}

export const BENCHMARK_WEBSITES: BenchmarkWebsite[] = [
  // 1. D2C / Retail / E-commerce
  {
    id: 'aesop-quiet-luxury',
    name: 'Aesop Botanical Archetype',
    category: 'd2c',
    url: 'https://aesop.com',
    tagline: 'Artisanal minimalism with warm mineral tones and literary editorial pacing',
    aestheticTone: 'quiet-luxury',
    presetKey: 'Quiet luxury',
    fontPairing: 'cormorant-jost',
    whyItWorks: [
      'Split-screen hero with generous breathing room and muted photography',
      'Horizontal craft ingredient rows highlighting organic materials',
      'Editorial pull-quote testimonials without loud commercial badges',
      'High-contrast minimalist newsletter bar with subtle VIP incentive',
    ],
    keyDesignFeatures: {
      palette: 'Sandstone, warm terracotta, dark espresso ink',
      cornerStyle: 'soft',
      buttonStyle: 'outline',
      heroVariant: 'split',
      density: 'airy',
    },
    componentPlacementOrder: [
      'p-frame-header',
      'p-opener-hero',
      'p-offer-category-tiles',
      'p-offer-product-grid',
      'p-offer-feature-rows',
      'p-trust-testimonials',
      'p-action-newsletter',
      'p-frame-footer',
    ],
    variantOverrides: {
      'p-frame-header': 'transparent',
      'p-opener-hero': 'split',
      'p-offer-category-tiles': 'mosaic',
      'p-offer-product-grid': '3-col',
      'p-offer-feature-rows': 'text-left-image-right',
      'p-trust-testimonials': 'single',
      'p-action-newsletter': 'banner',
      'p-frame-footer': 'minimal',
    },
  },

  // 2. SaaS / Tech / Software / Agency
  {
    id: 'linear-modern-precision',
    name: 'Linear Precision Archetype',
    category: 'saas',
    url: 'https://linear.app',
    tagline: 'Ultra-crisp dark slate typography, bento-box feature grids, and razor-sharp clarity',
    aestheticTone: 'dark-premium',
    presetKey: 'Dark slate',
    fontPairing: 'inter',
    whyItWorks: [
      'Centered punchy hero with dark ambient overlay and glowing CTA button',
      'Infinite marquee of client logos and technology partners',
      'Bento grid cards breaking down core offerings with instant visual tags',
      'Interactive FAQ accordion addressing buyer friction before checkout',
    ],
    keyDesignFeatures: {
      palette: 'Deep slate, subtle limestone borders, electric cyan accent',
      cornerStyle: 'rounded',
      buttonStyle: 'solid',
      heroVariant: 'dark-overlay',
      density: 'balanced',
    },
    componentPlacementOrder: [
      'p-frame-header',
      'p-opener-hero',
      'p-media-marquee',
      'p-offer-services-grid',
      'p-trust-numbers',
      'p-trust-case-studies',
      'p-answer-faq',
      'p-action-contact-form',
      'p-frame-footer',
    ],
    variantOverrides: {
      'p-frame-header': 'sticky-compact',
      'p-opener-hero': 'dark-overlay',
      'p-media-marquee': 'logos',
      'p-offer-services-grid': '3-col',
      'p-trust-numbers': 'counter-row',
      'p-trust-case-studies': 'cards',
      'p-answer-faq': 'accordion',
      'p-action-contact-form': 'short',
      'p-frame-footer': 'columns',
    },
  },

  // 3. Restaurant / Dining / Cafe
  {
    id: 'eleven-madison-culinary',
    name: 'Eleven Madison Dining Archetype',
    category: 'restaurant',
    url: 'https://elevenmadisonpark.com',
    tagline: 'Warm terracotta ambience with centered chef storytelling and instant table reservation',
    aestheticTone: 'warm-restaurant',
    presetKey: 'Warm restaurant',
    fontPairing: 'dmserif-dmsans',
    whyItWorks: [
      'Centered serif typography with immediate reservation prompt',
      'Seasonal course highlight tabs with dietary and ingredient tags',
      'Chef story visual narrative building intimacy and culinary pedigree',
      'Prominent opening hours, address card, and table booking modal',
    ],
    keyDesignFeatures: {
      palette: 'Warm clay, bone cream background, roasted terracotta accent',
      cornerStyle: 'soft',
      buttonStyle: 'pill',
      heroVariant: 'centered',
      density: 'airy',
    },
    componentPlacementOrder: [
      'p-frame-header',
      'p-opener-hero',
      'p-vertical-restaurant-menu-by-category',
      'p-vertical-restaurant-chef-story',
      'p-vertical-restaurant-reservation',
      'p-action-location-hours',
      'p-trust-testimonials',
      'p-frame-footer',
    ],
    variantOverrides: {
      'p-frame-header': 'centered-logo',
      'p-opener-hero': 'centered',
      'p-vertical-restaurant-menu-by-category': 'tabs',
      'p-vertical-restaurant-chef-story': 'photo-left',
      'p-vertical-restaurant-reservation': 'form',
      'p-action-location-hours': 'split-with-map',
      'p-trust-testimonials': 'single',
      'p-frame-footer': 'minimal',
    },
  },

  // 4. Fitness / Yoga / Movement
  {
    id: 'equinox-movement-club',
    name: 'Equinox Kinetic Club Archetype',
    category: 'fitness',
    url: 'https://equinox.com',
    tagline: 'High-energy organic green tones, dynamic class timetable, and tiered club memberships',
    aestheticTone: 'fresh-green',
    presetKey: 'Fresh green',
    fontPairing: 'poppins',
    whyItWorks: [
      'Split hero with trial class reservation pass and coach credentials',
      'Interactive weekly class timetable with morning/evening filter tabs',
      'Tiered membership comparison cards highlighting club amenities',
      'Customer transformation proof grid with verified member quotes',
    ],
    keyDesignFeatures: {
      palette: 'Forest pine, sage leaf background, vibrant lime accent',
      cornerStyle: 'rounded',
      buttonStyle: 'pill',
      heroVariant: 'with-booking',
      density: 'balanced',
    },
    componentPlacementOrder: [
      'p-frame-header',
      'p-opener-hero',
      'p-vertical-fitness-class-schedule',
      'p-vertical-fitness-membership',
      'p-trust-testimonials',
      'p-answer-faq',
      'p-action-newsletter',
      'p-frame-footer',
    ],
    variantOverrides: {
      'p-frame-header': 'classic',
      'p-opener-hero': 'with-booking',
      'p-vertical-fitness-class-schedule': 'table',
      'p-vertical-fitness-membership': 'cards',
      'p-trust-testimonials': 'grid',
      'p-answer-faq': 'cards',
      'p-action-newsletter': 'popup',
      'p-frame-footer': 'columns',
    },
  },

  // 5. Healthcare / Clinic / Dental
  {
    id: 'maven-clinic-modern',
    name: 'Maven Health & Dental Archetype',
    category: 'clinic',
    url: 'https://mavenclinic.com',
    tagline: 'Warm reassuring clinic tones, practitioner spotlight, and structured patient journey',
    aestheticTone: 'warm-clinic',
    presetKey: 'Warm clinic',
    fontPairing: 'outfit',
    whyItWorks: [
      'Reassuring hero with emergency booking slots and insurance badges',
      'Lead practitioner credentials card and medical certifications',
      '3-step patient journey timeline demystifying consultations',
      'Comprehensive FAQ cards reducing patient anxiety before visit',
    ],
    keyDesignFeatures: {
      palette: 'Limestone white, soft warm taupe surface, calming terracotta accent',
      cornerStyle: 'rounded',
      buttonStyle: 'solid',
      heroVariant: 'split',
      density: 'balanced',
    },
    componentPlacementOrder: [
      'p-frame-header',
      'p-opener-hero',
      'p-offer-services-grid',
      'p-vertical-clinic-doctor-profile',
      'p-vertical-clinic-patient-journey',
      'p-trust-testimonials',
      'p-answer-faq',
      'p-action-appointment-request',
      'p-frame-footer',
    ],
    variantOverrides: {
      'p-frame-header': 'classic',
      'p-opener-hero': 'split',
      'p-offer-services-grid': '3-col',
      'p-vertical-clinic-doctor-profile': 'photo-card',
      'p-vertical-clinic-patient-journey': 'timeline',
      'p-trust-testimonials': 'carousel',
      'p-answer-faq': 'accordion',
      'p-action-appointment-request': 'calendar-picker',
      'p-frame-footer': 'columns',
    },
  },

  // 6. Real Estate / Architecture
  {
    id: 'the-agency-luxury-realty',
    name: 'The Agency Architectural Archetype',
    category: 'realestate',
    url: 'https://theagencyre.com',
    tagline: 'Architectural prestige with cinematic property listings and private viewing inquiries',
    aestheticTone: 'quiet-luxury',
    presetKey: 'Quiet luxury',
    fontPairing: 'cormorant-jost',
    whyItWorks: [
      'Cinematic full-width visual banner hero with location search filter',
      'High-resolution property cards with bed/bath/sqft and price tags',
      'Curated residence amenities checklist (pool, private elevator, concierge)',
      'Direct broker inquiry form with side-by-side agency credentials',
    ],
    keyDesignFeatures: {
      palette: 'Warm marble, sandstone surface, deep espresso ink',
      cornerStyle: 'sharp',
      buttonStyle: 'outline',
      heroVariant: 'fullscreen-image',
      density: 'airy',
    },
    componentPlacementOrder: [
      'p-frame-header',
      'p-opener-hero',
      'p-vertical-realestate-listing-card',
      'p-vertical-realestate-amenities',
      'p-media-photo-wall',
      'p-trust-testimonials',
      'p-action-contact-form',
      'p-frame-footer',
    ],
    variantOverrides: {
      'p-frame-header': 'transparent',
      'p-opener-hero': 'fullscreen-image',
      'p-vertical-realestate-listing-card': 'card',
      'p-vertical-realestate-amenities': 'grid',
      'p-media-photo-wall': '3-across',
      'p-trust-testimonials': 'single',
      'p-action-contact-form': 'with-side-info',
      'p-frame-footer': 'minimal',
    },
  },

  // 7. Creative Studio / Design Agency
  {
    id: 'pentagram-editorial-studio',
    name: 'Pentagram Editorial Studio Archetype',
    category: 'agency',
    url: 'https://pentagram.com',
    tagline: 'Bold monochrome typography, expansive case study showcases, and metric milestones',
    aestheticTone: 'editorial-mono',
    presetKey: 'Editorial mono',
    fontPairing: 'fraunces-outfit',
    whyItWorks: [
      'Expansive typographic hero stating agency philosophy and client impacts',
      'Selected case studies showcase with client industry tags and outcome metrics',
      'Visual process methodology breaking down strategic and creative phases',
      'Quick consultation request form with WhatsApp instant reachout option',
    ],
    keyDesignFeatures: {
      palette: 'Crisp paper white, pitch ink typography, minimal stone borders',
      cornerStyle: 'sharp',
      buttonStyle: 'solid',
      heroVariant: 'centered',
      density: 'airy',
    },
    componentPlacementOrder: [
      'p-frame-header',
      'p-opener-hero',
      'p-media-marquee',
      'p-trust-case-studies',
      'p-vertical-services-methodology',
      'p-trust-numbers',
      'p-action-whatsapp-card',
      'p-action-contact-form',
      'p-frame-footer',
    ],
    variantOverrides: {
      'p-frame-header': 'split',
      'p-opener-hero': 'centered',
      'p-media-marquee': 'words',
      'p-trust-case-studies': 'cards',
      'p-vertical-services-methodology': 'visual-diagram',
      'p-trust-numbers': 'big-number',
      'p-action-whatsapp-card': 'card',
      'p-action-contact-form': 'detailed',
      'p-frame-footer': 'columns',
    },
  },
];

/**
 * Suggests benchmark websites tailored to the inferred business category
 */
export function getSuggestedBenchmarks(businessCategory?: string): {
  recommended: BenchmarkWebsite;
  alternatives: BenchmarkWebsite[];
} {
  const cat = (businessCategory || '').toLowerCase();

  let matchId = 'aesop-quiet-luxury';
  if (cat.includes('d2c') || cat.includes('d2d') || cat.includes('retail') || cat.includes('ecom') || cat.includes('cloth') || cat.includes('product') || cat.includes('shop')) {
    matchId = 'aesop-quiet-luxury';
  } else if (cat.includes('saas') || cat.includes('tech') || cat.includes('software') || cat.includes('app')) {
    matchId = 'linear-modern-precision';
  } else if (cat.includes('restaur') || cat.includes('food') || cat.includes('cafe') || cat.includes('dining') || cat.includes('coffee') || cat.includes('bakery')) {
    matchId = 'eleven-madison-culinary';
  } else if (cat.includes('fitness') || cat.includes('gym') || cat.includes('yoga') || cat.includes('workout') || cat.includes('pilates')) {
    matchId = 'equinox-movement-club';
  } else if (cat.includes('clinic') || cat.includes('dental') || cat.includes('doctor') || cat.includes('hospital') || cat.includes('medical') || cat.includes('healthcare')) {
    matchId = 'maven-clinic-modern';
  } else if (cat.includes('real estate') || cat.includes('propert') || cat.includes('realty') || cat.includes('arch')) {
    matchId = 'the-agency-luxury-realty';
  } else if (cat.includes('agency') || cat.includes('studio') || cat.includes('creative') || cat.includes('design') || cat.includes('branding')) {
    matchId = 'pentagram-editorial-studio';
  } else {
    matchId = 'aesop-quiet-luxury';
  }

  const recommended = BENCHMARK_WEBSITES.find((b) => b.id === matchId) || BENCHMARK_WEBSITES[0];
  const alternatives = BENCHMARK_WEBSITES.filter((b) => b.id !== recommended.id);

  return { recommended, alternatives };
}
