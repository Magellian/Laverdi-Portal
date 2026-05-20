# Quick Start Guide - Fife RV Admin Dashboard

Get the dashboard up and running in 5 minutes.

## Prerequisites

- Node.js 18+ ([download](https://nodejs.org/))
- npm (comes with Node.js)
- Supabase account ([create free](https://supabase.com))
- Basic command line knowledge

## Setup Steps

### 1. Get Supabase Credentials (2 minutes)

1. Go to [supabase.com](https://supabase.com) and create a project
2. Wait for project to be created (1-2 minutes)
3. Go to **Settings → API**
4. Copy these two values:
   - **Project URL** (looks like `https://xxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### 2. Create Environment File (1 minute)

In the `fiferv-admin` folder, create a file named `.env.local`:

**Windows (PowerShell):**
```powershell
"NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co" | Out-File .env.local -Encoding utf8
"NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key" | Add-Content .env.local -Encoding utf8
```

**Mac/Linux (Terminal):**
```bash
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EOF
```

Replace the placeholders with your actual values.

### 3. Install Dependencies (1 minute)

```bash
npm install
```

### 4. Build and Run (1 minute)

```bash
npm run build
npm start
```

Open browser to: **http://localhost:3000**

## Default Login

When first accessing the dashboard:
- Use your Supabase user credentials
- If you haven't created a user yet, create one in Supabase dashboard:
  - Go to **Authentication → Users**
  - Click **Create new user**
  - Enter email and password

## Verify It Works

1. ✅ Login page loads at http://localhost:3000
2. ✅ Can log in with Supabase credentials
3. ✅ Dashboard appears after login
4. ✅ No red error messages

If you see errors, check:
- `.env.local` file has correct values (no extra spaces or quotes)
- Supabase URL and key are from the same project
- Node.js version is 18 or higher: `node --version`

## Next Steps

### Deploy to Production

Follow the comprehensive [DEPLOYMENT.md](./DEPLOYMENT.md) guide for:
- Deploying to your server (66.42.70.66)
- Setting up SSL/HTTPS
- Configuring the database
- Production optimization

### Configure Database

Your Supabase project needs these tables. Run in Supabase SQL editor:

```sql
-- Calls table
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20),
  duration INTEGER,
  transcript TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50)
);

-- Leads table  
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_name VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  rv_type VARCHAR(255),
  budget VARCHAR(50),
  timeline VARCHAR(100),
  trade_in TEXT,
  appointment_requested BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  contacted BOOLEAN DEFAULT FALSE
);

-- Channel config
CREATE TABLE channel_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email VARCHAR(255),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Schedule config
CREATE TABLE schedule_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week VARCHAR(20),
  start_time TIME,
  end_time TIME,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_config ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admin access" ON calls
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin access" ON leads
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin access" ON channel_config
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin access" ON schedule_config
  FOR ALL USING (auth.role() = 'authenticated');
```

### Test Features

1. **Dashboard Overview** - See stats and recent leads
2. **AI Control** - Toggle AI on/off, manage email recipients
3. **Leads** - View and manage all leads
4. **Schedule** - Set after-hours times
5. **Analytics** - View charts and metrics
6. **Settings** - Change password, view account info

## Common Issues

### "Cannot read properties of undefined (reading 'auth')"
- ❌ Supabase URL or key is wrong
- ✅ Check `.env.local` file for correct values
- ✅ Make sure there are no extra spaces or quotes

### "Connection refused"
- ❌ Supabase project might be down
- ✅ Check your internet connection
- ✅ Verify Supabase status: https://status.supabase.com

### "No tables found"
- ❌ Database tables not created
- ✅ Run the SQL commands from "Configure Database" section
- ✅ Tables should appear in Supabase dashboard

### Port 3000 already in use
```bash
# Use different port
PORT=3001 npm start
```

### "Module not found" errors
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Commands Reference

```bash
# Development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Check for TypeScript errors
npm run type-check

# Run linter
npm run lint
```

## File Structure

```
fiferv-admin/
├── app/                 # All page components
├── lib/                 # Utilities (Supabase, API)
├── components/          # Reusable components
├── .env.local          # Your credentials (DON'T COMMIT!)
├── next.config.js      # Next.js settings
├── tailwind.config.ts  # Tailwind CSS settings
└── package.json        # Dependencies
```

## Documentation

- [Full README](./README.md) - Complete feature documentation
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)

## Support

If you get stuck:

1. Check the [README.md](./README.md) troubleshooting section
2. Review the [DEPLOYMENT.md](./DEPLOYMENT.md) for server issues
3. Check Supabase dashboard for errors:
   - **Functions** tab for any errors
   - **Logs** for connection issues
4. Check browser console (F12) for JavaScript errors

## Next: Deploy to Server

Once everything works locally, deploy to production using [DEPLOYMENT.md](./DEPLOYMENT.md):

1. Prepare your server
2. Upload files
3. Install dependencies
4. Configure environment
5. Build application
6. Setup PM2 process manager
7. Configure Nginx reverse proxy
8. Setup SSL with Let's Encrypt
9. Verify everything works

**Estimated time**: 30 minutes to full production deployment

---

**You're ready to go!** 🚀

Start with: `npm run dev`
