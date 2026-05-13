/**
 * Next.js API route: POST /api/vultr/chat
 *
 * Server-side proxy that keeps the Vultr API key out of the browser.
 * Supports both streaming (SSE) and non-streaming responses.
 *
 * Body: { prompt, model?, system?, temperature?, max_tokens?, stream? }
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const VULTR_API_KEY  = process.env.VULTR_API_KEY  ?? "";
const VULTR_BASE_URL = process.env.VULTR_BASE_URL  ?? "https://inference.do-ai.run/v1";
const DEFAULT_MODEL  = process.env.VULTR_DEFAULT_MODEL ?? "llama3.3-70b-instruct";
const ALLOWED_MODELS = ["llama3.3-70b-instruct", "deepseek-r1-distill-llama-70b"];

function getClient() {
  return new OpenAI({ apiKey: VULTR_API_KEY, baseURL: VULTR_BASE_URL });
}

export async function POST(req: NextRequest) {
  if (!VULTR_API_KEY) {
    return NextResponse.json({ error: "VULTR_API_KEY not configured" }, { status: 500 });
  }

  const body = await req.json() as {
    prompt?: string;
    messages?: Array<{ role: string; content: string }>;
    model?: string;
    system?: string;
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
  };

  const model = body.model ?? DEFAULT_MODEL;
  if (!ALLOWED_MODELS.includes(model)) {
    return NextResponse.json(
      { error: `Model '${model}' not available. Use: ${ALLOWED_MODELS.join(", ")}` },
      { status: 400 }
    );
  }

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  if (body.messages && body.messages.length > 0) {
    messages.push(...(body.messages as OpenAI.Chat.ChatCompletionMessageParam[]));
  } else {
    if (body.system) messages.push({ role: "system", content: body.system });
    if (body.prompt) messages.push({ role: "user", content: body.prompt });
  }

  if (messages.length === 0) {
    return NextResponse.json({ error: "No messages provided" }, { status: 400 });
  }

  const client = getClient();

  try {
    if (body.stream) {
      const stream = await client.chat.completions.create({
        model,
        messages,
        temperature: body.temperature ?? 0.7,
        max_tokens: body.max_tokens ?? 4096,
        stream: true,
      });

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            const data = `data: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } else {
      const completion = await client.chat.completions.create({
        model,
        messages,
        temperature: body.temperature ?? 0.7,
        max_tokens: body.max_tokens ?? 4096,
        stream: false,
      });
      return NextResponse.json({
        content: completion.choices[0]?.message?.content ?? "",
        model: completion.model,
        finish_reason: completion.choices[0]?.finish_reason,
        usage: completion.usage,
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
