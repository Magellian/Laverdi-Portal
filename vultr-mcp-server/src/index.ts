#!/usr/bin/env node
/**
 * Vultr MCP Server
 * Exposes Vultr inference models as Model Context Protocol tools for OpenClaw agents.
 *
 * Supports:
 *  - chat/complete: single-turn text generation
 *  - chat/stream: streaming text generation
 *  - models/list: list available models
 *  - chat/embed: text embeddings (if available)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import OpenAI from "openai";
import { z } from "zod";

// ── Config ────────────────────────────────────────────────────────────────────

const VULTR_BASE_URL = process.env.VULTR_BASE_URL || "https://inference.do-ai.run/v1";
const VULTR_API_KEY  = process.env.VULTR_API_KEY  || "";
const DEFAULT_MODEL  = process.env.VULTR_DEFAULT_MODEL || "llama3.3-70b-instruct";

const AVAILABLE_MODELS = [
  "llama3.3-70b-instruct",
  "deepseek-r1-distill-llama-70b",
];

// ── OpenAI client pointed at Vultr ────────────────────────────────────────────

function createClient(): OpenAI {
  if (!VULTR_API_KEY) {
    throw new Error("VULTR_API_KEY environment variable is required");
  }
  return new OpenAI({
    apiKey: VULTR_API_KEY,
    baseURL: VULTR_BASE_URL,
  });
}

// ── Tool schemas (Zod) ────────────────────────────────────────────────────────

const ChatCompleteSchema = z.object({
  prompt: z.string().describe("The user prompt / question"),
  model: z.string().optional().describe(`Model to use (default: ${DEFAULT_MODEL})`),
  system: z.string().optional().describe("Optional system prompt"),
  temperature: z.number().min(0).max(2).optional().describe("Sampling temperature (0-2)"),
  max_tokens: z.number().int().positive().optional().describe("Max tokens to generate"),
  top_p: z.number().min(0).max(1).optional().describe("Top-p sampling"),
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string(),
      })
    )
    .optional()
    .describe("Full messages array (overrides prompt/system if provided)"),
});

const ChatStreamSchema = ChatCompleteSchema;

const ListModelsSchema = z.object({});

const EmbedSchema = z.object({
  input: z.union([z.string(), z.array(z.string())]).describe("Text or texts to embed"),
  model: z.string().optional().describe("Embedding model to use"),
});

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "vultr_chat_complete",
    description:
      "Generate a text completion using Vultr inference models (llama3.3-70b-instruct or deepseek-r1-distill-llama-70b). Use for Q&A, summarization, code generation, and any text task.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "The user prompt / question" },
        model: {
          type: "string",
          enum: AVAILABLE_MODELS,
          description: `Model to use (default: ${DEFAULT_MODEL})`,
        },
        system: { type: "string", description: "Optional system prompt to set context/persona" },
        temperature: {
          type: "number",
          minimum: 0,
          maximum: 2,
          description: "Sampling temperature. 0 = deterministic, 2 = very creative",
        },
        max_tokens: { type: "integer", minimum: 1, description: "Maximum tokens to generate" },
        top_p: { type: "number", minimum: 0, maximum: 1, description: "Top-p (nucleus) sampling" },
        messages: {
          type: "array",
          description: "Full messages array. Overrides prompt/system if provided.",
          items: {
            type: "object",
            properties: {
              role: { type: "string", enum: ["system", "user", "assistant"] },
              content: { type: "string" },
            },
            required: ["role", "content"],
          },
        },
      },
      required: ["prompt"],
    },
  },
  {
    name: "vultr_chat_stream",
    description:
      "Same as vultr_chat_complete but returns the response incrementally as it is generated. Best for long responses.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "The user prompt / question" },
        model: { type: "string", enum: AVAILABLE_MODELS },
        system: { type: "string" },
        temperature: { type: "number", minimum: 0, maximum: 2 },
        max_tokens: { type: "integer", minimum: 1 },
        top_p: { type: "number", minimum: 0, maximum: 1 },
        messages: {
          type: "array",
          items: {
            type: "object",
            properties: {
              role: { type: "string", enum: ["system", "user", "assistant"] },
              content: { type: "string" },
            },
            required: ["role", "content"],
          },
        },
      },
      required: ["prompt"],
    },
  },
  {
    name: "vultr_list_models",
    description: "List all available Vultr inference models with their capabilities.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "vultr_embed",
    description:
      "Generate vector embeddings for text using Vultr inference. Useful for semantic search, similarity, and RAG.",
    inputSchema: {
      type: "object",
      properties: {
        input: {
          oneOf: [
            { type: "string" },
            { type: "array", items: { type: "string" } },
          ],
          description: "Text or array of texts to embed",
        },
        model: { type: "string", description: "Embedding model (optional)" },
      },
      required: ["input"],
    },
  },
];

// ── Handler helpers ───────────────────────────────────────────────────────────

function buildMessages(
  args: z.infer<typeof ChatCompleteSchema>
): OpenAI.Chat.ChatCompletionMessageParam[] {
  if (args.messages && args.messages.length > 0) {
    return args.messages as OpenAI.Chat.ChatCompletionMessageParam[];
  }
  const msgs: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  if (args.system) msgs.push({ role: "system", content: args.system });
  msgs.push({ role: "user", content: args.prompt });
  return msgs;
}

async function handleChatComplete(
  client: OpenAI,
  rawArgs: unknown
): Promise<string> {
  const args = ChatCompleteSchema.parse(rawArgs);
  const completion = await client.chat.completions.create({
    model: args.model ?? DEFAULT_MODEL,
    messages: buildMessages(args),
    temperature: args.temperature,
    max_tokens: args.max_tokens,
    top_p: args.top_p,
    stream: false,
  });

  const choice = completion.choices[0];
  const content = choice?.message?.content ?? "";
  const usage = completion.usage;

  return JSON.stringify({
    content,
    model: completion.model,
    finish_reason: choice?.finish_reason,
    usage: usage
      ? {
          prompt_tokens: usage.prompt_tokens,
          completion_tokens: usage.completion_tokens,
          total_tokens: usage.total_tokens,
        }
      : undefined,
  });
}

async function handleChatStream(client: OpenAI, rawArgs: unknown): Promise<string> {
  const args = ChatStreamSchema.parse(rawArgs);
  const stream = await client.chat.completions.create({
    model: args.model ?? DEFAULT_MODEL,
    messages: buildMessages(args),
    temperature: args.temperature,
    max_tokens: args.max_tokens,
    top_p: args.top_p,
    stream: true,
  });

  let fullContent = "";
  let model = "";
  let finish_reason: string | null = null;

  for await (const chunk of stream) {
    model = chunk.model ?? model;
    const delta = chunk.choices[0]?.delta?.content ?? "";
    fullContent += delta;
    finish_reason = chunk.choices[0]?.finish_reason ?? finish_reason;
  }

  return JSON.stringify({ content: fullContent, model, finish_reason });
}

function handleListModels(): string {
  return JSON.stringify({
    models: AVAILABLE_MODELS.map((id) => ({
      id,
      provider: "vultr",
      base_url: VULTR_BASE_URL,
      capabilities: ["chat", "completion"],
      context_window: id.includes("70b") ? 128000 : 32000,
    })),
  });
}

async function handleEmbed(client: OpenAI, rawArgs: unknown): Promise<string> {
  const args = EmbedSchema.parse(rawArgs);
  const response = await client.embeddings.create({
    model: args.model ?? "text-embedding-ada-002",
    input: args.input,
  });
  return JSON.stringify({
    embeddings: response.data.map((d) => ({
      index: d.index,
      vector: d.embedding,
    })),
    model: response.model,
    usage: response.usage,
  });
}

// ── MCP Server ────────────────────────────────────────────────────────────────

async function main() {
  const server = new Server(
    { name: "vultr-mcp-server", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  // List tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  // Call tool
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    let client: OpenAI;
    try {
      client = createClient();
    } catch (err: unknown) {
      throw new McpError(
        ErrorCode.InternalError,
        `Vultr client init failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    try {
      let result: string;

      switch (name) {
        case "vultr_chat_complete":
          result = await handleChatComplete(client, args);
          break;
        case "vultr_chat_stream":
          result = await handleChatStream(client, args);
          break;
        case "vultr_list_models":
          result = handleListModels();
          break;
        case "vultr_embed":
          result = await handleEmbed(client, args);
          break;
        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }

      return { content: [{ type: "text", text: result }] };
    } catch (err: unknown) {
      if (err instanceof McpError) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${msg}`);
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Vultr MCP Server running on stdio");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
