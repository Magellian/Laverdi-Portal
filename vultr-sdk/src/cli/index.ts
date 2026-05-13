#!/usr/bin/env node
/**
 * Vultr CLI — interact with Vultr inference from the command line
 *
 * Usage:
 *   vultr chat "What is the capital of France?"
 *   vultr chat --model deepseek-r1-distill-llama-70b "Explain recursion"
 *   vultr models
 *   vultr config set apiKey sk-...
 *   vultr config show
 */

import { Command } from "commander";
import { VultrClient } from "../client";
import { VultrModel } from "../types";

// ── Config storage ────────────────────────────────────────────────────────────

// Simple JSON config stored in home dir
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const CONFIG_FILE = path.join(os.homedir(), ".vultr-sdk", "config.json");

interface CliConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
}

function loadConfig(): CliConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    }
  } catch {}
  return {};
}

function saveConfig(config: CliConfig): void {
  fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function getApiKey(cliKey?: string): string {
  const key = cliKey || process.env.VULTR_API_KEY || loadConfig().apiKey;
  if (!key) {
    console.error("Error: API key required. Set via --api-key, VULTR_API_KEY env, or `vultr config set apiKey <key>`");
    process.exit(1);
  }
  return key;
}

// ── CLI setup ─────────────────────────────────────────────────────────────────

const program = new Command();

program
  .name("vultr")
  .description("CLI for Vultr inference API")
  .version("1.0.0")
  .option("-k, --api-key <key>", "Vultr API key (overrides env/config)")
  .option("-u, --base-url <url>", "Vultr base URL", "https://inference.do-ai.run/v1");

// ── chat ──────────────────────────────────────────────────────────────────────

program
  .command("chat <prompt>")
  .description("Send a prompt and get a response")
  .option("-m, --model <model>", "Model to use", "llama3.3-70b-instruct")
  .option("-s, --system <system>", "System prompt")
  .option("-t, --temperature <temp>", "Temperature (0-2)", parseFloat)
  .option("-n, --max-tokens <n>", "Max tokens", parseInt)
  .option("--stream", "Stream the response token by token")
  .option("--json", "Output raw JSON")
  .action(async (prompt: string, options) => {
    const parentOpts = program.opts();
    const apiKey = getApiKey(parentOpts.apiKey);
    const client = new VultrClient({
      apiKey,
      baseUrl: parentOpts.baseUrl,
      defaultModel: options.model as VultrModel,
    });

    if (options.stream) {
      process.stdout.write("\n");
      for await (const chunk of client.chatStream(prompt, {
        model: options.model,
        system: options.system,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
      })) {
        process.stdout.write(chunk.delta);
      }
      process.stdout.write("\n\n");
    } else {
      const result = await client.chat(prompt, {
        model: options.model,
        system: options.system,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
      });

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log("\n" + result.content + "\n");
        if (result.usage) {
          console.error(
            `[${result.model}] tokens: ${result.usage.prompt_tokens}→${result.usage.completion_tokens} (total: ${result.usage.total_tokens})`
          );
        }
      }
    }
  });

// ── models ────────────────────────────────────────────────────────────────────

program
  .command("models")
  .description("List available Vultr inference models")
  .option("--json", "Output raw JSON")
  .action(async (options) => {
    const parentOpts = program.opts();
    const apiKey = getApiKey(parentOpts.apiKey);
    const client = new VultrClient({ apiKey });
    const models = client.listModels();

    if (options.json) {
      console.log(JSON.stringify(models, null, 2));
    } else {
      console.log("\nAvailable Vultr Inference Models:\n");
      for (const m of models) {
        console.log(`  • ${m.id}`);
        console.log(`    Context: ${m.context_window.toLocaleString()} tokens`);
        console.log(`    Caps: ${m.capabilities.join(", ")}`);
        console.log();
      }
    }
  });

// ── config ────────────────────────────────────────────────────────────────────

const configCmd = program.command("config").description("Manage CLI configuration");

configCmd
  .command("set <key> <value>")
  .description("Set a config value (apiKey, baseUrl, defaultModel)")
  .action((key: string, value: string) => {
    const config = loadConfig();
    (config as Record<string, string>)[key] = value;
    saveConfig(config);
    console.log(`✓ Set ${key}`);
  });

configCmd
  .command("get <key>")
  .description("Get a config value")
  .action((key: string) => {
    const config = loadConfig();
    const val = (config as Record<string, string>)[key];
    if (val) console.log(val);
    else console.error(`No config value for: ${key}`);
  });

configCmd
  .command("show")
  .description("Show all config values")
  .action(() => {
    const config = loadConfig();
    const display = { ...config };
    if (display.apiKey) display.apiKey = display.apiKey.slice(0, 10) + "...";
    console.log(JSON.stringify(display, null, 2));
  });

configCmd
  .command("path")
  .description("Show config file path")
  .action(() => console.log(CONFIG_FILE));

// ── embed ─────────────────────────────────────────────────────────────────────

program
  .command("embed <text>")
  .description("Generate embeddings for text")
  .option("--json", "Output raw JSON")
  .action(async (text: string, options) => {
    const parentOpts = program.opts();
    const apiKey = getApiKey(parentOpts.apiKey);
    const client = new VultrClient({ apiKey, baseUrl: parentOpts.baseUrl });
    const result = await client.embed(text);
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      const v = result.embeddings[0]?.vector;
      console.log(`\nEmbedding vector (${v?.length ?? 0} dims):`);
      if (v) console.log(`  [${v.slice(0, 8).map(n => n.toFixed(4)).join(", ")} ...]`);
    }
  });

program.parse();
