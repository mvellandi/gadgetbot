# GadgetBot Deployment - Quick Summary

This document provides a high-level overview of the deployment setup.

**Deployment Method:**
- **[DEPLOYMENT_COOLIFY.md](./DEPLOYMENT_COOLIFY.md)** - ⭐ **Recommended** - Self-hosted Coolify with web UI

**Zitadel-Specific Guide:**
- **[ZITADEL_COOLIFY_COMPOSE.md](./ZITADEL_COOLIFY_COMPOSE.md)** - Step-by-step guide for deploying Zitadel on Coolify

## What You're Deploying

GadgetBot is deployed as a multi-container Docker application with:

- **PostgreSQL** - Database for both app and Zitadel
- **Zitadel** - Self-hosted OAuth/OIDC authentication server
- **GadgetBot App** - Your TanStack Start application
- **Nginx** - Reverse proxy with SSL termination
- **Certbot** - Automatic SSL certificate management

## Architecture Overview

```
Internet
   │
   ├─> Port 80 (HTTP) ──────────┐
   │                             │
   └─> Port 443 (HTTPS) ─────────┤
                                 │
                            ┌────▼────┐
                            │  Nginx  │ (Reverse Proxy + SSL)
                            └────┬────┘
                                 │
                    ┏━━━━━━━━━━━━┻━━━━━━━━━━━━┓
                    ▼                         ▼
            ┌───────────────┐        ┌──────────────┐
            │  GadgetBot    │        │   Zitadel    │
            │  Application  │        │   (OAuth)    │
            │  Port: 3000   │        │  Port: 8080  │
            └───────┬───────┘        └──────┬───────┘
                    │                       │
                    │                       │
                    └───────────┬───────────┘
                                │
                         ┌──────▼──────┐
                         │  PostgreSQL │
                         │  Port: 5432 │
                         └─────────────┘
```

## File Structure

```
gadgetbot/
├── docker-compose.zitadel-prod.yml  # Zitadel Docker Compose for Coolify
├── docker-compose.zitadel.yml       # Zitadel for local development
├── .env.zitadel.example             # Zitadel environment template
├── zitadel-export.json              # OAuth configuration export
├── scripts/
│   ├── zitadel-export.ts           # Export Zitadel configuration
│   └── zitadel-import.ts           # Import Zitadel configuration
└── docs/
    ├── DEPLOYMENT_COOLIFY.md        # Coolify deployment guide
    ├── DEPLOYMENT_SUMMARY.md        # This file (overview)
    ├── ZITADEL_COOLIFY_COMPOSE.md   # Zitadel-specific deployment
    └── ZITADEL_DEPLOYMENT_NOTES.md  # Deployment findings
```

## Resource Requirements

### Minimum
- **CPU**: 2 vCPU
- **RAM**: 2GB
- **Storage**: 40GB
- **Traffic**: Good for development/staging or low traffic

### Resource Allocation

| Service | CPU Limit | Memory Limit | Purpose |
|---------|-----------|--------------|---------|
| PostgreSQL | 1 core | 768MB | Database for app + Zitadel |
| Zitadel | 2 cores | 1GB | OAuth/OIDC server |
| App | 1 core | 512MB | GadgetBot application |
| Nginx | Default | Default | Reverse proxy (minimal) |

Total reserved: ~2.25GB RAM, 4 cores (fits CPX21)

## Configuration Highlights

### Docker Compose

**Key features:**
- Health checks for all services
- Resource limits to prevent OOM
- Automatic restart policies
- Named networks for isolation
- Persistent volumes for data

### Zitadel

Based on [official production guide](https://zitadel.com/docs/self-hosting/manage/production):
- YAML-based configuration (preferred over env vars)
- Optimized database connection pooling
- Structured JSON logging
- OpenTelemetry metrics at `/debug/metrics`
- Password hashing with bcrypt cost 14

### Nginx

**Configuration:**
- HTTP/2 enabled
- Gzip compression for assets
- Security headers (HSTS, X-Frame-Options, etc.)
- HTTP to HTTPS redirect
- Separate server blocks for app and Zitadel

### PostgreSQL

**Tuning for small VPS:**
- `shared_buffers`: 256MB
- `effective_cache_size`: 1GB
- `max_connections`: 100
- Running as non-root user

## Security Features

✅ **SSL/TLS**
- Free Let's Encrypt certificates
- Automatic renewal every 12 hours
- Strong cipher suites (TLS 1.2+)

✅ **Network**
- Firewall (UFW) with minimal ports
- Services isolated on Docker network
- Database not exposed publicly

✅ **Authentication**
- Self-hosted Zitadel (no third-party)
- PKCE OAuth flow
- Session management with HTTP-only cookies

✅ **Application**
- Non-root Docker users
- Resource limits prevent DoS
- Environment variables not in Git

## Deployment Workflow

### Initial Deployment

1. **Prepare** (local):
   - Get Hetzner VPS
   - Configure DNS
   - Generate secrets

2. **Setup** (server):
   - Install Docker
   - Upload code
   - Configure environment

3. **Deploy**:
   - Build containers
   - Obtain SSL certificates
   - Start all services

4. **Configure**:
   - Setup Zitadel OAuth app
   - Run database migrations
   - Test authentication

**Time estimate**: 1-2 hours

### Updating Application

```bash
# On local machine
SERVER_HOST=your-server-ip ./scripts/deploy.sh
```

This script:
1. Syncs code to server
2. Rebuilds app container
3. Runs migrations
4. Restarts app
5. Shows logs

**Time estimate**: 2-5 minutes

## Maintenance Tasks

### Daily (Automated)
- SSL certificate renewal check (certbot)
- Database backups (cron job)

### Weekly (Manual)
- Review logs for errors: `./scripts/logs.sh`
- Check disk space: `df -h`
- Monitor resource usage: `docker stats`

### Monthly (Manual)
- Update Docker images
- Review backup integrity
- Check for security updates
- Review database size

### As Needed
- Scale VPS resources
- Deploy application updates
- Restore from backup

## Monitoring

### Application Health

```bash
# Check all services
docker compose -f docker-compose.prod.yml ps

# View logs
./scripts/logs.sh

# Check resource usage
docker stats
```

### Database Health

```bash
# Database size
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('gadgetbot'));"

# Active connections
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```

### Zitadel Metrics

Visit: `https://auth.yourdomain.com/debug/metrics`

(OpenTelemetry format - integrate with Prometheus/Grafana)

## Backup & Recovery

### Automated Backups

```bash
# On server - add to crontab
0 2 * * * /home/gadgetbot/scripts/backup-db.sh
```

- Runs daily at 2 AM
- Keeps last 7 days
- Compressed SQL dumps

### Manual Backup

```bash
./scripts/backup-db.sh
```

### Restore

```bash
./scripts/restore-db.sh ~/backups/backup_20250117_020000.sql.gz
```

## Scaling Strategies

### Vertical Scaling (Easiest)
Upgrade VPS in Hetzner console:
- CPX11 → CPX21: Add 1 vCPU, 2GB RAM
- CPX21 → CPX31: Add 1 vCPU, 4GB RAM

Update resource limits in `docker-compose.prod.yml` accordingly.

### Horizontal Scaling (Advanced)
1. Add Hetzner Load Balancer
2. Run multiple app containers
3. Share PostgreSQL or use managed database

### Database Scaling
1. Separate database to dedicated VPS
2. Update `DATABASE_URL` to point to new host
3. Configure PostgreSQL for remote connections

## Cost Breakdown (2025 Updated Pricing)

| Deployment Method | Monthly | Annual | Notes |
|------------------|---------|--------|-------|
| **Coolify (CX23)** | €3.49 + domain | €42-57 | **Recommended** - 1-3 demo apps |
| **Coolify (CX33)** | €5.49 + domain | €66-81 | 4-8 apps or production |
| **Manual Docker (CX23)** | €3.49 + domain | €42-57 | Full control, CLI only |
| **Manual Docker (CX33)** | €5.49 + domain | €66-81 | More capacity |
| Domain | ~€1/month | €12-15 | One-time yearly |
| SSL Certificates | Free | Free | Let's Encrypt |
| Coolify Software | Free | Free | Self-hosted |

**Total with Coolify (CX23)**: €42-57/year all-inclusive for unlimited apps

**Key Advantage**: With Coolify, you can host multiple demo apps on one VPS:
- CX23 (€3.49/month): 3-4 apps
- CX33 (€5.49/month): 6-8 apps
- vs SaaS: $5-20/month **per app**

## Troubleshooting Quick Reference

| Problem | Solution |
|---------|----------|
| App won't start | Check logs: `docker compose logs app` |
| Database connection error | Verify `DATABASE_URL` matches `DB_PASSWORD` |
| SSL certificate error | Run `sudo certbot renew --force-renewal` |
| Zitadel won't start | Check database initialized: `docker compose logs zitadel` |
| Out of memory | Restart services, or upgrade VPS |
| Port already in use | Check for conflicting services: `sudo lsof -i :80` |

## Getting Help

- **Coolify Deployment**: [DEPLOYMENT_COOLIFY.md](./DEPLOYMENT_COOLIFY.md) ⭐ Recommended
- **Zitadel Deployment**: [ZITADEL_COOLIFY_COMPOSE.md](./ZITADEL_COOLIFY_COMPOSE.md)
- **Coolify Docs**: <https://coolify.io/docs>
- **Hetzner Docs**: <https://docs.hetzner.com>
- **Zitadel Docs**: <https://zitadel.com/docs>

## Quick Start

**Deploying GadgetBot with Coolify:**

1. Read [DEPLOYMENT_COOLIFY.md](./DEPLOYMENT_COOLIFY.md)
2. Get Hetzner VPS CX23 (€3.49/month)
3. Install Coolify (one command)
4. Deploy PostgreSQL database
5. Deploy Zitadel using [ZITADEL_COOLIFY_COMPOSE.md](./ZITADEL_COOLIFY_COMPOSE.md)
6. Deploy GadgetBot application via web UI

**Time estimate:** 1-2 hours first deployment

Good luck! 🚀
