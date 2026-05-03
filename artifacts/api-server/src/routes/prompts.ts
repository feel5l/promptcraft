import { Router, type IRouter } from "express";
import {
  GenerateTextPromptBody,
  GenerateImagePromptBody,
  GenerateVideoPromptBody,
  GenerateTextPromptResponse,
  GenerateImagePromptResponse,
  GenerateVideoPromptResponse,
  OptimizePromptBody,
  OptimizePromptResponse,
} from "@workspace/api-zod";
import { callAI } from "../lib/ai-client";

const router: IRouter = Router();

// ─── Text Prompt Generation ────────────────────────────────────────────────

function buildTextSystemPrompt(technique: string, language: string): string {
  const langInstruction = language === "ar"
    ? "Respond entirely in Arabic."
    : language === "en"
    ? "Respond entirely in English."
    : "Respond in the same language as the user's task description.";

  const techniqueGuide: Record<string, string> = {
    "zero-shot": `Apply ZERO-SHOT prompting: Write a direct, clear instruction with no examples. Use precise language, specify the exact output format, and define constraints clearly.`,
    "few-shot": `Apply FEW-SHOT prompting: Include 2-3 concrete examples of the expected input/output pattern before the main instruction. Format examples as Input: ... → Output: ...`,
    "chain-of-thought": `Apply CHAIN-OF-THOUGHT prompting: Structure the prompt to make the AI think step-by-step. Use phrases like "Let's think step by step", "First analyze X, then Y, finally Z". Include explicit reasoning checkpoints.`,
    "role": `Apply ROLE PROMPTING: Begin with a vivid, specific expert persona assignment. The role should be hyper-specific (not just "expert" but "senior ML engineer with 10 years in NLP at top AI labs"). The role unlocks domain-specific knowledge and vocabulary.`,
    "xml-tags": `Apply XML-TAG STRUCTURED prompting (Anthropic best practice): Use XML tags to clearly separate sections: <context>, <instructions>, <constraints>, <output_format>, <examples> (if needed). This dramatically improves parsing and adherence.`,
    "auto": `Analyze the task and domain, then automatically select and apply the most effective prompting technique. Choose from: zero-shot (simple tasks), few-shot (formatting/style tasks), chain-of-thought (complex reasoning), role (domain expertise needed), xml-tags (structured output needed).`,
  };

  return `You are an elite prompt engineer with deep expertise in modern LLM prompting techniques as of 2025. Your task is to generate a professional, high-quality prompt based on the user's description.

${techniqueGuide[technique] || techniqueGuide["auto"]}

${langInstruction}

You MUST respond with a valid JSON object in this EXACT structure:
{
  "prompt": "The complete, ready-to-use generated prompt",
  "technique": "the technique actually used",
  "explanation": [
    {
      "label": "Section name",
      "content": "The exact text from this section of the prompt",
      "purpose": "Why this section exists and what it achieves"
    }
  ],
  "qualityScore": {
    "clarity": 8,
    "detail": 7,
    "actionability": 9,
    "overall": 8,
    "feedback": "Brief feedback on strengths and any suggested improvements"
  }
}

Quality scoring guidelines (1-10):
- clarity: How unambiguous and easy to understand is the prompt?
- detail: Does it provide enough context and specificity?
- actionability: Will an AI know exactly what to produce?
- overall: Weighted average considering the use case
- feedback: 1-2 sentences on what works and what could improve`;
}

router.post("/prompts/generate", async (req, res): Promise<void> => {
  const parsed = GenerateTextPromptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.message });
    return;
  }

  const { task, domain, technique, provider, model, apiKey, language = "auto" } = parsed.data;

  const systemPrompt = buildTextSystemPrompt(technique, language);
  const userMessage = `Generate a professional prompt for the following task:

Domain: ${domain}
Task: ${task}
Requested technique: ${technique}

Create an expert-level prompt that someone could immediately paste into an AI system to get excellent results.`;

  const aiResponse = await callAI(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    apiKey,
    model,
    provider,
  );

  let parsed_result: Record<string, unknown>;
  try {
    const jsonMatch = aiResponse.text.match(/\{[\s\S]*\}/);
    parsed_result = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse.text);
  } catch {
    parsed_result = {
      prompt: aiResponse.text,
      technique,
      explanation: [{ label: "Generated Prompt", content: aiResponse.text, purpose: "AI-generated prompt based on your description" }],
      qualityScore: { clarity: 7, detail: 7, actionability: 7, overall: 7, feedback: "Prompt generated successfully." },
    };
  }

  const response = GenerateTextPromptResponse.parse({
    prompt: parsed_result.prompt || aiResponse.text,
    technique: (parsed_result.technique as string) || technique,
    explanation: Array.isArray(parsed_result.explanation) ? parsed_result.explanation : [],
    qualityScore: parsed_result.qualityScore || { clarity: 7, detail: 7, actionability: 7, overall: 7, feedback: "" },
    tokensUsed: aiResponse.tokensUsed,
  });

  res.json(response);
});

// ─── Image Prompt Generation ──────────────────────────────────────────────

function buildImageSystemPrompt(targetTool: string): string {
  const toolGuides: Record<string, string> = {
    "midjourney": `You are a Midjourney v6 expert. Generate prompts using Midjourney's specific syntax:
- Use comma-separated descriptive phrases (no sentences)
- End with parameters: --ar 16:9 --style raw --stylize 750 --chaos 10 (adjust based on request)
- Include: subject, environment/setting, lighting, camera/lens specs, artistic style, mood, color palette
- For photorealistic: include camera model, lens mm, aperture
- For artistic: include medium, artist references if relevant
- Niji mode: add --niji 6 for anime/illustration styles
- Available params: --ar (aspect ratio), --style (raw/cute/expressive/scenic), --stylize (0-1000), --chaos (0-100), --weird (0-3000), --tile, --no (negative elements)`,

    "dalle3": `You are a DALL-E 3 expert. Generate long, richly descriptive prompts:
- DALL-E 3 responds best to detailed natural language descriptions
- Describe: main subject, action, setting, lighting, atmosphere, style, colors, composition
- Be specific about artistic style: "oil painting in the style of...", "photorealistic digital art"
- Include perspective: "bird's eye view", "dramatic low angle", "intimate close-up"
- DALL-E 3 handles text in images well - specify any text elements
- Avoid comma-separated fragments; use flowing descriptive prose instead
- No negative prompts needed - describe what you DO want`,

    "stable-diffusion": `You are a Stable Diffusion (SDXL/SD3) expert. Generate both positive AND negative prompts:
- Positive: Start with quality tokens (masterpiece, best quality, highly detailed, 8k)
- Include: subject details, artistic style, lighting (cinematic lighting, golden hour), camera
- Negative: List what to avoid: (worst quality, low quality:1.4), blurry, deformed, ugly, disfigured, bad anatomy, extra limbs, watermark, signature
- Use emphasis with parentheses: (very important element:1.3), [less important:0.8]
- Include LoRA references if appropriate: <lora:example:0.8>`,

    "flux": `You are a Flux (Black Forest Labs) expert. Flux excels at photorealism and prompt adherence:
- Write natural language descriptions (no comma spam)
- Flux understands complex scenes - describe them naturally
- For photorealism: specify camera (Sony A7R V), lens (85mm f/1.4), ISO, shutter speed
- Include lighting setup: "three-point studio lighting", "natural window light from the left"
- Flux supports: flux-dev (quality), flux-schnell (speed), flux-pro (best)
- Separate positive and negative prompts are supported
- Negative: specify artifacts to avoid`,

    "ideogram": `You are an Ideogram expert. Ideogram specializes in typography and text-in-image:
- Describe text elements explicitly: font style, size, placement
- Use "text: [your text]" notation for text elements
- Supports: magic prompt enhancement, color palette specification, style codes
- Strong at: logos, posters, book covers, UI mockups with text
- Include: color palette as hex codes if specific colors needed
- Style options: photorealism, design, illustration, 3D render, anime`,

    "firefly": `You are an Adobe Firefly expert. Firefly is commercially safe and Adobe-integrated:
- Firefly is trained on licensed content - safe for commercial use
- Use Adobe's natural language approach with rich descriptions
- Reference Adobe Stock style categories: "commercial photography style", "editorial illustration"
- Content types: photo, graphic, vector, illustration, pixel art
- Style: art movements, techniques, moods
- Effects: lighting effects, color adjustments, camera settings
- Reference images can be described in terms of "similar to [stock photo style]"`,
  };

  const guide = toolGuides[targetTool] || toolGuides["stable-diffusion"];

  return `${guide}

You MUST respond with valid JSON in this EXACT structure:
{
  "prompt": "The complete optimized prompt for the tool",
  "negativePrompt": "Negative prompt if applicable (null if not)",
  "parameters": {
    "key": "value"
  },
  "tips": [
    "Specific usage tip 1",
    "Specific usage tip 2"
  ]
}

The parameters object should contain tool-specific settings as key-value pairs (e.g., {"--ar": "16:9", "--stylize": "750"} for Midjourney).`;
}

router.post("/prompts/image", async (req, res): Promise<void> => {
  const parsed = GenerateImagePromptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.message });
    return;
  }

  const { description, targetTool, style, aspectRatio, provider, model, apiKey, language = "auto" } = parsed.data;

  const langHint = language === "ar" ? " (respond in Arabic where helpful, but keep the prompt itself in English as AI image tools require English)" : "";
  const systemPrompt = buildImageSystemPrompt(targetTool);
  const userMessage = `Create an optimized ${targetTool} prompt for this image:

Description: ${description}
${style ? `Style preference: ${style}` : ""}
${aspectRatio ? `Aspect ratio: ${aspectRatio}` : ""}

Generate the best possible prompt following ${targetTool}'s specific syntax and best practices.${langHint}`;

  const aiResponse = await callAI(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    apiKey,
    model,
    provider,
  );

  let parsed_result: Record<string, unknown>;
  try {
    const jsonMatch = aiResponse.text.match(/\{[\s\S]*\}/);
    parsed_result = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse.text);
  } catch {
    parsed_result = {
      prompt: aiResponse.text,
      negativePrompt: null,
      parameters: {},
      tips: ["Copy and paste the prompt directly into " + targetTool],
    };
  }

  const response = GenerateImagePromptResponse.parse({
    prompt: (parsed_result.prompt as string) || aiResponse.text,
    negativePrompt: (parsed_result.negativePrompt as string | undefined) || undefined,
    parameters: (parsed_result.parameters as Record<string, string>) || {},
    tips: Array.isArray(parsed_result.tips) ? parsed_result.tips : [],
    tokensUsed: aiResponse.tokensUsed,
  });

  res.json(response);
});

// ─── Video Prompt Generation ──────────────────────────────────────────────

function buildVideoSystemPrompt(targetTool: string): string {
  const toolGuides: Record<string, string> = {
    "sora": `You are a Sora (OpenAI) prompt expert. Sora understands rich cinematic descriptions:
- Write in present tense, cinematographic style
- Include: scene setup, character/subject description, action, environment, lighting, atmosphere
- Camera: specify movement (slow dolly in, aerial tracking shot, handheld, locked-off)
- Sora handles long, complex scenes - be detailed
- Time of day and weather affect output significantly
- Avoid: multiple cuts (Sora generates one continuous clip), explicit violent or political content
- Duration: Sora currently supports up to 20 seconds`,

    "runway": `You are a Runway Gen-3 Alpha expert. Runway offers precise camera control:
- Structure: [Camera movement] [Subject/action] [Environment] [Lighting] [Style]
- Camera terms: push in, pull back, pan left/right, tilt up/down, orbit, crane up/down, drone shot
- Include: FPS suggestion (24fps for cinematic, 30fps for realistic), slow motion hints
- Strong at: transformations, morphing, stylistic effects
- Avoid: complex multi-character interactions, specific text rendering
- Reference cinematic techniques: rack focus, depth of field, lens flare`,

    "kling": `You are a Kling AI prompt expert. Kling excels at physical realism:
- Strong physics simulation - describe physical interactions explicitly
- Excellent for: product videos, liquid/fluid motion, cloth simulation
- Include: material properties (reflective metal, translucent glass, soft fabric)
- Camera: describe using film terminology (ECU, MCU, WS, OTS)
- Kling supports 5-second and 10-second generations
- Strong at facial expression and lip sync when combined with portrait mode`,

    "pika": `You are a Pika 2.0 prompt expert. Pika is creative and stylistic:
- Great for: animated sequences, style transfers, artistic transitions
- Include: animation style (2D animation, stop motion, claymation, pixel art)
- Pika effects: squish, inflate, melt, explode, crumble, cake-ify
- Camera: simple movements work best (zoom in, pan)
- For transitions: describe start state → end state clearly
- Duration: 3-5 seconds optimal`,

    "luma": `You are a Luma Dream Machine prompt expert. Luma excels at photorealism:
- Cinematic quality - describe as if directing a film scene
- Include: lens description (anamorphic, spherical), depth of field, bokeh
- Strong at: product shots, architectural visualization, nature cinematography
- Camera: smooth camera movements described cinematically
- Reference real filming styles: "Shot on ARRI Alexa", "35mm film grain"
- Color grading hints: "warm golden tones", "desaturated noir palette"`,

    "hailuo": `You are a Hailuo (MiniMax) prompt expert. Hailuo has fast generation and good motion:
- Strong character consistency across frames
- Include: character description (consistent across the prompt), action, environment
- Camera: standard film terms work well
- Good at: character-driven scenes, facial expressions, dialogue-adjacent scenes
- Keep prompts focused - Hailuo works best with clear, singular scenes
- Duration: optimized for 6-second clips`,
  };

  const guide = toolGuides[targetTool] || toolGuides["runway"];

  return `${guide}

You MUST respond with valid JSON in this EXACT structure:
{
  "prompt": "The complete optimized video prompt",
  "cameraDirections": "Specific camera movement and shot type instructions",
  "technicalSpec": "Duration, style, fps, and other technical parameters",
  "tips": [
    "Tool-specific tip 1",
    "Common limitation to be aware of",
    "Best practice for this tool"
  ]
}`;
}

router.post("/prompts/video", async (req, res): Promise<void> => {
  const parsed = GenerateVideoPromptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.message });
    return;
  }

  const { description, targetTool, duration, cameraStyle, provider, model, apiKey, language = "auto" } = parsed.data;

  const langHint = language === "ar" ? " (you may add Arabic tips, but keep the video prompt itself in English)" : "";
  const systemPrompt = buildVideoSystemPrompt(targetTool);
  const userMessage = `Create an optimized ${targetTool} video prompt for this concept:

Scene description: ${description}
${duration ? `Desired duration: ${duration}` : ""}
${cameraStyle ? `Camera/movement style preference: ${cameraStyle}` : ""}

Generate a cinematic, professional video prompt tailored specifically for ${targetTool}'s strengths and limitations.${langHint}`;

  const aiResponse = await callAI(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    apiKey,
    model,
    provider,
  );

  let parsed_result: Record<string, unknown>;
  try {
    const jsonMatch = aiResponse.text.match(/\{[\s\S]*\}/);
    parsed_result = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse.text);
  } catch {
    parsed_result = {
      prompt: aiResponse.text,
      cameraDirections: "Smooth cinematic movement",
      technicalSpec: duration || "5-10 seconds",
      tips: ["Use this prompt directly in " + targetTool],
    };
  }

  const response = GenerateVideoPromptResponse.parse({
    prompt: (parsed_result.prompt as string) || aiResponse.text,
    cameraDirections: (parsed_result.cameraDirections as string) || "",
    technicalSpec: (parsed_result.technicalSpec as string) || "",
    tips: Array.isArray(parsed_result.tips) ? parsed_result.tips : [],
    tokensUsed: aiResponse.tokensUsed,
  });

  res.json(response);
});

// ─── Prompt Optimizer ─────────────────────────────────────────────────────

function buildOptimizeSystemPrompt(language: string): string {
  const langInstruction = language === "ar"
    ? "Respond entirely in Arabic."
    : language === "en"
    ? "Respond entirely in English."
    : "Respond in the same language as the original prompt.";

  return `You are a world-class prompt engineer specializing in critiquing and improving AI prompts. Your job is to analyze an existing prompt, understand what is weak or missing, then produce a significantly better version.

Analysis framework:
1. CLARITY — Is the intent unambiguous? Remove vague words. Add precision.
2. CONTEXT — Does it give the AI enough background? Add missing context.
3. CONSTRAINTS — Are output format, length, tone, and style specified?
4. ROLE — Would a persona unlock better outputs?
5. EXAMPLES — Would few-shot examples help?
6. STRUCTURE — Is the prompt logically ordered for the AI to parse?

Improvement rules:
- Preserve the user's core intent entirely — only improve, never change what they want
- Apply the minimum changes needed to achieve the improvement goal
- Each change must be purposeful and explainable
- Score BEFORE and AFTER honestly — the after score must be genuinely higher

${langInstruction}

You MUST respond with a valid JSON object in this EXACT structure:
{
  "improvedPrompt": "The full improved prompt text, ready to use",
  "changes": [
    {
      "type": "addition" | "removal" | "modification" | "restructure",
      "description": "Specific, concrete description of what changed and why it improves the prompt"
    }
  ],
  "beforeScore": {
    "clarity": 1-10,
    "detail": 1-10,
    "actionability": 1-10,
    "overall": 1-10,
    "feedback": "1-2 sentence honest critique of the original prompt"
  },
  "afterScore": {
    "clarity": 1-10,
    "detail": 1-10,
    "actionability": 1-10,
    "overall": 1-10,
    "feedback": "1-2 sentence summary of what makes the improved prompt better"
  }
}`;
}

router.post("/prompts/optimize", async (req, res): Promise<void> => {
  const parsed = OptimizePromptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.message });
    return;
  }

  const { originalPrompt, improvementGoal, context, provider, model, apiKey, language = "auto" } = parsed.data;

  const systemPrompt = buildOptimizeSystemPrompt(language);
  const userMessage = `Please improve the following prompt.

ORIGINAL PROMPT:
${originalPrompt}

IMPROVEMENT GOAL: ${improvementGoal}
${context ? `\nADDITIONAL CONTEXT: ${context}` : ""}

Analyze what is weak, then produce a better version with a clear changelog and honest quality scores for before and after.`;

  const aiResponse = await callAI(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    apiKey,
    model,
    provider,
  );

  let parsed_result: Record<string, unknown>;
  try {
    const jsonMatch = aiResponse.text.match(/\{[\s\S]*\}/);
    parsed_result = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse.text);
  } catch {
    parsed_result = {
      improvedPrompt: aiResponse.text,
      changes: [{ type: "modification", description: "Prompt has been improved based on your goal." }],
      beforeScore: { clarity: 5, detail: 5, actionability: 5, overall: 5, feedback: "Original prompt analyzed." },
      afterScore: { clarity: 8, detail: 8, actionability: 8, overall: 8, feedback: "Improved version generated." },
    };
  }

  const validChangeTypes = new Set(["addition", "removal", "modification", "restructure"]);

  function normalizeScore(raw: unknown, fallback: number): number {
    const n = Number(raw);
    if (Number.isFinite(n)) return Math.min(10, Math.max(1, Math.round(n)));
    return fallback;
  }

  function normalizeQualityScore(raw: unknown, defaults: { clarity: number; detail: number; actionability: number; overall: number }) {
    const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    return {
      clarity: normalizeScore(r.clarity, defaults.clarity),
      detail: normalizeScore(r.detail, defaults.detail),
      actionability: normalizeScore(r.actionability, defaults.actionability),
      overall: normalizeScore(r.overall, defaults.overall),
      feedback: typeof r.feedback === "string" ? r.feedback : "",
    };
  }

  const rawChanges = Array.isArray(parsed_result.changes) ? parsed_result.changes : [];
  const normalizedChanges = rawChanges
    .filter((c): c is Record<string, unknown> => c && typeof c === "object")
    .map((c) => ({
      type: validChangeTypes.has(c.type as string) ? (c.type as string) : "modification",
      description: typeof c.description === "string" ? c.description : String(c.description ?? ""),
    }));

  const response = OptimizePromptResponse.parse({
    improvedPrompt: (parsed_result.improvedPrompt as string) || aiResponse.text,
    changes: normalizedChanges,
    beforeScore: normalizeQualityScore(parsed_result.beforeScore, { clarity: 5, detail: 5, actionability: 5, overall: 5 }),
    afterScore: normalizeQualityScore(parsed_result.afterScore, { clarity: 8, detail: 8, actionability: 8, overall: 8 }),
    tokensUsed: aiResponse.tokensUsed,
  });

  res.json(response);
});

export default router;
