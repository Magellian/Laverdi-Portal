# @laverdi/vultr-sdk

TypeScript SDK and CLI for the Vultr inference API.

## Install

```bash
npm install @laverdi/vultr-sdk
# or globally for CLI
npm install -g @laverdi/vultr-sdk
```

## CLI Usage

```bash
# Set your API key once
vultr config set apiKey sk-your-key-here

# Chat
vultr chat "What is quantum computing?"
vultr chat --model deepseek-r1-distill-llama-70b "Solve this step by step: ..."
vultr chat --stream "Write a short story"

# List models
vultr models

# Embeddings
vultr embed "Hello world"

# Use env var instead of stored config
VULTR_API_KEY=sk-... vultr chat "Hello"
```

## SDK Usage (TypeScript)

```typescript
import { VultrClient } from "@laverdi/vultr-sdk";

const client = new VultrClient({
  apiKey: process.env.VULTR_API_KEY!,
  defaultModel: "llama3.3-70b-instruct",
});

// Simple chat
const result = await client.chat("Explain quantum entanglement");
console.log(result.content);
console.log(result.usage); // { prompt_tokens, completion_tokens, total_tokens }

// Streaming
for await (const chunk of client.chatStream("Write a haiku")) {
  process.stdout.write(chunk.delta);
}

// Multi-turn conversation
const result2 = await client.chatWithHistory([
  { role: "system", content: "You are a helpful coding assistant." },
  { role: "user", content: "What is a closure in JavaScript?" },
  { role: "assistant", content: "A closure is..." },
  { role: "user", content: "Can you give me an example?" },
]);

// Embeddings
const embed = await client.embed(["text one", "text two"]);
console.log(embed.embeddings[0].vector.length); // e.g. 1536

// List models
const models = client.listModels();
```

## Configuration

| Option | Description | Default |
|--------|-------------|---------|
| `apiKey` | Vultr API key (required) | — |
| `baseUrl` | Vultr inference endpoint | `https://inference.do-ai.run/v1` |
| `defaultModel` | Default model | `llama3.3-70b-instruct` |
| `maxTokens` | Default max tokens | `4096` |
| `timeout` | Request timeout (ms) | `60000` |
