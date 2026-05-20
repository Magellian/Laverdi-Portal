# Fife RV Admin Dashboard

Production-ready admin dashboard for the Fife RV AI Receptionist system. Complete management interface built with Next.js, React, TypeScript, and Tailwind CSS.

## Features

✅ **AI Control** - Toggle AI receptionist on/off for emergency manual control
✅ **Lead Management** - View, filter, and update all captured leads with detailed information
✅ **Email Recipients** - Add/remove email addresses for lead alert notifications
✅ **Scheduling** - Configure after-hours start/end times per weekday
✅ **Analytics Dashboard** - Charts showing calls/leads by day, conversion rates, and trends
✅ **CSV Export** - Export leads to CSV for further analysis
✅ **Real-time Updates** - Auto-refresh data every 30 seconds
✅ **Role-based Access** - Supabase Auth with admin-only access
✅ **Mobile Responsive** - Full mobile support with responsive design
✅ **Professional UI** - Clean design with Tailwind CSS (no DaisyUI)

## Tech Stack

- **Frontend**: Next.js 14+ with React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth with row-level security
- **Charts**: Recharts
- **Deployment**: Ready for production on any Node.js server

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Supabase project with configured tables and RLS policies

## Setup Instructions

### 1. Environment Configuration

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these values from your Supabase project settings:
- Go to Settings → API
- Copy `Project URL` and `anon public` key

### 2. Database Setup

Ensure your Supabase database has these tables:

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

-- Channel config (email recipients)
CREATE TABLE channel_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email VARCHAR(255),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Schedule configuration
CREATE TABLE schedule_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week VARCHAR(20),
  start_time TIME,
  end_time TIME,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Row-Level Security (RLS)

Enable RLS on all tables and create policies:

```sql
-- Enable RLS
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_config ENABLE ROW LEVEL SECURITY;

-- Create policies (allow authenticated users - admin role)
CREATE POLICY "Admin access" ON calls
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin access" ON leads
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin access" ON channel_config
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin access" ON schedule_config
  FOR ALL USING (auth.role() = 'authenticated');
```

### 4. Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000 in your browser
```

### 5. Production Build

```bash
# Build for production
npm run build

# Test production build locally
npm start

# Verify it runs on http://localhost:3000
```

## Deployment

### Option 1: Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts to connect your repository
```

Vercel will automatically:
- Detect Next.js framework
- Build and optimize your app
- Deploy with edge functions
- Handle SSL certificates

### Option 2: Deploy to Your Server (66.42.70.66)

#### Prerequisites
- SSH access to server
- Node.js 18+ installed
- PM2 or systemd for process management
- Nginx or Apache as reverse proxy

#### Deployment Steps

1. **Connect to your server:**
```bash
ssh user@66.42.70.66
```

2. **Clone/upload the project:**
```bash
cd /var/www
git clone <your-repo-url> fiferv-admin
cd fiferv-admin
```

3. **Install dependencies:**
```bash
npm install --production
```

4. **Create .env.local:**
```bash
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EOF
```

5. **Build the application:**
```bash
npm run build
```

6. **Setup PM2 (process manager):**
```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the app
pm2 start npm --name "fiferv-admin" -- start

# Save PM2 configuration
pm2 save

# Setup startup on reboot
pm2 startup
```

7. **Configure Nginx:**
```nginx
server {
    listen 80;
    server_name 66.42.70.66;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

8. **Enable SSL (Let's Encrypt):**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d 66.42.70.66
```

9. **Monitor and manage:**
```bash
# View logs
pm2 logs fiferv-admin

# Restart the app
pm2 restart fiferv-admin

# Monitor in real-time
pm2 monit
```

### Option 3: Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application
COPY . .

# Build Next.js
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
    restart: always
```

Deploy:
```bash
docker-compose up -d
```

## Project Structure

```
fiferv-admin/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Login page
│   ├── globals.css             # Global styles
│   └── dashboard/
│       ├── layout.tsx          # Dashboard layout with sidebar
│       ├── page.tsx            # Dashboard overview
│       ├── ai-control/
│       │   └── page.tsx        # AI toggle & email recipients
│       ├── leads/
│       │   └── page.tsx        # Lead management
│       ├── schedule/
│       │   └── page.tsx        # Schedule configuration
│       ├── analytics/
│       │   └── page.tsx        # Analytics & charts
│       └── settings/
│           └── page.tsx        # User settings
├── lib/
│   ├── supabase.ts             # Supabase client setup
│   └── api.ts                  # API functions
├── components/
│   └── CSVExport.tsx           # CSV export component
├── public/                     # Static assets
├── .env.local                  # Environment variables
├── next.config.js              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.ts          # Tailwind CSS configuration
└── package.json                # Dependencies
```

## Key Components

### Dashboard Pages

**Login (`/`)** - Secure authentication
- Email/password sign-in
- Supabase Auth integration
- Session persistence

**Overview (`/dashboard`)** - Main dashboard
- Stats cards (calls, leads, conversion rate)
- Recent leads table
- Quick action links
- Auto-refresh every 30 seconds

**AI Control (`/dashboard/ai-control`)** - Emergency control
- AI on/off toggle
- Email recipient management
- Add/remove alert recipients
- Status indicators

**Leads (`/dashboard/leads`)** - Lead management
- View all leads with full details
- Search and filter
- Mark as contacted
- Edit notes
- CSV export

**Schedule (`/dashboard/schedule`)** - After-hours configuration
- Enable/disable by day
- Set start/end times
- 24-hour format support
- Real-time updates

**Analytics (`/dashboard/analytics`)** - Performance insights
- Calls & leads trend charts
- Lead status breakdown
- Appointments by date
- Top RV types
- Daily metrics table
- Time range selector (7d, 30d, 90d)

**Settings (`/dashboard/settings`)** - Account management
- Profile information
- Password change
- Security settings
- About information

## API Functions

All API operations are in `lib/api.ts`:

```typescript
// AI Status
getAIStatus()
updateAIStatus(enabled: boolean)

// Leads
getLeads(limit?: number)
updateLead(id: string, updates: Record<string, any>)
markLeadAsContacted(id: string)

// Email Recipients
getEmailRecipients()
addEmailRecipient(email: string)
removeEmailRecipient(id: string)

// Schedule
getScheduleConfig()
updateSchedule(id: string, updates: Record<string, any>)

// Analytics
getCallAnalytics(days?: number)
getLeadAnalytics(days?: number)
```

## Authentication

- Uses Supabase Auth
- Admin-only access via RLS policies
- Session persistence
- Secure password handling
- Logout functionality

## Features in Detail

### Lead Management
- View caller name, phone, email
- Track RV type, budget, timeline
- View trade-in status
- See appointment requests
- Add/edit notes
- Mark as contacted
- Export to CSV

### Email Recipients
- Add multiple recipients
- All active recipients receive notifications
- Remove recipients anytime
- Validation and error handling
- Creation date tracking

### Scheduling
- Configure per weekday
- 24-hour format (00:00-23:59)
- Enable/disable toggle
- Real-time validation
- Current summary view

### Analytics
- 30-day analytics by default
- Customizable time ranges (7d, 30d, 90d)
- Multiple chart types (line, bar, pie)
- Daily metrics table
- Conversion rate tracking
- Appointment trend analysis

## Styling

- **Tailwind CSS** for all styling
- No DaisyUI or other component libraries
- Responsive mobile-first design
- Custom colors and spacing
- Smooth transitions and animations
- Professional color scheme

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Static pre-rendering where applicable
- Client-side data fetching with caching
- Optimized image handling
- Efficient re-renders
- Auto-refresh throttling (30 second intervals)

## Security

- Supabase Auth for authentication
- Row-level security (RLS) policies
- Environment variables for sensitive data
- No hardcoded credentials
- Secure password hashing (Supabase)
- HTTPS ready

## Error Handling

- User-friendly error messages
- Loading states on all operations
- Graceful fallbacks
- Console error logging
- Try-catch blocks throughout

## Maintenance

### Update Dependencies
```bash
npm update
npm audit fix
```

### Database Backups
```bash
# Supabase automatically backs up your data
# Configure backup frequency in Supabase dashboard
```

### Monitoring
- PM2 monitoring dashboard
- Supabase analytics
- Server logs
- Error tracking

## Troubleshooting

### "Cannot reach Supabase"
- Check `.env.local` values
- Verify Supabase project is active
- Check network connectivity

### "Unauthorized" errors
- Verify RLS policies are configured
- Check Supabase Auth setup
- Ensure user is authenticated

### "Build failures"
- Run `npm install` again
- Clear `.next` folder: `rm -rf .next`
- Check TypeScript errors: `npm run type-check`

### "Port already in use"
- Change port: `PORT=3001 npm start`
- Kill process: `lsof -i :3000` then `kill -9 <PID>`

## Support & Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Recharts Docs](https://recharts.org)

## License

Internal use for Fife RV Center

## Version

1.0.0 - Initial Release

---

Built with ❤️ for Fife RV Center
