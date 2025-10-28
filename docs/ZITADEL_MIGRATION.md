# Zitadel Configuration Migration Guide

Export/import your Zitadel configuration between environments (dev → staging → production).

## Quick Start

**Export from development:**
```bash
export ZITADEL_SERVICE_TOKEN=<your-token>
npm run zitadel:export
```

**Import to production:**
```bash
export ZITADEL_SERVICE_TOKEN=<your-token>
npm run zitadel:import
```

---

## Prerequisites

### 1. Create Service User in Zitadel

You need a service user with **Organization Owner Manager** role:

**In Zitadel Console:**
1. Go to **Users** → **Service Users**
2. Click **New**
3. Name: `zitadel-migration`
4. Click **Create**
5. Go to **Authorizations** tab
6. Add role: **Organization Owner Manager**
7. Go to **Personal Access Tokens** tab
8. Click **New**
9. Copy the token (you won't see it again!)

**Set token in your shell:**
```bash
export ZITADEL_SERVICE_TOKEN=<your-pat-token>
```

### 2. Verify Zitadel is Running

```bash
# Development
npm run zitadel:up

# Check logs
npm run zitadel:logs

# Verify API is accessible
curl http://localhost:8080/.well-known/openid-configuration
```

---

## Export Configuration

### Basic Export

```bash
npm run zitadel:export
```

This creates `zitadel-export.json` with:
- Projects
- Applications (OAuth clients)
- Roles
- Grants (authorization)

### Custom Output Path

```bash
npm run zitadel:export -- --output=./backups/zitadel-dev-2025-01-15.json
```

### What Gets Exported?

```json
{
  "exportedAt": "2025-01-15T10:30:00.000Z",
  "projects": [
    {
      "id": "123456789",
      "name": "GadgetBot",
      "state": "PROJECT_STATE_ACTIVE"
    }
  ],
  "applications": [
    {
      "id": "987654321",
      "name": "gadgetbot",
      "projectId": "123456789",
      "oidcConfig": {
        "redirectUris": ["http://localhost:3000/api/auth/callback/zitadel"],
        "responseTypes": ["OIDC_RESPONSE_TYPE_CODE"],
        "grantTypes": ["OIDC_GRANT_TYPE_AUTHORIZATION_CODE"],
        "authMethodType": "OIDC_AUTH_METHOD_TYPE_NONE"
      }
    }
  ],
  "roles": [
    {
      "key": "admin",
      "displayName": "Administrator",
      "projectId": "123456789"
    }
  ],
  "grants": []
}
```

---

## Import Configuration

### Test Import (Dry Run)

Always test first to see what would be created:

```bash
npm run zitadel:import -- --dry-run
```

### Actual Import

```bash
npm run zitadel:import
```

### Custom Input Path

```bash
npm run zitadel:import -- --input=./backups/zitadel-dev-2025-01-15.json
```

### What Gets Created?

1. **Projects** - Main organizational units
2. **Roles** - Permission definitions within projects
3. **Applications** - OAuth clients with redirect URIs
4. **Grants** - User/org authorizations

---

## Production Deployment Workflow

### Step 1: Export from Development

```bash
# In development environment
export ZITADEL_SERVICE_TOKEN=<dev-token>
export ZITADEL_ISSUER_URL=http://localhost:8080

npm run zitadel:export -- --output=zitadel-production.json

# Commit to git (safe, no secrets)
git add zitadel-production.json
git commit -m "feat: export Zitadel config for production"
```

### Step 2: Deploy to Production

```bash
# SSH to production server
ssh user@your-server.com

# Pull latest code
cd /app/gadgetbot
git pull

# Set production token
export ZITADEL_SERVICE_TOKEN=<prod-token>
export ZITADEL_ISSUER_URL=https://auth.yourdomain.com

# Dry run first
npm run zitadel:import -- --input=zitadel-production.json --dry-run

# Actually import
npm run zitadel:import -- --input=zitadel-production.json
```

### Step 3: Update Environment Variables

After import, you'll get new IDs. Update `.env`:

```bash
# Get new client ID from Zitadel Console
# Go to: Projects → GadgetBot → Applications → gadgetbot

ZITADEL_ISSUER_URL=https://auth.yourdomain.com
ZITADEL_CLIENT_ID=<new-client-id>@gadgetbot
```

### Step 4: Update Redirect URIs

In Zitadel Console:
1. Go to **Projects** → **GadgetBot** → **Applications** → **gadgetbot**
2. Click **URLs** tab
3. Update **Redirect URIs**:
   - Remove: `http://localhost:3000/api/auth/callback/zitadel`
   - Add: `https://yourdomain.com/api/auth/callback/zitadel`
4. Save

### Step 5: Restart App

```bash
# If using Docker
docker compose restart app

# If using systemd
sudo systemctl restart gadgetbot
```

---

## Coolify Deployment

If you're using Coolify (see [DEPLOYMENT_COOLIFY.md](./DEPLOYMENT_COOLIFY.md)):

### 1. Add Service Token to Coolify

In Coolify dashboard:
1. Go to your app → **Environment Variables**
2. Add:
   ```
   ZITADEL_SERVICE_TOKEN=<your-production-token>
   ```
3. Click **Save**

### 2. Run Import via SSH

```bash
# SSH to Coolify server
ssh root@your-coolify-server.com

# Find your container
docker ps | grep gadgetbot

# Run import inside container
docker exec -it <container-id> npm run zitadel:import -- --input=zitadel-production.json
```

### 3. Update App Environment

After import, update these in Coolify:
```
ZITADEL_ISSUER_URL=https://auth.yourdomain.com
ZITADEL_CLIENT_ID=<new-client-id>@gadgetbot
```

---

## Troubleshooting

### "ZITADEL_SERVICE_TOKEN not set"

**Solution:**
```bash
# Create service user in Zitadel Console
# Generate PAT token
export ZITADEL_SERVICE_TOKEN=<your-token>
```

### "403 Forbidden" or "401 Unauthorized"

**Cause:** Service user lacks permissions

**Solution:**
1. Go to Zitadel Console → Users → Service Users
2. Select your service user
3. Go to **Authorizations** tab
4. Ensure **Organization Owner Manager** role is assigned

### Import Creates Duplicates

**Prevention:**
- Always import to fresh Zitadel instance
- Or manually delete existing projects first

**Fix:**
```bash
# Reset Zitadel (development only!)
npm run zitadel:reset
npm run zitadel:import
```

### Different Project IDs After Import

**Expected behavior:** Zitadel generates new IDs

**Action Required:**
1. Get new client ID from Console
2. Update `.env` with `ZITADEL_CLIENT_ID=<new-id>@gadgetbot`

### Export Fails with "Connection Refused"

**Solution:**
```bash
# Check Zitadel is running
npm run zitadel:logs

# Verify correct URL
echo $ZITADEL_ISSUER_URL

# Test connectivity
curl $ZITADEL_ISSUER_URL/.well-known/openid-configuration
```

---

## Security Notes

### Safe to Commit

✅ **zitadel-export.json** - Contains configuration, not secrets
- Project names, roles, redirect URIs
- No passwords, tokens, or user data

### Never Commit

❌ **Service tokens** (ZITADEL_SERVICE_TOKEN)
❌ **Client secrets** (if not using PKCE)
❌ **User data** or **access tokens**

### Production Recommendations

1. **Rotate service tokens** after migration
2. **Use environment-specific tokens** (don't share dev/prod)
3. **Limit service user permissions** after import
4. **Delete export files** from production server after use

---

## Advanced Usage

### Automated CI/CD

```yaml
# .github/workflows/deploy-zitadel.yml
name: Deploy Zitadel Config

on:
  push:
    paths:
      - 'zitadel-production.json'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run zitadel:import
        env:
          ZITADEL_SERVICE_TOKEN: ${{ secrets.ZITADEL_SERVICE_TOKEN }}
          ZITADEL_ISSUER_URL: https://auth.yourdomain.com
```

### Multiple Environments

```bash
# Export from dev
npm run zitadel:export -- --output=zitadel-dev.json

# Export from staging
ZITADEL_ISSUER_URL=https://auth-staging.com npm run zitadel:export -- --output=zitadel-staging.json

# Import to production
ZITADEL_ISSUER_URL=https://auth.com npm run zitadel:import -- --input=zitadel-staging.json
```

### Backup Before Import

```bash
# Always backup production before importing
npm run zitadel:export -- --output=backups/prod-backup-$(date +%Y%m%d).json

# Then import
npm run zitadel:import
```

---

## Related Documentation

- [Authentication Setup](./AUTH_SETUP.md)
- [Coolify Deployment](./DEPLOYMENT_COOLIFY.md)
- [Zitadel Official Docs](https://zitadel.com/docs)
