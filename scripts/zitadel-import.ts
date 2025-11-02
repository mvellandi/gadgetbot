#!/usr/bin/env tsx
/**
 * Import Zitadel configuration from JSON
 *
 * Usage:
 *   npm run zitadel:import
 *   npm run zitadel:import -- --input=custom-path.json --dry-run
 *
 * Imports:
 * - Projects
 * - Applications
 * - Roles
 * - Authorization settings
 */

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const ZITADEL_API = process.env.ZITADEL_ISSUER_URL || 'http://localhost:8080'
const INPUT_FILE = process.argv.find(arg => arg.startsWith('--input='))?.split('=')[1] ||
  resolve(process.cwd(), 'zitadel-export.json')
const DRY_RUN = process.argv.includes('--dry-run')

interface ZitadelConfig {
  exportedAt: string
  projects: Project[]
  applications: Application[]
  roles: Role[]
  grants: Grant[]
}

interface Project {
  id: string
  name: string
  [key: string]: unknown
}

interface Application {
  id: string
  name: string
  projectId?: string
  details?: {
    resourceOwner?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

interface Role {
  key: string
  displayName: string
  projectId: string
  [key: string]: unknown
}

interface Grant {
  id: string
  projectId: string
  [key: string]: unknown
}

async function getServiceUserToken(): Promise<string> {
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
  method: string = 'POST',
  body?: unknown
): Promise<unknown> {
  const url = `${ZITADEL_API}${endpoint}`

  if (DRY_RUN) {
    console.log(`[DRY RUN] ${method} ${endpoint}`)
    if (body) console.log('[DRY RUN] Body:', JSON.stringify(body, null, 2))
    return { dryRun: true }
  }

  console.log(`📡 ${method} ${endpoint}...`)

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed ${method} ${endpoint}: ${response.status} ${text}`)
  }

  return response.json()
}

async function importZitadelConfig(): Promise<void> {
  console.log('🚀 Starting Zitadel configuration import...')
  if (DRY_RUN) console.log('⚠️  DRY RUN MODE - No changes will be made\n')

  // Load config
  console.log(`📂 Loading configuration from ${INPUT_FILE}...`)
  const configJson = await readFile(INPUT_FILE, 'utf-8')
  const config: ZitadelConfig = JSON.parse(configJson)

  console.log(`✓ Configuration loaded (exported at ${config.exportedAt})`)
  console.log(`  - Projects: ${config.projects.length}`)
  console.log(`  - Applications: ${config.applications.length}`)
  console.log(`  - Roles: ${config.roles.length}`)
  console.log(`  - Grants: ${config.grants.length}`)

  const token = await getServiceUserToken()

  // Map old project IDs to new ones (in case they differ)
  const projectIdMap = new Map<string, string>()

  try {
    // Import projects
    console.log('\n📦 Importing projects...')
    for (const project of config.projects) {
      const { id, ...projectData } = project
      try {
        const result = await makeZitadelRequest(
          '/management/v1/projects',
          token,
          'POST',
          projectData
        ) as { id?: string }

        const newProjectId = result.id || id
        projectIdMap.set(id, newProjectId)
        console.log(`  ✓ Created project: ${project.name} (${newProjectId})`)
      } catch (error) {
        // Skip if project already exists (409) - fetch existing project ID
        if (error instanceof Error && error.message.includes('409')) {
          console.log(`  ⊙ Skipped existing project: ${project.name}`)
          // Fetch the existing project to get its ID
          try {
            const existingProjects = await makeZitadelRequest(
              '/management/v1/projects/_search',
              token,
              'POST',
              { queries: [{ nameQuery: { name: project.name, method: 'TEXT_QUERY_METHOD_EQUALS' } }] }
            ) as { result?: Array<{ id: string }> }

            const existingId = existingProjects.result?.[0]?.id
            if (existingId) {
              projectIdMap.set(id, existingId)
              console.log(`    Found existing project ID: ${existingId}`)
            } else {
              // Fallback to original ID if we can't find it
              projectIdMap.set(id, id)
            }
          } catch (searchError) {
            // If search fails, use original ID
            projectIdMap.set(id, id)
          }
        } else {
          throw error
        }
      }
    }

    // Import roles
    console.log('\n🎭 Importing roles...')
    for (const role of config.roles) {
      const oldProjectId = role.projectId
      const newProjectId = projectIdMap.get(oldProjectId) || oldProjectId

      const { projectId, ...roleData } = role
      await makeZitadelRequest(
        `/management/v1/projects/${newProjectId}/roles`,
        token,
        'POST',
        roleData
      )
      console.log(`  ✓ Created role: ${role.key} in project ${newProjectId}`)
    }

    // Import applications
    console.log('\n🔧 Importing applications...')
    for (const app of config.applications) {
      // Infer project from clientId suffix (e.g., "xxxxx@gadgetbot" or "xxxxx@zitadel")
      let projectName: string | undefined
      const clientId = (app.oidcConfig as any)?.clientId || (app.apiConfig as any)?.clientId
      if (clientId && typeof clientId === 'string') {
        const match = clientId.match(/@(.+)$/)
        if (match) {
          projectName = match[1].toLowerCase()
        }
      }

      // Find the matching project in our map
      let newProjectId: string | undefined
      if (projectName) {
        // Find project by name (case insensitive)
        const matchingProject = config.projects.find(p =>
          p.name.toLowerCase() === projectName
        )
        if (matchingProject) {
          newProjectId = projectIdMap.get(matchingProject.id)
        }
      }

      if (!newProjectId) {
        console.log(`  ⚠ Skipping application ${app.name}: could not determine project (clientId: ${clientId})`)
        continue
      }

      const { id, projectId, details, ...appData } = app
      try {
        await makeZitadelRequest(
          `/management/v1/projects/${newProjectId}/apps/oidc`,
          token,
          'POST',
          appData
        )
        console.log(`  ✓ Created application: ${app.name} in project ${newProjectId}`)
      } catch (error) {
        // Skip if application already exists (409)
        if (error instanceof Error && error.message.includes('409')) {
          console.log(`  ⊙ Skipped existing application: ${app.name}`)
        } else {
          throw error
        }
      }
    }

    // Import grants
    console.log('\n🎟️  Importing grants...')
    for (const grant of config.grants) {
      const oldProjectId = grant.projectId
      const newProjectId = projectIdMap.get(oldProjectId) || oldProjectId

      const { id, projectId, ...grantData } = grant
      await makeZitadelRequest(
        `/management/v1/projects/${newProjectId}/grants`,
        token,
        'POST',
        grantData
      )
      console.log(`  ✓ Created grant in project ${newProjectId}`)
    }

    console.log('\n✅ Import complete!')

    if (!DRY_RUN) {
      console.log('\n⚠️  IMPORTANT: Update your .env file with new credentials:')
      console.log('  - ZITADEL_CLIENT_ID')
      console.log('  - ZITADEL_CLIENT_SECRET (if applicable)')
      console.log('\nGet these from Zitadel Console → Projects → Applications')
    }

  } catch (error) {
    console.error('\n❌ Import failed:', error)
    throw error
  }
}

// Run import
importZitadelConfig().catch(error => {
  console.error(error)
  process.exit(1)
})
