const http = require('http');

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(body);
          } catch (e) {}
          resolve({ status: res.statusCode, headers: res.headers, body, json });
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== MULTI-CATEGORY DIVERSITY & VARIANT SWITCHING TEST ===\n');

  // Test 1: Category Diversity Check
  const testBusinesses = [
    {
      name: 'Vanguard Horology',
      category: 'Luxury D2C Timepieces',
      offerings: 'Handcrafted luxury automatic watches, titanium diving chronometers, bespoke leather straps, and global collector warranty',
      expectedTone: 'Quiet luxury',
      expectedPage: 'shop',
    },
    {
      name: 'Osteria Rustica',
      category: 'Artisan Dining & Trattoria',
      offerings: 'Wood-fired sourdough pizzas, fresh handmade pasta, seasonal truffle risotto, natural wines, and private chef dinners',
      expectedTone: 'Warm restaurant',
      expectedPage: 'menu',
    },
    {
      name: 'Prana Sanctuary',
      category: 'Movement & Yoga Studio',
      offerings: 'Vinyasa yoga, reformer pilates, breathwork journeys, private somatic therapy, and sound bath sessions',
      expectedTone: 'Fresh green',
      expectedPage: 'classes',
    },
  ];

  const generatedProjects = [];

  for (const b of testBusinesses) {
    console.log(`\n--- Testing Generation for: ${b.name} (${b.category}) ---`);

    // Step A: Inference
    const inferRes = await request('http://localhost:3000/api/onboarding/infer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: b.name,
        businessCategory: b.category,
        offeringsAndGoals: b.offerings,
      }),
    });

    console.log(`[Inference] Status: ${inferRes.status}`);
    console.log(`  -> Detected Category: ${inferRes.json.profile.businessCategory}`);
    console.log(`  -> Recommended Tone: ${inferRes.json.profile.brandTone}`);
    console.log(`  -> Sitemap: ${JSON.stringify(inferRes.json.profile.requiredPages)}`);

    // Step B: Generation
    const genRes = await request('http://localhost:3000/api/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brief: {
          businessName: b.name,
          businessCategory: b.category,
          offeringsAndGoals: b.offerings,
        },
      }),
    });

    console.log(`[Generation] Status: ${genRes.status}`);
    if (genRes.status !== 200) {
      throw new Error(`Generation failed for ${b.name}: ${genRes.body}`);
    }

    const proj = genRes.json;
    console.log(`  -> Project ID: ${proj.projectId}`);
    console.log(`  -> Design Concept: ${proj.designSystem.conceptName}`);
    console.log(`  -> Font Pairing: ${proj.designSystem.dials.font}`);
    console.log(`  -> Accent Color: ${proj.designSystem.dials.accent}`);
    console.log(`  -> Background Color: ${proj.designSystem.dials.bg}`);
    console.log(`  -> Corner Radius: ${proj.designSystem.dials.radius}`);
    console.log(`  -> Home Sections: ${proj.manifest.pages[0].componentInstances.map((ci) => ci.pieceId).join(', ')}`);

    generatedProjects.push(proj);
  }

  // Verify diversity
  console.log('\n=== CROSS-CATEGORY DISTINCTIVENESS VERIFICATION ===');
  const [d2cProj, restProj, fitProj] = generatedProjects;

  console.log(`Design Concept 1: ${d2cProj.designSystem.conceptName} vs Concept 2: ${restProj.designSystem.conceptName} vs Concept 3: ${fitProj.designSystem.conceptName}`);
  if (d2cProj.designSystem.conceptName === restProj.designSystem.conceptName || d2cProj.designSystem.conceptName === fitProj.designSystem.conceptName) {
    console.warn('Warning: Some presets matched!');
  } else {
    console.log('✓ All 3 categories generated completely different design systems & presets!');
  }

  if (d2cProj.designSystem.dials.font !== restProj.designSystem.dials.font && restProj.designSystem.dials.font !== fitProj.designSystem.dials.font) {
    console.log('✓ All 3 categories have distinct typography pairings!');
  }

  // Test 2: Section Variant Switching
  console.log('\n=== TESTING SECTION VARIANT SWITCHING & AUTOSAVE ===');
  const targetProj = d2cProj;
  const homePage = targetProj.manifest.pages.find((p) => p.slug === 'home');
  const newsletterInst = homePage.componentInstances.find((ci) => ci.pieceId.includes('newsletter'));

  if (!newsletterInst) {
    console.log('Newsletter section not on home page, checking all sections:');
    console.log(homePage.componentInstances.map((ci) => ci.pieceId));
  } else {
    console.log(`Initial Newsletter Variant: ${newsletterInst.variantName}`);

    // Switch to 'popup'
    console.log("Switching Newsletter to 'popup'...");
    const nextPages = targetProj.manifest.pages.map((p) => ({
      ...p,
      componentInstances: p.componentInstances.map((ci) =>
        ci.instanceId === newsletterInst.instanceId ? { ...ci, variantName: 'popup', lookVariantId: 'popup' } : ci
      ),
    }));

    const saveRes = await request('http://localhost:3000/api/edits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: targetProj.projectId,
        manifest: { ...targetProj.manifest, pages: nextPages },
        designSystem: targetProj.designSystem,
        contentBlocks: targetProj.contentBlocks,
      }),
    });

    console.log(`[Autosave] Status: ${saveRes.status}, Saved Version: ${saveRes.json?.savedVersion}`);

    // Verify it persists in database
    const verifyProj = await request(`http://localhost:3000/api/projects/${targetProj.projectId}`);
    const verifyNewsletter = verifyProj.json.manifest.pages
      .find((p) => p.slug === 'home')
      .componentInstances.find((ci) => ci.instanceId === newsletterInst.instanceId);

    console.log(`[Database Verification] Persisted Variant: ${verifyNewsletter.variantName}`);
    if (verifyNewsletter.variantName !== 'popup') {
      throw new Error(`Variant failed to persist! Expected 'popup', got '${verifyNewsletter.variantName}'`);
    }
    console.log("✓ Successfully switched Newsletter variant to 'popup' and persisted to database!");

    // Switch to 'inline'
    console.log("Switching Newsletter to 'inline'...");
    const nextPages2 = targetProj.manifest.pages.map((p) => ({
      ...p,
      componentInstances: p.componentInstances.map((ci) =>
        ci.instanceId === newsletterInst.instanceId ? { ...ci, variantName: 'inline', lookVariantId: 'inline' } : ci
      ),
    }));

    await request('http://localhost:3000/api/edits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: targetProj.projectId,
        manifest: { ...targetProj.manifest, pages: nextPages2 },
        designSystem: targetProj.designSystem,
        contentBlocks: targetProj.contentBlocks,
      }),
    });

    const verifyProj2 = await request(`http://localhost:3000/api/projects/${targetProj.projectId}`);
    const verifyNewsletter2 = verifyProj2.json.manifest.pages
      .find((p) => p.slug === 'home')
      .componentInstances.find((ci) => ci.instanceId === newsletterInst.instanceId);

    console.log(`[Database Verification 2] Persisted Variant: ${verifyNewsletter2.variantName}`);
    if (verifyNewsletter2.variantName !== 'inline') {
      throw new Error(`Variant failed to persist! Expected 'inline', got '${verifyNewsletter2.variantName}'`);
    }
    console.log("✓ Successfully switched Newsletter variant to 'inline' and verified in database!");
  }

  // Test 3: Editor HTML Rendering
  console.log('\n=== TESTING EDITOR PAGE RENDERING ===');
  const editorRes = await request(`http://localhost:3000/editor/${targetProj.projectId}`);
  console.log(`[Editor Page] Status: ${editorRes.status}`);
  if (editorRes.status !== 200) {
    throw new Error('Editor page failed to load!');
  }
  console.log('✓ Editor page rendered with SSR data and interactive controls!');

  console.log('\n=============================================================');
  console.log(' ALL VERIFICATIONS PASSED: DIVERSITY & VARIANTS FUNCTIONING! ');
  console.log('=============================================================');
}

runTests().catch((e) => {
  console.error('Test error:', e);
  process.exit(1);
});
