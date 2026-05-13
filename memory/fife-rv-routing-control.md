# Fife RV AI Receptionist — Call Routing Control System

**Status:** Technical Design  
**Created:** 2026-04-30

---

## OVERVIEW

The main line (253) 284-6600 needs flexible routing control to:
- Turn AI on/off dynamically (staffing changes, seasonal variations)
- Handle unexpected closures or events
- Accommodate different after-hours schedules (summer vs. winter)
- Allow manual override when needed

**Solution:** Three-tier routing control system with admin dashboard.

---

## THREE ROUTING OPTIONS

### Option A: Simple On/Off Toggle (Recommended for Phase 1)

**How it works:**
```
Call to (253) 284-6600
    ↓
Check routing status in Supabase
    ↓
IF "ai_active" = true:
    Route to Retell AI
ELSE:
    Route to voicemail / direct number
```

**Admin Dashboard:**
- Big toggle button: "AI Receptionist: ON / OFF"
- Last changed: [date/time]
- Changed by: [admin user]
- Quick notes: [optional reason]

**Use Cases:**
- ✅ Unexpected staff in office → turn AI off
- ✅ Building closed early → turn AI off
- ✅ Holiday closure → turn AI off
- ✅ Training day → turn AI off
- ✅ Normal after-hours → turn AI on

**Pros:**
- Simple, fast, no training needed
- Can change instantly (15 seconds)
- Clear visibility (toggle state obvious)

**Cons:**
- Requires manual action every day
- Risk of forgetting to toggle off

**Cost:** Minimal (add boolean flag to Supabase)

---

### Option B: Direct Transfer Line (Manual Override)

**How it works:**
```
Employee dials secondary number (e.g., extension *99 or dedicated line)
    ↓
System activates AI routing
    ↓
Main line (253) 284-6600 now goes to Retell AI
    ↓
Employee can deactivate later with another call/code
```

**Setup:**
- Secondary dial-in code: `*99` (activate) / `*98` (deactivate)
- Or: Separate direct line that employees call
- Requires: Simple authentication (PIN or account ID)

**Use Cases:**
- ✅ Manager realizes office will be empty → calls *99 immediately
- ✅ Unexpected event happens → staff activates AI without IT
- ✅ Employee working late → deactivates AI to answer calls
- ✅ Testing before full deployment

**Pros:**
- Immediate action (no dashboard needed)
- Staff can control without IT support
- Works in emergencies (call from mobile)

**Cons:**
- Requires training staff on codes
- Risk of accidental activation/deactivation
- Not suitable for recurring schedules

**Cost:** Low (add webhook listener for phone codes)

---

### Option C: Time-Based Scheduling (Automated)

**How it works:**
```
Define after-hours schedules in admin panel:
  - Monday-Friday: 6 PM - 8 AM
  - Saturday: All day
  - Sunday: All day
  - Holidays: Full day
  
System automatically checks current time:
  ↓
IF current_time is in after_hours_window:
    AI is ON
ELSE:
    AI is OFF (send to voicemail/human)
```

**Admin Dashboard:**
- Weekly schedule view (like Google Calendar)
- Set after-hours slots per day
- Holiday exceptions
- Time zone selection (Pacific)
- Daylight saving auto-adjust

**Use Cases:**
- ✅ Summer hours (different schedule): Set in March
- ✅ Winter hours (earlier closing): Set in September
- ✅ Holiday closures: Add to exceptions
- ✅ Special hours: Block out specific days
- ✅ Automation: System handles itself 99% of the time

**Pros:**
- Fully automated (no daily action needed)
- Easy to adjust for seasons
- Holiday management built-in
- Clear audit trail

**Cons:**
- Requires setup time initially
- Less useful for unexpected closures
- Need override for emergencies

**Cost:** Medium (scheduling engine + admin UI)

---

## RECOMMENDED APPROACH: THREE-TIER HYBRID

**Combine all three for maximum flexibility:**

### Tier 1: Time-Based Scheduling (Default)
```
System has default after-hours schedule:
- Monday-Friday: 6 PM - 8 AM (AI on)
- Saturday: All day (AI on)
- Sunday: All day (AI on)
- Holidays: All day (AI off)

This runs automatically, no action needed.
```

### Tier 2: Manual Toggle (Emergency Override)
```
If something unexpected happens:
1. Manager logs into admin dashboard
2. Clicks "Emergency: Disable AI" toggle
3. AI turns off immediately
4. Toggle resets to time-based schedule at next scheduled window
```

### Tier 3: Direct Transfer Line (Field Control)
```
If manager is away from computer:
1. Call designated override number: (253) 284-6601 (ext *99)
2. Verify with PIN: ____
3. AI routing enabled/disabled
4. SMS confirmation sent
```

**Example Flow:**
```
Morning: AI off (automatic, not after-hours)
↓
5:30 PM: Manager realizes office staff left early
↓
Calls *99 code or admin dashboard
↓
AI routing turned on
↓
10:00 PM: AI still on (within scheduled after-hours)
↓
8:30 AM next day: AI automatically turns off (end of after-hours window)
```

---

## IMPLEMENTATION DETAILS

### Database Schema (Supabase)

```sql
-- Routing status table
CREATE TABLE routing_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_active BOOLEAN DEFAULT true,
  toggle_reason VARCHAR(100),
  manual_override BOOLEAN DEFAULT false,
  override_until TIMESTAMP,
  last_changed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  changed_by VARCHAR(100),
  notes TEXT
);

-- Scheduling table
CREATE TABLE after_hours_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INT (0=Sunday, 6=Saturday),
  start_time TIME,
  end_time TIME,
  active BOOLEAN DEFAULT true,
  notes TEXT
);

-- Holiday exceptions
CREATE TABLE holiday_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE,
  reason VARCHAR(100),
  ai_active BOOLEAN DEFAULT false,
  notes TEXT
);

-- Audit log (track all changes)
CREATE TABLE routing_changes_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  previous_state BOOLEAN,
  new_state BOOLEAN,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  changed_by VARCHAR(100),
  method VARCHAR(50) ('manual_toggle' | 'time_based' | 'transfer_code'),
  reason TEXT,
  ip_address VARCHAR(50)
);
```

### Admin Dashboard UI

**Page: /admin/routing-control**

```
┌─────────────────────────────────────────┐
│  AI RECEPTIONIST ROUTING CONTROL        │
├─────────────────────────────────────────┤
│                                         │
│  STATUS: [ON]  [OFF]  (toggle button)  │
│                                         │
│  Last changed: 2026-04-30 17:30        │
│  Changed by: Chris LaVerdiere          │
│                                         │
├─────────────────────────────────────────┤
│  SCHEDULE (Auto-switches daily)         │
├─────────────────────────────────────────┤
│                                         │
│  Mon-Fri:  6:00 PM - 8:00 AM  [edit]  │
│  Saturday: 12:00 AM - 11:59 PM [edit] │
│  Sunday:   12:00 AM - 11:59 PM [edit] │
│                                         │
│  Time Zone: America/Los_Angeles         │
│  Daylight Saving: Auto (next change...) │
│                                         │
├─────────────────────────────────────────┤
│  HOLIDAYS & EXCEPTIONS                  │
├─────────────────────────────────────────┤
│                                         │
│  2026-05-26 (Memorial Day): AI OFF     │
│  2026-07-04 (July 4th): AI OFF        │
│  2026-09-07 (Labor Day): AI OFF        │
│                                         │
│  [+ Add Holiday]                       │
│                                         │
├─────────────────────────────────────────┤
│  TRANSFER LINE OVERRIDE                 │
├─────────────────────────────────────────┤
│                                         │
│  Activate: (253) 284-6601 or dial *99 │
│  Auth: PIN required (set in settings)   │
│  Status: Enabled                        │
│                                         │
│  [View recent override activity]        │
│                                         │
├─────────────────────────────────────────┤
│  CHANGE LOG (Recent)                    │
├─────────────────────────────────────────┤
│                                         │
│  2026-04-30 17:30 | ON  | manual_toggle│
│  2026-04-30 06:00 | OFF | time_based   │
│  2026-04-29 18:15 | ON  | time_based   │
│  2026-04-29 18:00 | OFF | time_based   │
│                                         │
│  [View full audit log]                 │
│                                         │
└─────────────────────────────────────────┘
```

### Webhook Logic

**Every call includes routing check:**

```javascript
// When call arrives at (253) 284-6600

async function shouldRouteToAI(callData) {
  // 1. Check manual override
  const override = await getManualOverride();
  if (override.active) {
    return override.ai_active;  // Use override status
  }
  
  // 2. Check time-based schedule
  const currentTime = new Date();
  const dayOfWeek = currentTime.getDay();
  const time = currentTime.getHours() * 60 + currentTime.getMinutes();
  
  const schedule = await getScheduleForDay(dayOfWeek);
  const startMinutes = schedule.start_time;
  const endMinutes = schedule.end_time;
  
  // Handle schedule that crosses midnight
  if (startMinutes > endMinutes) {
    // e.g., 6 PM (1080) to 8 AM (480) crosses midnight
    return time >= startMinutes || time <= endMinutes;
  }
  
  return time >= startMinutes && time <= endMinutes;
}

// Call routing decision
const routeToAI = await shouldRouteToAI(callData);

if (routeToAI) {
  // Send to Retell AI
  forwardToRetell(callData);
} else {
  // Send to voicemail or direct line
  forwardToVoicemail(callData);
}
```

---

## PHONE LINE SETUP (RETELL / CARRIER)

### Option 1: Retell's Built-In Routing
Retell supports time-based and condition-based routing natively:
- Create "routing group"
- Set conditions (time of day, day of week)
- Route to AI vs. fallback number

**Setup in Retell:**
1. Go to Phone Numbers
2. Select (253) 284-6600
3. Set up routing rule:
   - Condition: Time between 6 PM - 8 AM (Pacific)
   - Route to: AI Agent
   - Fallback: Voicemail / Direct number

**Pros:** Simple, all in Retell UI  
**Cons:** Limited control, no custom logic

---

### Option 2: Custom Routing via Webhook
Use Retell's webhook to check our Supabase before routing:
1. Retell receives call
2. Calls our webhook: `/routing/check-status`
3. We return: `{ route_to_ai: true/false }`
4. Retell routes accordingly

**Setup:**
```
Retell API → Our webhook → Supabase check → Return decision → Retell routes
```

**Pros:** Complete control, dynamic, can implement complex logic  
**Cons:** Adds 100-200ms latency

---

### Option 3: Phone Provider IVR
Some phone carriers (Twilio, Vonage) support IVR:
```
Call (253) 284-6600
    ↓
IVR: "Press 1 for after-hours AI, Press 2 for callback"
    ↓
User presses 1 → Routes to Retell AI
```

**Pros:** Full caller control  
**Cons:** Extra step, annoying for users

---

## RECOMMENDED PHONE SETUP

**Use Option 2 (Custom Webhook):**
1. Retell receives call to (253) 284-6600
2. Calls our webhook to check routing status
3. Supabase returns current status (time-based + overrides)
4. Retell routes based on response
5. Fallback if webhook fails: route to voicemail

---

## TRANSFER LINE SETUP (OPTIONAL)

**Create secondary number for staff override:**

```
Option A: Dedicated line
  - Request second phone line from provider
  - Line: (253) 284-6601
  - Staff calls this number with PIN to toggle AI routing

Option B: Dial code
  - Main line accepts special codes (e.g., *99)
  - Caller enters PIN
  - AI routing toggled

Option C: SMS-based
  - Staff texts "ENABLE_AI" to designated number
  - System toggles routing
  - SMS confirmation sent back
```

**Recommended: Option A + Option B**
- Primary: Dedicated line (253) 284-6601 for staff
- Backup: Dial code *99 if on main line

---

## IMPLEMENTATION TIMELINE

**Week 1:** Time-based scheduling (automated, default)
**Week 2:** Manual toggle (emergency override)
**Week 3:** Direct transfer line (optional, nice-to-have)

---

## SUCCESS METRICS

- AI active at correct times (100% of day)
- Manual overrides work within 15 seconds
- No missed calls due to routing errors
- Clear audit trail of all changes
- Team reports satisfaction with system

---

**Status:** Ready for Phase 1 implementation  
**Prepared by:** Crawford  
**For:** Fife RV Center AI Receptionist Project
