'use strict';

const ARKESEL_URL = 'https://sms.arkesel.com/api/v2/sms/send';

function isConfigured() {
  return Boolean(process.env.ARKESEL_API_KEY && process.env.ARKESEL_SENDER_ID);
}

/**
 * Ghana numbers in the roll are stored as 0XXXXXXXXX.
 * Arkesel expects 233XXXXXXXXX with no plus sign.
 */
function toArkeselNumber(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('233') && digits.length === 12) return digits;
  if (digits.startsWith('0') && digits.length === 10) return `233${digits.slice(1)}`;
  if (digits.length === 9) return `233${digits}`;
  return null;
}

async function sendSms({ recipients, message }) {
  if (!isConfigured()) {
    const error = new Error('Arkesel is not configured. Set ARKESEL_API_KEY and ARKESEL_SENDER_ID in backend/.env');
    error.status = 503;
    throw error;
  }

  const response = await fetch(ARKESEL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.ARKESEL_API_KEY,
    },
    body: JSON.stringify({
      sender: process.env.ARKESEL_SENDER_ID,
      message,
      recipients,
    }),
    signal: AbortSignal.timeout(20000),
  });

  const body = await response.json().catch(() => ({}));
  const failed = !response.ok || String(body.status || '').toLowerCase() === 'error';
  if (failed) {
    const error = new Error(body.message || body.error || `Arkesel rejected the message (${response.status})`);
    error.status = response.status >= 400 && response.status < 500 ? 400 : 502;
    throw error;
  }

  const data = body.data;
  const providerId = Array.isArray(data) ? data[0]?.id : data?.id || data?.batch_id || null;
  return { providerId, raw: body };
}

module.exports = { isConfigured, toArkeselNumber, sendSms };
