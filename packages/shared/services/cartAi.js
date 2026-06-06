// packages/shared/services/cartAi.js

let openaiClient = null;

function getOpenAiClient() {
  if (!openaiClient) {
    const OpenAI = require('openai');
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not set');
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * Generate a personalized abandoned cart recovery email.
 * Falls back to a template if OpenAI key is missing.
 */
async function generateCartRecoveryEmail({ customerEmail, lineItems, totalValue, storeName }) {
  if (!process.env.OPENAI_API_KEY) {
    console.log('[CartAI] No API key — using template email');
    return templateEmail({ customerEmail, lineItems, totalValue, storeName });
  }

  try {
    const openai = getOpenAiClient();

    const productList = lineItems
      .map(i => `${i.productTitle} (qty: ${i.quantity}, $${i.price})`)
      .join(', ');

    const response = await openai.chat.completions.create({
      model:       'gpt-4o',
      max_tokens:  400,
      temperature: 0.6,
      messages: [
        {
          role:    'system',
          content: `You are a friendly e-commerce email copywriter.
Write short, warm, non-pushy abandoned cart recovery emails.
Always respond with valid JSON.`,
        },
        {
          role: 'user',
          content: `Write an abandoned cart recovery email for:
- Store: ${storeName || 'our store'}
- Cart total: $${totalValue?.toFixed(2)}
- Items: ${productList}

Respond with this exact JSON:
{
  "subject": "email subject line",
  "body": "2-3 sentence plain text email body"
}

Rules:
- Friendly and conversational tone
- Mention one specific product by name
- No discount offers (we save those for follow-up)
- No markdown or HTML in the body`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    return {
      subject: parsed.subject || `You left something behind`,
      html:    `<p>${parsed.body}</p>`,
      text:    parsed.body,
    };

  } catch (err) {
    console.error('[CartAI] GPT-4o failed:', err.message);
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