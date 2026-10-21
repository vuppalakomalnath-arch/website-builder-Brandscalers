require('dotenv').config();
const { executeGenerationPipeline } = require('../engine/orchestration/runner');

const BENCHMARK_BRIEFS = [
  {
    name: 'Lumina Dental Care (Healthcare / Clinic)',
    businessName: 'Lumina Dental Care',
    businessCategory: 'Dental Clinic',
    offeringsAndGoals: 'Preventative family dentistry, cosmetic veneers, and restorative implants. Our goal is to enable patients to schedule appointments online directly.',
  },
  {
    name: 'Osteria Rustica (Food & Hospitality)',
    businessName: 'Osteria Rustica',
    businessCategory: 'Italian Bistro & Bakery',
    offeringsAndGoals: 'Wood-fired sourdough pizzas, fresh handmade pasta, and natural wines. We want visitors to explore our seasonal menu and reserve tables online.',
  },
  {
    name: 'Kanso Botanicals (D2C Brand)',
    businessName: 'Kanso Botanicals',
    businessCategory: 'Organic Skincare D2C',
    offeringsAndGoals: 'Cold-pressed botanical serums and soothing face balms. Goal is to showcase ingredient purity and drive online product orders.',
  },
];

async function runBenchmark() {
  console.log('====================================================');
  console.log('   WEBSITE STUDIO SSOT v2.1 BENCHMARK SUITE');
  console.log('====================================================\n');

  const results = [];

  for (const brief of BENCHMARK_BRIEFS) {
    console.log(`Running benchmark for: "${brief.name}"...`);
    const startTime = Date.now();

    try {
      const output = await executeGenerationPipeline({ brief });
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      const passCost = output.estimatedAiCostINR <= 8.0;
      const passQuestions = (output.questions || []).length <= 4;
      const passQuality = output.qualityReport?.overallStatus !== 'blocked';

      console.log(`  -> Duration: ${duration}s`);
      console.log(`  -> Stage: ${output.currentStage}`);
      console.log(`  -> Estimated AI Cost: ₹${output.estimatedAiCostINR.toFixed(4)} (Target ≤ ₹8.00: ${passCost ? 'PASS' : 'FAIL'})`);
      console.log(`  -> Adaptive Questions: ${output.questions?.length || 0} (Target ≤ 4: ${passQuestions ? 'PASS' : 'FAIL'})`);
      console.log(`  -> QA Status: ${output.qualityReport?.overallStatus} (Pass: ${passQuality ? 'PASS' : 'FAIL'})\n`);

      results.push({
        name: brief.name,
        duration: `${duration}s`,
        costINR: `₹${output.estimatedAiCostINR.toFixed(4)}`,
        passCost,
        questionsCount: output.questions?.length || 0,
        passQuestions,
        qaStatus: output.qualityReport?.overallStatus,
        passQuality,
      });
    } catch (err) {
      console.error(`  -> Failed for ${brief.name}:`, err.message || err);
      results.push({
        name: brief.name,
        error: err.message,
      });
    }
  }

  console.log('====================================================');
  console.log('   BENCHMARK SUMMARY REPORT');
  console.log('====================================================');
  console.table(results);
}

runBenchmark();
