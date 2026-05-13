/**
 * Example 3: Multi-turn conversation
 * Run: VULTR_API_KEY=sk-... ts-node 03-multi-turn.ts
 */

import { VultrClient } from "../../vultr-sdk/src/client";
import { ChatMessage } from "../../vultr-sdk/src/types";

const client = new VultrClient({ apiKey: process.env.VULTR_API_KEY! });

async function main() {
  console.log("=== Multi-turn Conversation ===\n");

  const history: ChatMessage[] = [
    { role: "system", content: "You are a helpful assistant. Be concise." },
  ];

  const turns = [
    "What is Python?",
    "What are its main use cases?",
    "Compare it to JavaScript briefly.",
  ];

  for (const userMsg of turns) {
    history.push({ role: "user", content: userMsg });
    console.log("User:", userMsg);

    const result = await client.chatWithHistory(history);
    console.log("Assistant:", result.content, "\n");

    history.push({ role: "assistant", content: result.content });
  }
}

main().catch(console.error);
