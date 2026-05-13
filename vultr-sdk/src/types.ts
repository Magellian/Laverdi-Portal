/**
 * Type definitions for the Vultr inference SDK
 */

export type VultrModel =
  | "llama3.3-70b-instruct"
  | "deepseek-r1-distill-llama-70b"
  | string; // allow future models

export interface VultrConfig {
  /** Vultr inference API key */
  apiKey: string;
  /** Base URL (default: https://inference.do-ai.run/v1) */
  baseUrl?: string;
  /** Default model to use */
  defaultModel?: VultrModel;
  /** Default max tokens */
  maxTokens?: number;
  /** Request timeout in ms */
  timeout?: number;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  model?: VultrModel;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  system?: string;
  /** Full message override */
  messages?: ChatMessage[];
}

export interface UsageStats {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface CompletionResult {
  content: string;
  model: string;
  finish_reason: string | null;
  usage?: UsageStats;
}

export interface StreamChunk {
  delta: string;
  model: string;
  done: boolean;
}

export interface ModelInfo {
  id: string;
  provider: string;
  base_url: string;
  capabilities: string[];
  context_window: number;
}

export interface EmbedResult {
  embeddings: Array<{ index: number; vector: number[] }>;
  model: string;
  usage?: { prompt_tokens: number; total_tokens: number };
}
