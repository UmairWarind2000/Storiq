// packages/shared/services/emailService.js

/**
 * Sends emails via Resend.
 * Falls back to console.log if RESEND_API_KEY is not set (dev mode).
 */

let resendClient = null;

function getResendClient() {
  if (!resendClient) {
    const { Resend } = require('resend');
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY is not set');
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

async function sendEmail({ to, subject, html, text }) {
  if (!process.env.RESEND_API_KEY) {
    // Dev mode — just log the email
    console.log('[Email] DEV MODE — email not sent. Would have sent:');
    console.log(`  To:      ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body:    ${text || html}`);
    return { dev: true };
  }

  try {
    const resend = getResendClient();

    const fromAddress = process.env.RESEND_FROM_EMAIL || 'Storiq <onboarding@resend.dev>';

    const { data, error } = await resend.emails.send({
      from:    fromAddress,
      to:      [to],
      subject,
      html:    html || `<p>${text}</p>`,
      text:    text || undefined,
    });

    if (error) {
      console.error('[Email] Resend error:', error.message);
      return { sent: false, error: error.message };
    }

    console.log(`[Email] Sent to ${to}: ${subject} (id: ${data.id})`);
    return { sent: true, id: data.id };

  } catch (err) {
    console.error('[Email] Resend exception:', err.message);
    return { sent: false, error: err.message };
  }
}

module.exports = { sendEmail };