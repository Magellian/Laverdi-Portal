# TODO: DigitalOcean Inference API Setup

**Status:** SHELVED (implement after OpenClaw launch)  
**Priority:** Medium (can use free models until configured)  
**Effort:** ~30 minutes

## What Needs to Happen

Configure DigitalOcean Inference API to use your account for model calls:

### API Configuration
```bash
POST /api/configure-inference
{
  "provider": "digitalocean",
  "apiKey": "sk-do-REDACTED_DO_INFERENCE_KEY",
  "accountId": "dcvrkpgvxqdcboostkpz",
  "models": ["claude-opus-4.6", "claude-sonnet-4.6", "claude-haiku-4.5"]
}
```

### What This Does
- Routes OpenClaw model calls → DigitalOcean Inference API
- Uses your account's inference credits
- Enables users to get responses from Claude models
- Tracks usage per user/agent

## Files to Update Later
- `/root/laverdi-portal/lib/models.ts` — Already has DO config, just needs API wiring
- `/root/laverdi-portal/pages/api/call.ts` — Model routing logic
- OpenClaw container env vars — Add DO_INFERENCE_KEY

## Can Launch Without This
✅ OpenClaw runs fine with local models or free endpoints  
✅ Inference can be added after launch  
✅ Users can manually add their own API keys until then  

## When to Do This
**After tonight's launch** when you've confirmed:
- Containers provisioning
- Dashboard updating
- OpenClaw accessible and running

Then come back and wire up inference.

## Reference
- DO Inference docs: https://docs.digitalocean.com/products/ai-platform/inference/
- Current API key: `sk-do-REDACTED_DO_INFERENCE_KEY`
- Account ID: `dcvrkpgvxqdcboostkpz`
