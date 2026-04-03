# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ZeroTrustLab is an interactive full-stack web application demonstrating Zero Trust security architecture. Users simulate network access requests and see how security policies evaluate connections using trust scoring in real-time.

## Commands

```bash
npm run dev          # Start dev server (port 5000, serves both frontend and API)
npm run build        # Build frontend (Vite) + backend (esbuild) for production
npm run start        # Start production server
npm run check        # TypeScript type checking (no separate lint command)
npm run db:push      # Push schema changes to database
npm run db:seed      # Seed database with sample data
```

No test runner is configured — TypeScript (`npm run check`) is the primary correctness tool.

## Architecture

### Directory Layout

- `client/src/` — React 18 + TypeScript frontend (Vite)
- `server/` — Express backend
- `shared/schema.ts` — Single source of truth: Drizzle ORM table definitions + Zod validation types shared by client and server
- `api/index.ts` — Vercel serverless adapter (dual Node.js/Web handler)

### Path Aliases

- `@/*` → `client/src/`
- `@shared/*` → `shared/`

### Request Flow

1. React calls `apiRequest()` from `client/src/lib/queryClient.ts`
2. Express routes in `server/routes.ts` handle the request
3. Routes use `storage` (DB abstraction) and `policyEngine` (business logic)
4. `ZeroTrustPolicyEngine` in `server/policy-engine.ts` computes trust scores
5. TanStack Query updates client state; `SimulationContext` propagates changes to components

### Trust Scoring Logic (`server/policy-engine.ts`)

Score starts at 100, penalties applied per failed policy:
- Device verification failure: −40
- MFA not enabled: −30
- Geographic restriction: −20
- Role mismatch: −10

Verdicts: ≥70 → ALLOW | 40–69 → CHALLENGE_MFA | <40 → DENY

### Storage Layer (`server/storage.ts`)

Dual-mode storage via `StorageInterface`:
- **PostgreSQL** (standard/production): Uses Drizzle ORM
- **In-memory** (development/Vercel): Falls back automatically when `DATABASE_URL` is absent

### Deployment Modes

- **Vercel** (primary): Serverless via `api/index.ts`, static assets from `dist/public`, rewrites configured in `vercel.json`
- **Node.js server**: `dist/index.js` serves both API and static files from a single Express process

### Rate Limiting

Three tiers applied in `server/middleware/rate-limiter.ts`:
- General API: 100 req/min
- Simulations: 30 req/min
- MFA verification: 10 req/min

## Environment Variables

```
DATABASE_URL=   # PostgreSQL connection string (omit to use in-memory storage)
NODE_ENV=       # development | production
PORT=5000       # Default port
```

Copy `.env.example` to `.env` before running locally.
