/**
 * Example 1: Basic chat with Vultr inference (SDK)
 * Run: VULTR_API_KEY=sk-... ts-node 01-basic-chat.ts
 */

import { VultrClient } from "../../vultr-sdk/src/client";

const client = new VultrClient({
  apiKey: process.env.VULTR_API_KEY!,
  defaultModel: "llama3.3-70b-instruct",
});

async function main() {
  console.log("=== Basic Chat Example ===\n");

  // Simple Q&A
  const result = await client.chat("What is quantum computing in 2 sentences?");
  console.log("Q: What is quantum computing in 2 sentences?");
  console.log("A:", result.content);
  console.log("\nUsage:", result.usage);

  // With system prompt
  const result2 = await client.chat("What should I name my cat?", {
    system: "You are a creative naming expert who loves mythology.",
    temperature: 1.0,
  });
  console.log("\n--- With system prompt ---");
  console.log("Q: What should I name my cat?");
  console.log("A:", result2.content);

  // DeepSeek reasoning model
  const result3 = await client.chat(
    "If a train travels 60mph for 2.5 hours, how far does it travel? Show your work.",
    { model: "deepseek-r1-distill-llama-70b" }
  );
  console.log("\n--- DeepSeek Reasoning ---");
  console.log("A:", result3.content);
}

main().catch(console.error);
