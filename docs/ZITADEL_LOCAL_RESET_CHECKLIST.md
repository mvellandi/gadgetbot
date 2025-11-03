# Zitadel Local Reset & Import Testing Checklist

Quick reference for testing the complete export/import cycle locally. This validates our migration process and documentation.

**Purpose**: Ensure we can reliably export/import Zitadel configuration for production deployment.

**Related Documentation**:
- [ZITADEL_MIGRATION.md](./ZITADEL_MIGRATION.md) - Full export/import guide
- [ZITADEL_3CONTAINER_NOTES.md](../ZITADEL_3CONTAINER_NOTES.md) - Critical post-import fixes
- [AUTH_SETUP.md](./AUTH_SETUP.md) - Initial authentication setup

---

## Pre-Flight Check

- [ ] Zitadel 3-container setup running
- [ ] GadgetBot app authenticating successfully
- [ ] Working Client ID saved (for comparison after reset)

```bash
# Verify containers
docker ps | grep gadgetbot-zitadel
# Should show: zitadel, zitadel-login, zitadel-db (all healthy)

# Save current Client ID
grep ZITADEL_CLIENT_ID .env
```

---

## Phase 1: Export Current Configuration

### 1.1 Create Service User & Token

**In Zitadel Console** (http://localhost:8080/ui/console):

1. Navigate to **Users → Service Users**
2. Click **+ New**
3. Create user:
   - Username: `export-service`
   - Name: `Export Service User`
4. **Assign role**: In organization page → **Add Manager** → Select user → Assign **Org Owner Manager**
5. **Generate PAT**: User details → **Personal Access Tokens** → **+ New** → Copy token

**Reference**: [ZITADEL_MIGRATION.md - Prerequisites](./ZITADEL_MIGRATION.md#1-create-service-user-in-zitadel)

### 1.2 Export Configuration

```bash
# Set token (DON'T add to .env - it's temporary!)
export ZITADEL_SERVICE_TOKEN=<paste-your-token>

# Verify token is set
echo $ZITADEL_SERVICE_TOKEN

# Run export
npm run zitadel:export

# Verify export file
cat zitadel-export.json | jq '.projects | length'
cat zitadel-export.json | jq '.applications | length'
```

**Expected**: File created with projects, applications, and roles.

- [ ] Export completed successfully
- [ ] Export file contains GadgetBot project
- [ ] Export file contains applications

---

## Phase 2: Document Current State

```bash
# Backup .env
cp .env .env.backup

# Save current Client ID
grep ZITADEL_CLIENT_ID .env > client-id-backup.txt
```

- [ ] `.env` backed up
- [ ] Current Client ID documented

---

## Phase 3: Reset Zitadel

### 3.1 Destroy Everything

```bash
# Stop containers and delete ALL data
docker compose -f docker-compose.zitadel-test.yml down -v

# Verify containers gone
docker ps -a | grep zitadel
# Should return nothing
```

- [ ] Containers stopped and volumes removed

### 3.2 Start Fresh

```bash
# Start 3-container setup
docker compose -f docker-compose.zitadel-test.yml up -d

# Watch for ready message
docker compose -f docker-compose.zitadel-test.yml logs -f zitadel
# Wait for: "server is listening on [::]:8080"
```

- [ ] Containers started successfully
- [ ] Zitadel API ready

### 3.3 First Instance Setup

**Open Console**: http://localhost:8080/ui/console

1. **Create Admin User**:
   - Email: `admin@gadgetbot.localhost`
   - First/Last Name: `Admin` / `User`
   - Password: `Admin123!`

2. **Create Organization**:
   - Name: `GadgetBot`

3. **Change Password** (required):
   - Old: `Admin123!`
   - New: `Gadgetbot123!`

- [ ] Admin user created
- [ ] Organization created
- [ ] Password changed

---

## Phase 4: Create Import Service User

**Same process as Phase 1.1**, but:
- Username: `import-service`
- Generate new PAT
- Set new token: `export ZITADEL_SERVICE_TOKEN=<new-token>`

- [ ] Import service user created
- [ ] Org Owner Manager role assigned
- [ ] New PAT generated and set

---

## Phase 5: Import Configuration

```bash
# Run import
npm run zitadel:import

# Watch for success message
# Should show: Projects created, Applications created, Roles created
```

**Expected Output**:
```
✓ Project: GadgetBot (existing, using ID: xxx)
✓ Application: GadgetBot Web (ID: yyy)
✓ Role: admin
✅ Import complete!
```

- [ ] Import completed without errors
- [ ] Projects created/found
- [ ] Applications created

**Reference**: [ZITADEL_MIGRATION.md - Import Configuration](./ZITADEL_MIGRATION.md#import-configuration)

---

## Phase 6: Post-Import Configuration (CRITICAL!)

⚠️ **The import script does NOT preserve all settings!** You MUST manually fix these.

### 6.1 Get New Client ID

**In Zitadel Console**:
1. Go to **Projects → GadgetBot → Applications → GadgetBot Web**
2. Copy **Client ID** from Overview
3. **Format**: Numbers only (e.g., `344936354465016579`)
4. **DO NOT** add `@gadgetbot` suffix

### 6.2 Update .env

```bash
# Edit .env file
ZITADEL_CLIENT_ID=<new-client-id-numbers-only>
```

### 6.3 Fix Authentication Method (CRITICAL!)

**In Zitadel Console** (same application page):
1. Scroll to **OIDC Configuration** section
2. Find **Authentication Method** dropdown
3. Change from **"Basic"** to **"None"**
4. Click **Save**

**Why**: Enables PKCE flow. Without this, you get `invalid_client, empty client secret` error.

### 6.4 Verify Redirect URIs

**In Zitadel Console** (same application page):
1. Go to **URLs** tab
2. **Redirect URIs** must include:
   ```
   http://localhost:3001/api/auth/callback/zitadel
   ```
3. **Post Logout URIs** must include:
   ```
   http://localhost:3001
   ```
4. **IMPORTANT**: Click **"+"** button after typing each URI before clicking Save

**Common Mistake**: Typing URIs and clicking Save without using "+" button → URIs don't persist.

- [ ] New Client ID copied
- [ ] `.env` updated with new Client ID
- [ ] Authentication Method set to "None"
- [ ] Redirect URIs verified and saved correctly
- [ ] Post Logout URIs verified

**Reference**: [ZITADEL_3CONTAINER_NOTES.md - Post-Import Checklist](../ZITADEL_3CONTAINER_NOTES.md#⚠️-post-import-configuration-checklist)

---

## Phase 7: Verify Environment

```bash
# Check for system env var conflicts
printenv | grep BETTER_AUTH
printenv | grep ZITADEL

# If you see variables listed, they might override .env
# See ZITADEL_3CONTAINER_NOTES.md section 5 for fix
```

**Your `.env` should have**:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gadgetbot
ZITADEL_ISSUER_URL=http://localhost:8080
ZITADEL_CLIENT_ID=<numbers-only>
BETTER_AUTH_SECRET=<your-secret>
BETTER_AUTH_URL=http://localhost:3001
```

- [ ] No system env var conflicts
- [ ] `.env` has all required variables
- [ ] Client ID format correct (numbers only)

---

## Phase 8: Test OAuth Flow

### 8.1 Start App

```bash
# Start GadgetBot app
npm run dev -- --port 3001

# Or with explicit env vars to override system settings
env BETTER_AUTH_URL=http://localhost:3001 \
    ZITADEL_CLIENT_ID=<your-new-client-id> \
    npm run dev -- --port 3001
```

### 8.2 Test Sign In

1. Open http://localhost:3001
2. Click **Sign In**
3. **Should redirect to**: http://localhost:3000/ui/v2/login (Login V2 UI)
4. **Login**: `admin@gadgetbot.localhost` / `Gadgetbot123!`
5. **Should redirect back** to app with authenticated session
6. **Verify**: User info displays in UI

### 8.3 Test Sign Out

1. Click **Sign Out**
2. Session should clear
3. Visiting protected routes should redirect to login

- [ ] Sign in works
- [ ] Redirects to Login V2 UI
- [ ] Redirects back to app after login
- [ ] User info displays
- [ ] Sign out works

**Troubleshooting**: If OAuth fails, see [ZITADEL_3CONTAINER_NOTES.md - Error Reference](../ZITADEL_3CONTAINER_NOTES.md#error-reference)

---

## Phase 9: Document Findings

### What Worked ✅

- [ ] Export script captured all configuration
- [ ] Import script created projects and applications
- [ ] OAuth flow works after manual fixes
- [ ] Login V2 UI working

### Issues Encountered ❌

**Document any problems**:

- Export issues: ___
- Import issues: ___
- Configuration gaps: ___
- OAuth flow errors: ___

### Documentation Gaps

**What was missing or unclear**?

- Missing steps in ZITADEL_MIGRATION.md: ___
- Unclear instructions: ___
- Missing troubleshooting: ___

### Improvements Needed

- [ ] Import script should preserve Authentication Method
- [ ] Import script should update Redirect URIs automatically
- [ ] Better post-import validation
- [ ] Automated verification script

---

## Success Criteria

- [x] Export completed successfully
- [x] Import completed successfully
- [x] All post-import fixes applied
- [x] OAuth flow works end-to-end
- [x] Login V2 UI working
- [x] Session management working
- [x] Documentation gaps identified

---

## Common Errors & Quick Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `invalid_client, empty client secret` | Auth Method = "Basic" | Set to "None" in Console |
| `Errors.App.NotFound` | Wrong Client ID | Get correct ID from Console |
| `redirect_uri_mismatch` | URIs not saved | Use "+" button, then Save |
| `Invalid origin` | Env var conflict | Check `printenv`, override with `env` |
| Redirects to Login V1 | Wrong compose file | Use `docker-compose.zitadel-test.yml` |

**Full Error Reference**: [ZITADEL_3CONTAINER_NOTES.md - Error Reference](../ZITADEL_3CONTAINER_NOTES.md#error-reference)

---

## Next Steps After Testing

1. **Update Documentation**:
   - Add any missing steps to ZITADEL_MIGRATION.md
   - Update AUTH_SETUP.md with new findings
   - Improve troubleshooting sections

2. **Improve Import Script**:
   - Auto-set Authentication Method to "None"
   - Parse and update Redirect URIs from `.env`
   - Add post-import validation
   - Print checklist of manual steps

3. **Create Helper Scripts**:
   - `scripts/zitadel-verify-config.ts` - Validate config
   - `scripts/fix-redirect-uris.ts` - Batch update URIs
   - `scripts/check-env-overrides.ts` - Detect conflicts

4. **Plan Production Deployment**:
   - Decide: 3-container vs single-container?
   - Update production configs
   - Test on staging environment
   - Document production-specific steps

**See**: [ZITADEL_3CONTAINER_TESTING_PLAN.md - Production Testing Plan](./ZITADEL_3CONTAINER_TESTING_PLAN.md#production-testing-plan)

---

## Time Estimate

- **Phase 1 (Export)**: 10 minutes
- **Phase 2 (Backup)**: 2 minutes
- **Phase 3 (Reset)**: 5 minutes
- **Phase 4 (Service User)**: 5 minutes
- **Phase 5 (Import)**: 5 minutes
- **Phase 6 (Post-Import Fixes)**: 10 minutes
- **Phase 7 (Verify Environment)**: 5 minutes
- **Phase 8 (Test OAuth)**: 10 minutes
- **Phase 9 (Documentation)**: 10 minutes

**Total**: ~60 minutes (first time), ~30 minutes (subsequent runs)
