"use client";

import { useState, useCallback, useRef } from "react";
import { VultrMessage, VultrModelId } from "../types";
import { VultrApiClient } from "../lib/apiClient";

interface UseVultrChatOptions {
  apiKey?: string;
  wrapperUrl?: string;
  model?: VultrModelId;
  system?: string;
}

export function useVultrChat(options: UseVultrChatOptions = {}) {
  const [messages, setMessages] = useState<VultrMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const client = new VultrApiClient({
    apiKey: options.apiKey ?? (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_VULTR_API_KEY : "") ?? "",
    wrapperUrl: options.wrapperUrl,
    defaultModel: options.model,
  });

  const sendMessage = useCallback(
    async (content: string, stream = false) => {
      const userMsg: VultrMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setError(null);
      setStreamingContent("");

      const history: Array<{ role: string; content: string }> = [];
      if (options.system) history.push({ role: "system", content: options.system });
      history.push(
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content }
      );

      try {
        if (stream) {
          let full = "";
          for await (const chunk of client.chatStream(history, options.model)) {
            full += chunk;
            setStreamingContent(full);
          }
          const assistantMsg: VultrMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: full,
            timestamp: new Date(),
            model: options.model,
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setStreamingContent("");
        } else {
          const result = await client.chat(history, options.model);
          const assistantMsg: VultrMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: result.content,
            timestamp: new Date(),
            model: result.model,
            tokens: result.usage?.total_tokens,
          };
          setMessages((prev) => [...prev, assistantMsg]);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      } finally {
        setIsLoading(false);
        setStreamingContent("");
      }
    },
    [client, messages, options]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setStreamingContent("");
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { messages, isLoading, error, streamingContent, sendMessage, clearMessages, abort };
}
