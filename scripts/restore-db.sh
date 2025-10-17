#!/bin/bash

# Database Restore Script for Production
# Run this on the VPS server to restore from backup

set -e

# Configuration
BACKUP_DIR=~/backups
COMPOSE_FILE=~/gadgetbot/docker-compose.prod.yml

# Check for backup file argument
if [ -z "$1" ]; then
    echo "Usage: ./restore-db.sh <backup_file>"
    echo ""
    echo "Available backups:"
    ls -lh $BACKUP_DIR/gadgetbot_backup_*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE=$1

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Confirm restoration
echo "WARNING: This will restore the database from backup"
echo "Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? (yes/NO) " -r
if [[ ! $REPLY =~ ^yes$ ]]; then
    echo "Restoration cancelled"
    exit 0
fi

# Stop application
echo "Stopping application..."
cd ~/gadgetbot
docker compose -f $COMPOSE_FILE stop app

# Decompress if needed
RESTORE_FILE=$BACKUP_FILE
if [[ $BACKUP_FILE == *.gz ]]; then
    echo "Decompressing backup..."
    RESTORE_FILE="${BACKUP_FILE%.gz}"
    gunzip -c $BACKUP_FILE > $RESTORE_FILE
fi

# Restore database
echo "Restoring database..."
docker compose -f $COMPOSE_FILE exec -T postgres psql -U postgres gadgetbot < $RESTORE_FILE

# Clean up decompressed file if we created it
if [[ $BACKUP_FILE == *.gz ]]; then
    rm $RESTORE_FILE
fi

# Restart application
echo "Restarting application..."
docker compose -f $COMPOSE_FILE start app

echo ""
echo "Database restored successfully!"
echo "Check application logs: docker compose -f $COMPOSE_FILE logs -f app"
