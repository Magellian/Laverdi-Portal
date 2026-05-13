# Vultr Inference Integration — Complete Stack

Full integration of Vultr inference into OpenClaw and the LaVerdi portal.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        LaVerdi Portal (Next.js)                      │
│  /api/vultr/chat ──► API Route ──► Vultr inference (server-side)    │
│  /api/vultr/models                                                    │
│  VultrChat, VultrModelSelector, VultrUsageWidget (React components) │
└─────────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────────┐
│                     Vultr API Wrapper (Express)                       │
│  POST /v1/chat/completions  ◄── rate limiting, caching, tracking    │
│  GET  /v1/models                                                      │
│  GET  /admin/usage                                                    │
└─────────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────────┐
│                     Vultr Inference API                               │
│  https://inference.do-ai.run/v1                                      │
│  llama3.3-70b-instruct | deepseek-r1-distill-llama-70b              │
└─────────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────────┐
│                     OpenClaw MCP Integration                          │
│  vultr-mcp-server (stdio) ──► vultr_chat_complete                   │
│                                vultr_chat_stream                     │
│                                vultr_list_models                     │
│                                vultr_embed                           │
└─────────────────────────────────────────────────────────────────────┘
```

## Package Directory

| Package | Purpose |
|---------|---------|
| `vultr-mcp-server/` | MCP server — OpenClaw tools for Vultr models |
| `vultr-sdk/` | TypeScript SDK + CLI for direct API access |
| `vultr-api-wrapper/` | Express proxy with rate limiting & caching |
| `laverdi-vultr-plugin/` | React components + Next.js API routes for portal |
| `vultr-docs/examples/` | Runnable examples |

## Quick Deployment Guide

### 1. Deploy MCP Server on OpenClaw VPS (45.76.242.66)

```bash
cd vultr-mcp-server
npm install && npm run build

# Add to ~/.openclaw/config.json (see laverdi-vultr-plugin/openclaw-config.json)
# Then restart OpenClaw
openclaw gateway restart
```

### 2. Deploy API Wrapper

```bash
cd vultr-api-wrapper
npm install && npm run build
cp .env.example .env
# Edit .env: set VULTR_API_KEY

# PM2
pm2 start dist/server.js --name vultr-wrapper
```

### 3. Add to LaVerdi Portal

```bash
# Copy files to portal
cp laverdi-vultr-plugin/src/app/api/vultr/* app/api/vultr/
cp -r laverdi-vultr-plugin/src/components/* components/vultr/
cp -r laverdi-vultr-plugin/src/context/* contexts/
cp -r laverdi-vultr-plugin/src/hooks/* hooks/

# Add env vars to .env.local
VULTR_API_KEY=sk-do-...
VULTR_BASE_URL=https://inference.do-ai.run/v1
NEXT_PUBLIC_VULTR_WRAPPER_URL=http://64.23.253.97:3030
```

### 4. Use in Portal Pages

```tsx
// app/dashboard/ai/page.tsx
import { VultrChat } from "@/components/vultr/VultrChat";
import { VultrModelSelector } from "@/components/vultr/VultrModelSelector";
import { VultrUsageWidget } from "@/components/vultr/VultrUsageWidget";

export default function AIPage() {
  return (
    <div className="grid grid-cols-3 gap-6 h-screen p-6">
      <div className="col-span-1">
        <VultrModelSelector selected="llama3.3-70b-instruct" onChange={() => {}} />
        <VultrUsageWidget wrapperUrl="http://localhost:3030" className="mt-6" />
      </div>
      <div className="col-span-2">
        <VultrChat
          wrapperUrl="http://localhost:3030"
          model="llama3.3-70b-instruct"
          streaming={true}
          className="h-full"
        />
      </div>
    </div>
  );
}
```

## Available Models

| Model | Context | Best For |
|-------|---------|---------|
| `llama3.3-70b-instruct` | 128K tokens | General purpose, Q&A, coding, writing |
| `deepseek-r1-distill-llama-70b` | 64K tokens | Math, reasoning, step-by-step problems |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VULTR_API_KEY` | ✅ | Vultr inference API key |
| `VULTR_BASE_URL` | ❌ | Endpoint (default: `https://inference.do-ai.run/v1`) |
| `VULTR_DEFAULT_MODEL` | ❌ | Default model (default: `llama3.3-70b-instruct`) |
| `NEXT_PUBLIC_VULTR_WRAPPER_URL` | ❌ | Wrapper server URL for client-side use |
| `WRAPPER_API_KEY` | ❌ | Secret key to protect wrapper server |
| `CACHE_TTL_SEC` | ❌ | Seconds to cache deterministic responses (default: 300) |
| `RATE_LIMIT_RPM` | ❌ | Max requests per minute per key/IP (default: 60) |
