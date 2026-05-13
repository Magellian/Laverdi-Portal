export type VultrModelId =
  | "llama3.3-70b-instruct"
  | "deepseek-r1-distill-llama-70b";

export interface VultrPluginConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: VultrModelId;
  wrapperUrl?: string; // Use wrapper server instead of direct Vultr
}

export interface VultrMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  model?: string;
  tokens?: number;
}

export interface VultrUsageStats {
  totalRequests: number;
  totalTokens: number;
  cachedRequests: number;
  tokensByModel: Record<string, number>;
}

export interface VultrContextValue {
  config: VultrPluginConfig;
  selectedModel: VultrModelId;
  setSelectedModel: (model: VultrModelId) => void;
  isLoading: boolean;
  error: string | null;
  usage: VultrUsageStats | null;
  chat: (prompt: string, options?: { system?: string; stream?: boolean }) => Promise<string>;
  clearError: () => void;
}
