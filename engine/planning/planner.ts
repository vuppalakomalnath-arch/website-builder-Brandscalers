import { BusinessProfile } from '@/lib/schemas/business-profile.schema';
import { PagePlan, SectionPlan, SitePlan, VisitorJourneyStep } from '@/lib/schemas/site-plan.schema';
import { BUSINESS_TAXONOMY } from '@/engine/context/taxonomy';

export function generateSitePlan(profile: BusinessProfile, projectId: string): SitePlan {
  // Determine primary category key
  let catKey = 'general';
  for (const [key, val] of Object.entries(BUSINESS_TAXONOMY)) {
    if (val.category === profile.businessCategory) {
      catKey = key;
      break;
    }
  }

  const isD2C = catKey === 'd2c' || profile.businessCategory.toLowerCase().includes('retail') || profile.businessCategory.toLowerCase().includes('e-com') || profile.businessCategory.toLowerCase().includes('d2d') || profile.businessCategory.toLowerCase().includes('d2c');
  const isClinic = catKey === 'clinic';
  const isRestaurant = catKey === 'restaurant';
  const isFitness = catKey === 'fitness' || profile.businessCategory.toLowerCase().includes('fitness') || profile.businessCategory.toLowerCase().includes('gym') || profile.businessCategory.toLowerCase().includes('yoga') || profile.businessCategory.toLowerCase().includes('pilates');
  const isAgency = !isFitness && (catKey === 'agency' || profile.businessCategory.toLowerCase().includes('agency') || profile.businessCategory.toLowerCase().includes('design') || profile.businessCategory.toLowerCase().includes('creative') || profile.businessCategory.toLowerCase().includes('studio'));
  const isConsulting = catKey === 'consulting' || profile.businessCategory.toLowerCase().includes('consult') || profile.businessCategory.toLowerCase().includes('advis') || profile.businessCategory.toLowerCase().includes('law');
  const isRealEstate = catKey === 'realestate' || profile.businessCategory.toLowerCase().includes('estate') || profile.businessCategory.toLowerCase().includes('propert');

  // Make sure all essential pages are included
  const pagesToGenerate = [...new Set(profile.requiredPages)];
  if (!pagesToGenerate.includes('home')) pagesToGenerate.unshift('home');
  if (!pagesToGenerate.includes('about')) pagesToGenerate.push('about');
  if (!pagesToGenerate.includes('faq')) pagesToGenerate.push('faq');
  if (!pagesToGenerate.includes('contact')) pagesToGenerate.push('contact');
  if (isD2C && !pagesToGenerate.includes('shop')) pagesToGenerate.splice(1, 0, 'shop');
  if ((isClinic || isConsulting) && !pagesToGenerate.includes('services')) pagesToGenerate.splice(1, 0, 'services');
  if (isRestaurant && !pagesToGenerate.includes('menu')) pagesToGenerate.splice(1, 0, 'menu');
  if (isAgency && !pagesToGenerate.includes('work')) pagesToGenerate.splice(1, 0, 'work');
  if (isFitness && !pagesToGenerate.includes('classes')) pagesToGenerate.splice(1, 0, 'classes');
  if (isRealEstate && !pagesToGenerate.includes('properties')) pagesToGenerate.splice(1, 0, 'properties');

  // 1. Navigation items
  const navigation = pagesToGenerate.map((pageSlug) => {
    let label = pageSlug.charAt(0).toUpperCase() + pageSlug.slice(1).replace('-', ' ');
    if (pageSlug === 'faq') label = 'FAQs';
    if (pageSlug === 'about') label = 'About Us';
    return {
      label,
      targetPage: pageSlug === 'home' ? '/' : `/${pageSlug}`,
    };
  });

  // 2. Build Page Plans for EVERY page
  const pagePlans: PagePlan[] = [];

  for (const slug of pagesToGenerate) {
    if (slug === 'home') {
      const homeSections: SectionPlan[] = [];

      // Hero
      homeSections.push({
        id: 'sec-hero',
        pieceId: 'p-opener-hero',
        category: 'opener',
        preferredVariant: isD2C ? 'split' : isClinic ? 'with-booking' : isRealEstate ? 'dark-overlay' : isAgency ? 'split' : 'split',
        purpose: isD2C
          ? 'Showcase signature collection, brand ethos, and direct shopping CTA.'
          : 'Establish clear value proposition, business identity, and primary call-to-action.',
        contentObjective: 'Hook visitor attention and communicate core value proposition immediately.',
        ctaDestination: isD2C ? '/shop' : isClinic ? '#book' : isRestaurant ? '/reservations' : isFitness ? '#trial' : '/contact',
      });

      // Primary Feature / Products / Services per Category
      if (isD2C) {
        homeSections.push({
          id: 'sec-featured-products',
          pieceId: 'p-offer-product-grid',
          category: 'offer',
          preferredVariant: '3-col',
          purpose: 'Highlight flagship bestsellers and new arrivals with instant pricing.',
          contentObjective: 'Display curated product catalog with ratings, prices, and fast add-to-cart.',
          ctaDestination: '/shop',
        });
        homeSections.push({
          id: 'sec-categories',
          pieceId: 'p-offer-category-tiles',
          category: 'offer',
          preferredVariant: 'equal-grid',
          purpose: 'Provide quick visual navigation across core product categories.',
          contentObjective: 'Encourage exploration of seasonal lines and essential collections.',
          ctaDestination: '/shop',
        });
        homeSections.push({
          id: 'sec-materials-craft',
          pieceId: 'p-offer-feature-rows',
          category: 'offer',
          preferredVariant: 'text-left-image-right',
          purpose: 'Communicate sustainable sourcing, craftsmanship, and uncompromised quality.',
          contentObjective: 'Differentiate brand through verifiable material integrity and design values.',
        });
      } else if (isClinic) {
        homeSections.push({
          id: 'sec-services',
          pieceId: 'p-offer-services-grid',
          category: 'offer',
          preferredVariant: 'icon-cards',
          purpose: 'Showcase specialized treatments and clinical specialties.',
          contentObjective: 'Help patients quickly find relevant care and consultations.',
          ctaDestination: '/services',
        });
        homeSections.push({
          id: 'sec-doctor-spotlight',
          pieceId: 'p-vertical-clinic-doctor-profile',
          category: 'vertical',
          preferredVariant: 'photo-card',
          purpose: 'Introduce senior clinicians, certifications, and approach to patient care.',
          contentObjective: 'Build immediate medical trust and practitioner credibility.',
          ctaDestination: '#book',
        });
        homeSections.push({
          id: 'sec-patient-journey',
          pieceId: 'p-vertical-clinic-patient-journey',
          category: 'vertical',
          preferredVariant: 'timeline',
          purpose: 'Outline patient clinical pathway from consultation to recovery.',
          contentObjective: 'Demystify treatment process and build calm confidence.',
        });
      } else if (isRestaurant) {
        homeSections.push({
          id: 'sec-menu-preview',
          pieceId: 'p-vertical-restaurant-menu-by-category',
          category: 'vertical',
          preferredVariant: 'tabs',
          purpose: 'Feature seasonal signature dishes and culinary highlights.',
          contentObjective: 'Stir appetite with high-contrast imagery and transparent descriptions.',
          ctaDestination: '/menu',
        });
        homeSections.push({
          id: 'sec-chef-story',
          pieceId: 'p-vertical-restaurant-chef-story',
          category: 'vertical',
          preferredVariant: 'photo-left',
          purpose: 'Share the chef narrative, culinary philosophy, and partner farms.',
          contentObjective: 'Communicate artisan provenance and hospitality values.',
        });
        homeSections.push({
          id: 'sec-location-hours',
          pieceId: 'p-action-location-hours',
          category: 'action',
          preferredVariant: 'split-with-map',
          purpose: 'Showcase dining location, kitchen hours, and arrival instructions.',
          contentObjective: 'Eliminate friction for guests visiting or reserving tables.',
        });
      } else if (isAgency) {
        homeSections.push({
          id: 'sec-portfolio',
          pieceId: 'p-trust-case-studies',
          category: 'trust',
          preferredVariant: 'cards',
          purpose: 'Featured studio portfolio case studies and brand transformations.',
          contentObjective: 'Demonstrate measurable caliber and creative authority.',
          ctaDestination: '/work',
        });
        homeSections.push({
          id: 'sec-marquee',
          pieceId: 'p-media-marquee',
          category: 'media',
          preferredVariant: 'logos',
          purpose: 'Client roster and partner logos across global industries.',
          contentObjective: 'Validate commercial credibility through recognized brand logos.',
        });
        homeSections.push({
          id: 'sec-stats',
          pieceId: 'p-trust-numbers',
          category: 'trust',
          preferredVariant: 'counter-row',
          purpose: 'Quantified impact metrics: launches, conversions, awards.',
          contentObjective: 'Solidify market differentiation with hard data.',
        });
      } else if (isFitness) {
        homeSections.push({
          id: 'sec-classes',
          pieceId: 'p-vertical-fitness-class-schedule',
          category: 'vertical',
          preferredVariant: 'table',
          purpose: 'Weekly movement schedule with session times and coach booking.',
          contentObjective: 'Facilitate frictionless trial reservations.',
          ctaDestination: '/classes',
        });
        homeSections.push({
          id: 'sec-membership',
          pieceId: 'p-vertical-fitness-membership',
          category: 'vertical',
          preferredVariant: 'cards',
          purpose: 'Transparent membership tiers with studio privileges and amenities.',
          contentObjective: 'Drive membership commitments.',
        });
      } else if (isRealEstate) {
        homeSections.push({
          id: 'sec-properties',
          pieceId: 'p-vertical-realestate-listing-card',
          category: 'vertical',
          preferredVariant: 'card',
          purpose: 'Showcase premium property inventory with specs and pricing.',
          contentObjective: 'Inspire private viewing appointments.',
          ctaDestination: '/properties',
        });
        homeSections.push({
          id: 'sec-amenities',
          pieceId: 'p-vertical-realestate-amenities',
          category: 'vertical',
          preferredVariant: 'grid',
          purpose: 'Highlight architectural details, concierge, and private gardens.',
          contentObjective: 'Communicate lifestyle caliber.',
        });
      } else if (isConsulting) {
        homeSections.push({
          id: 'sec-services',
          pieceId: 'p-offer-services-grid',
          category: 'offer',
          preferredVariant: 'icon-cards',
          purpose: 'Outline strategic advisory practices and capabilities.',
          contentObjective: 'Provide clear domain clarity for enterprise leaders.',
          ctaDestination: '/services',
        });
        homeSections.push({
          id: 'sec-methodology',
          pieceId: 'p-vertical-services-methodology',
          category: 'vertical',
          preferredVariant: 'steps',
          purpose: '4-stage engagement blueprint from diagnosis to continuous scaling.',
          contentObjective: 'Eliminate ambiguity and demonstrate rigorous methodology.',
        });
        homeSections.push({
          id: 'sec-stats',
          pieceId: 'p-trust-numbers',
          category: 'trust',
          preferredVariant: 'counter-row',
          purpose: 'Validated ROI metrics and enterprise transformation track record.',
          contentObjective: 'De-risk corporate hiring decisions.',
        });
      } else {
        homeSections.push({
          id: 'sec-services',
          pieceId: 'p-offer-services-grid',
          category: 'offer',
          preferredVariant: 'icon-cards',
          purpose: 'Showcase core offerings and high-value solutions.',
          contentObjective: 'Communicate client deliverables clearly.',
          ctaDestination: '/services',
        });
        homeSections.push({
          id: 'sec-features',
          pieceId: 'p-offer-feature-rows',
          category: 'offer',
          preferredVariant: 'text-left-image-right',
          purpose: 'Highlight core advantages and proven reliability.',
          contentObjective: 'Build immediate customer conviction.',
        });
      }

      // Social Proof / Testimonials
      homeSections.push({
        id: 'sec-testimonials',
        pieceId: 'p-trust-testimonials',
        category: 'trust',
        preferredVariant: isRealEstate ? 'single' : 'carousel',
        purpose: 'Real customer feedback, verified reviews, and ratings.',
        contentObjective: 'Eliminate hesitation through authentic testimonials and verified experiences.',
      });

      // Conversion Action per Category
      if (isD2C) {
        homeSections.push({
          id: 'sec-newsletter',
          pieceId: 'p-action-newsletter',
          category: 'action',
          preferredVariant: 'banner',
          purpose: 'Offer exclusive 15% discount for first-time orders via email newsletter.',
          contentObjective: 'Capture high-intent shopping subscribers for lifecycle retention.',
          ctaDestination: '#subscribe',
        });
      } else if (isClinic) {
        homeSections.push({
          id: 'sec-booking',
          pieceId: 'p-action-appointment-request',
          category: 'action',
          preferredVariant: 'calendar-picker',
          purpose: 'Provide intuitive online appointment scheduling.',
          contentObjective: 'Convenient slot selection with instant confirmation.',
          ctaDestination: '#book',
        });
      } else if (isRestaurant) {
        homeSections.push({
          id: 'sec-reservation',
          pieceId: 'p-vertical-restaurant-reservation',
          category: 'vertical',
          preferredVariant: 'form',
          purpose: 'Table reservation request with date and guest count.',
          contentObjective: 'Drive immediate dining bookings.',
          ctaDestination: '#reserve',
        });
      } else if (isFitness) {
        homeSections.push({
          id: 'sec-trial-pass',
          pieceId: 'p-action-appointment-request',
          category: 'action',
          preferredVariant: 'form',
          purpose: 'Complimentary first session pass reservation.',
          contentObjective: 'Drive studio visit conversions.',
          ctaDestination: '#trial',
        });
      } else {
        homeSections.push({
          id: 'sec-contact',
          pieceId: 'p-action-contact-form',
          category: 'action',
          preferredVariant: 'with-side-info',
          purpose: 'Direct inquiry submission with quick response guarantee.',
          contentObjective: 'Frictionless consultation form.',
          ctaDestination: '#submit',
        });
      }

      pagePlans.push({
        slug: 'home',
        title: `${profile.businessName} — Official Website`,
        pagePurpose: 'Primary digital storefront and brand homepage.',
        audienceIntent: 'Discovering collections, assessing trust, and taking direct conversion action.',
        sections: homeSections,
        ctaDestinations: isD2C ? ['/shop', '#subscribe'] : ['/services', '#contact'],
        seoMeta: {
          title: `${profile.businessName} | ${profile.subcategory || profile.businessCategory}`,
          description: `Discover ${profile.businessName}. ${profile.offerings.slice(0, 3).join(', ')}.`,
        },
      });
    } else if (slug === 'shop') {
      pagePlans.push({
        slug: 'shop',
        title: `Shop All Collections — ${profile.businessName}`,
        pagePurpose: 'Complete e-commerce product catalog with interactive filters and details.',
        audienceIntent: 'Browsing products, checking specifications, and adding items to cart.',
        sections: [
          {
            id: 'sec-shop-header',
            pieceId: 'p-opener-page-header',
            category: 'opener',
            preferredVariant: 'plain',
            purpose: 'Set shopping context with curated collection badges.',
            contentObjective: 'Provide clear browsing pathways.',
          },
          {
            id: 'sec-shop-grid',
            pieceId: 'p-offer-product-grid',
            category: 'offer',
            preferredVariant: '4-col',
            purpose: 'Full product grid with dynamic pricing, stock badges, and quick view.',
            contentObjective: 'Present comprehensive catalog efficiently.',
          },
          {
            id: 'sec-shop-detail',
            pieceId: 'p-vertical-d2c-product-detail',
            category: 'vertical',
            preferredVariant: 'gallery-left',
            purpose: 'Featured spotlight product with ingredients/material breakdown and Add to Bag.',
            contentObjective: 'Convert high-interest browsers on flagship item.',
          },
          {
            id: 'sec-shop-guarantee',
            pieceId: 'p-action-cta',
            category: 'action',
            preferredVariant: 'banner',
            purpose: 'Highlight free nationwide shipping and hassle-free 30-day returns.',
            contentObjective: 'Remove checkout friction.',
            ctaDestination: '/contact',
          },
        ],
        ctaDestinations: ['/contact'],
        seoMeta: {
          title: `Shop Collections | ${profile.businessName}`,
          description: `Explore the complete catalog from ${profile.businessName}. Transparent pricing and fast shipping.`,
        },
      });
    } else if (slug === 'services') {
      pagePlans.push({
        slug: 'services',
        title: `Services & Treatments — ${profile.businessName}`,
        pagePurpose: 'In-depth overview of clinical treatments, pricing, and procedures.',
        audienceIntent: 'Comparing treatment modalities, expectations, and booking consultations.',
        sections: [
          {
            id: 'sec-services-header',
            pieceId: 'p-opener-page-header',
            category: 'opener',
            preferredVariant: 'plain',
            purpose: 'Introduce specialized clinical capabilities.',
            contentObjective: 'Clarify therapeutic and clinical scope.',
          },
          {
            id: 'sec-services-list',
            pieceId: isClinic ? 'p-vertical-clinic-treatment-list' : 'p-offer-feature-rows',
            category: isClinic ? 'vertical' : 'offer',
            preferredVariant: isClinic ? 'grid' : 'text-left-image-right',
            purpose: 'Categorized breakdown of all clinical procedures.',
            contentObjective: 'Provide detailed treatment protocols.',
          },
          {
            id: 'sec-services-cta',
            pieceId: 'p-action-cta',
            category: 'action',
            preferredVariant: 'card',
            purpose: 'Direct invitation to schedule a specialist consultation.',
            contentObjective: 'Encourage direct appointment request.',
            ctaDestination: '/contact',
          },
        ],
        ctaDestinations: ['/contact'],
        seoMeta: {
          title: `Treatments & Services | ${profile.businessName}`,
          description: `Comprehensive specialized care from ${profile.businessName}.`,
        },
      });
    } else if (slug === 'about') {
      pagePlans.push({
        slug: 'about',
        title: `About Us — ${profile.businessName}`,
        pagePurpose: 'Brand founding story, principles, craftsmanship, and team introduction.',
        audienceIntent: 'Understanding company values, authenticity, and background.',
        sections: [
          {
            id: 'sec-about-header',
            pieceId: 'p-opener-page-header',
            category: 'opener',
            preferredVariant: 'split',
            purpose: 'Introduce the people and philosophy behind the brand.',
            contentObjective: 'Establish personal, authentic brand resonance.',
          },
          {
            id: 'sec-about-story',
            pieceId: 'p-offer-feature-rows',
            category: 'offer',
            preferredVariant: 'text-right-image-left',
            purpose: 'Founding mission, sourcing ethics, and commitment to excellence.',
            contentObjective: 'Provide rich brand narrative.',
          },
          {
            id: 'sec-about-numbers',
            pieceId: 'p-trust-numbers',
            category: 'trust',
            preferredVariant: 'counter-row',
            purpose: 'Key milestones, satisfied customer count, and quality metrics.',
            contentObjective: 'Validate scale and credibility.',
          },
          {
            id: 'sec-about-gallery',
            pieceId: 'p-media-photo-wall',
            category: 'media',
            preferredVariant: '3-across',
            purpose: 'Behind-the-scenes visual look into the atelier, clinic, or studio.',
            contentObjective: 'Immerse visitor in tangible quality.',
          },
        ],
        ctaDestinations: ['/contact'],
        seoMeta: {
          title: `Our Story & Mission | ${profile.businessName}`,
          description: `Learn how ${profile.businessName} was founded on principles of quality, care, and integrity.`,
        },
      });
    } else if (slug === 'faq') {
      pagePlans.push({
        slug: 'faq',
        title: `Frequently Asked Questions — ${profile.businessName}`,
        pagePurpose: 'Clear, categorized answers to top customer questions and policies.',
        audienceIntent: 'Resolving questions regarding orders, shipping, appointments, and care.',
        sections: [
          {
            id: 'sec-faq-header',
            pieceId: 'p-opener-page-header',
            category: 'opener',
            preferredVariant: 'plain',
            purpose: 'Guide customers to fast, helpful answers.',
            contentObjective: 'Demonstrate transparency and supportive service.',
          },
          {
            id: 'sec-faq-accordion',
            pieceId: 'p-answer-faq',
            category: 'answer',
            preferredVariant: 'accordion',
            purpose: isD2C
              ? 'Address shipping speed, returns, sustainable packaging, and product care.'
              : 'Address appointments, insurance, initial consultations, and payment options.',
            contentObjective: 'Provide instant reassurance to common questions.',
          },
          {
            id: 'sec-faq-support',
            pieceId: 'p-action-whatsapp-card',
            category: 'action',
            preferredVariant: 'card',
            purpose: 'Offer direct chat or email line for questions not listed.',
            contentObjective: 'Ensure no customer feels unanswered.',
            ctaDestination: '/contact',
          },
        ],
        ctaDestinations: ['/contact'],
        seoMeta: {
          title: `Customer FAQ & Support | ${profile.businessName}`,
          description: `Find answers to common questions about orders, policies, and care from ${profile.businessName}.`,
        },
      });
    } else if (slug === 'contact') {
      pagePlans.push({
        slug: 'contact',
        title: `Contact Us — ${profile.businessName}`,
        pagePurpose: 'Customer inquiry portal with contact forms, operating hours, and location.',
        audienceIntent: 'Reaching out for customer support, custom orders, or visit details.',
        sections: [
          {
            id: 'sec-contact-header',
            pieceId: 'p-opener-page-header',
            category: 'opener',
            preferredVariant: 'plain',
            purpose: 'Welcome direct inquiries and customer messages.',
            contentObjective: 'Reassure quick response within 24 hours.',
          },
          {
            id: 'sec-contact-form',
            pieceId: 'p-action-contact-form',
            category: 'action',
            preferredVariant: 'with-side-info',
            purpose: 'Validated contact form with subject selection and direct email channels.',
            contentObjective: 'Capture inquiries cleanly with truthful preview notifications.',
            ctaDestination: '#submit',
          },
          {
            id: 'sec-contact-hours',
            pieceId: 'p-action-location-hours',
            category: 'action',
            preferredVariant: 'split-with-map',
            purpose: 'Operating schedule, studio address, and telephone lines.',
            contentObjective: 'Eliminate friction for visits or direct calls.',
          },
        ],
        ctaDestinations: ['#submit'],
        seoMeta: {
          title: `Contact Us | ${profile.businessName}`,
          description: `Get in touch with ${profile.businessName}. We are here to assist with any questions.`,
        },
      });
    } else if (slug === 'menu') {
      pagePlans.push({
        slug: 'menu',
        title: `Seasonal Menu — ${profile.businessName}`,
        pagePurpose: 'Complete dining menu with signature courses and pricing.',
        audienceIntent: 'Exploring culinary dishes, dietary notes, and specialty beverages.',
        sections: [
          {
            id: 'sec-menu-header',
            pieceId: 'p-opener-page-header',
            category: 'opener',
            preferredVariant: 'plain',
            purpose: 'Seasonal dining overview.',
            contentObjective: 'Present farm-to-table culinary philosophy.',
          },
          {
            id: 'sec-menu-items',
            pieceId: 'p-vertical-restaurant-menu-by-category',
            category: 'vertical',
            preferredVariant: 'grouped-courses',
            purpose: 'Starters, mains, and desserts with transparent pricing.',
            contentObjective: 'Stir appetite and inform diners.',
          },
          {
            id: 'sec-menu-hours',
            pieceId: 'p-action-location-hours',
            category: 'action',
            preferredVariant: 'split-with-map',
            purpose: 'Kitchen hours and dining room location.',
            contentObjective: 'Guide guests to table booking.',
            ctaDestination: '/reservations',
          },
        ],
        ctaDestinations: ['/reservations'],
        seoMeta: {
          title: `Menu | ${profile.businessName}`,
          description: `Seasonal dishes and wine list from ${profile.businessName}.`,
        },
      });
    } else if (slug === 'reservations') {
      pagePlans.push({
        slug: 'reservations',
        title: `Table Reservations — ${profile.businessName}`,
        pagePurpose: 'Online dining reservations portal.',
        audienceIntent: 'Booking tables for intimate dinners and gatherings.',
        sections: [
          {
            id: 'sec-res-header',
            pieceId: 'p-opener-page-header',
            category: 'opener',
            preferredVariant: 'plain',
            purpose: 'Dining reservations welcome.',
            contentObjective: 'Set hospitable booking expectations.',
          },
          {
            id: 'sec-res-form',
            pieceId: 'p-action-appointment-request',
            category: 'action',
            preferredVariant: 'calendar-picker',
            purpose: 'Party size, date, and sitting time selector.',
            contentObjective: 'Confirm dining reservations.',
            ctaDestination: '#book',
          },
          {
            id: 'sec-res-hours',
            pieceId: 'p-action-location-hours',
            category: 'action',
            preferredVariant: 'split-with-map',
            purpose: 'Address, valet parking, and arrival instructions.',
            contentObjective: 'Smooth guest arrivals.',
          },
        ],
        ctaDestinations: ['#book'],
        seoMeta: {
          title: `Reserve a Table | ${profile.businessName}`,
          description: `Book dining reservations online at ${profile.businessName}.`,
        },
      });
    } else if (slug === 'work') {
      pagePlans.push({
        slug: 'work',
        title: `Selected Work & Portfolio — ${profile.businessName}`,
        pagePurpose: 'Client case studies, creative direction, and project showcase.',
        audienceIntent: 'Reviewing design caliber, past results, and aesthetic sensibility.',
        sections: [
          {
            id: 'sec-work-header',
            pieceId: 'p-opener-page-header',
            category: 'opener',
            preferredVariant: 'plain',
            purpose: 'Portfolio index introduction.',
            contentObjective: 'Highlight studio caliber.',
          },
          {
            id: 'sec-work-gallery',
            pieceId: 'p-offer-feature-rows',
            category: 'offer',
            preferredVariant: 'text-left-image-right',
            purpose: 'Featured case studies with impact metrics.',
            contentObjective: 'Demonstrate tangible business outcomes.',
          },
          {
            id: 'sec-work-numbers',
            pieceId: 'p-trust-numbers',
            category: 'trust',
            preferredVariant: 'counter-row',
            purpose: 'Quantified achievements and awards.',
            contentObjective: 'Validate authority.',
          },
          {
            id: 'sec-work-cta',
            pieceId: 'p-action-contact-form',
            category: 'action',
            preferredVariant: 'with-side-info',
            purpose: 'New project inquiry form.',
            contentObjective: 'Initiate client conversations.',
            ctaDestination: '/contact',
          },
        ],
        ctaDestinations: ['/contact'],
        seoMeta: {
          title: `Portfolio & Case Studies | ${profile.businessName}`,
          description: `Explore selected works and client impact by ${profile.businessName}.`,
        },
      });
    } else {
      pagePlans.push({
        slug,
        title: `${slug.charAt(0).toUpperCase() + slug.slice(1)} — ${profile.businessName}`,
        pagePurpose: `Dedicated ${slug} overview for ${profile.businessName}.`,
        audienceIntent: `Exploring ${slug} details and next steps.`,
        sections: [
          {
            id: `sec-${slug}-header`,
            pieceId: 'p-opener-page-header',
            category: 'opener',
            preferredVariant: 'plain',
            purpose: `Introduce ${slug}.`,
            contentObjective: `Communicate ${slug} value.`,
          },
          {
            id: `sec-${slug}-content`,
            pieceId: 'p-offer-feature-rows',
            category: 'offer',
            preferredVariant: 'text-left-image-right',
            purpose: `Detailed ${slug} information.`,
            contentObjective: 'Address visitor questions.',
          },
          {
            id: `sec-${slug}-cta`,
            pieceId: 'p-action-contact-form',
            category: 'action',
            preferredVariant: 'with-side-info',
            purpose: 'Direct contact.',
            contentObjective: 'Assist visitors.',
            ctaDestination: '/contact',
          },
        ],
        ctaDestinations: ['/contact'],
        seoMeta: {
          title: `${slug.charAt(0).toUpperCase() + slug.slice(1)} | ${profile.businessName}`,
          description: `Learn more about ${slug} at ${profile.businessName}.`,
        },
      });
    }
  }

  // 3. Visitor Journeys
  const visitorJourneys: VisitorJourneyStep[] = [
    {
      stage: 'Discovery & Awareness',
      visitorGoal: `Understand what ${profile.businessName} creates and provides.`,
      addressedByPage: 'home',
      addressedBySection: 'sec-hero',
      callToAction: isD2C ? 'Explore Collection' : 'Learn More',
    },
    {
      stage: 'Evaluation & Product Selection',
      visitorGoal: isD2C ? 'Browse products, check prices, and inspect quality.' : 'Examine services and credentials.',
      addressedByPage: isD2C ? 'shop' : 'services',
      addressedBySection: isD2C ? 'sec-shop-grid' : 'sec-services-list',
      callToAction: isD2C ? 'View Products' : 'Explore Treatments',
    },
    {
      stage: 'Trust & Confidence',
      visitorGoal: 'Verify customer satisfaction, shipping policies, and reviews.',
      addressedByPage: 'home / about / faq',
      addressedBySection: 'sec-testimonials',
      callToAction: 'Read Reviews',
    },
    {
      stage: 'Purchase / Conversion',
      visitorGoal: isD2C ? 'Complete purchase with express shipping.' : 'Submit confirmed inquiry or visit booking.',
      addressedByPage: isD2C ? 'shop / home' : 'contact / home',
      addressedBySection: isD2C ? 'sec-newsletter' : 'sec-contact',
      callToAction: isD2C ? 'Shop Now' : 'Send Message',
    },
  ];

  return {
    schemaVersion: '2.1',
    projectId,
    goalSummary: profile.primaryGoal,
    sitemap: pagesToGenerate,
    navigation,
    visitorJourneys,
    pagePlans,
    featurePlan: pagesToGenerate,
    designBrief: `Natural modern layout using ${profile.brandTone} aesthetic. Clean typography, generous whitespace, earthy accents, and zero harsh gradients.`,
    missingAssets: [],
    risks: [],
    assumptions: profile.assumptions.map((a) => `${a.field}: ${a.value}`),
    planVersion: 1,
  };
}
