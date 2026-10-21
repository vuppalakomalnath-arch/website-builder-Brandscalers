// scripts/test-endpoints.js
const http = require('http');

function fetch(url, options = {}) {
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
          resolve({ status: res.statusCode, headers: res.headers, body });
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

async function run() {
  console.log('--- 1. Testing GET / ---');
  const homeRes = await fetch('http://localhost:3000/');
  console.log('GET / status:', homeRes.status);
  
  // Find CSS tags
  const cssMatches = homeRes.body.match(/href="([^"]+\.css[^"]*)"/g) || [];
  console.log('CSS links found on home:', cssMatches);
  for (const m of cssMatches.slice(0, 3)) {
    const cssPath = m.replace('href="', '').replace('"', '');
    const cssRes = await fetch(`http://localhost:3000${cssPath}`);
    console.log(`Fetch CSS ${cssPath} -> Status:`, cssRes.status, `Content-Type:`, cssRes.headers['content-type'], `Size:`, cssRes.body.length);
  }

  // Find JS chunk tags
  const jsMatches = homeRes.body.match(/src="([^"]+\.js[^"]*)"/g) || [];
  console.log('JS chunks found on home (first 3):', jsMatches.slice(0, 3));
  for (const m of jsMatches.slice(0, 3)) {
    const jsPath = m.replace('src="', '').replace('"', '');
    const jsRes = await fetch(`http://localhost:3000${jsPath}`);
    console.log(`Fetch JS ${jsPath} -> Status:`, jsRes.status, `Content-Type:`, jsRes.headers['content-type'], `Size:`, jsRes.body.length);
  }

  console.log('\n--- 2. Testing GET /new ---');
  const newRes = await fetch('http://localhost:3000/new');
  console.log('GET /new status:', newRes.status);
  const newJsMatches = newRes.body.match(/src="([^"]+\.js[^"]*)"/g) || [];
  for (const m of newJsMatches.slice(0, 3)) {
    const jsPath = m.replace('src="', '').replace('"', '');
    const jsRes = await fetch(`http://localhost:3000${jsPath}`);
    console.log(`Fetch /new JS ${jsPath} -> Status:`, jsRes.status);
  }

  console.log('\n--- 3. Testing POST /api/onboarding/infer ---');
  const inferPayload = JSON.stringify({
    businessName: "Lumina Home Goods",
    businessCategory: "D2D/ retail ecomerce platform",
    offeringsAndGoals: "Premium minimalist home decor, lighting, and sustainable textiles for direct-to-consumer buyers. Need online catalog, shopping cart flow, and responsive experience."
  });

  const inferRes = await fetch('http://localhost:3000/api/onboarding/infer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(inferPayload),
    },
    body: inferPayload
  });
  console.log('POST /api/onboarding/infer status:', inferRes.status);
  console.log('Infer Raw Body:', inferRes.body);

  console.log('\n--- Done tests ---');
}

run().catch(console.error);
