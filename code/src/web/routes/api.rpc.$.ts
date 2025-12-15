import '@/polyfill'

import { RPCHandler } from '@orpc/server/fetch'
import { createFileRoute } from '@tanstack/react-router'
import router from '@/orpc/router'
import type { Context } from '@/orpc/context'
import { auth } from '@/auth/server'

const handler = new RPCHandler(router)

/**
 * Create oRPC context from request headers
 *
 * Extracts the Better Auth session from request headers/cookies.
 * This function is server-only and should not be imported by client code.
 *
 * @param request - The incoming HTTP request
 * @returns Context object with session and user data
 */
async function createContext(request: Request): Promise<Context> {
  try {
    // Extract session from Better Auth
    const session = await auth.api.getSession({ headers: request.headers })

    return {
      session: session?.session || null,
      user: session?.user || null,
    }
  } catch (error) {
    // If session extraction fails, return null session
    console.error('Failed to extract session:', error)
    return {
      session: null,
      user: null,
    }
  }
}

async function handle({ request }: { request: Request }) {
  // Extract session context from request for auth
  const context = await createContext(request)

  const { response } = await handler.handle(request, {
    prefix: '/api/rpc',
    context,
  })

  return response ?? new Response('Not Found', { status: 404 })
}

export const Route = createFileRoute('/api/rpc/$')({
  server: {
    handlers: {
      HEAD: handle,
      GET: handle,
      POST: handle,
      PUT: handle,
      PATCH: handle,
      DELETE: handle,
    },
  },
})
