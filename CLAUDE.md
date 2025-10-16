# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Table of Contents

- [Quick Start](#quick-start)
- [Project Overview](#project-overview)
- [Development Commands](#development-commands)
- [Architecture Overview](#architecture-overview)
  - [Current Structure](#current-structure)
  - [Routing System](#routing-system-file-based)
  - [oRPC Integration](#orpc-integration-type-safe-rpc)
  - [Effect Integration](#effect-integration)
  - [State Management](#state-management-web-specific)
  - [Database Layer](#database-layer-postgresql--drizzle--effect)
  - [Environment Variables](#environment-variables)
  - [Styling](#styling-web-specific)
  - [Code Quality](#code-quality)
  - [Polyfills](#polyfills)
- [Important Patterns](#important-patterns)
  - [Creating API Endpoints](#creating-api-endpoints)
  - [Effect Error Handling](#effect-error-handling)
  - [Testing Patterns](#testing-patterns)
  - [Domain-Driven Design](#domain-driven-design-inspired-by-elixir-ash)
- [Standard Schema Integration](#standard-schema-integration)
- [Multi-Client Architecture Benefits](#multi-client-architecture-benefits)
- [Troubleshooting](#troubleshooting)
- [Appendix](#appendix)
  - [Demo App](#demo-app)
  - [Cursor Rules](#cursor-rules)

---

## Quick Start

New to this project? Get up and running in 5 minutes:

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL database
npm run docker:up

# 3. Run migrations and seed data
npm run db:migrate
npm run db:seed

# 4. Start development server
npm run dev

# 5. Open browser to http://localhost:3000
```

**Try the REPL** (for testing domain operations):
```bash
npm run repl
> const Products = await import('./src/domains/products.js')
> await Products.GadgetBot.findAll()
```

**Common First Tasks:**
- Add a Shadcn component: `pnpx shadcn@latest add button`
- Create an oRPC procedure: See [Creating API Endpoints](#creating-api-endpoints)
- Test database operations: Use `npm run repl` or `npm run db:studio`

---

## Project Overview

This is a TanStack Start (RC version) web application for a "GadgetBot" rental service (inspired by Ratchet & Clank). The project uses:

- **TanStack Start**: Full-stack React framework with SSR/SSG capabilities
- **TanStack Router**: File-based routing system
- **TanStack Query**: Server state management
- **oRPC**: Type-safe RPC framework with client/server integration
- **Effect**: Schema and services modules for runtime validation and functional programming
- **Tailwind CSS v4**: Styling with Shadcn components
- **Biome**: Linting and formatting

## Development Commands

```bash
# Development
npm run dev              # Start dev server on port 3000

# Build & Deploy
npm run build            # Build for production
npm run serve            # Preview production build

# Code Quality
npm run lint             # Lint with Biome
npm run format           # Format with Biome
npm run check            # Run all Biome checks

# Testing
npm run test             # Run all tests with Vitest

# Database
npm run docker:up        # Start PostgreSQL container
npm run docker:down      # Stop PostgreSQL container
npm run docker:logs      # View PostgreSQL logs
npm run db:generate      # Generate migrations from schema changes
npm run db:migrate       # Apply pending migrations
npm run db:studio        # Open Drizzle Studio (visual DB manager)
npm run db:seed          # Seed database with sample data
npm run db:reset         # Reset database (drop, migrate, seed)

# CLI REPL (for testing domain operations)
npm run repl             # Start Node REPL with pre-loaded modules
```

## Architecture Overview

> **TL;DR**: This project uses a multi-client layered architecture where domains (business logic) and database are client-agnostic, while web/CLI/API clients consume them independently.

### Current Structure

The codebase uses a clean multi-client architecture with separated concerns:

```
src/
├── domains/         # Domain layer (client-agnostic) ✓
│   └── products/
├── orpc/           # API router (client-agnostic) ✓
│   └── router/
├── web/            # Web client (React/TanStack) ✓
│   ├── routes/
│   ├── components/
│   ├── integrations/
│   ├── orpc/client.ts
│   ├── lib/
│   ├── demo/
│   ├── router.tsx
│   └── styles.css
├── env.ts          # Shared config ✓
└── polyfill.ts     # Shared runtime ✓
```

**Key Characteristics:**
- Web code isolated in `src/web/`
- Core infrastructure (domains, orpc router) at root level
- Clean separation enables multiple client types
- CLI can use domains directly without web dependencies

### Routing System (File-Based)

- Routes live in `src/web/routes/`
- Auto-generated into `src/web/routeTree.gen.ts`
- Root layout: `src/web/routes/__root.tsx` contains the application shell with devtools
- Route files can export server handlers for API endpoints
- Router setup: `src/web/router.tsx` integrates TanStack Query SSR
- Demo routes: All demo routes are under `/demo` path with their own layout

**Example Route:**
```typescript
// src/web/routes/products.tsx
export const Route = createFileRoute('/products')({
  loader: async ({ context }) => {
    // Use TanStack Query via context.queryClient
  },
  component: ProductsPage,
})
```

### oRPC Integration (Type-Safe RPC)

> **TL;DR**: oRPC provides type-safe RPC between clients and server. Router is client-agnostic; clients create their own connection method.

**Server Side (Client-Agnostic):**

- **Procedures**: Defined in `src/orpc/router/` (e.g., `products.ts`, `todos.ts`)
- **Pattern**: Each procedure uses `os.input(schema).handler(fn)`
- **Main router**: `src/orpc/router/index.ts` exports all procedures
- **Serves**: Web, CLI, and future JSON API clients
- **HTTP endpoint**: `src/web/routes/api.rpc.$.ts`

**Client Side (Web-Specific):**

- **Client location**: `src/web/orpc/client.ts`
- **Isomorphic pattern**: Server-side uses direct router, client-side uses fetch
- **Server mode**: Direct router client with request headers
- **Client mode**: Fetch-based RPC link to `/api/rpc`
- **TanStack Query**: Integrated via `createTanstackQueryUtils(client)`

**Architecture Note:**
The oRPC router stays at `src/orpc/router/` (client-agnostic). Each client creates its own connection:
- **Web**: Isomorphic client in `src/web/orpc/client.ts`
- **CLI**: Can use router directly or create custom client
- **External APIs**: HTTP calls to `/api/rpc` endpoint

**Adding New oRPC Procedures:**

1. Create procedure in `src/orpc/router/your-feature.ts` using Effect schemas
2. Export from `src/orpc/router/index.ts`
3. Web client automatically gets type-safe access via `client` export

### Effect Integration

**Schema & Validation:**
- Use Effect Schema for all runtime type validation
- Import from main package: `import { Schema } from "effect"`
- Effect provides runtime validation, parsing, and type inference

**Effect Schema Patterns:**
```typescript
// Basic types
Schema.String, Schema.Number, Schema.Boolean

// Structs (objects)
Schema.Struct({ name: Schema.String, age: Schema.Number })

// Literals and unions
Schema.Literal("option1", "option2", "option3")

// Arrays
Schema.Array(Schema.String)

// Optional fields
Schema.optional(Schema.String)

// Validations with pipe
Schema.Number.pipe(Schema.greaterThan(0), Schema.int())

// Annotations
Schema.Number.pipe(
  Schema.greaterThan(0),
  Schema.annotations({ description: "Positive number" })
)

// Type inference
const MySchema = Schema.Struct({ name: Schema.String })
type MyType = typeof MySchema.Type

// Standard Schema V1 (for oRPC, TanStack Form, etc.)
// Wrap Effect schemas for libraries that expect Standard Schema
const StandardMySchema = Schema.standardSchemaV1(MySchema)
```

**Services:**
- Use Effect services for dependency injection and business logic
- Services provide structured error handling and composability

**Effect Documentation MCP:**
- MCP server configured: `effect-docs` (via `npx -y effect-mcp@latest`)
- Tools available:
  - `effect_docs_search` - Search Effect documentation
  - `get_effect_doc` - Get full documentation by ID

### State Management (Web-Specific)

> **Note**: This section applies to the web client only. CLI and other clients manage state differently.

- **Server State**: TanStack Query via `src/web/integrations/tanstack-query/`
- **Query Client**: Created in `root-provider.tsx`, integrated with router context
- **oRPC + Query**: Use `orpc` utils from `src/web/orpc/client.ts` for type-safe queries
- **Client State**: React hooks (useState, useReducer)
- **Form State**: TanStack Form with Effect Schema validation

**Example:**
```typescript
// Type-safe query with oRPC
import { orpc } from '@/web/orpc/client'

function ProductsList() {
  const { data, isLoading } = orpc.products.list.useQuery()
  // data is fully typed
}
```

### Database Layer (PostgreSQL + Drizzle + Effect)

**Stack:**
- **PostgreSQL**: Primary database (local via Docker, production on Hetzner)
- **Drizzle ORM**: TypeScript-first ORM with excellent type inference
- **Drizzle Kit**: Migration toolkit (similar to Elixir's Ecto migrations)
- **Effect**: Used internally for composition, error handling, and transactions

**Architecture Layers:**

```
Domain API (src/domains/products.ts)
  ↓ Clean async functions, no Effect/Drizzle types exposed
Database Services (src/db/services/gadgetbot.ts)
  ↓ Effect-based implementations with Effect.runPromise
Drizzle Schemas (src/db/schema/gadgetbots.ts)
  ↓ Table definitions and relations
PostgreSQL Database
```

**Directory Structure:**

```
src/db/
  client.ts              # Database connection with pooling
  schema/
    gadgetbots.ts        # Drizzle table schema
    index.ts             # Export all schemas
  services/
    gadgetbot.ts         # CRUD operations (Effect-based internally)
  migrations/            # Auto-generated by drizzle-kit
    0000_initial.sql
    0001_add_field.sql
  seed.ts               # Seed data script

src/cli/
  repl.ts               # Node REPL for testing domain operations
  interactive.ts        # Interactive CLI menu
  test.ts              # Quick test script (watch mode)
  reset-db.ts          # Database reset utility
```

**Migration Workflow (Ecto-like):**

```bash
# 1. Modify schema in src/db/schema/gadgetbots.ts
# 2. Generate migration from schema diff
npm run db:generate

# 3. Review generated SQL in src/db/migrations/
# 4. Apply migration
npm run db:migrate

# 5. Use Drizzle Studio to inspect database
npm run db:studio
```

**REPL Development Workflow:**

The REPL allows testing database operations without writing implementation code (similar to Elixir's `iex -S mix`):

```bash
npm run repl
```

```typescript
// In REPL - import and use domain API
> const Products = await import('./src/domains/products.js')

// Create a gadgetbot
> await Products.GadgetBot.create({
    name: "CleanBot 3000",
    type: "cleaning",
    status: "available"
  })
// Returns: { id: "uuid", name: "CleanBot 3000", ... }

// List all gadgetbots
> await Products.GadgetBot.findAll()
// Returns: [{ id: "uuid", ... }, ...]

// Find by ID
> await Products.GadgetBot.findById("uuid")
// Returns: { id: "uuid", ... }

// Update
> await Products.GadgetBot.update("uuid", { name: "SuperCleanBot" })
// Returns: { id: "uuid", name: "SuperCleanBot", ... }

// Delete
> await Products.GadgetBot.deleteById("uuid")
// Returns: { id: "uuid", name: "CleanBot 3000", ... } (deleted item for confirmation)
```

**Database Configuration:**

Environment variables are validated in `src/env.ts`:

```typescript
DATABASE_URL          # PostgreSQL connection string
DATABASE_POOL_MIN     # Minimum pool connections (default: 2)
DATABASE_POOL_MAX     # Maximum pool connections (default: 10)
```

**Local Development:**

Use Docker Compose for local PostgreSQL (no PostgreSQL installation needed):

```bash
# Start database
npm run docker:up

# Stop database
npm run docker:down

# View logs
npm run docker:logs
```

**Key Patterns:**

1. **Domain API exports clean async functions** - no Effect/Drizzle types in signatures
2. **Services use Effect internally** - for composition, transactions, error handling
3. **Effect.runPromise** - converts Effect to Promise before returning from domain API
4. **Standard Error classes** - thrown on failure (NotFoundError, ValidationError, etc.)
5. **Drizzle schemas separate from Effect schemas** - Drizzle for DB, Effect for validation

### Environment Variables

- Managed with Effect Schema in `src/env.ts`
- Server vars: Plain names (e.g., `SERVER_URL`, `DATABASE_URL`)
- Client vars: Must start with `VITE_` prefix (e.g., `VITE_APP_TITLE`)
- Add new vars to schema in `src/env.ts`, then use via `import { env } from '@/env'`
- Empty strings are automatically converted to `undefined` for proper optional handling
- Database connection string format: `postgresql://user:password@host:port/database`

### Styling (Web-Specific)

> **Note**: This section applies to the web client only.

- **Tailwind CSS v4**: Via `@tailwindcss/vite` plugin
- **Styles**: `src/web/styles.css`
- **Path aliases**: `@/*` maps to `src/*` (configured in tsconfig.json)
- **Shadcn components**: Install with `pnpx shadcn@latest add <component>`
- **Component config**: `components.json` defines paths and styling approach

**Adding Components:**
```bash
pnpx shadcn@latest add button
pnpx shadcn@latest add card
pnpx shadcn@latest add form
```

### Code Quality

**Biome Configuration:**
- Tabs for indentation
- Double quotes for strings
- Auto-organize imports
- Ignores `src/web/routeTree.gen.ts` (auto-generated)
- Only checks `src/`, `.vscode/`, and config files

### Polyfills

- `src/polyfill.ts` provides Node.js 18 compatibility (File API)
- Import at top of server entry points that use oRPC

## Important Patterns

### Creating API Endpoints

**Option 1: Server Route Handler**
```typescript
// src/routes/api.myendpoint.ts
export const Route = createFileRoute('/api/myendpoint')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // handler logic
      }
    }
  }
})
```

**Option 2: oRPC Procedure with Effect (Preferred)**

```typescript
// src/orpc/router/myfeature.ts
import { os } from '@orpc/server'
import { Schema } from 'effect'

const MyInputSchema = Schema.Struct({
  // define fields using Effect Schema
})

export const myProcedure = os
  .input(Schema.standardSchemaV1(MyInputSchema))
  .handler(({ input }) => {
    // procedure logic
  })
```

**Important:** oRPC expects Standard Schema V1 format, so wrap Effect schemas with `Schema.standardSchemaV1()`

### Effect Error Handling

Effect provides structured error handling for services and domain logic. Follow these patterns:

**Domain API Error Pattern:**
```typescript
// Domain APIs throw standard Error classes
import { NotFoundError, ValidationError } from '@/lib/errors'

export const GadgetBot = {
  findById: async (id: string): Promise<GadgetBot> => {
    return Effect.runPromise(
      pipe(
        getGadgetBot(id),
        Effect.catchTag("NotFound", () =>
          Effect.fail(new NotFoundError(`GadgetBot ${id} not found`))
        ),
        Effect.catchTag("ValidationError", (e) =>
          Effect.fail(new ValidationError(e.message))
        )
      )
    )
  }
}
```

**Service Layer Error Pattern:**
```typescript
// Services use Effect's tagged errors
import { Effect, Data } from 'effect'

class NotFoundError extends Data.TaggedError("NotFound")<{
  id: string
}> {}

class DatabaseError extends Data.TaggedError("Database")<{
  cause: unknown
}> {}

// Service function returns Effect with explicit error types
const getGadgetBot = (id: string): Effect.Effect<GadgetBot, NotFoundError | DatabaseError> => {
  return pipe(
    Effect.tryPromise({
      try: () => db.query.gadgetbots.findFirst({ where: eq(gadgetbots.id, id) }),
      catch: (error) => new DatabaseError({ cause: error }),
    }),
    Effect.flatMap((result) =>
      result
        ? Effect.succeed(result)
        : Effect.fail(new NotFoundError({ id }))
    )
  )
}
```

**Error Recovery:**
```typescript
// Provide fallback values
pipe(
  getGadgetBot(id),
  Effect.catchAll(() => Effect.succeed(null)), // Return null on any error
  Effect.catchTag("NotFound", () => Effect.succeed(defaultGadgetBot)), // Fallback for specific error
)

// Retry on transient errors
pipe(
  getGadgetBot(id),
  Effect.retry(Schedule.exponential("100 millis").pipe(Schedule.jittered))
)
```

**Key Principles:**
1. **Services**: Use Effect's tagged errors for structured error types
2. **Domain APIs**: Convert to standard Error classes before returning Promises
3. **Type Safety**: Effect errors are tracked in the type system
4. **Composition**: Use `catchTag` for specific error handling, `catchAll` for catch-all

### Isomorphic Code

Use `createIsomorphicFn()` from `@tanstack/react-start` for code that runs differently on server vs client (see `src/orpc/client.ts` for example).

### Route Loading

Routes can define loaders for SSR data fetching. Router context includes `queryClient` for integrating TanStack Query.

### Testing Patterns

> **Coming Soon**: Testing patterns for domains, services, and web components.

**Current Testing Setup:**
- **Test Runner**: Vitest
- **Command**: `npm run test`
- **Watch Mode**: `npm run test -- --watch`

**Recommended Patterns:**

**Unit Tests (Domains/Services):**
```typescript
// tests/domains/products.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { GadgetBot } from '@/domains/products'

describe('GadgetBot Domain', () => {
  beforeEach(async () => {
    // Reset test database
    await resetTestDb()
  })

  it('should create a gadgetbot', async () => {
    const bot = await GadgetBot.create({
      name: 'TestBot',
      type: 'cleaning',
      status: 'available'
    })

    expect(bot.id).toBeDefined()
    expect(bot.name).toBe('TestBot')
  })

  it('should throw NotFoundError for missing gadgetbot', async () => {
    await expect(
      GadgetBot.findById('non-existent-id')
    ).rejects.toThrow('not found')
  })
})
```

**Integration Tests (oRPC):**
```typescript
// tests/orpc/products.test.ts
import { describe, it, expect } from 'vitest'
import { router } from '@/orpc/router'

describe('Products oRPC', () => {
  it('should list all products', async () => {
    const result = await router.products.list({})

    expect(result).toBeInstanceOf(Array)
    expect(result[0]).toHaveProperty('id')
  })
})
```

**Component Tests (Web):**
```typescript
// tests/components/ProductCard.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProductCard } from '@/components/ProductCard'

describe('ProductCard', () => {
  it('should display product name', () => {
    render(<ProductCard name="TestBot" type="cleaning" />)
    expect(screen.getByText('TestBot')).toBeInTheDocument()
  })
})
```

### Domain-Driven Design (Inspired by Elixir Ash)

**Two-Layer Architecture:**

1. **Resources Layer** (`src/domains/{domain}/{resource}.ts`)
   - Define Effect schemas for data structures
   - Export resource operations module (e.g., `GadgetBot`)
   - Handle core business logic and data operations
   - No authorization concerns
   - See: [`src/domains/products/gadgetbot.ts`](src/domains/products/gadgetbot.ts)

2. **Domain API Layer** (`src/domains/{domain}.ts`)
   - Export domain module (e.g., `Products`)
   - Control access to resource operations
   - Handle authorization policies (future: Zitadel)
   - Delegate to resource operations after auth checks
   - See: [`src/domains/products.ts`](src/domains/products.ts)

**Directory Structure:**
```
src/domains/
  products.ts              # Domain API with authorization layer
  products/
    gadgetbot.ts          # Resource: schemas + operations
```

**Key Principles:**
- **Clean APIs**: Export async functions with no framework types exposed
- **Standard Errors**: Throw standard Error classes, not Effect/Drizzle types
- **Internal Effect**: Use Effect internally for composition/error handling
- **Auth at Domain**: Authorization in domain layer, not resources
- **Client Access**: oRPC, forms, CLI interact only with domain APIs

**Implementation Reference:**
- See [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) for complete workflow
- Example resource: [`src/domains/products/gadgetbot.ts`](src/domains/products/gadgetbot.ts)
- Example domain API: [`src/domains/products.ts`](src/domains/products.ts)

**Current Domains:**
- **Products**: GadgetBot rental inventory
  - Resources: GadgetBot (cleaning, gardening, security types)
  - Authorization: Admin-only creation (future: Zitadel policies)

## Standard Schema Integration

This project uses **Effect Schema** for all schema validation. Effect Schema implements the [Standard Schema V1 specification](https://standardschema.dev/), which enables interoperability with libraries like oRPC and TanStack Form.

### Using Effect Schema with oRPC

oRPC procedures require Standard Schema V1 format. Wrap your Effect schemas:

```typescript
import { os } from '@orpc/server'
import { Schema } from 'effect'

const InputSchema = Schema.Struct({
  name: Schema.String,
  age: Schema.Number.pipe(Schema.int(), Schema.greaterThan(0))
})

export const myProcedure = os
  .input(Schema.standardSchemaV1(InputSchema))
  .handler(({ input }) => {
    // input is fully typed and validated
    return { success: true }
  })
```

### Using Effect Schema with TanStack Form

TanStack Form natively supports Standard Schema V1:

```typescript
import { Schema } from 'effect'

const formSchema = Schema.standardSchemaV1(
  Schema.Struct({
    email: Schema.String.pipe(Schema.nonEmptyString()),
    password: Schema.String.pipe(
      Schema.minLength(8),
      Schema.annotations({ message: () => "Password must be at least 8 characters" })
    )
  })
)

// Use in TanStack Form validators
const form = useForm({
  validators: {
    onBlur: formSchema
  }
})
```

### Exceptions: Libraries Requiring Zod

Some libraries are tightly coupled to Zod and cannot use Standard Schema:

- **MCP SDK** (`@modelcontextprotocol/sdk`) - Requires Zod types for tool registration
- Keep these files using Zod, typically in demo/example code

---

## Multi-Client Architecture Benefits

Once the web separation is complete, the codebase will support multiple client types naturally:

### Client Types

**Web Client (`src/web/`):**
- React components with TanStack Start/Router/Query
- Server-side rendering (SSR) and static site generation (SSG)
- Uses `src/web/orpc/client.ts` with isomorphic fetch
- TanStack Query for state management
- Tailwind CSS styling

**CLI Client (`src/cli/`):**
- Direct access to `src/domains/` APIs
- REPL for interactive testing
- Interactive menus and commands
- No web dependencies (React, TanStack, etc.)
- Can use oRPC router directly or domain APIs

**JSON API Client (Future):**
- External applications consume oRPC endpoints
- Type-safe client generation for TypeScript consumers
- Standard HTTP/JSON for non-TypeScript clients
- Uses same `src/orpc/router/` as web client

### Architectural Layers

```
┌─────────────────────────────────────────────────────────────┐
│                         Clients                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────────┐  │
│  │   Web    │    │   CLI    │    │   External JSON API  │  │
│  │ (React)  │    │ (Node)   │    │   (Any Language)     │  │
│  └─────┬────┘    └─────┬────┘    └──────────┬───────────┘  │
└────────┼───────────────┼────────────────────┼──────────────┘
         │               │                    │
         │               │                    │
┌────────┼───────────────┼────────────────────┼──────────────┐
│        │               │                    │               │
│   ┌────▼──────┐   ┌───▼────────────────────▼──────┐       │
│   │ Web oRPC  │   │    oRPC Router (Shared)        │       │
│   │  Client   │   │   (Type-Safe Procedures)       │       │
│   └───────────┘   └────────────┬───────────────────┘       │
│                                 │                            │
│                    API Layer (src/orpc/)                     │
└─────────────────────────────────┼───────────────────────────┘
                                  │
┌─────────────────────────────────┼───────────────────────────┐
│                                 │                            │
│                    ┌────────────▼────────────┐              │
│                    │   Domain APIs           │              │
│                    │   (Clean Async Funcs)   │              │
│                    └────────────┬────────────┘              │
│                                 │                            │
│                    Core Layer (src/domains/)                 │
└─────────────────────────────────┼───────────────────────────┘
                                  │
┌─────────────────────────────────┼───────────────────────────┐
│                                 │                            │
│                    ┌────────────▼────────────┐              │
│                    │   Database Services     │              │
│                    │   (Effect + Drizzle)    │              │
│                    └────────────┬────────────┘              │
│                                 │                            │
│                    Database Layer (src/db/)                  │
└─────────────────────────────────┼───────────────────────────┘
                                  │
                         ┌────────▼────────┐
                         │   PostgreSQL    │
                         └─────────────────┘
```

### Key Principles

1. **Separation of Concerns**: Web code doesn't leak into core domains
2. **Reusability**: Domain logic shared across all clients
3. **Type Safety**: End-to-end types from database to client
4. **Testability**: Core logic testable without web dependencies
5. **Flexibility**: Add new client types without touching core
6. **Clean APIs**: Domains export plain async functions, no framework types

### Example Usage Patterns

**Web Client:**
```typescript
// src/web/routes/products.tsx
import { orpc } from '@/web/orpc/client'
import { useQuery } from '@tanstack/react-query'

export function ProductsPage() {
  const { data } = orpc.products.list.useQuery()
  // React component rendering
}
```

**CLI Client:**
```typescript
// src/cli/commands/list-products.ts
import { GadgetBot } from '@/domains/products'

async function listProducts() {
  const products = await GadgetBot.findAll()
  console.table(products)
}
```

**External JSON API Client:**
```bash
# Any HTTP client can call oRPC endpoints
curl -X POST https://api.example.com/api/rpc/products.list \
  -H "Content-Type: application/json" \
  -d '{"input": {}}'
```

---

## Troubleshooting

### Common Issues

**Database Connection Errors**
```bash
# Check if Docker container is running
docker ps

# Restart database
npm run docker:down
npm run docker:up

# Check connection string in .env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gadgetbot
```

**Migration Errors**
```bash
# Reset database completely
npm run db:reset

# Or manually
npm run docker:down
npm run docker:up
npm run db:migrate
npm run db:seed
```

**Build Errors**
```bash
# Clear build cache
rm -rf .vinxi

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npx tsc --noEmit
```

**Import Path Errors**
```typescript
// ✅ Correct - use @ alias
import { env } from '@/env'
import { GadgetBot } from '@/domains/products'

// ❌ Incorrect - relative paths from distant files
import { env } from '../../../env'
```

**Effect Schema Errors with oRPC**
```typescript
// ❌ Wrong - Effect Schema directly
os.input(MySchema)

// ✅ Correct - Wrap with standardSchemaV1
os.input(Schema.standardSchemaV1(MySchema))
```

**REPL Not Loading Modules**
```bash
# Use .js extension for ESM
> const Products = await import('./src/domains/products.js')

# Not .ts
> const Products = await import('./src/domains/products.ts')
```

### Getting Help

- **Documentation**: See [TanStack Docs](https://tanstack.com)
- **Effect Docs**: Use MCP tools `effect_docs_search` or check [Effect website](https://effect.website)
- **GitHub Issues**: File bugs/questions in the project repository
- **Logs**: Check `npm run docker:logs` for database issues

---

## Appendix

### Demo App

> **TL;DR**: A comprehensive demo at `/demo` showcases TanStack features. Completely isolated from main GadgetBot app.

A comprehensive demo application is available at the `/demo` route showcasing TanStack features and patterns. The demo is completely isolated from the main GadgetBot application.

**Demo Structure:**

All demo code lives in `/src/web/demo/` and `/src/web/routes/demo/`:

```
/src/web/demo/
  /components/          # Demo-specific components
    Header.tsx         # Demo navigation with all demo links
    FormComponents.tsx # TanStack Form component examples
  /data/
    punk-songs.ts      # Sample data for SSR demos
  /hooks/
    form-context.ts    # Form context for TanStack Form demos
    form.ts           # Form hook configuration
  /orpc/
    /router/
      todos.ts        # Demo oRPC procedures
      index.ts        # Demo router exports
    client.ts         # Demo oRPC client (separate from main app)
  /utils/
    mcp-handler.ts    # MCP request handling utilities
  mcp-todos.ts        # MCP todos logic and state

/src/web/routes/demo/
  index.tsx           # Demo homepage (TanStack Start landing)
  api.$.ts            # OpenAPI/oRPC playground endpoint
  api.rpc.$.ts        # Demo oRPC endpoint
  mcp.ts              # MCP server endpoint
  orpc-todo.tsx       # oRPC todo list example
  tanstack-query.tsx  # TanStack Query examples
  form.simple.tsx     # Simple form example
  form.address.tsx    # Complex form example
  start.server-funcs.tsx      # Server functions demo
  start.api-request.tsx       # API request demo
  start.ssr.index.tsx         # SSR overview
  start.ssr.spa-mode.tsx      # SPA mode demo
  start.ssr.full-ssr.tsx      # Full SSR demo
  start.ssr.data-only.tsx     # Data-only SSR demo
  api.mcp-todos.ts            # MCP todos API endpoint
  api.names.ts                # Names API example
  mcp-todos.tsx               # MCP todos UI

/src/web/routes/demo.tsx  # Demo layout with Header
```

**Demo Features:**

The demo showcases:
- **TanStack Start**: Server functions, SSR modes (SPA, Full SSR, Data-only)
- **TanStack Query**: Data fetching, caching, mutations
- **TanStack Form**: Simple and complex forms with validation
- **oRPC**: Type-safe RPC with Effect schemas, separate from main app router
- **MCP (Model Context Protocol)**: Tool registration and resource handling
- **Real-time**: Server-sent events for live updates

**Using Demo Code as Reference:**

When building GadgetBot features, you can reference demo implementations for:
- Setting up oRPC procedures with Effect Schema
- Implementing SSR strategies
- Creating forms with TanStack Form
- Integrating TanStack Query for data fetching
- Using server functions for server-side logic

The demo has its own isolated oRPC router and client, so it won't interfere with your main application's API.

### Cursor Rules

Use Shadcn components via:
```bash
pnpx shadcn@latest add <component>
```
