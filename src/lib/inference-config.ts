/**
 * ============================================================================
 * ORATOR.AI INFERENCE ENVIRONMENT CONFIGURATION
 * ============================================================================
 *
 * Rules:
 * - Credentials remain strictly server-side.
 * - Base URLs cannot be overridden by untrusted client inputs.
 * - Official hosted Cheaper Inference endpoint is the preferred default.
 * - OmniRoute remains an optional adapter, disabled by default.
 */

export interface CheaperInferenceConfig {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  allowedModels: string[];
  explorationModels: string[];
  buildModels: string[];
  verificationModels: string[];
  timeoutMs: number;
  maxRetries: number;
  maxCostPerRequestUsd: number;
}

export interface OpenRouterConfig {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
}

export interface OmniRouteConfig {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
}

export interface DirectProvidersConfig {
  openAiApiKey: string;
  geminiApiKey: string;
  anthropicApiKey: string;
  huggingFaceApiKey: string;
}

// Safely access server environment without failing TypeScript in browser mode
function getServerEnv(): Record<string, string | undefined> {
  try {
    if (typeof globalThis !== "undefined" && (globalThis as any).process?.env) {
      return (globalThis as any).process.env;
    }
  } catch {
    /* fallback to empty */
  }
  return {};
}

export class InferenceConfigService {
  // Official hosted endpoint as immutable default
  private static readonly OFFICIAL_CHEAPER_INFERENCE_URL = "https://api.cheaperinference.com/v1";
  private static readonly OFFICIAL_OPENROUTER_URL = "https://openrouter.ai/api/v1";

  public getCheaperInferenceConfig(): CheaperInferenceConfig {
    const env = getServerEnv();

    // Base URL sanitization: never allow arbitrary protocols or untrusted browser overrides
    let baseUrl = (env.CHEAPER_INFERENCE_BASE_URL || InferenceConfigService.OFFICIAL_CHEAPER_INFERENCE_URL).trim();
    if (!baseUrl.startsWith("https://") && !baseUrl.startsWith("http://localhost")) {
      baseUrl = InferenceConfigService.OFFICIAL_CHEAPER_INFERENCE_URL;
    }

    const parseCsv = (val?: string) =>
      val ? val.split(",").map((s) => s.trim()).filter(Boolean) : [];

    return {
      enabled: env.CHEAPER_INFERENCE_ENABLED !== "false",
      baseUrl,
      apiKey: (env.CHEAPER_INFERENCE_API_KEY || "").trim(),
      allowedModels: parseCsv(env.CHEAPER_INFERENCE_ALLOWED_MODELS).length
        ? parseCsv(env.CHEAPER_INFERENCE_ALLOWED_MODELS)
        : [
            "google/gemini-1.5-flash",
            "openai/gpt-4o-mini",
            "anthropic/claude-3.5-sonnet",
            "meta-llama/llama-3.3-70b-instruct",
            "deepseek/deepseek-chat",
          ],
      explorationModels: parseCsv(env.CHEAPER_INFERENCE_EXPLORATION_MODELS).length
        ? parseCsv(env.CHEAPER_INFERENCE_EXPLORATION_MODELS)
        : ["google/gemini-1.5-flash", "openai/gpt-4o-mini", "meta-llama/llama-3.3-70b-instruct"],
      buildModels: parseCsv(env.CHEAPER_INFERENCE_BUILD_MODELS).length
        ? parseCsv(env.CHEAPER_INFERENCE_BUILD_MODELS)
        : ["anthropic/claude-3.5-sonnet", "openai/gpt-4o", "deepseek/deepseek-chat"],
      verificationModels: parseCsv(env.CHEAPER_INFERENCE_VERIFICATION_MODELS).length
        ? parseCsv(env.CHEAPER_INFERENCE_VERIFICATION_MODELS)
        : ["openai/gpt-4o", "anthropic/claude-3.5-sonnet"],
      timeoutMs: Number(env.CHEAPER_INFERENCE_REQUEST_TIMEOUT_MS) || 45000,
      maxRetries: Number(env.CHEAPER_INFERENCE_MAX_RETRIES) || 2,
      maxCostPerRequestUsd: Number(env.CHEAPER_INFERENCE_MAX_COST_PER_REQUEST) || 0.25,
    };
  }

  public getOpenRouterConfig(): OpenRouterConfig {
    const env = getServerEnv();
    return {
      enabled: Boolean(env.OPENROUTER_API_KEY),
      baseUrl: (env.OPENROUTER_BASE_URL || InferenceConfigService.OFFICIAL_OPENROUTER_URL).trim(),
      apiKey: (env.OPENROUTER_API_KEY || "").trim(),
    };
  }

  public getOmniRouteConfig(): OmniRouteConfig {
    const env = getServerEnv();
    // Disabled by default: does not delay core Orator experience
    return {
      enabled: env.OMNIROUTE_ENABLED === "true",
      baseUrl: (env.OMNIROUTE_BASE_URL || "http://localhost:8000/v1").trim(),
      apiKey: (env.OMNIROUTE_API_KEY || "").trim(),
    };
  }

  public getDirectProvidersConfig(): DirectProvidersConfig {
    const env = getServerEnv();
    return {
      openAiApiKey: (env.OPENAI_API_KEY || "").trim(),
      geminiApiKey: (env.GEMINI_API_KEY || "").trim(),
      anthropicApiKey: (env.ANTHROPIC_API_KEY || "").trim(),
      huggingFaceApiKey: (env.HUGGINGFACE_API_KEY || "").trim(),
    };
  }
}

export const globalInferenceConfig = new InferenceConfigService();
