/**
 * Vultr API Wrapper Server
 *
 * OpenAI-compatible REST API that wraps Vultr inference with:
 * - Rate limiting (per API key)
 * - Response caching (deterministic prompts)
 * - Usage tracking (in-memory, can be extended to DB)
 * - CORS support
 * - Request logging
 * - Health checks
 */

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import NodeCache from "node-cache";
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";

// ── Config ────────────────────────────────────────────────────────────────────

const PORT           = parseInt(process.env.PORT           ?? "3030");
const VULTR_BASE_URL = process.env.VULTR_BASE_URL          ?? "https://inference.do-ai.run/v1";
const VULTR_API_KEY  = process.env.VULTR_API_KEY           ?? "";
const WRAPPER_KEY    = process.env.WRAPPER_API_KEY         ?? "";  // optional auth for this wrapper
const CACHE_TTL      = parseInt(process.env.CACHE_TTL_SEC  ?? "300");  // 5 min cache
const RATE_LIMIT_RPM = parseInt(process.env.RATE_LIMIT_RPM ?? "60");   // 60 req/min default
const ALLOWED_MODELS = ["llama3.3-70b-instruct", "deepseek-r1-distill-llama-70b"];

// ── Shared state ──────────────────────────────────────────────────────────────

const responseCache = new NodeCache({ stdTTL: CACHE_TTL, checkperiod: 60 });

interface UsageRecord {
  requestId: string;
  timestamp: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  durationMs: number;
  cached: boolean;
}

const usageLog: UsageRecord[] = [];

// ── OpenAI client ─────────────────────────────────────────────────────────────

function getClient(): OpenAI {
  if (!VULTR_API_KEY) throw new Error("VULTR_API_KEY not configured");
  return new OpenAI({ apiKey: VULTR_API_KEY, baseURL: VULTR_BASE_URL });
}

// ── App setup ─────────────────────────────────────────────────────────────────

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: "*", methods: ["GET", "POST", "OPTIONS"] }));
app.use(compression() as express.RequestHandler);
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));

// Rate limiter
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: RATE_LIMIT_RPM,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by API key if provided, else by IP
    const auth = req.headers["authorization"];
    if (auth?.startsWith("Bearer ")) return auth.slice(7);
    return req.ip ?? "unknown";
  },
  handler: (_req, res) => {
    res.status(429).json({ error: { message: "Rate limit exceeded", type: "rate_limit_error", code: 429 } });
  },
});
app.use(limiter);

// Optional auth middleware
function optionalAuth(req: Request, res: Response, next: NextFunction) {
  if (!WRAPPER_KEY) return next();
  const auth = req.headers["authorization"];
  if (!auth?.startsWith("Bearer ") || auth.slice(7) !== WRAPPER_KEY) {
    return res.status(401).json({ error: { message: "Unauthorized", type: "auth_error" } });
  }
  next();
}

// Cache key from request body
function cacheKey(body: Record<string, unknown>): string | null {
  const temp = (body.temperature as number | undefined) ?? 0;
  // Only cache deterministic (temp=0 or very low) requests
  if (temp > 0.05) return null;
  return JSON.stringify({ model: body.model, messages: body.messages, max_tokens: body.max_tokens });
}

// ── Routes ────────────────────────────────────────────────────────────────────

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    cache: { keys: responseCache.keys().length, stats: responseCache.getStats() },
    usage: {
      total_requests: usageLog.length,
      cached_requests: usageLog.filter((u) => u.cached).length,
      total_tokens: usageLog.reduce((s, u) => s + u.totalTokens, 0),
    },
  });
});

// Models list (OpenAI-compatible)
app.get("/v1/models", optionalAuth, (_req, res) => {
  res.json({
    object: "list",
    data: ALLOWED_MODELS.map((id) => ({
      id,
      object: "model",
      created: Math.floor(Date.now() / 1000),
      owned_by: "vultr",
    })),
  });
});

// Chat completions (OpenAI-compatible)
app.post("/v1/chat/completions", optionalAuth, async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const start = Date.now();
  const body = req.body as Record<string, unknown>;

  // Validate model
  const model = (body.model as string) ?? "llama3.3-70b-instruct";
  if (!ALLOWED_MODELS.includes(model)) {
    return res.status(400).json({
      error: { message: `Model '${model}' not available. Use: ${ALLOWED_MODELS.join(", ")}`, type: "invalid_request_error" },
    });
  }

  const isStream = body.stream === true;

  // Check cache (non-streaming only)
  if (!isStream) {
    const key = cacheKey(body);
    if (key) {
      const cached = responseCache.get<object>(key);
      if (cached) {
        const usage = (cached as { usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } }).usage;
        usageLog.push({
          requestId,
          timestamp: new Date().toISOString(),
          model,
          promptTokens: usage?.prompt_tokens ?? 0,
          completionTokens: usage?.completion_tokens ?? 0,
          totalTokens: usage?.total_tokens ?? 0,
          durationMs: Date.now() - start,
          cached: true,
        });
        return res.json({ ...cached, _cached: true, _request_id: requestId });
      }
    }
  }

  try {
    const client = getClient();

    if (isStream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Request-Id", requestId);

      const stream = await client.chat.completions.create({
        ...(body as unknown as Parameters<typeof client.chat.completions.create>[0]),
        model,
        stream: true,
      });

      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
      res.write("data: [DONE]\n\n");
      res.end();

      usageLog.push({
        requestId,
        timestamp: new Date().toISOString(),
        model,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        durationMs: Date.now() - start,
        cached: false,
      });
    } else {
      const response = await client.chat.completions.create({
        ...(body as unknown as Parameters<typeof client.chat.completions.create>[0]),
        model,
        stream: false,
      });

      // Cache deterministic responses
      const key = cacheKey(body);
      if (key) responseCache.set(key, response);

      const usage = response.usage;
      usageLog.push({
        requestId,
        timestamp: new Date().toISOString(),
        model,
        promptTokens: usage?.prompt_tokens ?? 0,
        completionTokens: usage?.completion_tokens ?? 0,
        totalTokens: usage?.total_tokens ?? 0,
        durationMs: Date.now() - start,
        cached: false,
      });

      res.setHeader("X-Request-Id", requestId);
      res.json(response);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[${requestId}] Error:`, msg);
    res.status(500).json({ error: { message: msg, type: "api_error", request_id: requestId } });
  }
});

// Embeddings (OpenAI-compatible)
app.post("/v1/embeddings", optionalAuth, async (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;
  try {
    const client = getClient();
    const response = await client.embeddings.create(
      body as unknown as Parameters<typeof client.embeddings.create>[0]
    );
    res.json(response);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: { message: msg, type: "api_error" } });
  }
});

// Usage stats endpoint
app.get("/admin/usage", (_req, res) => {
  const last100 = usageLog.slice(-100);
  const totalTokens = usageLog.reduce((s, u) => s + u.totalTokens, 0);
  const byModel: Record<string, number> = {};
  for (const u of usageLog) {
    byModel[u.model] = (byModel[u.model] ?? 0) + u.totalTokens;
  }
  res.json({
    total_requests: usageLog.length,
    cached_requests: usageLog.filter((u) => u.cached).length,
    total_tokens: totalTokens,
    tokens_by_model: byModel,
    recent: last100,
  });
});

// Clear cache
app.post("/admin/cache/clear", (_req, res) => {
  responseCache.flushAll();
  res.json({ message: "Cache cleared" });
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Vultr API Wrapper running on port ${PORT}`);
  console.log(`  Upstream: ${VULTR_BASE_URL}`);
  console.log(`  Cache TTL: ${CACHE_TTL}s`);
  console.log(`  Rate limit: ${RATE_LIMIT_RPM} req/min`);
  console.log(`  Auth: ${WRAPPER_KEY ? "enabled" : "disabled (set WRAPPER_API_KEY to enable)"}`);
});

export default app;
