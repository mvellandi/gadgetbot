# Zitadel Deployment Notes for Coolify

## Current Status

**Date**: 2025-10-30
**Deployment Method**: Docker Compose in Coolify (FAILED - multiple attempts)
**Server**: Hetzner CX23 at 65.21.154.182
**Domain**: gadgetbot-auth.vellandi.net (DNS configured correctly)
**Coolify Dashboard**: https://gadgetbot-coolify.vellandi.net

**Conclusion**: Docker Compose deployment is not viable in Coolify due to persistent routing bugs. Switch to Docker Image approach.

---

## What We've Tried

### Attempt 1: Docker Compose with Traefik Labels (2025-10-29)

- **Issue**: Zitadel container starts successfully, but 404 on domain
- **Root Cause**: Coolify's Traefik proxy generates malformed routing rules
- **Error Found**: `error while adding rule Host(\`\`) && PathPrefix(\`gadgetbot-auth.vellandi.net\`)`
- **Problem**: Empty Host() rule - Coolify doesn't know which container to route to

### Attempt 2: Docker Compose with Health Check Fixes (2025-10-30)

- **Progress Made**:
  - Fixed health check: Changed from `wget`/`curl` to `/app/zitadel ready` (native command)
  - Fixed protocol: Changed from `http://` to `https://` in Coolify domain setting
  - Removed manual Traefik labels (let Coolify auto-generate)
  - Database initialized successfully

- **Issues Encountered**:
  1. **503 "No available server"** - Health checks failing due to missing `curl` in container
  2. **404 "Not Found"** - After fixing health check, got authentication error
  3. **Gateway timeout** - Complete routing failure after database reset
  4. **First instance not created** - `ZITADEL_FIRSTINSTANCE_*` env vars ignored by `start-from-init` command
  5. **Persistent Traefik routing bug** - Coolify generates: `Host(\`\`) && PathPrefix(\`gadgetbot-auth.vellandi.net\`)` (malformed)
- **Root Cause**: Coolify has a known bug with Docker Compose label generation for Traefik routing

- **Debugging Steps Taken**:
  1. Verified containers healthy: `docker ps` showed both `zitadel` and `zitadel-db` as healthy
  2. Tested direct connectivity: `curl http://10.0.1.8:8080/debug/healthz` returned 200 OK
  3. Checked Traefik logs: Found persistent malformed routing rule
  4. Manually dropped database schemas to force fresh initialization
  5. Ran `zitadel setup` command manually inside container
  6. Tested with different health check commands (`wget`, `curl`, `/app/zitadel ready`)

- **Final State**: Containers run and pass health checks, but Traefik cannot route traffic due to Coolify label generation bug

### Key Findings

1. **ZITADEL_MASTERKEY**: Must be exactly 32 bytes
   - Use: `openssl rand -hex 16` (generates 32-char hex string)
   - NOT: `openssl rand -base64 32` (generates 44 chars)

2. **Port Exposure**: Removing `ports: - '8080:8080'` prevents conflicts
   - Port 8080 is used by Coolify itself
   - Use `expose: - "8080"` instead

3. **Docker Compose Command Format**: Array format works better
   - Use: `command: ['start-from-init', '--masterkeyFromEnv', '--tlsMode', 'external']`
   - Not: `command: 'start-from-init --masterkeyFromEnv --tlsMode external'`

4. **Traefik Routing in Docker Compose**: Labels are being ignored or overridden
   - Added labels for traefik routing, health checks
   - Coolify generates its own Traefik config that conflicts

5. **No Port Field in UI**: When using Docker Compose, Coolify doesn't show port configuration in UI
   - This is different from single Docker Image deployment
   - Port must be configured via Traefik labels in docker-compose.yml

6. **Duplicate Volumes**: Multiple failed deployments created 3 duplicate `zitadel-data` volumes
   - Caused database startup failures
   - Need to clean these up before fresh start

7. **Health Check Command**: Zitadel container doesn't include `wget` or `curl`
   - Use native command: `test: ["CMD", "/app/zitadel", "ready"]`
   - This is the most reliable health check method

8. **First Instance Creation**: `ZITADEL_FIRSTINSTANCE_*` environment variables are NOT used by `start-from-init`
   - These only work with `zitadel setup` command
   - First admin user must be created via Zitadel Console after deployment
   - Or use Zitadel API/CLI to create initial user

9. **Database Reset Required**: When Zitadel fails mid-initialization, database must be fully reset
   - Dropping schemas is not enough - leftover indexes cause migration failures
   - Must drop: `eventstore`, `projections`, `system`, `auth`, `adminapi`, `logstore` schemas
   - Or delete volume and recreate

10. **Coolify Domain Configuration**: Protocol matters in domain field
    - `http://gadgetbot-auth.vellandi.net` - Creates HTTP-only router
    - `https://gadgetbot-auth.vellandi.net` - Creates HTTPS router with TLS
    - But this doesn't fix the malformed routing rule bug

---

## Working Docker Compose Configuration

Located at: `docker-compose.zitadel-coolify.yml`

Key components:
- Postgres 17 Alpine (matching local dev)
- Coolify network connection for Traefik routing
- Health checks for both Zitadel and PostgreSQL
- Proper Traefik labels (though may need adjustment)

---

## Environment Variables (Save These!)

```bash
# External domain
ZITADEL_EXTERNALDOMAIN=gadgetbot-auth.vellandi.net

# Database configuration (internal)
ZITADEL_DATABASE_POSTGRES_HOST=zitadel-db
ZITADEL_DATABASE_POSTGRES_DATABASE=zitadel
ZITADEL_DATABASE_POSTGRES_USER_USERNAME=zitadel_user
ZITADEL_DATABASE_POSTGRES_USER_PASSWORD=<generated>
ZITADEL_DATABASE_POSTGRES_ADMIN_USERNAME=zitadel_admin
ZITADEL_DATABASE_POSTGRES_ADMIN_PASSWORD=<generated>

# Zitadel master key (32-char hex)
ZITADEL_MASTERKEY=<32-char-hex-from-openssl-rand-hex-16>

# Admin credentials
ZITADEL_ADMIN_PASSWORD=<generated>
```

---

## Next Steps for Fresh Attempt

### Step 1: Clean Up
1. Delete existing Zitadel docker-compose service in Coolify
2. Go to "Persistent Storages"
3. Delete ALL 3 duplicate "Zitadel Db" volumes
4. Verify clean state

### Step 2: Research Coolify Docker Compose Routing
Before creating new service, understand:
- How does Coolify handle domain routing for docker-compose?
- Is there a specific label format Coolify expects?
- Check Coolify docs: https://coolify.io/docs
- Look for docker-compose examples with multiple services

### Step 3: Create Service
1. Coolify → + New → Docker Compose (Empty)
2. Use `docker-compose.zitadel-coolify.yml` as base
3. Configure environment variables
4. **Key Question**: Where/how to specify which service gets the domain?

---

## Recommended Approach: Docker Image Deployment

**⚠️ IMPORTANT**: After multiple failed attempts, Docker Compose is NOT viable in Coolify due to persistent routing bugs. Use the Docker Image approach instead.

### Why Docker Image Over Docker Compose?

**Pros:**

- ✅ Clear Port field in UI (no ambiguity)
- ✅ Coolify handles Traefik routing automatically (no manual labels needed)
- ✅ Much easier to debug (single container, clear logs)
- ✅ Proven to work in Coolify with other services (gadgetbot-db works perfectly)
- ✅ Separate resources = better isolation and management

**Cons:**

- Two separate resources to manage (Database + Application)
- Must manually configure database connection string
- (But these are actually advantages for production deployments)

### Step-by-Step Deployment

#### 1. Create PostgreSQL Database

In Coolify:

1. **+ New Resource** → **Database** → **PostgreSQL**
2. Configuration:
   - **Name**: `zitadel-db`
   - **Version**: 17 (Coolify only supports 17)
   - **Database Name**: `zitadel`
   - **Username**: `zitadel_admin`
   - **Password**: (auto-generated - save this!)
3. Click **Create**
4. Wait for database to be healthy
5. Note the internal connection details (shown in database overview)

#### 2. Deploy Zitadel as Docker Image

In Coolify:

1. **+ New Resource** → **Application** → **Docker Image**
2. Configuration:
   - **Image**: `ghcr.io/zitadel/zitadel:latest`
   - **Name**: `zitadel`
   - **Domain**: `https://gadgetbot-auth.vellandi.net`
   - **Port**: `8080`
   - **Start Command**: `start-from-init --masterkeyFromEnv --tlsMode external`
3. **Environment Variables** (see below)
4. **Health Check**: Path = `/debug/healthz`
5. Click **Deploy**

#### 3. Environment Variables for Zitadel

```bash
# Database (use internal connection from step 1)
ZITADEL_DATABASE_POSTGRES_HOST=zitadel-db  # Internal Docker hostname
ZITADEL_DATABASE_POSTGRES_PORT=5432
ZITADEL_DATABASE_POSTGRES_DATABASE=zitadel
ZITADEL_DATABASE_POSTGRES_USER_USERNAME=zitadel_user
ZITADEL_DATABASE_POSTGRES_USER_PASSWORD=<generate: openssl rand -base64 16>
ZITADEL_DATABASE_POSTGRES_USER_SSL_MODE=disable
ZITADEL_DATABASE_POSTGRES_ADMIN_USERNAME=zitadel_admin
ZITADEL_DATABASE_POSTGRES_ADMIN_PASSWORD=<from step 1>
ZITADEL_DATABASE_POSTGRES_ADMIN_SSL_MODE=disable

# External domain
ZITADEL_EXTERNALDOMAIN=gadgetbot-auth.vellandi.net
ZITADEL_EXTERNALPORT=443
ZITADEL_EXTERNALSECURE=true
ZITADEL_TLS_ENABLED=false

# Master key (32-char hex)
ZITADEL_MASTERKEY=<generate: openssl rand -hex 16>
```

#### 4. After Deployment

1. Wait for Zitadel to initialize (2-3 minutes)
2. Access: `https://gadgetbot-auth.vellandi.net`
3. Create first admin user via Zitadel Console
4. Configure OAuth applications
5. Export configuration for migration (see ZITADEL_MIGRATION.md)

---

## Debugging Commands

### Check Traefik Routing:
```bash
ssh -i ~/.ssh/hetzner_gadgetbot root@65.21.154.182
docker logs $(docker ps --filter "name=coolify-proxy" -q) 2>&1 | grep gadgetbot-auth
```

### Check Container Status:
```bash
docker ps | grep zitadel
docker logs <container-id>
```

### Test Zitadel Internally:
```bash
docker exec <zitadel-container-id> wget -O- http://localhost:8080/
```

---

## Questions to Answer

1. **How does Coolify route traffic to specific services in docker-compose stacks?**
   - Via service name in labels?
   - Via specific coolify.* labels?
   - Need to check Coolify documentation

2. **Is there a coolify network requirement?**
   - We added `coolify` network (external: true)
   - Is this the right approach?

3. **Should we set the domain at service-level or container-level?**
   - Currently set in service config (shows in UI)
   - But Traefik isn't routing to it

---

## Resources

- Coolify Docs: https://coolify.io/docs
- Coolify Health Checks: https://coolify.io/docs/knowledge-base/health-checks
- Zitadel Docker Docs: https://zitadel.com/docs/self-hosting/deploy/docker-compose
- Docker Compose File: `docker-compose.zitadel-coolify.yml`

---

## Credentials Location

All Zitadel credentials saved in password manager under:
"GadgetBot Zitadel Production"

Includes:
- Database passwords
- ZITADEL_MASTERKEY
- Admin password
- All environment variables

---

## Next Session Action Items

### Immediate Tasks

1. **Clean up failed Docker Compose deployment**:
   - Stop and delete Zitadel Docker Compose service in Coolify
   - Delete all Zitadel-related volumes in "Persistent Storages"
   - Verify clean state before proceeding

2. **Deploy using Docker Image approach** (follow steps above):
   - Create PostgreSQL 17 database
   - Deploy Zitadel as Docker Image (NOT Docker Compose)
   - Configure environment variables
   - Wait for initialization (monitor logs)

3. **Initial Configuration**:
   - Access Zitadel Console at `https://gadgetbot-auth.vellandi.net`
   - Create first admin user
   - Create "GadgetBot" project
   - Create OAuth application
   - Configure redirect URIs

4. **Export Configuration**:
   - Create service user with Organization Owner Manager role
   - Generate Personal Access Token
   - Run `npm run zitadel:export`
   - Commit `zitadel-export.json` to git

5. **Update Application**:
   - Update `.env` with new `ZITADEL_CLIENT_ID`
   - Update redirect URIs to use production domain
   - Test authentication flow

### Success Criteria

- ✅ Zitadel accessible at `https://gadgetbot-auth.vellandi.net`
- ✅ Can log into Zitadel Console
- ✅ OAuth application created and working
- ✅ Configuration exported and saved
- ✅ Application can authenticate users via Zitadel

---

**Remember**: Docker Image deployment is the proven approach. Don't waste time on Docker Compose - it has unfixable routing bugs in Coolify.
