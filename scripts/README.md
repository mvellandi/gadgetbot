# Deployment Scripts

Helper scripts for managing GadgetBot production deployment.

## Scripts Overview

| Script | Purpose | Where to Run |
|--------|---------|--------------|
| `deploy.sh` | Deploy updates to production | Local machine |
| `backup-db.sh` | Backup PostgreSQL database | Production server |
| `restore-db.sh` | Restore database from backup | Production server |
| `logs.sh` | Interactive log viewer | Production server |

---

## deploy.sh

**Deploy application updates to production**

### Usage (from local machine)

```bash
# Set your server IP/hostname
export SERVER_HOST=123.456.789.10

# Run deployment
./scripts/deploy.sh
```

Or as a one-liner:

```bash
SERVER_HOST=123.456.789.10 ./scripts/deploy.sh
```

### What it does

1. Syncs code to server (excluding node_modules, .env, etc.)
2. Builds new Docker image for app
3. Runs database migrations
4. Restarts application
5. Shows deployment status

### Configuration

Set these environment variables:

- `SERVER_HOST` - IP or hostname of your VPS (required)
- `SERVER_USER` - SSH user (default: `gadgetbot`)
- `SERVER_PATH` - Path on server (default: `~/gadgetbot`)

### Requirements

- `ssh` - SSH client
- `rsync` - File synchronization
- SSH key authentication configured

### Example

```bash
SERVER_HOST=gadgetbot.example.com ./scripts/deploy.sh
```

---

## backup-db.sh

**Create compressed backup of PostgreSQL database**

### Usage (on production server)

```bash
# Manual backup
./scripts/backup-db.sh
```

### What it does

1. Creates SQL dump of `gadgetbot` database
2. Compresses with gzip
3. Saves to `~/backups/` with timestamp
4. Removes backups older than 7 days

### Automated Backups

Add to crontab for daily backups:

```bash
crontab -e
```

Add this line:

```cron
0 2 * * * /home/gadgetbot/scripts/backup-db.sh
```

This runs daily at 2 AM.

### Output

Backups are saved as:

```
~/backups/gadgetbot_backup_20250117_020000.sql.gz
```

### Configuration

Edit script to change:

- `BACKUP_DIR` - Where to save backups (default: `~/backups`)
- `RETENTION_DAYS` - How long to keep backups (default: 7)

---

## restore-db.sh

**Restore database from backup file**

### Usage (on production server)

```bash
# List available backups
./scripts/restore-db.sh

# Restore specific backup
./scripts/restore-db.sh ~/backups/gadgetbot_backup_20250117_020000.sql.gz
```

### What it does

1. Stops application (prevents writes during restore)
2. Decompresses backup if gzipped
3. Restores database from SQL dump
4. Restarts application

### ⚠️ Warning

This will **overwrite** your current database. Make sure you have a backup of current state before restoring!

### Example

```bash
# Create safety backup first
./scripts/backup-db.sh

# Then restore
./scripts/restore-db.sh ~/backups/gadgetbot_backup_20250117_020000.sql.gz
```

---

## logs.sh

**Interactive log viewer for production services**

### Usage (on production server)

```bash
./scripts/logs.sh
```

### What it does

Provides a menu to view logs for:

1. All services
2. Application only
3. Database only
4. Zitadel only
5. Nginx only

### Keyboard Shortcuts

- `Ctrl+C` - Exit current logs
- `Enter` - Return to menu
- Number keys - Select option

### Direct Log Commands

You can also view logs directly:

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f postgres
docker compose -f docker-compose.prod.yml logs -f zitadel
docker compose -f docker-compose.prod.yml logs -f nginx

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100 app

# Since specific time
docker compose -f docker-compose.prod.yml logs --since 2024-01-17T10:00:00 app
```

---

## Common Workflows

### Initial Deployment

Run these on production server after SSH:

```bash
# 1. Clone repository
git clone https://github.com/yourusername/gadgetbot.git
cd gadgetbot

# 2. Create environment file
cp .env.production.example .env.production
nano .env.production  # Fill in values

# 3. Build and start services
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# 4. Run migrations
docker compose -f docker-compose.prod.yml exec app npm run db:migrate

# 5. Setup automated backups
crontab -e
# Add: 0 2 * * * /home/gadgetbot/scripts/backup-db.sh
```

### Update Application

From local machine:

```bash
# Deploy latest code
SERVER_HOST=your-server ./scripts/deploy.sh
```

### Daily Monitoring

On production server:

```bash
# Check service status
docker compose -f docker-compose.prod.yml ps

# View recent logs
./scripts/logs.sh

# Check disk space
df -h

# Check resource usage
docker stats
```

### Database Maintenance

On production server:

```bash
# Create backup
./scripts/backup-db.sh

# Check database size
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('gadgetbot'));"

# Vacuum database (optimize)
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U postgres -d gadgetbot -c "VACUUM ANALYZE;"
```

---

## Troubleshooting

### deploy.sh fails to connect

```bash
# Test SSH connection
ssh gadgetbot@YOUR_SERVER_IP

# Check if rsync is installed
which rsync

# Verify SSH key is added
ssh-add -l
```

### backup-db.sh fails

```bash
# Check if backup directory exists
ls -la ~/backups

# Check database container is running
docker ps | grep postgres

# Test database connection
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U postgres -d gadgetbot -c "SELECT 1;"
```

### restore-db.sh fails

```bash
# Check backup file exists and is readable
ls -lh ~/backups/your-backup-file.sql.gz

# Verify you have enough disk space
df -h

# Check database container is healthy
docker compose -f docker-compose.prod.yml ps postgres
```

### logs.sh shows "permission denied"

```bash
# Make script executable
chmod +x scripts/logs.sh

# Check Docker permissions
docker ps
# If denied: sudo usermod -aG docker $USER
# Then logout and login again
```

---

## Script Maintenance

### Updating Scripts

If you modify scripts locally, redeploy them:

```bash
# From local machine
scp scripts/*.sh gadgetbot@YOUR_SERVER_IP:~/gadgetbot/scripts/

# Then on server
chmod +x scripts/*.sh
```

### Adding Custom Scripts

Follow this pattern:

```bash
#!/bin/bash
set -e  # Exit on error

# Configuration
COMPOSE_FILE=~/gadgetbot/docker-compose.prod.yml

# Your script logic here

echo "Done!"
```

---

## Security Notes

- Scripts use `docker compose exec -T` for non-interactive execution
- Backup files contain sensitive data - restrict permissions:
  ```bash
  chmod 700 ~/backups
  chmod 600 ~/backups/*.sql.gz
  ```
- Never commit `.env.production` or backup files to Git
- Use SSH keys, not passwords, for server access

---

## Getting Help

- **Deployment Guide**: [../docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md)
- **Checklist**: [../docs/DEPLOYMENT_CHECKLIST.md](../docs/DEPLOYMENT_CHECKLIST.md)
- **Summary**: [../docs/DEPLOYMENT_SUMMARY.md](../docs/DEPLOYMENT_SUMMARY.md)

For issues, check the troubleshooting sections in the main deployment guide.
