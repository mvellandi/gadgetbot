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

**Part A: Create the Service User**
1. Go to **Users** → **Service Users**
2. Click **New**
3. Fill in the form:
   - **Username**: `zitadel-migration`
   - **Name**: `zitadel-migration`
   - **Access Token Type**: Select **JWT** (recommended)
     - JWT tokens are self-contained and can be validated locally
     - Bearer tokens require server-side introspection for every validation
4. Click **Create**

**Part B: Assign Organization Manager Role**
1. Click on your organization name in the top-left dropdown (e.g., "GadgetBot")
2. This opens the organization detail page
3. Find and click the **"Add a Manager"** plus icon/button next to the "actions" button
4. Search for and select **`zitadel-migration`** (your service user)
5. Assign the role: **"ORG OWNER"** or **"Organization Owner Manager"**
6. Click **Save**

**Part C: Generate Personal Access Token**
1. Go back to **Users** → **Service Users**
2. Click on **`zitadel-migration`**
3. Go to **Personal Access Tokens** tab
4. Click **New**
5. Copy the token (you won't see it again!)

**Part D: Set Token in Your Shell**

Set the token as an environment variable:

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

**What to look for:** You should see JSON output with these key fields:

- `"issuer": "http://localhost:8080"` - Confirms Zitadel is running
- `"authorization_endpoint"`, `"token_endpoint"` - OAuth endpoints are configured
- `"scopes_supported": ["openid", "profile", "email", ...]` - OIDC scopes available

If you see a connection error or 404, Zitadel isn't fully initialized yet. Wait 30 seconds and try again.

---

## Next Steps

Once prerequisites are complete, you can:

1. **Export Configuration** (see below) - Capture your current Zitadel setup to a JSON file
2. **Import Configuration** (see below) - Apply that configuration to another Zitadel instance

---

## What Gets Migrated?

### ✅ Configuration (Migrated)

- **Projects** - Organizational structure (e.g., "GadgetBot")
- **Roles** - Permission definitions (e.g., "admin", "user")
- **Applications** - OAuth clients with redirect URIs
- **Grants** - Authorization policies

### ❌ User Data (NOT Migrated)

- **Users** - User accounts and profiles
- **Passwords/Credentials** - Authentication secrets
- **User Role Assignments** - Which users have which roles
- **Sessions** - Active user sessions
- **Audit Logs** - Historical activity

### Post-Migration Setup Required

After importing to production:

1. **Create admin user** in Zitadel Console
2. **Assign admin role** to that user
3. **Users sign up fresh** (or migrate separately if needed)

> **Note:** This migration focuses on replicating your auth *structure*, not user data. Production typically starts with fresh user registrations.

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

**Important**: See [ZITADEL_DEPLOYMENT_NOTES.md](./ZITADEL_DEPLOYMENT_NOTES.md) for detailed Coolify deployment instructions. Use Docker Image deployment, NOT Docker Compose.

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
