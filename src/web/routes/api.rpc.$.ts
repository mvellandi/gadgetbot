import '@/polyfill'

import { RPCHandler } from '@orpc/server/fetch'
import { createFileRoute } from '@tanstack/react-router'
import router from '@/orpc/router'
import { createContext } from '@/orpc/context'

const handler = new RPCHandler(router)

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
