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
5. Admin interface with forms

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

## Phase 4: Admin Interface

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

### 4.1 Products Landing Page
**File:** `src/web/routes/admin/products/index.tsx`

- [ ] Install Shadcn: `table`, `badge`, `button`
- [ ] Create table view with `orpc.products.gadgetbots.list.useQuery()`
- [ ] Show: name, type, status, battery life
- [ ] Add "Add New" button → `/admin/products/gadgetbots/new`
- [ ] Add View/Edit actions per row

### 4.2 Create Form
**File:** `src/web/routes/admin/products/gadgetbots/new.tsx`

- [ ] Install Shadcn: `form`, `input`, `label`, `select`, `textarea`
- [ ] Use TanStack Form with `Products.GadgetBot.new()` as defaults
- [ ] Validate with Effect Schema (Standard Schema V1)
- [ ] Auto-populate description/features on type selection (use `TYPE_DEFAULTS`)
- [ ] Submit via `orpc.products.gadgetbots.create.useMutation()`
- [ ] Handle errors and loading states
- [ ] Navigate to list on success

### 4.3 Edit Form
**File:** `src/web/routes/admin/products/gadgetbots/$id/edit.tsx`

- [ ] Load data with `orpc.products.gadgetbots.getById`
- [ ] Reuse form layout from create
- [ ] Use `update` mutation
- [ ] Handle not found errors

### 4.4 Detail View
**File:** `src/web/routes/admin/products/gadgetbots/$id/index.tsx`

- [ ] Read-only display of gadgetbot
- [ ] Add Edit and Delete buttons
- [ ] Confirm before delete

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
- [ ] `src/web/routes/admin/products/index.tsx` - Products list
- [ ] `src/web/routes/admin/products/gadgetbots/new.tsx` - Create form
- [ ] `src/web/routes/admin/products/gadgetbots/$id/edit.tsx` - Edit form
- [ ] `src/web/routes/admin/products/gadgetbots/$id/index.tsx` - Detail view

### Updated Files (Completed)

- [x] `src/domains/products/gadgetbot.ts` - Refactored with Schemas and Types namespaces
- [x] `src/env.ts` - Added DATABASE_URL validation and Node.js support
- [x] `package.json` - Added database scripts and test:domain script
- [x] `src/domains/products.ts` - Added authorization wrapper and exposed Schemas/Types
- [x] `src/orpc/router/index.ts` - Export gadgetbots procedures
- [ ] `CLAUDE.md` - Document database layer

### Migrations (Completed)

- [x] Initial gadgetbots table migration (`0000_loud_morg.sql`)

---

## Future Enhancements

1. **Zitadel Authentication**
   - Auth policies in `Products` domain
   - Protected admin routes

2. **Additional Features**
   - Image upload
   - Search/filtering
   - Bulk operations
   - Status workflow management

3. **Customer Features**
   - Browse catalog
   - Rental bookings
   - Payments
