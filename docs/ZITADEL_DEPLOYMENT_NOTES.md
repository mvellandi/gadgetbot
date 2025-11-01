# Zitadel Deployment Notes for Coolify

## Current Status

**Date**: 2025-11-01
**Deployment Method**: ✅ Minimal Docker Compose (SUCCESSFUL)
**Server**: Hetzner CX23 at 65.21.154.182
**Domain**: gadgetbot-auth.vellandi.net
**Console URL**: <https://gadgetbot-auth.vellandi.net/ui/console>
**Coolify Dashboard**: <https://gadgetbot-coolify.vellandi.net>

**Status**: ✅ Deployment complete and operational

---

## 🎉 Successful Deployment Summary (2025-11-01)

### What Worked

**Deployment Method**: Minimal Docker Compose approach (single-service)

**Key Success Factors:**

1. **Separate PostgreSQL**: PostgreSQL deployed as separate Coolify resource (not in compose file)
2. **Minimal Compose File**: Single service (Zitadel only), no complex features
3. **Network Configuration**: Both containers on `coolify` network
4. **Database Host**: Used actual container ID (`l8o8sws4o0000cgkk44ck80s`), not friendly name
5. **Login V2 Disabled**: `ZITADEL_DEFAULTINSTANCE_FEATURES_LOGINV2_REQUIRED=false`
6. **Database Reset**: Required after Login V2 config change

**Deployment Files:**

- Docker Compose: [docker-compose.zitadel-prod.yml](../docker-compose.zitadel-prod.yml)
- Environment Template: [.env.zitadel.example](../.env.zitadel.example)
- Step-by-step Guide: [ZITADEL_COOLIFY_COMPOSE.md](./ZITADEL_COOLIFY_COMPOSE.md)

---

## Documentation

- 📖 [ZITADEL_USERNAME_EMAIL_ARCHITECTURE.md](./ZITADEL_USERNAME_EMAIL_ARCHITECTURE.md) - Complete guide to Zitadel's username/email system
  - Database schema deep dive
  - Login resolution algorithm
  - How to change usernames and emails
  - Best practices for deployment

---

## Critical Findings

### 1. Login V2 Issue

**Problem**: Zitadel v4.x enables Login V2 by default, which requires a separate login application.

**Symptom**: `{"code":5, "message":"Not Found"}` error when accessing console.

**Solution**:
- Add `ZITADEL_DEFAULTINSTANCE_FEATURES_LOGINV2_REQUIRED=false` to environment variables
- **Important**: Requires clean database - setting won't take effect if database already has Login V2 configured
- Must drop and recreate database if previously initialized with Login V2 enabled

### 2. Email Environment Variable is Ignored

**Problem**: `ZITADEL_FIRSTINSTANCE_ORG_HUMAN_EMAIL` environment variable is **completely ignored** during first instance creation.

**Evidence**: Production deployment with `ZITADEL_FIRSTINSTANCE_ORG_HUMAN_EMAIL=dev@vellandi.net` created user with email `admin@gadgetbot.gadgetbot-auth.vellandi.net` instead.

**Actual behavior**: Zitadel auto-generates the email to match the username format (see below).

**Workaround**: After deployment, change email manually via:
- Zitadel Console UI (requires SMTP for verification)
- Direct PostgreSQL update:
  ```sql
  UPDATE projections.users14_humans
  SET email = 'your-desired-email@example.com',
      is_email_verified = true
  WHERE user_id = '<user_id>';
  ```

**See**: [ZITADEL_USERNAME_EMAIL_ARCHITECTURE.md](./ZITADEL_USERNAME_EMAIL_ARCHITECTURE.md) for complete details.

### 3. Username Format

**Discovery**: Zitadel auto-generates usernames in this format:

```
{username}@{org_name}.{external_domain}
```

**Example**:
- If `ZITADEL_FIRSTINSTANCE_ORG_HUMAN_USERNAME=admin`
- And `ZITADEL_FIRSTINSTANCE_ORG_NAME=GadgetBot`
- And `ZITADEL_EXTERNALDOMAIN=gadgetbot-auth.vellandi.net`
- Actual username: `admin@gadgetbot.gadgetbot-auth.vellandi.net`

**Important**: Use the full username to log in, not just "admin" or the email address.

### 3. Network Configuration

**Issue**: Containers must be on the same Docker network to communicate.

**Solution**:
- Add `networks: - coolify` to docker-compose file
- Both PostgreSQL and Zitadel must be on `coolify` network
- Use actual PostgreSQL container ID as hostname (e.g., `l8o8sws4o0000cgkk44ck80s`)
- Do NOT use friendly names like "zitadel-db" - Coolify uses container IDs internally

### 4. Database Reset Procedure

**When Required**: After changing Login V2 setting or other instance-level configuration

**Steps**:

```bash
# 1. Stop Zitadel container in Coolify
# 2. Connect to PostgreSQL
docker exec -it <postgres-container-id> psql -U zitadel_admin -d postgres

# 3. Drop and recreate database
DROP DATABASE zitadel;
CREATE DATABASE zitadel OWNER zitadel_user;
GRANT ALL PRIVILEGES ON DATABASE zitadel TO zitadel_user;

# 4. Exit and redeploy Zitadel in Coolify
```

---

## Working Configuration

### Environment Variables (Coolify UI)

```bash
# Database Connection
ZITADEL_DATABASE_POSTGRES_HOST=l8o8sws4o0000cgkk44ck80s  # Use actual container ID
ZITADEL_DATABASE_POSTGRES_PORT=5432
ZITADEL_DATABASE_POSTGRES_DATABASE=zitadel
ZITADEL_DATABASE_POSTGRES_USER_USERNAME=zitadel_user
ZITADEL_DATABASE_POSTGRES_USER_PASSWORD=<generated>
ZITADEL_DATABASE_POSTGRES_USER_SSL_MODE=disable
ZITADEL_DATABASE_POSTGRES_ADMIN_USERNAME=zitadel_admin
ZITADEL_DATABASE_POSTGRES_ADMIN_PASSWORD=<from_coolify>
ZITADEL_DATABASE_POSTGRES_ADMIN_SSL_MODE=disable

# External Domain
ZITADEL_EXTERNALDOMAIN=gadgetbot-auth.vellandi.net
ZITADEL_EXTERNALPORT=443
ZITADEL_EXTERNALSECURE=true
ZITADEL_TLS_ENABLED=false

# Master Key (32 hex chars from: openssl rand -hex 16)
ZITADEL_MASTERKEY=<32-char-hex>

# First Instance (creates admin user)
ZITADEL_FIRSTINSTANCE_ORG_NAME=GadgetBot
ZITADEL_FIRSTINSTANCE_ORG_HUMAN_USERNAME=admin
ZITADEL_FIRSTINSTANCE_ORG_HUMAN_PASSWORD=<secure_password>
ZITADEL_FIRSTINSTANCE_ORG_HUMAN_EMAIL=<your_email>

# Logging
ZITADEL_LOG_LEVEL=info

# CRITICAL: Disable Login V2
ZITADEL_DEFAULTINSTANCE_FEATURES_LOGINV2_REQUIRED=false
```

### Docker Compose File

See [docker-compose.zitadel-prod.yml](../docker-compose.zitadel-prod.yml) for complete configuration.

**Key Points**:
- Single service (Zitadel only)
- Array command format: `['start-from-init', '--masterkeyFromEnv', '--tlsMode', 'external']`
- Network: `coolify` (external: true)
- No healthcheck in compose file (Coolify manages)
- No ports published (use `expose: - "8080"`)

---

## Deployment Steps That Worked

1. ✅ Create PostgreSQL database in Coolify (separate resource)
2. ✅ Create `zitadel_user` with `CREATE USER` and grant privileges
3. ✅ Commit `docker-compose.zitadel-prod.yml` to Git
4. ✅ Create Docker Compose resource in Coolify
5. ✅ Configure ALL environment variables (especially Login V2 disable)
6. ✅ Deploy and wait for initialization (2-3 minutes)
7. ✅ Access console: `https://gadgetbot-auth.vellandi.net/ui/console`
8. ✅ Login with full username: `admin@gadgetbot.gadgetbot-auth.vellandi.net`

**Total deployment time**: ~30 minutes (including database reset)

---

## Historical Troubleshooting (Archived)

<details>
<summary>Click to expand historical troubleshooting attempts</summary>

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

## ✅ Recommended Approach: Minimal Docker Compose ✅ WORKING

**⚠️ UPDATE 2025-11-01**: Successfully deployed Zitadel using minimal Docker Compose approach!

**Status**: ✅ DEPLOYMENT SUCCESSFUL

### Complete Deployment Guide

**📖 See**: [ZITADEL_COOLIFY_COMPOSE.md](./ZITADEL_COOLIFY_COMPOSE.md) for step-by-step instructions.

**Key files:**
- `docker-compose.zitadel-prod.yml` - Single-service compose file
- `.env.zitadel.example` - Environment variable template

### Why Minimal Docker Compose Works

The original complex Docker Compose attempts failed due to features that trigger Coolify's parser bugs. The new minimal approach:

**Avoids:**
- ❌ No `depends_on` with conditions (triggers parsing errors)
- ❌ No embedded healthchecks (Coolify manages separately)
- ❌ No multi-service definitions (PostgreSQL deployed separately)
- ❌ No init containers or complex setup

**Uses:**
- ✅ Single service (Zitadel only)
- ✅ External PostgreSQL (separate Coolify resource)
- ✅ Simple array command format: `['start-from-init', '--masterkeyFromEnv', '--tlsMode', 'external']`
- ✅ Clean environment variable substitution

### Quick Start

1. Create PostgreSQL database in Coolify (name: `zitadel-db`)
2. Commit `docker-compose.zitadel-prod.yml` to Git
3. Create Docker Compose resource in Coolify
4. Configure environment variables from `.env.zitadel.example`
5. Deploy and wait for initialization
6. Create first admin user via Zitadel Console

---

## ~~Docker Image Deployment~~ (Deprecated - Doesn't Work)

**❌ This approach failed**: Coolify's Docker Image UI has no field for custom start commands. The "Custom Docker Options" field is only for build-time Docker arguments, not runtime commands.

**Error observed**: Container starts with no command, displays Zitadel help text, and restarts continuously.

**Use Minimal Docker Compose instead** (see above).

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

1. **Clean up failed deployments**:
   - Stop and delete any existing Zitadel services in Coolify
   - Delete all Zitadel-related volumes in "Persistent Storages"
   - Verify clean state before proceeding

2. **Deploy using Minimal Docker Compose** (see [ZITADEL_COOLIFY_COMPOSE.md](./ZITADEL_COOLIFY_COMPOSE.md)):
   - Create PostgreSQL 17 database (if not exists)
   - Create regular `zitadel_user` in PostgreSQL
   - Generate master key: `openssl rand -hex 16`
   - Commit `docker-compose.zitadel-prod.yml` to Git
   - Create Docker Compose resource in Coolify
   - Configure environment variables from `.env.zitadel.example`
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

## 🎉 Successful Deployment Summary (2025-11-01)

### Critical Findings

**The Login V2 Issue:**
- **Problem**: Zitadel v4.x enables Login V2 by default, which requires a separate login application
- **Symptom**: `{"code":5, "message":"Not Found"}` error when accessing console
- **Solution**: Add `ZITADEL_DEFAULTINSTANCE_FEATURES_LOGINV2_REQUIRED=false` environment variable
- **Important**: Requires clean database - setting won't take effect if database already has Login V2 configured

**Database Reset Requirement:**
- Once Zitadel initializes with Login V2 enabled, you MUST drop and recreate the database
- Simply adding the environment variable to existing deployment won't work
- Steps:
  1. Stop Zitadel container in Coolify
  2. `DROP DATABASE zitadel;`
  3. `CREATE DATABASE zitadel OWNER zitadel_user;`
  4. `GRANT ALL PRIVILEGES ON DATABASE zitadel TO zitadel_user;`
  5. Add `ZITADEL_DEFAULTINSTANCE_FEATURES_LOGINV2_REQUIRED=false` to environment variables
  6. Redeploy

**Username Format:**
- FIRSTINSTANCE variables create user with format: `{username}@{org_name}.{external_domain}`
- Example: If `ZITADEL_FIRSTINSTANCE_ORG_HUMAN_USERNAME=admin` and `ZITADEL_FIRSTINSTANCE_ORG_NAME=GadgetBot` and `ZITADEL_EXTERNALDOMAIN=gadgetbot-auth.vellandi.net`
- Actual username: `admin@gadgetbot.gadgetbot-auth.vellandi.net`
- Use this full username to log in (not just "admin")

**Network Configuration:**
- PostgreSQL container name in Coolify: Use actual container ID (e.g., `l8o8sws4o0000cgkk44ck80s`)
- NOT the friendly name "zitadel-db"
- Set `ZITADEL_DATABASE_POSTGRES_HOST=<actual_container_id>`
- Both containers must be on `coolify` network (add `networks: - coolify` to compose file)

### Final Working Configuration

**Required Environment Variables:**
```bash
# Database connection (use actual container ID)
ZITADEL_DATABASE_POSTGRES_HOST=l8o8sws4o0000cgkk44ck80s
ZITADEL_DATABASE_POSTGRES_PORT=5432
ZITADEL_DATABASE_POSTGRES_DATABASE=zitadel
ZITADEL_DATABASE_POSTGRES_USER_USERNAME=zitadel_user
ZITADEL_DATABASE_POSTGRES_USER_PASSWORD=<generated>
ZITADEL_DATABASE_POSTGRES_USER_SSL_MODE=disable
ZITADEL_DATABASE_POSTGRES_ADMIN_USERNAME=zitadel_admin
ZITADEL_DATABASE_POSTGRES_ADMIN_PASSWORD=<from_coolify>
ZITADEL_DATABASE_POSTGRES_ADMIN_SSL_MODE=disable

# External domain
ZITADEL_EXTERNALDOMAIN=gadgetbot-auth.vellandi.net
ZITADEL_EXTERNALPORT=443
ZITADEL_EXTERNALSECURE=true
ZITADEL_TLS_ENABLED=false

# Master key (32 hex chars)
ZITADEL_MASTERKEY=<openssl_rand_hex_16>

# First instance (creates admin user)
ZITADEL_FIRSTINSTANCE_ORG_NAME=GadgetBot
ZITADEL_FIRSTINSTANCE_ORG_HUMAN_USERNAME=admin
ZITADEL_FIRSTINSTANCE_ORG_HUMAN_PASSWORD=<secure_password>
ZITADEL_FIRSTINSTANCE_ORG_HUMAN_EMAIL=<your_email>

# Logging
ZITADEL_LOG_LEVEL=info

# CRITICAL: Disable Login V2
ZITADEL_DEFAULTINSTANCE_FEATURES_LOGINV2_REQUIRED=false
```

**Docker Compose File:**
- Located: `docker-compose.zitadel-prod.yml`
- Key points:
  - Single service (zitadel only)
  - Array command format: `['start-from-init', '--masterkeyFromEnv', '--tlsMode', 'external']`
  - Network: `coolify` (external: true)
  - No healthcheck in compose file (Coolify manages)
  - No ports published (use `expose: - "8080"`)

### Deployment Steps That Worked

1. ✅ Create PostgreSQL database in Coolify (separate resource)
2. ✅ Create `zitadel_user` with `CREATE USER zitadel_user WITH PASSWORD '...';`
3. ✅ Grant privileges: `GRANT ALL PRIVILEGES ON DATABASE zitadel TO zitadel_user;`
4. ✅ Commit `docker-compose.zitadel-prod.yml` to Git (with Login V2 disabled)
5. ✅ Create Docker Compose resource in Coolify
6. ✅ Configure ALL environment variables (especially `ZITADEL_DEFAULTINSTANCE_FEATURES_LOGINV2_REQUIRED=false`)
7. ✅ Deploy and wait for initialization (2-3 minutes)
8. ✅ Access console: `https://gadgetbot-auth.vellandi.net/ui/console`
9. ✅ Login with full username: `admin@gadgetbot.gadgetbot-auth.vellandi.net`

**Total deployment time**: ~30 minutes (including database reset)

---

</details>

**Remember**: Use the **Minimal Docker Compose** approach documented in [ZITADEL_COOLIFY_COMPOSE.md](./ZITADEL_COOLIFY_COMPOSE.md).
