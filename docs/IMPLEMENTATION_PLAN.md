# GadgetBot Implementation Plan

## Current Status

### ✅ Completed
- Domain structure (DDD two-layer pattern)
- Resource schemas with Effect Schema
- **Phase 1: Database Layer (Complete)**
  - PostgreSQL setup via Docker/OrbStack
  - Drizzle ORM with migrations
  - Database service layer with Effect
  - All CRUD operations implemented
  - Seed data and test scripts
- **Phase 2: Domain Operations (Complete)**
  - All GadgetBot CRUD operations
  - Effect Schema validation
  - Clean Promise-based API
  - Delete returns deleted item for confirmation
  - Domain API with authorization placeholders
  - Test script validates all operations
- **Phase 3: oRPC Endpoints (Complete)**
  - Type-safe RPC procedures for all CRUD operations
  - Clean boundary: only imports from domain API
  - Schemas exported through Products.GadgetBot.Schemas
  - Standard Schema V1 wrapping for oRPC compatibility

### 🚧 Next Up
1. ~~Database layer (schema + services)~~ ✅
2. ~~Domain operations (CRUD)~~ ✅
3. ~~Domain API (authorization wrapper)~~ ✅
4. ~~oRPC endpoints~~ ✅
5. ~~Admin interface with forms~~ ✅
6. Testing and deployment

---

## Phase 1: Database Layer ✅

### 1.1 Drizzle Schema

**File:** `src/db/schema/gadgetbots.ts`

- [x] Create pgTable for gadgetbots (id, name, type, status, description, batteryLife, maxLoadCapacity, features, imageUrl, timestamps)
- [x] Export types: `GadgetBotRow`, `NewGadgetBotRow`
- [x] Export from `src/db/schema/index.ts`
- [x] Generate migration: `npm run db:generate`
- [x] Apply migration: `npm run db:migrate`
- [x] Verify in Drizzle Studio

### 1.2 Database Service Layer

**File:** `src/db/services/gadgetbot.ts`

- [x] Define tagged errors: `NotFoundError`, `DatabaseError`, `ValidationError`
- [x] Implement Effect-based operations:
  - `createGadgetBot(input)`
  - `findAllGadgetBots()`
  - `findGadgetBotById(id)`
  - `updateGadgetBot(id, input)`
  - `deleteGadgetBot(id)` - Returns deleted item for confirmation
- [x] Test with CLI test script

---

## Phase 2: Domain Operations ✅

### 2.1 Resource Operations

**File:** `src/domains/products/gadgetbot.ts`

Update `GadgetBot` resource to call database services:

- [x] Implement `create()` - validate + call service + runPromise
- [x] Implement `findAll()`
- [x] Implement `findById()`
- [x] Implement `update()`
- [x] Implement `deleteById()` - Returns deleted item
- [x] Convert Effect errors to standard Error classes
- [x] Add `rowToModel()` helper for null/undefined conversion
- [x] Test all operations with CLI test script

### 2.2 Domain API ✅

**File:** `src/domains/products.ts`

- [x] Add all CRUD operations to `Products.GadgetBot`
- [x] Wrap write operations with auth placeholders
- [x] Test via test script (npm run test:domain)

---

## Phase 3: oRPC Endpoints ✅

**File:** `src/orpc/router/products.ts`

- [x] Create `gadgetbots` router with procedures:
  - `new` - Get template
  - `list` - List all
  - `getById` - Get by ID
  - `create` - Create new (with Standard Schema validation)
  - `update` - Update existing
  - `deleteById` - Delete
- [x] Export from `src/orpc/router/index.ts`
- [x] Verified clean boundaries (only imports from Products domain)

---

## Phase 4: Admin Interface ✅

### Route Structure
```
src/web/routes/admin/
  products/
    index.tsx                    # List all gadgetbots (table view)
    gadgetbots/
      new.tsx                    # Create form
      $id/
        index.tsx                # Detail view
        edit.tsx                 # Edit form
```

### 4.1 Products Landing Page ✅
**File:** `src/web/routes/admin/products/index.tsx`

- [x] Create table view with SSR data prefetching
- [x] Show: name, type, status, battery life, load capacity
- [x] Add "Add New" button → `/admin/products/gadgetbots/new`
- [x] Add View/Edit actions per row
- [x] Empty state handling

### 4.2 Create Form ✅
**File:** `src/web/routes/admin/products/gadgetbots/new.tsx`

- [x] Two-field form: name and type selection
- [x] Auto-populate specs on type selection
- [x] Live preview of bot specifications
- [x] Submit via TanStack React Query mutation
- [x] Handle errors and loading states
- [x] Navigate to list on success

### 4.3 Edit Form ✅
**File:** `src/web/routes/admin/products/gadgetbots/$id/edit.tsx`

- [x] Load data with SSR prefetching
- [x] Show fixed specifications (read-only)
- [x] Allow battery life updates only
- [x] Use TanStack React Query mutation
- [x] Handle not found errors

### 4.4 Detail View ✅
**File:** `src/web/routes/admin/products/gadgetbots/$id/index.tsx`

- [x] Read-only display with SSR
- [x] Organized cards: Basic Info, Specifications, Features, Metadata
- [x] Edit and Delete buttons
- [x] Confirmation dialog for deletion
- [x] Date formatting for timestamps

---

## Phase 5: Seed Data ✅

**File:** `src/db/seed.ts`

- [x] Create 5 sample gadgetbots (CleanBot, GardenMaster, SecureGuard, VacBot, LawnKeeper)
- [x] Run: `npm run db:seed`
- [x] Verify with CLI test script

---

## Phase 6: Testing

### REPL Testing
```bash
npm run repl
const { Products } = await import('./src/domains/products.js')

# Test all operations
Products.GadgetBot.new()
await Products.GadgetBot.create({...})
await Products.GadgetBot.findAll()
await Products.GadgetBot.findById(id)
await Products.GadgetBot.update(id, {...})
await Products.GadgetBot.deleteById(id)
```

### Web UI Testing
- [ ] Products landing page loads
- [ ] Create form validation works
- [ ] Create form submission works
- [ ] Edit form works
- [ ] Delete works
- [ ] Error handling works

---

## Deliverables

### New Files (Completed)

- [x] `src/db/client.ts` - Database connection with pooling
- [x] `src/db/schema/gadgetbots.ts` - Drizzle table schema
- [x] `src/db/schema/index.ts` - Schema exports
- [x] `src/db/services/gadgetbot.ts` - Effect-based CRUD operations
- [x] `src/db/migrate.ts` - Migration runner
- [x] `src/db/seed.ts` - Seed data script
- [x] `src/cli/reset-db.ts` - Database reset utility
- [x] `src/cli/test-db.ts` - CRUD test script
- [x] `src/cli/test-domain-api.ts` - Domain API test script
- [x] `docker-compose.yml` - PostgreSQL container
- [x] `drizzle.config.ts` - Drizzle Kit config
- [x] `src/orpc/router/products.ts` - oRPC endpoints with gadgetbots procedures
- [x] `src/web/routes/admin/products/index.tsx` - Products list with SSR
- [x] `src/web/routes/admin/products/gadgetbots/new.tsx` - Create form
- [x] `src/web/routes/admin/products/gadgetbots/$id/edit.tsx` - Edit form
- [x] `src/web/routes/admin/products/gadgetbots/$id/index.tsx` - Detail view

### Updated Files (Completed)

- [x] `src/domains/products/gadgetbot.ts` - Refactored with Schemas, Types, and Specs
- [x] `src/env.ts` - Fixed to use process.env for TanStack Start compatibility
- [x] `package.json` - Added database scripts and test:domain script
- [x] `src/domains/products.ts` - Added Specs export and authorization wrapper
- [x] `src/orpc/router/index.ts` - Export gadgetbots procedures
- [x] `vite.config.ts` - Added dotenv/config for .env loading

### Migrations (Completed)

- [x] Initial gadgetbots table migration (`0000_loud_morg.sql`)

---

---

## Phase 7: Authentication with Zitadel + Better Auth

> **Branch:** `feature/authentication`
>
> **Goal:** Implement self-hosted Zitadel as the identity provider with Better Auth as the integration layer for TanStack Start.

### Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                    Web Client                         │
│  ┌────────────────────────────────────────────────┐  │
│  │  Better Auth Client                            │  │
│  │  - useSession() hook                           │  │
│  │  - Auth context provider                       │  │
│  │  - Route guards (beforeLoad)                   │  │
│  └────────────────┬───────────────────────────────┘  │
└───────────────────┼──────────────────────────────────┘
                    │
┌───────────────────▼──────────────────────────────────┐
│              Better Auth Server                       │
│  - OAuth/OIDC integration with Zitadel               │
│  - Session management (HTTP-only cookies)            │
│  - User sync with local database                     │
│  - Server functions for auth operations              │
└───────────────────┬──────────────────────────────────┘
                    │
┌───────────────────▼──────────────────────────────────┐
│           Self-Hosted Zitadel                         │
│  - Identity provider (OAuth/OIDC)                    │
│  - User management                                    │
│  - Role-based access control (RBAC)                  │
│  - Organization/tenant management                     │
└──────────────────────────────────────────────────────┘
```

### 7.1 Zitadel Self-Hosting Setup

**Prerequisites:**
- [x] Docker Compose (for local development)
- [ ] PostgreSQL instance for Zitadel (separate from app database)

**Steps:**

1. **Create Zitadel Docker Compose Configuration**

   **File:** `docker-compose.zitadel.yml`

   - [ ] Add Zitadel container (version: stable)
   - [ ] Configure PostgreSQL database for Zitadel
   - [ ] Set up networking between containers
   - [ ] Configure environment variables:
     - `ZITADEL_EXTERNALSECURE=false` (for local dev)
     - `ZITADEL_EXTERNALPORT=8080`
     - Database connection string
   - [ ] Add volume mounts for persistence

   ```bash
   # New commands
   npm run zitadel:up     # Start Zitadel
   npm run zitadel:down   # Stop Zitadel
   npm run zitadel:logs   # View logs
   ```

2. **Initial Zitadel Configuration**

   - [ ] Access Zitadel console (`http://localhost:8080`)
   - [ ] Complete initial admin setup
   - [ ] Create organization for GadgetBot
   - [ ] Configure SMTP for email (optional for dev)

3. **Create OAuth Application in Zitadel**

   - [ ] Create new application in Zitadel console
   - [ ] Type: Web Application (OIDC)
   - [ ] Redirect URIs:
     - Development: `http://localhost:3000/api/auth/callback/zitadel`
     - Production: `https://yourdomain.com/api/auth/callback/zitadel`
   - [ ] Grant types: Authorization Code, Refresh Token
   - [ ] Scopes: `openid`, `profile`, `email`, `offline_access`
   - [ ] Note: Client ID and Client Secret

4. **Configure Roles and Permissions**

   - [ ] Create roles: `admin`, `customer`
   - [ ] Create actions/policies:
     - Admin role: Full access to `/admin/*` routes
     - Customer role: Access to customer-facing features
   - [ ] Set up role claims in ID token

### 7.2 Better Auth Integration

**Installation:**

```bash
npm install better-auth
npm install @better-auth/react  # For React hooks
```

**Steps:**

1. **Better Auth Server Configuration**

   **File:** `src/auth/server.ts`

   - [ ] Create Better Auth instance
   - [ ] Configure Zitadel as OAuth provider:
     ```typescript
     import { betterAuth } from "better-auth"
     import { pool } from "@/db/client"

     export const auth = betterAuth({
       database: pool,
       emailAndPassword: {
         enabled: false  // Use Zitadel for auth
       },
       socialProviders: {
         zitadel: {
           clientId: env.ZITADEL_CLIENT_ID,
           clientSecret: env.ZITADEL_CLIENT_SECRET,
           issuer: env.ZITADEL_ISSUER_URL,
         }
       },
       session: {
         cookieCache: {
           enabled: true,
           maxAge: 5 * 60  // 5 minutes
         }
       }
     })
     ```
   - [ ] Configure session management
   - [ ] Set up user synchronization

2. **Database Schema for Auth**

   **File:** `src/db/schema/auth.ts`

   Better Auth requires specific tables:
   - [ ] `users` table (id, email, name, image, emailVerified)
   - [ ] `sessions` table (id, userId, expiresAt, token)
   - [ ] `accounts` table (id, userId, provider, providerAccountId)
   - [ ] `verificationTokens` table (optional)

   ```bash
   npm run db:generate  # Generate migration
   npm run db:migrate   # Apply migration
   ```

3. **API Route Handler**

   **File:** `src/web/routes/api.auth.$.ts`

   - [ ] Create catch-all route for Better Auth
   - [ ] Handle all auth endpoints: `/api/auth/*`
   - [ ] Export auth handler from server config

   ```typescript
   import { auth } from '@/auth/server'

   export const Route = createFileRoute('/api/auth/$')({
     server: {
       handlers: {
         GET: auth.handler,
         POST: auth.handler,
       }
     }
   })
   ```

4. **Client Configuration**

   **File:** `src/web/auth/client.ts`

   - [ ] Create Better Auth client for browser
   - [ ] Configure API endpoint
   - [ ] Export auth client

   ```typescript
   import { createAuthClient } from "@better-auth/react"

   export const authClient = createAuthClient({
     baseURL: "http://localhost:3000"
   })

   export const { useSession, signIn, signOut } = authClient
   ```

### 7.3 Authentication Context

**File:** `src/web/auth/provider.tsx`

- [ ] Create AuthProvider component
- [ ] Wrap application in `__root.tsx`
- [ ] Provide session state to all routes
- [ ] Handle loading and error states

```typescript
import { authClient } from './client'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const session = authClient.useSession()

  return (
    <AuthContext.Provider value={session}>
      {children}
    </AuthContext.Provider>
  )
}
```

### 7.4 Route Protection

**Pattern:** Use TanStack Router's `beforeLoad` for route guards.

**File:** `src/web/routes/admin.tsx` (layout for all admin routes)

- [ ] Create admin layout route
- [ ] Add `beforeLoad` check for admin role
- [ ] Redirect to login if unauthenticated
- [ ] Show 403 if authenticated but not admin

```typescript
export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ context }) => {
    const session = await context.auth.getSession()

    if (!session?.user) {
      throw redirect({ to: '/login' })
    }

    if (!session.user.roles?.includes('admin')) {
      throw new Error('Forbidden: Admin access required')
    }
  },
  component: AdminLayout,
})
```

**File:** `src/web/routes/login.tsx`

- [ ] Create login page
- [ ] Add "Sign in with Zitadel" button
- [ ] Handle OAuth redirect flow
- [ ] Redirect to intended destination after login

### 7.5 Domain-Level Authorization

**File:** `src/domains/products.ts`

Update authorization placeholders with real checks:

- [ ] Replace `// TODO: Check admin role` with actual role checks
- [ ] Use session context passed from oRPC/route handlers
- [ ] Throw `UnauthorizedError` when auth fails

```typescript
import { UnauthorizedError } from '@/lib/errors'

export const Products = {
  GadgetBot: {
    create: async (input: NewGadgetBot, session?: Session) => {
      if (!session?.user?.roles?.includes('admin')) {
        throw new UnauthorizedError('Admin role required to create gadgetbots')
      }
      return GadgetBot.create(input)
    },
    // ... other operations
  }
}
```

### 7.6 oRPC Context Integration

**File:** `src/orpc/router/context.ts`

- [ ] Create context builder for oRPC
- [ ] Extract session from request headers/cookies
- [ ] Pass session to all procedures

```typescript
import { auth } from '@/auth/server'

export const createContext = async (req: Request) => {
  const session = await auth.api.getSession({ headers: req.headers })

  return {
    session,
    user: session?.user,
  }
}
```

**File:** `src/orpc/router/products.ts`

- [ ] Update procedures to use context
- [ ] Pass session to domain operations
- [ ] Handle auth errors appropriately

```typescript
export const gadgetbots = {
  create: os
    .input(Schema.standardSchemaV1(NewGadgetBotSchema))
    .handler(async ({ input, context }) => {
      return await Products.GadgetBot.create(input, context.session)
    }),
  // ... other procedures
}
```

### 7.7 UI Components

1. **Login Page**

   **File:** `src/web/routes/login.tsx`

   - [ ] Zitadel OAuth button
   - [ ] Handle redirect params
   - [ ] Show loading state

2. **User Menu**

   **File:** `src/web/components/UserMenu.tsx`

   - [ ] Display user name/avatar
   - [ ] Dropdown menu with profile, settings
   - [ ] Sign out button
   - [ ] Use Shadcn dropdown component

3. **Protected Route Wrapper**

   **File:** `src/web/components/ProtectedRoute.tsx`

   - [ ] Reusable component for protected content
   - [ ] Show loading spinner while checking auth
   - [ ] Redirect if not authenticated

### 7.8 Environment Variables

**File:** `.env`

Add new variables:

```bash
# Zitadel Configuration
ZITADEL_ISSUER_URL=http://localhost:8080
ZITADEL_CLIENT_ID=your-client-id
ZITADEL_CLIENT_SECRET=your-client-secret

# Better Auth
BETTER_AUTH_SECRET=generate-random-secret
BETTER_AUTH_URL=http://localhost:3000
```

**File:** `src/env.ts`

- [ ] Add Zitadel config schema
- [ ] Add Better Auth config schema
- [ ] Validate on startup

### 7.9 Testing Strategy

1. **Local Development Testing**

   - [ ] Start both databases: `npm run docker:up && npm run zitadel:up`
   - [ ] Seed test users in Zitadel
   - [ ] Test login flow
   - [ ] Test role-based access
   - [ ] Test session persistence

2. **Unit Tests**

   - [ ] Test auth context provider
   - [ ] Test route protection logic
   - [ ] Mock session for component tests

3. **Integration Tests**

   - [ ] Test OAuth flow (may need to mock Zitadel)
   - [ ] Test session creation and validation
   - [ ] Test protected route redirects

### 7.10 Production Deployment Considerations

**Zitadel Production Setup:**

- [ ] Review [Zitadel Production Guide](https://zitadel.com/docs/self-hosting/deploy/production)
- [ ] Configure HTTPS/TLS certificates
- [ ] Set up proper SMTP for emails
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Database backups for Zitadel PostgreSQL

**Better Auth Production:**

- [ ] Use secure session secrets
- [ ] Configure CORS properly
- [ ] Enable CSRF protection
- [ ] Set `sameSite: 'lax'` and `httpOnly: true` for cookies
- [ ] Configure rate limiting for auth endpoints

**Security Checklist:**

- [ ] All auth cookies are HTTP-only
- [ ] CSRF protection enabled
- [ ] Rate limiting on login endpoints
- [ ] Secure password requirements (if using email/password)
- [ ] Session timeout configured
- [ ] Refresh token rotation enabled

### 7.11 Migration Plan

**Phase 1: Setup (Week 1)**
- Set up Zitadel locally
- Configure Better Auth integration
- Create auth database schema

**Phase 2: Core Integration (Week 1-2)**
- Implement login/logout flow
- Add session management
- Create protected route pattern

**Phase 3: Domain Authorization (Week 2)**
- Update domain operations with auth checks
- Integrate with oRPC context
- Test all CRUD operations with auth

**Phase 4: UI & UX (Week 2-3)**
- Build login page
- Add user menu
- Update admin routes with protection
- Add role-based UI elements

**Phase 5: Testing & Documentation (Week 3)**
- Write auth tests
- Document setup process
- Create production deployment guide

### Deliverables

**New Files:**

- [ ] `docker-compose.zitadel.yml` - Zitadel container config
- [ ] `src/auth/server.ts` - Better Auth server config
- [ ] `src/auth/client.ts` - Better Auth client (isomorphic)
- [ ] `src/auth/provider.tsx` - Auth context provider
- [ ] `src/db/schema/auth.ts` - Auth tables (users, sessions, accounts)
- [ ] `src/web/routes/api.auth.$.ts` - Auth API handler
- [ ] `src/web/routes/login.tsx` - Login page
- [ ] `src/web/routes/admin.tsx` - Admin layout with protection
- [ ] `src/web/components/UserMenu.tsx` - User dropdown menu
- [ ] `src/web/components/ProtectedRoute.tsx` - Route protection wrapper
- [ ] `src/orpc/router/context.ts` - oRPC context builder
- [ ] `src/lib/errors.ts` - Add UnauthorizedError class
- [ ] `docs/AUTH_SETUP.md` - Authentication setup guide

**Updated Files:**

- [ ] `src/env.ts` - Add Zitadel and Better Auth config
- [ ] `src/domains/products.ts` - Real authorization checks
- [ ] `src/orpc/router/products.ts` - Use context for auth
- [ ] `src/web/routes/__root.tsx` - Add AuthProvider
- [ ] `package.json` - Add auth scripts and dependencies
- [ ] `CLAUDE.md` - Document auth architecture

**Database Migrations:**

- [ ] Auth schema migration (users, sessions, accounts tables)

---

## Future Enhancements

1. **Advanced Auth Features**
   - Multi-factor authentication (MFA)
   - Passkey support
   - Social login providers (Google, GitHub)
   - Multi-tenancy (organizations)

2. **Additional Features**
   - Image upload
   - Search/filtering
   - Bulk operations
   - Status workflow management

3. **Customer Features**
   - Browse catalog
   - Rental bookings
   - Payments
