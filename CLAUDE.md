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
```

## Architecture Overview

### Routing System (File-Based)

- Routes live in `src/routes/` and are auto-generated into `src/routeTree.gen.ts`
- Root layout: `src/routes/__root.tsx` contains shell with Header and devtools
- Route files can export server handlers for API endpoints
- Router setup: `src/router.tsx` integrates TanStack Query SSR

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

### Environment Variables

- Managed by T3 Env in `src/env.ts`
- Server vars: Plain names (e.g., `SERVER_URL`)
- Client vars: Must start with `VITE_` prefix (e.g., `VITE_APP_TITLE`)
- Add new vars to schema in `src/env.ts`, then use via `import { env } from '@/env'`
- **Note**: Migrate env.ts to use Effect Schema instead of Zod

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
import { Schema } from '@effect/schema'

const MyInputSchema = Schema.Struct({
  // define fields using Effect Schema
})

export const myProcedure = os
  .input(MyInputSchema)
  .handler(({ input }) => {
    // procedure logic
  })
```

### Isomorphic Code

Use `createIsomorphicFn()` from `@tanstack/react-start` for code that runs differently on server vs client (see `src/orpc/client.ts` for example).

### Route Loading

Routes can define loaders for SSR data fetching. Router context includes `queryClient` for integrating TanStack Query.

### Domain-Driven Design (Ash-Inspired)

**Domain Structure:**
- Domains live in `src/domains/`
- Each domain has a main API file: `src/domains/{domain}.ts`
- Resources within domains: `src/domains/{domain}/{resource}.ts`

**Example - Products Domain:**
```
src/domains/
  products.ts              # Domain API exports
  products/
    gadgetbot.ts          # GadgetBot resource with Effect schemas
```

**Resource Pattern:**
- Define schemas with Effect Schema
- Export main schema, input schemas (Create/Update), and TypeScript types
- Resources are pure data models, business logic goes in services

**Current Domains:**
- **Products**: GadgetBot rental inventory
  - Types: cleaning, gardening, security
  - Core properties: name, type, status, description, capabilities, metadata

## Migration Notes

- **Zod to Effect**: All existing Zod schemas should be migrated to Effect Schema
- Current files using Zod that need migration:
  - `src/env.ts` (environment validation)
  - `src/orpc/router/todos.ts` (example procedures)
  - Any other files importing from 'zod'

## Demo App

A secondary demo application is available at the `/demo` route showcasing TanStack features and patterns. Files and routes prefixed with `demo` are part of this reference application and can be reviewed for implementation examples when building the GadgetBot service.

## Cursor Rules

Use Shadcn components via:
```bash
pnpx shadcn@latest add <component>
```
