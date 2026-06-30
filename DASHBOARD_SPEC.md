# LaVerdi Portal — Dashboard Specification

> **Version:** 1.0  
> **Date:** 2026-06-18  
> **Status:** Planning → Ready for Implementation  
> **Author:** Crawford + Chris LaVerdiere

---

## Overview

The dashboard is the post-authentication home for LaVerdi users. It surfaces their subscription status, agent fleet, connected channels, active tasks, and companion tools — all in one place.

**Design philosophy:** Simple, intuitive, dark theme (consistent with landing + pricing). Show what's real, stub what's coming. No fake data — use clear "coming soon" states that feel intentional, not broken.

**Post-checkout flow:**  
`Pricing → Stripe Checkout → Webhook writes subscription to DB → Redirect to /dashboard → User sees active plan`

---

## Route Structure

```
/dashboard              → Main dashboard (all sections)
/dashboard/agents       → Agent management (Phase 2)
/dashboard/channels     → Channel connections (Phase 3)
/dashboard/tasks        → Kanban task board (Phase 2+)
/dashboard/settings     → Account + billing settings (Phase 4)
```

Phase 1 ships `/dashboard` as a single page with all sections visible. Sub-routes are stubbed in the sidebar nav but link to anchors or show "coming soon" interstitials until their phase lands.

---

## Layout

### Sidebar Navigation (persistent)

```
┌──────────────────┐
│  ◆ LaVerdi       │
│                  │
│  📊 Dashboard    │  ← active
│  🤖 Agents       │  ← Phase 2
│  🔗 Channels     │  ← Phase 3
│  📋 Tasks        │  ← Phase 2+
│  ⚙️  Settings     │  ← Phase 4
│                  │
│  ─────────────── │
│  📖 Docs         │  → docs.laverdi.tech (external)
│  💬 Support      │  → mailto:support@laverdi.tech
│                  │
│  ─────────────── │
│  👤 user@email   │
│  Sign Out        │
└──────────────────┘
```

- Dark zinc/black theme matching existing pages
- Collapsible on mobile (hamburger menu)
- Active item highlighted with white text + left border accent
- Stubbed items show subtle "soon" badge

### Main Content Area

Scrollable single-page layout with 5 distinct sections separated by spacing. Each section is a self-contained card.

---

## Section 1: Your Plan

**Status:** 🟢 Functional (Phase 1)  
**Data source:** Stripe subscription via webhook → DB

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  YOUR PLAN                                              │
│                                                         │
│  ┌─────────────┐  Plan: Pro                            │
│  │             │  Status: ● Active                     │
│  │   ⚡ Pro    │  Billing: $49/mo — renews Jul 18      │
│  │             │                                        │
│  └─────────────┘  Agents: ██████░░░░ 3/5 used          │
│                   Platforms: ██░░░░░░░░ 1/3 connected   │
│                                                         │
│  [ Manage Subscription ]  [ Upgrade ]                   │
└─────────────────────────────────────────────────────────┘
```

### States

| State | Display |
|-------|---------|
| **Active subscription** | Plan name, status dot (green), renewal date, usage bars |
| **No subscription** | "You're on the free tier" + prominent "Choose a Plan" CTA |
| **Past due** | Yellow warning banner, "Update payment method" link |
| **Cancelled** | "Your plan expires on [date]" + "Resubscribe" CTA |

### Implementation Notes

- "Manage Subscription" → Stripe Customer Portal (create portal session server-side)
- "Upgrade" → `/pricing` (pre-select next tier up)
- Usage bars are visual only in Phase 1 (hardcoded to 0/limit based on tier)
- Requires: `Subscription` model in Prisma schema (new migration)

### Tier Limits (for usage display)

| Tier | Agents | Platforms |
|------|--------|-----------|
| Starter ($19) | 1 | 1 |
| Pro ($49) | 5 | 3 |
| Enterprise ($199) | 20 | Unlimited |

---

## Section 2: Your Agents

**Status:** 🟡 Stubbed (Phase 2)  
**Unlocked by:** Agent provisioning infrastructure (Docker containers)

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  YOUR AGENTS                                            │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  🤖                                              │   │
│  │  No agents deployed yet                          │   │
│  │                                                  │   │
│  │  Your AI agent runs 24/7, learns your            │   │
│  │  preferences, and connects to your favorite      │   │
│  │  platforms.                                      │   │
│  │                                                  │   │
│  │  [ Deploy Your First Agent ]  ← coming soon      │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Future State (when agents exist)

```
┌─────────────────────────────────────────────────────────┐
│  YOUR AGENTS                                     [+ New]│
│                                                         │
│  ┌────────────────────────────┐ ┌──────────────────────┐│
│  │ ● My Assistant             │ │ ● Work Bot           ││
│  │ Status: Running            │ │ Status: Running      ││
│  │ Uptime: 14d 6h             │ │ Uptime: 3d 12h      ││
│  │ Last active: 2 min ago     │ │ Last active: 1h ago  ││
│  │ Channels: Telegram, Slack  │ │ Channels: Discord    ││
│  │ [ Manage ] [ Stop ]        │ │ [ Manage ] [ Stop ]  ││
│  └────────────────────────────┘ └──────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Implementation Notes (Phase 2)

- Agent cards show: name, status (running/stopped/error), uptime, last activity, connected channels
- "Deploy" triggers Docker container provisioning via API
- "Manage" → agent config page (model selection, personality, memory)
- "Stop" → pause container (with confirmation)
- Agent count enforced by subscription tier

---

## Section 3: Connected Channels

**Status:** 🟡 Stubbed (Phase 3)  
**Unlocked by:** Channel integration infrastructure

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  CONNECTED CHANNELS                                     │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │    💬    │ │    🎮    │ │    📱    │ │    💼    │   │
│  │ Telegram │ │ Discord  │ │ WhatsApp │ │  Slack   │   │
│  │          │ │          │ │          │ │          │   │
│  │ [Connect]│ │ [Connect]│ │ [Connect]│ │ [Connect]│   │
│  │  Soon    │ │  Soon    │ │  Soon    │ │  Soon    │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                         │
│  Connect your favorite platforms to chat with your      │
│  agent anywhere. Each connection is end-to-end secure.  │
└─────────────────────────────────────────────────────────┘
```

### Future State (when connected)

- Connected channels show green checkmark + "Connected" label
- Click connected → shows channel details (bot username, linked agent, message count)
- Click unconnected → connection wizard (bot token for Telegram, OAuth for Discord/Slack, QR for WhatsApp)
- Platform count enforced by subscription tier

### Implementation Notes (Phase 3)

- Each channel type has its own connection flow
- Telegram: BotFather token input → verify → link to agent
- Discord: OAuth2 bot authorization flow
- Slack: OAuth2 workspace installation
- WhatsApp: QR code pairing (like WhatsApp Web)

---

## Section 4: Task Board (Kanban)

**Status:** 🟡 Stubbed (Phase 2+)  
**Unlocked by:** Agent task system

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  TASK BOARD                                      [+ New]│
│                                                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │   TO DO     │ │ IN PROGRESS │ │    DONE     │       │
│  │             │ │             │ │             │       │
│  │  No tasks   │ │  No tasks   │ │  No tasks   │       │
│  │  yet        │ │  yet        │ │  yet        │       │
│  │             │ │             │ │             │       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
│                                                         │
│  Assign tasks to your agent and track progress.         │
│  Drag cards between columns as work progresses.         │
│                                                         │
│  [ Coming Soon — Get Notified ]                         │
└─────────────────────────────────────────────────────────┘
```

### Future State

- Task cards: title, description, assigned agent, priority, due date
- Drag-and-drop between columns
- Agent can create/move tasks autonomously (e.g., "Research completed" → Done)
- User can assign tasks via dashboard or chat ("Hey agent, look into X")
- Filter by agent, priority, date
- Optional: recurring tasks, templates

### Implementation Notes (Phase 2+)

- Will need `Task` model in Prisma (title, description, status, agentId, priority, dueDate)
- Real-time updates via SSE or polling when agent moves tasks
- Consider: should this be per-agent or per-workspace?

---

## Section 5: Companion Tools

**Status:** 🟡 Stubbed (all phases)  
**Unlocked by:** Desktop app + browser extension development

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  COMPANION TOOLS                                        │
│                                                         │
│  ┌──────────────────────────┐ ┌────────────────────────┐│
│  │  🖥️  Desktop Companion    │ │  🌐 Browser Extension  ││
│  │                          │ │                        ││
│  │  Let your agent act on   │ │  Give your agent eyes  ││
│  │  your computer. File     │ │  on the web. Research, ││
│  │  access, automation,     │ │  form filling, page    ││
│  │  local tools, and more.  │ │  monitoring, and data  ││
│  │                          │ │  extraction.           ││
│  │  Runs locally. Your data │ │                        ││
│  │  never leaves your       │ │  Works with Chrome,    ││
│  │  machine.                │ │  Firefox, and Edge.    ││
│  │                          │ │                        ││
│  │  ┌────────┐ ┌────────┐  │ │  ┌────────┐ ┌────────┐││
│  │  │Windows │ │ macOS  │  │ │  │Chrome  │ │Firefox │││
│  │  │  Soon  │ │  Soon  │  │ │  │  Soon  │ │  Soon  │││
│  │  └────────┘ └────────┘  │ │  └────────┘ └────────┘││
│  │  ┌────────┐             │ │  ┌────────┐           ││
│  │  │ Linux  │             │ │  │  Edge  │           ││
│  │  │  Soon  │             │ │  │  Soon  │           ││
│  │  └────────┘             │ │  └────────┘           ││
│  └──────────────────────────┘ └────────────────────────┘│
│                                                         │
│  🔒 Privacy first: Companion tools connect directly to  │
│  your agent. No data is routed through our servers.     │
└─────────────────────────────────────────────────────────┘
```

### Desktop Companion — Vision

The companion app is a lightweight bridge between the user's local machine and their cloud-hosted LaVerdi agent.

**Capabilities (planned):**
- File system access (read/write with user permission)
- Run local commands and scripts
- Screenshot / screen context for the agent
- System monitoring (CPU, memory, disk)
- Local app integration (open URLs, manage files)
- Clipboard access (with permission)
- Notification relay (OS notifications from agent)

**Architecture:**
- Electron or Tauri app (Tauri preferred — lighter, Rust-based)
- Connects to agent via secure WebSocket (authenticated with user token)
- Runs as system tray app (persistent, minimal footprint)
- All actions require explicit user permission grants
- No data stored on LaVerdi servers — direct agent ↔ companion

**Security model:**
- Permission-based: user approves capability categories on install
- Actions logged locally for audit
- Kill switch: user can revoke all access instantly
- Open source companion for transparency

### Browser Extension — Vision

Gives the agent awareness of the user's web browsing context when requested.

**Capabilities (planned):**
- Read current page content (when asked)
- Fill forms on behalf of user
- Monitor pages for changes (price tracking, availability)
- Research assistance (summarize, extract, compare)
- Bookmark and organize web content

**Architecture:**
- Manifest V3 extension (Chrome/Firefox/Edge compatible)
- Communicates with agent via LaVerdi API (authenticated)
- Popup UI for quick commands ("Summarize this page", "Save for later")
- Side panel for ongoing research tasks
- Content script for page interaction (form fill, extraction)

**Security model:**
- Minimal permissions by default (activeTab only)
- Optional broad permissions for monitoring features
- No browsing history sent unless explicitly requested
- Page content processed in-extension, only summaries sent to agent

---

## Database Changes Required

### New: Subscription Model

```prisma
model Subscription {
  id                 String   @id @default(cuid())
  userId             String
  stripeCustomerId   String   @unique
  stripeSubId        String   @unique
  stripePriceId      String
  status             String   @default("active") // active, past_due, cancelled, incomplete
  tier               String   // starter, pro, enterprise
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  cancelAtPeriodEnd  Boolean  @default(false)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([stripeCustomerId])
  @@map("subscription")
}
```

### Future: Task Model (Phase 2+)

```prisma
model Task {
  id          String    @id @default(cuid())
  title       String
  description String?   @db.Text
  status      String    @default("todo") // todo, in_progress, done
  priority    String    @default("medium") // low, medium, high, urgent
  dueDate     DateTime?
  instanceId  String?   // assigned agent
  workspaceId String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  instance  Instance?  @relation(fields: [instanceId], references: [id])
  workspace Workspace  @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId])
  @@index([instanceId])
  @@index([status])
  @@map("task")
}
```

---

## API Routes Required

### Phase 1 (Dashboard MVP)

```
GET  /api/subscription          → Get current user's subscription
POST /api/billing/portal        → Create Stripe Customer Portal session
```

### Phase 2+

```
GET    /api/tasks               → List tasks (filter by status, agent)
POST   /api/tasks               → Create task
PATCH  /api/tasks/[id]          → Update task (status, assignment)
DELETE /api/tasks/[id]          → Delete task
```

---

## Authentication Guard

All `/dashboard/*` routes require authentication. Unauthenticated users redirect to `/login`.

```typescript
// middleware.ts or layout.tsx
// Check NextAuth session → redirect to /login if missing
// After login → redirect to /dashboard (not /)
```

Post-login redirect should go to `/dashboard`, not `/`.  
Post-checkout redirect should go to `/dashboard`, not `/pricing`.

---

## Implementation Order

### Step 1: Foundation (build now)
- [ ] Add `Subscription` model to Prisma schema + migrate
- [ ] Update webhook to write subscription data to DB
- [ ] Create `/dashboard` page with sidebar layout
- [ ] Build Section 1 (Your Plan) with real Stripe data
- [ ] Update checkout success_url to `/dashboard`
- [ ] Auth guard on `/dashboard`

### Step 2: Stubbed Sections (build now)
- [ ] Build Section 2 (Agents) — empty state UI only
- [ ] Build Section 3 (Channels) — platform cards, all "coming soon"
- [ ] Build Section 4 (Kanban) — 3 empty columns UI
- [ ] Build Section 5 (Companion Tools) — download cards, all "coming soon"

### Step 3: Polish (build now)
- [ ] Sidebar navigation with active states
- [ ] Mobile responsive layout
- [ ] Update login page to dark theme
- [ ] Post-login redirect → /dashboard
- [ ] Loading states and error handling

### Step 4+: Future phases (not now)
- [ ] Agent provisioning (Phase 2)
- [ ] Channel connection wizards (Phase 3)
- [ ] Kanban drag-and-drop + task API (Phase 2+)
- [ ] Desktop companion app (separate repo)
- [ ] Browser extension (separate repo)
- [ ] Settings page with account management (Phase 4)

---

## Design Tokens

Consistent with existing pages:

| Element | Value |
|---------|-------|
| Background | `bg-black` / `bg-zinc-900` gradient |
| Cards | `bg-zinc-800 border border-zinc-700` |
| Text primary | `text-white` |
| Text secondary | `text-zinc-400` |
| Accent | `text-green-400` (success), `text-yellow-400` (warning) |
| Buttons primary | `bg-white text-black` |
| Buttons secondary | `bg-zinc-800 border border-zinc-700 text-white` |
| "Coming soon" badge | `bg-zinc-700 text-zinc-400 text-xs px-2 py-0.5 rounded-full` |
| Font | Geist Sans (already loaded) |

---

## Open Questions

1. **Companion app tech:** Tauri vs Electron? (Tauri = lighter + Rust, Electron = faster to prototype)
2. **Task board scope:** Per-workspace or per-user? Can multiple agents share a board?
3. **Channel priority:** Which platform gets built first? (Telegram likely easiest)
4. **Waitlist:** Should "coming soon" buttons collect email for notifications?
5. **Admin dashboard:** Separate `/admin` route for Chris to see all users/subscriptions?

---

*This spec is the source of truth for dashboard development. Update it as decisions are made.*
