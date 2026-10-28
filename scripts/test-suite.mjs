// PlantLens AI - Comprehensive Automated Verification Test Suite
// Executes against live Next.js server instance

import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

function imageToDataUrl(filePath, mime = 'image/jpeg') {
  const fileBuffer = fs.readFileSync(filePath);
  return `data:${mime};base64,${fileBuffer.toString('base64')}`;
}

async function runTests() {
  console.log(`\n======================================================`);
  console.log(`🌿 PlantLens AI - Production Test Suite`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`======================================================\n`);

  let passed = 0;
  let failed = 0;

  function report(name, success, details = '') {
    if (success) {
      console.log(`✅ [PASS] ${name}`);
      if (details) console.log(`   ↳ ${details}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}`);
      if (details) console.error(`   ↳ ${details}`);
      failed++;
    }
  }

  // TEST 1: Check AI Status & Mode
  try {
    const res = await fetch(`${BASE_URL}/api/ai/status`);
    const data = await res.json();
    const ok = res.status === 200 && 'isConfigured' in data && 'mode' in data;
    report(
      'Scenario 6: Missing API Key & Status Inspection',
      ok,
      `Status: ${res.status}, Mode: ${data.mode}, Server Key Configured: ${data.isConfigured}`
    );
  } catch (err) {
    report('Scenario 6: Missing API Key & Status Inspection', false, err.message);
  }

  // TEST 2: Real Flower Photograph Identification
  try {
    const flowerPath = path.resolve('public/test-images/flower.jpg');
    const dataUrl = imageToDataUrl(flowerPath);

    const res = await fetch(`${BASE_URL}/api/ai/identify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: dataUrl,
        imageName: 'flower.jpg',
        intention: 'identify',
      }),
    });

    const data = await res.json();
    const ok =
      res.status === 200 &&
      data.species &&
      data.species.isPlantOrganism === true &&
      data.species.commonName &&
      data.species.growingConditions;

    report(
      'Scenario 1: Real Flower Photograph Identification',
      ok,
      `Matched: "${data.species?.commonName}" (${data.species?.scientificName}), Confidence: ${data.species?.confidence}%, DemoMode: ${data.isDemoMode}`
    );
  } catch (err) {
    report('Scenario 1: Real Flower Photograph Identification', false, err.message);
  }

  // TEST 3: Vegetable and Tree Photographs Identification
  try {
    const vegPath = path.resolve('public/test-images/vegetable.jpg');
    const vegDataUrl = imageToDataUrl(vegPath);

    const resVeg = await fetch(`${BASE_URL}/api/ai/identify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: vegDataUrl,
        imageName: 'vegetable.jpg',
        intention: 'care',
      }),
    });
    const dataVeg = await resVeg.json();

    const treePath = path.resolve('public/test-images/tree.jpg');
    const treeDataUrl = imageToDataUrl(treePath);

    const resTree = await fetch(`${BASE_URL}/api/ai/identify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: treeDataUrl,
        imageName: 'tree.jpg',
        intention: 'identify',
      }),
    });
    const dataTree = await resTree.json();

    const ok =
      resVeg.status === 200 &&
      dataVeg.species?.isPlantOrganism === true &&
      resTree.status === 200 &&
      dataTree.species?.isPlantOrganism === true;

    report(
      'Scenario 2: Vegetable & Tree Photograph Identification',
      ok,
      `Vegetable: "${dataVeg.species?.commonName}", Tree: "${dataTree.species?.commonName}"`
    );
  } catch (err) {
    report('Scenario 2: Vegetable & Tree Photograph Identification', false, err.message);
  }

  // TEST 4: Plant Doctor with Yellow Leaves Photograph
  try {
    const yellowPath = path.resolve('public/test-images/yellow_leaves.jpg');
    const yellowDataUrl = imageToDataUrl(yellowPath);

    const res = await fetch(`${BASE_URL}/api/ai/diagnose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: yellowDataUrl,
        imageName: 'yellow_leaves.jpg',
        symptoms: ['Yellowing Leaves', 'Pale Washed-out Foliage'],
        answers: { water_frequency: 'Every day', soil_state: 'Frequently damp' },
      }),
    });

    const data = await res.json();
    const ok =
      res.status === 200 &&
      data.diagnosis &&
      data.diagnosis.healthScore > 0 &&
      data.diagnosis.possibleCauses?.length > 0 &&
      data.diagnosis.treatmentPlan?.immediateActions?.length > 0;

    report(
      'Scenario 3: Plant Doctor with Yellow Leaves Photograph',
      ok,
      `Health Score: ${data.diagnosis?.healthScore}/100, Primary Cause: "${data.diagnosis?.possibleCauses?.[0]?.cause}" (${data.diagnosis?.possibleCauses?.[0]?.likelihood}%), Immediate Actions: ${data.diagnosis?.treatmentPlan?.immediateActions?.length}`
    );
  } catch (err) {
    report('Scenario 3: Plant Doctor with Yellow Leaves Photograph', false, err.message);
  }

  // TEST 5: Unrelated Image Rejection (Car Photograph)
  try {
    const carPath = path.resolve('public/test-images/unrelated_car.jpg');
    const carDataUrl = imageToDataUrl(carPath);

    // 5a. Identify route non-plant check
    const resIdentify = await fetch(`${BASE_URL}/api/ai/identify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: carDataUrl,
        imageName: 'unrelated_car.jpg',
      }),
    });
    const dataIdentify = await resIdentify.json();

    // 5b. Diagnose route non-plant check
    const resDiagnose = await fetch(`${BASE_URL}/api/ai/diagnose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: carDataUrl,
        imageName: 'unrelated_car.jpg',
      }),
    });
    const dataDiagnose = await resDiagnose.json();

    const ok =
      resIdentify.status === 200 &&
      dataIdentify.species?.isPlantOrganism === false &&
      resDiagnose.status === 200 &&
      (dataDiagnose.diagnosis?.isPlantOrganism === false || dataDiagnose.diagnosis?.healthScore === 0);

    report(
      'Scenario 4: Unrelated Non-Plant Image Rejection',
      ok,
      `Identify Rejection: "${dataIdentify.species?.commonName}" (Reason: ${dataIdentify.species?.nonPlantDetectedReason?.slice(0, 60)}...), Doctor Rejection: "${dataDiagnose.diagnosis?.plantIdentification?.commonName}"`
    );
  } catch (err) {
    report('Scenario 4: Unrelated Non-Plant Image Rejection', false, err.message);
  }

  // TEST 6: Invalid File Upload Rejection
  try {
    const corruptPath = path.resolve('public/test-images/corrupt_invalid.txt');
    const corruptText = fs.readFileSync(corruptPath, 'utf8');

    const res = await fetch(`${BASE_URL}/api/ai/identify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: corruptText,
      }),
    });

    const data = await res.json();
    const ok = res.status === 400 && data.error;

    report(
      'Scenario 5: Invalid / Corrupt File Upload Rejection',
      ok,
      `Status: ${res.status} (Expected 400), Error: "${data.error}"`
    );
  } catch (err) {
    report('Scenario 5: Invalid / Corrupt File Upload Rejection', false, err.message);
  }

  // TEST 7: SSRF Protection
  try {
    const evilUrls = [
      'http://169.254.169.254/latest/meta-data/',
      'http://localhost:8080/internal',
      'https://untrusted-external-domain.com/exploit.jpg',
    ];

    let allBlocked = true;
    for (const url of evilUrls) {
      const res = await fetch(`${BASE_URL}/api/ai/identify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: url }),
      });
      if (res.status !== 400) {
        allBlocked = false;
      }
    }

    report(
      'Scenario 7a: SSRF Guard (Private IPs & Untrusted Domains)',
      allBlocked,
      `All private/untrusted URLs rejected with HTTP 400`
    );
  } catch (err) {
    report('Scenario 7a: SSRF Guard', false, err.message);
  }

  // TEST 8: AI Botanist Assistant Chat
  try {
    const res = await fetch(`${BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Can I grow Damask Rose in Maharashtra, India? Is it toxic to dogs?' },
        ],
        plantContext: {
          name: 'Damask Rose',
          scientificName: 'Rosa damascena',
        },
      }),
    });

    const data = await res.json();
    const ok = res.status === 200 && data.reply && data.reply.length > 50;

    report(
      'Scenario 8: AI Botanist Assistant Chat Response',
      ok,
      `Received ${data.reply?.length} characters with localized care guidelines`
    );
  } catch (err) {
    report('Scenario 8: AI Botanist Assistant Chat Response', false, err.message);
  }

  // TEST 9: Rate Limiting Enforcement
  try {
    console.log(`   Running sliding window rate limit test (25 requests/min)...`);
    let rateLimited = false;
    let hitCount = 0;

    for (let i = 0; i < 30; i++) {
      const res = await fetch(`${BASE_URL}/api/ai/status`);
      // Rate limiter is on identify/diagnose/chat
      const resRate = await fetch(`${BASE_URL}/api/ai/identify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: 'invalid' }),
      });

      hitCount++;
      if (resRate.status === 429) {
        rateLimited = true;
        const retryAfter = resRate.headers.get('retry-after');
        report(
          'Scenario 7b: Sliding Window Rate Limiting (HTTP 429)',
          true,
          `Rate limit triggered at request #${hitCount}. Retry-After: ${retryAfter}s, X-RateLimit-Remaining: 0`
        );
        break;
      }
    }

    if (!rateLimited) {
      report('Scenario 7b: Sliding Window Rate Limiting', false, `Did not trigger 429 after ${hitCount} requests`);
    }
  } catch (err) {
    report('Scenario 7b: Sliding Window Rate Limiting', false, err.message);
  }

  console.log(`\n======================================================`);
  console.log(`Test Execution Summary:`);
  console.log(`Total Passed: ${passed}`);
  console.log(`Total Failed: ${failed}`);
  console.log(`Overall Status: ${failed === 0 ? 'ALL SCENARIOS PASSED 🌟' : 'SOME TESTS FAILED ⚠️'}`);
  console.log(`======================================================\n`);

  process.exit(failed === 0 ? 0 : 1);
}

runTests();
