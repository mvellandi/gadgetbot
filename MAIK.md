# GadgetBot - Quick Start for Friends

This guide helps you get the GadgetBot app running locally and understand the Zitadel + Better Auth integration.

## Getting Started

### Basic Setup (5 minutes)

```bash
# 1. Clone and install
git clone <repo-url>
cd gadgetbot
npm install

# 2. Create .env file (copy the example from README.md)
# Key variables you need:
# - DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gadgetbot
# - BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>
# - BETTER_AUTH_URL=http://localhost:3000

# 3. Start PostgreSQL and setup database
npm run docker:up
npm run db:migrate
npm run db:seed

# 4. Start the app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - you should see the homepage!

## Environment Variables Reference

Create a `.env` file in the project root with these variables:

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gadgetbot
DATABASE_POOL_MIN=2      # Optional: Minimum pool connections (default: 2)
DATABASE_POOL_MAX=10     # Optional: Maximum pool connections (default: 10)

# Better Auth Configuration
BETTER_AUTH_SECRET=<generate-with-openssl-rand-base64-32>
BETTER_AUTH_URL=http://localhost:3000

# Zitadel OAuth Configuration (for authentication features)
ZITADEL_ISSUER_URL=http://localhost:8080
ZITADEL_CLIENT_ID=<your-client-id>@gadgetbot
# Note: ZITADEL_CLIENT_SECRET not needed when using PKCE authentication
```

**Quick Secret Generation:**
```bash
# Generate BETTER_AUTH_SECRET
openssl rand -base64 32
```

**What if I skip Zitadel setup?**
- The app will run fine without auth
- You can explore domain operations via REPL
- Public routes will work normally
- Protected routes (/admin) will redirect to /login

### Zitadel OAuth Setup (10-15 minutes)

If you want to explore the authentication:

```bash
# 1. Start Zitadel (wait 30 seconds for initialization)
npm run zitadel:up

# 2. Check logs to confirm it's ready
npm run zitadel:logs
# Look for: "server is listening on [::]:8080"
```

**Configure OAuth Application:**

1. Open [http://localhost:8080/ui/console](http://localhost:8080/ui/console)
2. Login with: `admin@gadgetbot.localhost` / `Admin123!`
3. Create a new Web application with PKCE authentication
4. Copy the Client ID to your `.env` file as `ZITADEL_CLIENT_ID`
5. Restart your dev server: `npm run dev`

**Detailed step-by-step instructions:** See [docs/AUTH_SETUP.md](./docs/AUTH_SETUP.md)

## Why This Zitadel + Better Auth Setup is Interesting

### Self-Hosted OAuth Provider
- No external dependencies (Auth0, Clerk, etc.)
- Everything runs locally in Docker
- Full control over the identity provider
- Production-ready pattern (just swap URLs for deployment)

### PKCE Flow (Proof Key for Code Exchange)
- More secure than traditional OAuth with client secrets
- No secrets to leak (ideal for public clients)
- Industry best practice for modern web apps

### Clean Integration
- Better Auth handles the OAuth dance automatically
- Session management with HTTP-only cookies
- User persistence in PostgreSQL
- Simple API for protected routes and procedures

### Production-Ready Pattern
This exact setup scales to production:
- Local: `http://localhost:3000` + `http://localhost:8080`
- Production: `https://app.yoursite.com` + `https://auth.yoursite.com`
- Just update environment variables!

## The Architecture

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
│  Better Auth Client (src/web/auth/client.ts)          │
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
│  Better Auth Server (src/auth/server.ts)              │
│  - Exchanges code for tokens                           │
│  - Creates local session                               │
│  - Stores user in PostgreSQL                           │
└───────────────────┬───────────────────────────────────┘
                    │
                    │ 4. Set session cookie & redirect
                    ▼
┌───────────────────────────────────────────────────────┐
│            Admin Dashboard                             │
│          (/admin/products)                             │
│                                                        │
│  User is now authenticated!                            │
│  - Session persisted in cookie                         │
│  - User info available in oRPC context                 │
└───────────────────────────────────────────────────────┘
```

## What You'll See in Action

### Protected Routes
Try accessing `/admin/products` without logging in - you'll be redirected to `/login`

### OAuth Redirect Flow
1. Click "Sign in with Zitadel" on `/login`
2. Redirected to Zitadel login page
3. Sign in (or register a new user)
4. Redirected back to `/admin/products`
5. Authenticated! Session is persisted

### Session Persistence
- HTTP-only cookies (secure)
- Refresh on browser restart
- Sign out clears session

### User Menu
- Displays user info from Zitadel
- Avatar, name, email
- Sign out button

### Authenticated API Calls
oRPC procedures automatically receive authenticated user context:
```typescript
// In any oRPC procedure
export const createGadgetbot = os
  .input(Schema.standardSchemaV1(CreateGadgetBotSchema))
  .handler(async ({ input, context }) => {
    // Domain handles auth - pass context.user
    // Domain will throw UnauthorizedError if not authenticated
    return await Products.GadgetBot.create(context.user, input)
  })
```

## Key Files to Explore

### Authentication Layer
- `src/auth/server.ts` - Better Auth server configuration
- `src/web/auth/client.ts` - Browser client for auth operations
- `src/orpc/context.ts` - How auth context flows to API calls
- `src/orpc/middleware.ts` - Authentication middleware (`requireAuth`)

### Protected Routes
- `src/web/routes/admin.tsx` - Protected layout with `beforeLoad` guard
- `src/web/routes/admin/products.tsx` - Example protected page
- `src/web/routes/login.tsx` - Login page with OAuth button

### oRPC Integration
- `src/orpc/router/products.ts` - Protected API procedures
- `src/web/orpc/client.ts` - Type-safe client with auth

### Documentation Resources
- [docs/AUTH_SETUP.md](./docs/AUTH_SETUP.md) - Complete authentication setup guide
- [docs/AUTH_PATTERNS.md](./docs/AUTH_PATTERNS.md) - Development patterns for auth
- [docs/AUTH_IMPLEMENTATION_STATUS.md](./docs/AUTH_IMPLEMENTATION_STATUS.md) - Implementation progress and roadmap

**Better Auth MCP Server:** This project has a Better Auth MCP (Model Context Protocol) server configured. You can use it to query Better Auth documentation directly when working with authentication code. See CLAUDE.md for MCP tool usage.

## Pro Tips

### Explore Without Auth First
If you want to understand the core architecture before diving into OAuth:

```bash
# Start the REPL (no auth needed)
npm run repl

# Test domain operations directly
> const Products = await import('./src/domains/products.js')
> await Products.GadgetBot.findAll()
> await Products.GadgetBot.create({
    name: "TestBot",
    type: "cleaning",
    status: "available"
  })
```

This lets you explore:
- Domain-driven design pattern
- Effect Schema validation
- Database operations with Drizzle
- PostgreSQL interactions

Then add auth later to see how it integrates!

### Visual Database Management
```bash
npm run db:studio
```
Opens Drizzle Studio - a visual interface for your PostgreSQL database. Great for:
- Inspecting user records after OAuth
- Viewing session data
- Testing domain operations

### Watch Mode for Development
The dev server has hot reload, but if you're modifying domain/database code, the REPL is faster for testing:

```bash
npm run repl
# Make changes to domain files
# Reload in REPL:
> const Products = await import('./src/domains/products.js?v=' + Date.now())
```

## Potential Gotchas

### 1. Zitadel Initialization Time
Zitadel takes ~30 seconds to fully initialize after `npm run zitadel:up`.

**Check logs:**
```bash
npm run zitadel:logs
# Look for: "server is listening on [::]:8080"
```

**If login fails immediately after starting, wait a bit longer!**

### 2. "Invalid URL" Error
If the browser freezes after clicking "Sign in with Zitadel":

**Fix:** Ensure `BETTER_AUTH_URL=http://localhost:3000` is set in `.env`

This is required for OAuth redirect URIs to work correctly.

### 3. Client ID Format
The Zitadel Client ID must end with `@gadgetbot` (or your organization name):

```bash
# ✅ Correct
ZITADEL_CLIENT_ID=287239847239847@gadgetbot

# ❌ Wrong
ZITADEL_CLIENT_ID=287239847239847
```

### 4. "User could not be found"
If Zitadel login fails with this error, the initial admin user wasn't created.

**Fix:** Reset Zitadel
```bash
npm run zitadel:reset
# Wait 30 seconds
npm run zitadel:logs
```

Then try logging in again with `admin@gadgetbot.localhost` / `Admin123!`

### 5. Database Connection Refused
If you see `ECONNREFUSED` errors:

**Fix:** Ensure PostgreSQL is running
```bash
docker ps  # Check if postgres container is running
npm run docker:up  # Start if not running
```

## Troubleshooting

For detailed troubleshooting, see:
- [docs/AUTH_SETUP.md](./docs/AUTH_SETUP.md) - Complete auth setup guide with troubleshooting
- [README.md](./README.md) - General troubleshooting for database, Docker, builds

**Common fixes:**
```bash
# Reset everything
npm run docker:down
npm run zitadel:down
npm run docker:up
npm run zitadel:up
npm run db:migrate
npm run db:seed

# Clear build cache
npm run build:clear
npm run dev
```

## Next Steps After Setup

Once you have the app running with auth:

1. **Explore the code:**
   - See how domains are structured (`src/domains/products/`)
   - Check out oRPC procedures (`src/orpc/router/`)
   - Look at protected routes (`src/web/routes/admin/`)

2. **Try making changes:**
   - Add a new gadgetbot type in the schema
   - Create a new protected route
   - Add a new oRPC procedure with authentication

3. **Understand the patterns:**
   - Domain-driven design (inspired by Elixir Ash)
   - Multi-client architecture (web, CLI, API)
   - Effect Schema for runtime validation
   - oRPC for type-safe APIs

4. **Read the docs:**
   - [CLAUDE.md](./CLAUDE.md) - Complete architecture guide
   - [docs/AUTH_PATTERNS.md](./docs/AUTH_PATTERNS.md) - Auth development patterns
   - [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) - Domain implementation workflow

## Questions?

This is a learning project showcasing modern TypeScript patterns with:
- TanStack ecosystem (Start, Router, Query)
- Effect for functional programming
- Self-hosted auth with Zitadel
- Clean architecture with domain-driven design

Feel free to experiment, break things, and learn! The Docker setup makes it easy to reset and try again.

**Happy hacking! 🤖**
