# LaVerdi Social — Handoff to Hermes
**Date:** 2026-05-20  
**Owner:** Chris LaVerdiere  
**Builder:** Hermes  
**Status:** Ready for Development

---

## Project Overview

**What:** LaVerdi Social — Multi-platform content distributor  
**Why:** Fill market gap (YouTube + TikTok + Instagram + X + Facebook in one tool)  
**Where:** Deploy to RVConnector first, then standalone SaaS  
**When:** 8-10 week sprint starting immediately

---

## Quick Wins (Start Here)

1. **Market validation is DONE** ✅
   - Analysis shows strong demand from creators/agencies
   - No competitor supports all 5 platforms well
   - YouTube + TikTok support = key differentiator

2. **Tech stack is ready** ✅
   - Use existing LaVerdi portal codebase (Next.js + Supabase)
   - APIs tested and accessible (YouTube, TikTok, Instagram, X, Facebook)
   - Command center pattern already proven

3. **Pricing is clear** ✅
   - Starter: $29/mo (creators)
   - Professional: $49/mo (e-commerce)
   - Agency: $299/mo (social agencies)

---

## MVP Scope (What to Build)

### Frontend (Next.js, 30 hours)
```
/social-media
  ├─ /upload        — Upload video/image + caption
  ├─ /dashboard     — View posted content, history
  ├─ /settings      — Connect platform accounts
  ├─ /billing       — Manage subscription
  └─ /analytics     — Basic metrics (optional MVP)
```

**Key Features:**
1. **Upload interface**
   - Video/image file picker
   - Caption input
   - Hashtag input
   - Platform selector (which platforms to post)
   - Schedule option (publish now or later)

2. **Dashboard**
   - List of posted content (with platform status)
   - Video thumbnail + caption preview
   - Post date, engagement (if available)
   - Delete/edit options

3. **Settings**
   - Connected accounts (YouTube, TikTok, Instagram, X, Facebook)
   - OAuth login flow for each platform
   - Account info display (handle, followers)
   - Disconnect option

### Backend (Python/Node, 40 hours)
```
/api/social
  ├─ /upload        — Accept video, validate, store
  ├─ /distribute    — Post to all selected platforms
  ├─ /accounts      — Manage connected accounts
  ├─ /status        — Check post status per platform
  └─ /history       — Retrieve user's post history
```

**Core Logic:**
1. **Video processing**
   - Accept video (MP4, MOV, WebM)
   - Auto-resize for each platform (FFmpeg)
     - YouTube: 1920x1080 or 1280x720
     - TikTok: 1080x1920 (9:16)
     - Instagram Reels: 1080x1920 (9:16)
     - X: Keep original
     - Facebook: Keep original

2. **Platform integrations**
   - YouTube: Upload → set title, description, tags → schedule publish
   - TikTok: Upload → publish immediately (or queue for manual publish)
   - Instagram: Upload → set caption → schedule/publish
   - X: Tweet with media attachment
   - Facebook: Post to page with media

3. **Error handling**
   - Retry failed uploads (exponential backoff)
   - Log all failures for debugging
   - Notify user of failures
   - Graceful degradation (if one platform fails, others still succeed)

4. **Job queue**
   - Queue scheduled posts (Temporal, Bull, or simple cron)
   - Publish at exact time
   - Handle timezone conversions

### Database Schema (Supabase)

```sql
-- Multitenancy: user_id = tenant key

CREATE TABLE social_accounts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL (FK users),
  platform VARCHAR(50), -- youtube, tiktok, instagram, twitter, facebook
  account_handle VARCHAR(200),
  account_id VARCHAR(200),
  access_token TEXT ENCRYPTED,
  refresh_token TEXT ENCRYPTED,
  expires_at TIMESTAMP,
  created_at TIMESTAMP,
  UNIQUE(user_id, platform)
);

CREATE TABLE social_posts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL (FK users),
  title VARCHAR(200),
  caption TEXT,
  hashtags TEXT,
  
  -- Storage
  video_path VARCHAR(500), -- s3://bucket/videos/user_id/...
  thumbnail_path VARCHAR(500),
  video_duration_seconds INT,
  video_size_bytes INT,
  
  -- Scheduling
  scheduled_publish_at TIMESTAMP,
  actual_publish_at TIMESTAMP,
  
  -- Per-platform tracking
  youtube_id VARCHAR(100),
  youtube_status VARCHAR(50), -- uploading, published, failed, scheduled
  youtube_url VARCHAR(500),
  
  tiktok_id VARCHAR(100),
  tiktok_status VARCHAR(50),
  tiktok_url VARCHAR(500),
  
  instagram_id VARCHAR(100),
  instagram_status VARCHAR(50),
  instagram_url VARCHAR(500),
  
  twitter_id VARCHAR(100),
  twitter_status VARCHAR(50),
  twitter_url VARCHAR(500),
  
  facebook_id VARCHAR(100),
  facebook_status VARCHAR(50),
  facebook_url VARCHAR(500),
  
  -- Metadata
  platforms_selected VARCHAR(500), -- comma-separated: youtube,tiktok,instagram,twitter,facebook
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE social_credentials (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL (FK users),
  platform VARCHAR(50),
  credentials JSONB ENCRYPTED, -- stores all tokens/secrets
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Enable RLS
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_credentials ENABLE ROW LEVEL SECURITY;

-- Policies: users can only see their own
CREATE POLICY "Users see own posts"
  ON social_posts FOR SELECT
  USING (auth.uid() = user_id);
```

---

## Tech Stack Details

### Frontend
```
- Framework: Next.js (existing LaVerdi tech)
- Styling: Tailwind CSS
- State: React hooks + Supabase client library
- Video preview: react-player
- File upload: react-dropzone
- Forms: React Hook Form
- UI Components: Reuse from LaVerdi portal
```

### Backend
```
Option A: Python (FastAPI)
- Pros: Easy, good for video processing, existing command-center pattern
- Cons: Extra language to manage

Option B: Node.js (Express)
- Pros: Same language as frontend, faster deployment
- Cons: Less ideal for video processing

Recommendation: **Python FastAPI** (consistent with command-center)
```

### Services
```
- Video Storage: Vultr Object Storage (S3-compatible) or AWS S3
- Video Processing: FFmpeg (Docker container or system binary)
- Job Queue: Temporal or Bull (Redis-backed)
- API Keys: Vault (or encrypted .env)
- Monitoring: Sentry, DataDog
- Secrets: Supabase vault or HashiCorp Vault
```

---

## Development Timeline (8-10 weeks)

### Week 1-2: Setup & Database
- [ ] Design final database schema
- [ ] Create Supabase tables + RLS policies
- [ ] Set up Python FastAPI project structure
- [ ] Set up video processing pipeline (FFmpeg)

### Week 3-4: Platform APIs
- [ ] YouTube authentication + upload
- [ ] TikTok authentication + upload
- [ ] Instagram authentication + upload
- [ ] X authentication + tweet posting
- [ ] Facebook authentication + page posting

### Week 5-6: Frontend Core
- [ ] Build upload interface
- [ ] Build dashboard (post history)
- [ ] Build settings (connect accounts)
- [ ] Platform OAuth flows

### Week 7: Integration
- [ ] Connect frontend ↔ backend
- [ ] Test end-to-end workflows
- [ ] Error handling & logging
- [ ] Scheduling system (if time)

### Week 8: Polish & Testing
- [ ] UI polish
- [ ] Performance optimization
- [ ] Security audit
- [ ] Comprehensive testing

### Week 9-10: Launch
- [ ] Deploy to RVConnector (as feature)
- [ ] Beta user testing
- [ ] Bug fixes
- [ ] Documentation

---

## Key Implementation Notes

### YouTube Integration
```python
# 1. OAuth2 flow (user clicks "Connect YouTube")
# 2. Get access token
# 3. Upload video via:
from googleapiclient.discovery import build

youtube = build('youtube', 'v3', credentials=credentials)
request = youtube.videos().insert(
    part="snippet,status",
    body={
        "snippet": {
            "title": title,
            "description": caption,
            "tags": hashtags.split(),
            "categoryId": "28"  # Science & Technology
        },
        "status": {
            "privacyStatus": "unlisted",  # or "public"
            "publishAt": "2026-05-21T10:00:00Z"  # if scheduling
        }
    },
    media_body=MediaFileUpload(video_path)
)
```

### TikTok Integration (Hard!)
```
Option A: Official TikTok Business API
- Limited, requires approval
- Can upload to creator accounts
- Schedule support is minimal

Option B: Browser Automation (Selenium)
- Log into TikTok
- Upload video via web UI
- Less reliable but works

Recommendation: Start with official API, fallback to Selenium if needed
```

### Instagram Integration
```python
# 1. Get page access token (from Facebook)
# 2. Create media container
# 3. Publish

import requests

# Create media container
response = requests.post(
    f"https://graph.instagram.com/{page_id}/media",
    params={
        "media_type": "VIDEO",
        "video_url": video_url,
        "caption": caption,
        "access_token": access_token
    }
)
media_id = response.json()['id']

# Publish
requests.post(
    f"https://graph.instagram.com/{page_id}/media_publish",
    params={
        "creation_id": media_id,
        "access_token": access_token
    }
)
```

### X/Twitter Integration
```python
import tweepy

client = tweepy.Client(
    bearer_token=bearer_token,
    consumer_key=consumer_key,
    consumer_secret=consumer_secret,
    access_token=access_token,
    access_token_secret=access_token_secret
)

# Upload media
media = client.upload_media(media=video_path)

# Tweet with media
client.create_tweet(
    text=caption,
    media_ids=[media['media_id']]
)
```

---

## Priority Features

### MVP (Must Have)
- [ ] Upload video + caption
- [ ] Post to all 5 platforms
- [ ] Connect platform accounts (OAuth)
- [ ] View post history
- [ ] Error notifications

### Nice-to-Have (Post-MVP)
- [ ] Video auto-resizing
- [ ] Schedule posts for later
- [ ] Analytics (views, engagement)
- [ ] Caption writing (AI, via OpenClaw?)
- [ ] Hashtag suggestions
- [ ] Team collaboration
- [ ] API access for developers

### Future (Phase 2)
- [ ] Standalone SaaS (laverdi-social.com)
- [ ] Stripe billing integration
- [ ] White-label options
- [ ] Advanced analytics
- [ ] Influencer marketplace integration

---

## Deployment Target

### Phase 1: RVConnector Integration
**Deploy to:** RVConnector site as premium feature  
**URL:** https://rvconnector.com/social-media (or /features/social)  
**Auth:** Use existing RVConnector auth  
**Database:** Supabase (shared with RVConnector)

**How to offer:**
- Free for first 3 posts
- Then $29/mo subscription
- Stripe billing (integrated with RVConnector)

### Phase 2: Standalone SaaS
**Deploy to:** laverdi-social.com  
**Auth:** Independent (sign up/login)  
**Database:** Multi-tenant Supabase  
**Billing:** Stripe (standalone)

---

## Files & Resources for Hermes

**In Workspace:**
- `LAVERDI_SOCIAL_MARKET_VALIDATION.md` — Full market analysis
- `CHANNELS_STATUS_20260520.md` — Current API integration status from Telegram work
- Competitive pricing matrix
- Customer validation questions

**External Resources:**
- YouTube API docs: https://developers.google.com/youtube/v3
- TikTok Business API: https://developers.tiktok.com
- Instagram Graph API: https://developers.facebook.com/docs/instagram-graph-api
- X API v2: https://developer.twitter.com/en/docs/twitter-api/latest
- Facebook Graph API: https://developers.facebook.com/docs/graph-api/

---

## Success Criteria

- [ ] All 5 platforms can be posted to simultaneously
- [ ] Video uploads are reliable (0% failure rate)
- [ ] End-to-end workflow < 2 minutes
- [ ] Beta users say "I would pay for this"
- [ ] Deployed and live on RVConnector by Week 10

---

## Questions for Hermes?

- What tech stack preference? (Python or Node?)
- Need me to set up infrastructure/Supabase tables first?
- Any blockers or unknowns?

**Chris's Role:** Answer questions, unblock Hermes, provide API credentials when ready

---

**Ready to build?** 🚀
