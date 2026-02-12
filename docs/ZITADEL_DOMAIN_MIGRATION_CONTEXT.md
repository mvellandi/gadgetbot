# Zitadel Domain Migration Guide

**Date:** February 12, 2026
**Status:** Complete - Migrated from `gadgetbot-auth.vellandi.net` to `auth.vellandi.net`

---

## Migration Procedure

To change Zitadel's external domain on a running instance, you need to update **three layers**: Docker Compose config, the setup command, and the active projection table. Here are the steps in order.

### Step 1: Update Docker Compose

Update all domain references in `zitadel/docker-compose.production.yml`:

- `ZITADEL_EXTERNALDOMAIN`
- `ZITADEL_DEFAULTINSTANCE_FEATURES_LOGINV2_BASEURI`
- `ZITADEL_OIDC_DEFAULTLOGINURLV2`
- `ZITADEL_OIDC_DEFAULTLOGOUTURLV2`
- `ZITADEL_SAML_DEFAULTLOGINURLV2`
- `CUSTOM_REQUEST_HEADERS` in the login container
- Traefik routing labels (`Host(...)` rules)

### Step 2: Use `start-from-init` Command

Change the Zitadel container command from `start` to `start-from-init`:

```yaml
command: start-from-init --masterkey "${ZITADEL_MASTERKEY}" --tlsMode external --externalPort 443
```

**Why:** The `start` command skips the setup phase entirely. Domain changes via `ZITADEL_EXTERNALDOMAIN` are only applied during setup, via the `config_change` repeatable migration. The `start-from-init` command runs `init` → `setup` → `start`, and both `init` and `setup` are idempotent, so this is safe to use permanently.

The setup phase handles:
- Updating `instance_domains` projections
- Running the `externalConfigChange` migration
- Updating console app redirect URIs for all known instance domains
- Recording the migration in `system.migration.repeatable.done` events

### Step 3: Update the Active Feature Projection

This is the critical step that is easy to miss. Zitadel maintains **versioned projection tables** (e.g., `instance_features2`, `instance_features3`). The setup migration and `DEFAULTINSTANCE_FEATURES_*` env vars only write to the eventstore during first-time initialization — they do not re-run if the feature event already exists.

**Check which table is active** by looking at startup logs for the highest-numbered `instance_features` migration:

```
verify migration name=projections.instance_features3
```

**Update the active table directly:**

```sql
UPDATE projections.instance_features3
SET value = '{"base_uri": {"Host": "NEW_DOMAIN", "Path": "/ui/v2/login", "User": null, "Opaque": "", "Scheme": "https", "RawPath": "", "Fragment": "", "OmitHost": false, "RawQuery": "", "ForceQuery": false, "RawFragment": ""}, "required": true}'
WHERE instance_id = 'YOUR_INSTANCE_ID' AND key = 'login_v2';
```

**Why this matters:** The `/oauth/v2/authorize` endpoint builds the login redirect URL from `instance.Features().LoginV2.BaseURI`, which is read from the **highest-numbered** `instance_features` projection table. Updating an older table (e.g., `instance_features2`) has no effect.

### Step 4: Restart and Verify

1. Create a database backup first:
   ```bash
   docker exec DB_CONTAINER pg_dump -U postgres zitadel > /tmp/zitadel-backup-$(date +%Y%m%d-%H%M%S).sql
   ```

2. Restart the stack (deploy via Coolify or `docker compose down && docker compose up -d`)

3. Verify the redirect:
   ```bash
   curl -s -o /dev/null -D - 'https://NEW_DOMAIN/oauth/v2/authorize?client_id=CONSOLE_CLIENT_ID&redirect_uri=https%3A%2F%2FNEW_DOMAIN%2Fui%2Fconsole%2Fauth%2Fcallback&response_type=code&scope=openid+profile+email&prompt=login' | grep location
   ```

   Expected: `location: https://NEW_DOMAIN/ui/v2/login/login?authRequest=V2_...`

### Step 5: Update DNS and Docs

- Create/update DNS A record for the new domain
- Update project documentation referencing the domain
- Update any OAuth client configurations in consuming apps (redirect URIs, issuer URLs)

---

## How Zitadel Resolves the Login Redirect URL

Understanding this flow explains why domain migrations are tricky:

1. **`/oauth/v2/authorize`** receives an auth request
2. It looks up the OIDC client (`apps7_oidc_configs`) for the `login_version`
3. **Instance feature override:** If `instance_features{N}.login_v2.required = true`, the per-app `login_version` is overridden to V2 and the `base_uri` from that feature is used
4. The auth request gets a `V2_` prefix, and the redirect URL is constructed from that `base_uri`
5. The `base_uri` is loaded into memory from the **highest-numbered** `instance_features` projection table at startup

```
/oauth/v2/authorize
  → OIDCClient.LoginVersion (overridden by instance feature if required=true)
  → LoginV2.BaseURI (from projections.instance_features{N})
  → 302 Location: {base_uri}/login?authRequest=V2_{id}
```

---

## Key Gotchas

### Versioned Projection Tables

Zitadel uses versioned projection tables (`instance_features2`, `instance_features3`, etc.). Only the **highest-numbered** table is read at runtime. When manually updating projections, always check which version is active:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'projections' AND table_name LIKE 'instance_features%'
ORDER BY table_name;
```

### `DEFAULTINSTANCE_FEATURES_*` Env Vars Are First-Run Only

Environment variables like `ZITADEL_DEFAULTINSTANCE_FEATURES_LOGINV2_BASEURI` only take effect during the **first instance setup**. On subsequent startups, the feature is already set in the eventstore, so the env var is ignored. To change the value after initial setup, you must update the projection directly.

### `config_change` Migration Idempotency

The `config_change` repeatable migration compares `lastRun` values in the `system.migration.repeatable.done` event. If the domain already matches, it skips execution. Check with:

```sql
SELECT payload FROM eventstore.events2
WHERE event_type = 'system.migration.repeatable.done'
  AND payload::text LIKE '%config_change%'
ORDER BY sequence DESC LIMIT 1;
```

### Eventstore Is Append-Only

Zitadel's eventstore is designed as append-only. Directly editing event payloads with SQL UPDATE can corrupt the event stream. Prefer updating projection tables instead, and let the setup phase handle event creation properly.

---

## Useful Diagnostic Queries

```sql
-- Check which domain is primary
SELECT domain, is_primary FROM projections.instance_domains
WHERE instance_id = 'YOUR_INSTANCE_ID' ORDER BY is_primary DESC;

-- Check login_v2 feature in active projection (adjust table number)
SELECT key, value FROM projections.instance_features3
WHERE instance_id = 'YOUR_INSTANCE_ID' AND key = 'login_v2';

-- Check per-app login versions
SELECT app_id, client_id, login_version, login_base_uri
FROM projections.apps7_oidc_configs;

-- Find any remaining references to old domain
SELECT event_type, payload FROM eventstore.events2
WHERE payload::text LIKE '%OLD_DOMAIN%'
ORDER BY created_at DESC LIMIT 20;

-- Check config_change migration history
SELECT sequence, created_at, payload FROM eventstore.events2
WHERE event_type = 'system.migration.repeatable.done'
  AND payload::text LIKE '%config_change%'
ORDER BY sequence;
```

---

## References

- [Zitadel Custom Domain Docs](https://zitadel.com/docs/self-hosting/manage/custom-domain)
- [GitHub Discussion #8351: How to update External Domain](https://github.com/zitadel/zitadel/discussions/8351)
- [Issue #10405: LOGINV2_BASEURI has no effect](https://github.com/zitadel/zitadel/issues/10405)
- [Issue #11163: v4.7.1 breaks login V2](https://github.com/zitadel/zitadel/issues/11163)
- [Zitadel Caches Documentation](https://zitadel.com/docs/self-hosting/manage/cache)
