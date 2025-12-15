#!/bin/bash

# Database Backup Script for Production
# Run this on the VPS server via cron or manually

set -e

# Configuration
BACKUP_DIR=~/backups
COMPOSE_FILE=~/gadgetbot/docker-compose.prod.yml
RETENTION_DAYS=7

# Create backup directory
mkdir -p $BACKUP_DIR

# Generate backup filename with timestamp
BACKUP_FILE="$BACKUP_DIR/gadgetbot_backup_$(date +%Y%m%d_%H%M%S).sql"

# Create backup
echo "Creating database backup..."
cd ~/gadgetbot
docker compose -f $COMPOSE_FILE exec -T postgres pg_dump -U postgres gadgetbot > $BACKUP_FILE

# Compress backup
echo "Compressing backup..."
gzip $BACKUP_FILE

# Remove old backups
echo "Cleaning old backups (older than $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "gadgetbot_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Show backup info
BACKUP_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
echo "Backup created: ${BACKUP_FILE}.gz (${BACKUP_SIZE})"
echo "Total backups: $(ls -1 $BACKUP_DIR/gadgetbot_backup_*.sql.gz | wc -l)"
