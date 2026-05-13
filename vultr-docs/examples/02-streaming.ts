/**
 * Example 2: Streaming chat
 * Run: VULTR_API_KEY=sk-... ts-node 02-streaming.ts
 */

import { VultrClient } from "../../vultr-sdk/src/client";

const client = new VultrClient({ apiKey: process.env.VULTR_API_KEY! });

async function main() {
  console.log("=== Streaming Example ===\n");
  console.log("Prompt: Write a short poem about the ocean\n");
  console.log("Response:\n");

  for await (const chunk of client.chatStream("Write a short poem about the ocean", {
    model: "llama3.3-70b-instruct",
    temperature: 0.9,
    max_tokens: 200,
  })) {
    process.stdout.write(chunk.delta);
  }

  console.log("\n\nDone!");
}

main().catch(console.error);
