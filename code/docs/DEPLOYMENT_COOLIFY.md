# Coolify Setup Guide

This guide covers installing and configuring Coolify on a VPS for deploying Docker applications.

## What is Coolify?

**Coolify is a free, open-source, self-hosted PaaS** (Platform as a Service) that you install on your own VPS. Think of it as "Vercel/Heroku, but you own everything."

**Key Features:**

- 🖥️ **Web UI** for deployment management
- 🔐 **Automatic SSL** with Let's Encrypt
- 🔄 **Git integration** with auto-deploy on push
- 📊 **Built-in monitoring** and resource graphs
- 🗄️ **Database management** with one-click backups
- 📝 **Log aggregation** across all services
- 🚀 **Zero-downtime deployments**

## Prerequisites

Before starting, you'll need:

- **VPS** with Ubuntu 22.04+ (any provider: Hetzner, DigitalOcean, AWS, etc.)
- **Root SSH access** to the server
- **Domain name** (or subdomains) pointing to your VPS
- **1-2 hours** for initial setup

## Step 1: Prepare Your VPS

### 1.1 SSH to Your Server

```bash
ssh root@YOUR_SERVER_IP
```

### 1.2 Update System

```bash
apt update && apt upgrade -y
```

### 1.3 Configure Firewall

```bash
# Allow HTTP, HTTPS, SSH, and Coolify dashboard
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 8000/tcp  # Coolify dashboard
ufw allow 6001/tcp  # Coolify real-time (WebSocket)

# Enable firewall
ufw --force enable

# Check status
ufw status
```

## Step 2: Install Coolify

### 2.1 Run Installation Script

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

**What this does:**

- Installs Docker and Docker Compose
- Installs Coolify and its dependencies
- Sets up Traefik reverse proxy
- Configures PostgreSQL for Coolify's database
- Sets up automatic SSL with Let's Encrypt
- Starts Coolify dashboard on port 8000

**Installation takes ~5 minutes.** You'll see a success message when done.

### 2.2 Verify Installation

```bash
# Check if Coolify is running
docker ps | grep coolify

# Check Coolify logs
docker logs -f coolify
```

## Step 3: Initial Coolify Setup

### 3.1 Access Coolify Dashboard

Open your browser to:

```
http://YOUR_SERVER_IP:8000
```

You'll see the Coolify welcome screen.

### 3.2 Create Admin Account

1. **Email**: your-email@example.com (stored locally, not sent anywhere)
2. **Password**: Create a strong password (this is local to YOUR server)
3. Click "Register"

**Important:** This is NOT a signup for a service. This account is stored only on YOUR VPS.

### 3.3 Initial Configuration

After logging in, complete the setup wizard:

1. **Server Setup**:
   - Coolify auto-detects your server
   - Name it "Production"
   - Click "Validate Server"

2. **Email Settings** (optional, for notifications):
   - Skip for now or configure SMTP later
   - Settings → Notifications → Email

3. **Update Coolify** (if prompted):
   - Click "Update" to get the latest version
   - Wait for update to complete

## Step 4: Configure DNS

### 4.1 Add DNS Records

In your DNS provider (Cloudflare, Namecheap, etc.), create A records pointing to your VPS:

**Example for GadgetBot:**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | gadgetbot.yourdomain.com | YOUR_SERVER_IP | 300 |
| A | auth.yourdomain.com | YOUR_SERVER_IP | 300 |
| A | coolify.yourdomain.com | YOUR_SERVER_IP | 300 |

**Or using subdomains only:**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | gadgetbot | YOUR_SERVER_IP | 300 |
| A | auth | YOUR_SERVER_IP | 300 |
| A | coolify | YOUR_SERVER_IP | 300 |

### 4.2 Verify DNS Propagation

```bash
# On your local machine
nslookup gadgetbot.yourdomain.com
nslookup auth.yourdomain.com
nslookup coolify.yourdomain.com
```

Wait for DNS to propagate (usually 5-30 minutes).

### 4.3 Setup Coolify Domain (Optional but Recommended)

In Coolify dashboard:

1. Go to **Settings** → **Configuration**
2. Set **Instance's Domain**: `coolify.yourdomain.com`
3. Click **Save**
4. Wait for SSL to provision (~1 minute)
5. Access Coolify at: `https://coolify.yourdomain.com`

## Coolify Features Overview

### Creating Resources

In Coolify dashboard, click **+ New** to create:

- **Application** - Deploy from Git repository or Docker image
- **Database** - PostgreSQL, MySQL, MongoDB, Redis, etc.
- **Service** - Docker Compose stacks
- **Team** - Manage team access (if needed)

### Application Deployment

**From Git Repository:**

1. Click **+ New** → **Application** → **Public Git Repository**
2. Enter repository URL
3. Configure:
   - **Branch**: `main`
   - **Build Pack**: Dockerfile or Nixpacks (auto-detect)
   - **Domain**: `app.yourdomain.com`
   - **Port**: Your app's port (e.g., 3000)
4. Add environment variables
5. Click **Deploy**

**Auto-Deploy on Git Push:**

1. Go to application → **Webhooks** tab
2. Copy webhook URL
3. Add to your Git provider (GitHub, GitLab, etc.)
4. Now `git push` triggers deployment automatically

### Database Management

**Create Database:**

1. Click **+ New** → **Database** → Select type (PostgreSQL, etc.)
2. Configure:
   - **Name**: `my-app-db`
   - **Version**: Latest stable
   - **Password**: Auto-generated (or custom)
3. Click **Save**
4. Copy connection string from database details

**Backups:**

1. Go to database resource → **Backups** tab
2. Configure automated backups:
   - **Frequency**: Daily/Weekly
   - **Retention**: Number of days
   - **Destination**: Local or S3
3. Manual backup: Click **Backup Now**

### Monitoring & Logs

**Resource Usage:**

- Dashboard shows CPU/RAM/Disk for all resources
- Click on any resource for detailed graphs

**Logs:**

1. Go to resource (app, database, service)
2. Click **Logs** tab
3. Real-time log streaming with filtering

**Alerts:**

1. Go to **Settings** → **Notifications**
2. Configure email/Discord/Slack
3. Set thresholds (memory, disk, failures)

### SSL Certificates

**Automatic (Let's Encrypt):**

- Coolify automatically provisions SSL when you set a domain
- Auto-renewal happens before expiration
- No action needed from you

**Manual Renewal (if needed):**

1. Go to resource → **Domains** tab
2. Click **Refresh** on domain
3. Wait for new certificate

### Resource Limits

**Set Limits for Applications:**

1. Go to application → **Advanced** tab
2. Set:
   - **Memory Limit**: e.g., 512MB, 1GB
   - **CPU Limit**: e.g., 0.5 CPU, 1 CPU
3. Click **Save** and **Restart**

**Why set limits:**

- Prevent one app from consuming all resources
- Better resource allocation across multiple apps
- Easier capacity planning

## Maintenance

### Update Coolify

1. Go to **Settings** → **Configuration**
2. Check for updates
3. Click **Update Coolify**
4. Wait ~2 minutes for update
5. Your apps keep running during update

### Update Applications

**Auto-deploy (Recommended):**

- Enable webhook for Git repository
- `git push` triggers automatic deployment

**Manual deploy:**

1. Go to application resource
2. Click **Redeploy**
3. Watch build logs

### Backup Strategy

**Databases:**

- Enable automated backups (Settings → Backups)
- Download backups for off-site storage

**Coolify Configuration:**

- Export environment variables from UI
- Document resource configurations
- Keep DNS records documented

## Troubleshooting

### Coolify Won't Start

```bash
# Check Docker is running
systemctl status docker

# Restart Coolify
docker restart coolify

# Check logs
docker logs coolify
```

### SSL Certificate Issues

1. Verify DNS points to correct IP
2. Ensure domain is accessible via HTTP (port 80)
3. Check Traefik logs: `docker logs traefik`
4. Force renewal in Coolify UI

### Application Won't Deploy

1. Check build logs in Coolify
2. Verify Dockerfile or build pack is correct
3. Check environment variables are set
4. Verify port configuration matches app

### Out of Memory

1. Check resource usage in dashboard
2. Set resource limits on heavy applications
3. Upgrade VPS if consistently > 80% usage

## Security Best Practices

**Implemented by Coolify:**

- ✅ Automatic SSL with Let's Encrypt
- ✅ Isolated Docker networks
- ✅ Traefik reverse proxy with security headers

**You should do:**

- ✅ Use strong passwords for Coolify admin
- ✅ Enable 2FA for Coolify (optional but recommended)
- ✅ Keep Coolify updated
- ✅ Use SSH key authentication (disable password auth)
- ✅ Regular backups
- ✅ Monitor logs for suspicious activity

## Common Commands (SSH)

```bash
# Check Coolify status
docker ps | grep coolify

# View Coolify logs
docker logs -f coolify

# Restart Coolify
docker restart coolify

# Check disk space
df -h

# Check memory usage
free -h

# View all containers
docker ps -a
```

## Getting Help

- **Coolify Docs**: <https://coolify.io/docs>
- **Coolify Discord**: <https://coollabs.io/discord>
- **GitHub Issues**: <https://github.com/coollabsio/coolify/issues>

## Next Steps

After Coolify is set up, you can:

1. Deploy databases (PostgreSQL for your app)
2. Deploy applications from Git
3. Configure auto-deploy webhooks
4. Set up monitoring and alerts
5. Configure regular backups

For complete GadgetBot deployment, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).
