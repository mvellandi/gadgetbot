import 'dotenv/config'
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { nitroV2Plugin } from '@tanstack/nitro-v2-vite-plugin'

const config = defineConfig({
  plugins: [
    nitroV2Plugin({
      compatibilityDate: '2025-12-18',
    }),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart({
      router: {
        routesDirectory: 'web/routes',
        generatedRouteTree: 'web/routeTree.gen.ts',
        entry: 'web/router.tsx',
      },
    }),
    viteReact(),
  ],

  // Filter noisy informational Rollup warnings emitted during SSR build
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        const msg = String((warning && (warning as any).message) || '')

        // Ignore mixed static/dynamic import informational warning for auth server
        if (
          msg.includes('but also statically imported') &&
          msg.includes('dynamic import will not move module into another chunk')
        ) {
          return
        }

        // Ignore unused external imports originating from @tanstack/router-core packages
        if (msg.includes('are imported from external module') && msg.includes('@tanstack/router-core')) {
          return
        }

        // Fallback to default handler for everything else
        warn(warning)
      },
    },
  },
})

export default config
