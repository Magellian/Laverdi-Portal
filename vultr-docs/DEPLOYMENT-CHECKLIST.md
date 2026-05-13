# Vultr Integration Deployment Checklist

## ✅ Pre-flight
- [x] API key verified: `sk-do-zJcFm...` → responds "Vultr works!" ✓
- [x] MCP server TypeScript compiles clean ✓
- [x] SDK TypeScript compiles clean ✓  
- [x] API wrapper TypeScript compiles clean ✓
- [x] MCP server `dist/` built ✓

## Step 1: Deploy MCP Server to OpenClaw (45.76.242.66)

```bash
# From workspace root
bash vultr-docs/deploy-openclaw.sh
# Then:
ssh root@45.76.242.66 'openclaw gateway restart'
```

Manual steps if rsync not available:
```bash
scp -r vultr-mcp-server/ root@45.76.242.66:/opt/vultr-mcp-server/
ssh root@45.76.242.66
cd /opt/vultr-mcp-server && npm install && npm run build

# Edit ~/.openclaw/config.json — add mcpServers.vultr block
# (see laverdi-vultr-plugin/openclaw-config.json for exact format)
openclaw gateway restart
```

## Step 2: Deploy API Wrapper to LaVerdi VPS (64.23.253.97)

```bash
bash vultr-docs/deploy-wrapper.sh
# Verify: curl http://64.23.253.97:3030/health
```

## Step 3: Add to LaVerdi Portal

```bash
bash vultr-docs/deploy-portal.sh
# Or manually copy API routes and set env vars
```

Add to LaVerdi's `.env.local`:
```
VULTR_API_KEY=sk-do-zJcFm__t2n7fAwomUx2DRMBXYvdHYhTCRMq2aDfvKCVrt0N3Sp1Or64Fkt
VULTR_BASE_URL=https://inference.do-ai.run/v1
NEXT_PUBLIC_VULTR_WRAPPER_URL=http://64.23.253.97:3030
```

## Step 4: Test Everything

```bash
# MCP tools available in OpenClaw agent
# (ask agent: "use vultr_list_models")

# API Wrapper
curl http://64.23.253.97:3030/health
curl http://64.23.253.97:3030/v1/models

# Portal API routes
curl https://laverdi.tech/api/vultr/models
curl -X POST https://laverdi.tech/api/vultr/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello!"}'
```

## Available Models
- `llama3.3-70b-instruct` — 128K context, general purpose
- `deepseek-r1-distill-llama-70b` — 64K context, reasoning/math
