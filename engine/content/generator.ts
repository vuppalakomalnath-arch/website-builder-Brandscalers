import { BusinessProfile } from '@/lib/schemas/business-profile.schema';
import { SitePlan } from '@/lib/schemas/site-plan.schema';
import { ContentBlock } from '@/lib/schemas/content-block.schema';
import { GeminiAdapter } from '@/server/gemini/adapter';

export interface GeneratedContentPack {
  blocks: ContentBlock[];
  rawContent: Record<string, any>;
  tokensUsed: { input: number; output: number };
  estimatedCostINR: number;
}

export async function generateBoundedWebsiteContent(
  profile: BusinessProfile,
  plan: SitePlan,
  runId: string
): Promise<GeneratedContentPack> {
  const isD2C =
    profile.businessCategory.toLowerCase().includes('d2c') ||
    profile.businessCategory.toLowerCase().includes('d2d') ||
    profile.businessCategory.toLowerCase().includes('retail') ||
    profile.businessCategory.toLowerCase().includes('e-com') ||
    profile.businessCategory.toLowerCase().includes('commerce') ||
    profile.businessCategory.toLowerCase().includes('shop') ||
    profile.businessCategory.toLowerCase().includes('store');

  const isClinic =
    profile.businessCategory.toLowerCase().includes('clinic') ||
    profile.businessCategory.toLowerCase().includes('dental') ||
    profile.businessCategory.toLowerCase().includes('doctor') ||
    profile.businessCategory.toLowerCase().includes('medical');

  const isRestaurant =
    profile.businessCategory.toLowerCase().includes('restaurant') ||
    profile.businessCategory.toLowerCase().includes('food') ||
    profile.businessCategory.toLowerCase().includes('bistro') ||
    profile.businessCategory.toLowerCase().includes('dining');

  const businessType = isD2C ? 'E-Commerce & Retail Brand' : isClinic ? 'Healthcare Clinic' : isRestaurant ? 'Restaurant & Hospitality' : 'Professional Enterprise';

  const prompt = `You are the specialized copywriting engine for Website Studio.
Write clean, modern, natural marketing copy for this business.
Avoid loud cliches, fake stats, or exaggerated superlatives.

Business Name: ${profile.businessName}
Category: ${profile.businessCategory} (${businessType})
Offerings: ${profile.offerings.join(', ')}
Primary Goal: ${profile.primaryGoal}
Tone: ${profile.brandTone}

Return a single JSON object with this exact shape:
{
  "heroHeadline": "string (punchy, natural, under 9 words)",
  "heroSubheading": "string (clear 1-2 sentence description of offerings and value proposition)",
  "primaryCta": "string (e.g. '${isD2C ? 'Shop New Collection' : isClinic ? 'Book an Appointment' : isRestaurant ? 'Reserve a Table' : 'Get in Touch'}')",
  "items": [
    {
      "title": "string (${isD2C ? 'product name' : isClinic ? 'treatment name' : isRestaurant ? 'dish name' : 'service name'})",
      "description": "string (1-2 sentences)",
      "badge": "string (e.g. '${isD2C ? '₹1,899' : isClinic ? 'Specialized' : isRestaurant ? 'Signature' : 'Popular'}')",
      "category": "string"
    },
    {
      "title": "string",
      "description": "string",
      "badge": "string",
      "category": "string"
    },
    {
      "title": "string",
      "description": "string",
      "badge": "string",
      "category": "string"
    },
    {
      "title": "string",
      "description": "string",
      "badge": "string",
      "category": "string"
    }
  ],
  "aboutHeadline": "string",
  "aboutStory": "string (2-3 sentences on brand mission, craftsmanship, or care philosophy)",
  "testimonials": [
    {
      "quote": "string (genuine, relatable feedback)",
      "author": "string",
      "role": "string"
    },
    {
      "quote": "string",
      "author": "string",
      "role": "string"
    }
  ],
  "faqs": [
    {
      "question": "string (${isD2C ? 'shipping/returns question' : isClinic ? 'appointment/consultation question' : 'general question'})",
      "answer": "string (helpful, reassuring response)"
    },
    {
      "question": "string (${isD2C ? 'product quality/care question' : isClinic ? 'first visit question' : 'general question'})",
      "answer": "string"
    },
    {
      "question": "string",
      "answer": "string"
    }
  ],
  "newsletter": {
    "headline": "string",
    "subheading": "string"
  }
}`;

  const deterministicFallback = () => {
    if (isD2C) {
      return {
        heroHeadline: `Thoughtfully Crafted Essentials by ${profile.businessName}`,
        heroSubheading: `Explore our signature collection of ${profile.offerings.slice(0, 3).join(', ')}. Designed with pure intent and sustainable craftsmanship.`,
        primaryCta: 'Shop the Collection',
        items: [
          {
            title: profile.offerings[0] || 'Signature Linen Tote',
            description: 'Handcrafted with organic heavyweight fibers and reinforced seams for everyday longevity.',
            badge: '₹1,999',
            category: 'Bestseller',
          },
          {
            title: profile.offerings[1] || 'Botanical Recovery Serum',
            description: 'Cold-pressed bioactive botanical oils formulated to nourish and restore deep hydration.',
            badge: '₹2,499',
            category: 'New Season',
          },
          {
            title: profile.offerings[2] || 'Ceramic Pourer & Cup Set',
            description: 'Locally thrown stoneware with a tactile matte glaze finish and heat-retaining clay.',
            badge: '₹1,450',
            category: 'Home & Living',
          },
          {
            title: profile.offerings[3] || 'Minimalist Daily Carryall',
            description: 'Structured silhouette featuring discreet magnetic enclosures and vegetable-tanned accents.',
            badge: '₹3,200',
            category: 'Limited Edition',
          },
        ],
        aboutHeadline: 'Rooted in Honesty and Material Purity',
        aboutStory: `At ${profile.businessName}, we believe everyday items should be durable, beautiful, and responsibly made. We collaborate directly with skilled artisans and prioritize zero-plastic, compostable packaging.`,
        testimonials: [
          {
            quote: `The quality of the craftsmanship and fabric exceeded my expectations. Arrived in two days in beautiful compostable packaging.`,
            author: 'Ananya Deshmukh',
            role: 'Verified Buyer & Architect',
          },
          {
            quote: `Subtle elegance without unnecessary frills. Easily my favorite daily carry item.`,
            author: 'Rohan Mehta',
            role: 'Design Director',
          },
        ],
        faqs: [
          {
            question: 'How fast is nationwide shipping?',
            answer: 'All orders are dispatched within 24 hours. Express metro delivery takes 2–3 business days with real-time tracking.',
          },
          {
            question: 'What is your return and exchange policy?',
            answer: 'We provide a hassle-free 30-day return and exchange window on all unused items in original packaging.',
          },
          {
            question: 'Where are your materials sourced?',
            answer: 'We source certified organic fibers and natural raw materials from accredited regional smallholders committed to fair wages.',
          },
        ],
        newsletter: {
          headline: 'Join Our Community for 15% Off',
          subheading: 'Subscribe to receive private seasonal collection previews, maker stories, and exclusive subscriber perks.',
        },
      };
    }

    if (isRestaurant) {
      return {
        heroHeadline: `Honest Flavors & Warm Hospitality at ${profile.businessName}`,
        heroSubheading: `A seasonal celebration of culinary craft. Featuring ${profile.offerings.slice(0, 3).join(', ')}.`,
        primaryCta: 'Reserve a Table',
        items: [
          {
            title: profile.offerings[0] || 'Handmade Sourdough & Whipped Butter',
            description: '36-hour slow fermented country loaf with sea salt and cultured dairy.',
            badge: 'Signature',
            category: 'Starters',
          },
          {
            title: profile.offerings[1] || 'Wood-Fired Truffle Tagliatelle',
            description: 'Fresh egg pasta with seasonal wild mushrooms, aged parmesan, and cracked pepper.',
            badge: 'Chef Choice',
            category: 'Mains',
          },
          {
            title: profile.offerings[2] || 'Organic Blood Orange Tart',
            description: 'Crisp butter pastry with citrus curd and caramelized pistachios.',
            badge: 'Desserts',
            category: 'Dolce',
          },
        ],
        aboutHeadline: 'From Soil to Table',
        aboutStory: `${profile.businessName} was founded on a simple premise: honoring ingredients through mindful preparation and creating an intimate space for memorable meals.`,
        testimonials: [
          {
            quote: 'An extraordinary dining experience where every dish tells a story of care and exceptional craft.',
            author: 'Priya Nambiar',
            role: 'Food Writer',
          },
        ],
        faqs: [
          {
            question: 'Do you accommodate dietary requirements?',
            answer: 'Yes, our kitchen provides dedicated gluten-free and vegan menus crafted with equal culinary dedication.',
          },
        ],
        newsletter: {
          headline: 'Reserve Your Evening',
          subheading: 'Subscribe for invitations to seasonal chef tasting menus and winemaker dinners.',
        },
      };
    }

    // Default Clinic / Healthcare / Professional
    return {
      heroHeadline: `Thoughtful, Attentive Healthcare at ${profile.businessName}`,
      heroSubheading: `Experience patient-centered care and specialized clinical expertise tailored around your comfort and health.`,
      primaryCta: profile.primaryConversion === 'appointment_request' ? 'Schedule an Appointment' : 'Send an Inquiry',
      items: profile.offerings.slice(0, 4).map((offering, i) => ({
        title: offering,
        description: 'Comprehensive, dedicated approach focused on gentle procedures and lasting health.',
        badge: `0${i + 1}`,
        category: 'Clinical Care',
      })),
      aboutHeadline: 'Caring for Minds and Bodies',
      aboutStory: `At ${profile.businessName}, our board-certified practitioners provide compassionate, evidence-based care in a calm, modern clinical environment.`,
      testimonials: [
        {
          quote: `The team at ${profile.businessName} made the entire experience seamless, calming, and reassuring from day one.`,
          author: 'S. Kulkarni',
          role: 'Patient',
        },
      ],
      faqs: [
        {
          question: 'How do I schedule an initial appointment?',
          answer: 'You can book directly through our online scheduler or call our desk to find a time that fits your schedule.',
        },
        {
          question: 'What should I expect during my first visit?',
          answer: 'We conduct a thorough, gentle consultation to understand your health history and tailor a personalized care plan.',
        },
      ],
      newsletter: {
        headline: 'Stay Informed on Health & Wellness',
        subheading: 'Receive monthly wellness guides, clinic updates, and preventative care tips.',
      },
    };
  };

  const aiResult = await GeminiAdapter.generateBoundedContent(
    {
      projectId: plan.projectId,
      runId,
      stage: 'content_created',
      prompt,
      systemInstruction: 'Respond only with valid, well-formed JSON conforming exactly to the requested schema.',
      promptVersion: 'v2.2-specialized',
    },
    deterministicFallback
  );

  const rawData = aiResult.data || deterministicFallback();
  const now = new Date().toISOString();
  const blocks: ContentBlock[] = [];

  // Hero headline
  blocks.push({
    id: 'block-hero-headline',
    type: 'headline',
    purpose: 'Hero primary title',
    content: rawData.heroHeadline || deterministicFallback().heroHeadline,
    sourceStatus: 'generated',
    locale: 'en',
    updatedAt: now,
    claimEvidence: [],
    assetRefs: [],
  });

  // Hero subhead
  blocks.push({
    id: 'block-hero-subheading',
    type: 'subheadline',
    purpose: 'Hero explanation',
    content: rawData.heroSubheading || deterministicFallback().heroSubheading,
    sourceStatus: 'generated',
    locale: 'en',
    updatedAt: now,
    claimEvidence: [],
    assetRefs: [],
  });

  // Hero CTA
  blocks.push({
    id: 'block-hero-cta',
    type: 'cta_label',
    purpose: 'Hero button',
    content: rawData.primaryCta || deterministicFallback().primaryCta,
    sourceStatus: 'generated',
    locale: 'en',
    updatedAt: now,
    claimEvidence: [],
    assetRefs: [],
  });

  // Items / Products / Services
  if (Array.isArray(rawData.items)) {
    rawData.items.forEach((item: any, idx: number) => {
      blocks.push({
        id: `block-item-${idx + 1}`,
        type: 'feature_card',
        purpose: `Catalog item ${idx + 1}`,
        content: JSON.stringify(item),
        sourceStatus: 'generated',
        locale: 'en',
        updatedAt: now,
        claimEvidence: [],
        assetRefs: [],
      });
    });
  }

  // About Story
  if (rawData.aboutStory) {
    blocks.push({
      id: 'block-about-story',
      type: 'body',
      purpose: 'About brand story',
      content: rawData.aboutStory,
      sourceStatus: 'generated',
      locale: 'en',
      updatedAt: now,
      claimEvidence: [],
      assetRefs: [],
    });
  }

  // Testimonials
  if (Array.isArray(rawData.testimonials)) {
    rawData.testimonials.forEach((t: any, idx: number) => {
      blocks.push({
        id: `block-testimonial-${idx + 1}`,
        type: 'testimonial',
        purpose: `Review quote ${idx + 1}`,
        content: JSON.stringify(t),
        sourceStatus: 'placeholder',
        locale: 'en',
        updatedAt: now,
        claimEvidence: ['Customer review demonstration; replaceable via visual editor.'],
        assetRefs: [],
      });
    });
  }

  // FAQs
  if (Array.isArray(rawData.faqs)) {
    rawData.faqs.forEach((f: any, idx: number) => {
      blocks.push({
        id: `block-faq-${idx + 1}`,
        type: 'faq_item',
        purpose: `FAQ question ${idx + 1}`,
        content: JSON.stringify(f),
        sourceStatus: 'generated',
        locale: 'en',
        updatedAt: now,
        claimEvidence: [],
        assetRefs: [],
      });
    });
  }

  return {
    blocks,
    rawContent: rawData,
    tokensUsed: { input: aiResult.inputTokens, output: aiResult.outputTokens },
    estimatedCostINR: aiResult.costINR,
  };
}
