// packages/shared/services/campaignAi.js
let openaiClient = null;

function getOpenAiClient() {
  if (!openaiClient) {
    const OpenAI = require('openai');
    const apiKey = process.env.OPENAI_API_KEY;  // read directly from process.env
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

async function recommendCampaigns(slowProducts) {
  if (!process.env.OPENAI_API_KEY) {
    console.log('[CampaignAI] No API key — using mock recommendations');
    return mockRecommendations(slowProducts);
  }

  try {
    const openai = getOpenAiClient();
    const prompt = buildCampaignPrompt(slowProducts);

    const response = await openai.chat.completions.create({
      model:           'gpt-4o',
      max_tokens:      800,
      temperature:     0.2,
      messages: [
        {
          role:    'system',
          content: `You are an e-commerce pricing strategist.
Analyze slow-moving products and recommend discount campaigns.
Always respond with valid JSON matching the exact schema provided.
Be conservative with discounts — recommend the minimum needed to drive sales.`,
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    return parsed.recommendations || [];

  } catch (err) {
    console.error('[CampaignAI] GPT-4o failed:', err.message);
    return mockRecommendations(slowProducts);
  }
}

function buildCampaignPrompt(products) {
  const productList = products.map(p =>
    `- ${p.title}: price $${p.price}, velocity ${p.velocityPerDay?.toFixed(2)}/day, ` +
    `${p.unitsSold7d} sold last 7 days, ${p.inventory} in stock`
  ).join('\n');

  return `
Analyze these slow-moving products and recommend discount campaigns.

SLOW PRODUCTS:
${productList}

Respond with this exact JSON:
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
- confidenceScore: 0.0 to 1.0
- Max 3 recommendations
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