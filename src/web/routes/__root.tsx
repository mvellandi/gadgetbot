import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import React, { useEffect, useState } from 'react'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

// Import CSS directly (Vite will handle bundling and injection)
import '../styles.css'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'GadgetBot Rental Service',
      },
      {
        name: 'theme-color',
        content: '#0f172a',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: '/src/web/styles.css',
      },
    ],
  }),

  shellComponent: RootDocument,

  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="mt-4 text-lg text-gray-600">Page not found</p>
        <a href="/" className="mt-6 inline-block text-blue-600 hover:underline">
          Go back home
        </a>
      </div>
    </div>
  ),
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        {import.meta.env.DEV && <DevtoolsLoader />}
        <Scripts />
      </body>
    </html>
  )
}

function DevtoolsLoader() {
  const [components, setComponents] = useState<{
    TanStackDevtools?: any
    TanStackRouterDevtoolsPanel?: any
  } | null>(null)

  useEffect(() => {
    let mounted = true
    if (!import.meta.env.DEV) return

    Promise.all([
      import('@tanstack/react-devtools').catch(() => ({})),
      import('@tanstack/react-router-devtools').catch(() => ({})),
    ]).then(([devtoolsMod, routerMod]) => {
      if (!mounted) return
      setComponents({
        TanStackDevtools: devtoolsMod?.TanStackDevtools ?? devtoolsMod?.default,
        TanStackRouterDevtoolsPanel:
          routerMod?.TanStackRouterDevtoolsPanel ?? routerMod?.default,
      })
    })

    return () => {
      mounted = false
    }
  }, [])

  if (!components) return null

  const { TanStackDevtools, TanStackRouterDevtoolsPanel } = components
  if (!TanStackDevtools) return null

  return (
    <TanStackDevtools
      config={{ position: 'bottom-right' }}
      plugins={[
        {
          name: 'Tanstack Router',
          render: <TanStackRouterDevtoolsPanel />,
        },
        TanStackQueryDevtools,
      ]}
    />
  )
}
