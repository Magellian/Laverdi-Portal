/**
 * Next.js API route: GET /api/vultr/models
 * Returns available Vultr inference models
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    models: [
      {
        id: "llama3.3-70b-instruct",
        label: "Llama 3.3 70B Instruct",
        provider: "Vultr",
        capabilities: ["chat", "completion"],
        context_window: 128000,
        recommended: true,
      },
      {
        id: "deepseek-r1-distill-llama-70b",
        label: "DeepSeek R1 70B",
        provider: "Vultr",
        capabilities: ["chat", "completion", "reasoning"],
        context_window: 64000,
        recommended: false,
      },
    ],
  });
}
