#!/usr/bin/env tsx
/**
 * Export Zitadel configuration to JSON
 *
 * Usage:
 *   npm run zitadel:export
 *   npm run zitadel:export -- --output=custom-path.json
 *
 * Exports:
 * - Projects
 * - Applications
 * - Roles
 * - Authorization settings
 */

import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const ZITADEL_API = process.env.ZITADEL_ISSUER_URL || 'http://localhost:8080'
const OUTPUT_FILE = process.argv.find(arg => arg.startsWith('--output='))?.split('=')[1] ||
  resolve(process.cwd(), 'zitadel/export.json')

interface ZitadelConfig {
  exportedAt: string
  zitadelVersion?: string
  projects: unknown[]
  applications: unknown[]
  roles: unknown[]
  grants: unknown[]
}

async function getServiceUserToken(): Promise<string> {
  console.log('🔐 Authenticating with Zitadel...')

  // Use PAT (Personal Access Token) or Service Account JWT
  // For now, we'll need to get this manually from Zitadel Console
  // See: https://zitadel.com/docs/guides/integrate/service-users/authenticate-service-users

  const token = process.env.ZITADEL_SERVICE_TOKEN
  if (!token) {
    throw new Error(
      'ZITADEL_SERVICE_TOKEN not set. Create a service user in Zitadel Console:\n' +
      '1. Go to Users → Service Users\n' +
      '2. Create new service user with Organization Owner Manager role\n' +
      '3. Generate Personal Access Token (PAT)\n' +
      '4. Set ZITADEL_SERVICE_TOKEN=<token>'
    )
  }

  return token
}

async function makeZitadelRequest(
  endpoint: string,
  token: string,
  method: 'GET' | 'POST' = 'GET',
  body?: unknown
): Promise<unknown> {
  const url = `${ZITADEL_API}${endpoint}`
  console.log(`📡 Fetching ${endpoint}...`)

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to fetch ${endpoint}: ${response.status} ${text}`)
  }

  return response.json()
}

async function exportZitadelConfig(): Promise<void> {
  console.log('🚀 Starting Zitadel configuration export...\n')

  const token = await getServiceUserToken()

  const config: ZitadelConfig = {
    exportedAt: new Date().toISOString(),
    projects: [],
    applications: [],
    roles: [],
    grants: [],
  }

  try {
    // Export projects
    console.log('\n📦 Exporting projects...')
    const projectsData = await makeZitadelRequest(
      '/management/v1/projects/_search',
      token,
      'POST',
      {
        query: {
          offset: 0,
          limit: 100,
          asc: true,
        },
      }
    )
    config.projects = (projectsData as { result?: unknown[] })?.result || []
    console.log(`✓ Exported ${config.projects.length} projects`)

    // For each project, export applications and roles
    for (const project of config.projects as { id?: string; name?: string }[]) {
      if (!project.id) continue

      console.log(`\n🔧 Exporting details for project: ${project.name}`)

      // Export applications
      const appsData = await makeZitadelRequest(
        `/management/v1/projects/${project.id}/apps/_search`,
        token,
        'POST',
        {
          query: {
            offset: 0,
            limit: 100,
            asc: true,
          },
        }
      )
      const apps = (appsData as { result?: unknown[] })?.result || []

      // Add projectId to each app for easier import
      const appsWithProjectId = apps.map(app => {
        if (typeof app === 'object' && app !== null) {
          return { ...app, projectId: project.id }
        }
        return app
      })

      config.applications.push(...appsWithProjectId)
      console.log(`  ✓ ${apps.length} applications`)

      // Export roles
      const rolesData = await makeZitadelRequest(
        `/management/v1/projects/${project.id}/roles/_search`,
        token,
        'POST',
        {
          query: {
            offset: 0,
            limit: 100,
            asc: true,
          },
        }
      )
      const roles = (rolesData as { result?: unknown[] })?.result || []
      config.roles.push(...roles)
      console.log(`  ✓ ${roles.length} roles`)

      // Export grants
      const grantsData = await makeZitadelRequest(
        `/management/v1/projects/${project.id}/grants/_search`,
        token,
        'POST',
        {
          query: {
            offset: 0,
            limit: 100,
            asc: true,
          },
        }
      )
      const grants = (grantsData as { result?: unknown[] })?.result || []
      config.grants.push(...grants)
      console.log(`  ✓ ${grants.length} grants`)
    }

    // Write to file
    console.log(`\n💾 Writing configuration to ${OUTPUT_FILE}...`)
    await writeFile(OUTPUT_FILE, JSON.stringify(config, null, 2))

    console.log('\n✅ Export complete!')
    console.log(`📄 Configuration saved to: ${OUTPUT_FILE}`)
    console.log('\n📋 Summary:')
    console.log(`  - Projects: ${config.projects.length}`)
    console.log(`  - Applications: ${config.applications.length}`)
    console.log(`  - Roles: ${config.roles.length}`)
    console.log(`  - Grants: ${config.grants.length}`)

  } catch (error) {
    console.error('\n❌ Export failed:', error)
    throw error
  }
}

// Run export
exportZitadelConfig().catch(error => {
  console.error(error)
  process.exit(1)
})
