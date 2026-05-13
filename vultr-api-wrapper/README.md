# Vultr API Wrapper

OpenAI-compatible REST proxy for Vultr inference with rate limiting, response caching, and usage tracking.

## Features

- 🔄 **Full OpenAI compatibility** — drop-in replacement for any OpenAI client
- 🚦 **Rate limiting** — per API key or IP (configurable RPM)
- ⚡ **Response caching** — caches deterministic (temp=0) requests, configurable TTL
- 📊 **Usage tracking** — tokens used per request, model breakdown
- 🔒 **Optional auth** — require a wrapper API key
- 📡 **Streaming** — passes through SSE streams transparently
- 🏥 **Health checks** — `/health` endpoint

## Quick Start

```bash
npm install
cp .env.example .env
# edit .env with your Vultr API key
npm run build
npm start
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health & stats |
| `GET` | `/v1/models` | List models |
| `POST` | `/v1/chat/completions` | Chat (streaming or not) |
| `POST` | `/v1/embeddings` | Embeddings |
| `GET` | `/admin/usage` | Usage statistics |
| `POST` | `/admin/cache/clear` | Clear response cache |

## Usage with OpenAI clients

```python
# Python
from openai import OpenAI
client = OpenAI(base_url="http://your-server:3030/v1", api_key="wrapper-key")
response = client.chat.completions.create(
    model="llama3.3-70b-instruct",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

```typescript
// TypeScript
import OpenAI from "openai";
const client = new OpenAI({
  baseURL: "http://your-server:3030/v1",
  apiKey: "wrapper-key",
});
```

## Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
ENV PORT=3030
EXPOSE 3030
CMD ["npm", "start"]
```

## Deploy on Vultr VPS (64.23.253.97)

```bash
# Clone + install
git clone ... && cd vultr-api-wrapper
npm install && npm run build

# Run with PM2
npm install -g pm2
VULTR_API_KEY=sk-... PORT=3030 pm2 start dist/server.js --name vultr-wrapper
pm2 save && pm2 startup
```
