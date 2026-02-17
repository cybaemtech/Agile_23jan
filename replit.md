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

## Recent Changes
- Configured for Replit environment (removed external proxy, fixed base path)
- Set up PostgreSQL database
- Fixed missing `canDeleteWorkItem` import in routes
- Fixed duplicate import in edit-item-modal
