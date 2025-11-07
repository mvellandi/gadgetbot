# GadgetBot Production Deployment Plan

**Date**: 2025-11-03
**Platform**: Coolify on Hetzner VPS
**Status**: Planning Phase

---

## Overview

This document outlines the production deployment architecture for GadgetBot, optimized for:
- Independent GadgetBot updates without affecting authentication
- Preserved user sessions during app deployments
- Clear CI/CD path for future automation
- Minimal user impact during updates

---

## Current Production State

Based on [DEPLOYMENT_PROGRESS_2025-11-01.md](./DEPLOYMENT_PROGRESS_2025-11-01.md):

### ✅ Already Deployed

1. **Server**: Hetzner CX23 VPS
   - IP: 65.21.154.182
   - OS: Ubuntu 24.04
   - RAM: 4GB
   - Disk: 80GB

2. **Coolify**: Installed and configured
   - Dashboard: `https://gadgetbot-coolify.vellandi.net`
   - SSL: Auto-configured via Let's Encrypt
   - Firewall: Configured (ports 22, 80, 443, 6001, 6002, 8000)

3. **DNS Records**: Configured at `vellandi.net`
   - `gadgetbot.vellandi.net` → 65.21.154.182
   - `gadgetbot-auth.vellandi.net` → 65.21.154.182
   - `gadgetbot-coolify.vellandi.net` → 65.21.154.182

4. **Databases**: Running in Coolify
   - `gadgetbot-db` (PostgreSQL 17)
   - `zitadel-db` (PostgreSQL 17)

5. **Zitadel**: Deployed via Docker Compose
   - Accessible at: `https://gadgetbot-auth.vellandi.net`
   - Admin user configured
   - Login V2 disabled (temporary - using classic login UI)

### 🚧 To Be Deployed

**GadgetBot Application** (separate resource)

---

## Deployment Architecture

### Resource Overview

```
Coolify Resources (4 total):

1. gadgetbot-db
   Type: Database (PostgreSQL 17)
   Purpose: GadgetBot application data
   Status: ✅ Deployed

2. zitadel-db
   Type: Database (PostgreSQL 17)
   Purpose: Zitadel authentication data
   Status: ✅ Deployed

3. zitadel-stack
   Type: Docker Compose
   Purpose: Authentication services (stable, rarely updated)
   Status: ✅ Deployed
   Services:
   ├── zitadel (auth server)
   └── zitadel-login (Login V2 UI)

4. gadgetbot-app
   Type: Application (Git-based)
   Purpose: Main application (frequently updated)
   Status: 🚧 To be deployed
   CI/CD: Auto-deploy from GitHub on push to main
```

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Hetzner VPS (CX23)                       │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Traefik Reverse Proxy (SSL/Routing)               │    │
│  │  ├── gadgetbot.vellandi.net → gadgetbot-app        │    │
│  │  └── gadgetbot-auth.vellandi.net → zitadel-stack   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Coolify Resource: zitadel-stack (Docker Compose)  │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  zitadel (ghcr.io/zitadel/zitadel:latest)    │  │    │
│  │  │  - OAuth/OIDC server                         │  │    │
│  │  │  - Port 8080                                 │  │    │
│  │  │  - Connects to zitadel-db                    │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  zitadel-login (ghcr.io/zitadel/...login)   │  │    │
│  │  │  - Login V2 UI                               │  │    │
│  │  │  - network_mode: service:zitadel             │  │    │
│  │  │  - Path: /ui/v2/login                        │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Coolify Resource: gadgetbot-app (Application)     │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  GadgetBot (built from Git)                  │  │    │
│  │  │  - TanStack Start app                        │  │    │
│  │  │  - Port 3000                                 │  │    │
│  │  │  - Auto-deploy on push                       │  │    │
│  │  │  - Connects to gadgetbot-db                  │  │    │
│  │  │  - OAuth via zitadel                         │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐               │
│  │  gadgetbot-db   │    │   zitadel-db    │               │
│  │  PostgreSQL 17  │    │  PostgreSQL 17  │               │
│  └─────────────────┘    └─────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Deployment Strategy: Why Separate Resources?

### Rationale

**Zitadel Stack (Docker Compose):**
- ✅ Stable authentication services
- ✅ Rarely needs updates
- ✅ Login V2 tightly coupled with Zitadel core
- ✅ Updates require planned maintenance windows

**GadgetBot App (Coolify Application):**
- ✅ Frequent updates (features, bug fixes)
- ✅ Independent from auth stack
- ✅ Easy CI/CD integration
- ✅ Zero impact on user sessions during deployment

### Update Impact Comparison

| Scenario | Zitadel Impact | User Sessions | Downtime |
|----------|----------------|---------------|----------|
| **Single Compose** (all 3 apps) | ❌ Restarts | ❌ Lost | ~60s |
| **Separate Resources** (recommended) | ✅ No restart | ✅ Preserved | ~5-10s |

---

## Deployment Steps

### Phase 1: Upgrade Zitadel Stack with Login V2

#### 1.1 Prepare Docker Compose File

Create `docker-compose.zitadel.production.yml` based on [docker-compose.zitadel.local.yml](../docker-compose.zitadel.local.yml):

**Key changes for production:**
- Set `ZITADEL_EXTERNALDOMAIN=gadgetbot-auth.vellandi.net`
- Set `ZITADEL_EXTERNALSECURE=true`
- Enable Login V2: `ZITADEL_DEFAULTINSTANCE_FEATURES_LOGINV2_REQUIRED=true`
- Configure Login V2 URLs for production domain
- Use production database connection from `zitadel-db` resource
- Pin image versions (e.g., `ghcr.io/zitadel/zitadel:v2.62.1`)

#### 1.2 Deploy via Coolify

1. In Coolify dashboard: **+ New → Docker Compose**
2. Upload `docker-compose.zitadel.production.yml`
3. Set environment variables:
   - `ZITADEL_MASTERKEY` (generate 32-char secret)
   - Database credentials from `zitadel-db` resource
   - Admin user credentials
4. Deploy and verify at `https://gadgetbot-auth.vellandi.net`

#### 1.3 Verify Login V2

- Access: `https://gadgetbot-auth.vellandi.net/ui/v2/login`
- Test admin login
- Verify console access: `https://gadgetbot-auth.vellandi.net/ui/console`

---

### Phase 2: Deploy GadgetBot Application

#### 2.1 Prepare Repository

**Ensure repository has:**
- [ ] `Dockerfile` (for Coolify to build)
- [ ] `.dockerignore` (exclude node_modules, .git, etc.)
- [ ] Build scripts in `package.json`:
  - `"build": "vite build"`
  - `"start": "node .output/server/index.mjs"` (or appropriate start command)

#### 2.2 Create Application in Coolify

1. In Coolify: **+ New → Application → GitHub**
2. Connect to your GitHub account
3. Select repository: `mvellandi/gadgetbot` (or your fork)
4. Configuration:
   - **Name**: `gadgetbot-app`
   - **Branch**: `main`
   - **Build Pack**: `nixpacks` (auto-detects Node.js)
   - **Domain**: `gadgetbot.vellandi.net`
   - **Port**: `3000`
   - **HTTPS**: Enable (auto SSL)

#### 2.3 Configure Environment Variables

In Coolify app settings, add:

```env
# Node environment
NODE_ENV=production

# Database (from gadgetbot-db resource)
DATABASE_URL=postgresql://postgres:<password>@<host>:<port>/gadgetbot
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# App URLs
APP_URL=https://gadgetbot.vellandi.net
BETTER_AUTH_URL=https://gadgetbot.vellandi.net

# Better Auth (generate in Coolify or use: openssl rand -base64 32)
BETTER_AUTH_SECRET=<generate-32-char-secret>

# Zitadel OAuth (get from Zitadel console after creating OAuth app)
ZITADEL_ISSUER=https://gadgetbot-auth.vellandi.net
ZITADEL_CLIENT_ID=<from-zitadel-console>
ZITADEL_CLIENT_SECRET=<from-zitadel-console>

# Optional: Client-side variables
VITE_APP_TITLE=GadgetBot
VITE_SERVER_URL=https://gadgetbot.vellandi.net
```

#### 2.4 Enable Auto-Deploy

In Coolify app settings:
- ✅ Enable **Auto Deploy**
- ✅ Set webhook for GitHub (Coolify provides URL)
- Now: `git push origin main` triggers automatic deployment

#### 2.5 Deploy Application

1. Click **Deploy** in Coolify
2. Watch build logs in real-time
3. Wait for deployment to complete (~3-5 minutes)
4. Verify at: `https://gadgetbot.vellandi.net`

---

### Phase 3: Configure Zitadel OAuth

#### 3.1 Create OAuth Application in Zitadel

1. Login to Zitadel: `https://gadgetbot-auth.vellandi.net/ui/console`
2. Go to **Projects** → Create or select project
3. Click **New Application**
4. Configure:
   - **Name**: GadgetBot Production
   - **Type**: Web
   - **Authentication Method**: PKCE
5. **Redirect URIs**:
   - Add: `https://gadgetbot.vellandi.net/api/auth/callback/zitadel`
6. **Post Logout URIs**:
   - Add: `https://gadgetbot.vellandi.net`
7. Click **Save**
8. **Copy credentials**:
   - Client ID
   - Client Secret (generate if needed)

#### 3.2 Update GadgetBot Environment Variables

1. In Coolify, go to `gadgetbot-app` resource
2. **Environment Variables** tab
3. Update:
   ```env
   ZITADEL_CLIENT_ID=<from-zitadel-console>
   ZITADEL_CLIENT_SECRET=<from-zitadel-console>
   ```
4. Click **Save**
5. Click **Restart** (or **Redeploy**)

---

### Phase 4: Database Migrations

#### 4.1 Run Migrations via Coolify Terminal

1. In Coolify, go to `gadgetbot-app` resource
2. Click **Terminal** tab (opens shell in container)
3. Run:
   ```bash
   npm run db:migrate
   ```
4. Verify success (check for migration completion messages)

#### 4.2 Seed Database (Optional)

```bash
# In container terminal
npm run db:seed
```

This adds sample GadgetBot data for testing.

#### 4.3 Verify Database

1. Go to `gadgetbot-db` resource in Coolify
2. Click **Terminal** tab
3. Connect to PostgreSQL:
   ```bash
   psql -U postgres -d gadgetbot
   ```
4. Check tables:
   ```sql
   \dt
   SELECT * FROM gadgetbots LIMIT 5;
   \q
   ```

---

### Phase 5: Testing & Verification

#### 5.1 Test Authentication Flow

1. Visit: `https://gadgetbot.vellandi.net`
2. Click "Sign In"
3. Should redirect to: `https://gadgetbot-auth.vellandi.net/ui/v2/login`
4. Login with Zitadel user
5. Should redirect back to GadgetBot with authenticated session
6. Verify user menu shows logged-in state

#### 5.2 Test Application Features

- [ ] View GadgetBot list
- [ ] Create new GadgetBot (admin only)
- [ ] Update GadgetBot
- [ ] Delete GadgetBot
- [ ] Sign out
- [ ] Sign back in (verify session persistence)

#### 5.3 Monitor Logs

**In Coolify dashboard:**
- Check `gadgetbot-app` logs for errors
- Check `zitadel-stack` logs for auth issues
- Monitor resource usage (CPU, RAM)

---

## CI/CD Workflow

### Automatic Deployment Process

**Trigger**: Push to `main` branch

**Process:**
1. Developer pushes code: `git push origin main`
2. GitHub webhook notifies Coolify
3. Coolify pulls latest code
4. Coolify builds new Docker image (via Nixpacks)
5. Coolify runs health checks on new container
6. Coolify switches traffic to new container
7. Old container shuts down
8. **Total time**: ~2-5 minutes
9. **User impact**: ~5-10 seconds downtime (or zero with rolling restart)

**Key Benefits:**
- ✅ **No impact on Zitadel** (authentication stays up)
- ✅ **User sessions preserved** (users stay logged in)
- ✅ **Automatic process** (no manual SSH/commands)
- ✅ **Rollback available** (redeploy previous commit)

### Manual Deployment (if needed)

```bash
# SSH to server
ssh -i ~/.ssh/hetzner_gadgetbot root@65.21.154.182

# Navigate to Coolify data directory
cd /data/coolify

# Trigger deployment via Coolify CLI (if available)
# Or use Coolify UI: Click "Redeploy" button
```

---

## Maintenance & Operations

### Update Scenarios

#### Scenario 1: Update GadgetBot App (Frequent)

**Process:**
1. Push code to `main` branch
2. Coolify auto-deploys (2-5 minutes)
3. Zitadel continues running
4. Users stay logged in

**Impact:**
- ⏱️ 5-10 seconds app downtime (or zero with rolling restart)
- ✅ No auth interruption
- ✅ Sessions preserved

#### Scenario 2: Update Zitadel Stack (Rare)

**Process:**
1. Plan maintenance window (off-peak hours)
2. Notify users (if applicable)
3. Update `docker-compose.zitadel.production.yml`
4. Redeploy in Coolify
5. Wait for health checks (~2 minutes)
6. Verify auth flow

**Impact:**
- ⏱️ 30-60 seconds auth downtime
- ❌ All users logged out (must re-authenticate)
- ✅ GadgetBot app continues running (displays login prompt)

**When to update:**
- Security patches
- Major Zitadel version upgrades
- Login V2 UI updates (rare)
- Quarterly or as-needed

### Backup Strategy

#### Database Backups

**In Coolify (both databases):**
1. Go to database resource
2. **Backups** tab
3. Configure:
   - **Frequency**: Daily at 2 AM
   - **Retention**: 7 days
   - **Destination**: Local (or S3 for production)

**Manual backup:**
```bash
# SSH to server
ssh -i ~/.ssh/hetzner_gadgetbot root@65.21.154.182

# Backup GadgetBot database
docker exec <gadgetbot-db-container> pg_dump -U postgres gadgetbot > gadgetbot_backup_$(date +%Y%m%d).sql

# Backup Zitadel database
docker exec <zitadel-db-container> pg_dump -U postgres zitadel > zitadel_backup_$(date +%Y%m%d).sql
```

#### Configuration Backups

**Files to backup:**
- `docker-compose.zitadel.production.yml`
- Coolify environment variables (export from UI)
- Zitadel OAuth app credentials
- DNS records documentation

### Monitoring

**Via Coolify Dashboard:**
- CPU/RAM usage per resource
- Disk space
- Container status (running/stopped/failed)
- Build/deployment logs
- Real-time log streaming

**Set up alerts** (optional):
1. **Settings** → **Notifications** in Coolify
2. Configure email/Discord/Slack
3. Alert on:
   - Memory > 85%
   - Disk > 80%
   - Deployment failure
   - Container crash

---

## Troubleshooting

### GadgetBot App Issues

**App won't start:**
1. Check Coolify logs for build errors
2. Verify environment variables (especially `DATABASE_URL`)
3. Check if port 3000 is correct
4. Verify Node.js version compatibility

**Database connection errors:**
1. Verify `DATABASE_URL` in app settings
2. Check `gadgetbot-db` is running
3. Test connection from container:
   ```bash
   # In app container terminal
   psql $DATABASE_URL -c "SELECT 1"
   ```

**Authentication not working:**
1. Verify `ZITADEL_ISSUER` is correct
2. Check OAuth redirect URIs in Zitadel match production URL
3. Verify `ZITADEL_CLIENT_ID` and `ZITADEL_CLIENT_SECRET`
4. Check Better Auth configuration

### Zitadel Stack Issues

**Zitadel won't start:**
1. Check `zitadel-db` is running and healthy
2. Verify database credentials in compose file
3. Check Zitadel logs for initialization errors
4. Ensure `ZITADEL_MASTERKEY` is 32 characters

**Login V2 not working:**
1. Verify `ZITADEL_DEFAULTINSTANCE_FEATURES_LOGINV2_REQUIRED=true`
2. Check Login V2 URLs in compose file
3. Verify `zitadel-login` container is running
4. Check network mode: `network_mode: service:zitadel`
5. Access directly: `https://gadgetbot-auth.vellandi.net/ui/v2/login`

**Database initialization failed:**
1. May need to reset database on first deployment
2. Check database logs for errors
3. Ensure database user has correct privileges

### SSL Certificate Issues

**Certificate not provisioning:**
1. Verify DNS points to correct IP
2. Check domain is accessible via HTTP first
3. Coolify uses Let's Encrypt (requires ports 80/443 open)
4. Check Traefik logs in Coolify

**Certificate expired:**
- Coolify auto-renews via Let's Encrypt
- If manual renewal needed, check Coolify settings

---

## Cost & Resources

### Monthly Costs

| Service | Cost | Notes |
|---------|------|-------|
| Hetzner VPS (CX23) | €3.49 | 2 vCPU, 4GB RAM, 80GB disk |
| Domain (vellandi.net) | ~€1 | Annual cost divided by 12 |
| Coolify | FREE | Self-hosted |
| PostgreSQL | FREE | Managed by Coolify |
| SSL Certificates | FREE | Let's Encrypt |
| **Total** | **€4.49/month** | **~€54/year** |

### Resource Usage (Estimated)

| Service | RAM | CPU | Notes |
|---------|-----|-----|-------|
| Coolify | 512MB | Auto | Platform overhead |
| Zitadel | 800MB | 0.5 | Auth server |
| Zitadel-login | 256MB | 0.25 | Login V2 UI |
| GadgetBot App | 512MB | 0.5 | TanStack Start app |
| PostgreSQL (gadgetbot-db) | 400MB | 0.5 | App database |
| PostgreSQL (zitadel-db) | 400MB | 0.5 | Auth database |
| **Subtotal** | **2.88GB** | - | Active services |
| **Buffer** | **1.12GB** | - | OS + traffic spikes |
| **Total Available** | **4GB** | 2 vCPU | CX23 capacity |

**Status**: Fits comfortably on CX23 for demo/staging environment.

**Upgrade path**: If production traffic increases, upgrade to CX33 (€5.49/month, 4 vCPU, 8GB RAM).

---

## Security Checklist

- [ ] Strong passwords for all services (use Coolify password generator)
- [ ] SSH key authentication only (no password auth)
- [ ] Firewall configured (Hetzner + UFW)
- [ ] SSL enabled for all domains
- [ ] `BETTER_AUTH_SECRET` is strong (32+ characters)
- [ ] `ZITADEL_MASTERKEY` is strong (32+ characters)
- [ ] Database passwords are unique and strong
- [ ] Coolify dashboard has 2FA enabled (optional but recommended)
- [ ] Regular backups configured
- [ ] Coolify kept updated (check monthly)
- [ ] Monitor logs for suspicious activity

---

## Next Steps

1. [ ] Create `docker-compose.zitadel.production.yml` based on test version
2. [ ] Upgrade existing Zitadel deployment with Login V2
3. [ ] Test Login V2 UI in production
4. [ ] Create Coolify Application resource for GadgetBot
5. [ ] Configure environment variables in Coolify
6. [ ] Deploy GadgetBot app
7. [ ] Run database migrations
8. [ ] Configure OAuth in Zitadel
9. [ ] Test end-to-end authentication flow
10. [ ] Enable auto-deploy for CI/CD
11. [ ] Configure database backups
12. [ ] Set up monitoring alerts
13. [ ] Document production credentials (securely)
14. [ ] Test rollback procedure

---

## Reference Documentation

- [DEPLOYMENT_PROGRESS_2025-11-01.md](./DEPLOYMENT_PROGRESS_2025-11-01.md) - Previous deployment progress
- [DEPLOYMENT_COOLIFY.md](./DEPLOYMENT_COOLIFY.md) - Comprehensive Coolify guide
- [AUTH_SETUP.md](./AUTH_SETUP.md) - Authentication setup guide
- [CLAUDE.md](../CLAUDE.md) - Project architecture
- [docker-compose.zitadel.local.yml](../docker-compose.zitadel.local.yml) - Local Zitadel config (reference for production)

---

**Status**: Ready for Phase 1 deployment (Zitadel Login V2 upgrade)
**Last Updated**: 2025-11-03
**Author**: Planning session with Claude
