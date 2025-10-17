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

## Phase 7: Authentication with Zitadel + Better Auth ✅

> **Status:** Complete
>
> **Branch:** `feature/authentication`
>
> **Implementation:** Zitadel OAuth + Better Auth integration with TanStack Start
>
> **Documentation:** See dedicated auth documentation:
> - 📖 [AUTH_SETUP.md](./AUTH_SETUP.md) - Complete setup guide
> - 📖 [AUTH_PATTERNS.md](./AUTH_PATTERNS.md) - Development patterns & best practices
> - 📊 [AUTH_IMPLEMENTATION_STATUS.md](./AUTH_IMPLEMENTATION_STATUS.md) - Implementation tracking

### Implementation Highlights

**✅ Completed Features:**

- Self-hosted Zitadel OAuth/OIDC provider
- Better Auth integration with TanStack Start
- Protected routes with `beforeLoad` guards
- Domain-level authorization checks
- Session management (HTTP-only cookies, PKCE)
- User authentication UI (login, user menu, sign out)
- Client/server code separation (resolved Buffer error)
- Complete CRUD operations with authorization

**🏗️ Architecture:**

```
User → Better Auth Client (React) → Better Auth Server → Zitadel OAuth
     ↓
     oRPC Context → Domain Authorization → Database
```

**📁 Key Files Created:**

- `docker-compose.zitadel.yml` - Zitadel container
- `src/auth/server.ts` - Better Auth config
- `src/auth/types.ts` - Client-safe types
- `src/web/auth/client.ts` - Browser client
- `src/db/schema/auth.ts` - Auth tables
- `src/web/routes/api.auth.$.ts` - Auth API handler
- `src/web/routes/login.tsx` - Login page
- `src/web/routes/admin.tsx` - Protected layout
- `src/web/components/UserMenu.tsx` - User dropdown
- `src/orpc/context.ts` - oRPC context types

**🔗 Next Steps:**

For detailed information, refer to the dedicated auth docs linked above.

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
