#!/usr/bin/env node
import 'dotenv/config'
import { spawn } from 'node:child_process'

// Start the production server with environment variables loaded
const server = spawn('node', ['.output/server/index.mjs'], {
	stdio: 'inherit',
	env: {
		...process.env,
		PORT: process.env.PORT || '3001',
	},
})

server.on('error', (error) => {
	console.error('Failed to start server:', error)
	process.exit(1)
})

server.on('exit', (code) => {
	process.exit(code || 0)
})
