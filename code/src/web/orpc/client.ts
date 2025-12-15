import { createRouterClient } from '@orpc/server'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { createIsomorphicFn } from '@tanstack/react-start'

import type { RouterClient } from '@orpc/server'
import type { Context } from '@/orpc/context'

import router from '@/orpc/router'

/**
 * Create oRPC context from request headers (server-side only)
 *
 * Extracts the Better Auth session from request headers/cookies.
 * Must match the context creation logic in api.rpc.$.ts
 */
async function createServerContext(): Promise<Context> {
  try {
    const { getRequestHeaders } = await import('@tanstack/react-start/server')
    const { auth } = await import('@/auth/server')

    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    return {
      session: session?.session || null,
      user: session?.user || null,
    }
  } catch (error) {
    console.error('Failed to extract session in oRPC client:', error)
    return {
      session: null,
      user: null,
    }
  }
}

const getORPCClient = createIsomorphicFn()
  .server(() =>
    createRouterClient(router, {
      context: createServerContext,
    }),
  )
  .client((): RouterClient<typeof router> => {
    const link = new RPCLink({
      url: `${window.location.origin}/api/rpc`,
    })
    return createORPCClient(link)
  })

export const client: RouterClient<typeof router> = getORPCClient()

export const orpc = createTanstackQueryUtils(client)
