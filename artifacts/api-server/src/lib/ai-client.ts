import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

export type Provider = "openai" | "anthropic" | "gemini" | "openrouter";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResponse {
  text: string;
  tokensUsed?: number;
}

function detectProvider(apiKey: string, explicitProvider?: string): Provider {
  if (explicitProvider && ["openai", "anthropic", "gemini", "openrouter"].includes(explicitProvider)) {
    return explicitProvider as Provider;
  }
  if (apiKey.startsWith("sk-ant-")) return "anthropic";
  if (apiKey.startsWith("sk-or-")) return "openrouter";
  if (apiKey.startsWith("AIza") || apiKey.startsWith("ya29.")) return "gemini";
  return "openai";
}

export async function callAI(
  messages: AIMessage[],
  apiKey: string,
  model: string,
  provider?: string,
): Promise<AIResponse> {
  const resolvedProvider = detectProvider(apiKey, provider);

  if (resolvedProvider === "anthropic") {
    const client = new Anthropic({ apiKey });
    const systemMsg = messages.find((m) => m.role === "system");
    const userMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const response = await client.messages.create({
      model: model || "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      system: systemMsg?.content,
      messages: userMessages,
    });

    const textBlock = response.content.find((b) => b.type === "text");
    return {
      text: textBlock?.type === "text" ? textBlock.text : "",
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    };
  }

  if (resolvedProvider === "gemini") {
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({ model: model || "gemini-1.5-pro" });
    const systemMsg = messages.find((m) => m.role === "system");
    const userMsg = messages.filter((m) => m.role === "user").map((m) => m.content).join("\n");

    const prompt = systemMsg
      ? `${systemMsg.content}\n\n---\n\n${userMsg}`
      : userMsg;

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return {
      text: response.text(),
      tokensUsed: response.usageMetadata?.totalTokenCount,
    };
  }

  // OpenAI or OpenRouter (OpenAI-compatible)
  const baseURL = resolvedProvider === "openrouter"
    ? "https://openrouter.ai/api/v1"
    : undefined;

  const client = new OpenAI({ apiKey, baseURL });
  const response = await client.chat.completions.create({
    model: model || "gpt-4o",
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    temperature: 0.7,
    max_tokens: 2048,
  });

  return {
    text: response.choices[0]?.message?.content || "",
    tokensUsed: response.usage?.total_tokens,
  };
}

export { detectProvider };
