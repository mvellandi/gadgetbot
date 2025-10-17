#!/bin/bash

# GadgetBot Deployment Script
# This script helps deploy updates to your production server

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVER_USER=${SERVER_USER:-gadgetbot}
SERVER_HOST=${SERVER_HOST}
SERVER_PATH=${SERVER_PATH:-~/gadgetbot}

# Functions
print_step() {
    echo -e "\n${GREEN}==>${NC} $1"
}

print_error() {
    echo -e "${RED}Error:${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}Warning:${NC} $1"
}

check_requirements() {
    print_step "Checking requirements..."

    if [ -z "$SERVER_HOST" ]; then
        print_error "SERVER_HOST environment variable not set"
        echo "Usage: SERVER_HOST=your-server-ip ./scripts/deploy.sh"
        exit 1
    fi

    if ! command -v ssh &> /dev/null; then
        print_error "ssh command not found. Please install OpenSSH client."
        exit 1
    fi

    if ! command -v rsync &> /dev/null; then
        print_error "rsync command not found. Please install rsync."
        exit 1
    fi
}

sync_code() {
    print_step "Syncing code to server..."

    rsync -avz \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude '.output' \
        --exclude '.vinxi' \
        --exclude '.env*' \
        --exclude 'certbot' \
        --exclude 'postgres_data' \
        --progress \
        . ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/

    echo "Code synced successfully!"
}

run_remote_commands() {
    print_step "Running deployment commands on server..."

    ssh ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
        set -e
        cd ~/gadgetbot

        echo "Building application..."
        docker compose -f docker-compose.prod.yml build app

        echo "Running database migrations..."
        docker compose -f docker-compose.prod.yml exec -T app npm run db:migrate || true

        echo "Restarting application..."
        docker compose -f docker-compose.prod.yml up -d app

        echo "Waiting for health check..."
        sleep 5

        echo "Checking container status..."
        docker compose -f docker-compose.prod.yml ps

        echo ""
        echo "Deployment complete!"
        echo "View logs with: docker compose -f docker-compose.prod.yml logs -f app"
ENDSSH
}

# Main execution
main() {
    echo "GadgetBot Production Deployment"
    echo "==============================="
    echo ""

    check_requirements

    # Confirm deployment
    read -p "Deploy to ${SERVER_HOST}? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Deployment cancelled"
        exit 0
    fi

    sync_code
    run_remote_commands

    print_step "Deployment successful!"
    echo ""
    echo "Next steps:"
    echo "  - Check logs: ssh ${SERVER_USER}@${SERVER_HOST} 'cd ~/gadgetbot && docker compose -f docker-compose.prod.yml logs -f'"
    echo "  - Visit: https://your-domain.com"
}

main
