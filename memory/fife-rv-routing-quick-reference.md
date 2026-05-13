# Fife RV Routing Control — Quick Reference

**Problem:** After-hours schedule varies (employees, seasons, events). Need flexible on/off control.

---

## 🎯 THREE ROUTING OPTIONS

### **Option A: Manual Toggle (Simple, Recommended for Phase 1)**

```
Dashboard: One big ON/OFF button
├─ ON: Calls route to AI receptionist
└─ OFF: Calls route to voicemail/direct number

When to use:
✅ Unexpected staff in office → toggle OFF
✅ Building closed early → toggle OFF
✅ Holiday closure → toggle OFF
✅ Normal after-hours → toggle ON

Speed: Instant (15 seconds)
Complexity: Low (just a boolean flag)
Training: None needed
Cost: $0 (simple database field)
```

**Pros:**
- Dead simple
- Instant changes
- No scheduling setup

**Cons:**
- Requires manual action daily
- Could forget to toggle

---

### **Option B: Direct Transfer Line (Field Control)**

```
Staff calls special number: (253) 284-6601 or dials *99
├─ Enters PIN code
├─ System enables/disables AI routing
└─ SMS confirmation sent

When to use:
✅ Manager away from computer
✅ Unexpected situation (no time for dashboard)
✅ Emergency on-the-go activation

Speed: Immediate (30 seconds)
Complexity: Medium (phone IVR + webhook)
Training: Teach staff one code
Cost: ~$100-500 (phone IVR setup)
```

**Pros:**
- Works without computer/dashboard access
- Fast for emergencies
- Staff can control it

**Cons:**
- Requires training
- Risk of accidental activation
- Less useful for recurring patterns

---

### **Option C: Time-Based Scheduling (Fully Automated)**

```
Admin sets schedule once:
├─ Monday-Friday: 6 PM - 8 AM (AI on)
├─ Saturday: All day (AI on)
├─ Sunday: All day (AI on)
├─ Holidays: Off (AI off)
└─ System auto-switches every day

When to use:
✅ Summer hours (set in March)
✅ Winter hours (set in September)
✅ Holiday closures
✅ Recurring patterns

Speed: Automatic
Complexity: Medium (scheduling engine)
Training: Setup once, then hands-off
Cost: $200-500 (dashboard UI)
```

**Pros:**
- Fully automated (no daily action)
- Perfect for seasonal variations
- Holiday management built-in
- Clear audit trail

**Cons:**
- Requires setup time initially
- Less flexible for unexpected changes
- Needs override for emergencies

---

## ✅ **RECOMMENDED: HYBRID APPROACH**

**Combine all three:**

```
Layer 1: Time-Based Schedule (Default)
├─ Mon-Fri: 6 PM - 8 AM AI ON
├─ Sat-Sun: All day AI ON
├─ Holidays: AI OFF
└─ Runs automatically, no action needed

Layer 2: Manual Toggle (Emergency Override)
├─ Dashboard button: "AI is ON / OFF"
├─ Use when unexpected happens
├─ Overrides time-based schedule
└─ Resets to time-based at next scheduled window

Layer 3: Transfer Line (Field Control)
├─ Phone code: *99 to enable/disable
├─ For when manager is away from computer
├─ Optional, nice-to-have feature
└─ Requires simple PIN auth
```

**Real-world example:**
```
Morning: AI off (automatic, not after-hours)
5:30 PM: Manager realizes office staff left early
Manager toggles AI ON via dashboard
10:00 PM: AI still on (within scheduled window)
8:30 AM next day: AI automatically off (end of after-hours)
```

---

## 🚀 **IMPLEMENTATION PHASES**

| Phase | Feature | Timeline | Complexity |
|-------|---------|----------|------------|
| 1 | Manual toggle | Week 1 | Low |
| 2 | Time-based scheduling | Week 2 | Medium |
| 3 | Transfer line (*99 code) | Week 3+ | Medium |

---

## 💡 **WHAT THIS MEANS FOR FIFE RV**

**You get:**
1. **Flexibility** — Change schedule anytime without IT
2. **Automation** — System handles itself most days
3. **Control** — Can toggle on/off with one click
4. **Backup** — Multiple ways to control routing
5. **Safety** — Time-based default prevents accidents

**No more:**
- Manual calls to IT to change routing
- Forgotten toggles that break calls
- Inflexible schedules that don't adapt

---

## 📋 **DECISION NEEDED**

**For Phase 1 implementation, pick:**

- [ ] **Just Option A (Manual Toggle)** — Simple, start here
- [ ] **Option A + B (Toggle + Transfer Line)** — More flexible
- [ ] **All Three (Full Hybrid)** — Complete control

**My recommendation:** Start with **Option A + B**, add time-based scheduling in Phase 2.

---

**Details:** See memory/fife-rv-routing-control.md  
**Next:** Let me know which option you prefer, and I'll build it.
