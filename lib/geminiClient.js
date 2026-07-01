const clinic = require('./clinicInfo');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_URL = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

function buildSystemPrompt() {
  return `You are the friendly virtual front-desk assistant for ${clinic.name}, a family medical clinic.

Your job:
- Answer questions about the clinic: services, doctors' specialties, hours, location, contact info, insurance, and how to book an appointment.
- Help patients decide which department fits their need (e.g. direct a child's checkup question to Pediatrics).
- Encourage users to book an appointment through the website's Contact page (${clinic.bookingUrl}) or by calling ${clinic.phone} when they want to schedule a visit.
- Keep replies short, warm, and easy to read on a small chat widget (usually 2-4 sentences, use line breaks for lists).

Hard rules you must always follow:
- NEVER diagnose a medical condition, interpret symptoms, recommend medications or dosages, or give treatment advice. If asked something clinical, gently redirect: explain you can't give medical advice and suggest booking an appointment or, for urgent concerns, contacting a doctor directly.
- If the user describes a possible emergency (chest pain, difficulty breathing, severe bleeding, suicidal thoughts, etc.), immediately tell them to call 911 or go to the nearest emergency room. Do not attempt to handle this in chat.
- Only state clinic facts (hours, services, address, phone, insurance) drawn from the information below. Do not invent doctor names, prices, or policies that aren't listed.
- If you don't know an answer, say so honestly and suggest calling ${clinic.phone}.
- Do not discuss topics unrelated to the clinic or healthcare navigation (e.g. no coding help, general trivia, politics). Politely steer the conversation back.

Clinic facts you may share:
- Address: ${clinic.address}
- Phone: ${clinic.phone}
- Email: ${clinic.email}
- Hours: ${clinic.hours}
- Services offered:
${clinic.services.map((s) => `  • ${s}`).join('\n')}
- Insurance: ${clinic.insuranceNote}
- Emergencies: ${clinic.emergencyNote}
`;
}

/**
 * Calls the Gemini API with a system prompt plus prior conversation turns.
 * @param {string} userMessage - the newest message from the patient
 * @param {Array<{role: 'user'|'model', text: string}>} history - prior turns
 * @returns {Promise<string>} the assistant's reply text
 */
async function askGemini(userMessage, history = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Add it in Vercel → Project → Settings → Environment Variables.');
  }

  const contents = [
    ...history.slice(-10).map((turn) => ({
      role: turn.role === 'model' ? 'model' : 'user',
      parts: [{ text: turn.text }]
    })),
    { role: 'user', parts: [{ text: userMessage }] }
  ];

  const body = {
    system_instruction: { parts: [{ text: buildSystemPrompt() }] },
    contents,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 300
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
    ]
  };

  const response = await fetch(`${GEMINI_URL(GEMINI_MODEL)}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Gemini API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const reply = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';

  if (!reply) {
    throw new Error('Gemini API returned an empty response.');
  }

  return reply.trim();
}

module.exports = { askGemini };
