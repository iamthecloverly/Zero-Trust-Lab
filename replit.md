# ZeroTrustLab

## Overview

ZeroTrustLab is an interactive web application that simulates Zero Trust network security principles. The application visualizes network connections between users, devices, and services, applying configurable security policies to determine access decisions (ALLOW, CHALLENGE_MFA, or DENY). Users can toggle policies in real-time and see immediate visual feedback on how trust scores and access decisions change based on factors like MFA status, device verification, geographic location, and role-based permissions.

The application demonstrates core Zero Trust concepts through an intuitive dashboard featuring a network graph visualization, trust score breakdowns, policy controls, and connection history logs.

**Current Status:** ✅ Fully functional MVP with all features implemented and tested. The application includes interactive network visualization, real-time trust scoring, policy controls, connection history, theme toggle, reset functionality, interactive product tour, and MFA challenge simulation with database persistence. All end-to-end tests passing successfully.

**Last Updated:** November 8, 2025

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React with TypeScript using Vite as the build tool
- Single-page application (SPA) with client-side routing via Wouter
- Component-based architecture following React best practices

**UI Component Strategy:**
- Shadcn/ui component library (New York style variant) built on Radix UI primitives
- Tailwind CSS for styling with custom design system extending neutral color palette
- Dark mode support with theme provider using local storage persistence
- Responsive design with mobile-first approach and collapsible sidebar navigation

**State Management:**
- TanStack Query (React Query) for server state management and API data fetching
- Local React state for UI-specific concerns (modals, form inputs, current selections)
- No global state management library (Redux/Zustand) - leveraging React Query's cache as source of truth

**Data Visualization:**
- vis-network library for interactive network graph rendering
- Custom graph nodes represent users (circles) and devices (boxes)
- Edge styling indicates policy verdicts (solid for ALLOW, dashed for CHALLENGE_MFA, dotted for DENY)

**Design Philosophy:**
- Security dashboard aesthetics inspired by professional tools (Splunk, Datadog)
- Material Design principles for data visualization
- Monospace font (JetBrains Mono) for technical data display
- Clear visual hierarchy with consistent spacing system using Tailwind units

### Backend Architecture

**Runtime & Framework:**
- Node.js with Express.js for HTTP server
- TypeScript throughout with ESM module system
- Development server runs with tsx, production builds with esbuild

**API Design:**
- RESTful endpoints under `/api` prefix
- JSON request/response format
- Session-based approach (session middleware configured via connect-pg-simple)
- No authentication currently implemented - focuses on simulation logic

**Core Business Logic:**
- ZeroTrustPolicyEngine class encapsulates trust evaluation algorithms
- Policy engine evaluates connections based on multiple factors:
  - MFA enablement status
  - Device verification state
  - Geographic location restrictions
  - Role-based access control (RBAC)
- Returns trust scores (0-100) with detailed breakdown of point deductions
- Verdict determination based on configurable threshold logic

**Data Flow:**
- Client initiates simulation via POST to `/api/simulate` with userId, deviceId, and action
- Server retrieves relevant entities and active policies from storage
- Policy engine computes trust evaluation
- Results stored as connection record and returned to client
- Client updates network graph and displays trust score breakdown

### Data Storage

**Current Implementation:**
- In-memory storage using Map data structures (MemStorage class)
- Implements IStorage interface for future database adapter swapping
- Sample data initialized on server startup for demonstration purposes

**Database Schema (Drizzle ORM):**
- PostgreSQL schema defined using Drizzle ORM with pg-core
- Four main tables: users, devices, connections, policies
- Zod schemas generated from Drizzle tables for runtime validation
- Migration files managed in `/migrations` directory

**Planned Migration Strategy:**
- Neon serverless PostgreSQL configured in drizzle.config.ts
- Database credentials via DATABASE_URL environment variable
- Storage layer designed for easy swap from in-memory to Postgres implementation

**Data Models:**
- **Users:** id, role, mfaEnabled
- **Devices:** id, type, location, verified
- **Connections:** id, sourceId, targetId, action, verdict, trustScore, timestamp
- **Policies:** id, name, enabled, type (mfa/geo/role/device)

### API Structure

**Core Endpoints:**
- `GET /api/users` - Retrieve all users
- `GET /api/devices` - Retrieve all devices  
- `GET /api/connections` - Retrieve connection history
- `GET /api/policies` - Retrieve all security policies
- `PATCH /api/policies/:id` - Toggle policy enabled status
- `POST /api/simulate` - Execute trust evaluation simulation

**Response Patterns:**
- Success responses return JSON data directly
- Error responses include `{ error: string }` object
- 400 status for validation errors
- 404 status for resource not found
- Network graph endpoint returns nodes/edges structure for visualization

## External Dependencies

**Database:**
- PostgreSQL (via Neon serverless) - configured but currently using in-memory storage
- Drizzle ORM for schema definition and query building
- connect-pg-simple for PostgreSQL session storage

**Frontend Libraries:**
- Radix UI primitives (@radix-ui/* packages) - accessible component primitives
- TanStack Query - server state management
- vis-network & vis-data - network graph visualization
- React Hook Form with Zod resolver - form validation
- date-fns - date formatting utilities
- clsx & class-variance-authority - conditional class name utilities
- cmdk - command palette component

**Development Tools:**
- Vite - frontend build tool and dev server
- TypeScript - type safety across frontend and backend
- Tailwind CSS with PostCSS - utility-first styling
- tsx - TypeScript execution for development
- esbuild - production backend bundling

**Replit-Specific:**
- @replit/vite-plugin-runtime-error-modal - error overlay
- @replit/vite-plugin-cartographer - code navigation
- @replit/vite-plugin-dev-banner - development banner

**Design Assets:**
- Google Fonts: Inter (UI/body) and JetBrains Mono (code/technical data)
- Custom Tailwind configuration extending shadcn/ui design tokens
- Lucide React icons for UI elements (no emoji icons used)

## Recent Changes

**November 8, 2025 - MFA Challenge Feature (Complete):**
- Implemented interactive MFA challenge simulation with modal dialog
- Added database schema fields: `mfaChallenged` (boolean) and `mfaVerified` (boolean)
- Created `MFAChallengeDialog` component with 6-digit code input and error handling
- Added POST `/api/verify-mfa` endpoint accepting connectionId and verification code
- Demo verification code: "123456" for successful verification
- Enhanced `DbStorage` and `MemStorage` with `updateConnectionMFA` method
- Fixed dialog close handling to prevent incorrect "MFA Cancelled" toast on success
- Dialog prevents accidental closure via Escape/outside click during verification
- Proper error feedback when incorrect code is entered (shows alert, clears input, stays open)
- Success flow shows verification toast and updates network graph
- Connection history displays MFA status badges (Verified/Failed/Pending) with color-coded indicators
- Query invalidation ensures connection list updates on both successful and failed verifications
- Database persistence ensures MFA verification status survives page refresh
- All end-to-end tests passing successfully

**November 8, 2025 - Bug Fixes & Test Completion:**
- Fixed `displayGraph` undefined error by adding proper fallback: `graph || networkGraph || { nodes: [], edges: [] }`
- Fixed mutation response parsing by adding `.json()` calls to `apiRequest` responses
- Replaced all emoji icons with lucide-react icons for design guideline compliance
- Added comprehensive `data-testid` attributes throughout all components for testing coverage
- Successfully passed full end-to-end testing validating all core features
- Updated sidebar Quick Stats to dynamically reflect network status, active policies, and connection counts

**November 8, 2025 - Initial Implementation:**
- Complete frontend with network graph visualization using vis-network
- Full backend implementation with Zero Trust policy engine
- Migrated from in-memory to PostgreSQL database using Neon serverless
- Dark mode support with theme toggle
- Professional cybersecurity dashboard design following design_guidelines.md
- Interactive product tour with 9 steps using react-joyride