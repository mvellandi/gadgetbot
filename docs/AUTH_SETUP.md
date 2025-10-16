# Authentication Setup Guide

This guide walks you through setting up Zitadel authentication with Better Auth for the GadgetBot application.

## Prerequisites

- Docker installed and running
- Node.js 18+ installed
- PostgreSQL database for the application (already configured)

## Step 1: Start Zitadel

Start the Zitadel container:

```bash
npm run zitadel:up
```

Wait about 30 seconds for Zitadel to fully initialize. You can check the logs:

```bash
npm run zitadel:logs
```

Look for the message: `server is listening on [::]:8080`

## Step 2: Access Zitadel Console

1. Open your browser to: **http://localhost:8080/ui/console**
2. Sign in with the default admin credentials:
   - **Username**: `admin`
   - **Password**: `Admin123!`

## Step 3: Create an OAuth Application

### 3.1 Navigate to Applications

1. In the Zitadel console, click on the **default organization** (GadgetBot)
2. Click on **Applications** in the left sidebar
3. Click **New** button

### 3.2 Configure Application

1. **Name**: `GadgetBot Web`
2. **Type**: Select **WEB**
3. Click **Continue**

### 3.3 Configure Authentication Settings

1. **Authentication Method**: Select **PKCE** (recommended for security)
2. **Redirect URIs**: Add the following URLs:
   ```
   http://localhost:3000/api/auth/callback/zitadel
   ```
3. **Post Logout URIs**: Add:
   ```
   http://localhost:3000
   ```
4. **Grant Types**: Ensure these are selected:
   - ✅ Authorization Code
   - ✅ Refresh Token
5. Click **Continue**

### 3.4 Copy Credentials

After creating the application, you'll see:
- **Client ID**: Copy this value
- **Client Secret**: Click "Regenerate" if needed, then copy

⚠️ **Important**: Save these credentials securely. You'll need them in the next step.

## Step 4: Configure Environment Variables

Update your `.env` file with the Zitadel credentials:

```bash
# Zitadel Configuration
ZITADEL_ISSUER_URL=http://localhost:8080
ZITADEL_CLIENT_ID=your-client-id-here
ZITADEL_CLIENT_SECRET=your-client-secret-here

# Better Auth (already configured)
BETTER_AUTH_SECRET=changeme-generate-a-random-32-character-secret
BETTER_AUTH_URL=http://localhost:3000
```

### Generate a Secure Better Auth Secret

Replace the `BETTER_AUTH_SECRET` with a random 32+ character string:

```bash
# Generate a random secret
openssl rand -base64 32
```

Or use Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Step 5: Configure Roles in Zitadel (Optional but Recommended)

### 5.1 Create Admin Role

1. In Zitadel console, go to **Organization** → **Roles**
2. Click **New**
3. **Key**: `admin`
4. **Display Name**: `Administrator`
5. **Group**: `admin_access`
6. Click **Save**

### 5.2 Create Customer Role

1. Click **New** again
2. **Key**: `customer`
3. **Display Name**: `Customer`
4. **Group**: `user_access`
5. Click **Save**

### 5.3 Assign Admin Role to Your User

1. Go to **Users** in the left sidebar
2. Click on your admin user
3. Click **Authorizations** tab
4. Click **New**
5. Select your application: **GadgetBot Web**
6. Select the **admin** role
7. Click **Save**

### 5.4 Configure Role Claims in ID Token

1. Go back to **Applications** → **GadgetBot Web**
2. Click on **Token Settings**
3. Enable **Add Roles to ID Token**
4. Enable **Add Roles to Userinfo**
5. Click **Save**

## Step 6: Start the Application

Now you're ready to start the GadgetBot application:

```bash
# Start the dev server
npm run dev
```

The application will be available at: **http://localhost:3000**

## Step 7: Test Authentication

1. Navigate to: **http://localhost:3000/login**
2. Click **Sign in with Zitadel**
3. You'll be redirected to Zitadel's login page
4. Sign in with your credentials (admin / Admin123!)
5. Grant permission when prompted
6. You'll be redirected back to `/admin/products`

## Troubleshooting

### Issue: "redirect_uri_mismatch" Error

**Solution**: Ensure the redirect URI in Zitadel exactly matches:
```
http://localhost:3000/api/auth/callback/zitadel
```

### Issue: "Invalid client" Error

**Solution**: Double-check your Client ID and Client Secret in `.env`

### Issue: Zitadel Won't Start

**Solution**:
```bash
# Stop and remove volumes
npm run zitadel:down
docker compose -f docker-compose.zitadel.yml down -v

# Start fresh
npm run zitadel:up
```

### Issue: "Discovery URL not found"

**Solution**: Ensure Zitadel is fully initialized. Check logs:
```bash
npm run zitadel:logs
```

Look for: `server is listening on [::]:8080`

### Issue: Session Not Persisting

**Solution**: Check that cookies are enabled in your browser and that the `BETTER_AUTH_SECRET` is set correctly.

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                 Browser (User)                        │
└───────────────────┬──────────────────────────────────┘
                    │
                    │ 1. Click "Sign in with Zitadel"
                    ▼
┌───────────────────────────────────────────────────────┐
│              GadgetBot Application                     │
│            (http://localhost:3000)                     │
│                                                        │
│  Better Auth Client                                    │
│  - Initiates OAuth flow                                │
└───────────────────┬───────────────────────────────────┘
                    │
                    │ 2. Redirect to Zitadel
                    ▼
┌───────────────────────────────────────────────────────┐
│                Zitadel (IdP)                           │
│           (http://localhost:8080)                      │
│                                                        │
│  - User signs in                                       │
│  - User grants permissions                             │
└───────────────────┬───────────────────────────────────┘
                    │
                    │ 3. Redirect back with auth code
                    ▼
┌───────────────────────────────────────────────────────┐
│           GadgetBot Callback                           │
│  (/api/auth/callback/zitadel)                         │
│                                                        │
│  Better Auth Server                                    │
│  - Exchanges code for tokens                           │
│  - Creates local session                               │
│  - Stores user in database                             │
└───────────────────┬───────────────────────────────────┘
                    │
                    │ 4. Set session cookie & redirect
                    ▼
┌───────────────────────────────────────────────────────┐
│            Admin Dashboard                             │
│          (/admin/products)                             │
│                                                        │
│  User is now authenticated!                            │
└───────────────────────────────────────────────────────┘
```

## Next Steps

1. **Protect Routes**: Add authentication checks to admin routes
2. **Add User Menu**: Display user info and sign-out button
3. **Role-Based Access**: Implement authorization checks in domain operations
4. **Production Setup**: Configure HTTPS, secure cookies, and production Zitadel instance

## Resources

- [Zitadel Documentation](https://zitadel.com/docs)
- [Better Auth Documentation](https://www.better-auth.com/docs)
- [TanStack Start Authentication Guide](https://tanstack.com/start/latest/docs/framework/react/guide/authentication)
