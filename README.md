# <div align="center">🔐 ZeroTrustLab</div>

<div align="center">

# **[🚀 LIVE DEMO →](https://zerotrust-lab.onrender.com)**

### Interactive Zero Trust Security Visualization Platform

*An immersive web application that brings enterprise-level security concepts to life through real-time network visualization and policy simulation*

</div>

---

## About This Project

ZeroTrustLab is a full-stack web application I built to demonstrate and educate about Zero Trust security architecture—a critical concept in modern cybersecurity. The platform allows users to simulate network access requests and visualize how security policies evaluate connections in real-time based on multiple trust factors.

This project showcases my ability to translate complex security principles into an intuitive, interactive user experience while implementing robust backend logic and clean, maintainable code architecture.

### What It Does

The application simulates an enterprise security environment where every access request is evaluated against configurable policies. Users can:
- Simulate access requests between users and devices
- Watch real-time trust score calculations based on MFA status, device verification, location, and roles
- Interact with multi-factor authentication challenges
- Toggle security policies and instantly see their impact
- Review a complete audit trail of all access decisions

### Why I Built This

I wanted to create a practical demonstration of Zero Trust principles that goes beyond theory. This project combines my interests in cybersecurity, full-stack development, and creating educational tools. It represents my approach to building production-ready applications with clean architecture, type safety, and user-centric design.

## Key Features

### Interactive Network Graph
- Real-time visualization with dynamic node positioning and color-coded connections
- Visual feedback showing ALLOW (green), CHALLENGE (yellow), and DENY (red) decisions
- Built with vis-network for smooth, interactive graph rendering

### Trust Score Engine
Intelligent policy evaluation system that scores each connection based on:
- **Multi-Factor Authentication** - User MFA enrollment status
- **Device Verification** - Trusted device validation
- **Geographic Restrictions** - Location-based access control
- **Role-Based Access Control** - Permission-level verification

### MFA Challenge Flow
- Interactive authentication simulation with 6-digit code verification
- Modal-based challenge interface with real-time validation
- Demonstrates step-up authentication in action

### Policy Management Dashboard
- Real-time policy toggling with instant visual feedback
- Watch how different security configurations affect access decisions
- Educational tool for understanding policy impact

### Audit & Analytics
- Comprehensive connection history with detailed trust breakdowns
- Searchable and filterable audit logs
- Complete visibility into security decision-making

## Tech Stack & Architecture

**Frontend**
- React 18 with TypeScript for type-safe component development
- Vite for lightning-fast development and optimized production builds
- Tailwind CSS with custom design system and dark mode support
- Shadcn/ui component library for consistent, accessible UI
- TanStack Query for efficient server state management
- Vis-network for interactive graph visualization

**Backend**
- Node.js + Express RESTful API
- TypeScript with strict type checking
- Drizzle ORM for type-safe database operations
- PostgreSQL for reliable data persistence
- WebSocket support for potential real-time updates

**Development Practices**
- Full-stack TypeScript with shared type definitions
- Component-based architecture with clear separation of concerns
- Clean code principles with dedicated storage and policy engine layers
- Responsive design with mobile-first approach
- Comprehensive error handling and validation

## Technical Highlights

This project demonstrates several advanced development practices:

- **End-to-End Type Safety**: Shared TypeScript schemas between frontend and backend eliminate runtime type errors
- **Modern React Patterns**: Custom hooks, context providers, and optimistic UI updates
- **Interactive Data Visualization**: Real-time graph rendering with dynamic styling based on business logic
- **Professional UI/UX**: Cybersecurity-themed dashboard with attention to accessibility and user flow
- **Scalable Architecture**: Clean separation of presentation, business logic, and data access layers
- **Production-Ready**: Environment-based configuration, error boundaries, and deployment optimization
Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL database (free tier available at [Neon](https://neon.tech))

### Setup

```bash
# Clone the repository
git clone https://github.com/iamthecloverly/Zero-Trust-Lab.git
cd Zero-Trust-Lab

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Add your DATABASE_URL to .env

# Initialize database
npm run db:push

# Start development server
npm run dev
```

Visit `http://localhost:5000` to see the application.

### Build for Production

```bash
npm run build
npm run start
```

## Project Structure

```
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Main application pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and helpers
├── server/                 # Express backend API
│   ├── routes.ts           # API endpoint definitions
│   ├── storage.ts          # Database abstraction layer
│   └── policy-engine.ts    # Trust evaluation logic
├── shared/                 # Shared TypeScript schemas
│   └── schema.ts           # Database models & type definitions
└── README.md
```

## What Zero Trust Means

Zero Trust is a modern security framework that operates on the principle "never trust, always verify." Unlike traditional perimeter-based security, Zero Trust:

1. **Continuously verifies** every access request regardless of origin
2. **Implements least privilege** access based on multiple trust signals
3. **Assumes breach** and validates rather than implicitly trusting

This project makes these abstract concepts tangible and interactive.

---

<div align="center">

**Built with** TypeScript • React • Node.js • PostgreSQL

*Demonstrating modern full-stack development and cybersecurity principles*

</div>
MIT License
