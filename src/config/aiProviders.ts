export type AiProviderProtocol = "openai-compatible" | "anthropic-compatible" | "gemini-native" | "ollama";

export type AiAuthType = "bearer" | "x-api-key" | "query-key" | "none";

export type AiEndpointRule =
  | {
      type: "append-path";
      path: string;
    }
  | {
      type: "gemini-generate";
      streamPathTemplate: string;
      testPathTemplate: string;
    };

export interface AiProviderDefinition {
  providerId: string;
  displayName: string;
  protocol: AiProviderProtocol;
  baseUrl: string;
  defaultModel: string;
  models: string[];
  requiresApiKey: boolean;
  authType: AiAuthType;
  endpoint: {
    chat: AiEndpointRule;
  };
}

const OPENAI_COMPATIBLE_CHAT: AiEndpointRule = {
  type: "append-path",
  path: "/chat/completions",
};

export const AI_PROVIDERS: AiProviderDefinition[] = [
  {
    providerId: "openai",
    displayName: "ChatGPT / OpenAI",
    protocol: "openai-compatible",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1", "o4-mini"],
    requiresApiKey: true,
    authType: "bearer",
    endpoint: {
      chat: OPENAI_COMPATIBLE_CHAT,
    },
  },
  {
    providerId: "gemini",
    displayName: "Gemini",
    protocol: "gemini-native",
    baseUrl: "https://generativelanguage.googleapis.com",
    defaultModel: "gemini-2.0-flash",
    models: ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"],
    requiresApiKey: true,
    authType: "query-key",
    endpoint: {
      chat: {
        type: "gemini-generate",
        streamPathTemplate: "/v1beta/models/{model}:streamGenerateContent?alt=sse&key={apiKey}",
        testPathTemplate: "/v1beta/models/{model}:generateContent?key={apiKey}",
      },
    },
  },
  {
    providerId: "deepseek",
    displayName: "DeepSeek",
    protocol: "openai-compatible",
    baseUrl: "https://api.deepseek.com",
    defaultModel: "deepseek-v4-flash",
    models: ["deepseek-v4-flash", "deepseek-chat", "deepseek-reasoner"],
    requiresApiKey: true,
    authType: "bearer",
    endpoint: {
      chat: OPENAI_COMPATIBLE_CHAT,
    },
  },
  {
    providerId: "mimo",
    displayName: "MiMo 按量付费",
    protocol: "openai-compatible",
    baseUrl: "https://api.xiaomimimo.com/v1",
    defaultModel: "mimo-v2.5-pro",
    models: ["mimo-v2.5-pro", "mimo-v2.5-omni", "MiMo-V2-Pro", "MiMo-V2-Omni"],
    requiresApiKey: true,
    authType: "bearer",
    endpoint: {
      chat: OPENAI_COMPATIBLE_CHAT,
    },
  },
  {
    providerId: "mimo-token-plan",
    displayName: "MiMo Token Plan",
    protocol: "openai-compatible",
    baseUrl: "https://token-plan-cn.xiaomimimo.com/v1",
    defaultModel: "mimo-v2.5-pro",
    models: ["mimo-v2.5-pro", "mimo-v2.5-omni", "MiMo-V2-Pro", "MiMo-V2-Omni"],
    requiresApiKey: true,
    authType: "bearer",
    endpoint: {
      chat: OPENAI_COMPATIBLE_CHAT,
    },
  },
  {
    providerId: "zhipu",
    displayName: "Zhipu GLM",
    protocol: "openai-compatible",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    defaultModel: "glm-4.7-flash",
    models: ["glm-4.7-flash", "glm-4.7", "glm-4.6", "glm-4-flash", "glm-4-plus"],
    requiresApiKey: true,
    authType: "bearer",
    endpoint: {
      chat: OPENAI_COMPATIBLE_CHAT,
    },
  },
  {
    providerId: "kimi",
    displayName: "Kimi / Moonshot",
    protocol: "openai-compatible",
    baseUrl: "https://api.moonshot.cn/v1",
    defaultModel: "moonshot-v1-8k",
    models: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k", "kimi-k2-0711-preview"],
    requiresApiKey: true,
    authType: "bearer",
    endpoint: {
      chat: OPENAI_COMPATIBLE_CHAT,
    },
  },
  {
    providerId: "qwen",
    displayName: "Qwen / DashScope",
    protocol: "openai-compatible",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    defaultModel: "qwen-plus",
    models: ["qwen-plus", "qwen-turbo", "qwen-max", "qwen3-235b-a22b", "qwen3-32b"],
    requiresApiKey: true,
    authType: "bearer",
    endpoint: {
      chat: OPENAI_COMPATIBLE_CHAT,
    },
  },
  {
    providerId: "ollama",
    displayName: "Ollama",
    protocol: "ollama",
    baseUrl: "http://localhost:11434",
    defaultModel: "llama3.1",
    models: ["llama3.1", "llama3", "qwen2.5", "deepseek-r1", "mistral"],
    requiresApiKey: false,
    authType: "none",
    endpoint: {
      chat: {
        type: "append-path",
        path: "/api/chat",
      },
    },
  },
  {
    providerId: "minimax",
    displayName: "MiniMax",
    protocol: "openai-compatible",
    baseUrl: "https://api.minimaxi.com/v1",
    defaultModel: "MiniMax-M1",
    models: ["MiniMax-M1", "abab6.5s-chat", "abab6.5g-chat"],
    requiresApiKey: true,
    authType: "bearer",
    endpoint: {
      chat: OPENAI_COMPATIBLE_CHAT,
    },
  },
  {
    providerId: "claude",
    displayName: "Claude / Anthropic",
    protocol: "anthropic-compatible",
    baseUrl: "https://api.anthropic.com",
    defaultModel: "claude-3-5-sonnet-latest",
    models: ["claude-3-5-sonnet-latest", "claude-3-5-haiku-latest", "claude-3-opus-latest"],
    requiresApiKey: true,
    authType: "x-api-key",
    endpoint: {
      chat: {
        type: "append-path",
        path: "/v1/messages",
      },
    },
  },
];

export const AI_PROVIDER_PRESETS = AI_PROVIDERS;

export function findAiProvider(providerId: string): AiProviderDefinition | undefined {
  return AI_PROVIDERS.find((provider) => provider.providerId === providerId);
}

export const findAiProviderPreset = findAiProvider;

export function buildProviderEndpoint(provider: AiProviderDefinition): string {
  const baseUrl = provider.baseUrl.replace(/\/+$/, "");
  const rule = provider.endpoint.chat;

  if (rule.type === "append-path") {
    return `${baseUrl}${rule.path}`;
  }

  return `${baseUrl}${rule.testPathTemplate}`;
}
