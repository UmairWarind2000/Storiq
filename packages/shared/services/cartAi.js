// packages/shared/services/cartAi.js
let geminiClient = null;

function getGeminiClient() {
  if (!geminiClient) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not set');
    geminiClient = new GoogleGenerativeAI(apiKey);
  }
  return geminiClient;
}

/**
 * Generate a personalized abandoned cart recovery email via Gemini.
 * Falls back to a template if GEMINI_API_KEY is missing.
 */
async function generateCartRecoveryEmail({ customerEmail, lineItems, totalValue, storeName }) {
  if (!process.env.GEMINI_API_KEY) {
    console.log('[CartAI] No Gemini API key — using template email');
    return templateEmail({ customerEmail, lineItems, totalValue, storeName });
  }

  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature:      0.6,
        maxOutputTokens:  400,
        responseMimeType: 'application/json',
      },
    });

    const productList = lineItems
      .map(i => `${i.productTitle} (qty: ${i.quantity}, $${i.price})`)
      .join(', ');

    const prompt = `
You are a friendly e-commerce email copywriter. Write a short, warm, non-pushy abandoned cart recovery email. Respond with ONLY valid JSON, no markdown, no code fences.

Store: ${storeName || 'our store'}
Cart total: $${totalValue?.toFixed(2)}
Items: ${productList}

Respond with EXACTLY this JSON schema and nothing else:
{
  "subject": "email subject line",
  "body": "2-3 sentence plain text email body"
}

Rules:
- Friendly and conversational tone
- Mention one specific product by name
- No discount offers
- No markdown or HTML in the body, plain text only
`;

    const result  = await model.generateContent(prompt);
    const rawText = result.response.text();
    const parsed  = JSON.parse(rawText);

    return {
      subject: parsed.subject || 'You left something behind',
      html:    `<p>${parsed.body}</p>`,
      text:    parsed.body,
    };

  } catch (err) {
    console.error('[CartAI] Gemini call failed:', err.message);
    return templateEmail({ customerEmail, lineItems, totalValue, storeName });
  }
}

function templateEmail({ lineItems, totalValue, storeName }) {
  const firstItem = lineItems[0]?.productTitle || 'your items';
  const subject   = `You left something behind — ${firstItem}`;
  const body      = `Hi there! You left ${firstItem} and ${lineItems.length > 1 ? `${lineItems.length - 1} other item(s)` : 'more'} in your cart at ${storeName || 'our store'}. Your cart total is $${totalValue?.toFixed(2)}. Come back and complete your purchase!`;

  return {
    subject,
    html: `<p>${body}</p>`,
    text: body,
  };
}

module.exports = { generateCartRecoveryEmail };