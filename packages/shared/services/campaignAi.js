// packages/shared/services/campaignAi.js
let geminiClient = null;

function getGeminiClient() {
  if (!geminiClient) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    geminiClient = new GoogleGenerativeAI(apiKey);
  }
  return geminiClient;
}

/**
 * Analyze slow products and recommend discount campaigns via Gemini.
 * Falls back to mock recommendations if GEMINI_API_KEY is missing.
 */
async function recommendCampaigns(slowProducts) {
  if (!process.env.GEMINI_API_KEY) {
    console.log('[CampaignAI] No Gemini API key — using mock recommendations');
    return mockRecommendations(slowProducts);
  }

  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature:      0.2,
        maxOutputTokens:  800,
        responseMimeType: 'application/json',
      },
    });

    const prompt = buildCampaignPrompt(slowProducts);

    const result  = await model.generateContent(prompt);
    const rawText = result.response.text();
    const parsed  = JSON.parse(rawText);

    return parsed.recommendations || [];

  } catch (err) {
    console.error('[CampaignAI] Gemini call failed:', err.message);
    return mockRecommendations(slowProducts);
  }
}

function buildCampaignPrompt(products) {
  const productList = products.map(p =>
    `- ${p.title}: price $${p.price}, velocity ${p.velocityPerDay?.toFixed(2)}/day, ` +
    `${p.unitsSold7d} sold last 7 days, ${p.inventory} in stock`
  ).join('\n');

  return `
You are an e-commerce pricing strategist. Analyze these slow-moving products and recommend discount campaigns. Respond with ONLY valid JSON, no markdown, no code fences.

SLOW PRODUCTS:
${productList}

Respond with EXACTLY this JSON schema and nothing else:
{
  "recommendations": [
    {
      "shopifyProductId": "product id",
      "productTitle": "product name",
      "discountPct": 15,
      "durationDays": 7,
      "confidenceScore": 0.85,
      "reasoning": "one sentence explanation"
    }
  ]
}

Rules:
- Only recommend products that genuinely need a boost
- discountPct: between 10 and 40 only
- durationDays: 7, 14, or 30 only
- confidenceScore: 0.0 to 1.0 (how confident you are this will help)
- If a product is fine, exclude it from recommendations
- Max 3 recommendations
- Be conservative — recommend the minimum discount needed to drive sales
`;
}

function mockRecommendations(products) {
  return products.slice(0, 3).map((p, i) => ({
    shopifyProductId: p.shopifyProductId,
    productTitle:     p.title,
    discountPct:      [15, 20, 25][i] || 15,
    durationDays:     [7, 14, 7][i]   || 7,
    confidenceScore:  [0.87, 0.76, 0.65][i] || 0.70,
    reasoning:        `${p.title} has sold only ${p.unitsSold7d} units in 7 days. A discount should accelerate sales.`,
  }));
}

module.exports = { recommendCampaigns };