# Example 5: Using Vultr tools from an OpenClaw agent

Once the MCP server is configured, your OpenClaw agents can use these tools natively.

## Agent prompt examples

```
Use the vultr_chat_complete tool to answer: "What are the best practices for REST API design?"
```

```
Use vultr_list_models to show what models are available, then use vultr_chat_complete with deepseek-r1-distill-llama-70b to solve: "Prove that √2 is irrational."
```

```
Use vultr_chat_stream to generate a 3-paragraph blog post about serverless computing.
```

## MCP tool call format

### vultr_chat_complete
```json
{
  "tool": "vultr_chat_complete",
  "arguments": {
    "prompt": "Explain containerization in simple terms",
    "model": "llama3.3-70b-instruct",
    "system": "You are a technical writer targeting beginners.",
    "temperature": 0.7,
    "max_tokens": 500
  }
}
```

### vultr_chat_stream
```json
{
  "tool": "vultr_chat_stream",
  "arguments": {
    "prompt": "Write a detailed explanation of how the internet works",
    "model": "llama3.3-70b-instruct",
    "max_tokens": 2000
  }
}
```

### vultr_list_models
```json
{
  "tool": "vultr_list_models",
  "arguments": {}
}
```

### Multi-turn via messages array
```json
{
  "tool": "vultr_chat_complete",
  "arguments": {
    "prompt": "",
    "messages": [
      { "role": "system", "content": "You are a code reviewer." },
      { "role": "user", "content": "Review this function: function add(a,b){return a+b}" },
      { "role": "assistant", "content": "This function looks correct but lacks type annotations..." },
      { "role": "user", "content": "How would you add TypeScript types?" }
    ]
  }
}
```

## OpenClaw config (add to ~/.openclaw/config.json)

```json
{
  "mcpServers": {
    "vultr": {
      "command": "node",
      "args": ["/opt/vultr-mcp-server/dist/index.js"],
      "env": {
        "VULTR_API_KEY": "sk-do-zJcFm__t2n7fAwomUx2DRMBXYvdHYhTCRMq2aDfvKCVrt0N3Sp1Or64Fkt"
      }
    }
  }
}
```
