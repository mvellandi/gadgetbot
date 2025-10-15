import '@/polyfill'

import { RPCHandler } from '@orpc/server/fetch'
import { createFileRoute } from '@tanstack/react-router'

import router from '@/web/demo/orpc/router'

const handler = new RPCHandler(router)

async function handle({ request }: { request: Request }) {
	const { response } = await handler.handle(request, {
		prefix: '/demo/api/rpc',
		context: {},
	})

	return response ?? new Response('Not Found', { status: 404 })
}

export const Route = createFileRoute('/demo/api/rpc/$')({
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
