// netlify/functions/chat.js
// Secure proxy for all 4 AI providers

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export const handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { messages, model, systemPrompt } = JSON.parse(event.body);

    if (!messages || !model) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing messages or model' }) };
    }

    let reply = '';

    // ─── CLAUDE ───
    if (model.startsWith('claude')) {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await anthropic.messages.create({
        model,
        max_tokens: 2048,
        system: systemPrompt || 'You are a helpful grant writing assistant for Ardhi.',
        messages: messages.map(m => ({ role: m.role, content: m.content })),
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
      return { statusCode: 400, body: JSON.stringify({ error: 'Unknown model' }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    console.error('AI Function Error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Internal error' }),
    };
  }
};