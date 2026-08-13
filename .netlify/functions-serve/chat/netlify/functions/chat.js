"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/chat.js
var chat_exports = {};
__export(chat_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(chat_exports);
var import_sdk = __toESM(require("@anthropic-ai/sdk"), 1);
var import_openai = __toESM(require("openai"), 1);
var handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  try {
    const { messages, model, systemPrompt } = JSON.parse(event.body);
    if (!messages || !model) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing messages or model" }) };
    }
    let reply = "";
    if (model.startsWith("claude")) {
      const anthropic = new import_sdk.default({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await anthropic.messages.create({
        model,
        max_tokens: 2048,
        system: systemPrompt || "You are a helpful grant writing assistant for Ardhi.",
        messages: messages.map((m) => ({ role: m.role, content: m.content }))
      });
      reply = response.content[0].text;
    } else if (model.startsWith("gpt")) {
      const openai = new import_openai.default({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt || "You are a helpful grant writing assistant for Ardhi." },
          ...messages
        ]
      });
      reply = completion.choices[0].message.content;
    } else if (model.startsWith("deepseek")) {
      const deepseek = new import_openai.default({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: "https://api.deepseek.com"
      });
      const completion = await deepseek.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt || "You are a helpful grant writing assistant for Ardhi." },
          ...messages
        ]
      });
      reply = completion.choices[0].message.content;
    } else if (model.startsWith("qwen")) {
      const qwen = new import_openai.default({
        apiKey: process.env.QWEN_API_KEY,
        baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
      });
      const completion = await qwen.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt || "You are a helpful grant writing assistant for Ardhi." },
          ...messages
        ]
      });
      reply = completion.choices[0].message.content;
    } else {
      return { statusCode: 400, body: JSON.stringify({ error: "Unknown model" }) };
    }
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply })
    };
  } catch (err) {
    console.error("AI Function Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Internal error" })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=chat.js.map
