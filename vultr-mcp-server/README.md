# Vultr MCP Server

Model Context Protocol server that exposes Vultr inference models as tools for OpenClaw agents.

## Tools Exposed

| Tool | Description |
|------|-------------|
| `vultr_chat_complete` | Single-turn text generation |
| `vultr_chat_stream` | Streaming text generation |
| `vultr_list_models` | List available models |
| `vultr_embed` | Text embeddings |

## Quick Start

```bash
npm install
npm run build
VULTR_API_KEY=your-key npm start
```

## Configuration (env vars)

| Variable | Default | Description |
|----------|---------|-------------|
| `VULTR_API_KEY` | *(required)* | Vultr inference API key |
| `VULTR_BASE_URL` | `https://inference.do-ai.run/v1` | Vultr inference endpoint |
| `VULTR_DEFAULT_MODEL` | `llama3.3-70b-instruct` | Default model |

## OpenClaw Integration

Add to your OpenClaw config (`~/.openclaw/config.json`):

```json
{
  "mcpServers": {
    "vultr": {
      "command": "node",
      "args": ["/path/to/vultr-mcp-server/dist/index.js"],
      "env": {
        "VULTR_API_KEY": "your-key-here"
      }
    }
  }
}
```

Or via mcporter:
```bash
mcporter add vultr-mcp stdio "node /path/to/dist/index.js" --env VULTR_API_KEY=sk-...
```

## Example Tool Call

```json
{
  "tool": "vultr_chat_complete",
  "arguments": {
    "prompt": "Explain quantum entanglement in 3 sentences",
    "model": "llama3.3-70b-instruct",
    "temperature": 0.7
  }
}
```
