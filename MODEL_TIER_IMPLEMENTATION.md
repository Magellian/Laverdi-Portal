# Model Tier Implementation — Code Changes
**Date:** 2026-05-20  
**Status:** Ready to deploy  
**Default Model Change:** llama3.3-70b → deepseek-v3

---

## Files to Update

### 1. Environment Configuration (`.env.local`)

```bash
# Vultr Inference Configuration
VULTR_INFERENCE_ENDPOINT=https://inference.do-ai.run/v1
VULTR_API_KEY=sk-do-zJcFm__t2n7fAwomUx2DRMBXYvdHYhTCRMq2aDfvKCVrt0N3Sp1Or64Fkt

# Model Configuration by Tier
MODEL_TRIAL=deepseek-v3
MODEL_STARTER=deepseek-v3
MODEL_PROFESSIONAL=deepseek-r1-distill-llama-70b
MODEL_AGENCY=qwen2.5-72b-instruct
MODEL_ENTERPRISE=coming-soon  # Stub for future

# Cost per 1M tokens (for tracking)
COST_DEEPSEEK_V3=0.275
COST_DEEPSEEK_R1=1.0
COST_QWEN=0.5
```

---

## 2. Model Selection Logic (Backend)

### File: `/api/inference.ts` or `/api/chat.ts`

```typescript
// Model configuration by user tier
const MODEL_CONFIG = {
  trial: {
    model: 'deepseek-v3',
    maxTokens: 1000,
    rateLimitPerMonth: 1000,
    displayName: 'DeepSeek V3',
  },
  starter: {
    model: 'deepseek-v3',
    maxTokens: 2000,
    rateLimitPerMonth: 10000,
    displayName: 'DeepSeek V3',
  },
  professional: {
    model: 'deepseek-r1-distill-llama-70b',
    maxTokens: 4000,
    rateLimitPerMonth: 50000,
    displayName: 'DeepSeek R1 (Reasoning)',
  },
  agency: {
    model: 'qwen2.5-72b-instruct',
    maxTokens: 4000,
    rateLimitPerMonth: 100000,
    displayName: 'Qwen 2.5-72B (Advanced)',
  },
  enterprise: {
    model: null,  // Coming soon
    maxTokens: null,
    rateLimitPerMonth: null,
    displayName: 'Enterprise (Coming Soon)',
    comingSoon: true,
  },
};

// Get model for user tier
export function getModelForTier(userTier: string): string {
  const config = MODEL_CONFIG[userTier] || MODEL_CONFIG.trial;
  
  if (config.comingSoon) {
    throw new Error(
      `${config.displayName} is not yet available. ` +
      `Please contact support or upgrade to Agency tier.`
    );
  }
  
  return config.model;
}

// API endpoint for chat inference
export async function POST(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { message, userTier } = req.body;
    
    // Get model for tier
    const model = getModelForTier(userTier);
    
    // Get config
    const config = MODEL_CONFIG[userTier];
    
    // Call Vultr API
    const response = await fetch(
      `${process.env.VULTR_INFERENCE_ENDPOINT}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.VULTR_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: message }],
          max_tokens: config.maxTokens,
          temperature: 0.7,
        }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`Vultr API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Log usage for billing
    logUsage({
      userId: req.user.id,
      tier: userTier,
      model: model,
      tokensUsed: data.usage.total_tokens,
      timestamp: new Date(),
    });
    
    return res.status(200).json({
      success: true,
      response: data.choices[0].message.content,
      model: config.displayName,
      tokensUsed: data.usage.total_tokens,
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
```

---

## 3. Frontend Model Display

### File: `/pages/dashboard/chat.tsx` or similar

```typescript
import { MODEL_CONFIG } from '@/lib/models';

export function ChatInterface({ userTier }: { userTier: string }) {
  const modelConfig = MODEL_CONFIG[userTier];
  
  // If coming soon, show upgrade CTA
  if (modelConfig.comingSoon) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Enterprise Tier — Coming Soon 🚀
          </h2>
          <p className="text-gray-700 mb-6">
            Unlock premium AI models with enterprise-grade features.
            Contact support to be notified when available.
          </p>
          <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition">
            Request Early Access
          </button>
        </div>
      </div>
    );
  }
  
  // Otherwise show chat interface
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <p className="text-sm text-gray-600">
          Model: <span className="font-semibold text-gray-800">{modelConfig.displayName}</span>
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Monthly requests: {modelConfig.rateLimitPerMonth.toLocaleString()}
        </p>
      </div>
      
      {/* Chat UI here */}
      <ChatInput onSubmit={sendMessage} />
    </div>
  );
}
```

---

## 4. Settings Page (Show Available Models)

### File: `/pages/dashboard/settings.tsx` or `/pages/account/tier.tsx`

```typescript
export function TierComparison() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Trial */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="font-bold text-lg mb-2">Trial</h3>
          <p className="text-2xl font-bold text-gray-700 mb-4">Free</p>
          <div className="space-y-2 text-sm">
            <p><span className="font-semibold">AI Model:</span> DeepSeek V3</p>
            <p><span className="font-semibold">Requests/mo:</span> 1,000</p>
            <p><span className="font-semibold">Max tokens:</span> 1K</p>
          </div>
          <button className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
            Current Plan
          </button>
        </div>
        
        {/* Starter */}
        <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-400">
          <h3 className="font-bold text-lg mb-2">Starter</h3>
          <p className="text-2xl font-bold text-blue-600 mb-4">$29/mo</p>
          <div className="space-y-2 text-sm">
            <p><span className="font-semibold">AI Model:</span> DeepSeek V3</p>
            <p><span className="font-semibold">Requests/mo:</span> 10,000</p>
            <p><span className="font-semibold">Max tokens:</span> 2K</p>
          </div>
          <button className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Upgrade
          </button>
        </div>
        
        {/* Professional */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-400">
          <h3 className="font-bold text-lg mb-2">Professional</h3>
          <p className="text-2xl font-bold text-green-600 mb-4">$99/mo</p>
          <div className="space-y-2 text-sm">
            <p><span className="font-semibold">AI Model:</span> DeepSeek R1</p>
            <p className="text-xs text-gray-500">(Reasoning & Analysis)</p>
            <p><span className="font-semibold">Requests/mo:</span> 50,000</p>
            <p><span className="font-semibold">Max tokens:</span> 4K</p>
          </div>
          <button className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Upgrade
          </button>
        </div>
        
        {/* Agency */}
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-400">
          <h3 className="font-bold text-lg mb-2">Agency</h3>
          <p className="text-2xl font-bold text-purple-600 mb-4">$299/mo</p>
          <div className="space-y-2 text-sm">
            <p><span className="font-semibold">AI Model:</span> Qwen 2.5-72B</p>
            <p className="text-xs text-gray-500">(Advanced)</p>
            <p><span className="font-semibold">Requests/mo:</span> 100,000</p>
            <p><span className="font-semibold">Max tokens:</span> 4K</p>
          </div>
          <button className="mt-4 w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
            Upgrade
          </button>
        </div>
        
        {/* Enterprise (Coming Soon) */}
        <div className="bg-gradient-to-b from-gray-100 to-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-400 relative">
          <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded">
            COMING SOON
          </div>
          <h3 className="font-bold text-lg mb-2">Enterprise</h3>
          <p className="text-2xl font-bold text-gray-500 mb-4">Custom</p>
          <div className="space-y-2 text-sm text-gray-600">
            <p><span className="font-semibold">AI Model:</span> Premium</p>
            <p className="text-xs">(Claude & Advanced)</p>
            <p><span className="font-semibold">Requests/mo:</span> Unlimited</p>
            <p><span className="font-semibold">Max tokens:</span> 200K+</p>
          </div>
          <button 
            disabled 
            className="mt-4 w-full px-4 py-2 bg-gray-300 text-gray-500 rounded cursor-not-allowed opacity-50"
          >
            Notify Me
          </button>
        </div>
        
      </div>
      
      {/* Feature Comparison Table */}
      <FeatureComparisonTable />
    </div>
  );
}
```

---

## 5. Cost Tracking (Optional - for billing/analytics)

### File: `/lib/usage-logger.ts`

```typescript
interface UsageLog {
  userId: string;
  tier: string;
  model: string;
  tokensUsed: number;
  timestamp: Date;
}

const COST_PER_1M = {
  'deepseek-v3': 0.275,
  'deepseek-r1-distill-llama-70b': 1.0,
  'qwen2.5-72b-instruct': 0.5,
};

export async function logUsage(log: UsageLog) {
  const costPerToken = COST_PER_1M[log.model] / 1_000_000;
  const costThisRequest = log.tokensUsed * costPerToken;
  
  // Store in database for analytics
  await db.usageLogs.create({
    ...log,
    costToUs: costThisRequest,
  });
  
  // Optional: Update user's monthly usage stats
  await updateUserUsageStats(log.userId, log.tokensUsed, costThisRequest);
}

export async function getUserMonthlyCost(userId: string, month: Date): Promise<number> {
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  
  const logs = await db.usageLogs.findMany({
    where: {
      userId,
      timestamp: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });
  
  return logs.reduce((total, log) => total + log.costToUs, 0);
}
```

---

## 6. Rate Limiting (Optional - enforce monthly limits)

### File: `/api/middleware/rate-limit.ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next';

const RATE_LIMITS = {
  trial: 1_000,
  starter: 10_000,
  professional: 50_000,
  agency: 100_000,
  enterprise: null, // Unlimited
};

export async function checkRateLimit(
  userId: string,
  userTier: string,
  req: NextApiRequest,
  res: NextApiResponse
): Promise<boolean> {
  const limit = RATE_LIMITS[userTier];
  
  if (limit === null) {
    // Enterprise: no limit
    return true;
  }
  
  // Get current month's usage
  const now = new Date();
  const usage = await getUserMonthlyRequestCount(userId, now);
  
  if (usage >= limit) {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: `You've reached your ${limit.toLocaleString()} request limit for this month.`,
      resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      tier: userTier,
    });
    return false;
  }
  
  return true;
}
```

---

## 7. Update Documentation

### File: `/docs/models-and-tiers.md`

```markdown
# AI Models by Tier

## Trial
- **Model:** DeepSeek V3
- **Reasoning:** Fast, accurate model for most tasks
- **Max monthly requests:** 1,000
- **Max tokens per request:** 1,000

## Starter ($29/month)
- **Model:** DeepSeek V3
- **Same as Trial:** Good for cost-conscious users
- **Max monthly requests:** 10,000
- **Max tokens per request:** 2,000

## Professional ($99/month)
- **Model:** DeepSeek R1 Distill Llama-70B
- **Specialization:** Reasoning & analysis
- **Best for:** Complex problem-solving, code review, data analysis
- **Max monthly requests:** 50,000
- **Max tokens per request:** 4,000

## Agency ($299/month)
- **Model:** Qwen 2.5-72B Instruct
- **Specialization:** Advanced capabilities, multilingual
- **Best for:** Agencies managing multiple clients, multilingual support needed
- **Max monthly requests:** 100,000
- **Max tokens per request:** 4,000

## Enterprise (Coming Soon)
- **Model:** Premium models (Claude, Advanced)
- **Specialization:** Highest quality, longest context
- **Best for:** Mission-critical applications
- **Max monthly requests:** Unlimited
- **Max tokens per request:** 200,000+

**Contact us to be notified when Enterprise is available.**
```

---

## Deployment Checklist

- [ ] Update `.env.local` with new model mappings
- [ ] Update `/api/inference.ts` or `/api/chat.ts` with MODEL_CONFIG
- [ ] Update frontend tier display (settings/pricing page)
- [ ] Add "Coming Soon" badge to Enterprise tier
- [ ] Deploy usage logging (optional but recommended)
- [ ] Update documentation
- [ ] Test each tier:
  - [ ] Trial user → DeepSeek V3 works
  - [ ] Starter user → DeepSeek V3 works
  - [ ] Professional user → DeepSeek R1 works
  - [ ] Agency user → Qwen 2.5 works
  - [ ] Enterprise user → See "Coming Soon" message
- [ ] Communicate to existing users (email, changelog)
- [ ] Monitor first 24 hours for issues

---

## Rollback Plan (If Issues)

If DeepSeek V3 has problems, quickly revert:

```typescript
// In MODEL_CONFIG
trial: {
  model: 'llama3.3-70b-instruct',  // Fallback
  // ... rest of config
}
```

But honestly, DeepSeek V3 is more stable than Llama. Low risk.

---

## Marketing Message for Users

**Email / Changelog:**

```
🚀 Better AI, Same Price

We've upgraded your AI model to DeepSeek V3 — 
better quality, faster responses, at no extra cost.

What's improved:
✅ Better instruction following (more accurate results)
✅ Better reasoning (step-by-step problem solving)
✅ Better code generation (production-ready output)
✅ Better multilingual support (50+ languages)

No changes needed on your end. Enjoy! 🎉
```

---

**Status:** Ready to implement  
**Estimated time:** 2-4 hours (less if copy-pasting)  
**Risk level:** Low (models are similar enough, improvements are positive)
