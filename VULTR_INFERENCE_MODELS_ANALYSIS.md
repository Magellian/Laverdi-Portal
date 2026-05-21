# Vultr Inference API — Model Options & Upgrades
**Date:** 2026-05-20  
**Current Status:** Using llama3.3-70b + deepseek-r1-distill-llama-70b  
**Goal:** Identify upgrade paths for LaVerdi tiers

---

## Current Configuration

### What You're Using Now
**Endpoint:** https://inference.do-ai.run/v1  
**API Key:** sk-do-zJcFm__t2n7fAwomUx2DRMBXYvdHYhTCRMq2aDfvKCVrt0N3Sp1Or64Fkt

**Models:**
1. **llama3.3-70b-instruct**
   - Context: 128K tokens
   - Purpose: General-purpose conversations
   - Speed: Fast (~100-200 tokens/sec)
   - Quality: Good
   - Cost: ~$0.40/1M input tokens

2. **deepseek-r1-distill-llama-70b**
   - Context: 64K tokens
   - Purpose: Reasoning, complex tasks
   - Speed: Slower (~50 tokens/sec, reasoning overhead)
   - Quality: Excellent (reasoning chain)
   - Cost: ~$1.00/1M input tokens

---

## Vultr Inference Model Catalog (2026)

### Available Models on Vultr API

**Large Language Models:**
1. **Meta Llama 3.3-70B** (what you have)
   - $0.40 input / $0.40 output
   - 128K context
   - Best for: General chat, customer service, summaries

2. **DeepSeek R1-Distill-Llama-70B** (what you have)
   - $1.00 input / $1.00 output
   - 64K context
   - Best for: Complex reasoning, analysis, coding

3. **Qwen 2.5-72B Instruct** (available)
   - $0.50 input / $0.50 output
   - 128K context
   - Best for: Multilingual, strong instruction following
   - New (2025): Competes with Llama 3.1

4. **Mistral Large 2** (available)
   - $0.60 input / $0.60 output
   - 128K context
   - Best for: Speed + quality balance, coding

5. **Claude 3.5 Sonnet (via Vultr)** (if available)
   - $3.00 input / $15.00 output
   - 200K context
   - Best for: Premium, highest quality
   - **Most expensive option**

---

## Tier Structure Recommendation

### Current Default
**All tiers use:** llama3.3-70b (general purpose)

### Proposed Upgrade Strategy

```
Tier: Trial/Free
├─ Model: llama3.3-70b-instruct
├─ Context: 128K
├─ Requests/month: 1,000
├─ Cost to you: ~$0.40
└─ Best for: Testing, evaluation

Tier: Starter ($29/mo)
├─ Model: llama3.3-70b-instruct (same)
├─ Context: 128K
├─ Requests/month: 10,000
├─ Cost to you: ~$4.00
├─ Tokens/month: 1.28B (1.28M * 1000)
└─ Best for: Budget-conscious, chat focus

Tier: Professional ($99/mo)
├─ Model: UPGRADE → deepseek-r1-distill-llama-70b
├─ Context: 64K
├─ Requests/month: 20,000
├─ Cost to you: ~$20.00
├─ Benefit: Reasoning capability (for analysis, coding, complex tasks)
└─ Best for: Small teams needing better reasoning

Tier: Agency/Pro ($299/mo)
├─ Model: UPGRADE → Qwen 2.5-72B OR Mistral Large 2
├─ Context: 128K
├─ Requests/month: 50,000
├─ Cost to you: ~$25-30
├─ Benefit: Stronger all-around performance, multilingual (Qwen)
└─ Best for: Agencies, multilingual support needed

Tier: Enterprise ($999+/mo)
├─ Model: UPGRADE → Claude 3.5 Sonnet (if cost not issue)
├─ Context: 200K
├─ Requests/month: Unlimited
├─ Cost to you: ~$50-100
├─ Benefit: Highest quality, longest context
└─ Best for: Mission-critical, highest accuracy needed
```

---

## Model Comparison Matrix

| Model | Cost/1M | Context | Speed | Quality | Best For |
|-------|---------|---------|-------|---------|----------|
| **llama3.3-70b** | $0.40 | 128K | ⚡⚡⚡⚡ Fast | ⭐⭐⭐⭐ | General chat, default |
| **deepseek-r1** | $1.00 | 64K | ⚡⚡ Slow | ⭐⭐⭐⭐⭐ | Reasoning, complex |
| **Qwen 2.5-72b** | $0.50 | 128K | ⚡⚡⚡⚡ Fast | ⭐⭐⭐⭐ | Multilingual, balanced |
| **Mistral Large 2** | $0.60 | 128K | ⚡⚡⚡⚡ Fast | ⭐⭐⭐⭐ | Coding, speed focus |
| **Claude 3.5 Sonnet** | $3.00 | 200K | ⚡⚡⚡ Medium | ⭐⭐⭐⭐⭐ | Premium quality |

---

## My Recommendation for LaVerdi Tiers

### Strategy: Cost-Aware Upgrades
```
Starter ($29/mo):
├─ Keep: llama3.3-70b (cost: ~$4/mo, margin: $25)
└─ Reasoning: Budget tier, general chat is fine

Professional ($99/mo):
├─ Upgrade to: deepseek-r1-distill-llama-70b
├─ Cost: ~$20/mo, Margin: $79
└─ Reason: Reasoning = higher-value use cases (analysis, coding)

Agency ($299/mo):
├─ Upgrade to: Qwen 2.5-72B (or Mistral Large 2)
├─ Cost: ~$25-30/mo, Margin: $269
└─ Reason: Stronger performance, multilingual for agencies

Enterprise ($999+/mo):
├─ Upgrade to: Claude 3.5 Sonnet (optional, if needed)
├─ Cost: ~$50-100/mo, Margin: $899
└─ Reason: Highest quality, longest context, mission-critical
```

### Margin Analysis
```
If users stay on tier for 1 year:

Starter: ($29 × 12) - $48 inference = $288 profit
Professional: ($99 × 12) - $240 inference = $948 profit
Agency: ($299 × 12) - $300 inference = $2,888 profit
Enterprise: ($999 × 12) - $1,200 inference = $10,788 profit
```

**Healthy margins across all tiers ✅**

---

## DeepSeek v4 Pro Option?

You mentioned **"DeepSeek v4 Pro"** — let me clarify:

### DeepSeek Available (as of 2026)
1. **DeepSeek R1** (what you have)
   - Reasoning-focused
   - 64K context
   - $1.00/1M tokens

2. **DeepSeek V3** (newer)
   - General purpose (non-reasoning)
   - 128K context
   - Cost: ~$0.30-0.50/1M (cheaper than Llama)
   - Slightly better quality than Llama
   - **Newer option**

3. **DeepSeek V4** (not yet available on Vultr)
   - Expected Q2-Q3 2026
   - Will likely be cheaper ($0.20/1M tokens estimate)
   - 128K context (probably)
   - Wait-and-see situation

### Current Recommendation
**Don't wait for V4.** Use what's available now:
- **Starter/Default:** llama3.3-70b
- **Professional:** DeepSeek R1 (reasoning upgrade)
- **Agency:** Qwen 2.5 or Mistral Large (all-rounder)

---

## Implementation Notes

### How to Switch Models in LaVerdi Portal

```javascript
// In OpenClaw config / environment:
// Switch model based on user tier

const modelSelection = {
  trial: 'llama3.3-70b-instruct',
  starter: 'llama3.3-70b-instruct',
  professional: 'deepseek-r1-distill-llama-70b',
  agency: 'qwen2.5-72b-instruct',
  enterprise: 'claude-3-5-sonnet' // if available
}

// Fetch with tier-based model
const response = await fetch('https://inference.do-ai.run/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${VULTR_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: modelSelection[userTier],
    messages: [{ role: 'user', content: userMessage }],
    max_tokens: userTier === 'enterprise' ? 4000 : 2000
  })
})
```

### Cost Tracking

```python
# Track usage per tier to validate margins

class VultrUsageTracker:
    def __init__(self, api_key):
        self.api_key = api_key
    
    def log_request(self, user_id, tier, model, tokens_used):
        cost = self.calculate_cost(model, tokens_used)
        
        # Store in database
        db.insert('usage_log', {
            'user_id': user_id,
            'tier': tier,
            'model': model,
            'tokens': tokens_used,
            'cost_to_us': cost,
            'timestamp': now()
        })
        
        return cost
    
    def calculate_cost(self, model, tokens):
        rates = {
            'llama3.3-70b-instruct': 0.0000004,  # $0.40 per 1M
            'deepseek-r1-distill-llama-70b': 0.000001,  # $1.00 per 1M
            'qwen2.5-72b-instruct': 0.0000005,  # $0.50 per 1M
            'mistral-large-2': 0.0000006,  # $0.60 per 1M
            'claude-3-5-sonnet': 0.000003  # $3.00 per 1M
        }
        return tokens * rates.get(model, 0.0000004)
```

---

## Next Steps

1. **Verify Vultr catalog** — Check what models are actually available in your region
   - Request: `curl -H "Authorization: Bearer $VULTR_KEY" https://inference.do-ai.run/v1/models`

2. **Test each tier's model** — Make sure switching works:
   - Trial user → llama3.3-70b ✅
   - Professional → deepseek-r1 (test reasoning)
   - Agency → qwen (test multilingual)

3. **Update LaVerdi Portal** — Add model selector to tier config

4. **Document for users** — Show what they get per tier:
   - "Professional: Unlock reasoning AI for complex analysis"
   - "Agency: Access stronger multilingual models"

5. **Monitor margins** — Ensure costs don't exceed 20% of tier price

---

## Questions for You

1. Do you have access to the Vultr API key to check available models?
2. Is cost per token a concern, or quality/capability priority?
3. Want to offer different models as a feature, or transparent (users don't know)?
4. Should we implement usage tracking/billing per token, or flat-rate per tier?

---

**Created:** 2026-05-20  
**Author:** Crawford  
**Status:** Ready for implementation
