# Model Setup Plan - 2026-04-14

## Goal
Add **OpenRouter** (cloud fallback) and **LM Studio** (local network) as secondary model providers.

## Current Configuration
- **Primary:** anthropic/claude-haiku-4-5 (Haiku — small model)
- **Available:** gpt-5.4, claude-sonnet-4-6, claude-haiku-4-5
- **Auth:** OpenAI OAuth + Anthropic API key

## New Fallback Chain (Target)

```
1. openai-codex/gpt-5.4 (OpenAI OAuth via config, preferred)
   ↓
2. anthropic/claude-opus-4-6 (Anthropic API key, high-end fallback)
   ↓
3. google/gemini-2.5-pro (Google API key, parallel track)
   ↓
4. openrouter/* (OpenRouter API key, cloud fallback for rate limits)
   ↓
5. ollama/local (LM Studio on local network, offline option)
   ↓
6. anthropic/claude-sonnet-4-6 (final fallback)
```

## OpenRouter Setup

**What is it?** Unified API gateway for 100+ models (OpenAI, Anthropic, Google, Llama, Mistral, etc.).

**Why?** When Google/Anthropic/OpenAI hit rate limits, OpenRouter can serve same models via different endpoints.

### Steps

1. Get API key from https://openrouter.ai/keys
2. Add to openclaw config under `auth.profiles`
3. Configure models: `openrouter/gpt-4`, `openrouter/claude-opus`, `openrouter/llama-3-70b-instruct`, etc.

### Cost
- Pay-per-token (usually 1.5-3x pricier than direct APIs)
- Only use as fallback

## LM Studio Setup

**What is it?** Local LLM server that runs models locally (Ollama alternative).

**Why?** Offline option when all cloud APIs are down or throttled.

### Requirements
- LM Studio running on Windows/Mac/Linux
- Model loaded (e.g., llama2, mistral, neural-chat)
- Network-accessible IP (same network or VPN)
- Default port: 1234

### Steps

1. Get LM Studio IP/port
2. Test connectivity: `curl http://<lm-studio-ip>:1234/health`
3. Add to openclaw config as `ollama/*` or custom `lm-studio/*` endpoint
4. Configure with fallback priority

## Google Models Setup

**What is it?** Google Gemini 2.5-pro, Gemini Flash, etc. via Google AI API.

**Why?** Parallel to OpenAI/Anthropic. When one provider is rate-limited, others still work.

**Prerequisites:**
- Google Cloud account with Gemini API enabled
- API key from console.cloud.google.com

**Models available:**
- `google/gemini-2.5-pro` (latest, fast)
- `google/gemini-3-flash-preview` (cheaper, lighter)
- `google/gemini-2.5-flash` (fast, good balance)

## Questions for Chris

- [ ] Do you have **OpenRouter API key**? If no, I can walk you through creating one (5 min).
- [ ] Do you have **Google API key** for Gemini? If no, same story.
- [ ] Is **LM Studio** running? If yes:
  - [ ] Network IP/hostname?
  - [ ] Port?
  - [ ] What model is loaded?
  - [ ] Local-only or remote?

---

## COMPLETED ✅

### Configuration Done

1. **OpenRouter API Key:** Configured (sk-or-v1-...)
2. **Google API Key:** Configured (AIzaSy...)
3. **LM Studio:** Tested and reachable at 192.168.50.151:11434 ✓
4. **Primary Model:** Updated from Haiku to GPT-5.4

### Model Chain Configured

```
agents.defaults.models now includes:
- openai-codex/gpt-5.4 (PRIMARY)
- anthropic/claude-opus-4-6
- anthropic/claude-sonnet-4-6
- google/gemini-2.5-pro
- google/gemini-3-flash-preview
- openrouter/openai/gpt-4-turbo
- openrouter/anthropic/claude-opus
- openrouter/meta-llama/llama-3-70b-instruct
- ollama/google/gemma-4-26b-a4b (LM Studio on 192.168.50.151:11434)
```

### File Locations

- **Config:** `~/.openclaw/openclaw.json`
- **API Keys:** `workspace/.env` (environment variables for OpenRouter, Google, OLLAMA_BASE_URL)
- **Gateway:** Running on 127.0.0.1:18789 ✓

### Integration Status

**LM Studio Connectivity:**
- ✅ Health check passes (192.168.50.151:11434)
- ✅ Models endpoint works (`/v1/models`)
- ✅ OpenAI API compatibility confirmed (`/v1/chat/completions`)
- ⏳ Inference speed: Slow (26B model on network, ~30-60s per response expected)

**OpenClaw Integration:**
- ✅ Configured in `models.providers.ollama`
- ✅ Base URL: `http://192.168.50.151:11434`
- ✅ Model registered: `ollama/google/gemma-4-26b-a4b`
- ✅ Context window: 8192 tokens
- ✅ Gateway restarted and running

### Next Steps (Prioritized)

1. **Configure Ollama provider in OpenClaw** (point to LM Studio endpoint)
2. **Test model selection** (`openclaw agent --model ollama/google/gemma-4-26b-a4b --message "test"`)
3. **Set fallback chain:** Primary → GPT-5.4, Fallback → Gemini → Gemma-4-26b (local)
4. **Migrate n8n hardcoded secrets** (Etsy POD project)
5. **Enable RDP/Docker port restrictions** (security hardening)



