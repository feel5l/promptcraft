# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM (not used by PromptCraft — API keys stored in localStorage)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### PromptCraft (`artifacts/promptcraft`)
- **Kind**: React + Vite web app
- **Preview path**: `/` (port 23870, external port 3000)
- **Purpose**: Professional AI prompt engineering tool for text, image, and video prompts

**Pages:**
- `/` — Text Prompt Generator (zero-shot, few-shot, CoT, role, XML tags, auto)
- `/image` — Image Prompt Generator (Midjourney, DALL-E 3, Flux, SD, Ideogram, Firefly)
- `/video` — Video Prompt Generator (Sora, Runway, Kling, Pika, Luma, Hailuo)
- `/settings` — API key configuration (stored in localStorage only)
- `/guide` — Static reference guide for prompt engineering techniques

**Key files:**
- `artifacts/promptcraft/src/App.tsx` — router + QueryClient setup
- `artifacts/promptcraft/src/components/layout.tsx` — sidebar navigation
- `artifacts/promptcraft/src/hooks/use-settings.ts` — localStorage API key management
- `artifacts/promptcraft/vite.config.ts` — proxies `/api` to API server (port 8080)

### API Server (`artifacts/api-server`)
- **Kind**: Express 5 API
- **Port**: 8080 (external 8080)
- **Base path**: `/api`

**Endpoints:**
- `GET /api/healthz` — health check
- `GET /api/providers` — list of AI providers, models, image/video tools, and text techniques
- `POST /api/prompts/generate` — generate text prompt (multi-technique)
- `POST /api/prompts/image` — generate image prompt (tool-optimized)
- `POST /api/prompts/video` — generate video prompt (tool-optimized)

**Key files:**
- `artifacts/api-server/src/lib/ai-client.ts` — multi-provider AI dispatcher (OpenAI, Anthropic, Gemini, OpenRouter)
- `artifacts/api-server/src/routes/providers.ts` — static provider/tool metadata
- `artifacts/api-server/src/routes/prompts.ts` — prompt generation logic with expert system prompts

## AI Provider Detection
API keys are auto-detected by prefix:
- `sk-ant-*` → Anthropic Claude
- `sk-or-*` → OpenRouter (OpenAI-compatible)
- `AIza*` → Google Gemini
- `sk-*` → OpenAI

## Security Notes
- API keys are NEVER stored server-side — passed in request body, used once, discarded
- Keys stored in browser localStorage only (`promptcraft_settings`)
- All AI calls are made server-side to avoid CORS issues and key exposure in browser network tab
