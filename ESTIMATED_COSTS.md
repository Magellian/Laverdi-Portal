# Estimated Costs: Retell AI Integration for Fife RV

**TL;DR:** ~$22–35/month recurring + $6,000–9,000 one-time development. ROI: ~16 months (vs. manual after-hours staffing at $500/month).

---

## Recurring Monthly Costs

### 1. Retell AI Voice Service

**Pricing Model:** Pay-as-you-go, charged per minute (seconds precision)

#### Voice Infrastructure Components

```
Base Retell Infrastructure:   $0.055/minute
Text-to-Speech (TTS):         $0.015/minute (Retell-native voices)
Large Language Model (LLM):   $0.045/minute (GPT-4.1, recommended)
───────────────────────────────────────
Total per minute:             $0.115/minute
```

#### Estimated Usage (Fife RV Scenario)

**Assumptions:**
- 30 after-hours calls/month (weekday evenings + weekends)
- 3 minutes average call duration
- LLM: GPT-4.1 (good balance of cost vs. quality)
- TTS: Retell platform voices (cheapest option)

**Calculation:**

```
30 calls × 3 minutes = 90 total minutes/month
90 minutes × $0.115/minute = $10.35/month

Breakdown:
  Infrastructure: 90 × $0.055 = $4.95
  TTS:            90 × $0.015 = $1.35
  LLM (GPT-4.1):  90 × $0.045 = $4.05
  ──────────────────────────────
  Total:                        $10.35
```

**Cost Range (Different Scenarios):**

| Scenario | Calls/mo | Dur/call | LLM | Total/mo |
|----------|----------|----------|-----|----------|
| Light (estimate) | 20 | 2 min | GPT-4.1 mini | $4.60 |
| Medium (realistic) | 30 | 3 min | GPT-4.1 | $10.35 |
| Heavy (busy period) | 50 | 3.5 min | GPT-4.1 | $20.16 |
| Peak (worst case) | 75 | 4 min | Claude Sonnet | $48.30 |

---

### 2. Phone Number Costs

**Option A: Buy from Retell**
- Monthly cost: $2.00/month
- Setup: Instant (via dashboard)
- Best for: New deployments, integration testing

**Option B: Import Existing Number (via SIP Trunk)**
- Monthly cost: $0.00 (if using existing SIP provider)
- Setup: Requires SIP trunk config (more work)
- Best for: Existing corporate phone numbers

**Recommendation:** Option B (use existing Fife RV number)
- Cost savings: $2/month
- Keeps same customer-facing phone number
- Better brand continuity

---

### 3. Call Recording & Transcription

**Retell Includes:**
- ✅ Call recording (automatic)
- ✅ Real-time transcription
- ✅ Webhook delivery
- ✅ 10-minute access to recording URL
- ✅ No additional charge for recording/transcription

**Additional Cost: PII Removal (Optional)**
- +$0.01/minute (if enabled)
- Auto-redacts: SSNs, credit cards, etc.
- Recommended for compliance
- Cost: 90 min × $0.01 = $0.90/month

---

### 4. Notification Costs (Email & SMS)

#### SMS Alerts (for emergencies)

**Provider:** Twilio (or similar)
- Cost: ~$0.0075 per SMS sent
- Frequency: ~3–5 emergency alerts/month
- Monthly cost: 5 × $0.0075 = $0.04/month

#### Email Notifications

**Provider:** SendGrid (or similar)
- Cost: Free for <100 emails/month
- Frequency: 30 emails/month (one per call + reminders)
- Monthly cost: $0/month

**Subtotal: ~$0.04/month**

---

### 5. Monitoring & Logging (Optional)

**Options:**
- Free: CloudWatch (AWS) or built-in logging
- Paid: Datadog, New Relic, Splunk

**Recommended:** Free (built-in) for launch, upgrade later if needed

**Cost: $0/month (initially)**

---

### 6. Backend Hosting (Webhook Endpoint + Callback Scheduler)

**Options:**

**Option A: Serverless (Recommended for small scale)**
- AWS Lambda: $0.20 per 1M requests (~$1–2/month)
- AWS API Gateway: $3.50 per million requests (~$0.10/month)
- Total: ~$2–3/month

**Option B: Container (Docker on EC2/ECS)**
- AWS EC2 t3.micro: $6–10/month
- Or: Heroku dyno: $7–25/month
- Total: $6–25/month

**Option C: Existing Infrastructure**
- If Fife RV already has on-premises or cloud servers: $0 (no incremental cost)
- Recommended: Use existing infrastructure

**Cost: $0–25/month (assume existing = $0)**

---

### 7. Database Storage (Call Records)

**Assumptions:**
- 30 calls/month × 12 months = 360 calls/year
- Each record: ~2 KB (metadata only; transcripts stored in Retell)
- 5 years of retention: 1,800 records × 2 KB = 3.6 MB

**Provider:** Existing database (PostgreSQL, MySQL, etc.)
- Cost if existing: $0 (already paying for DB)
- Cost if new: $5–15/month (small DB instance)

**Cost: $0–15/month (assume existing = $0)**

---

### 8. SIP Trunk / Carrier Costs

**Note:** Retell provides SIP trunking at no extra charge.

**If using external SIP provider (Twilio, Telnyx, etc.) for phone calls:**
- Incoming calls: Usually included in phone number cost
- Outgoing calls: Typically $0.005–0.020/minute
- For Fife RV: Minimal (mostly inbound after-hours)
- Estimated: $0–2/month

**Cost: $0–2/month**

---

## Total Recurring Monthly Costs

```
Retell AI voice service:        $10.35
  (infrastructure + TTS + LLM)

Phone number (existing):        $0.00

PII removal (optional):         $0.90

Notifications (SMS+email):      $0.04

Backend hosting:                $0.00
  (using existing infrastructure)

Database:                       $0.00
  (using existing database)

SIP trunk:                      $1.00
  (estimate for carrier costs)

────────────────────────────────────
TOTAL:                          $12.29/month

REALISTIC RANGE:                $15–25/month
  (including overhead, testing, contingency)

BUDGET ALLOCATION:              $30/month
  (gives 2x safety margin)
```

---

## One-Time Development Costs

### 1. Retell AI Agent Configuration

**Tasks:**
- Design conversation flow
- Write system prompts
- Configure post-call analysis fields
- Voice selection & testing
- Testing & refinement

**Time:** 20–30 hours
**Cost:** $0 (if internal team handles)
**External resource cost:** 25 hrs × $150/hr = $3,750

---

### 2. UC Connect SIP Trunk Configuration

**Tasks:**
- Research UC Connect Telco API
- Design SIP trunk config
- Configure in CUC Web UI
- Test routing
- Firewall rule setup

**Time:** 15–20 hours
**Cost:** 17.5 hrs × $150/hr = $2,625 (external consultant)
**Or:** Free (if internal IT team, already has access)

---

### 3. Webhook Handler Development

**Tasks:**
- Design API endpoint
- Implement signature verification
- Database schema design
- Error handling & logging
- Testing & documentation

**Time:** 30–40 hours
**Tech stack:** Node.js or Python

**Cost breakdown (if external):**
- Senior developer: 35 hrs × $200/hr = $7,000
- Or: Mid-level dev: 35 hrs × $120/hr = $4,200

**Cost (estimate): $4,200–7,000**

---

### 4. Callback Scheduler & Orchestration

**Tasks:**
- Background job implementation (cron/APScheduler/Sidekiq)
- Manager availability checking
- Retell outbound API integration
- Retry logic & error handling
- Database status tracking

**Time:** 25–35 hours

**Cost (external):**
- Developer: 30 hrs × $120/hr = $3,600

**Cost (estimate): $3,600**

---

### 5. Notification System (Email/SMS)

**Tasks:**
- Email template design
- SMS template design
- Integration with SendGrid/Twilio
- Testing
- Documentation

**Time:** 10–15 hours

**Cost (external):**
- Developer: 12 hrs × $100/hr = $1,200

**Cost (estimate): $1,200**

---

### 6. CRM Integration (Optional)

**Tasks:**
- API research (for CRM)
- Data mapping (call data → CRM fields)
- Integration code
- Testing
- Documentation

**Time:** 15–25 hours (depends on CRM complexity)

**Cost (external):**
- Developer: 20 hrs × $120/hr = $2,400

**Cost (estimate): $2,400 (if needed)**

---

### 7. QA Testing & Documentation

**Tasks:**
- Test plan development
- Manual testing (10+ scenarios)
- Load testing
- UAT coordination
- Runbook & troubleshooting guide
- Staff training

**Time:** 30–50 hours

**Cost (external):**
- QA engineer: 40 hrs × $100/hr = $4,000
- Or: Internal team: Free (but ~40 hours of time)

**Cost (estimate): $4,000 (if external)**

---

### 8. Project Management & Contingency

**Tasks:**
- Project planning & coordination
- Stakeholder communication
- Risk management
- Scope changes
- Buffer for unexpected issues

**Contingency:** 10–15% of total

---

## Total One-Time Development Costs

### Scenario A: All External (Consultant Team)

```
Agent configuration:            $3,750
SIP trunk config:               $2,625
Webhook handler:                $5,000
Callback scheduler:             $3,600
Notifications:                  $1,200
CRM integration:                $2,400 (optional)
QA & Documentation:             $4,000
Project management (10%):       $2,357
────────────────────────────────────
TOTAL:                          $24,932

REALISTIC ESTIMATE:             $22,000–26,000
```

### Scenario B: Hybrid (Mix Internal + External)

```
Agent config (internal):        $0
SIP trunk config (internal IT): $0
Webhook handler (external):     $5,000
Callback scheduler (internal):  $0
Notifications (internal):       $0
CRM integration (external):     $2,400 (optional)
QA (internal + external):       $2,000
Project management (internal):  $0
────────────────────────────────────
TOTAL:                          $9,400

REALISTIC ESTIMATE:             $8,000–11,000
```

### Scenario C: Mostly Internal

```
All technical work:             $0 (internal team)
External QA/testing (optional): $0
PM & oversight:                 $0
────────────────────────────────────
TOTAL:                          $0 (time cost only, ~100–150 hours)

REALISTIC ESTIMATE:             $0 (time value: ~$12,000–18,000)
```

---

## Cost Summary

| Category | Low | Mid | High |
|----------|-----|-----|------|
| **Monthly Recurring** | $15 | $25 | $35 |
| **One-Time (Internal)** | $0 | $8,000 | $12,000 |
| **One-Time (External)** | $18,000 | $22,000 | $26,000 |
| **Year 1 Total (Internal)** | $180 | $8,300 | $12,420 |
| **Year 1 Total (External)** | $18,180 | $22,300 | $26,420 |

---

## ROI Analysis

### Assumptions

- **Current after-hours staffing:** $500/month (owner on-call, ~5 hrs/week @ $20/hr)
- **New system cost:** $25/month (Retell + overhead)
- **Monthly savings:** $500 - $25 = $475/month
- **Development cost:** $9,000 (hybrid scenario)

### Payback Period

```
Payback = Development Cost / Monthly Savings
Payback = $9,000 / $475
Payback = 18.9 months ≈ 19 months

Year 1 (net):  -$9,000 + $475 × 8 months = -$5,200 loss
Year 2 (net):  +$475 × 12 months = +$5,700 gain
Year 3+ (net): +$475 × 12 months = +$5,700 gain/year
```

### 5-Year Total Cost of Ownership

```
Development (Year 1):           -$9,000
Monthly costs (5 years):        -$25 × 60 = -$1,500
Manual after-hours (baseline):  +$500 × 60 = +$30,000
────────────────────────────────────────────────
NET 5-YEAR BENEFIT:             +$19,500
```

### Alternative: Status Quo (Manual After-Hours)

```
Year 1: $500/month × 12 = $6,000
Year 2: $6,000 (cost increases ~3% = $150 → $6,180)
Year 3: $6,180 × 1.03 = $6,365
Year 4: $6,365 × 1.03 = $6,556
Year 5: $6,556 × 1.03 = $6,753
────────────────────────────────
5-Year Total:           $31,854
```

### With Retell AI

```
Year 1: $9,000 development + $25 × 12 months = $9,300
Year 2: $25 × 12 = $300
Year 3: $300
Year 4: $300
Year 5: $300
────────────────────────────────
5-Year Total:           $10,500
```

### ROI = Savings / Investment

```
5-Year Savings = Status Quo Cost - Retell Cost
             = $31,854 - $10,500
             = $21,354

ROI = ($21,354 / $10,500) × 100% = 203% over 5 years
```

**Annualized ROI (Year 2+): 1,900% ($475 savings / $25 cost)**

---

## Cost Scenarios by Usage

### Light Usage (10 calls/month)

```
Retell AI:             $3.45/month
Phone number:          $0
Notifications:         $0.02/month
─────────────────────────────
MONTHLY:               $3.50
YEARLY:                $42
5-YEAR:                $210

BREAK-EVEN:            19 months (with $9,000 dev cost)
```

### Medium Usage (30 calls/month) — **Recommended Estimate**

```
Retell AI:             $10.35/month
Phone number:          $0
Notifications:         $0.04/month
─────────────────────────────
MONTHLY:               $10.40
YEARLY:                $125
5-YEAR:                $620

BREAK-EVEN:            19 months (with $9,000 dev cost)
MONTHLY SAVINGS:       $490 (vs. manual)
```

### Heavy Usage (50 calls/month)

```
Retell AI:             $17.25/month
Phone number:          $0
Notifications:         $0.06/month
─────────────────────────────
MONTHLY:               $17.35
YEARLY:                $208
5-YEAR:                $1,040

BREAK-EVEN:            18 months (with $9,000 dev cost)
MONTHLY SAVINGS:       $483 (vs. manual)
```

---

## Cost Optimization Tips

### 1. Reduce LLM Cost

**Option:** Use cheaper LLM for routine calls
- GPT-4.1 mini: $0.016/min (vs. $0.045 for full GPT-4.1)
- Gemini 3.0 Flash: $0.027/min
- Monthly savings: 90 min × ($0.045 - $0.027) = $1.62/month

**Trade-off:** Slightly lower response quality

### 2. Use Retell Platform Voices Instead of ElevenLabs

- Retell voices: $0.015/min
- ElevenLabs: $0.040/min
- Savings: 90 min × ($0.040 - $0.015) = $2.25/month

**Trade-off:** Less natural-sounding voice

### 3. Optimize Call Duration

**Current:** 3 min average call time
- Retell cost: $0.115/min × 3 min = $0.345/call

**Optimized:** 2.5 min average (via better prompts)
- Retell cost: $0.115/min × 2.5 min = $0.288/call
- Savings: 30 calls × ($0.345 - $0.288) = $1.71/month

### 4. Batch Callbacks Efficiently

**Current:** 30 callbacks, each 2 min (outbound calls charged same rate)
- Cost: 30 calls × 2 min × $0.115 = $6.90/month

**Optimized:** Schedule callbacks in batches, consolidate if possible
- Savings: ~$1–2/month

### 5. Host Webhook on Existing Infrastructure

- Avoid renting new cloud servers
- Savings: $6–25/month

**Total monthly optimization potential: $5–15/month**

---

## Cost Breakdown by Component

### Percentage of Total Monthly Cost

```
Retell AI voice service:  82% ($10.35 of $12.62)
Phone number:             0%
Notifications:            0%
Backend hosting:          0%
Database:                 0%
Other:                    18%
```

**Key insight:** Most cost is from Retell's LLM/TTS. Cost optimization should focus on:
1. Reducing call duration
2. Using cheaper LLM
3. Automating more (reducing need for callbacks)

---

## Budget Allocation

### Year 1

```
Development:               $9,000 (one-time)
Operations:                $125   ($10.40/month × 12)
Contingency (10%):         $912
────────────────────────────────
TOTAL YEAR 1:              $10,037
```

### Years 2–5

```
Operations/year:           $125   ($10.40/month × 12)
Contingency (10%):         $13
Maintenance/upgrades:      $500   (estimate)
────────────────────────────────
TOTAL PER YEAR:            $638
```

### 5-Year Budget

```
Year 1:    $10,037
Year 2:    $638
Year 3:    $638
Year 4:    $638
Year 5:    $638
────────────────────────────────
TOTAL:     $13,589
```

---

## Hidden Costs (Not Included Above)

- **Staff training:** ~10 hours × $50/hr = $500 (one-time)
- **Support time:** ~5 hours/month × $50/hr = $250/month (ongoing)
- **Monitoring tools:** $0 (using free options) to $100/month (if upgraded)
- **Security audit:** $1,000 (one-time, optional)
- **Data backup:** Included in existing infrastructure

---

## Cost Approval Checklist

- ☐ One-time development budget approved: **$9,000**
- ☐ Monthly operating budget approved: **$25/month**
- ☐ ROI timeline acceptable: **19 months payback**
- ☐ 5-year forecast approved: **$13,589 total investment**
- ☐ Contingency (20%) approved: **$2,718**

---

## Summary

**Fife RV can launch Retell AI for after-hours reception with:**

- **One-time cost:** $8,000–12,000 (hybrid internal/external development)
- **Recurring cost:** $25/month
- **Payback period:** ~19 months
- **5-year ROI:** 203% net savings of $21,354
- **Monthly savings vs. manual:** ~$475 (ongoing)

**Recommendation:** Proceed with implementation. Cost is justified by both direct savings (labor) and indirect benefits (24/7 availability, better customer experience).
