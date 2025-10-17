# GadgetBot Deployment Checklist

Use this checklist to ensure a smooth deployment to production.

## Pre-Deployment

### Local Preparation
- [ ] All tests passing: `npm run test`
- [ ] Application builds successfully: `npm run build`
- [ ] Database migrations tested locally
- [ ] Environment variables documented
- [ ] No secrets in Git history

### Domain & DNS
- [ ] Two domains purchased/configured:
  - [ ] App domain (e.g., `gadgetbot.yourdomain.com`)
  - [ ] Auth domain (e.g., `auth.yourdomain.com`)
- [ ] DNS A records pointing to server IP
- [ ] DNS propagation verified with `nslookup`

### Hetzner VPS
- [ ] VPS created and running
- [ ] Server IP address noted
- [ ] SSH key added to server
- [ ] Non-root user created (`gadgetbot`)
- [ ] Firewall configured (ports 22, 80, 443)
- [ ] Docker installed and tested

## Deployment Day

### 1. Code Upload
- [ ] Code uploaded to server (Git or rsync)
- [ ] `.env.production` created with all variables
- [ ] Secrets generated and added to `.env.production`

### 2. Docker Services
- [ ] PostgreSQL started and healthy
- [ ] Zitadel started and initialized
- [ ] Application built successfully
- [ ] All containers running: `docker ps`

### 3. SSL Certificates
- [ ] Certbot certificates obtained for app domain
- [ ] Certbot certificates obtained for auth domain
- [ ] Certificates copied to Docker volumes
- [ ] Nginx configuration updated with domains
- [ ] Nginx started and serving HTTPS

### 4. Zitadel Configuration
- [ ] Zitadel console accessible at `https://auth.yourdomain.com`
- [ ] Admin login working
- [ ] OAuth application created
- [ ] Redirect URIs configured
- [ ] Client ID and Secret saved
- [ ] `.env.production` updated with OAuth credentials
- [ ] Application restarted with new credentials

### 5. Database Setup
- [ ] Migrations executed successfully
- [ ] Database seeded (if needed)
- [ ] Database connection verified from app
- [ ] Test data visible in app

### 6. Application Testing
- [ ] Homepage loads at `https://gadgetbot.yourdomain.com`
- [ ] Login flow works end-to-end
- [ ] Admin routes accessible (with auth)
- [ ] Public routes accessible (without auth)
- [ ] API endpoints responding correctly

## Post-Deployment

### Monitoring Setup
- [ ] Application logs readable: `docker compose logs -f`
- [ ] Database logs readable
- [ ] Zitadel logs readable
- [ ] SSL certificate expiry scheduled (auto-renew)
- [ ] Uptime monitoring configured (optional)

### Backup Configuration
- [ ] Database backup script created
- [ ] Cron job scheduled for daily backups
- [ ] Test backup created manually
- [ ] Test restore performed
- [ ] Backup retention policy set (7 days)

### Security Hardening
- [ ] Strong passwords used everywhere
- [ ] SSH password authentication disabled
- [ ] Firewall rules verified
- [ ] Database not exposed publicly
- [ ] Environment file permissions set (600)
- [ ] Docker containers running as non-root

### Documentation
- [ ] Deployment process documented
- [ ] Admin credentials stored securely (password manager)
- [ ] Recovery procedures documented
- [ ] Team members notified of new production URL

## Operational Readiness

### Weekly Tasks
- [ ] Review application logs for errors
- [ ] Check disk space: `df -h`
- [ ] Review backup logs
- [ ] Monitor resource usage: `docker stats`

### Monthly Tasks
- [ ] Review and update dependencies
- [ ] Check SSL certificate expiry
- [ ] Review database size and performance
- [ ] Check for security updates

### As Needed
- [ ] Deploy updates using `./scripts/deploy.sh`
- [ ] Scale VPS if resource usage > 80%
- [ ] Update documentation as processes change

## Emergency Contacts

- **Hetzner Support**: support@hetzner.com
- **Domain Registrar**: _[Your registrar support]_
- **Team Lead**: _[Name/Contact]_

## Rollback Plan

If deployment fails:

1. **Application issues**:
   ```bash
   docker compose -f docker-compose.prod.yml down app
   # Fix issue locally, rebuild
   docker compose -f docker-compose.prod.yml build app
   docker compose -f docker-compose.prod.yml up -d app
   ```

2. **Database issues**:
   ```bash
   # Restore from latest backup
   ./scripts/restore-db.sh ~/backups/backup_YYYYMMDD_HHMMSS.sql.gz
   ```

3. **Complete rollback**:
   ```bash
   docker compose -f docker-compose.prod.yml down
   # Restore previous working version
   git checkout previous-tag
   docker compose -f docker-compose.prod.yml up -d
   ```

## Success Criteria

Deployment is successful when:

- ✅ All services running without errors
- ✅ Users can login via Zitadel
- ✅ Admin can access protected routes
- ✅ Data persists across restarts
- ✅ SSL certificates valid
- ✅ Backups running automatically
- ✅ Logs accessible and monitored

---

**Deployment Date**: _____________

**Deployed By**: _____________

**Production URL**: https://gadgetbot.yourdomain.com

**Auth URL**: https://auth.yourdomain.com

**Notes**:

_____________________________________________

_____________________________________________

_____________________________________________
