/**
 * Low-level Vultr API client for browser/Node.js
 * Works with both the direct Vultr API and the wrapper server
 */

import { VultrPluginConfig, VultrModelId, VultrUsageStats } from "../types";

export class VultrApiClient {
  private config: Required<VultrPluginConfig>;

  constructor(config: VultrPluginConfig) {
    this.config = {
      apiKey: config.apiKey ?? "",
      baseUrl: config.baseUrl ?? "https://inference.do-ai.run/v1",
      defaultModel: config.defaultModel ?? "llama3.3-70b-instruct",
      wrapperUrl: config.wrapperUrl ?? "",
    };
  }

  private get endpoint(): string {
    return this.config.wrapperUrl
      ? `${this.config.wrapperUrl}/v1`
      : this.config.baseUrl;
  }

  private get headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.config.apiKey}`,
    };
  }

  async chat(
    messages: Array<{ role: string; content: string }>,
    model?: VultrModelId,
    options?: { temperature?: number; max_tokens?: number }
  ): Promise<{ content: string; model: string; usage?: { total_tokens: number } }> {
    const response = await fetch(`${this.endpoint}/chat/completions`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        model: model ?? this.config.defaultModel,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.max_tokens ?? 4096,
        stream: false,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error((err as { error?: { message?: string } })?.error?.message ?? `HTTP ${response.status}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
      model: string;
      usage?: { total_tokens: number };
    };
    return {
      content: data.choices[0]?.message?.content ?? "",
      model: data.model,
      usage: data.usage,
    };
  }

  async *chatStream(
    messages: Array<{ role: string; content: string }>,
    model?: VultrModelId,
    options?: { temperature?: number; max_tokens?: number }
  ): AsyncGenerator<string> {
    const response = await fetch(`${this.endpoint}/chat/completions`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        model: model ?? this.config.defaultModel,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.max_tokens ?? 4096,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Stream failed: HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") return;
        try {
          const parsed = JSON.parse(data) as { choices: Array<{ delta?: { content?: string } }> };
          const delta = parsed.choices[0]?.delta?.content ?? "";
          if (delta) yield delta;
        } catch {}
      }
    }
  }

  async listModels() {
    const response = await fetch(`${this.endpoint}/models`, { headers: this.headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async getUsage(): Promise<VultrUsageStats | null> {
    if (!this.config.wrapperUrl) return null;
    try {
      const response = await fetch(`${this.config.wrapperUrl}/admin/usage`);
      if (!response.ok) return null;
      const data = await response.json() as {
        total_requests: number;
        total_tokens: number;
        cached_requests: number;
        tokens_by_model: Record<string, number>;
      };
      return {
        totalRequests: data.total_requests,
        totalTokens: data.total_tokens,
        cachedRequests: data.cached_requests,
        tokensByModel: data.tokens_by_model,
      };
    } catch {
      return null;
    }
  }
}

// Singleton for use in portal
export const vultrApiClient = new VultrApiClient({
  apiKey: process.env.NEXT_PUBLIC_VULTR_API_KEY ?? process.env.VULTR_API_KEY ?? "",
  wrapperUrl: process.env.NEXT_PUBLIC_VULTR_WRAPPER_URL ?? "",
  defaultModel: "llama3.3-70b-instruct",
});
