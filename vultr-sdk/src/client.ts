/**
 * VultrClient — main SDK class
 */

import OpenAI from "openai";
import {
  VultrConfig,
  VultrModel,
  ChatMessage,
  ChatOptions,
  CompletionResult,
  StreamChunk,
  ModelInfo,
  EmbedResult,
} from "./types";

const VULTR_DEFAULT_BASE_URL = "https://inference.do-ai.run/v1";
const VULTR_DEFAULT_MODEL: VultrModel = "llama3.3-70b-instruct";
const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: "llama3.3-70b-instruct",
    provider: "vultr",
    base_url: VULTR_DEFAULT_BASE_URL,
    capabilities: ["chat", "completion"],
    context_window: 128000,
  },
  {
    id: "deepseek-r1-distill-llama-70b",
    provider: "vultr",
    base_url: VULTR_DEFAULT_BASE_URL,
    capabilities: ["chat", "completion", "reasoning"],
    context_window: 64000,
  },
];

export class VultrClient {
  private openai: OpenAI;
  private config: Required<VultrConfig>;

  constructor(config: VultrConfig) {
    if (!config.apiKey) throw new Error("VultrClient: apiKey is required");
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl ?? VULTR_DEFAULT_BASE_URL,
      defaultModel: config.defaultModel ?? VULTR_DEFAULT_MODEL,
      maxTokens: config.maxTokens ?? 4096,
      timeout: config.timeout ?? 60000,
    };
    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
    });
  }

  // ── Chat ─────────────────────────────────────────────────────────────────

  /**
   * Single-turn chat completion
   */
  async chat(prompt: string, options?: ChatOptions): Promise<CompletionResult> {
    const messages = this.buildMessages(prompt, options);
    const response = await this.openai.chat.completions.create({
      model: options?.model ?? this.config.defaultModel,
      messages,
      temperature: options?.temperature,
      max_tokens: options?.max_tokens ?? this.config.maxTokens,
      top_p: options?.top_p,
      stream: false,
    });
    const choice = response.choices[0];
    return {
      content: choice?.message?.content ?? "",
      model: response.model,
      finish_reason: choice?.finish_reason ?? null,
      usage: response.usage
        ? {
            prompt_tokens: response.usage.prompt_tokens,
            completion_tokens: response.usage.completion_tokens,
            total_tokens: response.usage.total_tokens,
          }
        : undefined,
    };
  }

  /**
   * Multi-turn chat with full message history
   */
  async chatWithHistory(
    messages: ChatMessage[],
    options?: ChatOptions
  ): Promise<CompletionResult> {
    const response = await this.openai.chat.completions.create({
      model: options?.model ?? this.config.defaultModel,
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      temperature: options?.temperature,
      max_tokens: options?.max_tokens ?? this.config.maxTokens,
      top_p: options?.top_p,
      stream: false,
    });
    const choice = response.choices[0];
    return {
      content: choice?.message?.content ?? "",
      model: response.model,
      finish_reason: choice?.finish_reason ?? null,
      usage: response.usage
        ? {
            prompt_tokens: response.usage.prompt_tokens,
            completion_tokens: response.usage.completion_tokens,
            total_tokens: response.usage.total_tokens,
          }
        : undefined,
    };
  }

  /**
   * Streaming chat — yields chunks as they arrive
   */
  async *chatStream(
    prompt: string,
    options?: ChatOptions
  ): AsyncGenerator<StreamChunk> {
    const messages = this.buildMessages(prompt, options);
    const stream = await this.openai.chat.completions.create({
      model: options?.model ?? this.config.defaultModel,
      messages,
      temperature: options?.temperature,
      max_tokens: options?.max_tokens ?? this.config.maxTokens,
      top_p: options?.top_p,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? "";
      const done = chunk.choices[0]?.finish_reason != null;
      yield { delta, model: chunk.model ?? "", done };
    }
  }

  // ── Embeddings ────────────────────────────────────────────────────────────

  /**
   * Generate text embeddings
   */
  async embed(
    input: string | string[],
    model?: string
  ): Promise<EmbedResult> {
    const response = await this.openai.embeddings.create({
      model: model ?? "text-embedding-ada-002",
      input,
    });
    return {
      embeddings: response.data.map((d) => ({
        index: d.index,
        vector: d.embedding,
      })),
      model: response.model,
      usage: response.usage
        ? {
            prompt_tokens: response.usage.prompt_tokens,
            total_tokens: response.usage.total_tokens,
          }
        : undefined,
    };
  }

  // ── Models ────────────────────────────────────────────────────────────────

  /**
   * List available models
   */
  listModels(): ModelInfo[] {
    return AVAILABLE_MODELS;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private buildMessages(
    prompt: string,
    options?: ChatOptions
  ): OpenAI.Chat.ChatCompletionMessageParam[] {
    if (options?.messages && options.messages.length > 0) {
      return options.messages as OpenAI.Chat.ChatCompletionMessageParam[];
    }
    const msgs: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    if (options?.system) msgs.push({ role: "system", content: options.system });
    msgs.push({ role: "user", content: prompt });
    return msgs;
  }
}
