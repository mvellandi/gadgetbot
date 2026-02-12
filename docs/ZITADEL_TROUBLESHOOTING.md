# Zitadel Production Deployment - Session Notes

**Date**: 2025-11-06
**Status**: ✅ Working - Console accessible, Login V2 configured, pending first login test

---

## Summary

Successfully deployed Zitadel 3-container stack (Zitadel + Login V2 + PostgreSQL) to production with working Traefik routing and Login V2 configuration. The console is now accessible at `https://auth.vellandi.net/ui/console` and redirects to Login V2 UI.

---

## Final Working Configuration

### Architecture
```
Browser → Traefik (https) → Zitadel (8080) → PostgreSQL
                         ↓
                    Login V2 (3000)
```

**Key Design Decisions**:
- Login container has its own Traefik route (not using `network_mode: service:zitadel`)
- Both Zitadel and Login containers on `coolify` network for Traefik access
- Internal communication via `zitadel-network` using container names
- External URLs for browser redirects, internal URLs for API communication

### Container Status
```
✅ zitadel (healthy)
✅ login (healthy)
✅ db (healthy)
✅ Traefik routing (working)
✅ Login V2 (configured and accessible)
```

---

## Issues Resolved ✅

### 1. Health Check Configuration
**Problem**: Zitadel health check failing with "unknown flag: --insecure"

**Solution**:
```yaml
healthcheck:
  test: ["CMD", "/app/zitadel", "ready"]
environment:
  ZITADEL_TLS_ENABLED: "false"  # MUST be quoted string
```

**Key Learning**: `ZITADEL_TLS_ENABLED` must be quoted string `"false"`, not boolean. Coolify converts unquoted `false` to `null`.

---

### 2. Traefik Entrypoint Name
**Problem**: "EntryPoint doesn't exist entryPointName=websecure"

**Root Cause**: Coolify's Traefik uses `https` entrypoint, not `websecure`

**Solution**:
```yaml
- "traefik.http.routers.zitadel.entrypoints=https"
```

---

### 3. Login V2 URL Configuration
**Problem**: Browser redirected to `http://localhost:3000/ui/v2/login` (invalid for production)

**Root Cause**: Confused internal vs external URLs. The official docker-compose uses localhost because it's for local development.

**Solution**: Use external domain for browser redirects, internal URLs for container communication:
```yaml
# In Zitadel container - for browser redirects
ZITADEL_DEFAULTINSTANCE_FEATURES_LOGINV2_BASEURI: https://auth.vellandi.net/ui/v2/login
ZITADEL_OIDC_DEFAULTLOGINURLV2: https://auth.vellandi.net/ui/v2/login/login?authRequest=

# In Login container - for API calls
ZITADEL_API_URL: http://zitadel:8080
CUSTOM_REQUEST_HEADERS: Host:auth.vellandi.net
```

---

### 4. Login Container Network Mode
**Problem**: Using `network_mode: service:zitadel` prevented Traefik from routing to login container

**Solution**: Give login container its own network presence with Traefik labels:
```yaml
login:
  networks:
    - zitadel-network  # For talking to Zitadel
    - coolify          # For Traefik routing
  labels:
    - "traefik.http.routers.zitadel-login.rule=Host(`auth.vellandi.net`) && PathPrefix(`/ui/v2/login`)"
    - "traefik.http.routers.zitadel-login.priority=100"  # Higher priority than main router
```

---

### 5. Login Container Host Header
**Problem**: HTTP 500 error - "Instance not found" when login container called Zitadel API

**Root Cause**: Login container calling `http://zitadel:8080` without proper Host header

**Solution**: Add `CUSTOM_REQUEST_HEADERS` to send correct Host header:
```yaml
CUSTOM_REQUEST_HEADERS: Host:auth.vellandi.net
```

---

### 6. Traefik Configuration Refresh
**Problem**: Gateway timeout even though containers were healthy

**Root Cause**: Traefik didn't pick up new routing configuration

**Solution**: Restart Traefik after deploying changes:
```bash
ssh hetzner-gadgetbot "docker restart coolify-proxy"
```

---

## Working Deployment Steps

### Prerequisites
1. Domain DNS configured: `auth.vellandi.net` → Server IP
2. Environment variables set in Coolify (see `.env.zitadel.production.example`)
3. Docker Compose file: `zitadel/docker-compose.production.yml`

### Deployment Process

1. **Upload docker-compose file to Coolify**
   - Create new Service in Coolify
   - Upload `zitadel/docker-compose.production.yml`
   - Set environment variables

2. **Delete existing volumes** (if redeploying):
   ```bash
   ssh hetzner-gadgetbot
   docker volume rm poo88s8sskwgogwwkgkgk8k4_zitadel-data
   docker volume rm poo88s8sskwgogwwkgkgk8k4_zitadel-db-data
   ```

3. **Deploy in Coolify**
   - Click "Deploy"
   - Wait for all 3 containers to be healthy (~2 minutes)

4. **Restart Traefik** (required after first deploy):
   ```bash
   ssh hetzner-gadgetbot "docker restart coolify-proxy"
   ```

5. **Verify deployment**:
   ```bash
   # Check container status
   docker ps --filter name=zitadel

   # Test console access
   curl -I https://auth.vellandi.net/ui/console
   # Should return HTTP 200
   ```

6. **Access console**:
   - URL: `https://auth.vellandi.net/ui/console`
   - Should redirect to Login V2 UI
   - **Next step**: Test login with default credentials

---

## Environment Variables Reference

### Required in Coolify
```bash
# Core Configuration
ZITADEL_MASTERKEY=<32-char-hex-string>  # Generate: openssl rand -hex 16

# Database
POSTGRES_PASSWORD=<secure-password>
ZITADEL_DB_PASSWORD=<secure-password>
```

### In zitadel/docker-compose.production.yml
```yaml
# Zitadel Container
ZITADEL_EXTERNALDOMAIN: auth.vellandi.net
ZITADEL_EXTERNALSECURE: true
ZITADEL_TLS_ENABLED: "false"  # Quoted!

# First Instance Setup (runs on fresh database)
ZITADEL_FIRSTINSTANCE_LOGINCLIENTPATPATH: /zitadel-data/login-client.pat
ZITADEL_FIRSTINSTANCE_ORG_HUMAN_PASSWORDCHANGEREQUIRED: false
ZITADEL_FIRSTINSTANCE_ORG_LOGINCLIENT_MACHINE_USERNAME: login-client
ZITADEL_FIRSTINSTANCE_ORG_LOGINCLIENT_MACHINE_NAME: Automatically Initialized IAM_LOGIN_CLIENT
ZITADEL_FIRSTINSTANCE_ORG_LOGINCLIENT_PAT_EXPIRATIONDATE: '2029-01-01T00:00:00Z'

# Login V2 Configuration
ZITADEL_DEFAULTINSTANCE_FEATURES_LOGINV2_REQUIRED: true
ZITADEL_DEFAULTINSTANCE_FEATURES_LOGINV2_BASEURI: https://auth.vellandi.net/ui/v2/login
ZITADEL_OIDC_DEFAULTLOGINURLV2: https://auth.vellandi.net/ui/v2/login/login?authRequest=

# Login Container
ZITADEL_API_URL: http://zitadel:8080
CUSTOM_REQUEST_HEADERS: Host:auth.vellandi.net
```

---

## Traefik Configuration

### Zitadel Router
```yaml
- "traefik.http.routers.zitadel.rule=Host(`auth.vellandi.net`)"
- "traefik.http.routers.zitadel.entrypoints=https"  # NOT websecure!
- "traefik.http.services.zitadel.loadbalancer.server.port=8080"
```

### Login Router (Higher Priority)
```yaml
- "traefik.http.routers.zitadel-login.rule=Host(`auth.vellandi.net`) && PathPrefix(`/ui/v2/login`)"
- "traefik.http.routers.zitadel-login.entrypoints=https"
- "traefik.http.routers.zitadel-login.priority=100"  # Match login paths first
- "traefik.http.services.zitadel-login.loadbalancer.server.port=3000"
```

---

## Key Learnings

1. **Boolean Environment Variables**: Always quote in Docker Compose for Coolify: `"false"` not `false`

2. **Traefik Entrypoints**: Coolify uses `https`, not standard `websecure`

3. **Login V2 Architecture**:
   - Login container needs separate Traefik route with higher priority
   - Use external domain URLs for browser redirects
   - Use internal container names for API communication
   - Add Host header via `CUSTOM_REQUEST_HEADERS`

4. **First Instance Setup**:
   - Only runs once when database is empty
   - Creates admin user and login client automatically
   - Generates PAT file for Login V2

5. **Network Configuration**:
   - Login container on both `zitadel-network` and `coolify` networks
   - NOT using `network_mode: service:zitadel`

6. **Traefik Refresh**: Restart Traefik after deploying new services

7. **Volume Reset**: Delete both `zitadel-data` and `zitadel-db-data` for clean redeployment

---

## Troubleshooting Guide

### Console Returns Gateway Timeout
```bash
# 1. Check containers are healthy
docker ps --filter name=zitadel

# 2. Check Traefik can reach Zitadel
docker run --rm --network coolify curlimages/curl:latest \
  curl -I http://zitadel-poo88s8sskwgogwwkgkgk8k4:8080/ui/console

# 3. Restart Traefik
docker restart coolify-proxy

# 4. Test again
curl -I https://auth.vellandi.net/ui/console
```

### Login V2 Returns HTTP 500
```bash
# Check login container logs
docker logs login-poo88s8sskwgogwwkgkgk8k4 --tail 50

# Common issues:
# - Missing CUSTOM_REQUEST_HEADERS
# - Wrong ZITADEL_API_URL
# - PAT file not found
```

### "Code 5: Not Found" Error
```bash
# Check Login V2 configuration
docker inspect zitadel-poo88s8sskwgogwwkgkgk8k4 \
  --format '{{json .Config.Env}}' | jq -r '.[]' | grep LOGINV2

# Should use external domain:
# ZITADEL_DEFAULTINSTANCE_FEATURES_LOGINV2_BASEURI=https://auth.vellandi.net/ui/v2/login
```

### Login Container Unhealthy
```bash
# Check if PAT file exists
docker exec zitadel-poo88s8sskwgogwwkgkgk8k4 ls -la /zitadel-data/

# Check login container logs
docker logs login-poo88s8sskwgogwwkgkgk8k4

# If "token file found" but still unhealthy, restart
docker restart login-poo88s8sskwgogwwkgkgk8k4
```

### "EntryPoint doesn't exist" in Traefik Logs
```bash
# Check Traefik entrypoints
docker inspect coolify-proxy --format '{{json .Args}}' | jq

# Verify using 'https' not 'websecure'
docker inspect zitadel-poo88s8sskwgogwwkgkgk8k4 \
  --format '{{json .Config.Labels}}' | jq | grep entrypoints
```

---

## Useful Commands

### Container Status
```bash
ssh hetzner-gadgetbot "docker ps --filter name=zitadel"
```

### View Logs
```bash
# Zitadel
docker logs zitadel-poo88s8sskwgogwwkgkgk8k4 --tail 50

# Login
docker logs login-poo88s8sskwgogwwkgkgk8k4 --tail 50

# Database
docker logs gadgetbot-zitadel-db-prod --tail 50

# Traefik
docker logs coolify-proxy | grep zitadel | tail -20
```

### Network Inspection
```bash
# Check IP addresses
docker inspect zitadel-poo88s8sskwgogwwkgkgk8k4 | jq '.[0].NetworkSettings.Networks'

# Test connectivity
docker exec coolify-proxy wget -qO- http://10.0.1.7:8080/debug/healthz
```

### Volume Management
```bash
# List volumes
docker volume ls | grep zitadel

# Delete volumes (reset)
docker volume rm poo88s8sskwgogwwkgkgk8k4_zitadel-data
docker volume rm poo88s8sskwgogwwkgkgk8k4_zitadel-db-data
```

---

## Next Steps

### Immediate
1. ⏳ **Test first login** with default Zitadel credentials
2. ⏳ **Verify Login V2 flow** works end-to-end
3. ⏳ **Create admin user** for GadgetBot app
4. ⏳ **Configure OAuth application** in Zitadel console

### Future
1. Document default admin credentials location
2. Create backup/restore procedures
3. Set up monitoring and alerting
4. Document OAuth app creation for GadgetBot
5. Test full authentication flow with local GadgetBot app

---

## Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Project architecture and authentication overview
- [AUTH_SETUP.md](./AUTH_SETUP.md) - Local development authentication setup
- [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md) - Deployment architecture overview
- [zitadel/docker-compose.production.yml](../zitadel/docker-compose.production.yml) - Production compose file
- [.env.zitadel.production.example](../.env.zitadel.production.example) - Environment variables template

---

**Session End**: 2025-11-06
**Time Invested**: ~4 hours
**Progress**: ✅ 95% complete - Console accessible, Login V2 working, pending first login test
