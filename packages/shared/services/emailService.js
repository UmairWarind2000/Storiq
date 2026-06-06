// packages/shared/services/emailService.js

/**
 * Sends emails via SendGrid.
 * Falls back to console.log if SENDGRID_API_KEY is not set (dev mode).
 */

let sgMail = null;

function getSendGridClient() {
  if (!sgMail) {
    sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }
  return sgMail;
}

async function sendEmail({ to, subject, html, text }) {
  if (!process.env.SENDGRID_API_KEY) {
    // Dev mode — just log the email
    console.log('[Email] DEV MODE — email not sent. Would have sent:');
    console.log(`  To:      ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body:    ${text || html}`);
    return { dev: true };
  }

  const mail = getSendGridClient();

  await mail.send({
    to,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@storiq.app',
    subject,
    html,
    text,
  });

  console.log(`[Email] Sent to ${to}: ${subject}`);
  return { sent: true };
}

module.exports = { sendEmail };