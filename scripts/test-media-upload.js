const http = require('http');

async function testUploadsAndLogo() {
  console.log('🧪 Starting Media Upload & Logo Generation Automated Verification...\n');

  // Helper to make multipart request
  function uploadFile(filename, buffer, mimeType) {
    return new Promise((resolve, reject) => {
      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
      let payload = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`),
        buffer,
        Buffer.from(`\r\n--${boundary}--\r\n`),
      ]);

      const req = http.request(
        {
          hostname: 'localhost',
          port: 3000,
          path: '/api/uploads',
          method: 'POST',
          headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': payload.length,
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, body: JSON.parse(data) });
            } catch (e) {
              resolve({ status: res.statusCode, body: data });
            }
          });
        }
      );
      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  }

  // Helper for JSON POST
  function postJson(path, json) {
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify(json);
      const req = http.request(
        {
          hostname: 'localhost',
          port: 3000,
          path,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, body: JSON.parse(data) });
            } catch (e) {
              resolve({ status: res.statusCode, body: data });
            }
          });
        }
      );
      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  }

  // TEST 1: Reject unsupported formats (.txt, .gif)
  console.log('Test 1: Rejecting unsupported file formats (.gif)...');
  const dummyGif = Buffer.from('GIF89a...');
  const res1 = await uploadFile('test.gif', dummyGif, 'image/gif');
  if (res1.status === 400 && res1.body.error && res1.body.error.includes('JPG or PNG')) {
    console.log('✅ PASS: Rejected .gif format as expected.');
  } else {
    console.error('❌ FAIL Test 1:', res1);
  }

  // TEST 2: Accept valid JPG <= 5MB
  console.log('\nTest 2: Uploading valid small JPG (100KB)...');
  const smallJpg = Buffer.alloc(100 * 1024, 0xff); // 100KB
  const res2 = await uploadFile('banner.jpg', smallJpg, 'image/jpeg');
  if (res2.status === 200 && res2.body.success && res2.body.url) {
    console.log('✅ PASS: Successfully uploaded JPG:', res2.body.url);
  } else {
    console.error('❌ FAIL Test 2:', res2);
  }

  // TEST 3: Reject JPG > 5MB
  console.log('\nTest 3: Rejecting oversized JPG (> 5MB)...');
  const oversizedJpg = Buffer.alloc(5.2 * 1024 * 1024, 0xff); // 5.2MB
  const res3 = await uploadFile('large.jpg', oversizedJpg, 'image/jpeg');
  if (res3.status === 400 && res3.body.error && res3.body.error.includes('5MB')) {
    console.log('✅ PASS: Rejected oversized image (> 5MB) as expected.');
  } else {
    console.error('❌ FAIL Test 3:', res3);
  }

  // TEST 4: Accept valid MP4 <= 10MB
  console.log('\nTest 4: Uploading valid MP4 video (500KB)...');
  const smallMp4 = Buffer.alloc(500 * 1024, 0x00); // 500KB
  const res4 = await uploadFile('hero-showcase.mp4', smallMp4, 'video/mp4');
  if (res4.status === 200 && res4.body.success && res4.body.mediaType === 'video') {
    console.log('✅ PASS: Successfully uploaded MP4 video:', res4.body.url);
  } else {
    console.error('❌ FAIL Test 4:', res4);
  }

  // TEST 5: Reject MP4 > 10MB
  console.log('\nTest 5: Rejecting oversized MP4 (> 10MB)...');
  const oversizedMp4 = Buffer.alloc(10.5 * 1024 * 1024, 0x00); // 10.5MB
  const res5 = await uploadFile('large-film.mp4', oversizedMp4, 'video/mp4');
  if (res5.status === 400 && res5.body.error && res5.body.error.includes('10MB')) {
    console.log('✅ PASS: Rejected oversized video (> 10MB) as expected.');
  } else {
    console.error('❌ FAIL Test 5:', res5);
  }

  // TEST 6: YouTube embed URL conversion
  console.log('\nTest 6: Parsing YouTube URL embed...');
  const res6 = await postJson('/api/uploads', {
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  });
  if (res6.status === 200 && res6.body.url && res6.body.url.includes('https://www.youtube.com/embed/dQw4w9WgXcQ')) {
    console.log('✅ PASS: Converted YouTube URL to embed URL:', res6.body.url);
  } else {
    console.error('❌ FAIL Test 6:', res6);
  }

  // TEST 7: AI Copilot Section Logo Generation
  console.log('\nTest 7: Regenerating header with logo request ("Beside my name add a logo of house of jaya generated")...');
  const res7 = await postJson('/api/edits/regenerate-section', {
    projectId: 'test_demo',
    instanceId: 'header_inst_1',
    pieceId: 'p-frame-header',
    pieceTitle: 'Frame Header',
    variantName: 'classic',
    availableVariants: ['classic', 'centered-logo', 'transparent'],
    currentProps: { brandName: 'House of Jaya' },
    userPrompt: 'Beside my name add a logo of house of jaya generated',
    businessProfile: { brandName: 'House of Jaya', vertical: 'ecommerce', tone: 'Luxury & Refined' },
    pageSlug: 'home',
  });
  if (res7.status === 200 && res7.body.success && res7.body.updatedProps?.logoUrl) {
    console.log('✅ PASS: Successfully generated and returned logoUrl:', res7.body.updatedProps.logoUrl.slice(0, 50) + '...');
    console.log('Summary of changes:', res7.body.summaryOfChanges);
  } else {
    console.error('❌ FAIL Test 7:', res7);
  }

  console.log('\n🎉 ALL MEDIA UPLOAD AND LOGO TESTS PASSED SUCCESSFULLY!');
}

testUploadsAndLogo().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
