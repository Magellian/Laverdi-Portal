"use client";

/**
 * VultrChat — drop-in chat widget for the LaVerdi portal
 *
 * Usage:
 *   <VultrChat apiKey={process.env.NEXT_PUBLIC_VULTR_API_KEY} />
 *
 * Or with wrapper:
 *   <VultrChat wrapperUrl="http://localhost:3030" />
 */

import React, { useState, useRef, useEffect } from "react";
import { useVultrChat } from "../hooks/useVultrChat";
import { VultrModelId } from "../types";

interface VultrChatProps {
  apiKey?: string;
  wrapperUrl?: string;
  model?: VultrModelId;
  system?: string;
  className?: string;
  title?: string;
  placeholder?: string;
  streaming?: boolean;
}

export function VultrChat({
  apiKey,
  wrapperUrl,
  model = "llama3.3-70b-instruct",
  system,
  className = "",
  title = "Vultr AI",
  placeholder = "Ask anything...",
  streaming = true,
}: VultrChatProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, error, streamingContent, sendMessage, clearMessages } =
    useVultrChat({ apiKey, wrapperUrl, model, system });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput("");
    await sendMessage(text, streaming);
  };

  return (
    <div className={`vultr-chat flex flex-col h-full border rounded-lg overflow-hidden ${className}`}
         style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div className="vultr-chat__header flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">{title}</span>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{model}</span>
        </div>
        <button
          onClick={clearMessages}
          className="text-white/70 hover:text-white text-sm transition-colors"
          title="Clear chat"
        >
          ✕ Clear
        </button>
      </div>

      {/* Messages */}
      <div className="vultr-chat__messages flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && !isLoading && (
          <div className="text-center text-gray-400 text-sm mt-8">
            <div className="text-3xl mb-2">🤖</div>
            <p>Powered by Vultr inference</p>
            <p className="text-xs mt-1">{model}</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-white text-gray-800 shadow-sm border rounded-bl-sm"
              }`}
            >
              {msg.content}
              {msg.tokens && (
                <div className="text-xs mt-1 opacity-50">{msg.tokens} tokens</div>
              )}
            </div>
          </div>
        ))}
        {(isLoading || streamingContent) && (
          <div className="flex justify-start">
            <div className="max-w-[80%] px-4 py-2 rounded-2xl bg-white text-gray-800 shadow-sm border rounded-bl-sm text-sm whitespace-pre-wrap">
              {streamingContent || (
                <span className="flex items-center gap-1">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce delay-100">●</span>
                  <span className="animate-bounce delay-200">●</span>
                </span>
              )}
            </div>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
            ⚠️ {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="vultr-chat__input flex gap-2 p-3 border-t bg-white">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className="flex-1 px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}
