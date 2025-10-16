# GadgetBot Implementation Plan

## Current Status

### ✅ Completed
- Domain structure (DDD two-layer pattern)
- Resource schemas with Effect Schema
- `Products.GadgetBot.new()` - Returns creation template
- `Products.GadgetBot.create()` - Stub with auth hooks

### 🚧 Next Up
1. Database layer (schema + services)
2. Domain operations (CRUD)
3. oRPC endpoints
4. Admin interface with forms

---

## Phase 1: Database Layer

### 1.1 Drizzle Schema
**File:** `src/db/schema/gadgetbots.ts`

- [ ] Create pgTable for gadgetbots (id, name, type, status, description, batteryLife, maxLoadCapacity, features, imageUrl, timestamps)
- [ ] Export types: `GadgetBotRow`, `NewGadgetBotRow`
- [ ] Export from `src/db/schema/index.ts`
- [ ] Generate migration: `npm run db:generate`
- [ ] Apply migration: `npm run db:migrate`
- [ ] Verify in Drizzle Studio

### 1.2 Database Service Layer
**File:** `src/db/services/gadgetbot.ts`

- [ ] Define tagged errors: `NotFoundError`, `DatabaseError`, `ValidationError`
- [ ] Implement Effect-based operations:
  - `createGadgetBot(input)`
  - `findAllGadgetBots()`
  - `findGadgetBotById(id)`
  - `updateGadgetBot(id, input)`
  - `deleteGadgetBot(id)`
- [ ] Test in REPL

---

## Phase 2: Domain Operations

### 2.1 Resource Operations
**File:** `src/domains/products/gadgetbot.ts`

Update `GadgetBot` resource to call database services:

- [ ] Implement `create()` - validate + call service + runPromise
- [ ] Implement `findAll()`
- [ ] Implement `findById()`
- [ ] Implement `update()`
- [ ] Implement `deleteById()`
- [ ] Convert Effect errors to standard Error classes
- [ ] Test all operations in REPL

### 2.2 Domain API
**File:** `src/domains/products.ts`

- [ ] Add all CRUD operations to `Products.GadgetBot`
- [ ] Wrap write operations with auth placeholders
- [ ] Test via REPL

---

## Phase 3: oRPC Endpoints

**File:** `src/orpc/router/products.ts`

- [ ] Create `gadgetbots` router with procedures:
  - `new` - Get template
  - `list` - List all
  - `getById` - Get by ID
  - `create` - Create new (with Standard Schema validation)
  - `update` - Update existing
  - `deleteById` - Delete
- [ ] Export from `src/orpc/router/index.ts`
- [ ] Test endpoints

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

## Phase 5: Seed Data

**File:** `src/db/seed.ts`

- [ ] Create 3 sample gadgetbots (CleanBot, GardenMaster, SecureGuard)
- [ ] Run: `npm run db:seed`
- [ ] Verify in Drizzle Studio

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

### New Files
- `src/db/schema/gadgetbots.ts`
- `src/db/services/gadgetbot.ts`
- `src/orpc/router/products.ts`
- `src/web/routes/admin/products/index.tsx`
- `src/web/routes/admin/products/gadgetbots/new.tsx`
- `src/web/routes/admin/products/gadgetbots/$id/edit.tsx`
- `src/web/routes/admin/products/gadgetbots/$id/index.tsx`
- `src/db/seed.ts`

### Updated Files
- `src/domains/products/gadgetbot.ts` (implement CRUD)
- `src/domains/products.ts` (add all operations)
- `src/orpc/router/index.ts` (export products router)
- `CLAUDE.md` (update DDD section)

### Migrations
- Initial gadgetbots table migration

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
