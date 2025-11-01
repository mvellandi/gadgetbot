# Zitadel Deployment on Coolify - Docker Compose Method

## Overview

This guide uses a **minimal Docker Compose file** to deploy Zitadel on Coolify. This approach works around Coolify's Docker Image limitations (no custom start command field) and avoids complex Docker Compose features that trigger parsing bugs.

## Prerequisites

1. ✅ PostgreSQL 17 database already deployed in Coolify (named `zitadel-db`)
2. ✅ DNS configured: `gadgetbot-auth.vellandi.net` → Coolify server IP
3. ✅ Git repository with `docker-compose.zitadel-prod.yml` committed

## Step-by-Step Deployment

### 1. Prepare PostgreSQL Database

Ensure you have a PostgreSQL database in Coolify with:
- **Name**: `zitadel-db`
- **Database**: `zitadel`
- **Admin Username**: `zitadel_admin`
- **Admin Password**: (save this - you'll need it)

**Create the regular user** (Zitadel needs both admin and regular user):

```bash
# SSH into Coolify server
ssh hetzner-gadgetbot

# Access PostgreSQL container
docker exec -it <postgres-container-id> psql -U zitadel_admin -d zitadel

# Create regular user
CREATE USER zitadel_user WITH PASSWORD 'your-generated-password';
GRANT ALL PRIVILEGES ON DATABASE zitadel TO zitadel_user;
```

Or generate password first:
```bash
openssl rand -base64 16
```

### 2. Generate Required Secrets

Generate the master key (must be exactly 32 characters):
```bash
openssl rand -hex 16
```

Save this value - you'll need it for the `ZITADEL_MASTERKEY` variable.

### 3. Commit Docker Compose File to Git

The file `docker-compose.zitadel-prod.yml` must be in your Git repository:

```bash
git add docker-compose.zitadel-prod.yml
git commit -m "Add minimal Zitadel compose file for Coolify"
git push
```

### 4. Create Zitadel Resource in Coolify

1. Go to Coolify Dashboard
2. Click **+ New Resource** → **Application**
3. Select **Docker Compose** as the build pack
4. Configure:
   - **Name**: `zitadel`
   - **Repository**: Your Git repository URL
   - **Branch**: `main` (or your branch)
   - **Docker Compose File Location**: `docker-compose.zitadel-prod.yml`
   - **Domain**: `https://gadgetbot-auth.vellandi.net`

### 5. Configure Environment Variables

In Coolify's **Environment Variables** section, add all variables from `.env.zitadel.example`:

**Database Variables:**
```env
ZITADEL_DATABASE_POSTGRES_HOST=zitadel-db
ZITADEL_DATABASE_POSTGRES_PORT=5432
ZITADEL_DATABASE_POSTGRES_DATABASE=zitadel
ZITADEL_DATABASE_POSTGRES_USER_USERNAME=zitadel_user
ZITADEL_DATABASE_POSTGRES_USER_PASSWORD=<your-generated-user-password>
ZITADEL_DATABASE_POSTGRES_USER_SSL_MODE=disable
ZITADEL_DATABASE_POSTGRES_ADMIN_USERNAME=zitadel_admin
ZITADEL_DATABASE_POSTGRES_ADMIN_PASSWORD=<from-coolify-postgres-resource>
ZITADEL_DATABASE_POSTGRES_ADMIN_SSL_MODE=disable
```

**Domain Variables:**
```env
ZITADEL_EXTERNALDOMAIN=gadgetbot-auth.vellandi.net
ZITADEL_EXTERNALPORT=443
ZITADEL_EXTERNALSECURE=true
ZITADEL_TLS_ENABLED=false
```

**Master Key:**
```env
ZITADEL_MASTERKEY=<your-32-char-hex-from-openssl>
```

### 6. Configure Health Check

In Coolify's **Healthcheck** section:
- **Health Check Path**: `/debug/healthz`
- **Health Check Interval**: `30s`
- **Health Check Timeout**: `5s`
- **Health Check Retries**: `3`

### 7. Deploy

1. Click **Deploy**
2. Monitor logs in the **Logs** tab
3. Wait 2-3 minutes for Zitadel to initialize the database

### 8. Verify Deployment

Once healthy, access:
```
https://gadgetbot-auth.vellandi.net
```

You should see the Zitadel login page.

### 9. Create First Admin User

Since `start-from-init` doesn't create admin users automatically:

1. Access Zitadel Console: `https://gadgetbot-auth.vellandi.net`
2. Follow the setup wizard to create your first admin account
3. Create OAuth application for GadgetBot

## Why This Approach Works

### Minimal Docker Compose
- ✅ **Simple YAML**: No complex features (no `depends_on`, no healthchecks)
- ✅ **Array command format**: `['start-from-init', '--masterkeyFromEnv', '--tlsMode', 'external']`
- ✅ **External database**: Avoids multi-service complexity
- ✅ **Environment variable substitution**: Coolify handles this natively

### Avoids Coolify Bugs
- ❌ **No `depends_on` conditions**: Triggers Coolify parsing errors
- ❌ **No embedded healthchecks**: Coolify manages this separately
- ❌ **No init containers**: Simplifies deployment flow
- ❌ **No complex networking**: Uses Coolify's default network

## Troubleshooting

### Container Keeps Restarting
```bash
# Check logs
ssh hetzner-gadgetbot
docker logs <zitadel-container-id>

# Common issues:
# 1. Wrong ZITADEL_MASTERKEY length (must be 32 chars)
# 2. Can't connect to database (check POSTGRES_HOST)
# 3. Wrong database credentials
```

### 404 Not Found
```bash
# Check Traefik routing
docker logs $(docker ps --filter "name=coolify-proxy" -q) 2>&1 | grep gadgetbot-auth

# Should see proper routing rules without malformed Host() entries
```

### Database Connection Failed
```bash
# Test database connectivity from Zitadel container
docker exec <zitadel-container-id> nc -zv zitadel-db 5432

# If this fails, check:
# 1. PostgreSQL container is running
# 2. Both containers are on same Docker network
# 3. Database name/credentials are correct
```

### "First Instance Not Created"
This is expected! The `start-from-init` command only initializes the database schema. You must create the first admin user through the Zitadel Console UI after deployment.

## Key Differences from Complex Docker Compose

**Old approach (failed):**
- Multi-service file with database included
- Complex depends_on with conditions
- Embedded healthchecks
- Manual Traefik labels
- Multiple volumes

**New approach (working):**
- Single service (Zitadel only)
- External database (separate Coolify resource)
- No depends_on
- No healthchecks in compose file (Coolify manages)
- Minimal configuration

## Next Steps

After successful deployment:

1. ✅ Create first admin user via Zitadel Console
2. ✅ Create "GadgetBot" project
3. ✅ Create OAuth application
4. ✅ Configure redirect URIs
5. ✅ Export configuration: `npm run zitadel:export`
6. ✅ Update application `.env` with new client ID
7. ✅ Test authentication flow

## Reference Files

- **Docker Compose**: `docker-compose.zitadel-prod.yml`
- **Environment Template**: `.env.zitadel.example`
- **Migration Guide**: `docs/ZITADEL_MIGRATION.md`
- **Deployment Summary**: `docs/DEPLOYMENT_SUMMARY.md`
