"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { VultrContextValue, VultrModelId, VultrPluginConfig, VultrUsageStats } from "../types";
import { VultrApiClient } from "../lib/apiClient";

const VultrContext = createContext<VultrContextValue | null>(null);

interface VultrProviderProps {
  children: ReactNode;
  config: VultrPluginConfig;
}

export function VultrProvider({ children, config }: VultrProviderProps) {
  const [selectedModel, setSelectedModel] = useState<VultrModelId>(
    config.defaultModel ?? "llama3.3-70b-instruct"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<VultrUsageStats | null>(null);

  const client = React.useMemo(() => new VultrApiClient(config), [config]);

  const chat = useCallback(
    async (prompt: string, options?: { system?: string; stream?: boolean }) => {
      setIsLoading(true);
      setError(null);
      try {
        const messages: Array<{ role: string; content: string }> = [];
        if (options?.system) messages.push({ role: "system", content: options.system });
        messages.push({ role: "user", content: prompt });

        const result = await client.chat(messages, selectedModel);

        // Refresh usage stats
        client.getUsage().then(setUsage).catch(() => {});

        return result.content;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client, selectedModel]
  );

  const clearError = useCallback(() => setError(null), []);

  return (
    <VultrContext.Provider
      value={{ config, selectedModel, setSelectedModel, isLoading, error, usage, chat, clearError }}
    >
      {children}
    </VultrContext.Provider>
  );
}

export function useVultr(): VultrContextValue {
  const ctx = useContext(VultrContext);
  if (!ctx) throw new Error("useVultr must be used within <VultrProvider>");
  return ctx;
}
