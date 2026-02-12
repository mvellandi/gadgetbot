# GadgetBot Deployment Progress

## Deployment Overview

**Server**: Hetzner CX23 VPS
**IP Address**: 65.21.154.182
**Domains**:
- Main app: `gadgetbot.vellandi.net`
- Authentication: `auth.vellandi.net`
- Coolify dashboard: `gadgetbot-coolify.vellandi.net`

---

## ✅ Completed Steps

### 1. Server Setup
- [x] Created Hetzner CX23 server (4GB RAM, 80GB disk, Ubuntu 24.04)
- [x] Generated SSH key: `~/.ssh/hetzner_gadgetbot`
- [x] Configured SSH access
- [x] Updated system packages: `apt update && apt upgrade -y`

### 2. Coolify Installation
- [x] Installed Coolify: `curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash`
- [x] Created admin account in Coolify dashboard
- [x] Backed up environment file: `/data/coolify/source/.env`

### 3. Firewall Configuration
- [x] Configured Hetzner firewall rules:
  - Port 22 (SSH)
  - Port 80 (HTTP)
  - Port 443 (HTTPS)
  - Port 6001 (Coolify WebSocket)
  - Port 6002 (Coolify WebSocket)
  - Port 8000 (Coolify HTTP)
- [x] Fixed Coolify real-time service connection issue

### 4. DNS Configuration
- [x] Created DNS A records at `vellandi.net`:
  - `gadgetbot` → 65.21.154.182
  - `gadgetbot-auth` → 65.21.154.182
  - `gadgetbot-coolify` → 65.21.154.182
- [x] Verified DNS propagation with ping tests

### 5. Coolify Configuration
- [x] Set instance domain: `gadgetbot-coolify.vellandi.net`
- [x] Enabled automatic SSL certificates
- [x] Accessed Coolify via HTTPS

### 6. Coolify Project Setup
- [x] Selected "localhost" server (Coolify managing itself)
- [x] Created new project for GadgetBot resources

### 7. PostgreSQL Database (GadgetBot)
- [x] Created database resource in Coolify: `gadgetbot-db`
- [x] Used PostgreSQL version 17
- [x] Database name: `gadgetbot`
- [x] Generated secure password
- [x] Database running and healthy
- [x] Saved connection string for GadgetBot app deployment

### 8. PostgreSQL Database (Zitadel)
- [x] Created database resource in Coolify: `zitadel-db`
- [x] Used PostgreSQL version 17
- [x] Database name: `zitadel`
- [x] Created `zitadel_user` with password
- [x] Granted privileges to zitadel_user
- [x] Database running and healthy

### 9. Zitadel Service (✅ COMPLETE)
- [x] Deployed via Docker Compose (minimal approach)
- [x] Configured environment variables (including LOGINV2_REQUIRED=false)
- [x] Domain: `auth.vellandi.net`
- [x] Successfully initialized with first admin user
- [x] Accessible at https://auth.vellandi.net/ui/console
- [x] Admin login: `admin@gadgetbot.auth.vellandi.net`

**Key Learnings:**
- ✅ Used `docker-compose.zitadel-prod.yml` (minimal single-service approach)
- ✅ Disabled Login V2 with `ZITADEL_DEFAULTINSTANCE_FEATURES_LOGINV2_REQUIRED=false`
- ✅ Required database reset to apply Login V2 setting
- ✅ Username format: `{username}@{org_name}.{external_domain}`
- ✅ Network: Both containers on `coolify` network
- ✅ Database host: Used container ID, not friendly name

---

## 🚧 Next Steps

### 10. Zitadel Configuration Migration
Using the existing `zitadel/export.json` from local development to create projects and OAuth apps in production.

**Prerequisites:**
- [ ] Create service user in Zitadel Console (username: `zitadel-migration`)
- [ ] Assign "Organization Owner Manager" role to service user
- [ ] Generate Personal Access Token (PAT)
- [ ] Save token securely

**Steps:**
1. Review `zitadel/export.json` - contains projects and OAuth app config from local dev
2. Update redirect URIs in export file to production domain:
   - From: `http://localhost:3000/api/auth/callback/zitadel`
   - To: `https://gadgetbot.vellandi.net/api/auth/callback/zitadel`
3. Set environment variable: `export ZITADEL_SERVICE_TOKEN=<your-pat>`
4. Run import script: `npm run zitadel:import`
5. Get new client ID from Zitadel Console
6. Update GadgetBot environment variables with new credentials

**Reference:** See [ZITADEL_MIGRATION.md](./ZITADEL_MIGRATION.md) for detailed instructions

### 11. GadgetBot Application
1. In Coolify: **New Resource → Application → GitHub**
2. Connect GitHub account/organization
3. Select repository: `tanstack/gadgetbot` (or your fork)
4. Configuration:
   - Name: `gadgetbot-app`
   - Domain: `gadgetbot.vellandi.net`
   - Branch: `main`
   - Build Pack: `nixpacks`
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Start Command: `npm run serve`
   - Port: `3000`
5. Environment variables (see below)
6. Deploy!

#### GadgetBot Environment Variables

```bash
# Node environment
NODE_ENV=production

# Server configuration
SERVER_URL=https://gadgetbot.vellandi.net
PORT=3000

# Database (from gadgetbot-db resource)
DATABASE_URL=postgresql://gadgetbot:<password>@<internal-host>:5432/gadgetbot
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Better Auth
BETTER_AUTH_SECRET=<generate-32-char-secret>
BETTER_AUTH_URL=https://gadgetbot.vellandi.net

# Zitadel OAuth (get these after importing Zitadel config)
ZITADEL_ISSUER=https://auth.vellandi.net
ZITADEL_CLIENT_ID=<from-zitadel-oauth-app>
ZITADEL_CLIENT_SECRET=<from-zitadel-oauth-app>

# Optional: Vite-specific (if needed)
VITE_APP_TITLE=GadgetBot
VITE_SERVER_URL=https://gadgetbot.vellandi.net
```

### 10. Database Migrations
After GadgetBot app is deployed:

```bash
# SSH into server
ssh -i ~/.ssh/hetzner_gadgetbot root@65.21.154.182

# Find GadgetBot container ID
docker ps | grep gadgetbot

# Enter container
docker exec -it <container-id> sh

# Run migrations
npm run db:migrate
npm run db:seed

# Exit container
exit
```

### 11. Zitadel Configuration Import
1. On your **local machine**, with local Zitadel running:
   ```bash
   npm run zitadel:export
   ```
2. Review/edit `zitadel-config.json`:
   - Update redirect URIs to production domain
   - Update CORS origins
3. Import to production:
   ```bash
   # Set production Zitadel URL
   export ZITADEL_URL=https://auth.vellandi.net

   # Import configuration
   npm run zitadel:import
   ```
4. Get OAuth credentials from Zitadel UI
5. Update GadgetBot environment variables in Coolify

### 12. Final Testing
- [ ] Visit `https://gadgetbot.vellandi.net`
- [ ] Test authentication flow
- [ ] Verify database operations
- [ ] Check logs in Coolify for errors

---

## Important Information

### SSH Access
```bash
ssh -i ~/.ssh/hetzner_gadgetbot root@65.21.154.182
```

### Coolify Access
- URL: https://gadgetbot-coolify.vellandi.net
- Credentials: (your admin email/password)

### Backup Locations
- Coolify env file: `/data/coolify/source/.env` (on server)
- Zitadel config: `zitadel-config.json` (in project root, .gitignored)

### Useful Commands

```bash
# View all containers
docker ps

# View Coolify logs
cd /data/coolify/source && docker compose logs -f

# View specific service logs
docker logs <container-id> -f

# Restart Coolify
cd /data/coolify/source && docker compose restart

# Database connection (once deployed)
docker exec -it <postgres-container> psql -U gadgetbot -d gadgetbot
```

---

## Troubleshooting

### Coolify Issues
- Check real-time service: Ensure ports 6001, 6002 are open in Hetzner firewall
- Restart Coolify: `cd /data/coolify/source && docker compose restart`
- View logs: `cd /data/coolify/source && docker compose logs -f`

### DNS Issues
- Verify propagation: `dig gadgetbot.vellandi.net` or `nslookup gadgetbot.vellandi.net`
- Wait 5-15 minutes after creating records
- Check TTL settings (lower = faster updates)

### SSL Certificate Issues
- Coolify uses Let's Encrypt automatically
- Ensure DNS is pointing correctly first
- Check Coolify logs for certificate errors

### Deployment Issues
- Check application logs in Coolify dashboard
- Verify environment variables are set correctly
- Ensure database connection string is correct
- Check port configuration (app must listen on configured port)

---

## Reference Documentation

- [DEPLOYMENT_COOLIFY.md](./DEPLOYMENT_COOLIFY.md) - Full Coolify deployment guide
- [AUTH_SETUP.md](./AUTH_SETUP.md) - Authentication setup patterns
- [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md) - Deployment overview
- [CLAUDE.md](../CLAUDE.md) - Project architecture and patterns

---

**Last Updated**: 2025-10-30
**Status**: Step 7 complete (PostgreSQL deployed). Step 8 BLOCKED (Zitadel deployment via Docker Compose has unfixable routing bugs)

**Critical Update**: Docker Compose deployment in Coolify is NOT viable for Zitadel. After 4.5 hours of troubleshooting, we discovered Coolify has a persistent bug generating malformed Traefik routing rules for Docker Compose services.

## Session Summary (2025-10-30)

### What We Tried

1. Fixed health checks (changed from `wget`/`curl` to `/app/zitadel ready`)
2. Fixed domain protocol (`http://` → `https://`)
3. Removed conflicting Traefik labels
4. Manually dropped/recreated database schemas
5. Ran `zitadel setup` command inside container
6. Multiple deployment iterations with different configurations

### Root Cause Identified

Coolify generates malformed Traefik routing rules for Docker Compose:

```text
error while adding rule Host(``) && PathPrefix(`auth.vellandi.net`)
```

Empty `Host()` means Traefik cannot route traffic, even when containers are healthy.

### Conclusion

**Switch to Docker Image deployment approach** as documented in `ZITADEL_DEPLOYMENT_NOTES.md`. This will work on first try.

**Time Investment**: ~4.5 hours on Docker Compose (abandoned)

**Note**: See `ZITADEL_DEPLOYMENT_NOTES.md` for complete findings and Docker Image deployment guide.
