# Project Management System

## Overview
A full-stack agile project management application built with React (Vite) frontend and Express backend, using PostgreSQL via Drizzle ORM.

## Tech Stack
- **Frontend**: React 18, Vite, TailwindCSS, Radix UI, TanStack Query, Wouter (routing)
- **Backend**: Express.js, TypeScript, tsx
- **Database**: PostgreSQL (Neon serverless driver), Drizzle ORM
- **Auth**: Session-based with bcryptjs

## Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── lib/        # API config, query client
│       ├── pages/
│       └── main.tsx
├── server/           # Express backend
│   ├── index.ts      # Server entry point
│   ├── routes.ts     # API routes
│   ├── db.ts         # Database connection
│   ├── storage.ts    # Storage layer
│   ├── DatabaseStorage.ts
│   ├── auth-middleware.ts
│   ├── auth-routes.ts
│   └── vite.ts       # Vite middleware setup
├── shared/
│   └── schema.ts     # Drizzle schema (users, teams, projects, work items)
├── vite.config.ts
├── drizzle.config.ts
├── tsconfig.json
└── package.json
```

## Running
- **Dev**: `npm run dev` (serves both frontend and backend on port 5000)
- **Build**: `npm run build` (Vite build + esbuild server bundle)
- **Production**: `npm run start`
- **DB Push**: `npm run db:push`

## Key Configuration
- Frontend and backend served from the same Express process on port 5000
- API routes are under `/api/`
- Vite is used in middleware mode during development
- Database schema managed via Drizzle with `drizzle-kit push`

## Demo Mode (TEMPORARY)
- **Login bypass**: Middleware in `server/index.ts` auto-injects admin user (admin@company.com / Sarah Johnson) into all API sessions
- **Auth routes**: `/api/auth/user` returns admin user when no session exists (`server/auth-routes.ts`)
- **Frontend**: Auth checks removed from route guards in `client/src/App.tsx`
- **To re-enable auth**: Remove the "TEMPORARY" middleware block in `server/index.ts`, restore auth checks in `App.tsx`, and revert `/api/auth/user` fallback in `auth-routes.ts`

## Seed Data
- Script: `server/seed.ts` - run with `npx tsx server/seed.ts`
- 10 users, 4 teams, 5 projects, 49 work items with varied statuses/priorities/types
- Includes comments, activity logs, and project member assignments

## Recent Changes
- Moved roadmap template persistence from localStorage to PostgreSQL (roadmap_templates table)
- Added API routes for roadmap templates CRUD (/api/roadmap-templates)
- Auto-seeds default templates when database is empty via /api/roadmap-templates/seed
- Added drag-and-drop reordering for streams in roadmap editor (persisted to DB)
- Enhanced Strategic Roadmap with full date precision (day/month/year)
- Fixed project bar alignment and hover tooltip z-index in roadmap view
- Moved Strategic Roadmap to second position in sidebar (below Dashboard)
- Added demo bypass middleware for production deployment without login
- Seeded database with comprehensive sample data (49 work items across 5 projects)
- Fixed base path from '/Agile' to '/' for direct dashboard access
- Added Strategic Swimlane Roadmap feature (`/roadmap` route) with template gallery, Gantt-style editor
- Configured for Replit environment (removed external proxy, fixed base path)
- Set up PostgreSQL database
- Fixed missing `canDeleteWorkItem` import in routes
- Fixed duplicate import in edit-item-modal
