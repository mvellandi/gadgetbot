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
   - **Email**: `admin@gadgetbot.localhost`
   - **Password**: `Admin123!` (you will be prompted to change this on first login)
   - **New Password**: `<new password>` (for your own local development environment)

**Notes**:

- Zitadel 'Loginname' is a computed value based on 'ZITADEL_FIRSTINSTANCE_ORG_*=' environment variables in the docker-compose setup.
- 'ZITADEL_FIRSTINSTANCE_ORG_HUMAN_USERNAME' defaults to 'zitadel-admin'
- 'ZITADEL_FIRSTINSTANCE_ORG_NAME' defaults to 'zitadel'
- 'ZITADEL_EXTERNALDOMAIN' defaults to 'localhost'
- 'Loginname' is: `<username>@<org_name>.<external_domain>`
_ More info at [Zitadel username email](/docs/ZITADEL_USERNAME_EMAIL_ARCHITECTURE.md)

**Troubleshooting**: If you get "user could not be found", the initial admin user wasn't created properly. See the [Reset Zitadel](#reset-zitadel-fresh-start) section below to fix this.

## Step 3: Create an OAuth Application

### 3.1 Navigate to Applications

1. In the Zitadel console, select the organization `GadgetBot` from the top-left dropdown
2. On the home page, click the **Create Application** button

### 3.2 Configure Project and Application

The application form asks you to first select your project

1. **Project Name**: `GadgetBot`
2. **Framework**: Select **Other (OIDC, SAML, API)**
3. Click **Create** button

An application settings page will open

1. **Application Name**: `GadgetBot Web`
2. Select type as **Web**
3. Click **Continue**

### 3.3 Configure Authentication Settings

1. **Authentication Method**: Select **PKCE** (recommended for security)

2. **Redirect URIs**: Add the following URLs with development mode enabled:
   http://localhost:3001/api/auth/callback/zitadel

3. **Post Logout URIs**: Add:
   http://localhost:3001

4. Click **Continue**

> **Note**: We use port 3001 for the GadgetBot dev server because the Zitadel Login V2 UI container already uses port 3000.

You'll be taken to the application overview page with details that will later need to be further customized.

5. Click **Create**

### 3.4 Copy Client ID

After creating the application, you'll see:
- **Client ID**: Copy this value

> **Note**: When using PKCE authentication, no Client Secret is required or provided. This is more secure for public clients as there's no secret to compromise.

### 3.5 OIDC Configuration

Select "Refresh Token" to add it to "Grant Types", then click **Save**.

## Step 4: Configure Environment Variables

Update your `.env` file with the Zitadel Client ID:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gadgetbot

# Zitadel Configuration
ZITADEL_ISSUER_URL=http://localhost:8080
ZITADEL_CLIENT_ID=your-client-id-here@gadgetbot
# ZITADEL_CLIENT_SECRET is not needed when using PKCE

# Better Auth
BETTER_AUTH_SECRET=changeme-generate-a-random-32-character-secret
BETTER_AUTH_URL=http://localhost:3001
```

> **Important Notes:**
> - **Client ID Format**: The Zitadel Client ID should end with `@gadgetbot` (or your organization name)
> - **No Client Secret Needed**: PKCE (Proof Key for Code Exchange) is a more secure OAuth flow that doesn't require a client secret
> - **BETTER_AUTH_URL**: Must be set for the authentication flow to work correctly (used for OAuth redirect URIs)

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

## Step 5: Configure Roles in Zitadel (Optional - Phase 2)

> **Note**: This section can be skipped for initial testing. The basic OAuth flow will work without custom roles. You can return to this section later when implementing role-based authorization.

### Why Skip for Now?
- Your user already has org owner permissions (sufficient for testing)
- Basic authentication works without custom application roles
- Role-based authorization will be implemented in Phase 2

### When to Come Back
- After confirming the basic login flow works
- When implementing admin vs. customer permissions
- When adding role-based access control to domain operations

<details>
<summary>Click to expand: Role Configuration Steps (for Phase 2)</summary>

### 5.1 Create Application Roles

> **Note**: The Zitadel UI has changed. These instructions may need adjustment based on your version.

1. In Zitadel console, go to your **GadgetBot Web** application
2. Navigate to **Roles** section
3. Create custom roles like `admin` and `customer`
4. Configure role claims to be included in tokens

### 5.2 Assign Roles to Users

1. Go to **Users** in the left sidebar
2. Click on your user
3. Assign application-specific roles as needed

### 5.3 Configure Token Claims

Ensure roles are included in the ID token and userinfo endpoint for Better Auth to access them.

</details>

## Step 6: Start the Application

Now you're ready to start the GadgetBot application:

```bash
# Start the dev server on port 3001
npm run dev -- --port 3001
```

The application will be available at: **http://localhost:3001**

> **Port Note**: We use port 3001 because the Zitadel 3-container setup includes a Login V2 UI that runs on port 3000.

## Step 7: Test Authentication

1. Navigate to: **http://localhost:3001/login**
2. Click **Sign in with Zitadel**
3. You'll be redirected to Zitadel's login page (Login V2 UI at port 3000)
4. Sign in with your credentials (admin@gadgetbot.localhost / newpassword)
5. Grant permission when prompted
6. You'll be redirected back to `/admin/products`

## Troubleshooting

### Reset Zitadel (Fresh Start)

If you're having login issues or need to start fresh:

```bash
# Stop Zitadel and remove all data
npm run zitadel:reset

# Wait 30 seconds for initialization
sleep 30

# Check logs to confirm it's ready
npm run zitadel:logs
```

After reset, use these credentials:
- **Email**: `admin@gadgetbot.localhost`
- **Password**: `Admin123!`

### Issue: "User could not be found"

**Solution**: The admin user wasn't created properly during initialization. Use the [Reset Zitadel](#reset-zitadel-fresh-start) command above.

Alternatively, you can register a new user:
1. On the login page, click "Register"
2. Fill in your details
3. Complete registration (no email verification needed in dev mode)

### Issue: "redirect_uri_mismatch" Error

**Solution**: Ensure the redirect URI in Zitadel exactly matches:
```
http://localhost:3001/api/auth/callback/zitadel
```

### Issue: "Invalid client" Error

**Solution**: Double-check your Client ID and Client Secret in `.env`

### Issue: "Discovery URL not found"

**Solution**: Ensure Zitadel is fully initialized. Check logs:
```bash
npm run zitadel:logs
```

Look for: `server is listening on [::]:8080`

### Issue: Session Not Persisting

**Solution**: Check that cookies are enabled in your browser and that the `BETTER_AUTH_SECRET` is set correctly.

### Issue: "Invalid URL" Error (TypeError: Invalid URL)

**Symptoms**:
- Browser page freezes after clicking "Sign in with Zitadel"
- Server logs show: `TypeError: Invalid URL` with `input: 'undefined'`
- Error occurs in `createAuthorizationURL` function

**Root Causes & Solutions**:

1. **Missing BETTER_AUTH_URL environment variable**
   ```bash
   # Ensure this is set in .env
   BETTER_AUTH_URL=http://localhost:3001
   ```

2. **Client-side auth client has undefined baseURL**
   - The auth client in `src/web/auth/client.ts` must use `process.env.BETTER_AUTH_URL` for SSR
   - Don't import `env` module in client-side code (it validates server-only vars like `DATABASE_URL`)
   - Fixed pattern:
     ```typescript
     export const authClient = createAuthClient({
       baseURL: typeof window !== "undefined"
         ? window.location.origin
         : process.env.BETTER_AUTH_URL || "http://localhost:3001",
     })
     ```

3. **Discovery URL issues with genericOAuth plugin**
   - Better Auth may have trouble fetching the OIDC discovery endpoint
   - **Solution**: Manually specify OAuth endpoints instead of using `discoveryUrl`:
     ```typescript
     genericOAuth({
       config: [{
         providerId: "zitadel",
         authorizationUrl: `${ZITADEL_ISSUER_URL}/oauth/v2/authorize`,
         tokenUrl: `${ZITADEL_ISSUER_URL}/oauth/v2/token`,
         userInfoUrl: `${ZITADEL_ISSUER_URL}/oidc/v1/userinfo`,
         // ... other config
       }]
     })
     ```

**After making changes**: Always restart the dev server and clear build cache:
```bash
npm run build:clean
npm run dev
```

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
│            (http://localhost:3001)                     │
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
- Better Auth MCP docs server available
- [TanStack Start Authentication Guide](https://tanstack.com/start/latest/docs/framework/react/guide/authentication)
