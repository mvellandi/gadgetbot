# GadgetBot Deployment with Coolify (Self-Hosted)

Deploy GadgetBot to a Hetzner VPS using self-hosted Coolify - a free, open-source platform that makes Docker deployment as easy as using Vercel or Heroku, but on YOUR own server.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Cost Breakdown](#cost-breakdown)
- [Step 1: Get a Hetzner VPS](#step-1-get-a-hetzner-vps)
- [Step 2: Install Coolify](#step-2-install-coolify)
- [Step 3: Initial Coolify Setup](#step-3-initial-coolify-setup)
- [Step 4: Configure DNS](#step-4-configure-dns)
- [Step 5: Create PostgreSQL Databases](#step-5-create-postgresql-databases)
- [Step 6: Deploy Zitadel](#step-6-deploy-zitadel)
- [Step 7: Deploy GadgetBot App](#step-7-deploy-gadgetbot-app)
- [Step 8: Configure Zitadel OAuth](#step-8-configure-zitadel-oauth)
- [Step 9: Run Database Migrations](#step-9-run-database-migrations)
- [Maintenance](#maintenance)
- [Troubleshooting](#troubleshooting)
- [Scaling](#scaling)
- [Hosting Multiple Demo Apps](#hosting-multiple-demo-apps)

---

## Overview

### What is Coolify?

**Coolify is a free, open-source, self-hosted PaaS** (Platform as a Service) that you install on your own VPS. Think of it as "Vercel/Heroku, but you own everything."

**Key Points:**
- ✅ **100% Free** - No subscription, no SaaS fees
- ✅ **Self-hosted** - Runs entirely on YOUR Hetzner VPS
- ✅ **Open source** - [GitHub](https://github.com/coollabsio/coolify)
- ✅ **You own everything** - All data stays on your server
- ✅ **No vendor lock-in** - Can migrate to manual Docker anytime

### What Coolify Does For You

Instead of SSH and manual Docker commands, Coolify provides:
- 🖥️ **Web UI** for deployment management
- 🔐 **Automatic SSL** with Let's Encrypt
- 🔄 **Git integration** with auto-deploy on push
- 📊 **Built-in monitoring** and resource graphs
- 🗄️ **Database management** with one-click backups
- 📝 **Log aggregation** across all services
- 🚀 **Zero-downtime deployments**

### Architecture

```
Hetzner VPS (Your Server - €3.49-5.49/month)
├── Coolify Dashboard (port 8000)
│   └── Web UI for management
│
├── Traefik Reverse Proxy (ports 80, 443)
│   ├── SSL certificates (Let's Encrypt)
│   └── Routes:
│       ├── gadgetbot.yourdomain.com → Your app
│       ├── auth.yourdomain.com → Zitadel
│       └── coolify.yourdomain.com → Coolify dashboard
│
├── PostgreSQL Containers (managed by Coolify)
│   ├── Database: gadgetbot_app
│   └── Database: zitadel_db
│
├── GadgetBot App Container
│   └── Built from your Dockerfile
│
└── Zitadel Container
    └── OAuth/OIDC server
```

---

## Prerequisites

Before starting, you'll need:

- **Domain name** (or 3 subdomains):
  - `gadgetbot.yourdomain.com` - Your app
  - `auth.yourdomain.com` - Zitadel
  - `coolify.yourdomain.com` - Coolify dashboard (optional but recommended)
- **GitHub/GitLab account** with your GadgetBot repo
- **SSH client** on your local machine
- **1-2 hours** for initial setup

---

## Cost Breakdown

| Service | Monthly Cost | Annual Cost | Who Provides It |
|---------|--------------|-------------|-----------------|
| Hetzner VPS (CX23) | €3.49 | €41.88 | Hetzner Cloud |
| Hetzner VPS (CX33) | €5.49 | €65.88 | Hetzner Cloud (recommended) |
| Coolify Software | **FREE** | **FREE** | Self-hosted |
| PostgreSQL | **FREE** | **FREE** | Managed by Coolify |
| SSL Certificates | **FREE** | **FREE** | Let's Encrypt |
| Domain name | ~€1 | ~€12-15 | Your registrar |
| **Total (CX23)** | **€3.49 + domain** | **€54-57** | - |
| **Total (CX33)** | **€5.49 + domain** | **€78-81** | - |

**You own everything. No SaaS fees. No subscriptions beyond the VPS.**

---

## Step 1: Get a Hetzner VPS

### 1.1 Create Hetzner Account

1. Go to [Hetzner Cloud](https://www.hetzner.com/cloud)
2. Sign up and verify your email
3. Create a new project (e.g., "GadgetBot Production")

### 1.2 Choose Your VPS Tier

Based on your resource needs:

| Tier | vCPU | RAM | SSD | Monthly | Best For |
|------|------|-----|-----|---------|----------|
| **CX23** ⭐ | 2 | 4GB | 40GB | €3.49 | **Start here - 1-3 demo apps** |
| **CX33** | 4 | 8GB | 80GB | €5.49 | 4-8 apps or production traffic |
| **CAX21** | 4 | 8GB | 80GB | €6.49 | ARM-based (if you need ARM) |

**Recommendation:** Start with **CX23 (€3.49/month)** for demo apps. You can easily upgrade later (no data loss, ~30 seconds downtime) when you need more capacity.

### 1.3 Create Server

1. Click "Add Server" in Hetzner console
2. **Location**: Choose closest to your users (e.g., Nuremberg for EU)
3. **Image**: Ubuntu 22.04 (LTS)
4. **Type**: CX23 (2 vCPU, 4GB RAM) - Perfect for demo apps
5. **Networking**: IPv4 + IPv6
6. **SSH Key**:
   ```bash
   # Generate if you don't have one
   ssh-keygen -t ed25519 -C "your_email@example.com"
   cat ~/.ssh/id_ed25519.pub  # Copy and paste into Hetzner
   ```
7. **Name**: `gadgetbot-cx23`
8. Click "Create & Buy now"

### 1.4 Note Your Server IP

After creation, you'll see your server's public IP (e.g., `123.456.789.10`). Save this - you'll need it.

---

## Step 2: Install Coolify

### 2.1 SSH to Your VPS

```bash
ssh root@YOUR_SERVER_IP
```

### 2.2 Update System

```bash
apt update && apt upgrade -y
```

### 2.3 Install Coolify (One Command!)

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

### 2.4 Configure Firewall

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

---

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

---

## Step 4: Configure DNS

### 4.1 Add DNS Records

In your DNS provider (Cloudflare, Namecheap, etc.), create A records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | gadgetbot | YOUR_SERVER_IP | 300 |
| A | auth | YOUR_SERVER_IP | 300 |
| A | coolify | YOUR_SERVER_IP | 300 |

Or if using subdomains:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | gadgetbot.yourdomain.com | YOUR_SERVER_IP | 300 |
| A | auth.yourdomain.com | YOUR_SERVER_IP | 300 |
| A | coolify.yourdomain.com | YOUR_SERVER_IP | 300 |

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

---

## Step 5: Create PostgreSQL Databases

Coolify makes database creation incredibly easy.

### 5.1 Create Database for GadgetBot App

1. In Coolify dashboard, click **+ New**
2. Select **Database** → **PostgreSQL**
3. Configure:
   - **Name**: `gadgetbot-app-db`
   - **Description**: GadgetBot application database
   - **PostgreSQL Version**: 16 (latest)
   - **Database Name**: `gadgetbot`
   - **Username**: `postgres`
   - **Password**: Click "Generate" (Coolify creates strong password)
   - **Port**: Leave default (Coolify auto-assigns)
4. Click **Save**
5. **Copy the connection string** - you'll need this later
   - Format: `postgresql://postgres:PASSWORD@HOST:PORT/gadgetbot`

### 5.2 Create Database for Zitadel

1. Click **+ New** → **Database** → **PostgreSQL**
2. Configure:
   - **Name**: `zitadel-db`
   - **Description**: Zitadel authentication database
   - **PostgreSQL Version**: 16
   - **Database Name**: `zitadel`
   - **Username**: `postgres`
   - **Password**: Click "Generate"
   - **Port**: Leave default
3. Click **Save**
4. **Copy the connection string**

### 5.3 Verify Databases

Both databases should show as "Running" in the Resources list. Click on each to see:
- Connection details
- Resource usage
- Logs
- Backup settings

---

## Step 6: Deploy Zitadel

### 6.1 Create Zitadel Service

1. Click **+ New** → **Docker Image**
2. Configure:
   - **Name**: `zitadel`
   - **Description**: OAuth/OIDC authentication server
   - **Docker Image**: `ghcr.io/zitadel/zitadel:latest`

3. **Environment Variables** (click "Add" for each):
   ```env
   # Database connection (use your zitadel-db connection string)
   ZITADEL_DATABASE_POSTGRES_HOST=<from-coolify-zitadel-db>
   ZITADEL_DATABASE_POSTGRES_PORT=<from-coolify-zitadel-db>
   ZITADEL_DATABASE_POSTGRES_DATABASE=zitadel
   ZITADEL_DATABASE_POSTGRES_USER_USERNAME=postgres
   ZITADEL_DATABASE_POSTGRES_USER_PASSWORD=<from-coolify-zitadel-db>
   ZITADEL_DATABASE_POSTGRES_USER_SSL_MODE=disable
   ZITADEL_DATABASE_POSTGRES_ADMIN_USERNAME=postgres
   ZITADEL_DATABASE_POSTGRES_ADMIN_PASSWORD=<from-coolify-zitadel-db>
   ZITADEL_DATABASE_POSTGRES_ADMIN_SSL_MODE=disable

   # External domain
   ZITADEL_EXTERNALDOMAIN=auth.yourdomain.com
   ZITADEL_EXTERNALSECURE=true
   ZITADEL_EXTERNALPORT=443

   # Master key (generate 32-char secret)
   ZITADEL_MASTERKEY=<generate-with-coolify-or-openssl>

   # First admin user
   ZITADEL_FIRSTINSTANCE_ORG_NAME=GadgetBot
   ZITADEL_FIRSTINSTANCE_ORG_HUMAN_USERNAME=admin
   ZITADEL_FIRSTINSTANCE_ORG_HUMAN_PASSWORD=<strong-password>
   ZITADEL_FIRSTINSTANCE_ORG_HUMAN_FIRSTNAME=Admin
   ZITADEL_FIRSTINSTANCE_ORG_HUMAN_LASTNAME=User
   ZITADEL_FIRSTINSTANCE_ORG_HUMAN_EMAIL=admin@yourdomain.com
   ZITADEL_FIRSTINSTANCE_ORG_HUMAN_EMAIL_VERIFIED=true
   ```

4. **Docker Command**:
   ```bash
   start-from-init --masterkeyFromEnv --config /zitadel/config.yaml
   ```

5. **Domain Settings**:
   - **Domain**: `auth.yourdomain.com`
   - **HTTPS**: Enable (Coolify auto-configures SSL)

6. **Volumes** (for config file):
   - Click "Add Volume"
   - **Source Path**: `/path/to/your/zitadel/config.yaml` (we'll upload this)
   - **Destination Path**: `/zitadel/config.yaml`
   - **Read Only**: Yes

7. **Port Mapping**:
   - **Container Port**: 8080
   - **Public**: Yes (Traefik will proxy)

8. Click **Save** (don't deploy yet - we need the config file)

### 6.2 Upload Zitadel Config File

Before deploying, we need to upload the Zitadel config:

**Option 1: Via Coolify File Manager**
1. In Zitadel resource, go to **Files** tab
2. Upload `zitadel/config.yaml` from your repo
3. Path: `/zitadel/config.yaml`

**Option 2: Via SCP**
```bash
# On your local machine
scp zitadel/config.yaml root@YOUR_SERVER_IP:/root/zitadel/config.yaml

# Then in Coolify, mount it as a volume
```

### 6.3 Deploy Zitadel

1. Click **Deploy**
2. Watch the logs in real-time
3. Wait for "Zitadel is ready" message (~2 minutes)
4. Verify at: `https://auth.yourdomain.com`

---

## Step 7: Deploy GadgetBot App

### 7.1 Add Git Source

1. Go to **Sources** → **+ Add**
2. Select **GitHub** (or GitLab, Gitea, etc.)
3. Authorize Coolify to access your repo
4. Select your GadgetBot repository

### 7.2 Create Application

1. Click **+ New** → **Application**
2. Select your Git source
3. Configure:
   - **Name**: `gadgetbot-app`
   - **Description**: GadgetBot rental service
   - **Repository**: Your GadgetBot repo
   - **Branch**: `main`
   - **Build Pack**: Dockerfile
   - **Dockerfile Location**: `./Dockerfile`

### 7.3 Environment Variables

Add these environment variables (Coolify UI):

```env
# Node environment
NODE_ENV=production

# Database (use connection string from Step 5.1)
DATABASE_URL=postgresql://postgres:PASSWORD@HOST:PORT/gadgetbot
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# App URLs
APP_URL=https://gadgetbot.yourdomain.com
BETTER_AUTH_URL=https://gadgetbot.yourdomain.com

# Better Auth secret (generate 32-char secret)
BETTER_AUTH_SECRET=<generate-with-coolify-or-openssl>

# Zitadel OAuth (we'll get these after Zitadel config)
ZITADEL_ISSUER=https://auth.yourdomain.com
ZITADEL_CLIENT_ID=<from-zitadel-console>
ZITADEL_CLIENT_SECRET=<from-zitadel-console>
```

**Generate secrets in Coolify:**
- Click "Generate" button next to variable
- Or use: `openssl rand -base64 32`

### 7.4 Domain Settings

1. **Domain**: `gadgetbot.yourdomain.com`
2. **HTTPS**: Enable
3. **Port**: 3000 (your app's port)

### 7.5 Build Settings

1. **Build Command**: `npm run build` (auto-detected from Dockerfile)
2. **Start Command**: Defined in Dockerfile (`node .output/server/index.mjs`)

### 7.6 Deploy Application

1. Click **Deploy**
2. Watch build logs in real-time
3. Wait for build to complete (~3-5 minutes)
4. App should be live at: `https://gadgetbot.yourdomain.com`

**Note:** App will fail to start if OAuth credentials are missing. Continue to Step 8.

---

## Step 8: Configure Zitadel OAuth

### 8.1 Login to Zitadel Console

1. Open: `https://auth.yourdomain.com`
2. Login with credentials from Step 6.1:
   - Username: `admin`
   - Password: `<your-admin-password>`

### 8.2 Create OAuth Application

1. Go to **Projects** → **GadgetBot** (or create new project)
2. Click **New Application**
3. Configure:
   - **Name**: GadgetBot Production
   - **Type**: Web
   - **Authentication Method**: PKCE
4. Click **Continue**

5. **Redirect URIs**:
   - Add: `https://gadgetbot.yourdomain.com/api/auth/callback/oidc`
6. **Post Logout URIs**:
   - Add: `https://gadgetbot.yourdomain.com`
7. Click **Save**

8. **Copy credentials:**
   - Client ID (shown immediately)
   - Client Secret (click "Generate" if needed)

### 8.3 Update App Environment Variables

1. In Coolify, go to your `gadgetbot-app` resource
2. Go to **Environment Variables**
3. Update:
   ```env
   ZITADEL_CLIENT_ID=<from-zitadel-console>
   ZITADEL_CLIENT_SECRET=<from-zitadel-console>
   ```
4. Click **Save**
5. Click **Redeploy** (top right)

### 8.4 Test Authentication

1. Visit: `https://gadgetbot.yourdomain.com`
2. Click "Sign In"
3. Should redirect to Zitadel
4. Login with Zitadel admin user
5. Should redirect back to app and show logged-in state

---

## Step 9: Run Database Migrations

### 9.1 Access App Container Shell

In Coolify dashboard:

1. Go to your `gadgetbot-app` resource
2. Click **Terminal** tab
3. Opens a shell in the container

### 9.2 Run Migrations

```bash
# In the container terminal
npm run db:migrate
```

Watch for success messages. All migrations should apply cleanly.

### 9.3 Seed Database (Optional)

```bash
npm run db:seed
```

This adds sample GadgetBot data for testing.

### 9.4 Verify Database

1. Go to `gadgetbot-app-db` resource in Coolify
2. Click **Terminal** tab
3. Connect to PostgreSQL:
   ```bash
   psql -U postgres -d gadgetbot
   ```
4. Check tables:
   ```sql
   \dt
   SELECT * FROM gadgetbots LIMIT 5;
   \q
   ```

---

## Maintenance

### Daily Operations (All via Coolify UI)

**View Logs:**
1. Click on resource (app, database, etc.)
2. Go to **Logs** tab
3. Real-time logs with filtering

**Restart Services:**
1. Go to resource
2. Click **Restart** button

**Monitor Resources:**
1. Dashboard shows CPU/RAM usage for all services
2. Click on resource for detailed graphs

### Update Application

**Option 1: Auto-Deploy (Recommended)**

1. In `gadgetbot-app` settings, enable **Auto Deploy**
2. Every push to `main` branch triggers deployment
3. Zero-downtime rolling update

**Option 2: Manual Deploy**

1. Go to `gadgetbot-app` resource
2. Click **Redeploy**
3. Coolify pulls latest code and rebuilds

### Database Backups

**Configure Automated Backups:**

1. Go to `gadgetbot-app-db` resource
2. Click **Backups** tab
3. Configure:
   - **Frequency**: Daily at 2 AM
   - **Retention**: 7 days
   - **Destination**: Local or S3
4. Click **Save**

**Manual Backup:**

1. Go to database resource
2. Click **Backups** tab
3. Click **Backup Now**
4. Download backup file

**Restore from Backup:**

1. Go to database resource
2. Click **Backups** tab
3. Find backup and click **Restore**
4. Confirm restoration

### SSL Certificate Renewal

Coolify handles this automatically via Let's Encrypt:
- Checks daily for expiring certificates
- Auto-renews 30 days before expiration
- No action needed from you

### Update Coolify Itself

1. Go to **Settings** → **Configuration**
2. Check for updates (or auto-updates if enabled)
3. Click **Update Coolify**
4. Wait ~2 minutes for update
5. Your apps keep running during update

---

## Troubleshooting

### App Won't Start

**Check Logs:**
1. Go to `gadgetbot-app` resource
2. **Logs** tab
3. Look for errors in build or runtime logs

**Common Issues:**
- Missing environment variables → Add in settings
- Database connection failed → Check `DATABASE_URL`
- Port conflict → Verify port 3000 in settings

### Database Connection Errors

**Verify Connection String:**
1. Go to `gadgetbot-app-db` resource
2. Copy connection string
3. Compare with `DATABASE_URL` in app settings
4. Should match: `postgresql://postgres:PASSWORD@HOST:PORT/gadgetbot`

**Check Database Status:**
1. Go to database resource
2. Should show "Running" status
3. If stopped, click **Start**

### SSL Certificate Issues

**Force Renewal:**
1. Go to resource with SSL issue
2. **Domains** tab
3. Click **Refresh** on domain
4. Wait for new certificate (~1 minute)

**Check Certificate Status:**
- Domains tab shows expiration date
- Green = valid, Red = expired/error

### Zitadel Won't Start

**Check Database Connection:**
1. Verify `zitadel-db` is running
2. Check environment variables in Zitadel settings
3. Ensure database passwords match

**Check Config File:**
1. Go to Zitadel resource
2. **Files** tab
3. Verify `zitadel/config.yaml` exists and is correct

**View Logs:**
1. Zitadel resource → **Logs** tab
2. Look for initialization errors
3. Common: database not initialized (wait ~2 min on first start)

### Out of Memory

**Check Resource Usage:**
1. Dashboard shows memory usage per service
2. If consistently > 90%, upgrade VPS

**Restart Services:**
1. Click **Restart** on resource using most memory
2. If problem persists, upgrade to CX33 or larger

### Port Already in Use

This shouldn't happen with Coolify (it manages ports), but if it does:

1. Go to resource settings
2. **Ports** tab
3. Change to different port
4. Click **Save** and **Restart**

---

## Scaling

### Vertical Scaling (Upgrade VPS)

**When to Upgrade:**
- Memory usage > 80% consistently
- CPU usage > 70% consistently
- App response times degrading

**How to Upgrade:**
1. In Hetzner console, select your server
2. Click **Resize**
3. Select larger plan (e.g., CX23 → CX33)
4. Confirm (brief downtime ~30 seconds)
5. No data loss, Coolify continues working

**VPS Tiers:**
| From | To | Adds | New Price |
|------|-----|------|-----------|
| CX23 | CX33 | +2 vCPU, +4GB RAM | €5.49/month |
| CX33 | CX43 | +4 vCPU, +8GB RAM | ~€11/month |

### Horizontal Scaling (Advanced)

For high traffic, consider:

1. **Separate Database Server:**
   - Create new VPS for PostgreSQL
   - Update `DATABASE_URL` in Coolify
   - Migrate data via dump/restore

2. **Load Balancer:**
   - Deploy app on multiple servers
   - Add Hetzner Load Balancer (€5.83/month)
   - Point to multiple app instances

3. **Managed Database:**
   - Use Hetzner Cloud managed PostgreSQL (when available)
   - Or external provider like Supabase

### Resource Allocation

For CX33 (4 vCPU, 8GB RAM), recommended limits:

| Service | CPU | RAM | Coolify Setting |
|---------|-----|-----|-----------------|
| Coolify itself | 0.5 | 512MB | Auto |
| PostgreSQL (app) | 1.0 | 1.5GB | Set in resource limits |
| PostgreSQL (Zitadel) | 1.0 | 1.0GB | Set in resource limits |
| Zitadel | 1.0 | 1.5GB | Set in resource limits |
| GadgetBot App | 0.5 | 1.0GB | Set in resource limits |
| **Buffer** | 0.5 | 2.5GB | For OS and spikes |

**Set Resource Limits in Coolify:**
1. Go to resource
2. **Advanced** tab
3. Set **CPU Limit** and **Memory Limit**
4. Click **Save** and **Restart**

---

## Hosting Multiple Demo Apps

One of Coolify's biggest advantages: **unlimited apps on the same VPS**. Perfect for demo projects, side projects, or client prototypes.

### Why Host Multiple Apps?

**Cost Efficiency:**

- SaaS platforms charge per app: $5-20/month each
- With Coolify: Pay only for VPS, unlimited apps
- Example: 5 apps = €3.49/month total vs $25-100/month on SaaS

**Simplicity:**

- One dashboard manages all apps
- Shared authentication (Zitadel)
- Shared databases (if desired)
- Single SSL certificate management

### Capacity Guide for CX23 (2 vCPU, 4GB RAM)

This is what you can realistically host on **CX23 (€3.49/month)**:

#### Recommended Configuration

```text
CX23 (2 vCPU, 4GB RAM) - €3.49/month
├── Coolify (~512MB)
├── Zitadel - shared auth (~800MB)
├── PostgreSQL - shared DB (~800MB)
├── GadgetBot (~512MB)
├── Demo App 2 (~256MB)
├── Demo App 3 (~256MB)
└── Buffer (~900MB for OS + spikes)
```

**Total: 3-4 medium apps or 1 main app + 2-3 light apps**

#### Resource Allocation for CX23

| Service | RAM Limit | CPU Limit | Notes |
|---------|-----------|-----------|-------|
| Coolify | 512MB | Auto | Platform itself |
| Zitadel | 800MB | 0.5 CPU | Shared auth for all apps |
| PostgreSQL (shared) | 800MB | 0.75 CPU | Multiple databases in one instance |
| GadgetBot | 512MB | 0.5 CPU | Your main demo |
| Light app 1 | 256MB | 0.25 CPU | Astro, SvelteKit, static |
| Light app 2 | 256MB | 0.25 CPU | Express API, simple app |
| **Buffer** | 900MB | - | OS + traffic spikes |

**When to Upgrade to CX33:**

- Hosting > 3 apps consistently
- Apps getting production traffic
- Memory usage > 85%
- Want room for experimentation

### Adding Your Second App (5 Minutes)

Let's add a second demo app to your server. Example: A simple portfolio site.

#### Step 1: Prepare Your Repo

Ensure your second app has:

- `Dockerfile` OR is compatible with Nixpacks (auto-detects Node, Python, etc.)
- Code pushed to GitHub/GitLab
- Environment variables documented

#### Step 2: Add DNS Record

In your DNS provider:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | portfolio | YOUR_VPS_IP | 300 |

Or: `portfolio.yourdomain.com`

#### Step 3: Create Database (if needed)

**Option A: New Database Container**

1. In Coolify: **+ New** → **Database** → **PostgreSQL**
2. Name: `portfolio-db`
3. **Generate** password
4. **Save** and copy connection string

**Option B: Use Existing Database (recommended for demos)**

1. Go to your existing PostgreSQL resource
2. Click **Terminal** tab
3. Create new database:

   ```bash
   psql -U postgres
   CREATE DATABASE portfolio;
   \q
   ```

4. Connection string:

   ```text
   postgresql://postgres:SAME_PASSWORD@SAME_HOST:SAME_PORT/portfolio
   ```

#### Step 4: Deploy App in Coolify

1. **+ New** → **Application**
2. Select your Git source
3. Configure:
   - **Name**: `portfolio`
   - **Repository**: Your portfolio repo
   - **Branch**: `main`
   - **Build Pack**: Dockerfile or Nixpacks
4. **Environment Variables**:

   ```env
   NODE_ENV=production
   DATABASE_URL=postgresql://postgres:PASSWORD@HOST:PORT/portfolio
   # Add other vars as needed
   ```

5. **Domain**: `portfolio.yourdomain.com`
6. **HTTPS**: Enable
7. **Port**: Your app's port (e.g., 3000)
8. Click **Deploy**

#### Step 5: Watch It Deploy

- Build logs stream in real-time
- SSL certificate provisioned automatically
- App live at `https://portfolio.yourdomain.com`

**That's it! Total time: ~5 minutes**

### Sharing Resources Between Apps

#### Shared Authentication

Use **one Zitadel instance** for all your apps:

1. In Zitadel console (`https://auth.yourdomain.com`)
2. Create new **Project** for each app
3. Or add **Application** to existing project
4. Copy Client ID/Secret for each app

**Each app's environment:**

```env
ZITADEL_ISSUER=https://auth.yourdomain.com
ZITADEL_CLIENT_ID=<unique-per-app>
ZITADEL_CLIENT_SECRET=<unique-per-app>
```

**Benefits:**

- Users can sign in once for all your apps
- Centralized user management
- Single OAuth configuration

#### Shared Database Instance

Host multiple databases in one PostgreSQL container:

```bash
# In PostgreSQL terminal
psql -U postgres

CREATE DATABASE gadgetbot;
CREATE DATABASE portfolio;
CREATE DATABASE blog;
CREATE DATABASE api_service;

\l  # List all databases
\q
```

**Per-app connection strings:**

```env
# GadgetBot
DATABASE_URL=postgresql://postgres:PASSWORD@HOST:PORT/gadgetbot

# Portfolio
DATABASE_URL=postgresql://postgres:PASSWORD@HOST:PORT/portfolio

# Blog
DATABASE_URL=postgresql://postgres:PASSWORD@HOST:PORT/blog
```

**Benefits:**

- Lower memory usage (one container vs multiple)
- Easier backups (one backup for all databases)
- Simpler management

**When NOT to share:**

- Production apps (isolate for security)
- Apps with very different resource needs
- Apps you might want to move to separate servers later

#### Shared Redis/Cache

Create once, use everywhere:

1. **+ New** → **Database** → **Redis**
2. Name: `shared-redis`
3. All apps use same connection:

   ```env
   REDIS_URL=redis://:PASSWORD@HOST:PORT
   ```

### Example Multi-App Setups

#### Setup 1: Portfolio Hub (CX23 - €3.49/month)

Perfect for showcasing multiple projects:

```text
yourdomain.com
├── yourdomain.com → Landing/portfolio page (Astro - 128MB)
├── gadgetbot.yourdomain.com → GadgetBot demo (512MB)
├── blog.yourdomain.com → Personal blog (256MB)
├── api.yourdomain.com → REST API demo (256MB)
└── auth.yourdomain.com → Zitadel (800MB)

Databases:
└── PostgreSQL (800MB)
    ├── gadgetbot
    ├── blog
    └── api

Total: 5 apps on €3.49/month
```

#### Setup 2: SaaS Demo Platform (CX33 - €5.49/month)

Multiple full-stack demos:

```text
demos.yourdomain.com
├── gadgetbot.yourdomain.com → Rental service demo (512MB)
├── taskmanager.yourdomain.com → Task app demo (512MB)
├── ecommerce.yourdomain.com → Shop demo (512MB)
├── analytics.yourdomain.com → Dashboard demo (512MB)
└── auth.yourdomain.com → Shared Zitadel (1GB)

Databases:
├── PostgreSQL 1 (1.5GB) → gadgetbot + taskmanager
├── PostgreSQL 2 (1.5GB) → ecommerce + analytics
└── Redis (256MB) → Shared cache

Total: 4 full apps + 1 auth on €5.49/month
```

#### Setup 3: Client Projects (CX33 - €5.49/month)

Host multiple client prototypes:

```text
agency.yourdomain.com
├── client1.yourdomain.com → Client A prototype (512MB)
├── client2.yourdomain.com → Client B prototype (512MB)
├── client3.yourdomain.com → Client C prototype (512MB)
├── staging.yourdomain.com → Internal staging (512MB)
└── Each with own PostgreSQL (500MB each)

Total: 4 client projects on €5.49/month vs €20-80 on SaaS
```

### Managing Multiple Apps

#### Organization Tips

**1. Naming Convention in Coolify:**

```text
gadgetbot-app
gadgetbot-db
gadgetbot-redis

portfolio-app
portfolio-db

blog-app
blog-db
```

**2. Use Tags:**

Coolify supports tags for filtering:

- Tag: `production` - Live apps
- Tag: `demo` - Demo/showcase apps
- Tag: `client-work` - Client projects
- Tag: `personal` - Side projects

**3. Resource Monitoring:**

Dashboard shows usage per app:

- Identify resource hogs
- Set appropriate limits
- Scale or optimize as needed

#### Setting Resource Limits

Prevent one app from consuming all resources:

**For each resource in Coolify:**

1. Go to resource → **Advanced** tab
2. **Memory Limit**: Set based on app needs
   - Light apps: 256MB
   - Medium apps: 512MB
   - Heavy apps: 1GB
3. **CPU Limit**:
   - Light: 0.25 CPU
   - Medium: 0.5 CPU
   - Heavy: 1 CPU
4. **Save** and **Restart**

**Example limits for CX23:**

```yaml
Coolify: 512MB RAM, auto CPU
Zitadel: 800MB RAM, 0.5 CPU
PostgreSQL: 800MB RAM, 0.75 CPU
GadgetBot: 512MB RAM, 0.5 CPU
Portfolio: 256MB RAM, 0.25 CPU
Blog: 256MB RAM, 0.25 CPU
```

#### Backup Strategy

**Automated backups per importance:**

**Production/Main apps:**

- Frequency: Daily at 2 AM
- Retention: 30 days
- Destination: S3 or local + manual download

**Demo apps:**

- Frequency: Weekly
- Retention: 7 days
- Destination: Local

**Static sites:**

- No backups needed (deploy from Git)

**Configure in Coolify:**

1. Go to database resource
2. **Backups** tab
3. Set frequency and retention
4. Optional: Configure S3 for off-site backups

### Deployment Workflows

#### Auto-Deploy from Git

Enable for rapid iteration:

1. Go to app resource
2. **Settings** → **Auto Deploy**
3. **Enable**
4. Now: `git push` triggers deployment automatically

**Perfect for:**

- Active development
- Demo apps you update frequently
- CI/CD workflows

#### Manual Deploy

Better for production:

1. Push code to Git
2. Review changes
3. Click **Redeploy** in Coolify
4. Monitor deployment logs
5. Verify in production

### Monitoring All Apps

**Coolify Dashboard shows:**

- Total resource usage across all apps
- Per-app CPU/RAM usage
- Disk space remaining
- Active deployments

**Set up alerts:**

1. **Settings** → **Notifications**
2. Configure email/Discord/Slack
3. Alert on:
   - Memory > 85%
   - Disk > 80%
   - App failure
   - Deployment failure

### Cost Optimization Tips

**1. Use lightweight frameworks for demos:**

Prefer smaller frameworks:

- ✅ Astro (static sites) - ~100MB RAM
- ✅ SvelteKit - ~200MB RAM
- ✅ Express.js (API only) - ~150MB RAM
- ⚠️ Next.js - ~400MB RAM
- ⚠️ Large full-stack frameworks - Consider carefully

**2. Static export when possible:**

For sites that don't need server-side rendering:

```bash
# Astro, Next.js, etc.
npm run build  # Static export

# Deploy as static site (1 Nginx serves multiple sites)
# Minimal resource usage
```

**3. Share databases:**

- One PostgreSQL with multiple databases: ~800MB
- vs Multiple PostgreSQL containers: 500MB × 4 = 2GB

**Savings: 1.2GB RAM** (enough for 2-4 more apps!)

**4. Optimize Docker images:**

- Use Alpine Linux base images
- Multi-stage builds
- Remove dev dependencies in production

**5. Monitor and adjust:**

- Check resource usage weekly
- Set limits on resource-heavy apps
- Upgrade VPS only when consistently > 80% usage

### When to Upgrade VPS

#### From CX23 (2 vCPU, 4GB) to CX33 (4 vCPU, 8GB)

**Upgrade when:**

- Hosting > 3 apps consistently
- Memory usage > 85% regularly
- Apps getting real traffic
- Want more room for experimentation

**How to upgrade (no data loss):**

1. In Hetzner console, select server
2. Click **Resize**
3. Select CX33
4. Confirm (30 seconds downtime)
5. Coolify and all apps continue working

**Cost increase:** €3.49 → €5.49 (+€2/month = 1 coffee)

#### From CX33 to Larger Tiers

**CX33 → CX43 (~€11/month):**

- When hosting > 7-8 apps
- Production traffic on multiple apps
- Need 16GB RAM

**CX33 → Dedicated CPU:**

- CPU-intensive apps (video processing, etc.)
- Guaranteed performance
- Not usually needed for demos

### Migration Strategy

**Adding apps incrementally:**

1. **Week 1:** Deploy GadgetBot (test everything)
2. **Week 2:** Add second app (monitor resources)
3. **Week 3:** Add third app if resources allow
4. **Week 4:** Optimize and set resource limits
5. **Month 2+:** Add more or upgrade as needed

**Safety margin:**

Keep 15-20% free RAM for:

- Traffic spikes
- Temporary high usage
- System operations
- Buffer for failures

---

## Cost Comparison

### Self-Hosted Coolify vs SaaS Alternatives

| Platform | Monthly | Annual | Notes |
|----------|---------|--------|-------|
| **Self-Hosted Coolify** | **€5.49** | **€66** | CX33 VPS + free Coolify |
| Vercel Pro | $20 | $240 | 100GB bandwidth limit |
| Heroku Eco | $5 | $60 | Sleeps after inactivity |
| Railway Hobby | $5 | $60 | $5 credit/month, then usage |
| Render Starter | $7 | $84 | Per service |
| DigitalOcean App Platform | $12 | $144 | Per app |

**With Coolify, you get:**
- Unlimited apps on same VPS
- Unlimited bandwidth (20TB with Hetzner)
- No sleep/idle shutdowns
- Full control and ownership
- No vendor lock-in

---

## Security Best Practices

✅ **Implemented by Coolify:**
- Automatic SSL with Let's Encrypt
- Isolated Docker networks
- Firewall rules
- Security headers via Traefik

✅ **You should do:**
- Strong passwords for all services
- SSH key authentication only
- Regular backups (automated in Coolify)
- Keep Coolify updated
- Monitor logs for suspicious activity
- Use strong `BETTER_AUTH_SECRET` and `ZITADEL_MASTERKEY`

✅ **Optional (advanced):**
- Enable 2FA for Coolify dashboard
- Restrict Coolify dashboard to VPN or IP whitelist
- Enable database SSL connections
- Setup log monitoring/alerting

---

## Getting Help

### Resources

- **Coolify Docs**: https://coolify.io/docs
- **Coolify Discord**: https://coollabs.io/discord
- **GitHub Issues**: https://github.com/coollabsio/coolify/issues
- **Hetzner Docs**: https://docs.hetzner.com
- **GadgetBot Issues**: Your repo issues

### Common Commands (if you need SSH)

```bash
# SSH to server
ssh root@YOUR_SERVER_IP

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
```

But remember: **Coolify UI should handle 99% of operations!**

---

## Migration Path

### From Coolify to Manual Docker

If you ever want to migrate away from Coolify:

1. Export your environment variables from Coolify UI
2. Create `docker-compose.yml` with same services
3. Copy data from Coolify-managed volumes
4. Stop Coolify: `docker stop coolify`
5. Deploy with manual Docker Compose

**You're never locked in.** Coolify uses standard Docker, so migration is straightforward.

### From Manual Docker to Coolify

If you've already deployed manually:

1. Install Coolify (doesn't affect existing containers)
2. Import existing databases to Coolify
3. Recreate apps in Coolify UI pointing to same repos
4. Migrate traffic gradually
5. Remove manual deployments when ready

---

## Next Steps

After successful deployment:

1. ✅ **Test thoroughly** - Authentication, database operations, all features
2. 📊 **Setup monitoring** - Review Coolify dashboard regularly
3. 💾 **Configure backups** - Enable automated database backups
4. 🔔 **Setup notifications** - Email alerts for failures (Settings → Notifications)
5. 📝 **Document your setup** - Keep notes on customizations
6. 🚀 **Enable auto-deploy** - Push to deploy automatically
7. 🔐 **Secure Coolify dashboard** - Change default port or add 2FA

---

## Conclusion

You now have a **production-grade, self-hosted GadgetBot deployment** with:

- ✅ Automatic SSL
- ✅ Git-based deployments
- ✅ Database backups
- ✅ Resource monitoring
- ✅ Zero-downtime updates
- ✅ All for **€5.49/month**

**All owned and controlled by you. No SaaS fees. Ever.**

Happy deploying! 🚀
