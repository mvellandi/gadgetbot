# GadgetBot Deployment Guide - Hetzner VPS

This guide walks you through deploying GadgetBot (app + database + Zitadel) to a Hetzner VPS using Docker Compose. No prior Docker deployment experience required!

## Table of Contents

- [Prerequisites](#prerequisites)
- [Step 1: Get a Hetzner VPS](#step-1-get-a-hetzner-vps)
- [Step 2: Initial Server Setup](#step-2-initial-server-setup)
- [Step 3: Install Docker](#step-3-install-docker)
- [Step 4: Configure DNS](#step-4-configure-dns)
- [Step 5: Deploy Application](#step-5-deploy-application)
- [Step 6: Setup SSL Certificates](#step-6-setup-ssl-certificates)
- [Step 7: Configure Zitadel](#step-7-configure-zitadel)
- [Step 8: Run Database Migrations](#step-8-run-database-migrations)
- [Maintenance](#maintenance)
- [Troubleshooting](#troubleshooting)
- [Scaling & Costs](#scaling--costs)

---

## Prerequisites

Before starting, you'll need:

- **Domain names**: Two domains or subdomains:
  - One for your app (e.g., `gadgetbot.yourdomain.com`)
  - One for Zitadel (e.g., `auth.yourdomain.com`)
- **Local machine**: With SSH client installed
- **Code repository**: Your GadgetBot code (can use Git or manual upload)

---

## Step 1: Get a Hetzner VPS

### 1.1 Create Hetzner Account

1. Go to [Hetzner Cloud](https://www.hetzner.com/cloud)
2. Sign up for an account
3. Verify your email

### 1.2 Create a Project

1. Log in to [Hetzner Cloud Console](https://console.hetzner.cloud/)
2. Click "New Project"
3. Name it (e.g., "GadgetBot Production")

### 1.3 Create a Server

1. Click "Add Server"
2. Choose location (closest to your users)
3. Select image: **Ubuntu 22.04**
4. Select type (2025 pricing):
   - **Recommended for demo**: CX22 (2 vCPU, 4GB RAM, 40GB SSD) - €3.79/month
   - **For better performance**: CX32 (4 vCPU, 8GB RAM, 80GB SSD) - €6.80/month
   - **Production (AMD EPYC)**: CPX11 (2 vCPU, 4GB RAM, AMD) - €4.35/month
5. Add SSH key:
   - If you don't have one, generate locally:
     ```bash
     ssh-keygen -t ed25519 -C "your_email@example.com"
     cat ~/.ssh/id_ed25519.pub  # Copy this
     ```
   - Paste your public key in Hetzner
6. Name your server (e.g., "gadgetbot-prod")
7. Click "Create & Buy now"

### 1.4 Note Your Server IP

After creation, note your server's public IP address (e.g., `123.456.789.10`)

**Cost Estimate**: €3.79-6.80/month for VPS (CX22 is perfect for demos)

---

## Step 2: Initial Server Setup

### 2.1 Connect to Server

```bash
ssh root@YOUR_SERVER_IP
```

### 2.2 Update System

```bash
apt update && apt upgrade -y
```

### 2.3 Create Non-Root User

```bash
# Create user
adduser gadgetbot

# Add to sudo group
usermod -aG sudo gadgetbot

# Setup SSH for new user
mkdir -p /home/gadgetbot/.ssh
cp ~/.ssh/authorized_keys /home/gadgetbot/.ssh/
chown -R gadgetbot:gadgetbot /home/gadgetbot/.ssh
chmod 700 /home/gadgetbot/.ssh
chmod 600 /home/gadgetbot/.ssh/authorized_keys
```

### 2.4 Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw --force enable

# Check status
ufw status
```

### 2.5 Switch to New User

```bash
# Exit and reconnect as new user
exit
ssh gadgetbot@YOUR_SERVER_IP
```

---

## Step 3: Install Docker

### 3.1 Install Docker Engine

```bash
# Install prerequisites
sudo apt install -y ca-certificates curl gnupg

# Add Docker's GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 3.2 Configure Docker for Non-Root

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Apply group changes
newgrp docker

# Test Docker
docker run hello-world
```

---

## Step 4: Configure DNS

Point your domains to your server IP:

### 4.1 Add DNS Records

In your DNS provider (Cloudflare, Namecheap, etc.):

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | gadgetbot | YOUR_SERVER_IP | 300 |
| A | auth | YOUR_SERVER_IP | 300 |

Or if using subdomains:
| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | gadgetbot.yourdomain.com | YOUR_SERVER_IP | 300 |
| A | auth.yourdomain.com | YOUR_SERVER_IP | 300 |

### 4.2 Verify DNS Propagation

```bash
# On your local machine
nslookup gadgetbot.yourdomain.com
nslookup auth.yourdomain.com
```

Wait for DNS to propagate (usually 5-30 minutes).

---

## Step 5: Deploy Application

### 5.1 Upload Code to Server

**Option A: Using Git (Recommended)**

```bash
# On server
cd ~
git clone https://github.com/yourusername/gadgetbot.git
cd gadgetbot
```

**Option B: Using SCP**

```bash
# On your local machine
cd /path/to/gadgetbot
rsync -avz --exclude 'node_modules' --exclude '.git' . gadgetbot@YOUR_SERVER_IP:~/gadgetbot/
```

### 5.2 Create Environment File

```bash
# On server
cd ~/gadgetbot
nano .env.production
```

See the [Environment Configuration Guide](#environment-configuration) below for all variables.

### 5.3 Build and Start Services

```bash
# Build application
docker compose -f docker-compose.prod.yml build

# Start all services (without SSL initially)
docker compose -f docker-compose.prod.yml up -d postgres zitadel app
```

### 5.4 Check Status

```bash
# View running containers
docker ps

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Check individual service
docker compose -f docker-compose.prod.yml logs -f app
```

---

## Step 6: Setup SSL Certificates

### 6.1 Initial Certificate Generation

First, we need to obtain certificates using certbot's standalone mode:

```bash
# Stop nginx if running
docker compose -f docker-compose.prod.yml down nginx

# Install certbot locally (temporary)
sudo apt install -y certbot

# Obtain certificates for app domain
sudo certbot certonly --standalone \
  --preferred-challenges http \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d gadgetbot.yourdomain.com

# Obtain certificates for Zitadel domain
sudo certbot certonly --standalone \
  --preferred-challenges http \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d auth.yourdomain.com
```

### 6.2 Copy Certificates to Docker Volume

```bash
# Create certbot directories
mkdir -p ~/gadgetbot/certbot/conf
mkdir -p ~/gadgetbot/certbot/www

# Copy certificates
sudo cp -r /etc/letsencrypt/* ~/gadgetbot/certbot/conf/
sudo chown -R gadgetbot:gadgetbot ~/gadgetbot/certbot
```

### 6.3 Update Nginx Configuration

```bash
cd ~/gadgetbot

# Replace placeholders in nginx config
sed -i "s/\${APP_DOMAIN}/gadgetbot.yourdomain.com/g" nginx/conf.d/default.conf
sed -i "s/\${ZITADEL_DOMAIN}/auth.yourdomain.com/g" nginx/conf.d/default.conf
```

### 6.4 Start Nginx

```bash
# Start nginx and certbot services
docker compose -f docker-compose.prod.yml up -d nginx certbot

# Check nginx logs
docker compose -f docker-compose.prod.yml logs -f nginx
```

### 6.5 Test SSL

Visit your domains in a browser:
- `https://gadgetbot.yourdomain.com` - Should show your app
- `https://auth.yourdomain.com` - Should show Zitadel

---

## Step 7: Configure Zitadel

### 7.1 Access Zitadel Console

1. Open `https://auth.yourdomain.com`
2. Login with credentials from `.env.production`:
   - Username: Value of `ZITADEL_ADMIN_USERNAME`
   - Password: Value of `ZITADEL_ADMIN_PASSWORD`

### 7.2 Create OAuth Application

Follow the same steps as local setup (from [AUTH_SETUP.md](./AUTH_SETUP.md)):

1. Go to "Projects" → "GadgetBot" (or create new project)
2. Create new application:
   - **Name**: GadgetBot Production
   - **Type**: Web
   - **Authentication Method**: PKCE
3. Configure redirect URIs:
   - `https://gadgetbot.yourdomain.com/api/auth/callback/oidc`
4. Save **Client ID** and **Client Secret**

### 7.3 Update Environment Variables

```bash
cd ~/gadgetbot
nano .env.production
```

Update these values:
```env
ZITADEL_CLIENT_ID=your-production-client-id
ZITADEL_CLIENT_SECRET=your-production-client-secret
```

### 7.4 Restart Application

```bash
docker compose -f docker-compose.prod.yml restart app
```

---

## Step 8: Run Database Migrations

### 8.1 Execute Migrations

```bash
# Run migrations inside app container
docker compose -f docker-compose.prod.yml exec app npm run db:migrate

# Seed database (optional)
docker compose -f docker-compose.prod.yml exec app npm run db:seed
```

### 8.2 Verify Database

```bash
# Connect to database
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d gadgetbot

# In psql:
\dt  # List tables
SELECT * FROM gadgetbots LIMIT 5;
\q   # Exit
```

---

## Environment Configuration

Create `.env.production` with these variables:

```env
# ============================================================================
# Database Configuration
# ============================================================================
DB_USER=postgres
DB_PASSWORD=GENERATE_STRONG_PASSWORD_HERE

# ============================================================================
# Application Configuration
# ============================================================================
NODE_ENV=production
APP_URL=https://gadgetbot.yourdomain.com
APP_DOMAIN=gadgetbot.yourdomain.com

# Database URL (used by app)
DATABASE_URL=postgresql://postgres:SAME_DB_PASSWORD_HERE@postgres:5432/gadgetbot

# ============================================================================
# Better Auth Configuration
# ============================================================================
BETTER_AUTH_SECRET=GENERATE_32_CHAR_SECRET_HERE
BETTER_AUTH_URL=https://gadgetbot.yourdomain.com

# ============================================================================
# Zitadel Configuration
# ============================================================================
ZITADEL_DOMAIN=auth.yourdomain.com
ZITADEL_MASTERKEY=GENERATE_32_CHAR_SECRET_HERE
ZITADEL_ISSUER=https://auth.yourdomain.com

# Admin user (first-time setup)
ZITADEL_ADMIN_USERNAME=admin
ZITADEL_ADMIN_PASSWORD=GENERATE_STRONG_PASSWORD_HERE
ZITADEL_ADMIN_EMAIL=admin@yourdomain.com

# OAuth credentials (get these from Zitadel console after setup)
ZITADEL_CLIENT_ID=your-client-id-here
ZITADEL_CLIENT_SECRET=your-client-secret-here
```

### Generate Strong Secrets

```bash
# Generate 32-character secrets
openssl rand -base64 32

# Generate strong passwords
openssl rand -base64 24
```

---

## Maintenance

### Daily Operations

**View Logs:**
```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f postgres
docker compose -f docker-compose.prod.yml logs -f zitadel
```

**Restart Services:**
```bash
# Restart all
docker compose -f docker-compose.prod.yml restart

# Restart specific service
docker compose -f docker-compose.prod.yml restart app
```

**Update Application:**
```bash
cd ~/gadgetbot

# Pull latest code
git pull

# Rebuild and restart
docker compose -f docker-compose.prod.yml build app
docker compose -f docker-compose.prod.yml up -d app

# Run migrations if needed
docker compose -f docker-compose.prod.yml exec app npm run db:migrate
```

### Database Backups

**Manual Backup:**
```bash
# Create backup
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres gadgetbot > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Automated Backups (Recommended):**
```bash
# Create backup script
cat > ~/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=~/backups
mkdir -p $BACKUP_DIR
cd ~/gadgetbot
docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres gadgetbot > $BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
EOF

chmod +x ~/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add this line:
0 2 * * * /home/gadgetbot/backup-db.sh
```

**Restore from Backup:**
```bash
# Stop app
docker compose -f docker-compose.prod.yml stop app

# Restore database
docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres gadgetbot < backup_20250117_020000.sql

# Restart app
docker compose -f docker-compose.prod.yml start app
```

### SSL Certificate Renewal

Certificates auto-renew via the certbot container. To manually renew:

```bash
docker compose -f docker-compose.prod.yml exec certbot certbot renew
docker compose -f docker-compose.prod.yml restart nginx
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs app

# Check if database is ready
docker compose -f docker-compose.prod.yml exec postgres pg_isready

# Restart services in order
docker compose -f docker-compose.prod.yml restart postgres
docker compose -f docker-compose.prod.yml restart zitadel
docker compose -f docker-compose.prod.yml restart app
```

### Database Connection Errors

```bash
# Verify database is running
docker compose -f docker-compose.prod.yml ps postgres

# Test connection
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d gadgetbot -c "SELECT 1"

# Check DATABASE_URL in .env.production
# Should be: postgresql://postgres:PASSWORD@postgres:5432/gadgetbot
```

### SSL Certificate Issues

```bash
# Check certificate expiry
sudo certbot certificates

# Force renewal
docker compose -f docker-compose.prod.yml exec certbot certbot renew --force-renewal
docker compose -f docker-compose.prod.yml restart nginx

# Check nginx config
docker compose -f docker-compose.prod.yml exec nginx nginx -t
```

### Zitadel Won't Start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs zitadel

# Common issue: database not initialized
# Restart in order:
docker compose -f docker-compose.prod.yml restart postgres
sleep 10
docker compose -f docker-compose.prod.yml restart zitadel
```

### Out of Memory

```bash
# Check memory usage
free -h
docker stats

# Restart services one at a time
docker compose -f docker-compose.prod.yml restart app

# If persistent, upgrade VPS plan
```

### Port Already in Use

```bash
# Check what's using port 80/443
sudo lsof -i :80
sudo lsof -i :443

# Kill conflicting process
sudo systemctl stop apache2  # Example if Apache is running
```

---

## Scaling & Costs

### Cost Breakdown

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| Hetzner VPS (CPX11) | €4.15 | 2 vCPU, 2GB RAM |
| Hetzner VPS (CPX21) | €8.90 | 3 vCPU, 4GB RAM |
| Domain name | €10-15/year | One-time annual |
| SSL certificates | Free | Let's Encrypt |

**Total**: €4-9/month + domain

### When to Upgrade

**Upgrade to CPX21 (€8.90/month) if:**
- Memory usage consistently > 80%
- Response times degrading
- Supporting 100+ concurrent users

**Upgrade to CPX31 (€15.90/month) if:**
- Memory usage > 80% on CPX21
- Database queries slowing down
- Supporting 500+ concurrent users

**Consider separate database server if:**
- Database CPU usage > 70%
- Large dataset (10GB+)
- Running complex queries

### Scaling Options

**Vertical Scaling (Easiest):**
```bash
# In Hetzner console:
# Server → Resize → Select larger plan → Resize
# No data loss, minimal downtime
```

**Horizontal Scaling (Advanced):**
1. Add Hetzner Load Balancer (€5.83/month)
2. Run multiple app instances
3. Separate database to managed service or dedicated server

**Database Scaling:**
1. Move to Hetzner's managed PostgreSQL (when available)
2. Or: Create separate VPS for database
3. Update `DATABASE_URL` in app to point to new database server

---

## Security Checklist

- [ ] Strong passwords for all services
- [ ] Firewall enabled (UFW)
- [ ] SSH key authentication only (disable password auth)
- [ ] SSL certificates installed and auto-renewing
- [ ] Regular database backups automated
- [ ] Non-root user for operations
- [ ] Environment variables not committed to Git
- [ ] Zitadel admin password changed from default
- [ ] Database not exposed to public internet

---

## Quick Reference Commands

```bash
# Start all services
docker compose -f docker-compose.prod.yml up -d

# Stop all services
docker compose -f docker-compose.prod.yml down

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Restart application
docker compose -f docker-compose.prod.yml restart app

# Run migrations
docker compose -f docker-compose.prod.yml exec app npm run db:migrate

# Backup database
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres gadgetbot > backup.sql

# Restore database
docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres gadgetbot < backup.sql

# Check certificate expiry
sudo certbot certificates

# SSH to server
ssh gadgetbot@YOUR_SERVER_IP
```

---

## Next Steps

After successful deployment:

1. **Test authentication** - Login via Zitadel
2. **Monitor logs** - Watch for errors in first 24 hours
3. **Setup monitoring** - Consider Uptime Robot (free tier available)
4. **Configure backups** - Automate database backups
5. **Document admin procedures** - Keep your own notes
6. **Setup alerts** - Email notifications for downtime

---

## Getting Help

- **Hetzner Support**: support@hetzner.com
- **Docker Docs**: https://docs.docker.com
- **Zitadel Docs**: https://zitadel.com/docs
- **Better Auth Docs**: https://www.better-auth.com/docs
- **GitHub Issues**: File issues in your repository

**Common Resources:**
- [Hetzner Community Tutorials](https://community.hetzner.com/tutorials)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
