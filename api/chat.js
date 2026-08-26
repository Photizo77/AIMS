// api/chat.js
// ============================================================
// VERCEL FUNCTION — secure proxy for all 4 AI providers.
// (Vercel convention: api/*.js serves /api/*)
// Env keys (set in Vercel): ANTHROPIC_API_KEY, OPENAI_API_KEY,
// DEEPSEEK_API_KEY, QWEN_API_KEY
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { messages, model, systemPrompt } = req.body || {};

    if (!messages || !model) {
      res.status(400).json({ error: 'Missing messages or model' });
      return;
    }

    let reply = '';

    // ─── CLAUDE ───
    if (model.startsWith('claude')) {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await anthropic.messages.create({
        model,
        max_tokens: 2048,
        system: systemPrompt || 'You are a helpful grant writing assistant for Ardhi.',
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      });
      reply = response.content[0].text;
    }

    // ─── OPENAI (ChatGPT) ───
    else if (model.startsWith('gpt')) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt || 'You are a helpful grant writing assistant for Ardhi.' },
          ...messages,
        ],
      });
      reply = completion.choices[0].message.content;
    }

    // ─── DEEPSEEK (OpenAI-compatible) ───
    else if (model.startsWith('deepseek')) {
      const deepseek = new OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com',
      });
      const completion = await deepseek.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt || 'You are a helpful grant writing assistant for Ardhi.' },
          ...messages,
        ],
      });
      reply = completion.choices[0].message.content;
    }

    // ─── QWEN (OpenAI-compatible via DashScope) ───
    else if (model.startsWith('qwen')) {
      const qwen = new OpenAI({
        apiKey: process.env.QWEN_API_KEY,
        baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
      });
      const completion = await qwen.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt || 'You are a helpful grant writing assistant for Ardhi.' },
          ...messages,
        ],
      });
      reply = completion.choices[0].message.content;
    }

    else {
      res.status(400).json({ error: 'Unknown model' });
      return;
    }

    res.status(200).json({ reply });
  } catch (err) {
    console.error('AI Function Error:', err);
    res.status(500).json({ error: err.message || 'Internal error' });
  }
}
