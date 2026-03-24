import OpenAI from "openai";

// ── OpenRouter AI Gateway Service ─────────────────────────────────────────
// OpenRouter provides a unified API to 300+ models from all major providers.
// It uses the OpenAI-compatible format at https://openrouter.ai/api/v1
// so we can use the standard OpenAI SDK with a custom baseURL.

export interface ModelOption {
  id: string;           // full model id (e.g. "openai/gpt-4o")
  name: string;         // human-friendly display name
  provider: string;     // provider prefix (openai, anthropic, etc.)
  providerLabel: string;
  type: "chat" | "image";
  contextWindow?: number;
  pricing?: { prompt: string; completion: string };
}

// ── OpenRouter Client Factory ─────────────────────────────────────────────
let _openRouterClient: OpenAI | null = null;

/**
 * Get or create a singleton OpenRouter client.
 * Uses the standard OpenAI SDK with baseURL pointed at OpenRouter.
 */
export function getOpenRouterClient(): OpenAI {
  if (_openRouterClient) return _openRouterClient;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  _openRouterClient = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://pinnara.ai",
      "X-Title": "Pinnara.ai Blog Generator",
    },
  });

  return _openRouterClient;
}

// ── Fetch available models from OpenRouter ────────────────────────────────
interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  pricing?: { prompt: string; completion: string; image?: string };
  context_length?: number;
  architecture?: { modality?: string; input_modalities?: string[]; output_modalities?: string[] };
  top_provider?: { max_completion_tokens?: number };
}

/**
 * Fetch all available models from OpenRouter's live API.
 * Caches for 5 minutes to avoid excessive API calls.
 */
let _modelsCache: { models: OpenRouterModel[]; ts: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function fetchOpenRouterModels(): Promise<OpenRouterModel[]> {
  if (_modelsCache && Date.now() - _modelsCache.ts < CACHE_TTL) {
    return _modelsCache.models;
  }

  const response = await fetch("https://openrouter.ai/api/v1/models", {
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch models from OpenRouter: ${response.status}`);
  }

  const data = await response.json();
  const models: OpenRouterModel[] = data.data || [];
  _modelsCache = { models, ts: Date.now() };
  return models;
}

/**
 * Extract provider label from model id (e.g. "openai/gpt-4o" → "OpenAI")
 */
function getProviderLabel(modelId: string): string {
  const prefix = modelId.split("/")[0] || modelId;
  const labels: Record<string, string> = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    google: "Google",
    "meta-llama": "Meta (LLaMA)",
    mistralai: "Mistral AI",
    deepseek: "DeepSeek",
    cohere: "Cohere",
    qwen: "Qwen",
    "x-ai": "xAI",
    perplexity: "Perplexity",
    microsoft: "Microsoft",
    nvidia: "NVIDIA",
    amazon: "Amazon",
    together: "Together AI",
    fireworks: "Fireworks AI",
    groq: "Groq",
    cerebras: "Cerebras",
    inflection: "Inflection",
    "01-ai": "01.AI",
    databricks: "Databricks",
    ai21: "AI21 Labs",
    neversleep: "NeverSleep",
    pygmalionai: "Pygmalion AI",
    sao10k: "Sao10K",
    nousresearch: "Nous Research",
    cognitivecomputations: "Cognitive Computations",
    aetherwiing: "AetherWiing",
    thedrummer: "TheDrummer",
    eva: "EVA",
  };
  return labels[prefix] || prefix.charAt(0).toUpperCase() + prefix.slice(1);
}

/**
 * Get chat models from OpenRouter's model list.
 * Filters to text→text models only (excludes image generation, embedding, etc.)
 */
export async function getChatModels(): Promise<ModelOption[]> {
  const models = await fetchOpenRouterModels();

  return models
    .filter((m) => {
      // Include models that can generate text output
      const outputModalities = m.architecture?.output_modalities || [];
      const inputModalities = m.architecture?.input_modalities || [];
      // Must have text output capability
      const hasTextOutput = outputModalities.includes("text") || outputModalities.length === 0;
      // Skip pure image/audio-only models
      const isImageOnly = outputModalities.length === 1 && outputModalities[0] === "image";
      // Skip models with zero pricing (usually broken/unavailable)
      const hasValidPricing = m.pricing && (m.pricing.prompt !== "-1" && m.pricing.completion !== "-1");
      
      return hasTextOutput && !isImageOnly && hasValidPricing;
    })
    .map((m) => ({
      id: m.id,
      name: m.name || m.id.split("/").pop() || m.id,
      provider: m.id.split("/")[0] || "unknown",
      providerLabel: getProviderLabel(m.id),
      type: "chat" as const,
      contextWindow: m.context_length,
      pricing: m.pricing ? { prompt: m.pricing.prompt, completion: m.pricing.completion } : undefined,
    }))
    .sort((a, b) => a.providerLabel.localeCompare(b.providerLabel) || a.name.localeCompare(b.name));
}

/**
 * Get image generation models from OpenRouter's model list.
 * These are models that output images.
 */
// Models known to produce photorealistic output (sorted best first)
const PHOTOREALISTIC_MODELS = [
  'openai/gpt-5-image',
  'openai/gpt-5-image-mini',
  'google/gemini-2.5-flash-image',
  'google/gemini-3-pro-image-preview',
  'google/gemini-3.1-flash-image-preview',
];

// Models that tend to produce CGI/animated/smooth renders
const CGI_STYLE_MODELS: string[] = [];

export async function getImageModels(): Promise<ModelOption[]> {
  const models = await fetchOpenRouterModels();

  const mapped = models
    .filter((m) => {
      const outputModalities = m.architecture?.output_modalities || [];
      return outputModalities.includes("image");
    })
    .map((m) => {
      const id = m.id.toLowerCase();
      const isCGI = CGI_STYLE_MODELS.some(cgi => id.includes(cgi));
      const isRecommended = PHOTOREALISTIC_MODELS.some(rec => id.includes(rec.toLowerCase()));
      let displayName = m.name || m.id.split("/").pop() || m.id;
      if (isRecommended) displayName = `⭐ ${displayName} (Realistic)`;
      else if (isCGI) displayName = `${displayName} (Artistic/CGI style)`;
      return {
        id: m.id,
        name: displayName,
        provider: m.id.split("/")[0] || "unknown",
        providerLabel: getProviderLabel(m.id),
        type: "image" as const,
        contextWindow: m.context_length,
        pricing: m.pricing ? { prompt: m.pricing.prompt, completion: m.pricing.completion } : undefined,
        _isRecommended: isRecommended,
        _isCGI: isCGI,
      };
    })
    // Sort: recommended first, then CGI-style last
    .sort((a, b) => {
      if (a._isRecommended && !b._isRecommended) return -1;
      if (!a._isRecommended && b._isRecommended) return 1;
      if (a._isCGI && !b._isCGI) return 1;
      if (!a._isCGI && b._isCGI) return -1;
      return a.providerLabel.localeCompare(b.providerLabel) || a.name.localeCompare(b.name);
    });

  return mapped;
}

/**
 * Group models by provider for dropdown display.
 */
export function groupModelsByProvider(models: ModelOption[]): Record<string, ModelOption[]> {
  const grouped: Record<string, ModelOption[]> = {};
  for (const m of models) {
    if (!grouped[m.providerLabel]) grouped[m.providerLabel] = [];
    grouped[m.providerLabel].push(m);
  }
  return grouped;
}
