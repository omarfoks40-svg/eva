const axios = require('axios');
const DEFAULT_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o-mini';

function getApiKey() { return process.env.MIKO_API_KEY || process.env.OPENAI_API_KEY || process.env.AI_API_KEY || ''; }
function getAnswer(data) {
  const content = data?.choices?.[0]?.message?.content;
  if (Array.isArray(content)) return content.map(item => item.text || '').join('');
  return String(content || '').trim();
}
async function chat({ messages, temperature = 0.7, maxTokens = 5000 }) {
  const apiKey = getApiKey();
  if (!apiKey) { const error = new Error('MIKO_API_KEY or OPENAI_API_KEY is not configured'); error.code = 'MIKO_KEY_MISSING'; throw error; }
  if (!Array.isArray(messages) || !messages.length) throw new Error('messages must be a non-empty array');
  const response = await axios.post(process.env.AI_BASE_URL || DEFAULT_URL, {
    model: process.env.AI_MODEL || DEFAULT_MODEL,
    temperature,
    max_tokens: Number(process.env.AI_MAX_TOKENS || maxTokens),
    messages
  }, { headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' }, timeout: Number(process.env.MIKO_API_TIMEOUT || 120000) });
  return response.data;
}
function mount(app) {
  app.get('/api/miko/health', (req, res) => res.status(200).json({ service: 'miko', status: 'online', providerConfigured: Boolean(getApiKey()), model: process.env.AI_MODEL || DEFAULT_MODEL }));
  app.post('/api/miko/chat', async (req, res) => {
    const token = process.env.MIKO_API_TOKEN;
    if (!token) return res.status(503).json({ error: 'MIKO_API_TOKEN is not configured' });
    if ((req.get('authorization') || '') !== 'Bearer ' + token) return res.status(401).json({ error: 'Unauthorized' });
    try { return res.status(200).json(await chat({ messages: req.body?.messages, temperature: req.body?.temperature, maxTokens: req.body?.maxTokens })); }
    catch (error) { console.error('[MIKO API ERROR]', error.response?.data || error.message); return res.status(error.code === 'MIKO_KEY_MISSING' ? 503 : (error.response?.status || 502)).json({ error: 'Miko AI provider is unavailable' }); }
  });
}
module.exports = { chat, getAnswer, mount };
