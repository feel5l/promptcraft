import { Router, type IRouter } from "express";
import { GetProvidersResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/providers", (_req, res): void => {
  const data = GetProvidersResponse.parse({
    providers: [
      {
        id: "openai",
        name: "OpenAI",
        keyPrefix: "sk-",
        models: [
          { id: "gpt-4o", name: "GPT-4o" },
          { id: "gpt-4.1", name: "GPT-4.1" },
          { id: "gpt-4o-mini", name: "GPT-4o Mini" },
          { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
        ],
      },
      {
        id: "anthropic",
        name: "Anthropic Claude",
        keyPrefix: "sk-ant-",
        models: [
          { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet" },
          { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku" },
          { id: "claude-3-opus-20240229", name: "Claude 3 Opus" },
        ],
      },
      {
        id: "gemini",
        name: "Google Gemini",
        keyPrefix: "AIza",
        models: [
          { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
          { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
          { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
        ],
      },
      {
        id: "openrouter",
        name: "OpenRouter (All Models)",
        keyPrefix: "sk-or-",
        models: [
          { id: "openai/gpt-4o", name: "GPT-4o (via OpenRouter)" },
          { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet (via OpenRouter)" },
          { id: "google/gemini-pro-1.5", name: "Gemini 1.5 Pro (via OpenRouter)" },
          { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B" },
          { id: "mistralai/mistral-large", name: "Mistral Large" },
          { id: "deepseek/deepseek-r1", name: "DeepSeek R1" },
          { id: "x-ai/grok-2", name: "Grok 2" },
        ],
      },
    ],
    imageTools: [
      { id: "midjourney", name: "Midjourney", description: "Best for artistic and stylized images. Supports v6/Niji with rich parameter syntax." },
      { id: "dalle3", name: "DALL-E 3", description: "Excellent with long descriptive prompts. Strong at following instructions and text rendering." },
      { id: "stable-diffusion", name: "Stable Diffusion (SDXL)", description: "Open-source. Supports separate positive/negative prompts and fine-grained control." },
      { id: "flux", name: "Flux (Black Forest Labs)", description: "State-of-the-art open model. Superior photorealism and prompt adherence." },
      { id: "ideogram", name: "Ideogram", description: "Best for typography integration and text-in-image generation." },
      { id: "firefly", name: "Adobe Firefly", description: "Commercially safe with strong creative controls and style references." },
    ],
    videoTools: [
      { id: "sora", name: "Sora (OpenAI)", description: "High quality, cinematic. Best with rich scene descriptions and camera directions." },
      { id: "runway", name: "Runway Gen-3 Alpha", description: "Professional-grade. Excellent camera control and motion consistency." },
      { id: "kling", name: "Kling AI", description: "Strong physics simulation and realistic motion. Great for product videos." },
      { id: "pika", name: "Pika 2.0", description: "Creative and artistic. Good at stylized animations and transitions." },
      { id: "luma", name: "Luma Dream Machine", description: "Photorealistic outputs. Best with cinematic references and lighting descriptions." },
      { id: "hailuo", name: "Hailuo (MiniMax)", description: "Fast generation with good motion quality. Strong at character consistency." },
    ],
    textTechniques: [
      { id: "zero-shot", name: "Zero-Shot", description: "Direct instruction with no examples. Best for clear, well-defined tasks." },
      { id: "few-shot", name: "Few-Shot", description: "Includes 2-5 examples to set the tone, format, and style of expected output." },
      { id: "chain-of-thought", name: "Chain-of-Thought (CoT)", description: "Asks the model to reason step-by-step before giving the final answer. Best for complex tasks." },
      { id: "role", name: "Role Prompting", description: "Assigns a specific expert persona to the model to activate domain knowledge." },
      { id: "xml-tags", name: "XML Tags (Structured)", description: "Uses XML-style tags to clearly separate context, instructions, and output format." },
      { id: "auto", name: "Auto (AI Selects)", description: "Let the AI choose the best technique for your task automatically." },
    ],
  });

  res.json(data);
});

export default router;
