# ZeroTrustLab

An interactive web application that simulates and visualizes Zero Trust network security principles. Built to demonstrate modern security concepts through an intuitive, hands-on experience.

## Live Demo

[View the live application](#) *(Add your deployed URL here)*

## Overview

ZeroTrustLab brings the "never trust, always verify" security model to life through real-time visualization and interactive policy controls. Users can simulate network access requests and see exactly how Zero Trust principles evaluate each connection based on multiple security factors.

## Key Features

### Interactive Network Graph
- Real-time visualization of users, devices, and connections
- Color-coded edges showing access decisions (ALLOW, CHALLENGE, DENY)
- Dynamic updates as simulations run

### Trust Score Engine
Every connection is evaluated using configurable security factors:
- **Multi-Factor Authentication** - Is MFA enabled for the user?
- **Device Verification** - Is the device trusted and verified?
- **Geographic Restrictions** - Is access from an allowed location?
- **Role-Based Access Control** - Does the user have required permissions?

### MFA Challenge Simulation
- Interactive multi-factor authentication flow
- Modal dialog with 6-digit code verification
- Real-time feedback on verification success/failure

### Policy Management
- Toggle security policies on/off in real-time
- Immediate visual feedback on how policies affect access decisions
- Demonstrates the impact of security configuration changes

### Connection History
- Complete audit log of all access attempts
- Trust score breakdown for each connection
- MFA verification status tracking

## Tech Stack

### Frontend
- **React** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** with custom design system
- **Shadcn/ui** component library
- **TanStack Query** for server state management
- **vis-network** for graph visualization

### Backend
- **Node.js** with Express
- **TypeScript** throughout
- **Drizzle ORM** for database operations
- **PostgreSQL** database

### Architecture
- RESTful API design
- Component-based frontend architecture
- Clean separation between UI, business logic, and data layers
- Responsive design with dark mode support

## Technical Highlights

- **Type Safety**: Full TypeScript implementation across frontend and backend with shared type definitions
- **Modern React Patterns**: Hooks, context, and query-based state management
- **Interactive Data Visualization**: Real-time network graph rendering with dynamic styling
- **Professional UI/UX**: Cybersecurity-themed dashboard with accessibility considerations
- **Clean Code Architecture**: Separation of concerns with storage interfaces and policy engine abstraction

## Screenshots

*Dashboard showing network graph, trust score breakdown, and policy controls*

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Push database schema
npm run db:push
```

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   └── lib/            # Utilities
├── server/                 # Express backend
│   ├── routes.ts           # API endpoints
│   ├── storage.ts          # Data layer
│   └── policy-engine.ts    # Trust evaluation logic
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Database schema & types
└── README.md
```

## About Zero Trust Security

Zero Trust is a security framework that requires all users, whether inside or outside an organization's network, to be authenticated, authorized, and continuously validated before being granted access to applications and data. This project demonstrates these principles through:

1. **Continuous Verification** - Every access request is evaluated
2. **Least Privilege Access** - Access is granted based on multiple trust factors
3. **Assume Breach Mentality** - No implicit trust based on network location

## Author

*Add your name and contact information here*

## License

MIT License
