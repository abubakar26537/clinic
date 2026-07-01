const { askGemini } = require('../lib/geminiClient');
const { isRateLimited } = require('../lib/rateLimit');

module.exports = async function handler(req, res) {
  // Allow the same-origin frontend (and any origin you list) to call this.
  const allowedOrigin = process.env.ALLOWED_ORIGINS || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  if (isRateLimited(ip)) {
    return res.status(429).json({
      error: 'Too many messages. Please wait a few minutes and try again, or call the clinic directly.'
    });
  }

  try {
    const { message, history } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'A non-empty "message" string is required.' });
    }
    if (message.length > 1000) {
      return res.status(400).json({ error: 'Message is too long. Please keep it under 1000 characters.' });
    }

    const safeHistory = Array.isArray(history)
      ? history
          .filter((h) => h && typeof h.text === 'string')
          .slice(-10)
          .map((h) => ({ role: h.role === 'model' ? 'model' : 'user', text: String(h.text).slice(0, 1000) }))
      : [];

    const reply = await askGemini(message.trim(), safeHistory);
    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Chat function error:', err.message);
    return res.status(500).json({
      error: 'The assistant is temporarily unavailable. Please try again shortly or call the clinic front desk.'
    });
  }
};
