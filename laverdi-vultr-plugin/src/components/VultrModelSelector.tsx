"use client";

import React from "react";
import { VultrModelId } from "../types";

interface ModelOption {
  id: VultrModelId;
  label: string;
  description: string;
  badge?: string;
}

const MODEL_OPTIONS: ModelOption[] = [
  {
    id: "llama3.3-70b-instruct",
    label: "Llama 3.3 70B",
    description: "Fast, capable general-purpose model. Great for Q&A, summarization, coding.",
    badge: "Recommended",
  },
  {
    id: "deepseek-r1-distill-llama-70b",
    label: "DeepSeek R1 70B",
    description: "Advanced reasoning model. Best for math, logic, and step-by-step problems.",
    badge: "Reasoning",
  },
];

interface VultrModelSelectorProps {
  selected: VultrModelId;
  onChange: (model: VultrModelId) => void;
  className?: string;
}

export function VultrModelSelector({ selected, onChange, className = "" }: VultrModelSelectorProps) {
  return (
    <div className={`vultr-model-selector space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
      {MODEL_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
            selected === opt.id
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`font-medium text-sm ${selected === opt.id ? "text-blue-700" : "text-gray-800"}`}>
              {opt.label}
            </span>
            {opt.badge && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                selected === opt.id ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
              }`}>
                {opt.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
        </button>
      ))}
    </div>
  );
}
