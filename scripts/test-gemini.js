const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

async function testModels() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const candidates = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-3.8-flash', 'gemini-3.5-flash-lite'];
  for (const m of candidates) {
    try {
      console.log(`Testing model: ${m}...`);
      const res = await ai.models.generateContent({
        model: m,
        contents: 'Say: Hello Website Studio',
      });
      console.log(`SUCCESS with ${m}:`, res.text.trim());
      console.log('Usage:', res.usageMetadata);
      break;
    } catch (err) {
      console.log(`Failed with ${m}:`, err.message || err.status);
    }
  }
}

testModels();
