# GadgetBot

A modern GadgetBot rental service application (inspired by Ratchet & Clank) built with TanStack Start, Effect, Zitadel, and PostgreSQL.

## Tech Stack

- **TanStack Start**: Full-stack React framework with SSR/SSG
- **TanStack Router**: File-based routing
- **TanStack Query**: Server state management
- **oRPC**: Type-safe RPC framework with Effect Schema
- **Effect**: Runtime validation and functional programming
- **PostgreSQL**: Database with Drizzle ORM
- **Better Auth + Zitadel**: OAuth 2.0 authentication
- **Tailwind CSS v4**: Styling with Shadcn components
- **Biome**: Linting and formatting


# Prerequisites

Before running this application, ensure you have:

- **Node.js 18+** installed
- **Docker** installed and running (for PostgreSQL and Zitadel)
- **Git** for version control

# Getting Started

## 1. Install Dependencies

```bash
npm install
```

## 2. Set Up Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gadgetbot
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Zitadel OAuth Configuration
ZITADEL_ISSUER_URL=http://localhost:8080
ZITADEL_CLIENT_ID=your-client-id-here@gadgetbot
# Note: ZITADEL_CLIENT_SECRET not needed when using PKCE

# Better Auth Configuration
BETTER_AUTH_SECRET=changeme-generate-a-random-32-character-secret
BETTER_AUTH_URL=http://localhost:3000

# Optional: Application Settings
VITE_APP_TITLE=GadgetBot
```

Generate a secure `BETTER_AUTH_SECRET`:

```bash
# Using OpenSSL
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 3. Start PostgreSQL Database

Start the PostgreSQL container:

```bash
npm run docker:up
```

Run migrations and seed data:

```bash
npm run db:migrate
npm run db:seed
```

## 4. Set Up Zitadel Authentication

Start the Zitadel container:

```bash
npm run zitadel:up
```

Wait about 30 seconds for Zitadel to initialize, then configure OAuth:

1. Open [http://localhost:8080/ui/console](http://localhost:8080/ui/console)
2. Sign in with: `admin@gadgetbot.localhost` / `Admin123!`
3. Create a new Web application with PKCE authentication
4. Copy the Client ID and add it to your `.env` file

**For detailed authentication setup instructions**, see [docs/AUTH_SETUP.md](./docs/AUTH_SETUP.md)

## 5. Start Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

# Development Commands

## Database Management

```bash
# Start PostgreSQL
npm run docker:up

# Stop PostgreSQL
npm run docker:down

# View PostgreSQL logs
npm run docker:logs

# Generate migrations from schema changes
npm run db:generate

# Apply pending migrations
npm run db:migrate

# Open Drizzle Studio (visual DB manager)
npm run db:studio

# Seed database with sample data
npm run db:seed

# Reset database (drop, migrate, seed)
npm run db:reset
```

## Zitadel (Authentication)

```bash
# Start Zitadel container
npm run zitadel:up

# Stop Zitadel container
npm run zitadel:down

# View Zitadel logs
npm run zitadel:logs

# Reset Zitadel (fresh start with clean data)
npm run zitadel:reset
```

## CLI REPL (Interactive Testing)

Test domain operations directly from a Node REPL:

```bash
npm run repl
```

Example usage:

```javascript
// Import domain
> const Products = await import('./src/domains/products.js')

// List all gadgetbots
> await Products.GadgetBot.findAll()

// Create a new gadgetbot
> await Products.GadgetBot.create({ name: "CleanBot 3000", type: "cleaning", status: "available" })
```

## Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Run all Biome checks
npm run check
```

## Testing

```bash
# Run all tests
npm run test

# Test domain operations
npm run test:domain
```

# Building For Production

```bash
# Build for production
npm run build

# Clear build cache
npm run build:clear

# Preview production build
npm run serve
```


# Project Structure

```
src/
├── domains/              # Domain layer (business logic)
│   └── products/        # Product domain (GadgetBot)
├── orpc/                # Type-safe RPC layer
│   └── router/          # API procedures
├── web/                 # Web client
│   ├── routes/          # File-based routes
│   ├── components/      # React components
│   └── orpc/           # Web-specific oRPC client
├── db/                  # Database layer
│   ├── schema/          # Drizzle table schemas
│   ├── services/        # Database operations
│   └── migrations/      # SQL migrations
├── auth/                # Authentication (Better Auth + Zitadel)
├── cli/                 # CLI tools (REPL, scripts)
└── env.ts              # Environment variables with validation
```

# Key Features

- **Multi-Client Architecture**: Domains are client-agnostic and can be used by web, CLI, and API clients
- **Type-Safe APIs**: oRPC provides end-to-end type safety from database to client
- **Effect Schema**: Runtime validation and functional error handling
- **File-Based Routing**: TanStack Router with automatic route generation
- **Authentication**: OAuth 2.0 with Zitadel and Better Auth
- **Database Migrations**: Ecto-like workflow with Drizzle Kit
- **Interactive Development**: REPL for testing domain operations

# Styling

This project uses [Tailwind CSS v4](https://tailwindcss.com/) with [Shadcn](https://ui.shadcn.com/) components.

## Adding UI Components

```bash
# Add a new Shadcn component
pnpx shadcn@latest add button
pnpx shadcn@latest add card
pnpx shadcn@latest add form
```

# Documentation

For detailed information, see:

- [CLAUDE.md](./CLAUDE.md) - Complete architecture and development guide
- [docs/AUTH_SETUP.md](./docs/AUTH_SETUP.md) - Authentication setup with Zitadel
- [docs/AUTH_PATTERNS.md](./docs/AUTH_PATTERNS.md) - Authentication development patterns
- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) - Domain-driven design workflow

# Troubleshooting

## Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps

# Restart database
npm run docker:down
npm run docker:up
npm run db:migrate
```

## Zitadel Authentication Issues

```bash
# Reset Zitadel with fresh data
npm run zitadel:reset

# Wait 30 seconds for initialization
sleep 30

# Check logs
npm run zitadel:logs
```

## Build Issues

```bash
# Clear build cache
npm run build:clear

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

See [docs/AUTH_SETUP.md](./docs/AUTH_SETUP.md) for detailed troubleshooting steps.

# Resources

- [TanStack Documentation](https://tanstack.com)
- [Effect Documentation](https://effect.website)
- [Zitadel Documentation](https://zitadel.com/docs)
- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Shadcn UI Components](https://ui.shadcn.com)
