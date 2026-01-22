# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev      # Start Vite dev server with HMR
npm run build    # TypeScript compile + Vite production build
npm run lint     # Run ESLint
npm run preview  # Preview production build locally
```

## Environment Setup

Copy `.env.example` to `.env` and configure:
- `VITE_API_BASE_URL` - Backend API URL (defaults to http://localhost:8000/api)

## Architecture Overview

This is a React 19 + TypeScript SPA for machine learning model management, built with Vite and Tailwind CSS v4.

### Key Directories

- `src/api/` - Axios client with JWT auth interceptors (`client.ts`) and endpoint modules (`endpoints/`)
- `src/context/` - React Context providers for auth (`AuthContext.tsx`) and polling (`PollingContext.tsx`)
- `src/pages/` - Route-level page components organized by feature
- `src/components/` - Reusable components organized by domain (auth, common, layout, dashboard, analysis, aitools, dataset, predictions)
- `src/types/` - TypeScript interfaces for API responses and domain models
- `src/routes/` - React Router configuration and `PrivateRoute` wrapper

### Authentication Flow

- JWT-based with access/refresh tokens stored in localStorage
- `AuthContext` provides login, register, logout, and user state
- `api/client.ts` automatically attaches Bearer token and handles 401 refresh
- `PrivateRoute` wraps protected routes, redirects to `/login` if unauthenticated

### State Management

- React Context for global state (auth, polling)
- Local component state with hooks for feature-specific data
- `PollingContext` manages aggressive polling (1s) during active operations, normal (5s) during idle

### Routes

Public: `/`, `/login`, `/register`
Protected: `/dashboard`, `/datasets`, `/datasets/:id`, `/analysis`, `/analysis/:id`, `/predictions`, `/marketplace`

### UI Patterns

- `components/common/` contains base UI primitives (Button, Input, Card, Modal, Badge, Spinner, Icons)
- `lib/utils.ts` exports `cn()` for Tailwind class merging with clsx + tailwind-merge
- `lib/toast.tsx` wraps react-hot-toast with custom success/error/analysis notification helpers
- Framer Motion used for animations throughout

### API Pattern

All API calls go through the Axios instance in `api/client.ts`. Endpoints are organized in `api/endpoints/`:
- `auth.ts` - login, register, refresh
- `aitools.ts` - AI tool CRUD, analysis, training
- `datasets.ts` - dataset upload, list, details
- `dashboard.ts` - stats
- `predictions.ts` - run predictions on trained models
