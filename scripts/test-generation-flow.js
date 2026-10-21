// scripts/test-generation-flow.js
const http = require('http');

function postJSON(url, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const parsed = new URL(url);
    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
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

function getJSON(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname,
        method: 'GET',
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
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
    req.end();
  });
}

async function testGeneration() {
  console.log('Testing Full Generation Pipeline for D2D/ retail ecomerce platform...');
  const brief = {
    businessName: 'Terra Natural Goods',
    businessCategory: 'D2D/ retail ecomerce platform',
    offeringsAndGoals: 'Minimalist sustainable home and lifestyle goods sold directly to retail consumers. Need product showcase, online shopping cart, FAQ, and responsive brand story.',
  };

  const genRes = await postJSON('http://localhost:3000/api/generations', { brief });
  console.log('Generation Response Status:', genRes.status);
  if (genRes.status !== 200) {
    console.error('Generation Failed:', genRes);
    return;
  }

  const { projectId, versionId, pages, estimatedAiCostINR, designDials } = genRes.data;
  console.log('Generated Project ID:', projectId);
  console.log('Version ID:', versionId);
  console.log('Estimated Cost (INR):', estimatedAiCostINR, '<= ₹8.00:', estimatedAiCostINR <= 8.0);
  console.log('Generated Pages Count:', pages?.length);
  if (pages) {
    for (const p of pages) {
      console.log(` - Page /${p.slug}: "${p.title}" with ${p.sections?.length} sections:`);
      for (const s of p.sections || []) {
        console.log(`     * [${s.pieceId}] (look: ${s.lookVariantId}) title: "${s.props?.headline || s.props?.title || s.props?.heroHeadline || 'N/A'}"`);
      }
    }
  }

  // Now test fetching the project from the API
  console.log('\nTesting GET /api/projects/' + projectId);
  const projRes = await getJSON(`http://localhost:3000/api/projects/${projectId}`);
  console.log('GET Project Status:', projRes.status);
  console.log('Project Name in DB:', projRes.data?.project?.name);
  console.log('Project Category in DB:', projRes.data?.project?.category);

  // Now test fetching the editor page for this project
  console.log('\nTesting GET /editor/' + projectId);
  const editorRes = await getJSON(`http://localhost:3000/editor/${projectId}`);
  console.log('GET Editor HTML Status:', editorRes.status);
}

testGeneration().catch(console.error);
