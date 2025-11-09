# GadgetBot Production Deployment Guide

**Platform**: Coolify on Hetzner VPS

---

## Overview

This guide covers production deployment of GadgetBot, optimized for:
- Independent GadgetBot updates without affecting authentication
- Preserved user sessions during app deployments
- Clear CI/CD path for automation
- Minimal user impact during updates

---

## Production Architecture

### Infrastructure

**Server**: Hetzner CX23 VPS
- IP: 65.21.154.182
- OS: Ubuntu 24.04
- RAM: 4GB
- Disk: 80GB

**Coolify Platform**
- Dashboard: `https://gadgetbot-coolify.vellandi.net`
- SSL: Auto-configured via Let's Encrypt
- Firewall: Configured (ports 22, 80, 443, 6001, 6002, 8000)

**DNS Records** (at `vellandi.net`)
- `gadgetbot.vellandi.net` → 65.21.154.182
- `gadgetbot-auth.vellandi.net` → 65.21.154.182
- `gadgetbot-coolify.vellandi.net` → 65.21.154.182

**Databases** (Running in Coolify)
- `gadgetbot-db` (PostgreSQL 17)
- `zitadel-db` (PostgreSQL 17)

**Zitadel Authentication**
- Deployed via Docker Compose
- Accessible at: `https://gadgetbot-auth.vellandi.net`
- Admin user configured
- Login V2 UI enabled

### Resource Overview

```
Coolify Resources (4 total):

1. gadgetbot-db
   Type: Database (PostgreSQL 17)
   Purpose: GadgetBot application data

2. zitadel-db
   Type: Database (PostgreSQL 17)
   Purpose: Zitadel authentication data

3. zitadel-stack
   Type: Docker Compose
   Purpose: Authentication services (stable, rarely updated)
   Services:
   ├── zitadel (auth server)
   └── zitadel-login (Login V2 UI)

4. gadgetbot-app
   Type: Application (Git-based)
   Purpose: Main application (frequently updated)
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
- Stable authentication services
- Rarely needs updates
- Login V2 tightly coupled with Zitadel core
- Updates require planned maintenance windows

**GadgetBot App (Coolify Application):**
- Frequent updates (features, bug fixes)
- Independent from auth stack
- Easy CI/CD integration
- Zero impact on user sessions during deployment

### Update Impact Comparison

| Scenario | Zitadel Impact | User Sessions | Downtime |
|----------|----------------|---------------|----------|
| **Single Compose** (all 3 apps) | Restarts | Lost | ~60s |
| **Separate Resources** (recommended) | No restart | Preserved | ~5-10s |

---

## Deployment Guide

### Upgrading Zitadel Stack

#### Prepare Docker Compose File

Create `zitadel/docker-compose.production.yml` based on [zitadel/docker-compose.local.yml](../zitadel/docker-compose.local.yml):

**Key changes for production:**
- Set `ZITADEL_EXTERNALDOMAIN=gadgetbot-auth.vellandi.net`
- Set `ZITADEL_EXTERNALSECURE=true`
- Enable Login V2: `ZITADEL_DEFAULTINSTANCE_FEATURES_LOGINV2_REQUIRED=true`
- Configure Login V2 URLs for production domain
- Use production database connection from `zitadel-db` resource
- Pin image versions (e.g., `ghcr.io/zitadel/zitadel:v2.62.1`)

#### Deploy via Coolify

1. In Coolify dashboard: **+ New → Docker Compose**
2. Upload `zitadel/docker-compose.production.yml`
3. Set environment variables:
   - `ZITADEL_MASTERKEY` (generate 32-char secret)
   - Database credentials from `zitadel-db` resource
   - Admin user credentials
4. Deploy and verify at `https://gadgetbot-auth.vellandi.net`

#### Verify Login V2

- Access: `https://gadgetbot-auth.vellandi.net/ui/v2/login`
- Test admin login
- Verify console access: `https://gadgetbot-auth.vellandi.net/ui/console`

---

### Deploying GadgetBot Application

#### Prepare Repository

**Ensure repository has:**
- `Dockerfile` (for Coolify to build) - Updated with curl for healthcheck
- `.dockerignore` (exclude node_modules, .git, etc.)
- Build scripts in `package.json`:
  - `"build": "vite build"`
  - `"start": "node .output/server/index.mjs"`

**Key configurations applied:**
- Added `curl` to Alpine image for healthcheck compatibility
- Fixed `DATABASE_POOL_MIN` and `DATABASE_POOL_MAX` to use `NumberFromString` for env var parsing
- Updated healthcheck to use `curl -f http://localhost:3000 || exit 1`

#### Create Application in Coolify

1. In Coolify: **+ New → Application → Public Git Repository**
2. Configuration:
   - **Repository URL**: `https://github.com/mvellandi/gadgetbot`
   - **Name**: `gadgetbot-app`
   - **Branch**: `main`
   - **Build Pack**: `Dockerfile` (not Nixpacks - we have a custom Dockerfile)
   - **Domain**: `https://gadgetbot.vellandi.net` (Must include protocol!)
   - **Port**: `3000`
   - **HTTPS**: Auto-enabled via Let's Encrypt

**Important Coolify Quirk:**
- Domain field requires protocol prefix: `https://gadgetbot.vellandi.net`
- Without protocol, Coolify treats domain as a path prefix (routing bug)
- SSL certificate auto-generated by Let's Encrypt

#### Configure Environment Variables

**Location:** Coolify → gadgetbot-app → Configuration → **Environment Variables** tab

**Important Checkbox Settings:**
- "Available at Runtime" - Check for ALL variables
- "Available at Buildtime" - Uncheck (Dockerfile handles NODE_ENV)
- Note: Do NOT add NODE_ENV manually - Dockerfile sets it automatically

**Required Variables:**

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://postgres:<password>@<host>:5432/gadgetbot` | Must use `postgresql://` (not `postgres://`) |
| `DATABASE_POOL_MIN` | `2` | Parsed as number from string |
| `DATABASE_POOL_MAX` | `10` | Parsed as number from string |
| `APP_URL` | `https://gadgetbot.vellandi.net` | Your production domain |
| `BETTER_AUTH_URL` | `https://gadgetbot.vellandi.net` | Same as APP_URL |
| `BETTER_AUTH_SECRET` | `<generate>` | Generate: `openssl rand -base64 32` (32+ chars) |
| `ZITADEL_ISSUER_URL` | `https://gadgetbot-auth.vellandi.net` | Zitadel instance URL |
| `ZITADEL_CLIENT_ID` | `<from-oauth-config>` | Leave empty for initial deployment, add after Zitadel setup |

**How to Get Values:**
- `DATABASE_URL`: Coolify → Resources → gadgetbot-db → Connection Details
  - **Critical Changes Required**:
    1. Change protocol: `postgres://` → `postgresql://`
    2. Verify username and database name match actual PostgreSQL credentials
    3. Coolify creates custom names (e.g., `gadgetbot_admin`/`gadgetbot`), not default `postgres`/`postgres`
  - **How to verify actual credentials**:
    ```bash
    # SSH into server and check database container environment
    docker exec <db-container-name> printenv | grep POSTGRES
    ```
  - **Example**: `postgresql://gadgetbot_admin:password@db-container:5432/gadgetbot`
- `BETTER_AUTH_SECRET`: Run `openssl rand -base64 32` in terminal
- `ZITADEL_CLIENT_ID`: Will get from Zitadel console after OAuth configuration

**Note:** Production environment variables are managed in Coolify's UI, not in `.env` files

#### Enable Auto-Deploy

Setup GitHub webhook for auto-deployment:

1. **In Coolify** → App → **Webhooks** tab:
   - Copy the webhook URL for GitHub (or other VCS)
   - Create a secret (any string)

2. **In GitHub** → Repository → **Settings** → **Webhooks** → **Add webhook**:
   - **Payload URL**: `https://gadgetbot-coolify.vellandi.net/api/v1/deploy?uuid=...`
   - **Content type**: `application/json`
   - **Secret**: secret created in Coolify
   - **SSL verification**: Enable (we're using HTTPS)
   - **Events**: Just the push event
   - **Active**: Checked

3. Verify webhook works by pushing a commit

#### Deploy Application

1. Click **Deploy** in Coolify
2. Watch build logs - first deployment takes ~5-7 minutes
3. Monitor healthcheck status (40s start period + checks)
4. Verify deployment:
   - Container status: "healthy"
   - Visit: `https://gadgetbot.vellandi.net`
   - Homepage loads with GadgetBot branding

**Common Deployment Issues:**

**Issue: Healthcheck Failing**
- **Symptom**: Container marked "unhealthy", rolling back
- **Cause**: Dockerfile healthcheck used Node.js `http` module, but Coolify expects `curl`
- **Solution**: Install `curl` in Dockerfile and use `curl -f http://localhost:3000 || exit 1`

**Issue: Environment Variable Parsing Errors**
- **Symptom**: `ParseError: Expected number, actual "2"` for `DATABASE_POOL_MIN`
- **Cause**: Environment variables are strings, but schema expected `Number`
- **Solution**: Use `Schema.NumberFromString.pipe(Schema.int())` instead of `Schema.Number.pipe(Schema.int())`

**Issue: Database Connection Error**
- **Symptom**: `Expected startsWith("postgresql://"), actual "postgres://..."`
- **Cause**: Coolify PostgreSQL provides `postgres://` but app expects `postgresql://`
- **Solution**: Manually change protocol in `DATABASE_URL` from `postgres://` to `postgresql://`

**Issue: 404 on Domain**
- **Symptom**: App container healthy, but domain returns 404
- **Cause**: Coolify requires protocol prefix in domain field, otherwise treats it as path prefix
- **Solution**: Use `https://gadgetbot.vellandi.net` (not `gadgetbot.vellandi.net`) in domain field
- **Traefik evidence**: Without protocol, routing rule becomes `Host(\`\`) && PathPrefix(\`gadgetbot.vellandi.net\`)`

**Issue: "Not Secure" Warning in Chrome**
- **Symptom**: Valid Let's Encrypt cert but Chrome shows warning
- **Cause**: Browser cache from previous failed SSL attempts
- **Solution**: Hard refresh (`Cmd+Shift+R`) or test in incognito mode

**Issue: Wrong DATABASE_URL Username/Database Name**
- **Symptom**: `password authentication failed for user "postgres"` in logs when trying to sign in
- **Cause**: Coolify PostgreSQL creates custom username (e.g., `gadgetbot_admin`) and database name (e.g., `gadgetbot`), not the default `postgres`/`postgres`
- **How to Verify**: Check actual credentials via `docker exec <db-container> printenv | grep POSTGRES`
- **Solution**: Update `DATABASE_URL` in Coolify with correct username and database name:
  - Wrong: `postgresql://postgres:password@host:5432/postgres`
  - Correct: `postgresql://gadgetbot_admin:password@host:5432/gadgetbot`

**Issue: ZITADEL_ISSUER vs ZITADEL_ISSUER_URL**
- **Symptom**: Login page hangs when clicking "Sign in with Zitadel"
- **Cause**: Environment variable named `ZITADEL_ISSUER` instead of `ZITADEL_ISSUER_URL` (code expects `_URL` suffix)
- **How to Verify**: Check env vars in running container: `docker exec <app-container> printenv | grep ZITADEL`
- **Solution**: Rename `ZITADEL_ISSUER` to `ZITADEL_ISSUER_URL` in Coolify environment variables
- **Code Reference**: See `src/auth/server.ts` line 31 and `src/env.ts` line 17

---

### Configuring Zitadel OAuth

#### Setup Zitadel Configuration

You have two options:

**Option A: Import from Development (Recommended)**

If you've already configured Zitadel in development, import the configuration:

1. **Export from development** (if not already done):
   ```bash
   # In development environment
   export ZITADEL_SERVICE_TOKEN=<dev-service-token>
   npm run zitadel:export
   # Exports to zitadel/export.json by default
   ```

2. **Commit export file** (safe - contains no secrets):
   ```bash
   git add zitadel/export.json
   git commit -m "feat: add Zitadel production config"
   git push
   ```

3. **Create service token in production Zitadel**:
   - Login to Zitadel Console: `https://gadgetbot-auth.vellandi.net/ui/console`
   - Go to **Users → Service Users**
   - Create new service user with **Organization Owner Manager** role
   - Generate **Personal Access Token (PAT)**
   - Copy the token (you'll need it in the next step)

   > **Full instructions**: See [ZITADEL_MIGRATION.md - Prerequisites](./ZITADEL_MIGRATION.md#prerequisites)

4. **Import from local machine** (NOT from Coolify container):
   - On your **local development machine**, set environment variables:

     ```bash
     export ZITADEL_ISSUER_URL=https://gadgetbot-auth.vellandi.net
     export ZITADEL_SERVICE_TOKEN=<prod-service-token-from-step-3>
     ```

   - Run dry-run first to verify:

     ```bash
     npm run zitadel:import -- --dry-run
     ```

   - If dry-run looks good, run actual import:

     ```bash
     npm run zitadel:import
     # Imports from zitadel/export.json by default
     ```

   > **Why local machine?** The import script makes HTTP API calls to Zitadel and reads `zitadel/export.json` from your local repo. It doesn't need to run inside any container.

5. **Post-import fixes** (IMPORTANT - import doesn't preserve all settings):
   - Login to Zitadel Console: `https://gadgetbot-auth.vellandi.net/ui/console`
   - Navigate to: **Projects → GadgetBot → Applications → GadgetBot Web**
   - Fix **OIDC Authentication Method**: Change from "Basic" to **"None"**
   - Verify **Redirect URIs**: `https://gadgetbot.vellandi.net/api/auth/callback/zitadel`
   - Verify **Post Logout URIs**: `https://gadgetbot.vellandi.net`
   - Copy the **Client ID** (numbers only format, e.g., `344936354465016579`)

> **Complete documentation**: See [ZITADEL_MIGRATION.md](./ZITADEL_MIGRATION.md) for:
> - Service user setup
> - Import troubleshooting
> - Security notes (export files are safe to commit)
> - Production deployment workflow

**Option B: Manual Configuration**

If you prefer to set up Zitadel from scratch:

1. Login to Zitadel: `https://gadgetbot-auth.vellandi.net/ui/console`
2. Go to **Projects** → Create new project named "GadgetBot"
3. Click **New Application**
4. Configure:
   - **Name**: GadgetBot Production
   - **Type**: Web
   - **Authentication Method**: PKCE (select "None")
5. **Redirect URIs**:
   - Add: `https://gadgetbot.vellandi.net/api/auth/callback/zitadel`
6. **Post Logout URIs**:
   - Add: `https://gadgetbot.vellandi.net`
7. Click **Save**
8. **Copy Client ID** (numbers only format)

#### Update GadgetBot Environment Variables

1. In Coolify, go to `gadgetbot-app` resource
2. **Environment Variables** tab
3. Update (using Client ID from previous step):
   ```env
   ZITADEL_CLIENT_ID=<client-id-numbers-only>
   ```
   Example: `ZITADEL_CLIENT_ID=344936354465016579`

4. Click **Save**
5. Click **Restart** (or **Redeploy**)

> **Note:** No client secret needed - we're using PKCE authentication which is more secure for web applications.

---

### Database Migrations and Seeding

#### Run Migrations via Coolify Terminal

**IMPORTANT: This step is required!** Without migrations, authentication tables won't exist and login will hang.

1. In Coolify, go to `gadgetbot-app` resource
2. Click **Terminal** tab (opens shell in container)
3. Run:
   ```bash
   npm run db:migrate
   ```
4. Verify success (check for migration completion messages):
   ```
   🔄 Starting database migration...
   ✅ Migrations completed successfully
   ```

**What This Does:**
- Creates authentication tables: `users`, `sessions`, `accounts`, `verifications`
- Creates application tables: `gadgetbots`
- Applies any pending schema changes

**Troubleshooting:**

**Issue: "relation 'verifications' does not exist" when trying to sign in**
- **Symptom**: Login page hangs, server logs show `PostgresError: relation "verifications" does not exist`
- **Cause**: Migrations were not run
- **Solution**: Run `npm run db:migrate` in Coolify Terminal
- **Why**: Better Auth needs database tables to store OAuth state and sessions

#### Seed Database (Optional)

```bash
# In container terminal
npm run db:seed
```

This adds sample GadgetBot data for testing.

**Note**: The seed script has been updated to:
- Be standalone (no @/env imports)
- Read directly from process.env.DATABASE_URL
- Use direct Drizzle queries (no Effect service dependencies)
- Work reliably in production Coolify containers

#### Verify Database

1. Go to `gadgetbot-db` resource in Coolify
2. Click **Terminal** tab
3. Connect to PostgreSQL:
   ```bash
   psql -U gadgetbot_admin -d gadgetbot
   ```
4. Check tables:
   ```sql
   \dt
   SELECT * FROM gadgetbots LIMIT 5;
   \q
   ```

---

### Testing and Verification

#### Test Authentication Flow

1. Visit: `https://gadgetbot.vellandi.net`
2. Click "Sign In"
3. Should redirect to: `https://gadgetbot-auth.vellandi.net/ui/v2/login`
4. Login with Zitadel user
5. Should redirect back to GadgetBot with authenticated session
6. Verify user menu shows logged-in state

#### Test Application Features

- View GadgetBot list
- Create new GadgetBot (admin only)
- Update GadgetBot
- Delete GadgetBot
- Sign out
- Sign back in (verify session persistence)

#### Monitor Logs

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
4. Coolify builds new Docker image (via Dockerfile)
5. Coolify runs health checks on new container
6. Coolify switches traffic to new container
7. Old container shuts down
8. **Total time**: ~2-5 minutes
9. **User impact**: ~5-10 seconds downtime (or zero with rolling restart)

**Key Benefits:**
- **No impact on Zitadel** (authentication stays up)
- **User sessions preserved** (users stay logged in)
- **Automatic process** (no manual SSH/commands)
- **Rollback available** (redeploy previous commit)

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
- 5-10 seconds app downtime (or zero with rolling restart)
- No auth interruption
- Sessions preserved

#### Scenario 2: Update Zitadel Stack (Rare)

**Process:**
1. Plan maintenance window (off-peak hours)
2. Notify users (if applicable)
3. Update `zitadel/docker-compose.production.yml`
4. Redeploy in Coolify
5. Wait for health checks (~2 minutes)
6. Verify auth flow

**Impact:**
- 30-60 seconds auth downtime
- All users logged out (must re-authenticate)
- GadgetBot app continues running (displays login prompt)

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
- `zitadel/docker-compose.production.yml`
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
1. Verify `ZITADEL_ISSUER_URL` is correct
2. Check OAuth redirect URIs in Zitadel match production URL
3. Verify `ZITADEL_CLIENT_ID`
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

### Resource Usage

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

- Strong passwords for all services (use Coolify password generator)
- SSH key authentication only (no password auth)
- Firewall configured (Hetzner + UFW)
- SSL enabled for all domains
- `BETTER_AUTH_SECRET` is strong (32+ characters)
- `ZITADEL_MASTERKEY` is strong (32+ characters)
- Database passwords are unique and strong
- Coolify dashboard has 2FA enabled (optional but recommended)
- Regular backups configured
- Coolify kept updated (check monthly)
- Monitor logs for suspicious activity

---

## Reference Documentation

- [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md) - Deployment overview
- [DEPLOYMENT_COOLIFY.md](./DEPLOYMENT_COOLIFY.md) - Comprehensive Coolify guide
- [AUTH_SETUP.md](./AUTH_SETUP.md) - Authentication setup guide
- [ZITADEL_MIGRATION.md](./ZITADEL_MIGRATION.md) - Zitadel configuration migration
- [CLAUDE.md](../CLAUDE.md) - Project architecture
- [zitadel/docker-compose.local.yml](../zitadel/docker-compose.local.yml) - Local Zitadel config (reference for production)
