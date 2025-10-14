# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

### Routing System (File-Based)

- Routes live in `src/routes/` and are auto-generated into `src/routeTree.gen.ts`
- Root layout: `src/routes/__root.tsx` contains the application shell with devtools
- Route files can export server handlers for API endpoints
- Router setup: `src/router.tsx` integrates TanStack Query SSR
- Demo routes: All demo routes are under `/demo` path with their own layout

### oRPC Integration (Type-Safe RPC)

**Server Side:**
- Procedures defined in `src/orpc/router/` (e.g., `todos.ts`)
- Each procedure uses `os.input(schema).handler(fn)` pattern
- Main router exports all procedures: `src/orpc/router/index.ts`
- RPC endpoint: `src/routes/api.rpc.$.ts` handles all HTTP methods

**Client Side:**
- Client creation: `src/orpc/client.ts` uses isomorphic pattern
- Server: Direct router client with request headers
- Client: Fetch-based RPC link to `/api/rpc`
- TanStack Query integration via `createTanstackQueryUtils(client)`

**Adding New oRPC Procedures:**
1. Create procedure in `src/orpc/router/your-feature.ts` using Effect schemas
2. Export from `src/orpc/router/index.ts`
3. Client automatically gets type-safe access via `client` export

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

### State Management

- **Server State**: TanStack Query via `src/integrations/tanstack-query/`
- **Query Client**: Created in `root-provider.tsx`, integrated with router context
- **oRPC + Query**: Use `orpc` utils from `src/orpc/client.ts` for type-safe queries

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
// Returns: void
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

### Styling

- Tailwind CSS v4 via `@tailwindcss/vite` plugin
- Path aliases: `@/*` maps to `src/*` (configured in tsconfig.json)
- Shadcn components: Install with `pnpx shadcn@latest add <component>`
- Component config: `components.json` defines paths and styling approach

### Code Quality

**Biome Configuration:**
- Tabs for indentation
- Double quotes for strings
- Auto-organize imports
- Ignores `src/routeTree.gen.ts` (auto-generated)
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

### Isomorphic Code

Use `createIsomorphicFn()` from `@tanstack/react-start` for code that runs differently on server vs client (see `src/orpc/client.ts` for example).

### Route Loading

Routes can define loaders for SSR data fetching. Router context includes `queryClient` for integrating TanStack Query.

### Domain-Driven Design (Inspired by Elixir Ash)

**Domain Structure:**
- Domains live in `src/domains/`
- Each domain has a main API file: `src/domains/{domain}.ts`
- Resources within domains: `src/domains/{domain}/{resource}.ts`

**Example - Products Domain:**
```
src/domains/
  products.ts              # Domain API exports (clean async functions)
  products/
    gadgetbot.ts          # GadgetBot resource with Effect schemas
```

**Resource Pattern:**
- Define schemas with Effect Schema
- Export main schema, input schemas (Create/Update), and TypeScript types
- Resources are pure data models, business logic goes in services

**Domain API Design Philosophy:**
- Domain APIs export **clean async functions** with no framework-specific types exposed
- No Effect, Drizzle, or other implementation details in public signatures
- Functions take plain inputs and return Promises of plain objects
- Throw standard Error classes on failure
- Implementation uses Effect internally for composition and error handling

**Example Domain API:**
```typescript
// src/domains/products.ts - Public API
export const GadgetBot = {
  create: async (input: CreateGadgetBotInput): Promise<GadgetBot> => { /* ... */ },
  findAll: async (): Promise<GadgetBot[]> => { /* ... */ },
  findById: async (id: string): Promise<GadgetBot> => { /* ... */ },
  update: async (id: string, input: UpdateGadgetBotInput): Promise<GadgetBot> => { /* ... */ },
  deleteById: async (id: string): Promise<void> => { /* ... */ },
}

// Usage in REPL or application code:
const Products = await import('./src/domains/products.js')
await Products.GadgetBot.create({ name: "CleanBot", type: "cleaning" })
await Products.GadgetBot.findAll()
```

**Current Domains:**
- **Products**: GadgetBot rental inventory
  - Types: cleaning, gardening, security
  - Core properties: name, type, status, description, capabilities, metadata

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

## Demo App

A comprehensive demo application is available at the `/demo` route showcasing TanStack features and patterns. The demo is completely isolated from the main GadgetBot application.

### Demo Structure

All demo code lives in `/src/demo/` and `/src/routes/demo/`:

```
/src/demo/
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

/src/routes/demo/
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

/src/routes/demo.tsx  # Demo layout with Header

```

### Demo Features

The demo showcases:
- **TanStack Start**: Server functions, SSR modes (SPA, Full SSR, Data-only)
- **TanStack Query**: Data fetching, caching, mutations
- **TanStack Form**: Simple and complex forms with validation
- **oRPC**: Type-safe RPC with Effect schemas, separate from main app router
- **MCP (Model Context Protocol)**: Tool registration and resource handling
- **Real-time**: Server-sent events for live updates

### Using Demo Code as Reference

When building GadgetBot features, you can reference demo implementations for:
- Setting up oRPC procedures with Effect Schema
- Implementing SSR strategies
- Creating forms with TanStack Form
- Integrating TanStack Query for data fetching
- Using server functions for server-side logic

The demo has its own isolated oRPC router and client, so it won't interfere with your main application's API.

## Cursor Rules

Use Shadcn components via:
```bash
pnpx shadcn@latest add <component>
```
