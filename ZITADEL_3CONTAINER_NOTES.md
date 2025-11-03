# Zitadel 3-Container Setup: Critical Configuration Notes

## Overview

This document captures critical configuration issues discovered during OAuth testing with the official Zitadel 3-container setup (API + Login V2 + PostgreSQL).

**IMPORTANT**: These issues must be addressed after any Zitadel configuration import. The import script does NOT preserve all settings correctly.

---

## ⚠️ Post-Import Configuration Checklist

After running `npm run zitadel:import`, you MUST manually verify and fix these settings:

### 1. OIDC Authentication Method (CRITICAL)

**Issue**: The import script does NOT preserve the authentication method. Applications default to "Basic" authentication, which requires a client secret.

**Impact**: OAuth flow fails with error: `invalid_client, empty client secret`

**Fix**:
1. Open Zitadel Console: http://localhost:8080/ui/console
2. Navigate to: **Projects → GadgetBot → Applications → GadgetBot Web**
3. Click **OIDC Configuration** section
4. Find **Authentication Method** dropdown
5. Change from "Basic" to **"None"**
6. Click **Save**

**Why**: Better Auth uses PKCE flow (Proof Key for Code Exchange) which doesn't require a client secret. Setting the method to "None" enables PKCE.

**Evidence**: This setting was not copied over during import, causing authentication failures even with correct Client ID and redirect URIs.

---

### 2. Client ID Format (3-Container Specific)

**Issue**: Different Zitadel setups use different Client ID formats. The 3-container setup uses numbers only.

**Client ID Format by Setup**:

```env
# ✅ 3-Container Setup (official Zitadel with Login V2)
ZITADEL_CLIENT_ID=344936354465016579

# ❌ Single-Container or Older Versions (may include project suffix)
ZITADEL_CLIENT_ID=344936354465016579@gadgetbot
```

**How to Get the Correct Client ID**:

1. Open Zitadel Console: http://localhost:8080/ui/console
2. Login as `admin@gadgetbot.localhost` / `Admin123!`
3. Navigate to: **Projects → GadgetBot → Applications → GadgetBot Web**
4. Copy the **Client ID** shown in the Overview section
5. The Console displays numbers only (e.g., `344936354465016579`)
6. Do NOT add `@gadgetbot` or any suffix

**Update `.env` file**:

```env
ZITADEL_CLIENT_ID=344936354465016579
```

**Common Mistakes**:
- Using Client ID from old export file (`zitadel-export.json`) instead of current running instance
- Adding `@gadgetbot` suffix when Console shows numbers only
- Confusing Client ID with Project ID (there are multiple IDs in the Console)

**Error if Incorrect**: `{error: "invalid_request", error_description: "Errors.App.NotFound"}`

---

### 3. Redirect URIs Configuration

**Issue**: Redirect URIs don't persist if you don't follow the exact save process in the Console UI.

**Required URIs for Local Development**:

```
http://localhost:3001/api/auth/callback/zitadel
http://localhost:3001
```

**Correct Save Process**:

1. In Zitadel Console, navigate to Application → URLs section
2. For EACH redirect URI:
   - Type the full URI in the "Redirect URIs" input field
   - **Click the "+" button** next to the input to officially add it to the list
   - Verify it appears in the list below
   - Repeat for all URIs
3. Only after adding all URIs with the "+" button, click **Save** at the bottom

**Common Mistake**: Typing all URIs and clicking Save without using the "+" button. This causes URIs to not persist.

**Verification**: After saving, refresh the page and verify all URIs are still listed.

---

### 4. Port Configuration

**Issue**: Zitadel Login V2 container runs on port 3000, conflicting with typical React dev servers.

**Solution**: Run GadgetBot app on port 3001

**Configuration Required**:

**`.env` file**:
```env
BETTER_AUTH_URL=http://localhost:3001
```

**Start command**:
```bash
npm run dev -- --port 3001
```

**Zitadel Port Reference**:
- **Port 8080**: Zitadel API (main container)
- **Port 3000**: Login V2 UI (login container, shares network with main)
- **Port 5432**: PostgreSQL database

**Update Redirect URIs**: After changing to port 3001, update all redirect URIs in Zitadel Console to use port 3001.

---

### 5. Environment Variable Precedence Issues

**Issue**: System-level environment variables override `.env` file values, causing confusing behavior where changes to `.env` don't take effect.

**Symptoms**:
- App shows wrong URL in error logs (e.g., `http://localhost:3000` when `.env` says `http://localhost:3001`)
- Error: `Invalid origin: http://localhost:3001`
- Console logs show: `trustedOrigins: http://localhost:3000,http://localhost:3000`

**Diagnosis**:

```bash
# Check for system-level environment variables
printenv | grep BETTER_AUTH
printenv | grep ZITADEL

# Look for variables set in shell profile files
cat ~/.zshrc | grep BETTER_AUTH
cat ~/.bashrc | grep BETTER_AUTH
```

**Permanent Fix**:

Remove environment variables from shell profile files (`~/.zshrc`, `~/.bashrc`, etc.)

**Temporary Workaround**:

Override system variables when starting the dev server:

```bash
env BETTER_AUTH_URL=http://localhost:3001 \
    ZITADEL_CLIENT_ID=344936354465016579 \
    npm run dev -- --port 3001
```

**Related Fix**: Added `trustedOrigins` configuration to Better Auth server config to explicitly control allowed origins.

---

## Better Auth Configuration Updates

**File**: `src/auth/server.ts`

Added explicit `trustedOrigins` configuration to fix CORS/403 errors:

```typescript
export const auth = betterAuth({
  // ... other config
  trustedOrigins: [env.BETTER_AUTH_URL],
  // ... rest of config
})
```

**Why**: Better Auth needs to know which origins are allowed to make requests. Without this, you get 403 Forbidden errors when the app and API are on different ports or domains.

---

## Working Configuration Example

**Docker Containers**:
```bash
docker ps | grep gadgetbot-zitadel
# Should show 3 containers: zitadel, zitadel-login, zitadel-db
```

**`.env` File**:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gadgetbot

# Zitadel Configuration
ZITADEL_ISSUER_URL=http://localhost:8080
ZITADEL_CLIENT_ID=344936354465016579
# ZITADEL_CLIENT_SECRET is not needed when using PKCE

# Better Auth
BETTER_AUTH_SECRET=DpezTr+NyZELtbjGieh0L60NvWKhHa/0/s10NfrJDSQ=
BETTER_AUTH_URL=http://localhost:3001
```

**Zitadel Console Settings** (Projects → GadgetBot → Applications → GadgetBot Web):

- **Client ID**: `344936354465016579` (no suffix)
- **Authentication Method**: None (enables PKCE)
- **Redirect URIs**:
  - `http://localhost:3001/api/auth/callback/zitadel`
  - `http://localhost:3001`
- **Post Logout URIs**: `http://localhost:3001`

**Start Commands**:

```bash
# Start Zitadel 3-container setup
npm run zitadel:up

# Start GadgetBot app (with env overrides if needed)
npm run dev -- --port 3001

# Or with explicit env vars to override system settings
env BETTER_AUTH_URL=http://localhost:3001 \
    ZITADEL_CLIENT_ID=344936354465016579 \
    npm run dev -- --port 3001
```

**Verification**:

1. Navigate to http://localhost:3001
2. Click "Sign In"
3. Should redirect to Login V2 at http://localhost:3000/ui/v2/login
4. Login with test user
5. Should redirect back to http://localhost:3001 with authenticated session

---

## Error Reference

### Error: `invalid_client, empty client secret`

**Cause**: Authentication Method is set to "Basic" instead of "None"

**Fix**: Change to "None" in Zitadel Console → OIDC Configuration

---

### Error: `Errors.App.NotFound`

**Causes**:
1. Client ID is from old/different Zitadel instance
2. Client ID includes `@gadgetbot` suffix when it shouldn't
3. Client ID in `.env` doesn't match Console

**Fix**: Get correct Client ID from current Zitadel Console and use exact format shown (numbers only for 3-container)

---

### Error: `Invalid origin: http://localhost:3001`

**Causes**:
1. System environment variable overriding `.env` file
2. Missing `trustedOrigins` in Better Auth config
3. App running on different port than configured

**Fixes**:
1. Check for env var overrides with `printenv | grep BETTER_AUTH`
2. Add `trustedOrigins: [env.BETTER_AUTH_URL]` to auth config
3. Ensure `BETTER_AUTH_URL` matches actual port app is running on

---

### Error: Redirect to `/api/auth/error?error=invalid_code`

**Cause**: Typically follows fixing Client ID but Auth Method still on "Basic"

**Fix**: Set Authentication Method to "None" to enable PKCE

---

## Future Improvements

### Import Script Enhancements

The `scripts/zitadel-import.ts` script should be updated to:

1. **Preserve Authentication Method**: Set imported applications to "None" auth method by default
2. **Validate Client ID Format**: Check and warn if Client ID format doesn't match expected pattern
3. **Update Redirect URIs**: Parse and update URIs to match current `BETTER_AUTH_URL` from `.env`
4. **Post-Import Checklist**: Print checklist of manual verification steps after import

### Helper Scripts

Consider creating:

- **`scripts/zitadel-verify-config.ts`**: Validate Zitadel configuration against `.env` file
- **`scripts/fix-redirect-uris.ts`**: Batch update redirect URIs to match new base URL
- **`scripts/check-env-overrides.ts`**: Detect system env vars that might conflict with `.env`

---

## References

- [Better Auth Documentation](https://www.better-auth.com/)
- [Zitadel OIDC Documentation](https://zitadel.com/docs/guides/integrate/login/oidc)
- [OAuth 2.0 PKCE Flow](https://oauth.net/2/pkce/)
- Project Files:
  - [src/auth/server.ts](src/auth/server.ts) - Better Auth configuration
  - [scripts/zitadel-import.ts](scripts/zitadel-import.ts) - Import script
  - [docker-compose.zitadel-test.yml](docker-compose.zitadel-test.yml) - 3-container setup
  - [docs/AUTH_SETUP.md](docs/AUTH_SETUP.md) - Authentication setup guide
  - [docs/ZITADEL_MIGRATION.md](docs/ZITADEL_MIGRATION.md) - Import/export guide

---

## Testing Summary

**Date**: Session ending 2025-11-02

**Result**: ✅ OAuth integration successful with 3-container Zitadel + Login V2

**Issues Encountered**: 6 major configuration issues (all documented above)

**Final Configuration**: App on port 3001, Client ID without suffix, PKCE enabled, environment variables verified

**Next Steps**:
1. Test additional Login V2 features (password reset, account selection)
2. Evaluate Login V2 benefits vs 3-container complexity for production
3. Update import script to preserve authentication method
4. Document production deployment approach
