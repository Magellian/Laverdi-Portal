# LaVerdi Portal — Phase 1: Auth + Multi-tenant Foundation

A multi-tenant AI agent hosting platform built with Next.js 15, NextAuth.js, Prisma, and Supabase.

## Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- npm or pnpm
- PostgreSQL (via Supabase)

### Installation

```bash
# Clone repository
git clone https://github.com/Magellian/laverdi-portal.git
cd laverdi-portal

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Run Prisma migrations
npx prisma migrate dev --name init

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Architecture

### Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15 (App Router, TypeScript) |
| **UI** | Tailwind CSS |
| **Auth** | NextAuth.js v5 + Supabase Adapter |
| **Database** | PostgreSQL (Supabase) |
| **ORM** | Prisma |
| **Deployment** | Docker + Docker Compose |

### Database Schema

```
User
├── email (unique)
├── Organizations (1:many)
├── OrganizationMembers (1:many)
└── Workspaces (1:many)

Organization
├── owner (FK: User)
├── Members (1:many)
└── Workspaces (1:many)

Workspace
├── organization (FK: Organization)
├── owner (FK: User)
└── Instances (1:many)

Instance
├── workspace (FK: Workspace)
├── owner (FK: User)
└── hermesAgentId (Hermes agent reference)
```

### Multi-Tenant Isolation

- Users belong to multiple organizations
- Each organization has workspaces
- Workspaces isolate Hermes agent instances
- Role-based access control (owner/admin/member)
- RLS policies enforce data isolation at database level

## Environment Variables

Create `.env.local` with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# NextAuth
NEXTAUTH_SECRET=generate-a-random-secret
NEXTAUTH_URL=http://localhost:3000

# Supabase (Backend)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email (Optional, for email sign-in)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@laverdi.tech
```

## API Routes

### Authentication
- `POST /api/auth/signin` — Sign in with email
- `POST /api/auth/signout` — Sign out
- `GET /api/auth/session` — Get current session

### Organizations
- `GET /api/orgs` — List user's organizations
- `POST /api/orgs` — Create new organization
- `GET /api/orgs/[id]` — Get organization details
- `PATCH /api/orgs/[id]` — Update organization
- `DELETE /api/orgs/[id]` — Delete organization

### Workspaces
- `GET /api/workspaces` — List workspaces in org
- `POST /api/workspaces` — Create workspace
- `GET /api/workspaces/[id]` — Get workspace details

### Instances
- `GET /api/instances` — List instances in workspace
- `POST /api/instances` — Provision Hermes agent instance
- `GET /api/instances/[id]` — Get instance status
- `DELETE /api/instances/[id]` — Delete instance

## Pages

- `/` — Landing page
- `/login` — Email sign-in
- `/signup` — Create account
- `/app/dashboard` — User dashboard (org selector)
- `/app/admin/dashboard` — Admin panel (users, orgs, instances)

## Deployment

### Docker

```bash
# Build image
docker build -t laverdi-portal .

# Run container
docker-compose up -d
```

### VPS Deployment

```bash
# Run deploy script
bash deploy.sh 104.238.157.139 ~/.ssh/hermes-deploy

# Or manual deployment:
ssh -i ~/.ssh/hermes-deploy root@104.238.157.139
cd /app/laverdi-portal
git pull
npx prisma migrate deploy
docker-compose up -d
```

## Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
npm run typecheck # TypeScript type check
npm test         # Run tests (when available)
```

### Database

```bash
# Create migration
npx prisma migrate dev --name migration_name

# View database
npx prisma studio

# Reset database (dev only)
npx prisma migrate reset
```

## Phase 2 - Hermes Agent Provisioning (Upcoming)

- Docker container provisioning per user
- Instance CRUD API with status tracking
- Persistent volumes for agent memory
- Nginx reverse proxy routing
- Health monitoring + auto-restart

## Phase 3 - Channel Integration (Upcoming)

- Telegram, Discord, Slack integration
- Token management UI
- Webhook routing
- Channel connection wizard

## Phase 4 - Billing + Admin (Upcoming)

- Stripe subscription management
- Usage tracking + quotas
- Admin panel for support
- Email notifications

## Contributing

1. Create a feature branch
2. Make your changes
3. Run `npm run lint` and `npm run typecheck`
4. Commit with clear messages
5. Push and create a Pull Request

## Security

- All credentials in environment variables (never committed)
- NextAuth.js for secure authentication
- Prisma RLS policies for data isolation
- HTTPS required in production
- Rate limiting on API routes (TODO: Phase 2)

## Support

For issues or questions, open a GitHub issue or contact the team.

## License

MIT
