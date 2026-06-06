// apps/api/src/services/ai.js
const OpenAI = require('openai');
const { AiSummary } = require('@shopify-autopilot/shared');
const { OPENAI_API_KEY } = require('../config/env');

// Don't initialize at module load — initialize lazily on first call
let openaiClient = null;

function getOpenAiClient() {
  if (!openaiClient) {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    openaiClient = new OpenAI({ apiKey: OPENAI_API_KEY });
  }
  return openaiClient;
}

async function getAiSummary(tenantId, metricsData) {
  const now = new Date();

  const cached = await AiSummary.findOne({ tenantId });
  if (cached && cached.expiresAt > now) {
    return {
      summary:     cached.summary,
      topInsight:  cached.topInsight,
      alerts:      cached.alerts,
      generatedAt: cached.generatedAt,
      fromCache:   true,
    };
  }

  const prompt = buildPrompt(metricsData);

  try {
    const openai = getOpenAiClient(); // only crashes here, not at startup

    const response = await openai.chat.completions.create({
      model:           'gpt-4o',
      max_tokens:      600,
      temperature:     0.3,
      messages: [
        {
          role:    'system',
          content: `You are an e-commerce analytics assistant. 
You analyze store performance data and provide clear, actionable insights.
Always respond with valid JSON matching the exact schema provided.
Be specific with numbers. Keep language direct and professional.`,
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(response.choices[0].message.content);

    const result = {
      summary:     parsed.summary     || 'Summary unavailable.',
      topInsight:  parsed.topInsight  || 'No insight available.',
      alerts:      Array.isArray(parsed.alerts) ? parsed.alerts : [],
      generatedAt: now,
    };

    await AiSummary.findOneAndUpdate(
      { tenantId },
      { ...result, expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) },
      { upsert: true, new: true }
    );

    return { ...result, fromCache: false };

  } catch (err) {
    console.error(`[AI] GPT-4o call failed:`, err.message);
    return {
      summary:    'AI analysis temporarily unavailable. Your metrics are shown below.',
      topInsight: null,
      alerts:     [],
      generatedAt: now,
      fromCache:  false,
      error:      true,
    };
  }
}

/**
 * Build the GPT-4o prompt from aggregated metrics.
 * CRITICAL: Only aggregated numbers go in here — no customer emails,
 * no order IDs, no PII of any kind.
 */
function buildPrompt(data) {
  const {
    revenue30d, revenue7d, orders30d, orders7d,
    topProducts, slowProducts, revenueByDay,
    activeCampaigns, currency = 'USD',
  } = data;

  const avgOrderValue30d = orders30d > 0
    ? (revenue30d / orders30d).toFixed(2)
    : 0;

  const revenueGrowth = revenue7d && revenue30d
    ? (((revenue7d / 7) / (revenue30d / 30) - 1) * 100).toFixed(1)
    : 0;

  // Format top products for the prompt
  const topProductsList = (topProducts || [])
    .slice(0, 5)
    .map(p => `  - ${p.title}: ${p.unitsSold7d} units sold (last 7 days), velocity ${p.velocityPerDay?.toFixed(1)}/day`)
    .join('\n');

  const slowProductsList = (slowProducts || [])
    .slice(0, 3)
    .map(p => `  - ${p.title}: ${p.unitsSold7d} units sold (last 7 days), ${p.inventory} units in stock`)
    .join('\n');

  return `
Analyze this e-commerce store performance and respond with JSON.

STORE METRICS (last 30 days):
- Total revenue: ${currency} ${revenue30d?.toFixed(2)}
- Total orders: ${orders30d}
- Average order value: ${currency} ${avgOrderValue30d}
- Revenue last 7 days: ${currency} ${revenue7d?.toFixed(2)}
- Orders last 7 days: ${orders7d}
- Revenue growth trend (7d vs 30d daily avg): ${revenueGrowth}%
- Active discount campaigns: ${activeCampaigns}

TOP SELLING PRODUCTS:
${topProductsList || '  No sales data yet'}

SLOW MOVING PRODUCTS:
${slowProductsList || '  No slow products identified'}

Respond ONLY with this exact JSON schema:
{
  "summary": "2-3 sentence plain English summary of overall store performance",
  "topInsight": "The single most important actionable insight for the store owner",
  "alerts": ["alert 1 if any", "alert 2 if any"]
}

Rules:
- summary: factual, mention specific revenue numbers
- topInsight: one clear action the owner should take
- alerts: 0-3 items, only real issues (low stock, declining revenue, etc)
- No markdown, no asterisks, plain text only
`;
}

module.exports = { getAiSummary };