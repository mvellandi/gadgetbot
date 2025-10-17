# Authentication Patterns & Best Practices

Quick reference for working with authentication in the GadgetBot application.

## Table of Contents

- [Adding Auth to Domain Operations](#adding-auth-to-domain-operations)
- [Creating Protected oRPC Procedures](#creating-protected-orpc-procedures)
- [Protecting Routes](#protecting-routes)
- [Client-Side Session Access](#client-side-session-access)
- [Error Handling](#error-handling)

---

## Adding Auth to Domain Operations

### Pattern: Require Authentication

```typescript
// src/domains/your-domain.ts
import { UnauthorizedError } from "@/lib/errors"
import type { User } from "@/auth/server"

function requireAuth(user: User | null | undefined): asserts user is User {
  if (!user) {
    throw new UnauthorizedError("Authentication required")
  }
}

export const YourDomain = {
  protectedOperation: async (user: User | null | undefined, ...args) => {
    requireAuth(user)
    // Now user is typed as User (not null)
    return await YourResource.operation(...args)
  }
}
```

### Pattern: Require Admin Role

```typescript
import { UnauthorizedError, ForbiddenError } from "@/lib/errors"
import type { User } from "@/auth/server"

function requireAdmin(user: User | null | undefined): asserts user is User {
  if (!user) {
    throw new UnauthorizedError("Authentication required")
  }
  // TODO: Check Zitadel roles when configured
  // const roles = user.roles || []
  // if (!roles.includes('admin')) {
  //   throw new ForbiddenError('Admin role required')
  // }
}

export const YourDomain = {
  adminOperation: async (user: User | null | undefined, ...args) => {
    requireAdmin(user)
    return await YourResource.operation(...args)
  }
}
```

### Pattern: Public vs Protected Operations

```typescript
export const YourDomain = {
  // Public - no auth required
  list: YourResource.findAll,
  getById: YourResource.findById,

  // Protected - admin only
  create: async (user: User | null | undefined, data) => {
    requireAdmin(user)
    return await YourResource.create(data)
  },

  update: async (user: User | null | undefined, id, data) => {
    requireAdmin(user)
    return await YourResource.update(id, data)
  },

  delete: async (user: User | null | undefined, id) => {
    requireAdmin(user)
    return await YourResource.deleteById(id)
  },
}
```

---

## Creating Protected oRPC Procedures

### Setup: Context-Aware Server

```typescript
// src/orpc/router/your-router.ts
import { os } from "@orpc/server"
import { Schema as S } from "effect"
import type { Context } from "@/orpc/context"

// Create server with Context type
const server = os.$context<Context>()
```

### Pattern: Protected Procedure

```typescript
export const yourProcedures = {
  /**
   * Create operation - requires admin
   */
  create: server
    .input(S.standardSchemaV1(YourSchema))
    .handler(async ({ input, context }) => {
      // Pass context.user to domain - domain will check auth
      return await YourDomain.create(context.user, input)
    }),
}
```

### Pattern: Public Procedure

```typescript
export const yourProcedures = {
  /**
   * List operation - public access
   */
  list: server
    .input(S.standardSchemaV1(S.Struct({})))
    .handler(async () => {
      // No context.user needed for public operations
      return await YourDomain.list()
    }),
}
```

### Pattern: Optional Auth

```typescript
export const yourProcedures = {
  /**
   * Get by ID - different data based on auth
   */
  getById: server
    .input(S.standardSchemaV1(S.Struct({ id: S.String })))
    .handler(async ({ input, context }) => {
      const item = await YourDomain.findById(input.id)

      // Return different fields based on auth
      if (context.user) {
        return item // Full data
      } else {
        return { id: item.id, name: item.name } // Limited data
      }
    }),
}
```

---

## Protecting Routes

### Pattern: Protected Layout Route

```typescript
// src/web/routes/your-section.tsx
import { Outlet, createFileRoute } from "@tanstack/react-router"
import { useSession } from "@/web/auth/client"

export const Route = createFileRoute("/your-section")({
  component: YourSectionLayout,
})

function YourSectionLayout() {
  const { data: session, isPending } = useSession()

  // Show loading state
  if (isPending) {
    return <LoadingSpinner />
  }

  // Redirect if not authenticated
  if (!session?.user) {
    window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
    return null
  }

  return (
    <div>
      <YourHeader user={session.user} />
      <Outlet />
    </div>
  )
}
```

### Pattern: Public Route with Optional Auth

```typescript
// src/web/routes/public-page.tsx
import { createFileRoute } from "@tanstack/react-router"
import { useSession } from "@/web/auth/client"

export const Route = createFileRoute("/public-page")({
  component: PublicPage,
})

function PublicPage() {
  const { data: session } = useSession()

  return (
    <div>
      <h1>Public Content</h1>
      {session?.user ? (
        <p>Welcome back, {session.user.name}!</p>
      ) : (
        <a href="/login">Sign in</a>
      )}
    </div>
  )
}
```

---

## Client-Side Session Access

### Pattern: Check Authentication

```typescript
import { useSession } from "@/web/auth/client"

function YourComponent() {
  const { data: session, isPending } = useSession()

  if (isPending) return <LoadingSpinner />

  if (!session?.user) {
    return <div>Please sign in</div>
  }

  return <div>Hello, {session.user.name}!</div>
}
```

### Pattern: Conditional Rendering

```typescript
import { useSession } from "@/web/auth/client"

function YourComponent() {
  const { data: session } = useSession()

  return (
    <div>
      <h1>Your Content</h1>
      {session?.user && (
        <button onClick={handleAdminAction}>Admin Action</button>
      )}
    </div>
  )
}
```

### Pattern: Sign Out

```typescript
import { signOut } from "@/web/auth/client"

function SignOutButton() {
  const handleSignOut = async () => {
    await signOut()
    window.location.href = "/"
  }

  return <button onClick={handleSignOut}>Sign Out</button>
}
```

---

## Error Handling

### Pattern: Handle Auth Errors in oRPC

```typescript
import { orpc } from "@/web/orpc/client"
import { useNavigate } from "@tanstack/react-router"

function YourComponent() {
  const navigate = useNavigate()
  const createMutation = orpc.gadgetbots.create.useMutation({
    onError: (error) => {
      if (error.message.includes("Authentication required")) {
        navigate({ to: "/login" })
      } else if (error.message.includes("Admin role required")) {
        navigate({ to: "/403" })
      } else {
        alert(`Error: ${error.message}`)
      }
    }
  })

  return <button onClick={() => createMutation.mutate(data)}>Create</button>
}
```

### Pattern: Global Error Boundary

```typescript
// src/web/routes/__root.tsx
import { ErrorComponent } from "@tanstack/react-router"

export const Route = createRootRoute({
  errorComponent: ({ error }) => {
    if (error.message.includes("Authentication required")) {
      window.location.href = "/login"
      return null
    }

    if (error.message.includes("Admin role required")) {
      window.location.href = "/403"
      return null
    }

    return <ErrorComponent error={error} />
  }
})
```

### Pattern: Try-Catch in Server Functions

```typescript
// In server function or API handler
import { UnauthorizedError, ForbiddenError } from "@/lib/errors"

try {
  const result = await YourDomain.protectedOperation(user, data)
  return result
} catch (error) {
  if (error instanceof UnauthorizedError) {
    return new Response("Unauthorized", { status: 401 })
  }
  if (error instanceof ForbiddenError) {
    return new Response("Forbidden", { status: 403 })
  }
  throw error
}
```

---

## Common Gotchas

### ❌ Don't: Skip Domain Auth Checks

```typescript
// BAD - oRPC procedure bypasses domain auth
create: server
  .input(schema)
  .handler(async ({ input, context }) => {
    // Directly calling resource without auth check
    return await YourResource.create(input)
  })
```

```typescript
// GOOD - Domain enforces auth
create: server
  .input(schema)
  .handler(async ({ input, context }) => {
    // Domain checks context.user and throws if unauthorized
    return await YourDomain.create(context.user, input)
  })
```

### ❌ Don't: Forget to Pass User

```typescript
// BAD - Domain method requires user but none provided
const result = await Products.GadgetBot.create(data)
```

```typescript
// GOOD - Pass user from context
const result = await Products.GadgetBot.create(context.user, data)
```

### ❌ Don't: Use Client-Side Auth as Security

```typescript
// BAD - Client-side check only (can be bypassed)
function CreateButton() {
  const { data: session } = useSession()

  if (!session?.user) return null

  return <button onClick={handleCreate}>Create</button>
}
```

```typescript
// GOOD - Client-side check for UX + server-side check for security
function CreateButton() {
  const { data: session } = useSession()

  // Hide button for UX
  if (!session?.user) return null

  // Server will still validate auth in domain operation
  return <button onClick={handleCreate}>Create</button>
}
```

---

## Quick Reference

| Need | Use |
|------|-----|
| Check if authenticated | `useSession()` hook in React |
| Require auth in domain | `requireAuth(user)` assertion |
| Require admin in domain | `requireAdmin(user)` assertion |
| Access user in oRPC | `context.user` parameter |
| Protect route | Create layout with `useSession()` check |
| Sign out user | `signOut()` from client |
| Redirect to login | `/login?redirect=${encodeURIComponent(path)}` |
| Show 401 error | Redirect to `/401` or throw `UnauthorizedError` |
| Show 403 error | Redirect to `/403` or throw `ForbiddenError` |

---

## See Also

- [AUTH_SETUP.md](./AUTH_SETUP.md) - Complete setup guide
- [AUTH_IMPLEMENTATION_STATUS.md](./AUTH_IMPLEMENTATION_STATUS.md) - Implementation tracking
- [PHASE_2_SUMMARY.md](./PHASE_2_SUMMARY.md) - Phase 2 completion summary
