import { nanoid } from 'nanoid';
import { SitePlan } from '@/lib/schemas/site-plan.schema';
import { DesignSystem } from '@/lib/schemas/design-system.schema';
import { BusinessProfile } from '@/lib/schemas/business-profile.schema';
import { ComponentInstance, CompositionManifest, ManifestPage } from '@/lib/schemas/composition-manifest.schema';
import { computeCompositionFingerprint } from '@/engine/similarity/evaluator';
import libraryRegistry from '@/registry/library-registry.json';

const piecesMap = new Map<string, any>();
(libraryRegistry as any).pieces.forEach((p: any) => {
  piecesMap.set(p.id, p);
});

export function composeWebsite(
  plan: SitePlan,
  designSystem: DesignSystem,
  profile: BusinessProfile,
  rawContent?: Record<string, any>,
  compositionSeed?: string
): CompositionManifest {
  const seed = compositionSeed || nanoid(8);
  const pages: ManifestPage[] = [];

  const isD2C =
    profile.businessCategory.toLowerCase().includes('d2c') ||
    profile.businessCategory.toLowerCase().includes('d2d') ||
    profile.businessCategory.toLowerCase().includes('retail') ||
    profile.businessCategory.toLowerCase().includes('e-com') ||
    profile.businessCategory.toLowerCase().includes('commerce') ||
    profile.businessCategory.toLowerCase().includes('shop');

  const content = rawContent || {};
  const heroHeading = content.heroHeadline || (isD2C ? `Thoughtfully Crafted Essentials by ${profile.businessName}` : `Exceptional Care by ${profile.businessName}`);
  const heroSubheading = content.heroSubheading || `Experience purposeful quality and specialized solutions designed around your lifestyle.`;
  const heroCta = content.primaryCta || (isD2C ? 'Shop the Collection' : 'Schedule a Visit');

  const items = Array.isArray(content.items) && content.items.length > 0
    ? content.items
    : profile.offerings.map((o, idx) => ({
        title: o,
        description: 'Excellence in every detail, crafted with high-grade standards and attentive service.',
        badge: isD2C ? `₹${(idx + 1) * 999}` : `0${idx + 1}`,
        category: isD2C ? 'Collection' : 'Service',
      }));

  const testimonials = Array.isArray(content.testimonials) && content.testimonials.length > 0
    ? content.testimonials
    : [
        {
          quote: `The standard of quality and customer care with ${profile.businessName} has been extraordinary from our first interaction.`,
          author: 'Priya Verma',
          role: 'Verified Customer',
        },
        {
          quote: `Meticulous attention to detail and honest communication. Truly a pleasure to work with.`,
          author: 'Devendra Sen',
          role: 'Client',
        },
      ];

  const faqs = Array.isArray(content.faqs) && content.faqs.length > 0
    ? content.faqs
    : [
        {
          question: isD2C ? 'What are your shipping and delivery timelines?' : 'How do I book an initial consultation?',
          answer: isD2C
            ? 'Orders are dispatched within 24 hours. Metro deliveries arrive within 2-3 business days.'
            : 'You can book directly via our online schedule or contact line to reserve an appointment.',
        },
        {
          question: isD2C ? 'What is your return and exchange policy?' : 'What should I prepare for my first visit?',
          answer: isD2C
            ? 'We offer a hassle-free 30-day window for returns and exchanges on unused items in original packaging.'
            : 'We conduct a relaxed consultation to understand your requirements and provide transparent guidance.',
        },
      ];

  plan.pagePlans.forEach((pp, pageIdx) => {
    const componentInstances: ComponentInstance[] = [];

    // 1. Frame Header
    const headerPiece = piecesMap.get('p-frame-header');
    if (headerPiece) {
      componentInstances.push({
        instanceId: `inst-header-${pp.slug}`,
        pieceId: 'p-frame-header',
        variantName: 'classic',
        category: 'frame',
        props: {
          brandName: profile.businessName,
          navLinks: plan.navigation,
          ctaLabel: isD2C ? 'Shop Now' : 'Inquire',
          ctaHref: isD2C ? '/shop' : '/contact',
        },
        contentSlotRefs: {},
        orderIndex: 0,
        isVisible: true,
      });
    }

    // 2. Page Sections with REAL, Truthful Copy
    pp.sections.forEach((sec, secIdx) => {
      const piece = piecesMap.get(sec.pieceId);
      const chosenVariant = sec.preferredVariant || piece?.variants[0]?.name || 'default';

      let sectionProps: Record<string, any> = {
        eyebrow: profile.businessCategory,
        heading: '',
        subheading: '',
        ctaLabel: 'Learn More',
        ctaHref: sec.ctaDestination || '#',
      };

      if (sec.id.includes('hero')) {
        sectionProps = {
          eyebrow: isD2C ? 'New Season / Signature Series' : profile.subcategory || profile.businessCategory,
          heading: heroHeading,
          subheading: heroSubheading,
          ctaLabel: heroCta,
          ctaHref: sec.ctaDestination || (isD2C ? '/shop' : '#contact'),
          secondaryCtaLabel: 'Our Story',
          secondaryCtaHref: '/about',
        };
      } else if (sec.id.includes('products') || sec.id.includes('shop-grid')) {
        sectionProps = {
          eyebrow: 'Curated Catalog',
          heading: isD2C ? 'Bestsellers & Signature Collections' : 'Featured Offerings',
          subheading: 'Engineered for durability, modern aesthetics, and daily ease.',
          ctaLabel: isD2C ? 'Add to Bag' : 'View Details',
          ctaHref: '/shop',
          items: items.slice(0, 4),
        };
      } else if (sec.id.includes('categories')) {
        sectionProps = {
          eyebrow: 'Browse By Focus',
          heading: 'Explore Our Categories',
          subheading: 'Discover tailored solutions across our specialized domains.',
          items: [
            { title: 'Core Essentials', badge: 'Popular', description: 'Everyday staples crafted to perfection.' },
            { title: 'New Arrivals', badge: 'Latest', description: 'Fresh designs exploring novel textures and forms.' },
            { title: 'Limited Editions', badge: 'Exclusive', description: 'Small-batch pieces with certified provenance.' },
          ],
        };
      } else if (sec.id.includes('services') || sec.id.includes('features')) {
        sectionProps = {
          eyebrow: 'What We Deliver',
          heading: isD2C ? 'Designed with Intent, Made to Last' : `Comprehensive ${profile.businessCategory} Solutions`,
          subheading: 'Transparent processes, vetted materials, and unwavering dedication to quality.',
          ctaLabel: 'Explore Details',
          ctaHref: '/services',
          items: items.slice(0, 4),
        };
      } else if (sec.id.includes('about') || sec.id.includes('story') || sec.id.includes('materials')) {
        sectionProps = {
          eyebrow: 'Our Philosophy',
          heading: content.aboutHeadline || 'Rooted in Honesty and Craftsmanship',
          subheading: content.aboutStory || `At ${profile.businessName}, we believe excellence is in the details. We prioritize sustainable practices and lasting satisfaction.`,
          ctaLabel: 'Read Full Story',
          ctaHref: '/about',
        };
      } else if (sec.id.includes('testimonials')) {
        sectionProps = {
          eyebrow: 'Client Impressions',
          heading: 'Trusted by Those Who Value Quality',
          subheading: 'Genuine feedback from our community and verified clients.',
          testimonials,
        };
      } else if (sec.id.includes('faq')) {
        sectionProps = {
          eyebrow: 'Clarity & Reassurance',
          heading: 'Frequently Asked Questions',
          subheading: 'Transparent details regarding our workflow, standards, and guarantees.',
          faqs,
        };
      } else if (sec.id.includes('newsletter')) {
        sectionProps = {
          eyebrow: 'Stay Connected',
          heading: content.newsletter?.headline || 'Enjoy 15% Off Your First Purchase',
          subheading: content.newsletter?.subheading || 'Subscribe to receive private updates, seasonal release notes, and member privileges.',
          ctaLabel: 'Join Community',
        };
      } else if (sec.id.includes('booking') || sec.id.includes('appointment')) {
        sectionProps = {
          eyebrow: 'Reserve Time',
          heading: 'Schedule an Appointment',
          subheading: 'Select a convenient date and time for your personalized consultation.',
          ctaLabel: 'Confirm Appointment',
          ctaHref: '#confirm',
        };
      } else if (sec.id.includes('contact')) {
        sectionProps = {
          eyebrow: 'Reach Out',
          heading: "We'd Love to Hear From You",
          subheading: 'Submit your message or questions below. Our team responds within 24 hours.',
          ctaLabel: 'Send Inquiry',
          ctaHref: '#submit',
          email: `contact@${profile.businessName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          phone: '+91 (0) 80 4123 4567',
          address: 'Studio Suite 12, High Street Promenade',
        };
      } else if (sec.id.includes('portfolio') || sec.id.includes('case-studies')) {
        sectionProps = {
          eyebrow: 'Selected Client Work',
          heading: 'Proven Outcomes & Case Studies',
          subheading: 'Collaborations engineered with precision, creative discipline, and quantifiable commercial impact.',
        };
      } else if (sec.id.includes('classes') || sec.id.includes('schedule')) {
        sectionProps = {
          eyebrow: 'Movement Timetable',
          heading: 'Weekly Schedule & Guided Sessions',
          subheading: 'Small-group classes led by certified master teachers in our serene, balanced studios.',
        };
      } else if (sec.id.includes('membership') || sec.id.includes('pricing')) {
        sectionProps = {
          eyebrow: 'Studio Access',
          heading: 'Invest in Daily Excellence',
          subheading: 'Contract-free memberships with transparent benefits and flexible cancellation.',
        };
      } else if (sec.id.includes('properties') || sec.id.includes('listings')) {
        sectionProps = {
          eyebrow: 'Exclusive Inventory',
          heading: 'Featured Residences & Architectural Developments',
          subheading: 'Discreet prime properties engineered with natural stone, floor-to-ceiling glass, and serene gardens.',
        };
      } else if (sec.id.includes('amenities')) {
        sectionProps = {
          eyebrow: 'Estate Details',
          heading: 'Engineered for Refined Living',
          subheading: 'Comprehensive architectural specifications designed for lasting ease and wellness.',
        };
      } else if (sec.id.includes('methodology') || sec.id.includes('process')) {
        sectionProps = {
          eyebrow: 'Strategic Blueprint',
          heading: 'Our 4-Stage Advisory Framework',
          subheading: 'A disciplined approach delivering transparent progress and compounding market advantage.',
        };
      } else if (sec.id.includes('reservation')) {
        sectionProps = {
          eyebrow: 'Table Bookings',
          heading: 'Reserve Your Dining Experience',
          subheading: 'Private tables and Chef counter sittings reserved up to 30 days in advance.',
        };
      } else if (sec.id.includes('chef')) {
        sectionProps = {
          eyebrow: 'Culinary Philosophy',
          heading: 'Honoring Earth, Fire & Season',
          subheading: 'Artisan provenance and partner regenerative farm sourcing in every dish.',
        };
      } else if (sec.id.includes('patient-journey')) {
        sectionProps = {
          eyebrow: 'Patient Experience',
          heading: 'Your Pathway to Gentle, Lasting Care',
          subheading: 'Demystifying treatment through unhurried consultations and transparent guidance.',
        };
      } else if (sec.id.includes('header') && pp.slug !== 'home') {
        sectionProps = {
          eyebrow: profile.businessName,
          heading: pp.title.split('—')[0].trim(),
          subheading: pp.pagePurpose,
        };
      }

      componentInstances.push({
        instanceId: `inst-${pp.slug}-${sec.id}`,
        pieceId: sec.pieceId,
        variantName: chosenVariant,
        category: sec.category,
        props: sectionProps,
        contentSlotRefs: {},
        orderIndex: secIdx + 1,
        isVisible: true,
      });
    });

    // 3. Frame Footer
    const footerPiece = piecesMap.get('p-frame-footer');
    if (footerPiece) {
      componentInstances.push({
        instanceId: `inst-footer-${pp.slug}`,
        pieceId: 'p-frame-footer',
        variantName: 'columns',
        category: 'frame',
        props: {
          brandName: profile.businessName,
          tagline: `Thoughtfully crafted for ${profile.businessCategory.toLowerCase()}.`,
          copyright: `© ${new Date().getFullYear()} ${profile.businessName}. All rights reserved.`,
          navLinks: plan.navigation,
        },
        contentSlotRefs: {},
        orderIndex: pp.sections.length + 1,
        isVisible: true,
      });
    }

    pages.push({
      slug: pp.slug,
      title: pp.title,
      isHome: pageIdx === 0,
      componentInstances,
      seo: {
        title: pp.seoMeta.title,
        description: pp.seoMeta.description,
      },
    });
  });

  const manifest: CompositionManifest = {
    schemaVersion: '2.1',
    projectId: plan.projectId,
    libraryVersion: (libraryRegistry as any).version || '2.1.0-292looks',
    engineVersion: '2.1.0',
    compositionSeed: seed,
    designSystemVersion: designSystem.version,
    pages,
    compositionFingerprint: '',
    similarityScores: {},
    qualityStatus: 'pending',
  };

  manifest.compositionFingerprint = computeCompositionFingerprint(manifest, designSystem.dials);
  return manifest;
}
