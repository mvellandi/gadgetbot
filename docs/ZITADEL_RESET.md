# Reset Zitadel

Quick reference for resetting Zitadel using 3-container setup and re-importing configuration.

If starting fresh:

1. run `npm run zitadel:reset`
2. skip to [auth setup](./AUTH_SETUP.md).

**Related Documentation**:

- [ZITADEL_MIGRATION.md](./ZITADEL_MIGRATION.md) - Full export/import guide
- [AUTH_SETUP.md](./AUTH_SETUP.md) - Initial authentication setup

---

## Pre-Flight Check

```bash
# Verify containers are healthy
docker ps | grep gadgetbot-zitadel
# Should show: zitadel, zitadel-login, zitadel-db (all healthy)

# Optional: Test Zitadel API is responding
curl http://localhost:8080/.well-known/openid-configuration
```

---

## Phase 1: Export Current Configuration

**Quick Steps**:

1. Create service user `export-service` with Org Owner Manager role
2. Generate PAT and set `export ZITADEL_SERVICE_TOKEN=<token>`
3. Run `npm run zitadel:export`

## Phase 2: Document Current State

```bash
# Backup .env
cp .env .env.backup

# Save current Client ID
grep ZITADEL_CLIENT_ID .env > client-id-backup.txt
```

This ensures you can restore your configuration if needed.

---

## Phase 3: Reset Zitadel

### 3.1 Destroy Everything

```bash
# Use the built-in reset command
npm run zitadel:reset

# Verify containers restarted
docker ps | grep zitadel
# Should show: zitadel, zitadel-login, zitadel-db (all healthy)
```

This command stops containers, removes volumes, and restarts Zitadel with a clean state.

### 3.2 First Instance Setup

**Open Console**: http://localhost:8080/ui/console

1. **Create Admin User**:
   - Email: `admin@gadgetbot.localhost`
   - First/Last Name: `Admin` / `User`
   - Password: `Admin123!`

2. **Create Organization** (if not importing)
   - Name: `GadgetBot`

3. **Change Password** (required):
   - Old: `Admin123!`
   - New: `something-stronger`

---

## Phase 4: Import Configuration

**Quick Steps**:

1. Create service user `import-service` with Org Owner Manager role
2. Generate PAT and set `export ZITADEL_SERVICE_TOKEN=<token>`
3. Run `npm run zitadel:import`
4. Get new Client ID from Console and update `.env`
5. Change OIDC auth method from **"Basic"** to **"None"**
6. Verify and save redirect URIs

For detailed instructions on export/import, see [ZITADEL_MIGRATION.md](./ZITADEL_MIGRATION.md).
