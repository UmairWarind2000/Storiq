// apps/api/src/services/ai.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AiSummary } = require('@shopify-autopilot/shared');
const { GEMINI_API_KEY } = require('../config/env');

let geminiClient = null;

function getGeminiClient() {
  if (!geminiClient) {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    geminiClient = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return geminiClient;
}

/**
 * Generate or return cached AI summary for a tenant.
 * Uses Gemini 2.5 Flash — fast, free-tier friendly, good at structured JSON output.
 */
async function getAiSummary(tenantId, metricsData) {
  const now = new Date();

  // 1. Return cached summary if still valid
  const cached = await AiSummary.findOne({ tenantId });
  if (cached && cached.expiresAt > now) {
    console.log(`[AI] Returning cached summary for ${tenantId}`);
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
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature:      0.3,
        maxOutputTokens:  600,
        responseMimeType: 'application/json', // forces valid JSON output
      },
    });

    console.log(`[AI] Generating new summary for ${tenantId} via Gemini`);

    const result   = await model.generateContent(prompt);
    const rawText  = result.response.text();
    const parsed   = JSON.parse(rawText);

    const summaryResult = {
      summary:     parsed.summary     || 'Summary unavailable.',
      topInsight:  parsed.topInsight  || 'No insight available.',
      alerts:      Array.isArray(parsed.alerts) ? parsed.alerts : [],
      generatedAt: now,
    };

    // Cache for 24 hours
    await AiSummary.findOneAndUpdate(
      { tenantId },
      {
        ...summaryResult,
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      },
      { upsert: true, new: true }
    );

    return { ...summaryResult, fromCache: false };

  } catch (err) {
    console.error(`[AI] Gemini call failed for ${tenantId}:`, err.message);

    return {
      summary:     'AI analysis is temporarily unavailable. Your metrics are shown below.',
      topInsight:  null,
      alerts:      [],
      generatedAt: now,
      fromCache:   false,
      error:       true,
    };
  }
}

/**
 * Build the Gemini prompt from aggregated metrics.
 * Only aggregated numbers go in here — no PII.
 */
function buildPrompt(data) {
  const {
    revenue30d, revenue7d, orders30d, orders7d,
    topProducts, slowProducts, activeCampaigns,
    currency = 'USD',
  } = data;

  const avgOrderValue30d = orders30d > 0
    ? (revenue30d / orders30d).toFixed(2)
    : 0;

  const revenueGrowth = revenue7d && revenue30d
    ? (((revenue7d / 7) / (revenue30d / 30) - 1) * 100).toFixed(1)
    : 0;

  const topProductsList = (topProducts || [])
    .slice(0, 5)
    .map(p => `  - ${p.title}: ${p.unitsSold7d} units sold (last 7 days), velocity ${p.velocityPerDay?.toFixed(1)}/day`)
    .join('\n');

  const slowProductsList = (slowProducts || [])
    .slice(0, 3)
    .map(p => `  - ${p.title}: ${p.unitsSold7d} units sold (last 7 days), ${p.inventory} units in stock`)
    .join('\n');

  return `
You are an e-commerce analytics assistant. Analyze this store performance data and respond with ONLY valid JSON, no markdown, no code fences, no extra text.

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

Respond with EXACTLY this JSON schema and nothing else:
{
  "summary": "2-3 sentence plain English summary of overall store performance, mention specific revenue numbers",
  "topInsight": "The single most important actionable insight for the store owner",
  "alerts": ["alert 1 if any real issue exists", "alert 2 if any"]
}

Rules:
- summary: factual, mention specific revenue numbers
- topInsight: one clear action the owner should take
- alerts: 0-3 items, only real issues (low stock, declining revenue, etc), empty array if none
- No markdown, no asterisks, plain text only inside the JSON values
`;
}

module.exports = { getAiSummary };