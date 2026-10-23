// scripts/test-benchmark-generation.js
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

async function runTest() {
  console.log('=== TEST 3: Full Site Generation with Aesop Benchmark Archetype ===');
  const res = await postJson('/api/generations', {
    brief: {
      businessName: 'Solstice Botanical Lab',
      offeringsAndGoals: 'Small batch botanical skincare studio. We want a quiet luxury aesthetic inspired by Aesop.',
      businessCategory: 'D2C & Retail E-Commerce',
      referenceUrl: '', // No reference website provided
      selectedBenchmarkId: 'aesop-quiet-luxury', // Selected benchmark
    },
  });

  console.log('Status:', res.status);
  console.log('Success:', res.data?.success);
  console.log('Project ID:', res.data?.projectId);
  console.log('Design System Concept:', res.data?.designSystem?.conceptName);
  console.log('Font Pairing:', res.data?.designSystem?.dials?.font);
  console.log('Buttons Dial:', res.data?.designSystem?.dials?.buttons);
  console.log('Radius Dial:', res.data?.designSystem?.dials?.radius);
  console.log('Density Dial:', res.data?.designSystem?.dials?.density);

  const homePage = res.data?.manifest?.pages?.find((p) => p.slug === 'home');
  console.log('Home Page Section Count:', homePage?.componentInstances?.length);
  console.log('Home Section Sequence & Variants:');
  homePage?.componentInstances?.forEach((ci, idx) => {
    console.log(`  ${idx + 1}. [${ci.pieceId}] -> variant: "${ci.variantName}"`);
  });

  console.log('Total AI Cost INR: ₹' + (res.data?.costTelemetry?.totalCostINR || 0));
}

runTest().catch(console.error);
