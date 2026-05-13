# Fife RV After-Hours Schedule — LOCKED

**Status:** Schedule confirmed  
**Date:** 2026-04-30

---

## ✅ AFTER-HOURS SCHEDULE (CONFIRMED)

### Default Schedule
- **Monday-Friday:** After business hours (evenings) + nights
- **Saturday:** Business hours (open)
- **Sunday:** Business hours (open)
- **Holidays & Disasters:** AI OFF (closed entirely)

### AI Receptionist Active Times
```
Monday:    After hours (evenings + night)
Tuesday:   After hours (evenings + night)
Wednesday: After hours (evenings + night)
Thursday:  After hours (evenings + night)
Friday:    After hours (evenings + night)
Saturday:  NOT active (store open, humans answer)
Sunday:    NOT active (store open, humans answer)
```

### What This Means
- **Weekdays:** AI answers calls when store is closed (evenings/nights)
- **Weekends:** Humans answer calls (store is open all day)
- **Flexibility:** Can toggle on/off anytime via dashboard or *99 code

---

## 🎯 IMPLEMENTATION

### Time-Based Routing Logic
```
Current time check:
├─ Is it Monday-Friday, after business hours?
│  ├─ YES → Route to Retell AI
│  └─ NO → Route to voicemail/human
└─ Is it Saturday or Sunday?
   ├─ YES → Route to voicemail/human (store open)
   └─ NO → (handled above)
```

### Admin Dashboard Schedule
```
Days Active for AI Receptionist:
☑ Monday
☑ Tuesday
☑ Wednesday
☑ Thursday
☑ Friday
☐ Saturday (unchecked - store open)
☐ Sunday (unchecked - store open)

After Hours Start Time: [TBD by Fife RV - e.g., 6 PM]
After Hours End Time: [TBD by Fife RV - e.g., 8 AM]
```

---

## ⚠️ STILL NEEDED

**Exact times for after-hours on weekdays:**

What time does the store close on weekdays?  
_______________ (e.g., 6 PM, 5:30 PM, etc.)

What time does the store open on weekdays?  
_______________ (e.g., 8 AM, 9 AM, etc.)

---

## ✅ TOGGLE CONTROL (CONFIRMED)

**Routing Control: Option 3 (Full Hybrid)**

1. **Auto-Schedule** (default)
   - Monday-Friday after hours: AI ON
   - Saturday-Sunday: AI OFF (store open)
   - Automatically switches

2. **Manual Toggle** (override)
   - Dashboard button: "AI ON / OFF"
   - Use anytime to override schedule
   - Resets to auto-schedule at next scheduled window

3. **Transfer Line** (*99 code)
   - Staff calls *99 from any phone
   - Toggle AI with PIN
   - SMS confirmation

---

**Status:** Schedule framework locked  
**Pending:** Exact weekday after-hours times from Fife RV
