// scripts/test-all-three-features.js
const http = require('http');

function postJson(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('=== TEST 1: Benchmark Suggestion API (/api/onboarding/infer) ===');
  const inferRes = await postJson('/api/onboarding/infer', {
    businessName: 'Lumina Skin Lab',
    offeringsAndGoals: 'Organic botanical skincare apothecary offering small-batch serums, oils, and restorative facial treatments.',
    businessCategory: 'D2C / E-Commerce Brand',
    referenceUrl: '', // User did NOT provide any reference URL
  });

  console.log('Status:', inferRes.status);
  console.log('Category:', inferRes.data?.profile?.businessCategory);
  const rec = inferRes.data?.suggestedBenchmarks?.recommended;
  const alts = inferRes.data?.suggestedBenchmarks?.alternatives || [];
  console.log('Has Recommended Benchmark:', !!rec);
  if (rec) {
    console.log(`  Recommended Benchmark: ${rec.name} (${rec.url})`);
    console.log(`  Tagline: ${rec.tagline}`);
    console.log(`  Preset: ${rec.presetKey}, Font: ${rec.fontPairing}`);
    console.log(`  Key Features:`, rec.keyDesignFeatures);
    console.log(`  Component Placement:`, rec.componentPlacementOrder);
    console.log(`  Why It Works:`, rec.whyItWorks);
  }
  console.log('Alternative Benchmarks Available:', alts.length);
  alts.slice(0, 2).forEach((a) => console.log(`   - ${a.name} (${a.url}) [${a.presetKey}]`));

  console.log('\n=== TEST 2: AI Section Regenerator (/api/edits/regenerate-section) ===');
  const regenRes = await postJson('/api/edits/regenerate-section', {
    projectId: '6adaf186c21c3bd35f8e88ce', // Valid 24-char ObjectId
    instanceId: 'inst-home-sec-hero',
    pieceId: 'p-opener-hero',
    variantName: 'split',
    currentProps: {
      eyebrow: 'New Collection',
      heading: 'Standard Skincare for Everyone',
      subheading: 'Browse our selection of everyday lotions and balms.',
      ctaLabel: 'Shop Now',
      ctaHref: '/shop',
    },
    userPrompt: 'Rewrite for high-end bespoke botanical apothecary. Emphasize organic certified biodynamic extracts, zero parabens, and complimentary shipping over $100.',
    businessProfile: {
      businessName: 'Lumina Skin Lab',
      businessCategory: 'D2C / E-Commerce Brand',
      brandTone: 'Natural & Minimalist',
    },
    pageSlug: 'home',
  });

  console.log('Status:', regenRes.status);
  console.log('Success:', regenRes.data?.success);
  console.log('Regenerated Eyebrow:', regenRes.data?.updatedProps?.eyebrow);
  console.log('Regenerated Heading:', regenRes.data?.updatedProps?.heading);
  console.log('Regenerated Subheading:', regenRes.data?.updatedProps?.subheading);
  console.log('Regenerated CTA Label:', regenRes.data?.updatedProps?.ctaLabel);
  console.log('Cost INR:', regenRes.data?.costINR);
  console.log('Fallback Used:', regenRes.data?.fallbackUsed);

  console.log('\n=== ALL TESTS COMPLETED ===');
}

runTests().catch(console.error);
